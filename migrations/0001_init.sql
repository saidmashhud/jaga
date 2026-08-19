-- Схема Cortex.
--
-- Повторяет контракт, который до сих пор жил в apps/cortex-demo/src/mocks/types.ts,
-- с одной осознанной правкой: у события таймлайна есть отметка времени, а не
-- процент вдоль дорожки. Процент — свойство того, как событие сейчас нарисовано
-- в окне «неделя»; при переключении на «месяц» пересчитать его было не из чего.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Арендатор проставляется во всех выборках. Cortex задуман вертикалью поверх
-- платформы, как vint и zist, и однопользовательская схема пришлось бы
-- переписывать целиком в тот день, когда появится второй заказчик.

CREATE TABLE projects (
    tenant_id    TEXT NOT NULL,
    id           TEXT NOT NULL,
    title        TEXT NOT NULL,
    subtitle     TEXT NOT NULL DEFAULT '',
    short_code   TEXT NOT NULL DEFAULT '',
    icon         TEXT NOT NULL DEFAULT '',

    status       TEXT NOT NULL,
    status_label TEXT NOT NULL DEFAULT '',

    -- Координаты сцены. Ось z несёт смысл, а не украшает: положительная —
    -- ближе к зрителю, и сцена ставит впереди то, что требует решения.
    -- Пока координаты приходят из данных; когда появится алгоритм раскладки,
    -- он будет их вычислять, а не человек — вписывать.
    pos_x        DOUBLE PRECISION NOT NULL DEFAULT 0,
    pos_y        DOUBLE PRECISION NOT NULL DEFAULT 0,
    pos_z        DOUBLE PRECISION NOT NULL DEFAULT 0,

    size         TEXT NOT NULL DEFAULT 'md',
    summary      TEXT NOT NULL DEFAULT '',

    updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, id),
    CONSTRAINT projects_size_known CHECK (size IN ('sm', 'md', 'lg'))
);

CREATE TABLE connections (
    tenant_id  TEXT NOT NULL,
    id         TEXT NOT NULL,
    source_id  TEXT NOT NULL,
    target_id  TEXT NOT NULL,
    label      TEXT NOT NULL DEFAULT '',
    -- Положение подписи вдоль кривой, 0–1. NULL означает середину: это
    -- свойство отрисовки, и у большинства связей его задавать незачем.
    label_t    DOUBLE PRECISION,
    type       TEXT NOT NULL,
    strength   SMALLINT NOT NULL DEFAULT 1,
    animated   BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (tenant_id, id),
    FOREIGN KEY (tenant_id, source_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE,
    FOREIGN KEY (tenant_id, target_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT connections_strength_range CHECK (strength BETWEEN 1 AND 3),
    CONSTRAINT connections_label_t_range CHECK (label_t IS NULL OR label_t BETWEEN 0 AND 1),
    -- Связь проекта с самим собой ничего не выражает, а сцена на ней рисует
    -- вырожденную кривую нулевой длины.
    CONSTRAINT connections_not_self CHECK (source_id <> target_id)
);

CREATE INDEX idx_connections_source ON connections (tenant_id, source_id);
CREATE INDEX idx_connections_target ON connections (tenant_id, target_id);

CREATE TABLE focus_items (
    tenant_id   TEXT NOT NULL,
    id          TEXT NOT NULL,
    project_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    impact      TEXT NOT NULL DEFAULT 'medium',
    completed   BOOLEAN NOT NULL DEFAULT false,
    -- Доля выполнения, 0–1. NULL — «шага не видно», это не то же самое, что 0.
    progress    DOUBLE PRECISION,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, id),
    FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT focus_impact_known CHECK (impact IN ('high', 'medium', 'low')),
    CONSTRAINT focus_progress_range CHECK (progress IS NULL OR progress BETWEEN 0 AND 1)
);

CREATE INDEX idx_focus_open ON focus_items (tenant_id, completed, created_at DESC);

-- События: и лента «что происходит», и точки на таймлайне — это одно и то же.
-- Две таблицы разошлись бы уже на второй неделе, а лента и таймлайн обязаны
-- показывать одно событие одинаково.
CREATE TABLE events (
    tenant_id   TEXT NOT NULL,
    id          TEXT NOT NULL,
    project_id  TEXT NOT NULL,
    title       TEXT NOT NULL,
    type        TEXT NOT NULL,
    -- Сила события: насколько заметной должна быть отметка на дорожке.
    intensity   SMALLINT NOT NULL DEFAULT 1,
    -- Отметка времени вместо процента дорожки. Событие в будущем — это просто
    -- occurred_at больше now(), отдельного признака для этого не нужно.
    occurred_at TIMESTAMPTZ NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, id),
    FOREIGN KEY (tenant_id, project_id) REFERENCES projects (tenant_id, id) ON DELETE CASCADE,
    CONSTRAINT events_type_known CHECK (type IN ('update', 'risk', 'decision', 'deadline')),
    CONSTRAINT events_intensity_range CHECK (intensity BETWEEN 1 AND 3)
);

CREATE INDEX idx_events_time ON events (tenant_id, occurred_at DESC);

-- Линза — сохранённый вопрос к своим проектам («где нужны мои решения»).
-- Состав проектов не хранится: он вычисляется из статусов и событий, иначе
-- список пришлось бы пересобирать руками после каждого изменения.
CREATE TABLE lenses (
    tenant_id   TEXT NOT NULL,
    id          TEXT NOT NULL,
    title       TEXT NOT NULL,
    type        TEXT NOT NULL,
    explanation TEXT NOT NULL DEFAULT '',
    sort_order  INT  NOT NULL DEFAULT 0,

    PRIMARY KEY (tenant_id, id),
    CONSTRAINT lenses_type_known CHECK (type IN ('decisions', 'risks', 'money', 'stale'))
);

-- Записи из композера до того, как их разобрали в сущности.
--
-- Отдельная таблица, а не сразу задача: разбор делает модель, она ошибается и
-- бывает недоступна, и потерять написанное человеком из-за этого нельзя.
-- Здесь же будет видно качество разбора, когда он появится.
CREATE TABLE captures (
    tenant_id   TEXT NOT NULL,
    id          UUID NOT NULL DEFAULT uuid_generate_v4(),
    text        TEXT NOT NULL,
    -- pending — ждёт разбора, parsed — разобрана, kept — оставлена как есть.
    state       TEXT NOT NULL DEFAULT 'pending',
    -- Что из неё получилось: сюда ляжет ответ модели как есть, чтобы разбор
    -- можно было пересмотреть, не теряя исходного суждения.
    parsed      JSONB,
    project_id  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    PRIMARY KEY (tenant_id, id),
    CONSTRAINT captures_state_known CHECK (state IN ('pending', 'parsed', 'kept', 'failed')),
    CONSTRAINT captures_text_not_empty CHECK (length(btrim(text)) > 0)
);

CREATE INDEX idx_captures_pending ON captures (tenant_id, created_at DESC) WHERE state = 'pending';
