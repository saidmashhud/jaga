// Package store — доступ к данным Cortex.
//
// Имена полей в JSON совпадают с контрактом, который до сих пор жил в
// apps/cortex-demo/src/mocks/types.ts. Это не совпадение, а условие: клиент
// подменяет мок на сетевой источник одной строкой только пока формы совпадают
// до буквы, а перевод имён где-то посередине — это место, где они разойдутся.
package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"log/slog"
	"strings"
	"time"

	"cortex/services/api/layout"
)

type Store struct{ db *sql.DB }

func New(db *sql.DB) *Store { return &Store{db: db} }

var ErrNotFound = errors.New("не найдено")

type Position struct {
	X float64 `json:"x"`
	Y float64 `json:"y"`
	Z float64 `json:"z"`
}

type Project struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Subtitle    string   `json:"subtitle"`
	ShortCode   string   `json:"shortCode,omitempty"`
	Icon        string   `json:"icon,omitempty"`
	Status      string   `json:"status"`
	StatusLabel string   `json:"statusLabel"`
	Position    Position `json:"position"`
	// Belt — пояс внимания, 1..6 от ядра наружу. Сцена рисует по нему, а не
	// выводит из статуса сама: два словаря в разных местах разошлись бы при
	// первом же новом состоянии, как уже вышло с цветами связей.
	Belt int `json:"belt"`
	// BeltGuessed — состояние незнакомо, пояс подставлен. Сцена показывает
	// такой узел пунктиром: видимая догадка честнее молчаливой.
	BeltGuessed bool   `json:"beltGuessed,omitempty"`
	Size        string `json:"size"`
	UpdatedAt   string `json:"updatedAt"`
	Summary     string `json:"summary"`
}

