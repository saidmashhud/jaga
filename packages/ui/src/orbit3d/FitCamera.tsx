import { useFrame, useThree } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import type { LabelRegistry } from './LabelTraffic';

/**
 * Подгон кадра под то, что на сцене.
 *
 * Камера стояла в жёстко заданной точке — она была подобрана под шесть
 * авторских координат и ничего не знала о раскладке. С тех пор расположение
 * считает алгоритм из связей, и узлов может быть два или двадцать: в первом
 * случае сцена жалась в угол пустого кадра, во втором вылезала за края.
 *
 * Кадр подбирается один раз на набор — при появлении узлов и при изменении
 * их числа. Непрерывный подгон был бы хуже: камера ползала бы за физикой
 * узлов, и сцена никогда не стояла бы на месте.
 */
export function FitCamera({ registry }: { registry: LabelRegistry }) {
  const camera = useThree((s) => s.camera);
  // Органы управления объявлены makeDefault — берём их из состояния сцены, а
  // не тянем ссылку через полдерева.
  const controls = useThree((s) => s.controls) as
    | (THREE.EventDispatcher & { target: THREE.Vector3; update: () => void; minDistance: number; maxDistance: number })
    | null;
  const size = useThree((s) => s.size);
  const scene = useThree((s) => s.scene);
  // Ключ набора: пересчитываем, когда меняется состав, а не каждый кадр.
  const applied = useRef('');
  // Физика разносит узлы не мгновенно — даём ей осесть, иначе поймаем кадр,
  // где все ещё в куче, и приблизимся вплотную.
  const settle = useRef(0);

  useFrame((_, delta) => {
    // Рамка считается по узлам, а не по всему, что подписано: подписи связей
    // висят между узлами и границ сцены не расширяют.
    const nodes = Array.from(registry.values()).filter((e) => e.kind === 'node');
    const key = Array.from(registry.keys()).sort().join(',') + '|' + size.width;
    if (key === applied.current || nodes.length === 0) return;

    settle.current += delta;
    if (settle.current < 0.8) return;

    const box = new THREE.Box3();
    for (const node of nodes) box.expandByPoint(node.at);

    const centre = box.getCenter(new THREE.Vector3());
    const radius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius, 2.5);

    // Расстояние из угла обзора: половина сцены должна укладываться в
    // половину кадра. Запас в четверть — чтобы подписи под узлами и свечение
    // не упирались в край.
    const persp = camera as THREE.PerspectiveCamera;
    const vFov = (persp.fov * Math.PI) / 180;
    const fitV = radius / Math.sin(vFov / 2);
    const hFov = 2 * Math.atan(Math.tan(vFov / 2) * persp.aspect);
    const fitH = radius / Math.sin(hFov / 2);
    let dist = Math.max(fitV, fitH) * 1.25;

    // Пределы приближения раздвигаются под сцену, а не сцена подгоняется под
    // них: они ставились под шесть авторских координат, и на двух узлах
    // держали камеру втрое дальше нужного, а на двадцати — не давали отойти.
    if (controls) {
      controls.minDistance = Math.min(controls.minDistance, dist * 0.45);
      controls.maxDistance = Math.max(controls.maxDistance, dist * 2.2);
      dist = Math.min(Math.max(dist, controls.minDistance), controls.maxDistance);
    }

    // Направление взгляда сохраняем: сцена смотрится под тем же углом, к
    // которому человек привык, меняется только удаление и точка, вокруг
    // которой всё вращается.
    const dir = camera.position.clone().sub(controls?.target ?? new THREE.Vector3()).normalize();
    if (dir.lengthSq() < 0.001) dir.set(0.4, 0.22, 1).normalize();

    camera.position.copy(centre).addScaledVector(dir, dist);
    persp.near = Math.max(0.1, dist - radius * 3);
    persp.far = dist + radius * 4;
    persp.updateProjectionMatrix();

    // Туман тоже отсчитывается от камеры, а не от нуля координат. Его пределы
    // подбирались под ту же жёсткую точку съёмки: стоит камере отъехать под
    // большую раскладку — и дальняя половина сцены растворяется в фоне.
    // Ближний край чуть впереди сцены даёт глубину, дальний — за её спиной,
    // чтобы ничего не пропадало.
    const fog = scene.fog as THREE.Fog | null;
    if (fog && 'near' in fog) {
      fog.near = Math.max(0.1, dist - radius * 0.4);
      fog.far = dist + radius * 1.9;
    }

    if (controls) {
      controls.target.copy(centre);
      controls.update();
    } else {
      camera.lookAt(centre);
    }

    applied.current = key;
    settle.current = 0;
  });

  return null;
}
