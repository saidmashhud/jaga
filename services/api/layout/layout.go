// Package layout — расположение проектов на сцене.
//
// До этого координаты лежали в данных: шесть проектов стояли там, куда их
// поставил человек. Это работало ровно до седьмого — новый проект приходилось
// вписывать руками, а настоящий набор раскладывать было нечем.
//
// Считается на сервере, а не в сцене: позиции потребляют обе реализации —
// трёхмерная и запасная на SVG, — и два алгоритма разошлись бы в первый же
// день. Сцена рисует то, что ей дали, и не решает, где чему быть.
package layout

import (
	"math"
	"sort"
)

// Ось внимания.
//
// Это не украшение: z несёт смысл, ради которого сцена и сделана объёмной —
// ближе к зрителю то, что требует его решения, дальше то, что отложено.
// Раскладка обязана выводить z из статуса, иначе продукт теряет главное
// своё высказывание и остаётся плоской картой с наклоном.
var attentionZ = map[string]float64{
	"decision": 260,  // ждёт решения — ближе всего
	"risk":     150,  // угрожает — тоже впереди
	"attention": 60,  // требует внимания
	"active":   0,    // идёт своим ходом
	"stable":   -170, // не требует ничего
	"paused":   -300, // отложено — дальше всех
}

// Node — то, что раскладывается.
type Node struct {
	ID     string
	Status string
}

// Edge — связь между проектами. Сила влияет на то, насколько близко их тянет.
type Edge struct {
	Source, Target string
	Strength       int
}

// Point — куда встал узел.
type Point struct{ X, Y, Z float64 }

// Логическое пространство сцены. Те же величины, в которых были записаны
// авторские координаты, — иначе пришлось бы пересчитывать масштаб сцены.
const (
	centerX = 600
	centerY = 400
	ring    = 320
)

// Compute раскладывает узлы.
//
// Алгоритм пружинный, но полностью предсказуемый: начальные места берутся из
// порядка идентификаторов, случайности нет нигде. Это условие, а не вкус —
// сцена, переставляющая проекты при каждой перезагрузке, не даёт запомнить,
// где что лежит, и человек ищет заново то, что уже находил.
func Compute(nodes []Node, edges []Edge) map[string]Point {
	out := make(map[string]Point, len(nodes))
	if len(nodes) == 0 {
		return out
	}

	// Порядок фиксируем: карта в Go обходится в случайном порядке, и без
	// сортировки раскладка менялась бы от запроса к запросу.
	ordered := make([]Node, len(nodes))
	copy(ordered, nodes)
	sort.Slice(ordered, func(i, j int) bool { return ordered[i].ID < ordered[j].ID })

	idx := make(map[string]int, len(ordered))
	px := make([]float64, len(ordered))
	py := make([]float64, len(ordered))

	// Начальная расстановка — по кольцу. Один узел ставим в центр: сцена
	// вокруг ядра «Вы / Сейчас», и единственный проект логичнее рядом с ним,
	// чем на краю пустого круга.
	for i, n := range ordered {
		idx[n.ID] = i
		a := 2 * math.Pi * float64(i) / float64(len(ordered))
		px[i] = centerX + ring*math.Cos(a)
		py[i] = centerY + ring*math.Sin(a)
	}

	// Связанные притягиваются, все прочие отталкиваются. Сорока проходов
	// хватает: узлов здесь десятки, а не тысячи, и дальше картинка уже не
	// меняется на глаз.
	const passes = 40
	for pass := 0; pass < passes; pass++ {
		// Шаг убывает: крупные перестановки в начале, доводка в конце.
		// Постоянный шаг заставляет узлы колебаться вокруг своих мест и
		// никогда не встать окончательно.
		step := 1.0 - float64(pass)/float64(passes)

		dx := make([]float64, len(ordered))
		dy := make([]float64, len(ordered))

		// Отталкивание: каждый от каждого, обратно расстоянию.
		for i := range ordered {
			for j := i + 1; j < len(ordered); j++ {
				vx, vy := px[i]-px[j], py[i]-py[j]
				d2 := vx*vx + vy*vy
				if d2 < 1 {
					// Совпавшие узлы разводим по оси — иначе сила
					// бесконечна, а направление не определено.
					vx, vy, d2 = 1, 0, 1
				}
				f := 90000 / d2
				d := math.Sqrt(d2)
				dx[i] += vx / d * f
				dy[i] += vy / d * f
				dx[j] -= vx / d * f
				dy[j] -= vy / d * f
			}
		}

		// Притяжение по связям. Сильная связь тянет заметнее — это то, что
		// человек и ожидает увидеть: тесно связанное стоит рядом.
		for _, e := range edges {
			i, ok1 := idx[e.Source]
			j, ok2 := idx[e.Target]
			if !ok1 || !ok2 || i == j {
				continue
			}
			s := float64(e.Strength)
			if s < 1 {
				s = 1
			}
			vx, vy := px[j]-px[i], py[j]-py[i]
			d := math.Hypot(vx, vy)
			if d < 1 {
				continue
			}
			f := (d - 260) * 0.02 * s
			dx[i] += vx / d * f
			dy[i] += vy / d * f
			dx[j] -= vx / d * f
			dy[j] -= vy / d * f
		}

		// Слабое притяжение к центру: без него несвязанные узлы разлетаются
		// отталкиванием до края и уходят за пределы кадра.
		for i := range ordered {
			dx[i] += (centerX - px[i]) * 0.01
			dy[i] += (centerY - py[i]) * 0.01
		}

		for i := range ordered {
			px[i] += clamp(dx[i], 60) * step
			py[i] += clamp(dy[i], 60) * step
		}
	}

	for i, n := range ordered {
		z, ok := attentionZ[n.Status]
		if !ok {
			z = 0
		}
		out[n.ID] = Point{X: round(px[i]), Y: round(py[i]), Z: z}
	}
	return out
}

// clamp ограничивает шаг: один пересчёт не должен швырять узел через всю
// сцену, иначе раскладка расходится вместо того, чтобы сойтись.
func clamp(v, max float64) float64 {
	if v > max {
		return max
	}
	if v < -max {
		return -max
	}
	return v
}

func round(v float64) float64 { return math.Round(v*10) / 10 }