func (s *Store) Projects(ctx context.Context, tenant string) ([]Project, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, title, subtitle, short_code, icon, status, status_label,
		       pos_x, pos_y, pos_z, size, updated_at, summary
		FROM projects WHERE tenant_id = $1
		ORDER BY updated_at DESC, id`, tenant)
	if err != nil {
		return nil, fmt.Errorf("выборка проектов: %w", err)
	}
	defer rows.Close()

	out := []Project{}
	for rows.Next() {
		var p Project
		var updated time.Time
		if err := rows.Scan(&p.ID, &p.Title, &p.Subtitle, &p.ShortCode, &p.Icon,
			&p.Status, &p.StatusLabel, &p.Position.X, &p.Position.Y, &p.Position.Z,
			&p.Size, &updated, &p.Summary); err != nil {
			return nil, fmt.Errorf("разбор проекта: %w", err)
		}
		p.UpdatedAt = updated.Format(time.RFC3339)
		out = append(out, p)
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	// Координаты считает раскладка, а не человек. Из данных берётся только
	// статус — по нему выводится пояс внимания; место вдоль пояса выводится
	// из связей. Колонки pos_* остаются как след прежнего способа и будут
	// нужны, когда человек захочет закрепить проект руками.
	conns, err := s.Connections(ctx, tenant)
	if err != nil {
		return nil, err
	}
	nodes := make([]layout.Node, 0, len(out))
	for _, p := range out {
		nodes = append(nodes, layout.Node{ID: p.ID, Status: p.Status})
	}
	edges := make([]layout.Edge, 0, len(conns))
	for _, c := range conns {
		edges = append(edges, layout.Edge{Source: c.SourceID, Target: c.TargetID, Strength: c.Strength})
	}
	// Незнакомый статус — повод сказать, а не тихо поставить в ноль: ось
	// внимания это главное высказывание сцены, и новый статус, попавший в
	// неё случайным значением, врёт молча.
	if unknown := layout.UnknownStatuses(nodes); len(unknown) > 0 {
		slog.Warn("статусы без места на оси внимания", "статусы", unknown)
	}
	placed := layout.Compute(nodes, edges)
	for i := range out {
		if pt, ok := placed[out[i].ID]; ok {
			out[i].Position = Position{X: pt.X, Y: pt.Y, Z: pt.Z}
			out[i].Belt = pt.Belt
			out[i].BeltGuessed = pt.BeltGuessed
		}
	}
	return out, nil
}

type Connection struct {
	ID       string   `json:"id"`
	SourceID string   `json:"sourceId"`
	TargetID string   `json:"targetId"`
	Label    string   `json:"label,omitempty"`
	LabelT   *float64 `json:"labelT,omitempty"`
	Type     string   `json:"type"`
	Strength int      `json:"strength"`
	Animated bool     `json:"animated,omitempty"`
}

func (s *Store) Connections(ctx context.Context, tenant string) ([]Connection, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, source_id, target_id, label, label_t, type, strength, animated
		FROM connections WHERE tenant_id = $1 ORDER BY id`, tenant)
	if err != nil {
		return nil, fmt.Errorf("выборка связей: %w", err)
	}
	defer rows.Close()

	out := []Connection{}
	for rows.Next() {
		var c Connection
		var lt sql.NullFloat64
		if err := rows.Scan(&c.ID, &c.SourceID, &c.TargetID, &c.Label, &lt,
			&c.Type, &c.Strength, &c.Animated); err != nil {
			return nil, fmt.Errorf("разбор связи: %w", err)
		}
		if lt.Valid {
			v := lt.Float64
			c.LabelT = &v
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

type FocusItem struct {
	ID          string   `json:"id"`
	ProjectID   string   `json:"projectId"`
	Title       string   `json:"title"`
	Description string   `json:"description,omitempty"`
	Impact      string   `json:"impact"`
	Completed   bool     `json:"completed"`
	Progress    *float64 `json:"progress,omitempty"`
}

func (s *Store) FocusItems(ctx context.Context, tenant string) ([]FocusItem, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, project_id, title, description, impact, completed, progress
		FROM focus_items WHERE tenant_id = $1
		ORDER BY completed, created_at DESC`, tenant)
	if err != nil {
		return nil, fmt.Errorf("выборка фокуса: %w", err)
	}
	defer rows.Close()

	out := []FocusItem{}
	for rows.Next() {
		var f FocusItem
		var pr sql.NullFloat64
		if err := rows.Scan(&f.ID, &f.ProjectID, &f.Title, &f.Description,
			&f.Impact, &f.Completed, &pr); err != nil {
			return nil, fmt.Errorf("разбор задачи фокуса: %w", err)
		}
		if pr.Valid {
			v := pr.Float64
			f.Progress = &v
		}
		out = append(out, f)
	}
	return out, rows.Err()
}

// SetFocusDone отмечает задачу фокуса выполненной или снимает отметку.
func (s *Store) SetFocusDone(ctx context.Context, tenant, id string, done bool) error {
	res, err := s.db.ExecContext(ctx, `
		UPDATE focus_items SET completed = $3 WHERE tenant_id = $1 AND id = $2`,
		tenant, id, done)
	if err != nil {
		return err
	}
	if n, _ := res.RowsAffected(); n == 0 {
		return ErrNotFound
	}
	return nil
}

// Event — одно событие: и строка ленты «что происходит», и отметка на дорожке.
//
// Процент вдоль дорожки здесь не хранится и не отдаётся: он зависит от того,
// какое окно сейчас выбрано — неделя или месяц, — и считается на клиенте из
// occurredAt. Пока процент лежал в данных, переключатель окна не мог
// пересчитать ничего.
type Event struct {
	ID         string `json:"id"`
	ProjectID  string `json:"projectId"`
	Title      string `json:"title"`
	Type       string `json:"type"`
	Intensity  int    `json:"intensity"`
	OccurredAt string `json:"occurredAt"`
}

// Events отдаёт события в окне вокруг текущего момента.
//
// Окно задаётся в часах в обе стороны: сцена показывает и прошлое, и будущее,
// и «последние N событий» для неё бесполезны — важно, что попадает в кадр
// времени, а не сколько их всего.
func (s *Store) Events(ctx context.Context, tenant string, backHours, aheadHours int) ([]Event, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, project_id, title, type, intensity, occurred_at
		FROM events
		WHERE tenant_id = $1
		  AND occurred_at >= now() - make_interval(hours => $2)
		  AND occurred_at <= now() + make_interval(hours => $3)
		ORDER BY occurred_at DESC`, tenant, backHours, aheadHours)
	if err != nil {
		return nil, fmt.Errorf("выборка событий: %w", err)
	}
	defer rows.Close()

	out := []Event{}
	for rows.Next() {
		var e Event
		var at time.Time
		if err := rows.Scan(&e.ID, &e.ProjectID, &e.Title, &e.Type, &e.Intensity, &at); err != nil {
			return nil, fmt.Errorf("разбор события: %w", err)
		}
		e.OccurredAt = at.Format(time.RFC3339)
		out = append(out, e)
	}
	return out, rows.Err()
}

type Lens struct {
	ID          string   `json:"id"`
	Title       string   `json:"title"`
	Type        string   `json:"type"`
	ProjectIDs  []string `json:"projectIds"`
	Explanation string   `json:"explanation"`
}

// Lenses отдаёт линзы вместе с составом, вычисленным из данных.
//
// Состав не хранится намеренно: линза — это вопрос, а не список. Список,
// записанный в базу, устаревает в тот момент, когда у проекта меняется
// статус, и человек видит в «где нужны мои решения» то, что решено вчера.
func (s *Store) Lenses(ctx context.Context, tenant string) ([]Lens, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT l.id, l.title, l.type, l.explanation,
		       COALESCE(array_agg(p.id ORDER BY p.id) FILTER (WHERE p.id IS NOT NULL), '{}')
		FROM lenses l
		LEFT JOIN projects p
		  ON p.tenant_id = l.tenant_id
		 AND CASE l.type
		       WHEN 'decisions' THEN p.status = 'decision'
		       -- Линза обещает «с риском ИЛИ требующие внимания», а считала
		       -- только риск: обещание и подсчёт разошлись, и человек не
		       -- видел половины того, за чем сюда шёл.
		       WHEN 'risks'     THEN p.status IN ('risk', 'attention')
		       -- «что влияет на деньги» — проекты, у которых есть денежная связь
		       WHEN 'money'     THEN EXISTS (
		            SELECT 1 FROM connections c
		            WHERE c.tenant_id = p.tenant_id AND c.type = 'finance'
		              AND (c.source_id = p.id OR c.target_id = p.id))
		       -- «без обновлений» — по последнему изменению, а не по статусу.
		       -- Неделя, а не две: ровно то, что написано в подписи линзы.
		       WHEN 'stale'     THEN p.updated_at < now() - interval '7 days'
		       ELSE false
		     END
		WHERE l.tenant_id = $1
		GROUP BY l.id, l.title, l.type, l.explanation, l.sort_order
		ORDER BY l.sort_order, l.id`, tenant)
	if err != nil {
		return nil, fmt.Errorf("выборка линз: %w", err)
	}
	defer rows.Close()

	out := []Lens{}
	for rows.Next() {
		var l Lens
		var ids string
		if err := rows.Scan(&l.ID, &l.Title, &l.Type, &l.Explanation, &ids); err != nil {
			return nil, fmt.Errorf("разбор линзы: %w", err)
		}
		l.ProjectIDs = parsePgArray(ids)
		out = append(out, l)
	}
	return out, rows.Err()
}

// parsePgArray разбирает текстовое представление массива Postgres.
//
// Разбор строкой, а не через pq.Array: идентификаторы проектов — это короткие
// латинские слова без запятых и кавычек (ограничение первичного ключа), и
// тащить зависимость ради одной колонки незачем.
func parsePgArray(s string) []string {
	s = strings.TrimPrefix(strings.TrimSuffix(s, "}"), "{")
	if s == "" {
		return []string{}
	}
	parts := strings.Split(s, ",")
	out := make([]string, 0, len(parts))
	for _, p := range parts {
		if p = strings.Trim(strings.TrimSpace(p), `"`); p != "" {
			out = append(out, p)
		}
	}
	return out
}

