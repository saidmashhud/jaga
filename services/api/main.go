// Служба Cortex.
//
// Отдаёт то же, что до сих пор отдавал мок в браузере, и принимает записи из
// композера. Формы ответов совпадают с контрактом мока до буквы: клиент
// подменяет источник одной строкой ровно пока это так.
package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"sort"
	"strconv"
	"strings"
	"syscall"
	"time"

	_ "github.com/lib/pq"

	"cortex/services/api/layout"
	"cortex/services/api/llm"
	"cortex/services/api/store"
)

func env(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// tenantOf берёт арендатора из заголовка, а не из тела или запроса.
//
// Из тела его брать нельзя никогда: это поле, которым клиент назначает себе
// чужие данные. Значение по умолчанию есть, пока арендатор один, — но точка,
// где оно проставляется, уже одна и уже здесь.
// Тенант приходит из сессии, а не из заголовка.
//
// Заголовку верить нельзя: это поле, которым клиент назначал себе чужое
// пространство одной строкой в запросе. Пока вход был не обязателен, брать
// его было неоткуда; теперь есть откуда, и заголовок больше не смотрим.
//
// Ключ ведёт в своё пространство — это и означает «данные Саида отдельно».
type tenantKey struct{}

func tenantOf(r *http.Request) string {
	if t, ok := r.Context().Value(tenantKey{}).(string); ok && t != "" {
		return t
	}
	return env("CORTEX_TENANT_ID", "demo")
}

func writeJSON(w http.ResponseWriter, code int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(code)
	_ = json.NewEncoder(w).Encode(v)
}

func writeErr(w http.ResponseWriter, code int, msg string) {
	writeJSON(w, code, map[string]string{"error": msg})
}

func intParam(r *http.Request, name string, def int) int {
	if v, err := strconv.Atoi(r.URL.Query().Get(name)); err == nil && v >= 0 {
		return v
	}
	return def
}

func main() {
	dsn := os.Getenv("DATABASE_URL")
	if dsn == "" {
		slog.Error("нет DATABASE_URL")
		os.Exit(1)
	}
	db, err := sql.Open("postgres", dsn)
	if err != nil {
		slog.Error("подключение к базе", "ошибка", err)
		os.Exit(1)
	}
	defer db.Close()

	// Соединений немного и с запасом: служба читает короткими запросами, а
	// PostgreSQL этого кластера делится со всеми продуктами.
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(30 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	if err := db.PingContext(ctx); err != nil {
		cancel()
		slog.Error("база недоступна", "ошибка", err)
		os.Exit(1)
	}
	cancel()

	s := store.New(db)

	// Вход по ключу пространства. Ключ не задан — служба открыта, и она об
	// этом говорит: молчаливо открытая наружу база хуже, чем названная.
	keys := parseKeys(env("CORTEX_KEYS", ""))
	sess := newSessions()
	if len(keys) == 0 {
		slog.Warn("CORTEX_KEYS не задан — служба отвечает без входа")
	} else {
		// Имена в журнал, ключи — нет: журналы читают и пересылают.
		// Имена и пространства в журнал, ключи — нет: журналы читают и пересылают.
		who := make([]string, 0, len(keys))
		for _, a := range keys {
			who = append(who, a.Name+" → "+a.Tenant)
		}
		slog.Info("вход по ключу", "доступ", who)
	}
	guard := func(h http.HandlerFunc) http.HandlerFunc {
		return requireSession(sess, len(keys) > 0, h)
	}

	// Модель настраивается переменными; не настроена — записи просто копятся
	// неразобранными. Это рабочее состояние: composer обязан работать и без
	// модели, а ключ в браузере не живёт, поэтому ходит в неё служба.
	brain := llm.New(env("LLM_URL", ""), env("LLM_KEY", ""), env("LLM_MODEL", "local"))
	if brain == nil {
		slog.Warn("модель не настроена — записи останутся неразобранными")
	}

	// Разбор идёт фоном, а не в запросе на сохранение: модель отвечает
	// десятками секунд, и человек не должен ждать её, чтобы записать мысль.
	// Одна запись за проход и без спешки — очередь тут короткая по природе,
	// а модель на этой машине одна на всех.
	// Пространства, которые обслуживает фон. Из ключей, а не из одной
	// переменной: с разделением по ключам записи Саида ложились в said, а
	// фоновый разбор ходил только в demo — и его записи не разбирались
	// никогда.
	spaces := map[string]bool{env("CORTEX_TENANT_ID", "demo"): true}
	for _, a := range keys {
		spaces[a.Tenant] = true
	}
	tenants := make([]string, 0, len(spaces))
	for t := range spaces {
		tenants = append(tenants, t)
	}
	sort.Strings(tenants)

	if brain != nil {
		go func() {
			tick := time.NewTicker(15 * time.Second)
			defer tick.Stop()
			for range tick.C {
				for _, t := range tenants {
					parseOnce(context.Background(), s, brain, t)
				}
			}
		}()

		// Бриф собирается раз в день на пространство. Проверка дешёвая,
		// сборка — минуты модельного времени, поэтому сначала проверка.
		go func() {
			tick := time.NewTicker(10 * time.Minute)
			defer tick.Stop()
			for range tick.C {
				for _, t := range tenants {
					buildBriefOnce(context.Background(), s, brain, t)
				}
			}
		}()
	}

	mux := http.NewServeMux()
	mux.HandleFunc("POST /v1/session", handleSignIn(sess, keys))
	// Кто я: страница спрашивает это до отрисовки, чтобы решить, показать
	// вход или сцену.
	// Выход. Его не было вовсе: сессию нельзя было завершить ничем, кроме
	// суток ожидания — а человек за чужим компьютером не может ждать сутки.
	mux.HandleFunc("DELETE /v1/session", func(w http.ResponseWriter, r *http.Request) {
		if c, err := r.Cookie(sessionCookie); err == nil {
			sess.drop(c.Value)
		}
		http.SetCookie(w, &http.Cookie{
			Name: sessionCookie, Value: "", Path: "/", MaxAge: -1,
			HttpOnly: true, Secure: os.Getenv("CORTEX_INSECURE_COOKIE") != "true",
			SameSite: http.SameSiteLaxMode,
		})
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	mux.HandleFunc("GET /v1/session", func(w http.ResponseWriter, r *http.Request) {
		if len(keys) == 0 {
			writeJSON(w, http.StatusOK, map[string]any{"signedIn": true, "keyRequired": false})
			return
		}
		who, space := "", ""
		if c, err := r.Cookie(sessionCookie); err == nil {
			if a, ok := sess.access(c.Value); ok {
				who, space = a.Name, a.Tenant
			}
		}
		writeJSON(w, http.StatusOK, map[string]any{
			"signedIn": who != "", "keyRequired": true, "who": who, "space": space,
		})
	})

	// Проба проверяет базу, а не факт, что процесс жив. Служба без базы не
	// умеет ничего, и отвечать «готов» в этом состоянии — значит пускать на
	// себя трафик, который весь превратится в ошибки.
	mux.HandleFunc("GET /health", func(w http.ResponseWriter, r *http.Request) {
		ctx, cancel := context.WithTimeout(r.Context(), 2*time.Second)
		defer cancel()
		if err := db.PingContext(ctx); err != nil {
			writeErr(w, http.StatusServiceUnavailable, "база недоступна")
			return
		}
		writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
	})

	// Устройство сцены: пояса внимания и размеры логического поля.
	//
	// Отдаёт служба, а не хранит страница. Радиусы поясов — это то же самое,
	// по чему раскладка ставит узлы; своя таблица на странице разошлась бы с
	// этой при первом же новом состоянии, и узел рисовался бы не на своём
	// кольце. Так уже вышло с цветами связей: два словаря, один тип, разные
	// цвета в двух сценах.
	mux.HandleFunc("GET /v1/scene", guard(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{
			"width":          layout.SceneWidth,
			"height":         layout.SceneHeight,
			"center":         map[string]int{"x": layout.CenterX, "y": layout.CenterY},
			"decisionRadius": layout.DecisionRadius,
			"belts":          layout.Belts(),
		})
	}))

	mux.HandleFunc("GET /v1/projects", guard(func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Projects(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"projects": list})
	}))

	mux.HandleFunc("GET /v1/connections", guard(func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Connections(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"connections": list})
	}))

	mux.HandleFunc("GET /v1/focus", guard(func(w http.ResponseWriter, r *http.Request) {
		list, err := s.FocusItems(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"focus": list})
	}))

	mux.HandleFunc("POST /v1/focus/{id}/done", guard(func(w http.ResponseWriter, r *http.Request) {
		// Раньше здесь стояло `_ = json.Decode(...)` — «чтобы не городить
		// ветку». Ветка нужна: при кривом теле body.Done оставался false, и
		// запрос молча СНИМАЛ отметку «сделано», отвечая при этом 200.
		// Человек терял отметку и не узнавал об этом.
		var body struct {
			Done *bool `json:"done"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil || body.Done == nil {
			writeErr(w, http.StatusBadRequest, "нужно поле done: true или false")
			return
		}
		err := s.SetFocusDone(r.Context(), tenantOf(r), r.PathValue("id"), *body.Done)
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeErr(w, http.StatusNotFound, "задача не найдена")
		case err != nil:
			writeErr(w, http.StatusInternalServerError, err.Error())
		default:
			writeJSON(w, http.StatusOK, map[string]bool{"completed": *body.Done})
		}
	}))

	// Окно задаётся часами в обе стороны: сцена показывает прошлое и будущее,
	// и «последние N» для неё бессмысленны. По умолчанию — неделя назад и
	// неделя вперёд, ровно то, что показывает дорожка.
	mux.HandleFunc("GET /v1/events", guard(func(w http.ResponseWriter, r *http.Request) {
		// Неверное окно отвергается, а не подменяется молча: раньше буквы,
		// минус и пусто давали три разных ответа, и ни один не говорил
		// «неверно» — человек получал не то окно и не знал об этом.
		back, err := hoursParam(r, "backHours", 24*7)
		if err != nil {
			writeErr(w, http.StatusBadRequest, "backHours: "+err.Error())
			return
		}
		ahead, err := hoursParam(r, "aheadHours", 24*7)
		if err != nil {
			writeErr(w, http.StatusBadRequest, "aheadHours: "+err.Error())
			return
		}
		list, err := s.Events(r.Context(), tenantOf(r), back, ahead)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"events": list})
	}))

	mux.HandleFunc("POST /v1/projects", guard(func(w http.ResponseWriter, r *http.Request) {
		var p store.NewProject
		if err := json.NewDecoder(r.Body).Decode(&p); err != nil {
			writeErr(w, http.StatusBadRequest, "неразобранное тело запроса")
			return
		}
		id, err := s.CreateProject(r.Context(), tenantOf(r), p)
		if err != nil {
			writeErr(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, map[string]string{"id": id})
	}))

	mux.HandleFunc("POST /v1/connections", guard(func(w http.ResponseWriter, r *http.Request) {
		var c store.NewConnection
		if err := json.NewDecoder(r.Body).Decode(&c); err != nil {
			writeErr(w, http.StatusBadRequest, "неразобранное тело запроса")
			return
		}
		id, err := s.CreateConnection(r.Context(), tenantOf(r), c)
		// Разряд ошибки решает код ответа. Раньше здесь на всех путях стоял
		// 400: и негодный ввод, и упавшая база отвечали «неверный запрос», и
		// человек переделывал верно введённое, пока служба лежала.
		switch {
		case store.IsInput(err):
			writeErr(w, http.StatusBadRequest, err.Error())
		case store.IsConflict(err):
			writeErr(w, http.StatusConflict, err.Error())
		case err != nil:
			writeErr(w, http.StatusInternalServerError, err.Error())
		default:
			writeJSON(w, http.StatusCreated, map[string]string{"id": id})
		}
	}))

	// Убрать связь.
	//
	// Заводить, не имея чем убрать, — половина дела: связь определяет
	// расположение узлов, и ошибочная тихо перекашивает всю сцену.
	mux.HandleFunc("DELETE /v1/connections/{id}", guard(func(w http.ResponseWriter, r *http.Request) {
		err := s.DeleteConnection(r.Context(), tenantOf(r), r.PathValue("id"))
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeErr(w, http.StatusNotFound, "такой связи нет")
		case err != nil:
			writeErr(w, http.StatusInternalServerError, err.Error())
		default:
			w.WriteHeader(http.StatusNoContent)
		}
	}))

	// Виды связи — списком, с русскими именами и пояснениями.
	//
	// Отдаёт служба, а не хранит страница: список тот же самый, по которому
	// проверяется вход, и два списка в разных местах разошлись бы при первом
	// же добавлении вида.
	mux.HandleFunc("GET /v1/connection-kinds", guard(func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, map[string]any{"kinds": store.ConnectionKinds})
	}))

	mux.HandleFunc("GET /v1/lenses", guard(func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Lenses(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"lenses": list})
	}))

	// Записи, которые модель не отнесла ни к одному проекту, ложились в
	// базу и не показывались нигде: маршрута чтения не было вовсе. Я писал,
	// что «неотнесённая запись видна человеку» — она не была видна никому.
	mux.HandleFunc("GET /v1/captures", guard(func(w http.ResponseWriter, r *http.Request) {
		list, err := s.LooseCaptures(r.Context(), tenantOf(r), 50)
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"captures": list})
	}))

	mux.HandleFunc("POST /v1/captures", guard(func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Text string `json:"text"`
		}
		if err := json.NewDecoder(r.Body).Decode(&body); err != nil {
			writeErr(w, http.StatusBadRequest, "неразобранное тело запроса")
			return
		}
		c, err := s.AddCapture(r.Context(), tenantOf(r), body.Text)
		if err != nil {
			writeErr(w, http.StatusBadRequest, err.Error())
			return
		}
		writeJSON(w, http.StatusCreated, c)
	}))

	// Разбор по требованию: фоновый проход идёт раз в пятнадцать секунд, и
	// ждать его при проверке незачем.
	mux.HandleFunc("POST /v1/captures/parse", guard(func(w http.ResponseWriter, r *http.Request) {
		if brain == nil {
			writeErr(w, http.StatusServiceUnavailable, "модель не настроена")
			return
		}
		n := parseOnce(r.Context(), s, brain, tenantOf(r))
		writeJSON(w, http.StatusOK, map[string]int{"parsed": n})
	}))

	// Бриф на сегодня. Нет — 404: интерфейс просто не покажет блок, а не
	// нарисует выдуманный. Прежняя «AI-рекомендация» была захардкожена в
	// моках и советовала чужой проект даже в пустом пространстве.
	mux.HandleFunc("GET /v1/brief", guard(func(w http.ResponseWriter, r *http.Request) {
		b, err := s.TodayBrief(r.Context(), tenantOf(r))
		switch {
		case errors.Is(err, store.ErrNotFound):
			// Не 404: «ещё не собран» — обычное состояние утра, а не отказ.
			// Браузер печатал 404 в консоль красным, и человек видел ошибку
			// там, где ничего не случилось.
			writeJSON(w, http.StatusOK, map[string]any{"brief": nil})
		case err != nil:
			writeErr(w, http.StatusInternalServerError, err.Error())
		default:
			writeJSON(w, http.StatusOK, b)
		}
	}))

	// Пересборка по требованию — для проверки и для «прямо сейчас».
	mux.HandleFunc("POST /v1/brief/build", guard(func(w http.ResponseWriter, r *http.Request) {
		if brain == nil {
			writeErr(w, http.StatusServiceUnavailable, "модель не настроена")
			return
		}
		if ok := buildBrief(r.Context(), s, brain, tenantOf(r)); !ok {
			writeErr(w, http.StatusUnprocessableEntity, "не из чего собирать бриф или модель не ответила")
			return
		}
		b, err := s.TodayBrief(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, b)
	}))

	port := env("PORT", "8050")
	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
	}

	go func() {
		slog.Info("cortex-api слушает", "порт", port)
		if err := srv.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			slog.Error("сервер остановлен", "ошибка", err)
			os.Exit(1)
		}
	}()

	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	shutdown, cancelShutdown := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancelShutdown()
	_ = srv.Shutdown(shutdown)
	slog.Info("остановлено")
}

// parseOnce разбирает одну ждущую запись. Возвращает число разобранных.
//
// По одной за проход намеренно: модель на этой машине одна на все продукты,
// и очередь записей человека не та величина, ради которой стоит её занимать
// пачками.
func parseOnce(ctx context.Context, s *store.Store, brain *llm.Client, tenant string) int {
	pending, err := s.PendingCaptures(ctx, tenant, 1)
	if err != nil || len(pending) == 0 {
		return 0
	}
	c := pending[0]

	refs, err := s.ProjectRefs(ctx, tenant)
	if err != nil {
		return 0
	}
	projects := make([]llm.Project, 0, len(refs))
	for _, r := range refs {
		projects = append(projects, llm.Project{ID: r.ID, Title: r.Title})
	}

	parsed, raw, err := brain.Parse(ctx, c.Text, projects)
	if err != nil {
		// Причина сохраняется рядом с текстом: без неё «не разобралось»
		// нечем объяснить и незачем повторять.
		slog.Warn("разбор не удался", "запись", c.ID, "ошибка", err)
		_ = s.FailParse(ctx, tenant, c.ID, err.Error())
		return 0
	}

	if err := s.ApplyParse(ctx, tenant, c.ID, parsed.ProjectID, parsed.Title,
		parsed.Type, parsed.OffsetHours, raw); err != nil {
		slog.Error("запись разбора", "запись", c.ID, "ошибка", err)
		return 0
	}
	slog.Info("запись разобрана", "запись", c.ID, "проект", parsed.ProjectID, "тип", parsed.Type)
	return 1
}

// hoursParam разбирает окно в часах: пусто — значение по умолчанию, всё
// прочее обязано быть неотрицательным числом не больше года.
func hoursParam(r *http.Request, name string, def int) (int, error) {
	raw := r.URL.Query().Get(name)
	if raw == "" {
		return def, nil
	}
	v, err := strconv.Atoi(raw)
	if err != nil {
		return 0, errors.New("нужно целое число часов")
	}
	if v < 0 {
		return 0, errors.New("часы не бывают отрицательными")
	}
	if v > 24*365 {
		return 0, errors.New("окно больше года не имеет смысла")
	}
	return v, nil
}

// buildBriefOnce собирает бриф, если на сегодня его ещё нет.
func buildBriefOnce(ctx context.Context, s *store.Store, brain *llm.Client, tenant string) {
	has, err := s.HasTodayBrief(ctx, tenant)
	if err != nil || has {
		return
	}
	buildBrief(ctx, s, brain, tenant)
}

// buildBrief: правила собирают факты, модель пишет по ним слова.
func buildBrief(ctx context.Context, s *store.Store, brain *llm.Client, tenant string) bool {
	f, err := s.BriefFacts(ctx, tenant)
	if err != nil {
		slog.Warn("факты для брифа", "пространство", tenant, "ошибка", err)
		return false
	}
	// Пустому пространству бриф не нужен: модель ради него не гоняем, и
	// человек не видит сочинения о нуле дел.
	if f.Empty() {
		return false
	}

	var sb strings.Builder
	ids := []string{}
	reasons := []string{}
	for _, d := range f.Deadlines {
		fmt.Fprintf(&sb, "- срок через %d ч: «%s» (проект %s)\n", d.InHours, d.Title, d.Project)
	}
	if n := len(f.Deadlines); n > 0 {
		reasons = append(reasons, fmt.Sprintf("Сроков в ближайшие 48 часов: %d", n))
	}
	for _, h := range f.Hot {
		state := "ждёт решения"
		if h.Status == "risk" {
			state = "в риске"
		}
		fmt.Fprintf(&sb, "- проект «%s» %s\n", h.Title, state)
		ids = append(ids, h.ID)
	}
	if n := len(f.Hot); n > 0 {
		reasons = append(reasons, fmt.Sprintf("Проектов, требующих вас: %d", n))
	}
	for _, t := range f.HeavyFocus {
		fmt.Fprintf(&sb, "- открыто дело высокого эффекта: «%s»\n", t)
	}
	if n := len(f.HeavyFocus); n > 0 {
		reasons = append(reasons, fmt.Sprintf("Открытых дел высокого эффекта: %d", n))
	}
	fmt.Fprintf(&sb, "- событий за последние сутки: %d\n", f.FreshEvents)

	text, raw, err := brain.Brief(ctx, sb.String())
	if err != nil {
		slog.Warn("бриф не собрался", "пространство", tenant, "ошибка", err)
		return false
	}
	if err := s.SaveBrief(ctx, tenant, store.Brief{
		Title: "Что важно сегодня", Body: text, Reasons: reasons, ProjectIDs: ids,
	}, raw); err != nil {
		slog.Error("сохранение брифа", "пространство", tenant, "ошибка", err)
		return false
	}
	slog.Info("бриф собран", "пространство", tenant)
	return true
}
