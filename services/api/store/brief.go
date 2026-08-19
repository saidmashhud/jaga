package store

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"time"
)

// BriefFacts — то, из чего складывается утренний бриф.
//
// Собирается правилами, а не моделью: ранжирование — это запросы к базе,
// и подставлять сюда модель значило бы менять миллисекунды на минуты без
// выигрыша в качестве. Модель получает готовые факты и пишет по ним слова.
type BriefFacts struct {
	// Открытые дела высокого эффекта: то, что человек сам назвал важным.
	HeavyFocus []string
	// Проекты, ждущие решения или в риске, — по оси внимания.
	Hot []struct{ ID, Title, Status string }
	// Сроки в ближайшие двое суток: то, что нельзя пропустить.
	Deadlines []struct {
		Title   string
		Project string
		InHours int
	}
	// Событий за последние сутки — мера общего движения.
	FreshEvents int
}

// Empty — не из чего собирать бриф. Это не ошибка: пустому пространству
// бриф не нужен, и модель ради него гонять незачем.
func (f BriefFacts) Empty() bool {
	return len(f.HeavyFocus) == 0 && len(f.Hot) == 0 && len(f.Deadlines) == 0
}

func (s *Store) BriefFacts(ctx context.Context, tenant string) (BriefFacts, error) {
	var f BriefFacts

	rows, err := s.db.QueryContext(ctx, `
		SELECT f.title FROM focus_items f
		WHERE f.tenant_id = $1 AND NOT f.completed AND f.impact = 'high'
		ORDER BY f.created_at LIMIT 5`, tenant)
	if err != nil {
		return f, fmt.Errorf("дела высокого эффекта: %w", err)
	}
	for rows.Next() {
		var t string
		if err := rows.Scan(&t); err != nil {
			rows.Close()
			return f, err
		}
		f.HeavyFocus = append(f.HeavyFocus, t)
	}
	rows.Close()

	rows, err = s.db.QueryContext(ctx, `
		SELECT id, title, status FROM projects
		WHERE tenant_id = $1 AND status IN ('decision', 'risk')
		ORDER BY CASE status WHEN 'decision' THEN 0 ELSE 1 END, id LIMIT 5`, tenant)
	if err != nil {
		return f, fmt.Errorf("горячие проекты: %w", err)
	}
	for rows.Next() {
		var h struct{ ID, Title, Status string }
		if err := rows.Scan(&h.ID, &h.Title, &h.Status); err != nil {
			rows.Close()
			return f, err
		}
		f.Hot = append(f.Hot, h)
	}
	rows.Close()

	rows, err = s.db.QueryContext(ctx, `
		SELECT e.title, p.title,
		       CEIL(EXTRACT(EPOCH FROM (e.occurred_at - now())) / 3600)::int
		FROM events e JOIN projects p ON p.tenant_id = e.tenant_id AND p.id = e.project_id
		WHERE e.tenant_id = $1 AND e.type = 'deadline'
		  AND e.occurred_at BETWEEN now() AND now() + interval '48 hours'
		ORDER BY e.occurred_at LIMIT 5`, tenant)
	if err != nil {
		return f, fmt.Errorf("ближайшие сроки: %w", err)
	}
	for rows.Next() {
		var d struct {
			Title   string
			Project string
			InHours int
		}
		if err := rows.Scan(&d.Title, &d.Project, &d.InHours); err != nil {
			rows.Close()
			return f, err
		}
		f.Deadlines = append(f.Deadlines, d)
	}
	rows.Close()

	err = s.db.QueryRowContext(ctx, `
		SELECT count(*) FROM events
		WHERE tenant_id = $1 AND occurred_at > now() - interval '24 hours'
		  AND occurred_at <= now()`, tenant).Scan(&f.FreshEvents)
	return f, err
}

// Brief — сохранённый бриф в форме рекомендации интерфейса.
type Brief struct {
	Title      string   `json:"title"`
	Body       string   `json:"description"`
	Reasons    []string `json:"reasons"`
	ProjectIDs []string `json:"projectIds"`
}

// TodayBrief возвращает бриф на сегодня, если он уже собран.
func (s *Store) TodayBrief(ctx context.Context, tenant string) (*Brief, error) {
	var b Brief
	var reasons, ids []byte
	err := s.db.QueryRowContext(ctx, `
		SELECT title, body, reasons, project_ids FROM briefs
		WHERE tenant_id = $1 AND day = CURRENT_DATE`, tenant).
		Scan(&b.Title, &b.Body, &reasons, &ids)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, err
	}
	_ = json.Unmarshal(reasons, &b.Reasons)
	_ = json.Unmarshal(ids, &b.ProjectIDs)
	return &b, nil
}

// HasTodayBrief — дешёвая проверка для фонового сборщика: гонять модель
// стоит минут, и прежде чем гонять, надо знать, что бриф ещё не собран.
func (s *Store) HasTodayBrief(ctx context.Context, tenant string) (bool, error) {
	var ok bool
	err := s.db.QueryRowContext(ctx, `
		SELECT EXISTS (SELECT 1 FROM briefs WHERE tenant_id = $1 AND day = CURRENT_DATE)`,
		tenant).Scan(&ok)
	return ok, err
}

func (s *Store) SaveBrief(ctx context.Context, tenant string, b Brief, raw string) error {
	reasons, _ := json.Marshal(b.Reasons)
	ids, _ := json.Marshal(b.ProjectIDs)
	_, err := s.db.ExecContext(ctx, `
		INSERT INTO briefs (tenant_id, day, title, body, reasons, project_ids, model_raw)
		VALUES ($1, CURRENT_DATE, $2, $3, $4, $5, $6)
		ON CONFLICT (tenant_id, day)
		DO UPDATE SET title = EXCLUDED.title, body = EXCLUDED.body,
		              reasons = EXCLUDED.reasons, project_ids = EXCLUDED.project_ids,
		              model_raw = EXCLUDED.model_raw, created_at = now()`,
		tenant, b.Title, b.Body, reasons, ids, raw)
	if err != nil {
		return fmt.Errorf("сохранение брифа: %w", err)
	}
	return nil
}

// ttl не нужен: строка привязана к дню и сама теряет смысл назавтра.
var _ = time.Now