type Capture struct {
	ID        string `json:"id"`
	Text      string `json:"text"`
	State     string `json:"state"`
	ProjectID string `json:"projectId,omitempty"`
	CreatedAt string `json:"createdAt"`
}

// AddCapture сохраняет запись из композера как есть.
//
// Разбор здесь не делается: его делает модель, она бывает недоступна и
// ошибается, и потерять написанное человеком из-за чужой недоступности
// нельзя. Запись ложится в состоянии «ждёт разбора».
func (s *Store) AddCapture(ctx context.Context, tenant, text string) (*Capture, error) {
	text = strings.TrimSpace(text)
	if text == "" {
		return nil, errors.New("пустая запись")
	}

	var c Capture
	var created time.Time
	var project sql.NullString
	err := s.db.QueryRowContext(ctx, `
		INSERT INTO captures (tenant_id, text) VALUES ($1, $2)
		RETURNING id, text, state, project_id, created_at`,
		tenant, text).Scan(&c.ID, &c.Text, &c.State, &project, &created)
	if err != nil {
		return nil, fmt.Errorf("сохранение записи: %w", err)
	}
	c.ProjectID = project.String
	c.CreatedAt = created.Format(time.RFC3339)
	return &c, nil
}

// PendingCaptures — записи, ждущие разбора.
func (s *Store) PendingCaptures(ctx context.Context, tenant string, limit int) ([]Capture, error) {
	// Запись забирается из очереди, а не читается: фоновый проход и ручной
	// вызов /v1/captures/parse брали одну и ту же и разбирали её дважды —
	// модель работала впустую, а событие могло завестись двумя путями.
	//
	// FOR UPDATE SKIP LOCKED: второй читатель не ждёт первого, а берёт
	// следующую. Ждать здесь нечего — очередь на то и очередь.
	rows, err := s.db.QueryContext(ctx, `
		UPDATE captures SET state = 'parsing'
		WHERE id IN (
			SELECT id FROM captures
			WHERE tenant_id = $1 AND state = 'pending'
			ORDER BY created_at LIMIT $2
			FOR UPDATE SKIP LOCKED
		)
		RETURNING id, text`, tenant, limit)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []Capture{}
	for rows.Next() {
		var c Capture
		if err := rows.Scan(&c.ID, &c.Text); err != nil {
			return nil, err
		}
		out = append(out, c)
	}
	return out, rows.Err()
}

