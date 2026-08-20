import type { SceneShape } from '../../services/cortex-api';
import { BELT_NAME } from './belts';

/**
 * Шкала внимания — шесть колец.
 *
 * Рисуются ВСЕ шесть, включая пустые. Одинокое кольцо читалось бы как поломка
 * прибора, а не как «у вас всё в одном состоянии»: человек должен видеть
 * шкалу целиком, чтобы понимать, где на ней стоят его дела.
 *
 * Шкала не гаснет никогда — ни при наведении, ни под линзой. Гашение говорит
 * «сейчас неважно», а разметка важна всегда: без неё узел висит в пустоте и
 * ничего не сообщает.
 */
export function BeltRings({ shape, counts }: { shape: SceneShape; counts: Map<number, number> }) {
  const { center: c } = shape;
  return (
    <g className="belts">
      {shape.belts.map((b) => {
        const busy = (counts.get(b.index) ?? 0) > 0;
        return (
          <g key={b.status}>
            <circle
              cx={c.x}
              cy={c.y}
              r={b.radius}
              fill="none"
              stroke="currentColor"
              strokeWidth={busy ? 1 : 0.75}
              strokeDasharray={busy ? undefined : '3 7'}
              // Тон убывает наружу: то, что в прежней сцене делали перспектива
              // и туман, здесь делает расстояние от ядра.
              opacity={0.5 - (b.index - 1) * 0.064}
            />
            {/* Подпись — прямо над кольцом, на двенадцати часах.
                Веером по углам они разошлись между собой, но полезли на имена
                дел: узлы стоят на тех же кольцах. Столбиком над ядром они
                выстраиваются в шкалу, которую видно как шкалу, а не как
                разбросанные слова. */}
            <text
              x={c.x}
              y={c.y - b.radius - 5}
              textAnchor="middle"
              data-scale-label=""
              fill="currentColor"
              fontSize={8.5}
              letterSpacing={1.6}
              opacity={busy ? 0.5 : 0.22}
            >
              {BELT_NAME[b.status]?.toUpperCase() ?? b.status}
              {busy ? ` · ${counts.get(b.index)}` : ''}
            </text>
          </g>
        );
      })}

      {/* Черта решения.
          Шесть ступеней сводятся к одному вопросу: ждёт это вас или идёт само.
          Внутри — то, что без вас не двинется. Это читается боковым зрением,
          не разбирая имён. */}
      <circle
        cx={c.x}
        cy={c.y}
        r={shape.decisionRadius}
        fill="none"
        stroke="var(--color-accent-violet)"
        strokeWidth={1}
        strokeDasharray="1 5"
        opacity={0.45}
      />
      {/* Подпись черты встаёт в тот же столбик, что и подписи колец, — между
          «требует внимания» и «в работе». Там она читается как рубеж шкалы, а
          не как ещё одно слово, брошенное на карту; внизу она ложилась прямо
          на узлы. */}
      <text
        x={c.x}
        y={c.y - shape.decisionRadius - 5}
        data-scale-label=""
        textAnchor="middle"
        fill="var(--color-accent-violet)"
        fontSize={9}
        letterSpacing={1.4}
        opacity={0.6}
      >
        ТРЕБУЕТ ВАС
      </text>
    </g>
  );
}
