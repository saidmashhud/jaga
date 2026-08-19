// Package llm — обращение к модели, разбирающей свободные записи.
//
// Модель закрыта на подсеть кластера и требует ключ, поэтому ходит в неё
// служба, а не браузер: ключ в браузере не живёт. Совместимый с OpenAI
// интерфейс — это то, что отдаёт llama.cpp, и своего протокола здесь нет.
package llm

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"strings"
	"time"
)

type Client struct {
	base  string
	key   string
	model string
	http  *http.Client
}

// New возвращает nil, если модель не настроена.
//
// Nil — штатное состояние, а не ошибка: без модели продукт обязан работать,
// просто записи останутся неразобранными. Падать на старте значило бы связать
// доступность composer'а с доступностью чужой службы.
func New(base, key, model string) *Client {
	if base == "" || key == "" {
		return nil
	}
	return &Client{
		base:  strings.TrimSuffix(base, "/"),
		key:   key,
		model: model,
		// Замер на этой машине: 16 токенов за 86 секунд. Модель большая, а
		// видеокарты нет — счёт идёт на минуты, и это ровно та причина, по
		// которой разбор вынесен из запроса на сохранение: человек не должен
		// ждать модель, чтобы записать мысль.
		http: &http.Client{Timeout: 5 * time.Minute},
	}
}

// Project — то, из чего модель выбирает. Список настоящий: без него она
// придумает проект, которого нет, и запись уедет в никуда.
type Project struct {
	ID    string
	Title string
}

// Parsed — что модель извлекла из записи.
type Parsed struct {
	// Пусто — модель не смогла отнести запись к проекту. Это допустимый
	// ответ и лучше выдуманного: неотнесённая запись видна человеку,
	// приписанная чужому проекту — теряется.
	ProjectID string `json:"projectId"`
	Title     string `json:"title"`
	// update | risk | decision | deadline — те же четыре, что в схеме.
	Type string `json:"type"`
	// Сдвиг от «сейчас» в часах: отрицательный — прошлое. Модель гораздо
	// надёжнее считает «через три дня», чем выводит дату в ISO.
	OffsetHours int `json:"offsetHours"`
}

const system = `Ты разбираешь короткие рабочие записи в структуру.

Отвечай ТОЛЬКО объектом JSON, без пояснений и без разметки кода.
Поля:
  projectId    — идентификатор из списка проектов; пустая строка, если запись ни к одному не относится
  title        — суть записи одной строкой, до 80 знаков, на языке записи
  type         — одно из: update, risk, decision, deadline
  offsetHours  — когда это происходит относительно сейчас, в часах.
                 0, если время не названо. Отрицательное ТОЛЬКО для уже
                 случившегося. Срок («до пятницы», «к понедельнику») всегда
                 в будущем — значит положительное.

Как выбирать type:
  decision — нужно решение человека
  risk     — что-то идёт не так или угрожает
  deadline — назван срок
  update   — всё остальное

Проект выбирай ТОЛЬКО из списка. Если запись ни к одному не относится, оставь projectId пустым — это лучше, чем приписать чужому.`

type chatReq struct {
	Model       string    `json:"model"`
	Messages    []message `json:"messages"`
	Temperature float64   `json:"temperature"`
	MaxTokens   int       `json:"max_tokens"`
	// Qwen3 по умолчанию рассуждает вслух, а llama.cpp вырезает блок
	// размышлений из ответа. Модель успевала израсходовать весь лимит внутри
	// него и возвращала пустое содержимое с причиной остановки «length» —
	// то есть разбор падал не из-за плохого запроса, а из-за формата.
	TemplateKwargs map[string]any `json:"chat_template_kwargs,omitempty"`
}

type message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type chatResp struct {
	Choices []struct {
		Message message `json:"message"`
	} `json:"choices"`
}