// ProjectRefs — то, из чего модель выбирает проект.
func (s *Store) ProjectRefs(ctx context.Context, tenant string) ([]struct{ ID, Title string }, error) {
	rows, err := s.db.QueryContext(ctx,
		`SELECT id, title FROM projects WHERE tenant_id = $1 ORDER BY id`, tenant)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	out := []struct{ ID, Title string }{}
	for rows.Next() {
		var r struct{ ID, Title string }
		if err := rows.Scan(&r.ID, &r.Title); err != nil {
			return nil, err
		}
		out = append(out, r)
	}
	return out, rows.Err()
}

// ApplyParse записывает разбор и заводит из него событие.
//
// Одной транзакцией: запись, помеченная разобранной, но без события —
// это молча потерянная мысль, а событие без пометки разобралось бы второй
// раз при следующем проходе.
//
// Пустой projectID — не ошибка: модель честно не отнесла запись ни к одному
// проекту. Событие тогда не заводится (у него нет проекта), а запись
// помечается «оставлена как есть» и остаётся видна человеку.
func (s *Store) ApplyParse(ctx context.Context, tenant, captureID, projectID, title, kind string, offsetHours int, raw string) error {
	tx, err := s.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}
	defer tx.Rollback()

	state := "parsed"
	if projectID == "" {
		state = "kept"
	} else {
		// Проект сверяется с базой, а не берётся на слово: модель может
		// вернуть идентификатор, которого нет, и внешний ключ отверг бы всю
		// транзакцию — вместе с пометкой о разборе.
		var exists bool
		if err := tx.QueryRowContext(ctx,
			`SELECT EXISTS (SELECT 1 FROM projects WHERE tenant_id=$1 AND id=$2)`,
			tenant, projectID).Scan(&exists); err != nil {
			return err
		}
		if !exists {
			projectID, state = "", "kept"
		}
	}

	if projectID != "" {
		// Событие по проекту — это и есть его обновление. Без этой отметки
		// projects.updated_at не двигал никто, и линза «без обновлений»
		// возвращала все проекты навсегда: она была верна ровно один раз, в
		// день создания записи.
		if _, err := tx.ExecContext(ctx, `
			UPDATE projects SET updated_at = now()
			WHERE tenant_id = $1 AND id = $2`, tenant, projectID); err != nil {
			return fmt.Errorf("отметка обновления проекта: %w", err)
		}
		if _, err := tx.ExecContext(ctx, `
			INSERT INTO events (tenant_id, id, project_id, title, type, intensity, occurred_at)
			VALUES ($1, 'cap-' || $2::text, $3, $4, $5, 1, now() + make_interval(hours => $6))
			ON CONFLICT DO NOTHING`,
			tenant, captureID, projectID, title, kind, offsetHours); err != nil {
			return fmt.Errorf("создание события из записи: %w", err)
		}
	}

	if _, err := tx.ExecContext(ctx, `
		UPDATE captures SET state = $3, parsed = $4::jsonb, project_id = NULLIF($5,'')
		WHERE tenant_id = $1 AND id = $2`,
		tenant, captureID, state, raw, projectID); err != nil {
		return fmt.Errorf("пометка записи: %w", err)
	}

	return tx.Commit()
}

