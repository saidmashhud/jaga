package llm

import (
	"testing"
	"time"
)

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

// Календарь считает код, а не модель.
//
// Проверка на живой модели дала: «до пятницы» в четверг → суббота,
// «к понедельнику» → тоже суббота. Хуже того, на пример «в среду это около
// 50 часов» она вернула ровно 50, скопировав число из подсказки вместо
// счёта. Дни недели ей не даются, и подсказкой это не лечится.
func TestHoursUntilWeekday(t *testing.T) {
	// Четверг, 20 августа 2026, 06:47 — тот самый момент проверки.
	thu := time.Date(2026, 8, 20, 6, 47, 0, 0, time.UTC)

	cases := []struct {
		name  string
		now   time.Time
		day   time.Weekday
		hours int
	}{
		{"до пятницы в четверг утром — завтра к вечеру", thu, time.Friday, 35},
		{"к понедельнику в четверг — через четыре дня", thu, time.Monday, 107},
		{"до субботы в четверг", thu, time.Saturday, 59},
		// «До четверга», сказанное в четверг утром, — про сегодня: 18:00 ещё
		// не прошло, и отсылать человека на неделю вперёд было бы нелепо.
		{"до четверга в четверг утром — сегодня", thu, time.Thursday, 11},
		// А сказанное вечером того же дня — уже про следующий.
		{"до четверга в четверг вечером — через неделю",
			time.Date(2026, 8, 20, 19, 0, 0, 0, time.UTC), time.Thursday, 167},
	}

	for _, c := range cases {
		t.Run(c.name, func(t *testing.T) {
			if got := hoursUntilWeekday(c.now, c.day); got != c.hours {
				t.Errorf("получено %d ч, ожидалось %d", got, c.hours)
			}
		})
	}
}

// День недели из ответа модели превращается в часы, а её собственное число
// при этом отбрасывается — оно и было источником промахов.
func TestWeekdayOverridesModelHours(t *testing.T) {
	got, err := extract(`{"projectId":"kofeynya","title":"Подписать акт","type":"update","offsetHours":50,"weekday":"friday"}`)
	if err != nil {
		t.Fatalf("разбор не удался: %v", err)
	}
	if got.OffsetHours == 50 {
		t.Error("часы взяты у модели, хотя назван день недели")
	}
	if got.Type != "deadline" {
		t.Errorf("названный день недели — это срок, получено %q", got.Type)
	}
	if got.OffsetHours <= 0 || got.OffsetHours > 24*8 {
		t.Errorf("нелепое расстояние до дня недели: %d ч", got.OffsetHours)
	}
}
