import * as THREE from './assets/vendor/three.module.min.js';
import { orbitPoint } from './spatial.js?v=3';

// Rear windows are real scene objects: the sculpture can pass in front of them.
// The accessible HTML window takes over as each card reaches the reading position.
export function createFloorOrbit(scene, camera, { summaries, getState, onFrame }) {
  const geometry = new THREE.PlaneGeometry(1, 1);
  function paint(canvas, summary, index, theme) {
    const dark = theme !== 'light';
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 768);
    const glass = ctx.createLinearGradient(0, 0, 512, 768);
    glass.addColorStop(0, dark ? '#112b3de8' : '#eef8fff0'); glass.addColorStop(1, dark ? '#071621dd' : '#c8deecda');
    ctx.fillStyle = glass;
    ctx.beginPath(); ctx.roundRect(2, 2, 508, 764, 20); ctx.fill();
    ctx.strokeStyle = dark ? '#77b9e799' : '#f7fdff'; ctx.lineWidth = 2; ctx.stroke();
    ctx.strokeStyle = dark ? '#a8d9ff33' : '#ffffff80';
    ctx.beginPath(); ctx.roundRect(10, 10, 492, 748, 14); ctx.stroke();
    ctx.fillStyle = dark ? '#8aafc8' : '#435466'; ctx.font = '14px Consolas, monospace';
    ctx.fillText(`0${index + 1} / ${summary.name.toUpperCase()}`, 38, 60);
    const text = (value, y, size, lineHeight) => {
      ctx.font = `${size}px "Space Grotesk", "Segoe UI", sans-serif`;
      for (const paragraph of value.split('\n')) {
        let line = '';
        for (const word of paragraph.trim().split(/\s+/)) {
          const candidate = line ? `${line} ${word}` : word;
          if (line && ctx.measureText(candidate).width > 436) { ctx.fillText(line, 38, y); y += lineHeight; line = word; }
          else line = candidate;
        }
        ctx.fillText(line, 38, y); y += lineHeight;
      }
      return y;
    };
    ctx.fillStyle = dark ? '#d0eaff' : '#233344';
    const bottom = text(summary.title, 133, 41, 48);
    ctx.fillStyle = dark ? '#8aafc8' : '#435466'; text(summary.description, bottom + 35, 20, 32);
    ctx.strokeStyle = dark ? '#558bb055' : '#7896aa55'; ctx.lineWidth = 1;
    for (const y of [510, 567, 624, 690]) { ctx.beginPath(); ctx.moveTo(38, y); ctx.lineTo(474, y); ctx.stroke(); }
    ctx.font = '13px Consolas, monospace'; ctx.fillText('ORIGKFC / FROZEN IDENTITY', 38, 727);
  }
  const windows = summaries.map((summary, index) => {
    const canvas = document.createElement('canvas');
    canvas.width = 512; canvas.height = 768;
    paint(canvas, summary, index, document.documentElement.dataset.theme);
    const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    const mesh = new THREE.Mesh(geometry, material); mesh.visible = false;
    scene.add(mesh);
    return mesh;
  });
  const anchor = new THREE.Vector3(), reference = new THREE.Vector3(), view = new THREE.Vector3(), up = new THREE.Vector3();

  function update() {
    const state = getState();
    if (!state.enabled) { windows.forEach(mesh => { mesh.visible = false; }); return; }
    const focal = innerHeight / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    const front = orbitPoint(0, 0);
    reference.set(front.x, front.y, front.z).applyMatrix4(camera.matrixWorldInverse);
    const referenceDepth = Math.max(.1, -reference.z);
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const poses = windows.map((mesh, index) => {
      const point = orbitPoint(index, state.phase);
      anchor.set(point.x, point.y, point.z);
      view.copy(anchor).applyMatrix4(camera.matrixWorldInverse);
      const depth = Math.max(.1, -view.z);
      const { width, height } = state.dimensions[index];
      const worldHeight = height * referenceDepth / focal;
      mesh.scale.set(width * referenceDepth / focal, worldHeight, 1);
      mesh.position.copy(anchor).addScaledVector(up, worldHeight / 2);
      mesh.quaternion.copy(camera.quaternion);
      mesh.material.opacity = (1 - point.contentOpacity) * state.reveal * .86;
      mesh.visible = mesh.material.opacity > .005;
      anchor.project(camera);
      return {
        x: (anchor.x + 1) * innerWidth / 2,
        y: (1 - anchor.y) * innerHeight / 2,
        scale: referenceDepth / depth,
        opacity: point.contentOpacity * state.reveal,
      };
    });
    onFrame(poses);
  }

  return {
    update,
    setTheme(theme) { windows.forEach((mesh, index) => { paint(mesh.material.map.image, summaries[index], index, theme); mesh.material.map.needsUpdate = true; }); },
    dispose() { windows.forEach(mesh => { scene.remove(mesh); mesh.material.map.dispose(); mesh.material.dispose(); }); geometry.dispose(); },
  };
}