// AssignCapture относит запись к проекту руками.
//
// Модель разбирает не всё: часть записей она честно не относит никуда, часть
// не понимает вовсе. До сих пор такие записи оставались в базе навсегда —
// человек не мог ни поправить решение модели, ни выбросить запись. Разбор
// руками использует ту же дорогу, что и разбор моделью: событие на проекте,
// пометка на записи, — иначе получились бы два разных способа считаться
// разобранным.
func (s *Store) AssignCapture(ctx context.Context, tenant, captureID, projectID, title string) error {
	title = strings.TrimSpace(title)
	if title == "" {
		return InputError{"нужен текст события"}
	}
	if strings.TrimSpace(projectID) == "" {
		return InputError{"не выбран проект"}
	}
	var exists bool
	if err := s.db.QueryRowContext(ctx,
		`SELECT EXISTS (SELECT 1 FROM captures WHERE tenant_id=$1 AND id=$2)`,
		tenant, captureID).Scan(&exists); err != nil {
		return err
	}
	if !exists {
		return ErrNotFound
	}
	// «Отнесено рукой» вместо ответа модели: видно, что суждение не её.
	return s.ApplyParse(ctx, tenant, captureID, projectID, title, "update", 0, `{"by":"human"}`)
}

// DropCapture выбрасывает запись.
//
// Не всё написанное стоит хранить: пробы, опечатки, надиктованный мусор. Без
// этого список неразобранного растёт и перестаёт что-либо значить — в нём
// тонет то, что вправду ждёт решения.
func (s *Store) DropCapture(ctx context.Context, tenant, captureID string) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM captures WHERE tenant_id = $1 AND id = $2`, tenant, captureID)
	if err != nil {
		return fmt.Errorf("удаление записи: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("удаление записи: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// FailParse помечает запись неразобранной, сохраняя причину.
//
// Текст при этом не трогается: разбор — это то, что можно повторить, а
// написанное человеком — нет.
func (s *Store) FailParse(ctx context.Context, tenant, captureID, reason string) error {
	_, err := s.db.ExecContext(ctx, `
		UPDATE captures SET state = 'failed', parsed = to_jsonb($3::text)
		WHERE tenant_id = $1 AND id = $2`, tenant, captureID, reason)
	return err
}

// NewProject — то, что человек заводит руками.
//
// Координат здесь нет намеренно: их считает раскладка из связей и статуса.
// Просить человека назвать место проекта на сцене значило бы вернуть ту
// самую ручную расстановку, от которой мы ушли.
type NewProject struct {
	ID       string `json:"id"`
	Title    string `json:"title"`
	Subtitle string `json:"subtitle"`
	Status   string `json:"status"`
	Summary  string `json:"summary"`
}

var statusLabels = map[string]string{
	"decision":  "Требует решения",
	"risk":      "Риск",
	"attention": "Требует внимания",
	"working":   "В работе",
	"stable":    "Стабильно",
	"paused":    "На паузе",
}

// CreateProject заводит проект.
//
// Идентификатор задаётся человеком или выводится из названия: он попадает в
// ссылки и в разбор записей моделью, и случайный набор букв там читался бы
// хуже, чем «kofeynya».
func (s *Store) CreateProject(ctx context.Context, tenant string, p NewProject) (string, error) {
	title := strings.TrimSpace(p.Title)
	if title == "" {
		return "", errors.New("нужно название проекта")
	}
	label, ok := statusLabels[p.Status]
	if !ok {
		// Неизвестный статус не подставляем молча: у каждого своё место на
		// оси внимания, и «что-то по умолчанию» поставит проект не туда.
		return "", errors.New("неизвестное состояние проекта")
	}

	// Заданный человеком опознаватель проходит через ту же выжимку, что и
	// выведенный из названия. Он попадает в адрес и в имя связи, и произвольная
	// строка оттуда — это и кривые ссылки, и двойной дефис, на котором имя
	// связи перестаёт однозначно разбираться на концы.
	id := slug(strings.TrimSpace(p.ID))
	if id == "" {
		id = slug(title)
	}
	if id == "" {
		return "", errors.New("не удалось вывести идентификатор из названия")
	}

	_, err := s.db.ExecContext(ctx, `
		INSERT INTO projects (tenant_id, id, title, subtitle, status, status_label, summary, size)
		VALUES ($1, $2, $3, $4, $5, $6, $7, 'md')`,
		tenant, id, title, strings.TrimSpace(p.Subtitle), p.Status, label, strings.TrimSpace(p.Summary))
	if err != nil {
		if isUnique(err) {
			return "", errors.New("проект с таким идентификатором уже есть")
		}
		return "", fmt.Errorf("создание проекта: %w", err)
	}
	return id, nil
}

// slug выводит идентификатор из названия.
//
// Кириллица переводится в латиницу: идентификатор попадает в адрес и в
// подсказку модели, и «кофейня» там читается всеми, а «%D0%BA%D0%BE» — никем.
func slug(title string) string {
	var b strings.Builder
	prevDash := false
	for _, r := range strings.ToLower(title) {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		case translit[r] != "":
			b.WriteString(translit[r])
			prevDash = false
		default:
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		}
	}
	return strings.Trim(b.String(), "-")
}

var translit = map[rune]string{
	'а': "a", 'б': "b", 'в': "v", 'г': "g", 'д': "d", 'е': "e", 'ё': "e",
	'ж': "zh", 'з': "z", 'и': "i", 'й': "y", 'к': "k", 'л': "l", 'м': "m",
	'н': "n", 'о': "o", 'п': "p", 'р': "r", 'с': "s", 'т': "t", 'у': "u",
	'ф': "f", 'х': "h", 'ц': "c", 'ч': "ch", 'ш': "sh", 'щ': "sch",
	'ы': "y", 'э': "e", 'ю': "yu", 'я': "ya",
}

func isUnique(err error) bool {
	return err != nil && strings.Contains(err.Error(), "duplicate key")
}

// NewConnection — связь между двумя проектами.
type NewConnection struct {
	SourceID string `json:"sourceId"`
	TargetID string `json:"targetId"`
	Label    string `json:"label"`
	Type     string `json:"type"`
	Strength int    `json:"strength"`
}

// CreateConnection связывает два проекта.
//
// Связи — это то, из чего раскладка выводит расположение: чем их больше, тем
// осмысленнее сцена. Поэтому заводить их надо так же легко, как проекты.
func (s *Store) CreateConnection(ctx context.Context, tenant string, c NewConnection) (string, error) {
	c, err := CheckConnection(c)
	if err != nil {
		return "", err
	}

	id := ConnectionID(c.SourceID, c.TargetID)
	_, err = s.db.ExecContext(ctx, `
		INSERT INTO connections (tenant_id, id, source_id, target_id, label, type, strength)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		tenant, id, c.SourceID, c.TargetID, c.Label, c.Type, c.Strength)
	if err != nil {
		if isUnique(err) {
			return "", ConflictError{"такая связь уже есть"}
		}
		// Внешний ключ ловит ссылку на несуществующий проект — и на чужой тоже,
		// потому что ключ составной, вместе с тенантом. До человека при этом
		// доходила сырая жалоба базы на имя ограничения; теперь — то, что он
		// может понять и исправить.
		if isForeignKey(err) {
			return "", InputError{"одного из проектов нет в вашем пространстве"}
		}
		return "", fmt.Errorf("создание связи: %w", err)
	}
	return id, nil
}

