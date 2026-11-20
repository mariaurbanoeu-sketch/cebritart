// El castell de focs del final: València de nit amb el mateix traç de la grúa.
import * as THREE from './three.module.min.js';
import { LineSegments2 } from './lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lines/LineSegmentsGeometry.js';
import { LineMaterial } from './lines/LineMaterial.js';
import { focs, skyline } from './focs.js';

export function castell(host, opts = {}) {
  const cap = !!opts.capvespre;
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2)); renderer.setClearColor(0, 0);
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 2, .1, 400);
  const mats = [];
  const lm = (c, w) => { const m = new LineMaterial({ color: c, linewidth: w }); mats.push(m); return m; };
  const lines = (segs, mat) => { const a = []; for (const [p, q] of segs) a.push(...p, ...q); const g = new LineSegmentsGeometry(); g.setPositions(a); return new LineSegments2(g, mat); };
  const city = skyline(64); scene.add(city);
  const F = focs(scene, camera, cap ? { area: { x0: -24, x1: 24, y0: 6, y1: 11, z0: -6, z1: -14 }, rate: 2.6 } : { area: { x0: -26, x1: 26, y0: 11, y1: 21, z0: -6, z1: -18 }, rate: 1.8 });

  let visible = false, raf = 0, parar = null, fet = false;
  function layout() {
    const r = host.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; const mob = w < 700;
    if (cap) { camera.position.set(0, 5, mob ? 64 : 42); camera.lookAt(0, 9.5, 0); } else { camera.position.set(0, 7, mob ? 70 : 46); camera.lookAt(0, mob ? 10 : 9, 0); }
    camera.updateProjectionMatrix();
    city.position.set(0, -.5, 0); city.scale.setScalar(mob ? .62 : 1);
    for (const m of mats) m.resolution.set(w, h);
    F.material.uniforms.uScale.value = h * 3 * Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2);
    renderer.render(scene, camera);
  }
  function tick(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(.05, (now - (tick.l || now)) / 1000); tick.l = now;
    F.update(dt); city.userData.llum(F.flash); renderer.render(scene, camera); raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
  new ResizeObserver(layout).observe(host);
  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (reduce) { layout(); return; }
    if (visible && cap) { F.auto = true; run(); }
    else if (visible) { if (!fet) { fet = true; F.auto = false; parar = F.castell(() => { F.auto = true; }); } run(); }
    else if (cap) { F.auto = false; }
    else if (!e.isIntersecting && e.boundingClientRect.top > 0) { parar && parar(); parar = null; fet = false; F.auto = false; F.clear(); }
  }, { threshold: .35 }).observe(host);
  // clic al cel: un coet allà on apuntes
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2(), hit = new THREE.Vector3(), pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 12);
  host.addEventListener('click', (e) => {
    if (reduce) return; const r = renderer.domElement.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
    if (ray.ray.intersectPlane(pl, hit)) { F.llança(hit.x, Math.max(8, hit.y), -12, F.pick(F.tipusList)); run(); try { window.__so && window.__so.vibra('xiulit'); } catch (_) {} }
  });
  layout();
}