// Parse разбирает запись. Возвращает ещё и сырой ответ модели: он ложится
// рядом с текстом, чтобы разбор можно было пересмотреть, не потеряв того,
// что человек имел в виду.
func (c *Client) Parse(ctx context.Context, text string, projects []Project) (*Parsed, string, error) {
	if c == nil {
		return nil, "", errors.New("модель не настроена")
	}

	var list strings.Builder
	for _, p := range projects {
		fmt.Fprintf(&list, "- %s: %s\n", p.ID, p.Title)
	}

	body, _ := json.Marshal(chatReq{
		Model: c.model,
		Messages: []message{
			// Сегодняшняя дата обязательна: без неё модель не знает, какой
			// сейчас день, и «до пятницы» ей не от чего отсчитывать — на
			// проверке такой срок уехал на пять дней в прошлое.
			{Role: "system", Content: system + "\n\nСейчас: " + time.Now().Format("Monday, 2 January 2006, 15:04")},
			// «/no_think» дублирует настройку шаблона: она работает на сборках,
			// где шаблон её понимает, а метка — на остальных. Стоит дёшево, а
			// разница между ними — пустой ответ вместо разбора.
			{Role: "user", Content: "Проекты:\n" + list.String() + "\nЗапись: " + text + " /no_think"},
		},
		// Ноль, а не значение по умолчанию: это извлечение фактов, а не
		// сочинение, и разнообразие ответов здесь — чистый вред.
		Temperature: 0,
		// Ответ — маленький объект в четыре поля. Просить больше значит
		// платить минутами: на этой машине токен стоит около двух секунд.
		MaxTokens:      160,
		TemplateKwargs: map[string]any{"enable_thinking": false},
	})

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, c.base+"/v1/chat/completions", bytes.NewReader(body))
	if err != nil {
		return nil, "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+c.key)

	res, err := c.http.Do(req)
	if err != nil {
		return nil, "", fmt.Errorf("запрос к модели: %w", err)
	}
	defer res.Body.Close()

	raw, _ := io.ReadAll(res.Body)
	if res.StatusCode != http.StatusOK {
		return nil, string(raw), fmt.Errorf("модель ответила %d", res.StatusCode)
	}

	var cr chatResp
	if err := json.Unmarshal(raw, &cr); err != nil || len(cr.Choices) == 0 {
		return nil, string(raw), errors.New("неразобранный ответ модели")
	}
	answer := cr.Choices[0].Message.Content

	p, err := extract(answer)
	if err != nil {
		return nil, answer, err
	}
	return p, answer, nil
}

// extract достаёт объект из ответа.
//
// Модель просят отвечать чистым JSON, но она обучена рассуждать и нет-нет
// добавит блок размышлений или обрамление ```json. Вырезать объект по
// скобкам дешевле, чем воевать с форматом на каждой второй записи.
func extract(s string) (*Parsed, error) {
	i, j := strings.Index(s, "{"), strings.LastIndex(s, "}")
	if i < 0 || j <= i {
		return nil, errors.New("в ответе модели нет объекта")
	}
	var p Parsed
	if err := json.Unmarshal([]byte(s[i:j+1]), &p); err != nil {
		return nil, fmt.Errorf("разбор ответа модели: %w", err)
	}

	// Тип приводится к известному: модель иногда возвращает слово не из
	// списка, а ограничение схемы отвергнет такую строку целиком.
	switch p.Type {
	case "update", "risk", "decision", "deadline":
	default:
		p.Type = "update"
	}
	if p.Title = strings.TrimSpace(p.Title); p.Title == "" {
		return nil, errors.New("модель не назвала суть записи")
	}
	// Срок не бывает в прошлом. Модель путает знак: «до пятницы» она вернула
	// как минус сто двадцать часов, и событие уехало на пять дней назад —
	// туда, где его уже никто не ждёт.
	if p.Type == "deadline" && p.OffsetHours < 0 {
		p.OffsetHours = -p.OffsetHours
	}
	// Год в обе стороны: всё, что дальше, — почти наверняка ошибка разбора,
	// а не настоящий срок, и такое событие уехало бы за край дорожки.
	if p.OffsetHours > 24*365 || p.OffsetHours < -24*365 {
		p.OffsetHours = 0
	}
	return &p, nil
}