// ConnectionID — имя связи.
//
// Составлено из имён концов, потому что двух одинаковых связей между теми же
// проектами быть не должно, и база отказывает в этом сама, без отдельной
// проверки.
//
// Разделитель двойной. Одинарный дефис законен внутри самого опознавателя
// («invent-sale»), и склейка им необратима: пары (invent-sale, didi) и
// (invent, sale-didi) давали одно имя. База отказывала во второй связи как в
// двойнике той, которой человек в глаза не видел, а удаление по имени сняло бы
// не ту строку. Двойной дефис в опознавателе невозможен: slug не ставит два
// подряд, и заданный человеком опознаватель проходит через ту же выжимку.
func ConnectionID(source, target string) string { return source + "--" + target }

// Виды связи и их русские имена.
//
// Список живёт здесь, а не в интерфейсе: он же проверяется на входе, и два
// списка в разных местах разошлись бы при первом же добавлении вида.
type ConnectionKind struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Hint string `json:"hint"`
	// Направленный ли вид. У «общей команды» стороны равноправны, и спрашивать
	// человека, что откуда, значило бы требовать выбора там, где выбора нет.
	Directed bool `json:"directed"`
	// Как связь читается вслух между двумя именами: «Кофейня ДАЁТ ДЕНЬГИ
	// Фрилансу». Форма объясняет направление этой фразой, а не словом
	// «направление», — но фраза обязана жить рядом с флагом, иначе они
	// разойдутся.
	Phrase string `json:"phrase"`
}

