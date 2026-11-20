// La capella en 3D: retaule daurat amb la fornícula, l'altar i les espelmes, amb el mateix traç de tinta que la grua.
import * as THREE from './three.module.min.js';
import { LineSegments2 } from './lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lines/LineSegmentsGeometry.js';
import { LineMaterial } from './lines/LineMaterial.js';

export function capella(host, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'capella-canvas';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(26, 1, .1, 200);

  const INK = '#3b2a14', OR = '#d9b467', OR2 = '#b8924a', OR3 = '#ecd394', PAPER = '#f6f1e6', CERA = '#fbf6ea';
  const mats = [];
  const lm = (c, w) => { const m = new LineMaterial({ color: c, linewidth: w, worldUnits: false }); mats.push(m); return m; };
  const mInk = lm(INK, 1.6), mFi = lm(INK, 1.05);
  const fill = c => new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  let seed = 11; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - .5);
  function lines(segs, mat, J = .012) {
    const a = []; for (const [p, q] of segs) a.push(p[0] + rnd() * J, p[1] + rnd() * J, p[2] + rnd() * J, q[0] + rnd() * J, q[1] + rnd() * J, q[2] + rnd() * J);
    const g = new LineSegmentsGeometry(); g.setPositions(a); const l = new LineSegments2(g, mat); l.computeLineDistances(); return l;
  }
  function solid(geo, col, parent, pos, rot, ang = 25, mat = mInk) {
    const m = new THREE.Mesh(geo, fill(col)); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot);
    const e = new THREE.EdgesGeometry(geo, ang), p = e.attributes.position.array, s = [];
    for (let i = 0; i < p.length; i += 6) s.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]]]);
    m.add(lines(s, mat)); parent.add(m); return m;
  }
  const arc = (sh, r, cy, hole) => { sh.moveTo(r, -.4); sh.lineTo(r, cy); sh.absarc(0, cy, r, 0, Math.PI, false); sh.lineTo(-r, -.4); sh.lineTo(r, -.4); };
  const arcPath = (r, cy, y0 = 0, Sh = false) => { const p = Sh ? new THREE.Shape() : new THREE.Path(); p.moveTo(r, y0); p.lineTo(r, cy); p.absarc(0, cy, r, 0, Math.PI, false); p.lineTo(-r, y0); p.lineTo(r, y0); return p; };

  const altar = new THREE.Group(); scene.add(altar);
  const R = 1.5, CY = 2.5; // fornícula: 3 × 4

  // retaule: marc daurat amb l'arc obert
  const marc = new THREE.Shape(); arc(marc, 2.25, CY); marc.holes.push(arcPath(R, CY, 0));
  solid(new THREE.ExtrudeGeometry(marc, { depth: .38, bevelEnabled: true, bevelSize: .04, bevelThickness: .04, bevelSegments: 1, curveSegments: 40 }), OR, altar, [0, 0, -.1], null, 30);
  // motllura interior de l'arc
  const mot = arcPath(R + .18, CY, 0, true); mot.holes.push(arcPath(R, CY, 0));
  solid(new THREE.ExtrudeGeometry(mot, { depth: .5, bevelEnabled: false, curveSegments: 40 }), OR3, altar, [0, 0, -.1], null, 30, mFi);
  // fons de la fornícula, amb la il·lustració
  const tc = document.createElement('canvas'); tc.width = 768; tc.height = 1024; const tk = tc.getContext('2d');
  tk.fillStyle = PAPER; tk.fillRect(0, 0, 768, 1024);
  const tex = new THREE.CanvasTexture(tc); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const fonsShape = arcPath(R, CY, 0, true);
  const fg = new THREE.ShapeGeometry(fonsShape, 48), uv = fg.attributes.uv, ps = fg.attributes.position;
  for (let i = 0; i < ps.count; i++) uv.setXY(i, (ps.getX(i) + R) / (2 * R), ps.getY(i) / (CY + R));
  const fons = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ map: tex })); fons.position.z = -.32; altar.add(fons);
  // ombra suau dins de l'arc perquè tinga fondària
  const om = document.createElement('canvas'); om.width = 64; om.height = 256; const omk = om.getContext('2d'), og = omk.createLinearGradient(0, 0, 64, 0);
  og.addColorStop(0, 'rgba(90,60,20,.35)'); og.addColorStop(.18, 'rgba(90,60,20,0)'); og.addColorStop(.82, 'rgba(90,60,20,0)'); og.addColorStop(1, 'rgba(90,60,20,.35)'); omk.fillStyle = og; omk.fillRect(0, 0, 64, 256);
  const omT = new THREE.CanvasTexture(om); const omb = new THREE.Mesh(fg, new THREE.MeshBasicMaterial({ map: omT, transparent: true })); omb.position.z = -.31; altar.add(omb);
  // columnes salomòniques simplificades
  for (const sx of [-1, 1]) {
    const x = sx * 2.75, g = new THREE.Group(); g.position.set(x, 0, .25); altar.add(g);
    solid(new THREE.BoxGeometry(.7, .35, .7), OR2, g, [0, -.22, 0]);
    solid(new THREE.CylinderGeometry(.24, .24, 4.1, 14, 1), OR, g, [0, 2.0, 0], null, 40);
    const spir = []; for (let i = 0; i < 70; i++) { const t0 = i / 70, t1 = (i + 1) / 70, a0 = t0 * Math.PI * 12, a1 = t1 * Math.PI * 12;
      spir.push([[Math.cos(a0) * .245, -.05 + t0 * 4.1, Math.sin(a0) * .245], [Math.cos(a1) * .245, -.05 + t1 * 4.1, Math.sin(a1) * .245]]); }
    g.add(lines(spir, mFi, .004));
    solid(new THREE.BoxGeometry(.62, .22, .62), OR2, g, [0, 4.15, 0]);
    solid(new THREE.BoxGeometry(.8, .18, .8), OR, g, [0, 4.35, 0]);
    solid(new THREE.SphereGeometry(.2, 12, 8), OR3, g, [0, 4.62, 0], null, 60);
  }
  // corona i creu dalt de l'arc
  solid(new THREE.BoxGeometry(.12, .8, .12), OR, altar, [0, CY + 2.25 + .55, .1]);
  solid(new THREE.BoxGeometry(.5, .12, .12), OR, altar, [0, CY + 2.25 + .7, .1]);
  solid(new THREE.BoxGeometry(6.3, .2, .9), OR2, altar, [0, -.5, .2]);

  // mesa d'altar amb estovalles
  solid(new THREE.BoxGeometry(7.4, 1.25, 1.6), PAPER, altar, [0, -1.25, .75]);
  solid(new THREE.BoxGeometry(7.6, .12, 1.75), OR, altar, [0, -.57, .75]);
  solid(new THREE.BoxGeometry(5.2, .7, .04), '#fffdf7', altar, [0, -1.0, 1.57]);
  solid(new THREE.BoxGeometry(5.2, .08, .05), OR, altar, [0, -1.37, 1.58]);
  solid(new THREE.BoxGeometry(.5, .5, .05), OR, altar, [0, -.98, 1.6], [0, 0, Math.PI / 4]);
  solid(new THREE.BoxGeometry(8.2, .25, 2.2), OR2, altar, [0, -2.0, .9]);

  // espelmes amb canelobres
  const glowC = document.createElement('canvas'); glowC.width = glowC.height = 64; { const k = glowC.getContext('2d'), g = k.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, 'rgba(255,240,190,1)'); g.addColorStop(.3, 'rgba(255,200,110,.55)'); g.addColorStop(1, 'rgba(255,160,60,0)'); k.fillStyle = g; k.fillRect(0, 0, 64, 64); }
  const glowT = new THREE.CanvasTexture(glowC);
  const espelmes = [];
  const pos = [[-3.35, .95], [-2.85, 1.35], [-2.3, 1.1], [2.3, 1.1], [2.85, 1.35], [3.35, .95]];
  pos.forEach(([x, h]) => {
    const g = new THREE.Group(); g.position.set(x, -.51, 1.05); altar.add(g);
    solid(new THREE.CylinderGeometry(.2, .24, .08, 14), OR2, g, [0, .04, 0], null, 40);
    solid(new THREE.CylinderGeometry(.05, .07, .3, 10), OR, g, [0, .23, 0], null, 40);
    solid(new THREE.CylinderGeometry(.15, .1, .07, 14), OR, g, [0, .41, 0], null, 40);
    solid(new THREE.CylinderGeometry(.095, .1, h, 14), CERA, g, [0, .44 + h / 2, 0], null, 40);
    const top = .44 + h; g.add(lines([[[0, top, 0], [0, top + .07, 0]]], mInk, 0));
    const fl = new THREE.Group(); fl.position.y = top + .05; g.add(fl);
    const nucli = new THREE.Mesh(new THREE.SphereGeometry(.06, 12, 10), new THREE.MeshBasicMaterial({ color: '#fff6cf', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false }));
    nucli.scale.set(1, 2.4, 1); nucli.position.y = .12; fl.add(nucli);
    const exterior = new THREE.Mesh(new THREE.SphereGeometry(.09, 12, 10), new THREE.MeshBasicMaterial({ color: '#ffb347', transparent: true, opacity: .85, blending: THREE.AdditiveBlending, depthWrite: false }));
    exterior.scale.set(1, 2.2, 1); exterior.position.y = .13; fl.add(exterior);
    const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowT, color: '#ffd28a', transparent: true, blending: THREE.AdditiveBlending, depthWrite: false })); halo.scale.set(1.3, 1.3, 1); halo.position.y = .15; fl.add(halo);
    fl.visible = false; fl.scale.setScalar(.01);
    espelmes.push({ fl, nucli, exterior, halo, on: false, f: Math.random() * 10 });
  });
  // resplendor de les espelmes sobre el retaule
  const resC = document.createElement('canvas'); resC.width = resC.height = 128; { const k = resC.getContext('2d'), g = k.createRadialGradient(64, 64, 0, 64, 64, 64);
    g.addColorStop(0, 'rgba(255,190,110,.5)'); g.addColorStop(1, 'rgba(255,190,110,0)'); k.fillStyle = g; k.fillRect(0, 0, 128, 128); }
  const res = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(resC), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0 }));
  res.scale.set(11, 7, 1); res.position.set(0, .4, 1.2); altar.add(res);

  // ---------- la peça de la fornícula ----------
  let tok = 0;
  function peca(src, omple) {
    const my = ++tok, im = new Image(); im.decoding = 'async';
    im.onload = () => { if (my !== tok) return; const Wc = 768, Hc = 1024; tk.globalCompositeOperation = 'source-over'; tk.fillStyle = PAPER; tk.fillRect(0, 0, Wc, Hc);
      const ri = im.width / im.height, rc = Wc / Hc;
      if (omple) { let w, h; if (ri > rc) { h = Hc; w = h * ri; } else { w = Wc; h = w / ri; } tk.drawImage(im, (Wc - w) / 2, (Hc - h) / 2, w, h); }
      else { const pw = Wc * .84, ph = Hc * .82; let w, h; if (ri > pw / ph) { w = pw; h = w / ri; } else { h = ph; w = h * ri; }
        tk.globalCompositeOperation = 'multiply'; tk.drawImage(im, (Wc - w) / 2, Hc * .96 - h - (ph - h) * .35, w, h); tk.globalCompositeOperation = 'source-over'; }
      tex.needsUpdate = true; canvia = 1; arrenca(); };
    im.src = src;
  }
  let canvia = 0;
  function encen(n) { espelmes.forEach((e, i) => { const on = i < n; if (on && !e.on) { e.fl.visible = true; e.t = 0; } e.on = on; if (!on) e.fl.visible = false; }); arrenca(); }
  // espelmes que s'encenen en ordre alternat (esquerra/dreta)
  const ordre = [2, 3, 1, 4, 0, 5]; const espOrd = ordre.map(i => espelmes[i]); espelmes.length = 0; espelmes.push(...espOrd);

  // ---------- càmera, mida i interacció ----------
  let w = 0, h = 0;
  function size() { w = host.clientWidth; h = host.clientHeight; if (!w || !h) return; renderer.setSize(w, h, false); camera.aspect = w / h;
    const fw = 9.2, fh = 9.0, t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)); camera.userData.d = Math.max(fh / 2 / t, fw / 2 / t / camera.aspect) * 1.02;
    camera.updateProjectionMatrix(); mats.forEach(m => m.resolution.set(w, h)); arrenca(); }
  new ResizeObserver(size).observe(host);
  let px = 0, py = 0, tx = 0, ty = 0;
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); tx = ((e.clientX - r.left) / r.width - .5); ty = ((e.clientY - r.top) / r.height - .5); arrenca(); }, { passive: true });
  host.addEventListener('pointerleave', () => { tx = 0; ty = 0; });
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  host.addEventListener('click', e => { const r = host.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera); if (ray.intersectObject(fons).length) opts.onNiche && opts.onNiche(); });
  host.addEventListener('pointermove', e => { const r = host.getBoundingClientRect(); v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera); host.style.cursor = ray.intersectObject(fons).length ? 'pointer' : ''; }, { passive: true });

  let vis = false, raf = 0, t = 0, last = 0;
  new IntersectionObserver(([e]) => { vis = e.isIntersecting; if (vis) arrenca(); }, { rootMargin: '100px' }).observe(host);
  function arrenca() { if (!raf && vis) { last = performance.now(); raf = requestAnimationFrame(frame); } }
  function frame(now) {
    raf = 0; const dt = Math.min(.05, (now - last) / 1000); last = now; t += dt;
    px += (tx - px) * .06; py += (ty - py) * .06;
    const sway = reduce ? 0 : Math.sin(t * .35) * .025;
    const d = camera.userData.d || 30, ay = -px * .32 + sway, ax = py * .12 - .04;
    camera.position.set(Math.sin(ay) * d, 1.9 + Math.sin(ax) * d, Math.cos(ay) * d); camera.lookAt(0, 1.75, 0);
    let enceses = 0;
    for (const e of espelmes) { if (!e.on) continue; enceses++; e.t = Math.min(1, (e.t || 0) + dt * 2.5); e.f += dt;
      const fl = reduce ? 1 : 1 + Math.sin(e.f * 13) * .06 + Math.sin(e.f * 23.7) * .05 + (Math.random() - .5) * .05;
      e.fl.scale.set(e.t * (1 - (fl - 1) * .6), e.t * fl, e.t); e.fl.rotation.z = reduce ? 0 : Math.sin(e.f * 3.1) * .08; e.halo.material.opacity = .75 * e.t * fl; }
    res.material.opacity += ((enceses / espelmes.length) * .9 - res.material.opacity) * .08;
    if (canvia > 0) canvia = Math.max(0, canvia - dt * 2);
    renderer.render(scene, camera);
    const quiet = Math.abs(tx - px) < .002 && Math.abs(ty - py) < .002;
    if (vis && (!reduce || !quiet || enceses)) raf = requestAnimationFrame(frame);
  }
  size();
  return { peca, encen };
}
