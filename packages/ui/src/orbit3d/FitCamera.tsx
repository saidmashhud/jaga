import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { easing } from 'maath';
import type { LabelRegistry } from './LabelTraffic';

/**
 * Подгон кадра под то, что на сцене.
 *
 * Камера стояла в жёстко заданной точке — она была подобрана под шесть
 * авторских координат и ничего не знала о раскладке. С тех пор расположение
 * считает алгоритм из связей, и узлов может быть два или двадцать: в первом
 * случае сцена жалась в угол пустого кадра, во втором вылезала за края.
 *
 * Ждём не время, а покой. Первая попытка отсчитывала фиксированные 0,8 с и
 * снимала мерку с ещё разлетающихся узлов: кадр выходил случайным — замер на
 * живой сцене показал, что узлы занимали четверть ширины, а после случайного
 * пересчёта при изменении размера окна — вдвое больше. Поэтому границы
 * измеряются раз в четверть секунды, и кадр берётся, только когда они
 * перестали меняться.
 *
 * Камера не прыгает, а подъезжает: скачок через секунду после загрузки
 * читается как сбой. Управляем только расстоянием и точкой вращения —
 * направление взгляда остаётся за орбитой и за человеком, иначе подгон
 * дрался бы с автоповоротом.
 */

/** Как часто мерить границы. Чаще незачем: узлы движутся плавно. */
const PROBE = 0.25;
/** Насколько сойтись, чтобы считать раскладку устоявшейся. */
const CALM = 0.02;
/** Сколько держаться в покое, прежде чем брать мерку. */
const CALM_FOR = 0.5;
/** Насколько должны разъехаться границы, чтобы пересчитать уже взятый кадр. */
const REDO = 0.15;
/** Запас вокруг сцены: подписи висят под узлами и не должны упираться в край. */
const MARGIN = 1.15;

export function FitCamera({ registry }: { registry: LabelRegistry }) {
  const camera = useThree((s) => s.camera);
  // Органы управления объявлены makeDefault — берём их из состояния сцены, а
  // не тянем ссылку через полдерева.
  const controls = useThree((s) => s.controls) as
    | {
        target: THREE.Vector3;
        update: () => void;
        minDistance: number;
        maxDistance: number;
      }
    | null;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);

  const since = useRef(0);
  const seen = useRef(0);
  const calm = useRef(0);
  // Вместе с кадром помним, из какого размаха он взят: иначе не понять,
  // разъехалась ли сцена настолько, что мерку пора снимать заново.
  const goal = useRef<{ centre: THREE.Vector3; dist: number; radius: number } | null>(null);
  const width = useRef(0);

  const box = useRef(new THREE.Box3());
  const sphere = useRef(new THREE.Sphere());
  const offset = useRef(new THREE.Vector3());

  useFrame((_, delta) => {
    if (!controls) return;

    // 1. Измерение. Ширина кадра входит в решение: она меняет угол обзора по
    //    горизонтали, и то, что помещалось на широком экране, на узком нет.
    since.current += delta;
    if (since.current >= PROBE) {
      since.current = 0;

      box.current.makeEmpty();
      let found = 0;
      registry.forEach((entry) => {
        // Рамка считается по узлам: подписи связей висят между ними и границ
        // сцены не расширяют.
        if (entry.kind !== 'node') return;
        box.current.expandByPoint(entry.at);
        found++;
      });

      if (found > 0) {
        const radius = Math.max(box.current.getBoundingSphere(sphere.current).radius, 2.5);
        const moved = seen.current > 0 ? Math.abs(radius - seen.current) / seen.current : 1;
        seen.current = radius;

        calm.current = moved < CALM ? calm.current + PROBE : 0;

        const resized = size.width !== width.current;
        const drifted =
          goal.current !== null && Math.abs(radius - goal.current.radius) > goal.current.radius * REDO;

        if ((calm.current >= CALM_FOR && goal.current === null) || resized || drifted) {
          width.current = size.width;
          goal.current = {
            centre: box.current.getCenter(new THREE.Vector3()),
            dist: fit(radius, camera, size, controls),
            radius,
          };
        }
      }
    }

    // 2. Подъезд. Каждый кадр, мягко: расстояние и точка вращения, не угол.
    const aim = goal.current;
    if (!aim) return;

    easing.damp3(controls.target, aim.centre, 0.45, delta);
    offset.current.copy(camera.position).sub(controls.target);
    const now = offset.current.length();
    if (now < 0.001) return;
    const next = THREE.MathUtils.damp(now, aim.dist, 3, delta);
    camera.position.copy(controls.target).addScaledVector(offset.current.normalize(), next);

    const persp = camera as THREE.PerspectiveCamera;
    persp.near = Math.max(0.1, next - seen.current * 3);
    persp.far = next + seen.current * 4;
    persp.updateProjectionMatrix();

    // Туман тоже отсчитывается от камеры, а не от нуля координат. Его пределы
    // подбирались под ту же жёсткую точку съёмки: стоит камере отъехать под
    // большую раскладку — и дальняя половина сцены растворяется в фоне.
    const fog = scene.fog as THREE.Fog | null;
    if (fog && 'near' in fog) {
      fog.near = Math.max(0.1, next - seen.current * 0.4);
      fog.far = next + seen.current * 1.9;
    }

    controls.update();
  });

  return null;
}

/** Половина угла обзора по вертикали, в радианах. */
function fovHalf(camera: THREE.Camera): number {
  return (((camera as THREE.PerspectiveCamera).fov ?? 50) * Math.PI) / 360;
}

/**
 * Расстояние, с которого сцена целиком укладывается в кадр.
 *
 * Считается по обеим сторонам кадра: на узком экране решает горизонталь, на
 * широком — вертикаль. Пределы приближения раздвигаются под сцену, а не сцена
 * подгоняется под них: они ставились под шесть авторских координат и на двух
 * узлах держали бы камеру втрое дальше нужного.
 */
export function fit(
  radius: number,
  camera: THREE.Camera,
  size: { width: number; height: number },
  controls: { minDistance: number; maxDistance: number },
): number {
  const half = fovHalf(camera);
  const aspect = (camera as THREE.PerspectiveCamera).aspect || size.width / size.height;
  const halfH = Math.atan(Math.tan(half) * aspect);
  const dist = Math.max(radius / Math.sin(half), radius / Math.sin(halfH)) * MARGIN;

  controls.minDistance = Math.min(controls.minDistance, dist * 0.45);
  controls.maxDistance = Math.max(controls.maxDistance, dist * 2.2);
  return Math.min(Math.max(dist, controls.minDistance), controls.maxDistance);
}
