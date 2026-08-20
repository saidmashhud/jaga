package store

import (
	"errors"
	"testing"
)

// Правила связи.
//
// Проверяются отдельно от базы: связь задаёт расположение узлов на сцене, и
// кривая тихо перекашивает всю картину — а поймать это глазами почти нельзя.
// Тест обязан работать без базы, иначе его перестанут запускать.
func TestCheckConnection(t *testing.T) {
	ok := NewConnection{SourceID: "kofeynya", TargetID: "didi", Type: "finance", Strength: 2}

	t.Run("годная связь проходит как есть", func(t *testing.T) {
		got, err := CheckConnection(ok)
		if err != nil {
			t.Fatalf("отказ на годной связи: %v", err)
		}
		if got.Strength != 2 || got.Type != "finance" {
			t.Errorf("связь изменена без причины: %+v", got)
		}
	})

	t.Run("пробелы по краям срезаются", func(t *testing.T) {
		// Вид взят направленный: у ненаправленного концы ещё и приводятся к
		// одному порядку, и проверка перестала бы говорить о пробелах.
		got, err := CheckConnection(NewConnection{
			SourceID: "  kofeynya ", TargetID: " didi", Label: "  общий поставщик  ", Type: "finance",
		})
		if err != nil {
			t.Fatalf("отказ: %v", err)
		}
		if got.SourceID != "kofeynya" || got.TargetID != "didi" || got.Label != "общий поставщик" {
			t.Errorf("пробелы остались: %+v", got)
		}
	})

	t.Run("связь с самим собой отвергается", func(t *testing.T) {
		// Иначе сцена рисует вырожденную кривую нулевой длины, а раскладка
		// получает силу, тянущую узел к себе самому.
		if _, err := CheckConnection(NewConnection{SourceID: "didi", TargetID: "didi", Type: "team"}); err == nil {
			t.Error("ожидался отказ")
		}
	})

	t.Run("проект, состоящий из пробелов, — это не выбранный проект", func(t *testing.T) {
		if _, err := CheckConnection(NewConnection{SourceID: "   ", TargetID: "didi", Type: "team"}); err == nil {
			t.Error("ожидался отказ")
		}
	})

	t.Run("неизвестный вид отвергается", func(t *testing.T) {
		if _, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "b", Type: "дружба"}); err == nil {
			t.Error("ожидался отказ")
		}
	})

	t.Run("нелепая сила выправляется, а не отвергает связь", func(t *testing.T) {
		// Связь важнее её оттенка: потерять её из-за чужой опечатки обиднее,
		// чем нарисовать тонкой линией.
		for _, bad := range []int{-4, 0, 9} {
			got, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "b", Type: "team", Strength: bad})
			if err != nil {
				t.Fatalf("сила %d отвергла связь: %v", bad, err)
			}
			if got.Strength != 1 {
				t.Errorf("сила %d не выправлена, получено %d", bad, got.Strength)
			}
		}
	})

	t.Run("слишком длинное пояснение отвергается", func(t *testing.T) {
		long := ""
		for i := 0; i < 61; i++ {
			long += "я"
		}
		if _, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "b", Type: "team", Label: long}); err == nil {
			t.Error("ожидался отказ")
		}
		// Ровно шестьдесят — ещё можно.
		if _, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "b", Type: "team", Label: long[:len(long)-2]}); err != nil {
			t.Errorf("шестьдесят знаков отвергнуты: %v", err)
		}
	})
}

// Ненаправленный вид приводит концы к одному порядку.
//
// «Общая команда А→Б» и «Б→А» — одно и то же утверждение. Без приведения в
// базе лежали бы две строки об одном: сцена нарисовала бы две кривые с двумя
// подписями в одной точке, а раскладка стянула бы пару вдвое сильнее, чем
// сказал человек. Приведение делает первичный ключ рабочей защитой.
func TestSymmetricKindNormalisesEnds(t *testing.T) {
	forward, err := CheckConnection(NewConnection{SourceID: "didi", TargetID: "alfa", Type: "team"})
	if err != nil {
		t.Fatalf("отказ: %v", err)
	}
	back, err := CheckConnection(NewConnection{SourceID: "alfa", TargetID: "didi", Type: "team"})
	if err != nil {
		t.Fatalf("отказ: %v", err)
	}
	if ConnectionID(forward.SourceID, forward.TargetID) != ConnectionID(back.SourceID, back.TargetID) {
		t.Errorf("зеркальные связи получили разные имена: %q и %q",
			ConnectionID(forward.SourceID, forward.TargetID),
			ConnectionID(back.SourceID, back.TargetID))
	}
}

