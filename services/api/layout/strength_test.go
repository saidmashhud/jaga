package layout

import (
	"math"
	"testing"
)

// Что на самом деле делает крепость связи.
//
// В интерфейсе про крепость написана целая подпись, и написать её наугад
// нельзя: сила входит в пружину как множитель жёсткости при длине покоя 260
// (см. Compute), а не как «притяни ближе». Отсюда неочевидно, окажется ли
// крепко связанная пара теснее слабо связанной — это зависит от того, чем
// уравновешено притяжение. Проверка закрепляет ответ, чтобы подпись не
// разошлась с поведением после первой же правки коэффициентов.
func TestStrengthPullsCloser(t *testing.T) {
	dist := func(strength int) float64 {
		nodes := []Node{
			{ID: "a", Status: "working"},
			{ID: "b", Status: "working"},
		}
		edges := []Edge{{Source: "a", Target: "b", Strength: strength}}
		p := Compute(nodes, edges)
		return math.Hypot(p["a"].X-p["b"].X, p["a"].Y-p["b"].Y)
	}

	weak, mid, strong := dist(1), dist(2), dist(3)
	if !(strong < mid && mid < weak) {
		t.Fatalf("крепость не сближает: слегка %.0f, обычно %.0f, крепко %.0f", weak, mid, strong)
	}
	// Разница есть, но она скромная — подпись не должна обещать большего.
	if weak-strong > weak*0.5 {
		t.Errorf("разница неправдоподобно велика: %.0f против %.0f", weak, strong)
	}
	t.Logf("расстояние: слегка %.0f, обычно %.0f, крепко %.0f", weak, mid, strong)
}

// Связь не двигает узлы по глубине.
//
// Глубина — это ось внимания, она выводится только из статуса. Подпись в
// форме прямо это обещает: «связь сблизит по кругу, но не по глубине».
func TestEdgeDoesNotTouchDepth(t *testing.T) {
	nodes := []Node{
		{ID: "a", Status: "decision"},
		{ID: "b", Status: "paused"},
	}
	free := Compute(nodes, nil)
	tied := Compute(nodes, []Edge{{Source: "a", Target: "b", Strength: 3}})

	for _, id := range []string{"a", "b"} {
		if free[id].Z != tied[id].Z {
			t.Errorf("%s: глубина изменилась связью, %.0f → %.0f", id, free[id].Z, tied[id].Z)
		}
	}
	if tied["a"].Z <= tied["b"].Z {
		t.Errorf("ждущее решения обязано стоять ближе отложенного: %.0f против %.0f", tied["a"].Z, tied["b"].Z)
	}
}
