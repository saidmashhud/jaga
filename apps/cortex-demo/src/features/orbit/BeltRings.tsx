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
            {/* Подпись на девяти часах, прямо на линии: там она не попадает
                ни в один узел при обычной расстановке и не спорит с ними. */}
            <text
              x={c.x - b.radius + 6}
              y={c.y - 4}
              fill="currentColor"
              fontSize={9}
              letterSpacing={1.4}
              opacity={busy ? 0.55 : 0.28}
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
      <text
        x={c.x + shape.decisionRadius * 0.72}
        y={c.y + shape.decisionRadius * 0.78}
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
