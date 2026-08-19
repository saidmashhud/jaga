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
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"strconv"
	"syscall"
	"time"

	_ "github.com/lib/pq"

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
func tenantOf(r *http.Request) string {
	if t := r.Header.Get("X-Tenant-Id"); t != "" {
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
	mux := http.NewServeMux()

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

	mux.HandleFunc("GET /v1/projects", func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Projects(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"projects": list})
	})

	mux.HandleFunc("GET /v1/connections", func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Connections(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"connections": list})
	})

	mux.HandleFunc("GET /v1/focus", func(w http.ResponseWriter, r *http.Request) {
		list, err := s.FocusItems(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"focus": list})
	})

	mux.HandleFunc("POST /v1/focus/{id}/done", func(w http.ResponseWriter, r *http.Request) {
		var body struct {
			Done bool `json:"done"`
		}
		_ = json.NewDecoder(r.Body).Decode(&body)
		err := s.SetFocusDone(r.Context(), tenantOf(r), r.PathValue("id"), body.Done)
		switch {
		case errors.Is(err, store.ErrNotFound):
			writeErr(w, http.StatusNotFound, "задача не найдена")
		case err != nil:
			writeErr(w, http.StatusInternalServerError, err.Error())
		default:
			writeJSON(w, http.StatusOK, map[string]bool{"completed": body.Done})
		}
	})

	// Окно задаётся часами в обе стороны: сцена показывает прошлое и будущее,
	// и «последние N» для неё бессмысленны. По умолчанию — неделя назад и
	// неделя вперёд, ровно то, что показывает дорожка.
	mux.HandleFunc("GET /v1/events", func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Events(r.Context(), tenantOf(r),
			intParam(r, "backHours", 24*7), intParam(r, "aheadHours", 24*7))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"events": list})
	})

	mux.HandleFunc("GET /v1/lenses", func(w http.ResponseWriter, r *http.Request) {
		list, err := s.Lenses(r.Context(), tenantOf(r))
		if err != nil {
			writeErr(w, http.StatusInternalServerError, err.Error())
			return
		}
		writeJSON(w, http.StatusOK, map[string]any{"lenses": list})
	})

	mux.HandleFunc("POST /v1/captures", func(w http.ResponseWriter, r *http.Request) {
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
	})

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
