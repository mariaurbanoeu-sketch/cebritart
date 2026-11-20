// La revista en 3D: es gira arrossegant i s'obri amb un clic. Mateix traç de tinta que la grúa.
import * as THREE from './three.module.min.js';
import { LineSegments2 } from './lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lines/LineSegmentsGeometry.js';
import { LineMaterial } from './lines/LineMaterial.js';

export function revista(host, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const INK = '#2f4b7c', SOFT = '#7f9cc4', PAPER = '#fbf8f1';
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, matchMedia('(pointer: coarse)').matches ? 1.5 : 2));
  renderer.setClearColor(0, 0);
  renderer.domElement.className = 'rv-canvas';
  host.appendChild(renderer.domElement);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(30, 1, .1, 100);
  camera.position.set(0, .2, 8); camera.lookAt(0, 0, 0);

  const mats = [];
  const lm = (c, w) => { const m = new LineMaterial({ color: c, linewidth: w }); mats.push(m); return m; };
  const mInk = lm(INK, 1.6), mSoft = lm(SOFT, 1);
  function lines(segs, mat) {
    const a = []; for (const [p, q] of segs) a.push(...p, ...q);
    const g = new LineSegmentsGeometry(); g.setPositions(a); const l = new LineSegments2(g, mat); l.frustumCulled = false; return l;
  }

  const W = 2.1, H = 2.97, T = .07, N = 28;
  const mag = new THREE.Group(); scene.add(mag);
  const book = new THREE.Group(); mag.add(book);
  const loader = new THREE.TextureLoader();
  const tex = (src) => { const t = loader.load(src, () => dirty = true); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };

  // bloc de pàgines
  const paperMat = new THREE.MeshBasicMaterial({ color: PAPER, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const block = new THREE.Mesh(new THREE.BoxGeometry(W - .02, H - .03, T), paperMat);
  block.position.set(W / 2, 0, -T / 2); book.add(block);
  const be = [], x0 = 0, x1 = W - .02, y0 = -H / 2 + .015, y1 = H / 2 - .015;
  be.push([[x0, y0, 0], [x1, y0, 0]], [[x0, y1, 0], [x1, y1, 0]], [[x1, y0, 0], [x1, y1, 0]], [[x0, y0, -T], [x1, y0, -T]], [[x0, y1, -T], [x1, y1, -T]], [[x1, y0, -T], [x1, y1, -T]], [[x1, y0, 0], [x1, y0, -T]], [[x1, y1, 0], [x1, y1, -T]], [[x0, y0, 0], [x0, y0, -T]], [[x0, y1, 0], [x0, y1, -T]]);
  const fe = []; for (let k = 1; k < 7; k++) { const z = -T * k / 7; fe.push([[x1, y0, z], [x1, y1, z]], [[x0 + .2, y1, z], [x1, y1, z]]); }
  book.add(lines(be, mInk)); book.add(lines(fe, mSoft));
  // primera pàgina (es veu en obrir)
  const pageMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const page = new THREE.Mesh(new THREE.PlaneGeometry(W - .06, H - .06), pageMat);
  page.position.set(W / 2, 0, .002); book.add(page);
  // contraportada
  const backMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const back = new THREE.Mesh(new THREE.PlaneGeometry(W, H), backMat);
  back.position.set(W / 2, 0, -T - .002); back.rotation.y = Math.PI; book.add(back);
  book.add(lines([[[0, -H / 2, -T - .003], [W, -H / 2, -T - .003]], [[0, H / 2, -T - .003], [W, H / 2, -T - .003]], [[W, -H / 2, -T - .003], [W, H / 2, -T - .003]], [[0, -H / 2, -T - .003], [0, H / 2, -T - .003]]], mInk));

  // la portada: una tira de N trossos que es corba en obrir-se
  function stripGeo(flip) {
    const g = new THREE.BufferGeometry(), pos = new Float32Array((N + 1) * 2 * 3), uv = new Float32Array((N + 1) * 2 * 2), idx = [];
    for (let i = 0; i <= N; i++) { const u = i / N; uv.set([flip ? 1 - u : u, 0, flip ? 1 - u : u, 1], i * 4); if (i < N) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setIndex(idx); return g;
  }
  const gF = stripGeo(false), gB = stripGeo(true);
  const frontMat = new THREE.MeshBasicMaterial({ color: '#ffffff', side: THREE.FrontSide });
  const inMat = new THREE.MeshBasicMaterial({ side: THREE.BackSide });
  const cover = new THREE.Group(); cover.position.z = .006; book.add(cover);
  cover.add(new THREE.Mesh(gF, frontMat)); cover.add(new THREE.Mesh(gB, inMat));
  const coverLine = lines([[[0, 0, 0], [1, 0, 0]]], mInk); cover.add(coverLine);

  // interior de la portada: crèdits a tinta
  const ic = document.createElement('canvas'); ic.width = 512; ic.height = 724; const ix = ic.getContext('2d');
  const inTex = new THREE.CanvasTexture(ic); inTex.colorSpace = THREE.SRGBColorSpace; inMat.map = inTex;
  const firma = new Image(); firma.src = 'assets/brand/firma.svg'; firma.onload = () => { if (cur) interior(cur); };
  function interior(t) {
    ix.fillStyle = PAPER; ix.fillRect(0, 0, 512, 724); ix.fillStyle = INK; ix.textAlign = 'left';
    ix.font = 'italic 44px "Instrument Serif", Georgia, serif'; ix.fillText(t.titol || '', 56, 120);
    ix.font = '20px Poppins, system-ui, sans-serif'; ix.fillStyle = '#6a7fa3'; ix.fillText(t.sub || '', 56, 160);
    if (firma.complete && firma.naturalWidth) ix.drawImage(firma, 56, 470, 220, 100);
    ix.fillStyle = INK; ix.font = '20px Poppins, system-ui, sans-serif'; ix.fillText(t.credit || 'Il·lustració: Miguel Ruiz', 56, 640);
    ix.font = 'italic 26px "Instrument Serif", Georgia, serif'; ix.fillText('@cebritart', 56, 676);
    inTex.needsUpdate = true;
  }

  // ombra suau
  const sc = document.createElement('canvas'); sc.width = sc.height = 128; const sx = sc.getContext('2d');
  const gr = sx.createRadialGradient(64, 64, 4, 64, 64, 64); gr.addColorStop(0, 'rgba(60,45,20,.35)'); gr.addColorStop(1, 'rgba(60,45,20,0)'); sx.fillStyle = gr; sx.fillRect(0, 0, 128, 128);
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(W * 2.6, H * .5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
  shadow.rotation.x = -Math.PI / 2; shadow.position.y = -H / 2 - .25; scene.add(shadow);

  // ---------- estat ----------
  let open = 0, openGoal = 0, rotY = .38, rotX = -.12, goalY = .38, goalX = -.12, drag = null, dirty = true, t = 0, swap = 0, pending = null, visible = true, raf = 0;
  function layCover() {
    const pf = gF.attributes.position.array, pb = gB.attributes.position.array, th = open * Math.PI, L = W / N, curl = .55 * Math.sin(th);
    let x = 0, z = 0; const top = [], bot = [];
    for (let i = 0; i <= N; i++) {
      const u = i / N;
      pf.set([x, -H / 2, z, x, H / 2, z], i * 6); pb.set([x, -H / 2, z + .001, x, H / 2, z + .001], i * 6);
      top.push([x, H / 2, z]); bot.push([x, -H / 2, z]);
      const a = th - curl * u; x += L * Math.cos(a); z += L * Math.sin(a);
    }
    gF.attributes.position.needsUpdate = gB.attributes.position.needsUpdate = true; gF.computeBoundingSphere(); gB.computeBoundingSphere();
    const segs = []; for (let i = 0; i < N; i++) segs.push([top[i], top[i + 1]], [bot[i], bot[i + 1]]);
    segs.push([top[N], bot[N]], [top[0], bot[0]]);
    const a = []; for (const [p, q] of segs) a.push(...p, ...q); coverLine.geometry.setPositions(a);
  }
  function layout() {
    const r = host.getBoundingClientRect(), w = Math.max(1, r.width), h = Math.max(1, r.height);
    renderer.setSize(w, h, false); renderer.domElement.style.width = w + 'px'; renderer.domElement.style.height = h + 'px';
    camera.aspect = w / h; camera.position.z = 8 * Math.max(1, 1.25 / camera.aspect); camera.updateProjectionMatrix();
    for (const m of mats) m.resolution.set(w, h); dirty = true; frame(0);
  }
  function frame(dt) {
    t += dt;
    const k = 1 - Math.pow(.004, dt);
    open += (openGoal - open) * (reduce ? 1 : 1 - Math.pow(.02, dt));
    if (!drag) { goalY += (( .38 + Math.sin(t * .5) * .08 * (1 - open)) - goalY) * .02; goalX += (-.12 - goalX) * .02; }
    rotY += (goalY - rotY) * k; rotX += (goalX - rotX) * k;
    // en obrir, centrem el doble full
    const cx = -W / 2 * (1 - open) + 0;
    if (swap > 0) { swap = Math.max(0, swap - dt * 1.6); if (pending && swap < .5) { apply(pending); pending = null; } }
    const out = swap > 0 ? Math.sin(swap * Math.PI) : 0;
    book.position.set(cx, out * -4.2, 0);
    mag.rotation.set(rotX - out * .5, rotY - open * .32, 0);
    shadow.position.x = cx * .2; shadow.material.opacity = 1 - out;
    layCover(); renderer.render(scene, camera);
  }
  function tick(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(.05, (now - (tick.l || now)) / 1000); tick.l = now;
    frame(dt); raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf) raf = requestAnimationFrame(tick); };
  function apply(r) {
    frontMat.map = tex(r.front); frontMat.needsUpdate = true;
    backMat.map = tex(r.back || r.front); backMat.needsUpdate = true;
    pageMat.map = tex(r.inside || r.back || r.front); pageMat.needsUpdate = true;
    interior(r);
  }

  // ---------- gestos ----------
  const el = renderer.domElement;
  el.style.touchAction = 'pan-y';
  el.addEventListener('pointerdown', (e) => { drag = { x: e.clientX, y: e.clientY, gy: goalY, gx: goalX, moved: false, id: e.pointerId }; });
  addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (Math.abs(dx) + Math.abs(dy) > 5) { drag.moved = true; if (e.pointerType === 'mouse' || Math.abs(dx) > Math.abs(dy)) { try { el.setPointerCapture(e.pointerId); } catch (_) {} } }
    goalY = Math.max(-2.6, Math.min(3.4, drag.gy + dx * .01)); goalX = Math.max(-.7, Math.min(.5, drag.gx + dy * .006));
  });
  addEventListener('pointerup', (e) => { if (!drag || e.pointerId !== drag.id) return; const m = drag.moved; drag = null; if (!m) toggle(); });
  addEventListener('pointercancel', () => { drag = null; });
  function toggle() { openGoal = openGoal ? 0 : 1; if (openGoal && Math.abs(goalY) > 1.2) goalY = .3; opts.onToggle && opts.onToggle(!!openGoal); }
  el.tabIndex = 0; el.setAttribute('role', 'button'); el.setAttribute('aria-label', opts.label || 'Obri o tanca la revista');
  el.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } if (e.key === 'ArrowLeft') goalY -= .4; if (e.key === 'ArrowRight') goalY += .4; });

  new ResizeObserver(layout).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(host);
  if (document.fonts) document.fonts.ready.then(() => { if (cur) interior(cur); });
  let cur = null;
  layout(); run();
  return {
    show(r) { const first = !cur; cur = r; if (first || reduce) { apply(r); } else { openGoal = 0; pending = r; swap = 1; } run(); },
    toggle
  };
}
