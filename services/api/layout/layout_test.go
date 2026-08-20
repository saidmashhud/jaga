package layout

import (
	"math"
	"testing"
)

var nodes = []Node{
	{ID: "a", Status: "decision"}, {ID: "b", Status: "paused"},
	{ID: "c", Status: "risk"}, {ID: "d", Status: "stable"},
}
var edges = []Edge{{Source: "a", Target: "b", Strength: 3}}

// Раскладка обязана быть предсказуемой: сцена, переставляющая проекты при
// каждой перезагрузке, не даёт запомнить, где что лежит.
func TestDeterministic(t *testing.T) {
	first := Compute(nodes, edges)
	for i := 0; i < 5; i++ {
		if got := Compute(nodes, edges); got != nil {
			for id, p := range first {
				if got[id] != p {
					t.Fatalf("%s переехал: %+v против %+v", id, got[id], p)
				}
			}
		}
	}
}

// Ось внимания — то, ради чего сцена объёмная: ждущее решения ближе к
// зрителю, отложенное дальше всех.
// Ось внимания читается радиусом.
//
// Ради этого смысла сцена и сделана: чем ближе к ядру, тем сильнее дело
// требует человека. Пока эта проверка стоит, раскладка не может незаметно
// превратиться в красивый граф, который ничего не утверждает.
func TestAttentionAxis(t *testing.T) {
	p := Compute(nodes, edges)
	r := func(id string) float64 { return math.Hypot(p[id].X-CenterX, p[id].Y-CenterY) }

	if !(r("a") < r("c") && r("c") < r("d") && r("d") < r("b")) {
		t.Errorf("порядок поясов нарушен: решение=%.0f риск=%.0f стабильно=%.0f пауза=%.0f",
			r("a"), r("c"), r("d"), r("b"))
	}
	if p["a"].Belt != 1 || p["b"].Belt != 6 {
		t.Errorf("номера поясов не те: решение=%d пауза=%d", p["a"].Belt, p["b"].Belt)
	}
}

// Связь не может утащить узел с его пояса.
//
// Это то же обещание, что раньше давала глубина, только строже: там связь
// просто не трогала z, здесь она тянет по-настоящему — и всё равно не
// сдвигает. Радиус здесь не сила, а связь; будь он силой, достаточно крепкая
// связь перетащила бы узел на чужой пояс, и расстояние от ядра перестало бы
// что-либо значить.
func TestEdgeCannotMoveNodeOffItsBelt(t *testing.T) {
	// Самая злая пара: концы на противоположных поясах, связь предельной силы.
	n := []Node{{ID: "близко", Status: "decision"}, {ID: "далеко", Status: "paused"}}
	p := Compute(n, []Edge{{Source: "близко", Target: "далеко", Strength: 3}})

	for id, want := range map[string]float64{"близко": 112, "далеко": 340} {
		got := math.Hypot(p[id].X-CenterX, p[id].Y-CenterY)
		if math.Abs(got-want) > 8.05 {
			t.Errorf("%s ушёл с пояса: %.1f вместо %.0f±8", id, got, want)
		}
	}
}

// Связанное стоит ближе несвязанного — но вдоль пояса, а не поперёк.
//
// Прежняя проверка сравнивала пару с противоположных поясов и с появлением
// поясов стала неверной по условию: между первым и шестым 228 единиц, и
// никакая связь этого не отменит. Смысл же остался прежний — связь должна
// быть видна.
func TestConnectedAreCloserAlongTheBelt(t *testing.T) {
	n := []Node{
		{ID: "a", Status: "working"},
		{ID: "b", Status: "working"},
		{ID: "c", Status: "working"},
	}
	p := Compute(n, []Edge{{Source: "a", Target: "b", Strength: 3}})
	d := func(x, y string) float64 { return math.Hypot(p[x].X-p[y].X, p[x].Y-p[y].Y) }

	if d("a", "b") >= d("a", "c") {
		t.Errorf("связанные a—b (%.0f) не ближе несвязанных a—c (%.0f)", d("a", "b"), d("a", "c"))
	}
}

func TestNoOverlap(t *testing.T) {
	p := Compute(nodes, edges)
	ids := []string{"a", "b", "c", "d"}
	for i := range ids {
		for j := i + 1; j < len(ids); j++ {
			dx, dy := p[ids[i]].X-p[ids[j]].X, p[ids[i]].Y-p[ids[j]].Y
			if dx*dx+dy*dy < 80*80 {
				t.Errorf("%s и %s слиплись", ids[i], ids[j])
			}
		}
	}
}

// Пустой набор не должен ронять службу.
func TestEmpty(t *testing.T) {
	if got := Compute(nil, nil); len(got) != 0 {
		t.Errorf("ожидалась пустая раскладка, получено %v", got)
	}
}

// Незнакомый статус обязан быть назван, а не тихо встать в ноль.
func TestUnknownStatuses(t *testing.T) {
	got := UnknownStatuses([]Node{
		{ID: "a", Status: "decision"},
		{ID: "b", Status: "выдуманный"},
		{ID: "c", Status: "выдуманный"},
		{ID: "d", Status: "working"},
	})
	if len(got) != 1 || got[0] != "выдуманный" {
		t.Errorf("ожидался список из одного незнакомого статуса, получено %v", got)
	}
}

// Все статусы, какие есть в данных, должны иметь место на оси.
func TestKnownStatusesCovered(t *testing.T) {
	inData := []Node{
		{ID: "1", Status: "attention"}, {ID: "2", Status: "decision"},
		{ID: "3", Status: "paused"}, {ID: "4", Status: "risk"},
		{ID: "5", Status: "stable"}, {ID: "6", Status: "working"},
	}
	if got := UnknownStatuses(inData); len(got) != 0 {
		t.Errorf("статусы из данных без места на оси: %v", got)
	}
}