var ConnectionKinds = []ConnectionKind{
	{"finance", "Деньги", "один кормит другой", true, "даёт деньги"},
	{"dependency", "Зависимость", "один не двинется без другого", true, "зависит от"},
	{"client", "Клиент", "один приводит клиентов другому", true, "приводит клиентов"},
	{"resource", "Общий ресурс", "делят одно и то же", false, "общий ресурс"},
	{"team", "Общая команда", "делают одни и те же люди", false, "общая команда"},
	{"knowledge", "Общий опыт", "растут на одном и том же знании", false, "общий опыт"},
}

func kindOf(id string) (ConnectionKind, bool) {
	for _, k := range ConnectionKinds {
		if k.ID == id {
			return k, true
		}
	}
	return ConnectionKind{}, false
}

// CheckConnection выправляет и проверяет связь до похода в базу.
//
// Отдельно от записи, чтобы правила можно было проверить без базы: они и есть
// то место, где ошибка стоит дорого — кривая связь тихо перекашивает всю
// раскладку сцены.
func CheckConnection(c NewConnection) (NewConnection, error) {
	c.SourceID = strings.TrimSpace(c.SourceID)
	c.TargetID = strings.TrimSpace(c.TargetID)
	c.Label = strings.TrimSpace(c.Label)

	if c.SourceID == "" || c.TargetID == "" {
		return c, InputError{"не выбраны оба проекта"}
	}
	if c.SourceID == c.TargetID {
		return c, InputError{"проект нельзя связать с самим собой"}
	}
	kind, ok := kindOf(c.Type)
	if !ok {
		return c, InputError{"неизвестный вид связи"}
	}

	// У ненаправленных видов концы равноправны, и «общая команда А→Б» — то же
	// самое утверждение, что «Б→А». Приводим порядок к одному, и тогда первичный
	// ключ отказывает в зеркальном двойнике сам. Без этого в базе лежали бы две
	// строки об одном, сцена рисовала бы две кривые с двумя подписями в одной
	// точке, а раскладка тянула бы пару вдвое сильнее, чем сказал человек.
	if !kind.Directed && c.SourceID > c.TargetID {
		c.SourceID, c.TargetID = c.TargetID, c.SourceID
	}
	// Сила вне разумного — не повод отказывать: связь важнее её оттенка, и
	// потерять её из-за чужой опечатки было бы обиднее, чем нарисовать
	// тонкой линией.
	if c.Strength < 1 || c.Strength > 3 {
		c.Strength = 1
	}
	if len([]rune(c.Label)) > 60 {
		return c, InputError{"пояснение длиннее шестидесяти знаков не поместится на линии"}
	}
	return c, nil
}