// Направленный вид порядок концов сохраняет.
//
// «Кофейня даёт деньги Фрилансу» и обратное — разные утверждения о мире, и
// путать их нельзя. Это осознанно оставляет возможность завести обе: взаимное
// финансирование бывает, и запрещать его значило бы не дать записать правду.
func TestDirectedKindKeepsOrder(t *testing.T) {
	got, err := CheckConnection(NewConnection{SourceID: "didi", TargetID: "alfa", Type: "finance"})
	if err != nil {
		t.Fatalf("отказ: %v", err)
	}
	if got.SourceID != "didi" || got.TargetID != "alfa" {
		t.Errorf("направление переставлено: %+v", got)
	}
}

// Разряд ошибки определяет код ответа, поэтому он часть договора, а не деталь.
func TestErrorClasses(t *testing.T) {
	_, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "a", Type: "team"})
	if !IsInput(err) {
		t.Errorf("связь с самим собой — это негодный ввод, получено %#v", err)
	}
	if IsConflict(err) {
		t.Error("негодный ввод принят за противоречие")
	}
	if !IsConflict(ConflictError{"такая связь уже есть"}) {
		t.Error("противоречие не опознано")
	}
	if IsInput(ConflictError{"такая связь уже есть"}) {
		t.Error("противоречие принято за негодный ввод")
	}
	// Обычная ошибка не должна попасть ни в один разряд: иначе упавшая база
	// снова ответит человеку «неверный запрос».
	plain := errors.New("база недоступна")
	if IsInput(plain) || IsConflict(plain) {
		t.Error("сбой службы отнесён к вине человека")
	}
}

// Опознаватель, заданный человеком, выжимается так же, как выведенный из
// названия.
//
// Без этого в него попадала произвольная строка: она уходит в адрес, в
// подсказку модели и в имя связи, где двойной дефис ломает разбор на концы.
func TestSuppliedIDIsSquashed(t *testing.T) {
	cases := map[string]string{
		"Моя Кофейня":   "moya-kofeynya",
		"a--b":          "a-b",
		"  Didi  ":      "didi",
		"!!!":           "",
		"Ferro Metal 2": "ferro-metal-2",
	}
	for in, want := range cases {
		if got := slug(in); got != want {
			t.Errorf("slug(%q) = %q, ожидалось %q", in, got, want)
		}
	}
}

// Все шесть видов, объявленных в интерфейсе, обязаны проходить проверку.
//
// Список один и тот же — но проверка ходит через kindOf, и разойтись они
// могли бы молча.
func TestEveryKindPasses(t *testing.T) {
	for _, k := range ConnectionKinds {
		if _, err := CheckConnection(NewConnection{SourceID: "a", TargetID: "b", Type: k.ID}); err != nil {
			t.Errorf("вид %q (%s) не проходит: %v", k.ID, k.Name, err)
		}
		if k.Name == "" || k.Hint == "" || k.Phrase == "" {
			t.Errorf("вид %q без русского имени, пояснения или фразы", k.ID)
		}
	}
	if len(ConnectionKinds) != 6 {
		t.Errorf("видов должно быть шесть, их %d", len(ConnectionKinds))
	}
}

// Имя связи собирается из концов — на этом держится отказ базы заводить
// вторую такую же.
func TestConnectionID(t *testing.T) {
	if got := ConnectionID("kofeynya", "didi"); got != "kofeynya--didi" {
		t.Errorf("получено %q", got)
	}

	// Одинарный дефис законен внутри опознавателя, и склейка им была
	// необратима: (invent-sale, didi) и (invent, sale-didi) давали одну
	// строку. База отказывала во второй связи как в двойнике той, которой
	// человек в глаза не видел, а удаление по имени сняло бы не ту строку.
	if ConnectionID("invent-sale", "didi") == ConnectionID("invent", "sale-didi") {
		t.Error("разные пары получили одно имя")
	}
	// Обратная связь — другое имя, и база её пропустит. Это осознанно: для
	// направленных видов «А кормит Б» и «Б кормит А» — разные утверждения.
	if ConnectionID("a", "b") == ConnectionID("b", "a") {
		t.Error("направление потеряно в имени")
	}
}
