package layout

import (
	"math"
	"testing"
)

// Что на самом деле делает крепость связи.
//
// В форме заведения связи про крепость написана целая подпись, и написать её
// наугад нельзя: сила входит в пружину множителем жёсткости при своей длине
// покоя, а не как «притяни ближе». Проверка закрепляет ответ, чтобы подпись не
// разошлась с поведением после первой же правки коэффициентов.
//
// Оба узла на одном поясе: поперёк пояса связь не двигает ничего (см.
// TestEdgeCannotMoveNodeOffItsBelt), и мерить надо вдоль.
func TestStrengthPullsCloser(t *testing.T) {
	dist := func(strength int) float64 {
		nodes := []Node{
			{ID: "a", Status: "working"},
			{ID: "b", Status: "working"},
		}
		p := Compute(nodes, []Edge{{Source: "a", Target: "b", Strength: strength}})
		return math.Hypot(p["a"].X-p["b"].X, p["a"].Y-p["b"].Y)
	}

	weak, mid, strong := dist(1), dist(2), dist(3)
	if !(strong < mid && mid < weak) {
		t.Fatalf("крепость не сближает: слегка %.0f, обычно %.0f, крепко %.0f", weak, mid, strong)
	}
	// Разница есть, но скромная — подпись не должна обещать большего.
	if weak-strong > weak*0.5 {
		t.Errorf("разница неправдоподобно велика: %.0f против %.0f", weak, strong)
	}
	t.Logf("расстояние: слегка %.0f, обычно %.0f, крепко %.0f", weak, mid, strong)
}

// Незнакомое состояние не проваливается молча.
//
// Пояс ему достаётся, иначе узел негде рисовать, — но об этом сказано вслух:
// сцена показывает такой узел пунктиром, а служба пишет о нём в журнал.
// Молчаливая подстановка — способ не узнать о новом состоянии никогда.
func TestUnknownStatusIsMarked(t *testing.T) {
	p := Compute([]Node{{ID: "x", Status: "непонятное"}}, nil)
	if !p["x"].BeltGuessed {
		t.Error("пояс угадан, но узел об этом не сообщает")
	}
	if p["x"].Belt != 4 {
		t.Errorf("незнакомому положен пояс «в работе», получен %d", p["x"].Belt)
	}

	known := Compute([]Node{{ID: "y", Status: "risk"}}, nil)
	if known["y"].BeltGuessed {
		t.Error("известное состояние помечено как угаданное")
	}
}
