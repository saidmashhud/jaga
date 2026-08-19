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
	Size        string   `json:"size"`
	UpdatedAt   string   `json:"updatedAt"`
	Summary     string   `json:"summary"`
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
	// статус — по нему выводится ось внимания; всё остальное выводится из
	// связей. Колонки pos_* остаются как след прежнего способа и будут
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
		       WHEN 'risks'     THEN p.status = 'risk'
		       -- «что влияет на деньги» — проекты, у которых есть денежная связь
		       WHEN 'money'     THEN EXISTS (
		            SELECT 1 FROM connections c
		            WHERE c.tenant_id = p.tenant_id AND c.type = 'finance'
		              AND (c.source_id = p.id OR c.target_id = p.id))
		       -- «без обновлений» — по последнему изменению, а не по статусу
		       WHEN 'stale'     THEN p.updated_at < now() - interval '14 days'
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
	rows, err := s.db.QueryContext(ctx, `
		SELECT id, text FROM captures
		WHERE tenant_id = $1 AND state = 'pending'
		ORDER BY created_at LIMIT $2`, tenant, limit)
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

	id := strings.TrimSpace(p.ID)
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
	if c.SourceID == c.TargetID {
		return "", errors.New("проект нельзя связать с самим собой")
	}
	if c.Strength < 1 || c.Strength > 3 {
		c.Strength = 1
	}
	switch c.Type {
	case "resource", "finance", "dependency", "team", "client", "knowledge":
	default:
		return "", errors.New("неизвестный вид связи")
	}

	id := c.SourceID + "-" + c.TargetID
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO connections (tenant_id, id, source_id, target_id, label, type, strength)
		VALUES ($1, $2, $3, $4, $5, $6, $7)`,
		tenant, id, c.SourceID, c.TargetID, strings.TrimSpace(c.Label), c.Type, c.Strength)
	if err != nil {
		if isUnique(err) {
			return "", errors.New("такая связь уже есть")
		}
		return "", fmt.Errorf("создание связи: %w", err)
	}
	return id, nil
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
