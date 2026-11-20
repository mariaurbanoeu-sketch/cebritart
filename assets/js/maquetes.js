// La prestatgeria de la nau: les maquetes dels projectes en 3D, amb el traç de la grúa.
import * as THREE from './three.module.min.js';
import { LineSegments2 } from './lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lines/LineSegmentsGeometry.js';
import { LineMaterial } from './lines/LineMaterial.js';

export function maquetes(host, items, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2)); renderer.setClearColor(0, 0);
  renderer.domElement.className = 'maq-canvas'; host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 2, .1, 200);
  const mats = [];
  const lm = (c, w) => { const m = new LineMaterial({ color: c, linewidth: w }); mats.push(m); return m; };
  const mInk = lm('#2f4b7c', 1.6), mSoft = lm('#7f9cc4', 1);
  let seed = 3; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - .5);
  const lines = (segs, mat, jit = .012) => { const a = []; for (const [p, q] of segs) a.push(p[0] + rnd() * jit, p[1] + rnd() * jit, p[2] + rnd() * jit, q[0] + rnd() * jit, q[1] + rnd() * jit, q[2] + rnd() * jit);
    const g = new LineSegmentsGeometry(); g.setPositions(a); const l = new LineSegments2(g, mat); l.frustumCulled = false; return l; };
  const fill = (c) => new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const fWood = fill('#e7dcc4'), fWoodD = fill('#cdbb94'), fPaper = fill('#fdfdfb');
  function solid(geo, f, parent, pos) { const m = new THREE.Mesh(geo, f); m.position.set(...pos);
    const e = new THREE.EdgesGeometry(geo, 20), p = e.attributes.position.array, s = []; for (let i = 0; i < p.length; i += 6) s.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]]]);
    m.add(lines(s, mInk)); parent.add(m); return m; }

  const SW = 2.3, SH = 2.25, D = 1.0; // amplada i alçada de cada buc
  const rack = new THREE.Group(); scene.add(rack);
  const loader = new THREE.TextureLoader();
  const boards = []; let cols = 4, current = opts.current;

  function build() {
    rack.clear(); boards.length = 0;
    const rows = Math.ceil(items.length / cols), W = cols * SW, H = rows * SH;
    // laterals, prestatges i fons
    solid(new THREE.BoxGeometry(.14, H + .3, D), fWoodD, rack, [-W / 2 - .07, H / 2 - .15, 0]);
    solid(new THREE.BoxGeometry(.14, H + .3, D), fWoodD, rack, [W / 2 + .07, H / 2 - .15, 0]);
    for (let r = 0; r <= rows; r++) solid(new THREE.BoxGeometry(W, .12, D), fWood, rack, [0, r * SH - .06, 0]);
    // separadors verticals entre buc i buc (sense línies de fons)
    for (let c = 1; c < cols; c++) solid(new THREE.BoxGeometry(.08, H, D * .9), fWoodD, rack, [-W / 2 + c * SW, H / 2, -.02]);
    items.forEach((it, i) => {
      const r = rows - 1 - Math.floor(i / cols), c = i % cols;
      const slot = new THREE.Group(); slot.position.set(-W / 2 + SW * (c + .5), r * SH, .05); rack.add(slot);
      const holder = new THREE.Group(); slot.add(holder);
      const card = new THREE.Group(); holder.add(card);
      const img = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ color: '#ffffff' }));
      const paper = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fPaper);
      const edge = lines([[[-.5, -.5, 0], [.5, -.5, 0]], [[.5, -.5, 0], [.5, .5, 0]], [[.5, .5, 0], [-.5, .5, 0]], [[-.5, .5, 0], [-.5, -.5, 0]]], mInk, 0);
      paper.position.z = -.004; card.add(paper, img, edge);
      // el peu de cartró per darrere
      const peu = lines([[[0, .4, -.01], [0, -.5, -.42]]], mInk, 0); card.add(peu);
      const tilt = [-.06, .05, -.03, .07, -.05, .04, -.07, .03][i % 8];
      const b = { it, slot, holder, card, img, paper, edge, peu, tilt, lift: 0, hover: 0, w: 1, h: 1 };
      boards.push(b);
      const set = (w, h) => { // ajusta la maqueta a la proporció real de la imatge
        const maxW = SW * .8, maxH = SH * .84, k = Math.min(maxW / w, maxH / h); b.w = w * k; b.h = h * k;
        img.scale.set(b.w, b.h, 1); paper.scale.set(b.w + .12, b.h + .12, 1); edge.scale.set(b.w + .12, b.h + .12, 1);
        card.position.y = b.h / 2 + .12; peu.scale.set(1, b.h, 1);
      };
      set(3, 4);
      loader.load(it.thumb, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; img.material.map = t; img.material.needsUpdate = true; set(t.image.width, t.image.height); dirty(); });
    });
    rack.position.y = -H / 2;
    return { W, H };
  }
  let dims = { W: 1, H: 1 };
  function layout() {
    const r = host.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    const nc = w < 560 ? 2 : w < 900 ? 3 : 4;
    if (nc !== cols || !boards.length) { cols = nc; dims = build(); }
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h;
    const fitH = (dims.H + .5) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitW = (dims.W + .6) / 2 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / camera.aspect;
    camera.position.set(0, .6, Math.max(fitH, fitW) + D); camera.lookAt(0, 0, 0); camera.updateProjectionMatrix();
    for (const m of mats) m.resolution.set(w, h); dirty();
  }

  let mx = 0, my = 0, cmx = 0, cmy = 0, raf = 0, visible = true, hovered = null, t = 0;
  function frame(dt) {
    t += dt;
    cmx += (mx - cmx) * (1 - Math.pow(.05, dt)); cmy += (my - cmy) * (1 - Math.pow(.05, dt));
    rack.rotation.y = cmx * .12; rack.rotation.x = cmy * .05;
    let moving = Math.abs(mx - cmx) + Math.abs(my - cmy) > .001;
    for (const b of boards) {
      const sel = b.it.id === current, gl = sel ? 1 : 0, gh = b === hovered ? 1 : 0;
      const k = reduce ? 1 : 1 - Math.pow(.004, dt);
      b.lift += (gl - b.lift) * k; b.hover += (gh - b.hover) * k;
      if (Math.abs(gl - b.lift) + Math.abs(gh - b.hover) > .002) moving = true;
      b.holder.position.set(0, b.lift * .12 + b.hover * .06, b.lift * .55 + b.hover * .15);
      b.holder.rotation.set(-.1 * (1 - b.lift), b.tilt * (1 - b.lift) * (1 - b.hover) - cmx * .25 * b.lift, 0);
      b.holder.scale.setScalar(1 + b.lift * .1);
    }
    renderer.render(scene, camera);
    return moving;
  }
  function tick(now) { raf = 0; if (!visible) return; const dt = Math.min(.05, (now - (tick.l || now)) / 1000); tick.l = now; if (frame(dt)) raf = requestAnimationFrame(tick); else tick.l = 0; }
  function dirty() { if (!raf && visible) raf = requestAnimationFrame(tick); }

  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  const hit = (e) => { const r = renderer.domElement.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
    const hs = ray.intersectObjects(boards.flatMap(b => [b.img, b.paper]), false); return hs.length ? boards.find(b => b.img === hs[0].object || b.paper === hs[0].object) : null; };
  host.addEventListener('pointermove', (e) => { const r = host.getBoundingClientRect(); mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2;
    if (e.pointerType === 'mouse') { const h = hit(e); if (h !== hovered) { hovered = h; host.style.cursor = h ? 'pointer' : ''; } } dirty(); });
  host.addEventListener('pointerleave', () => { mx = my = 0; hovered = null; dirty(); });
  host.addEventListener('click', (e) => { const h = hit(e); if (h) { current = h.it.id; opts.onPick && opts.onPick(current); dirty(); } });

  new ResizeObserver(layout).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) dirty(); }).observe(host);
  // mode nit: el traç passa a ser de guix
  const tema = () => { const n = document.documentElement.classList.contains('nit');
    mInk.color.set(n ? '#efe2c2' : '#2f4b7c'); mSoft.color.set(n ? '#5d74a0' : '#7f9cc4'); fWood.color.set(n ? '#2b4270' : '#e7dcc4'); fWoodD.color.set(n ? '#22365e' : '#cdbb94'); dirty(); };
  new MutationObserver(tema).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] }); tema();
  layout();
  return { select(id) { current = id; dirty(); } };
}
