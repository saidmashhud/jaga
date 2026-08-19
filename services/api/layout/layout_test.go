package layout

import "testing"

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
func TestAttentionAxis(t *testing.T) {
	p := Compute(nodes, edges)
	if !(p["a"].Z > p["c"].Z && p["c"].Z > p["d"].Z && p["d"].Z > p["b"].Z) {
		t.Errorf("порядок по оси внимания нарушен: decision=%v risk=%v stable=%v paused=%v",
			p["a"].Z, p["c"].Z, p["d"].Z, p["b"].Z)
	}
}

// Узлы не должны слипаться: две сферы в одной точке читаются как одна.
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

// Связанное стоит ближе несвязанного — иначе связь на сцене не читается.
func TestConnectedAreCloser(t *testing.T) {
	p := Compute(nodes, edges)
	d := func(x, y string) float64 {
		dx, dy := p[x].X-p[y].X, p[x].Y-p[y].Y
		return dx*dx + dy*dy
	}
	if d("a", "b") >= d("a", "c") {
		t.Errorf("связанные a—b дальше несвязанных a—c")
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