// DeleteProject убирает проект вместе со всем, что на нём висело.
//
// Заводить, не имея чем убрать, — половина дела. Проект заводится в один жест,
// в том числе по ошибке или на пробу, и без этого он остаётся в пространстве
// навсегда: чужая строка в списке, лишний узел на карте, лишнее кольцо в
// счётчике. Связи уходят следом по внешнему ключу — сама по себе связь с
// исчезнувшим концом ничего не выражает.
func (s *Store) DeleteProject(ctx context.Context, tenant, id string) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM projects WHERE tenant_id = $1 AND id = $2`, tenant, id)
	if err != nil {
		return fmt.Errorf("удаление проекта: %w", err)
	}
	// Тенант в условии — не украшение: без него опознаватель, известный со
	// стороны, вычистил бы чужую строку.
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("удаление проекта: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// DeleteConnection убирает связь.
//
// Без этого форма заведения была бы наполовину: связь определяет расположение
// узлов, и ошибочная тихо кривит всю сцену — а исправить её было нечем.
func (s *Store) DeleteConnection(ctx context.Context, tenant, id string) error {
	res, err := s.db.ExecContext(ctx,
		`DELETE FROM connections WHERE tenant_id = $1 AND id = $2`, tenant, id)
	if err != nil {
		return fmt.Errorf("удаление связи: %w", err)
	}
	// Тенант в условии — не украшение: без него ключ связи, известный со
	// стороны, вычистил бы чужую строку.
	n, err := res.RowsAffected()
	if err != nil {
		return fmt.Errorf("удаление связи: %w", err)
	}
	// Ноль строк — это не сбой, а «нечего убирать»: связь уже сняли в другой
	// вкладке или человек вернулся по старой ссылке. Отдельно от поломки,
	// потому что отвечать на это надо по-разному.
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// Разряды ошибок.
//
// Раньше все пути записи отвечали «неверный запрос»: и негодный ввод, и
// упавшая база. Человек в ответ переделывал верно введённое, а настоящая
// поломка не попадала никуда. Разряд нужен и странице: одно она показывает
// как объяснимое положение дел с кнопками, другое — как сбой службы, после
// которого введённое надо сохранить.
type InputError struct{ Msg string }

func (e InputError) Error() string { return e.Msg }

type ConflictError struct{ Msg string }

func (e ConflictError) Error() string { return e.Msg }

// IsInput — виноват ввод. Это 400.
func IsInput(err error) bool {
	var e InputError
	return errors.As(err, &e)
}

// IsConflict — ввод верен, но противоречит тому, что уже есть. Это 409:
// человеку нечего исправлять в написанном, ему надо решить, что делать с
// существующим.
func IsConflict(err error) bool {
	var e ConflictError
	return errors.As(err, &e)
}

func isForeignKey(err error) bool {
	return err != nil && strings.Contains(err.Error(), "foreign key constraint")
}

// LooseCaptures — записи, оставшиеся без проекта.
//
// Модель честно отказалась отнести их куда-либо (state='kept') либо не смогла
// разобрать (state='failed'). И то и другое человек обязан видеть: запись,
// которая легла в базу и не показывается нигде, потеряна вернее, чем если бы
// её не приняли вовсе.
func (s *Store) LooseCaptures(ctx context.Context, tenant string, limit int) ([]Capture, error) {
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, text, state, created_at
		FROM captures
		WHERE tenant_id = $1 AND state IN ('kept', 'failed', 'pending')
		ORDER BY created_at DESC LIMIT $2`, tenant, limit)
	if err != nil {
		return nil, fmt.Errorf("выборка записей: %w", err)
	}
	defer rows.Close()

	out := []Capture{}
	for rows.Next() {
		var c Capture
		var at time.Time
		if err := rows.Scan(&c.ID, &c.Text, &c.State, &at); err != nil {
			return nil, err
		}
		c.CreatedAt = at.Format(time.RFC3339)
		out = append(out, c)
	}
	return out, rows.Err()
}
