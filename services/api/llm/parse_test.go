package llm

import "testing"

// Эталон разбора.
//
// Раньше он жил в docs/eval как одноразовый скрипт на Python, который гоняли
// вручную в root-шелле на сервере и который даже не был закоммичен. Значит,
// качество разбора не измерялось никем и никогда, а промахи находились
// глазами — так и нашёлся срок, уехавший на пять дней в прошлое.
//
// Здесь проверяется разбор ОТВЕТА модели, а не сама модель: тест обязан
// работать без сети и укладываться в миллисекунды, иначе его перестанут
// запускать. Ответы взяты настоящие — это то, что модель вернула на живом
// стенде.
func TestExtract(t *testing.T) {
	cases := []struct {
		name   string
		answer string
		want   Parsed
	}{
		{
			name:   "чистый объект",
			answer: `{"projectId":"kofeynya","title":"Пересмотреть поставщика","type":"deadline","offsetHours":48}`,
			want:   Parsed{ProjectID: "kofeynya", Title: "Пересмотреть поставщика", Type: "deadline", OffsetHours: 48},
		},
		{
			name: "срок в прошлом выправляется",
			// Ровно то, что модель вернула на «до пятницы»: тип угадан, знак нет.
			answer: `{"type":"deadline","title":"закупки выросли","projectId":"kofeynya","offsetHours":-120}`,
			want:   Parsed{ProjectID: "kofeynya", Title: "закупки выросли", Type: "deadline", OffsetHours: 120},
		},
		{
			name:   "прошлое у обычного события остаётся прошлым",
			answer: `{"projectId":"didi","title":"Релиз отложен","type":"update","offsetHours":-6}`,
			want:   Parsed{ProjectID: "didi", Title: "Релиз отложен", Type: "update", OffsetHours: -6},
		},
		{
			name:   "запись без проекта — это ответ, а не отказ",
			answer: `{"projectId":"","title":"Купить хлеба","type":"update","offsetHours":0}`,
			want:   Parsed{ProjectID: "", Title: "Купить хлеба", Type: "update", OffsetHours: 0},
		},
		{
			name:   "объект в обрамлении кода",
			answer: "Вот разбор:\n```json\n{\"projectId\":\"didi\",\"title\":\"Срыв маршрута\",\"type\":\"risk\",\"offsetHours\":0}\n```",
			want:   Parsed{ProjectID: "didi", Title: "Срыв маршрута", Type: "risk", OffsetHours: 0},
		},
		{
			name:   "неизвестный тип приводится к известному",
			answer: `{"projectId":"nexus","title":"Что-то","type":"важное","offsetHours":0}`,
			want:   Parsed{ProjectID: "nexus", Title: "Что-то", Type: "update", OffsetHours: 0},
		},
		{
			name:   "нелепый срок обнуляется",
			answer: `{"projectId":"nexus","title":"Когда-нибудь","type":"deadline","offsetHours":99999}`,
			want:   Parsed{ProjectID: "nexus", Title: "Когда-нибудь", Type: "deadline", OffsetHours: 0},
		},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			got, err := extract(c.answer)
			if err != nil {
				t.Fatalf("разбор не удался: %v", err)
			}
			if *got != c.want {
				t.Errorf("получено %+v, ожидалось %+v", *got, c.want)
			}
		})
	}
}

// Ответы, которые обязаны быть отвергнуты.
//
// Отвергнуть — значит пометить запись неразобранной и сохранить причину.
// Молча принять полупустой разбор хуже: событие с пустой сутью уедет на
// дорожку, и найти его там будет нечем.
func TestExtractRejects(t *testing.T) {
	bad := map[string]string{
		"пустой ответ":            "",
		"размышление без объекта": "Хм, эта запись похожа на задачу для проекта Кофейня.",
		"объекта нет вовсе":       "не знаю",
		"суть не названа":         `{"projectId":"didi","title":"   ","type":"risk","offsetHours":0}`,
		"поломанный объект":       `{"projectId":"didi", "title":`,
	}

	for name, answer := range bad {
		t.Run(name, func(t *testing.T) {
			if got, err := extract(answer); err == nil {
				t.Errorf("ожидался отказ, получено %+v", *got)
			}
		})
	}
}
