// La grúa de la nau: torre dibuixada a tinta en 3D, amb la zebra penjada del ganxo.
import * as THREE from './three.module.min.js';
import { LineSegments2 } from './lines/LineSegments2.js';
import { LineSegmentsGeometry } from './lines/LineSegmentsGeometry.js';
import { LineMaterial } from './lines/LineMaterial.js';
import { focs, skyline, sfx } from './focs.js';

export function grua(host, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const css = getComputedStyle(document.documentElement);
  const col = (v, f) => (css.getPropertyValue(v).trim() || f);
  const C = {
    ink: col('--ink', '#2f4b7c'), soft: col('--line', '#7f9cc4'),
    paper: col('--paper', '#fdfdfb'), beix: col('--beix', '#c6b594'), beixP: col('--beix-paper', '#f4efe4')
  };

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.domElement.className = 'grua-canvas';
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 400);

  // ---------- materials ----------
  const mats = [], toonLines = [];
  const lm = (color, w) => { const m = new LineMaterial({ color, linewidth: w, worldUnits: false }); mats.push(m); return m; };
  const mInk = lm(C.ink, 1.7), mBrace = lm(C.soft, 1.15), mCable = lm(C.ink, 1.3);
  const fill = (c) => new THREE.MeshBasicMaterial({ color: c, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const fPaper = fill(C.paper), fBeix = fill(C.beixP), fBeixD = fill(C.beix);

  // trazo a mà: un tremolor mínim als vèrtexs
  let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647 - .5);
  const J = .018;
  function lines(segs, mat, jit = true) {
    const a = [];
    for (const [p, q] of segs) a.push(p[0] + (jit ? rnd() * J : 0), p[1] + (jit ? rnd() * J : 0), p[2] + (jit ? rnd() * J : 0), q[0] + (jit ? rnd() * J : 0), q[1] + (jit ? rnd() * J : 0), q[2] + (jit ? rnd() * J : 0));
    const g = new LineSegmentsGeometry(); g.setPositions(a);
    const l = new LineSegments2(g, mat); l.computeLineDistances(); return l;
  }
  function solid(geo, f, parent, pos, rot) {
    const m = new THREE.Mesh(geo, f); if (pos) m.position.set(...pos); if (rot) m.rotation.set(...rot);
    const e = new THREE.EdgesGeometry(geo, 20), p = e.attributes.position.array, segs = [];
    for (let i = 0; i < p.length; i += 6) segs.push([[p[i], p[i + 1], p[i + 2]], [p[i + 3], p[i + 4], p[i + 5]]]);
    const l = lines(segs, mInk); m.add(l); parent.add(m); return m;
  }

  const crane = new THREE.Group(); scene.add(crane);

  // ---------- base ----------
  solid(new THREE.BoxGeometry(3, .7, 3), fBeix, crane, [0, .35, 0]);
  solid(new THREE.BoxGeometry(1.7, .25, 1.7), fBeixD, crane, [0, .82, 0]);

  // ---------- màstil (gelosia quadrada) ----------
  const H = 12.6, w = .62, step = 1.05, ch = [], br = [];
  const cn = [[-w, -w], [w, -w], [w, w], [-w, w]];
  for (const [x, z] of cn) ch.push([[x, .95, z], [x, H, z]]);
  let k = 0;
  for (let y = .95; y < H - .01; y += step, k++) {
    const y2 = Math.min(y + step, H);
    for (let i = 0; i < 4; i++) {
      const a = cn[i], b = cn[(i + 1) % 4];
      br.push([[a[0], y, a[1]], [b[0], y, b[1]]]);
      if (k % 2) br.push([[a[0], y, a[1]], [b[0], y2, b[1]]]); else br.push([[b[0], y, b[1]], [a[0], y2, a[1]]]);
    }
  }
  crane.add(lines(ch, mInk)); crane.add(lines(br, mBrace));
  // escaleta interior
  const esc = [[[-.18, 1, -.45], [-.18, H, -.45]], [[.18, 1, -.45], [.18, H, -.45]]];
  for (let y = 1.2; y < H; y += .35) esc.push([[-.18, y, -.45], [.18, y, -.45]]);
  crane.add(lines(esc, mBrace));

  // ---------- part giratòria ----------
  const top = new THREE.Group(); top.position.y = H; crane.add(top);
  solid(new THREE.CylinderGeometry(.85, .85, .32, 18), fPaper, top, [0, .16, 0]);
  // cabina
  const cab = solid(new THREE.BoxGeometry(1.15, 1.05, 1.05), fPaper, top, [.15, .1, 1.25]);
  cab.add(lines([[[-.45, .05, .53], [.45, .05, .53]], [[-.45, .05, .53], [-.45, .42, .53]], [[.45, .05, .53], [.45, .42, .53]], [[-.45, .42, .53], [.45, .42, .53]], [[-.58, .05, .3], [-.58, .42, .3]], [[-.58, .42, -.3], [-.58, .42, .3]], [[-.58, .05, -.3], [-.58, .42, -.3]]], mInk));

  // torreta (punta)
  const ay = 3.6, base4 = [[-.6, .32, -.6], [.6, .32, -.6], [.6, .32, .6], [-.6, .32, .6]], ap = [0, ay, 0];
  const tor = base4.map(p => [p, ap]);
  for (let i = 0; i < 4; i++) { const a = base4[i], b = base4[(i + 1) % 4]; tor.push([a, b]);
    const t = .45, ma = [a[0] * (1 - t), a[1] + (ay - a[1]) * t, a[2] * (1 - t)], mb = [b[0] * (1 - t), b[1] + (ay - b[1]) * t, b[2] * (1 - t)]; tor.push([ma, mb], [a, mb]); }
  top.add(lines(tor, mInk));

  // ploma (secció triangular)
  const L = 17, zb = .48, yb = .32, yt = 1.35, jc = [], jb = [];
  const tip = (x) => 1 - Math.max(0, (x - (L - 3)) / 3) * .7;
  for (let x = .6; x < L - .01; x += 1) {
    const x2 = Math.min(x + 1, L), s1 = tip(x), s2 = tip(x2);
    const A = [x, yb, -zb], B = [x, yb, zb], T = [x, yb + (yt - yb) * s1, 0];
    const A2 = [x2, yb, -zb], B2 = [x2, yb, zb], T2 = [x2, yb + (yt - yb) * s2, 0];
    jc.push([A, A2], [B, B2], [T, T2]);
    jb.push([A, B], [A, T], [B, T], [A, T2], [B, T2], [A, B2]);
  }
  const E = [L, yb, 0]; jb.push([[L, yb, -zb], [L, yb, zb]]);
  top.add(lines(jc, mInk)); top.add(lines(jb, mBrace));
  // contraploma
  const CL = 6.2, cc = [], cb = [];
  cc.push([[-.6, yb, -zb], [-CL, yb, -zb]], [[-.6, yb, zb], [-CL, yb, zb]], [[-CL, yb, -zb], [-CL, yb, zb]]);
  for (let x = -.6; x > -CL; x -= 1) cb.push([[x, yb, -zb], [x, yb, zb]], [[x, yb, -zb], [Math.max(x - 1, -CL), yb, zb]]);
  // barana
  cc.push([[-.6, yb + .55, zb], [-CL + .9, yb + .55, zb]]);
  for (let x = -.6; x >= -CL + .9; x -= 1.1) cb.push([[x, yb, zb], [x, yb + .55, zb]]);
  top.add(lines(cc, mInk)); top.add(lines(cb, mBrace));
  for (let i = 0; i < 3; i++) solid(new THREE.BoxGeometry(.42, 1.5, 1.05), i === 1 ? fBeixD : fBeix, top, [-CL + .35 + i * .46, -.42, 0]);
  // tirants
  top.add(lines([[ap, [L * .48, yt, 0]], [ap, [L * .82, yb + (yt - yb) * tip(L * .82), 0]], [ap, [-CL + .3, yb, -zb]], [ap, [-CL + .3, yb, zb]]], mInk));
  // banderola valenciana a la punta
  const flag = new THREE.Group(); flag.position.set(L - .1, yb, 0); top.add(flag);
  flag.add(lines([[[0, 0, 0], [0, 1.1, 0]]], mInk));
  const fc = document.createElement('canvas'); fc.width = 90; fc.height = 60; const fx = fc.getContext('2d');
  fx.fillStyle = '#f2c94c'; fx.fillRect(0, 0, 90, 60); fx.fillStyle = '#c3272b'; for (let i = 0; i < 4; i++) fx.fillRect(0, (2 * i + 1) * 60 / 9, 90, 60 / 9);
  fx.fillStyle = '#3a63a8'; fx.fillRect(0, 0, 22, 60);
  const flagMesh = new THREE.Mesh(new THREE.PlaneGeometry(.75, .5, 6, 1), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(fc), side: THREE.DoubleSide }));
  flagMesh.position.set(.38, .82, 0); flag.add(flagMesh);
  const fpos = flagMesh.geometry.attributes.position, f0 = Float32Array.from(fpos.array);

  // carro
  const trolley = new THREE.Group(); top.add(trolley);
  solid(new THREE.BoxGeometry(.75, .22, 1.1), fPaper, trolley, [0, yb - .14, 0]);

  // cable + ganxo + zebra (en coordenades de top)
  const cable = lines([[[0, 0, 0], [0, -1, 0]], [[0, 0, 0], [0, -1, 0]]], mCable, false);
  cable.frustumCulled = false; top.add(cable);
  const hook = new THREE.Group(); top.add(hook);
  solid(new THREE.BoxGeometry(.5, .55, .32), fBeix, hook, [0, -.28, 0]);
  const hk = []; for (let i = 0; i <= 12; i++) { const a = Math.PI * 1.15 * (i / 12) - .1, b = Math.PI * 1.15 * ((i + 1) / 12) - .1;
    if (i < 12) hk.push([[Math.sin(a) * .2, -.78 - (1 - Math.cos(a)) * .2 + .2, 0], [Math.sin(b) * .2, -.78 - (1 - Math.cos(b)) * .2 + .2, 0]]); }
  hk.push([[0, -.55, 0], [0, -.6, 0]]); hook.add(lines(hk, mInk, false));
  // la zebra: cartell penjat amb dos eslingues
  const zebra = new THREE.Group(); hook.add(zebra);
  const ZW = 4.4, ZH = ZW * 1271 / 1200, zy = -1.15;
  const tex = new THREE.TextureLoader().load(opts.logo || 'assets/brand/logo-cebritart.webp', () => draw());
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  const zmesh = new THREE.Mesh(new THREE.PlaneGeometry(ZW, ZH), new THREE.MeshBasicMaterial({ map: tex, transparent: true, side: THREE.DoubleSide, alphaTest: .02 }));
  const ZT = zy - .12; zmesh.position.y = ZT - ZH / 2; zebra.add(zmesh);
  // les eslingues baixen fins a tocar el dibuix (la crinera), no el buit transparent de la imatge
  const esL = [(.36 - .5) * ZW, ZT - .06 * ZH, .01], esR = [(.66 - .5) * ZW, ZT - .05 * ZH, .01];
  zebra.add(lines([[[0, -.72, 0], esL], [[0, -.72, 0], esR]], mCable, false));
  // dos nusets on l'eslinga agafa el logo
  for (const [x, y] of [esL, esR]) { const n = new THREE.Mesh(new THREE.CircleGeometry(.07, 12), new THREE.MeshBasicMaterial({ color: C.ink })); n.position.set(x, y, .02); zebra.add(n); toonLines.push({ material: n.material }); }


  // ---------- carret de bunyols ----------
  const cart = new THREE.Group(); cart.visible = false; // el carret de bunyols ja no s'hi mostra
  solid(new THREE.BoxGeometry(2.6, 1.05, 1.25), fPaper, cart, [0, 1.02, 0]);
  solid(new THREE.BoxGeometry(3.0, .12, 1.45), fBeix, cart, [0, 1.6, 0]);
  // tauletes del frontal
  cart.add(lines([[[-1.3, .62, .63], [1.3, .62, .63]], [[-.43, .5, .63], [-.43, 1.54, .63]], [[.43, .5, .63], [.43, 1.54, .63]]], mBrace));
  // rodes
  function roda(x, z) {
    const g = [], R = .44, n = 22;
    for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, b = (i + 1) / n * Math.PI * 2;
      g.push([[x + Math.cos(a) * R, .46 + Math.sin(a) * R, z], [x + Math.cos(b) * R, .46 + Math.sin(b) * R, z]]); }
    for (let i = 0; i < 6; i++) { const a = i / 6 * Math.PI; g.push([[x + Math.cos(a) * R, .46 + Math.sin(a) * R, z], [x - Math.cos(a) * R, .46 - Math.sin(a) * R, z]]); }
    cart.add(lines(g, mInk));
  }
  roda(-.75, .66); roda(.75, .66); roda(-.75, -.66); roda(.75, -.66);
  // vares per a empényer
  cart.add(lines([[[1.3, 1.2, .45], [2.35, 1.45, .45]], [[1.3, 1.2, -.45], [2.35, 1.45, -.45]], [[2.35, 1.45, .45], [2.35, 1.45, -.45]]], mInk));
  // pals i tendal de ratlles
  cart.add(lines([[[-1.35, 1.66, .6], [-1.35, 3.25, .6]], [[1.35, 1.66, .6], [1.35, 3.25, .6]], [[-1.35, 1.66, -.6], [-1.35, 3.55, -.6]], [[1.35, 1.66, -.6], [1.35, 3.55, -.6]]], mInk));
  const tc = document.createElement('canvas'); tc.width = 256; tc.height = 64; const tx = tc.getContext('2d');
  for (let i = 0; i < 8; i++) { tx.fillStyle = i % 2 ? '#fbf6ea' : '#c3272b'; tx.fillRect(i * 32, 0, 32, 64); }
  const tTex = new THREE.CanvasTexture(tc); tTex.colorSpace = THREE.SRGBColorSpace;
  const tendalMat = new THREE.MeshBasicMaterial({ map: tTex, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 1, polygonOffsetUnits: 1 });
  const tendal = new THREE.Mesh(new THREE.PlaneGeometry(3.1, 1.55), tendalMat);
  tendal.position.set(0, 3.42, 0); tendal.rotation.x = -Math.PI / 2 + .2; cart.add(tendal);
  const fr = []; // vora festonejada
  for (let i = 0; i < 8; i++) { const x0 = -1.55 + i * 3.1 / 8, x1 = x0 + 3.1 / 8;
    for (let k = 0; k < 6; k++) { const a = k / 6 * Math.PI, b = (k + 1) / 6 * Math.PI, xm = (x0 + x1) / 2, r = (x1 - x0) / 2;
      fr.push([[xm - Math.cos(a) * r, 3.27 - Math.sin(a) * .16, .77], [xm - Math.cos(b) * r, 3.27 - Math.sin(b) * .16, .77]]); } }
  fr.push([[-1.55, 3.27, .77], [1.55, 3.27, .77]], [[-1.55, 3.27, .77], [-1.55, 3.58, -.75]], [[1.55, 3.27, .77], [1.55, 3.58, -.75]], [[-1.55, 3.58, -.75], [1.55, 3.58, -.75]]);
  cart.add(lines(fr, mInk));
  // rètol
  const rc = document.createElement('canvas'); rc.width = 512; rc.height = 128; const rx = rc.getContext('2d');
  const retol = () => { rx.fillStyle = '#fdfbf4'; rx.fillRect(0, 0, 512, 128); rx.fillStyle = C.ink === '#f1e6cb' ? '#2f4b7c' : '#2f4b7c';
    rx.font = 'italic 84px "Instrument Serif", Georgia, serif'; rx.textAlign = 'center'; rx.textBaseline = 'middle'; rx.fillText('Bunyols', 256, 66); rTex.needsUpdate = true; };
  const rTex = new THREE.CanvasTexture(rc); rTex.colorSpace = THREE.SRGBColorSpace;
  const rMesh = new THREE.Mesh(new THREE.PlaneGeometry(2.0, .5), new THREE.MeshBasicMaterial({ map: rTex, polygonOffset: true, polygonOffsetFactor: 1 }));
  rMesh.position.set(0, 1.0, .64); cart.add(rMesh);
  rMesh.add(lines([[[-1, -.25, .01], [1, -.25, .01]], [[1, -.25, .01], [1, .25, .01]], [[1, .25, .01], [-1, .25, .01]], [[-1, .25, .01], [-1, -.25, .01]]], mInk, false));
  retol(); if (document.fonts) document.fonts.ready.then(retol);
  // la calderà i els bunyols
  solid(new THREE.CylinderGeometry(.42, .36, .42, 16, 1, true), fBeixD, cart, [-.75, 1.87, 0]);
  const plat = solid(new THREE.CylinderGeometry(.55, .55, .05, 20), fPaper, cart, [.55, 1.69, 0]);
  const bunyol = new THREE.TorusGeometry(.17, .075, 8, 16);
  [[.4, 1.78, .12], [.7, 1.78, -.08], [.5, 1.78, -.25], [.55, 1.92, -.02], [.78, 1.78, .22]].forEach(([x, y, z], i) => {
    const b = new THREE.Mesh(bunyol, fBeixD); b.position.set(x, y, z); b.rotation.set(Math.PI / 2 + (i % 2 ? .25 : -.2), 0, i * .7); cart.add(b);
    const e = new THREE.EdgesGeometry(bunyol, 50); const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: C.ink })); b.add(l); toonLines.push(l);
  });
  // bombetes del tendal (de nit s'encenen)
  const bulbPos = []; for (let i = 0; i < 9; i++) bulbPos.push(new THREE.Vector3(-1.5 + i * 3 / 8, 3.12 - Math.sin(i / 8 * Math.PI) * .12, .78));
  const bulbMat = new THREE.MeshBasicMaterial({ color: '#6d6450' });
  bulbPos.forEach(v => { const m = new THREE.Mesh(new THREE.SphereGeometry(.06, 8, 6), bulbMat); m.position.copy(v); cart.add(m); });

  // ---------- València de nit i focs (mòdul compartit) ----------
  const city = skyline(38); city.visible = false; scene.add(city);
  city.position.set(9, -.3, -34); const mCity = { color: new THREE.Color() }, mCity2 = mCity;
  const F = focs(scene, camera); const { emit, R3, PAL, pick, tipusList } = F; const pMat = F.material;
  let nit = false;
  function show(dt) {
    F.update(dt); mascUpdate(dt); if (nit) city.userData.llum(F.flash);
    // el carret: les bombetes parpellegen i el bunyol fa vapor
    if (nit) bulbMat.color.setRGB(1, .9 - Math.sin(st.t * 7) * .04, .62);
    if (cart.visible && nit && Math.random() < .35) emit(-.75 + (Math.random() - .5) * .4 + cart.position.x, 2.1 + cart.position.y, cart.position.z + (Math.random() - .5) * .3, (Math.random() - .5) * .25, .7, 0, nit ? [.32, .3, .3] : [0, 0, 0], 1.8, .9, 5);
  }


  // ---------- la mascletà (de dia, en carregar) ----------
  const fumN = 900, fPos = new Float32Array(fumN * 3), fCol = new Float32Array(fumN * 4), fSize = new Float32Array(fumN), fVel = new Float32Array(fumN * 3), fLife = new Float32Array(fumN), fMax = new Float32Array(fumN), fBase = new Float32Array(fumN), fKind = new Uint8Array(fumN), fA0 = new Float32Array(fumN);
  let fN = 0;
  const fg = new THREE.BufferGeometry();
  fg.setAttribute('position', new THREE.BufferAttribute(fPos, 3)); fg.setAttribute('rgba', new THREE.BufferAttribute(fCol, 4)); fg.setAttribute('size', new THREE.BufferAttribute(fSize, 1));
  const fMat = new THREE.ShaderMaterial({ uniforms: { uScale: { value: 1000 } }, transparent: true, depthWrite: false,
    vertexShader: `attribute float size; attribute vec4 rgba; varying vec4 vC; uniform float uScale; void main(){ vC = rgba; vec4 mv = modelViewMatrix * vec4(position,1.); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec4 vC; void main(){ float r = length(gl_PointCoord - .5); if (r > .5) discard; float a = smoothstep(.5, .1, r) * vC.a; gl_FragColor = vec4(vC.rgb, a); }` });
  const fum = new THREE.Points(fg, fMat); fum.frustumCulled = false; fum.renderOrder = 2; scene.add(fum);
  function fumet(x, y, z, vx, vy, vz, c, a, life, size, kind) { if (fN >= fumN) return; const i = fN++;
    fPos.set([x, y, z], i * 3); fVel.set([vx, vy, vz], i * 3); fCol.set([c[0], c[1], c[2], a], i * 4); fA0[i] = a; fLife[i] = 0; fMax[i] = life; fSize[i] = fBase[i] = size; fKind[i] = kind; }
  function fumUpdate(dt) {
    for (let i = 0; i < fN; i++) { fLife[i] += dt; const t = fLife[i] / fMax[i];
      if (t >= 1) { const j = --fN; if (i !== j) { fPos.copyWithin(i * 3, j * 3, j * 3 + 3); fVel.copyWithin(i * 3, j * 3, j * 3 + 3); fCol.copyWithin(i * 4, j * 4, j * 4 + 4); fLife[i] = fLife[j]; fMax[i] = fMax[j]; fBase[i] = fBase[j]; fKind[i] = fKind[j]; fA0[i] = fA0[j]; } i--; continue; }
      const k = fKind[i], dr = k === 0 ? 1.6 : k === 1 ? 6 : .6, f = Math.exp(-dr * dt);
      fVel[i * 3] = fVel[i * 3] * f + (k === 0 ? .25 * dt : 0); fVel[i * 3 + 1] = fVel[i * 3 + 1] * f + (k === 0 ? .35 * dt : k === 2 ? -6 * dt : 0); fVel[i * 3 + 2] *= f;
      fPos[i * 3] += fVel[i * 3] * dt; fPos[i * 3 + 1] += fVel[i * 3 + 1] * dt; fPos[i * 3 + 2] += fVel[i * 3 + 2] * dt;
      if (k === 0) { fSize[i] = fBase[i] * (1 + Math.sqrt(t) * 2.4); fCol[i * 4 + 3] = fA0[i] * Math.min(1, t * 8) * (1 - t); }
      else if (k === 1) { fSize[i] = fBase[i] * (1 + t * 1.5); fCol[i * 4 + 3] = fA0[i] * (1 - t); }
      else { fCol[i * 4 + 3] = fA0[i] * (1 - t); }
    }
    fg.setDrawRange(0, fN); fg.attributes.position.needsUpdate = fg.attributes.rgba.needsUpdate = fg.attributes.size.needsUpdate = true;
  }
  // la corda amb els trons penjats
  const masc = new THREE.Group(); scene.add(masc);
  const CX0 = -3.5, CX1 = 9.5, CY = 5.2, CZ = -7, NP = 22;
  const cordY = (x) => { const u = (x - CX0) / (CX1 - CX0); return CY - Math.sin(u * Math.PI) * .9; };
  const cs = []; for (let i = 0; i < 40; i++) { const xa = CX0 + (CX1 - CX0) * i / 40, xb = CX0 + (CX1 - CX0) * (i + 1) / 40; cs.push([[xa, cordY(xa), CZ], [xb, cordY(xb), CZ]]); }
  cs.push([[CX0, 0, CZ], [CX0, CY + .3, CZ]], [[CX1, 0, CZ], [CX1, CY + .3, CZ]]);
  const trons = [], tronGeo = new THREE.CylinderGeometry(.11, .11, .36, 10), tronMats = ['#c3272b', '#f2c94c', '#3a63a8'].map(c => new THREE.MeshBasicMaterial({ color: c }));
  for (let i = 0; i < NP; i++) { const x = CX0 + .5 + (CX1 - CX0 - 1) * i / (NP - 1), y = cordY(x) - .55;
    cs.push([[x, cordY(x), CZ], [x, y + .18, CZ]]);
    const m = new THREE.Mesh(tronGeo, tronMats[i % 3]); m.position.set(x, y, CZ); masc.add(m);
    const e = new THREE.EdgesGeometry(tronGeo, 30); const l = new THREE.LineSegments(e, new THREE.LineBasicMaterial({ color: C.ink })); m.add(l); toonLines.push(l);
    trons.push({ m, x, y, on: true }); }
  const cordLines = lines(cs, mBrace, false); masc.add(cordLines);
  let mT = -1, metxa = 0, terra = false;
  const hero = opts.zone;
  const SENY = [[.76, .15, .17], [.95, .79, .3], [.23, .39, .66]]; let pc = 0;
  function peta(x, y, z, gran) {
    const c = SENY[pc++ % 3];
    // fum blanc amb un vel del color del tro
    for (let i = 0; i < (gran ? 10 : 6); i++) { const [a, b, d] = R3(); const tint = Math.random() < .45; fumet(x, y, z, a * 2.2, b * 1.6 + .6, d * .6, tint ? [.9 * .55 + c[0] * .45, .89 * .55 + c[1] * .45, .87 * .55 + c[2] * .45] : [.9, .89, .87], .6, 3.5 + Math.random() * 2.5, (gran ? 1.5 : 1) + Math.random() * .5, 0); }
    fumet(x, y, z, 0, 0, 0, c, .95, .18, gran ? 2.8 : 1.7, 1);
    fumet(x, y, z, 0, 0, 0, [1, .97, .85], 1, .08, gran ? 1.2 : .7, 1);
    // espurnes amb els tres colors de la senyera
    for (let i = 0; i < (gran ? 26 : 14); i++) { const [a, b, d] = R3(), k = SENY[i % 3]; fumet(x, y, z, a * 6, Math.abs(b) * 5 + 1, d * 2, k, 1, .6 + Math.random() * .4, .11, 2); }
    sfx('tro', gran ? 1 : .6); try { window.__so && window.__so.vibra(gran ? 'gran' : 'petit'); } catch (_) {}
    if (hero && !reduce) { hero.classList.remove('tremola', 'tremoleta'); void hero.offsetWidth; hero.classList.add(gran ? 'tremola' : 'tremoleta'); }
  }
  function mascleta() {
    if (reduce || nit) return;
    trons.forEach(t => { t.on = true; t.m.visible = true; }); masc.visible = true; cordLines.visible = true; mT = 0; metxa = CX0; terra = false; run();
  }
  function mascUpdate(dt) {
    fumUpdate(dt);
    if (mT < 0) return;
    mT += dt;
    if (mT > 1.4) {
      const vel = 1.6 + (metxa - CX0) * .55; // la metxa accelera
      metxa += vel * dt;
      emit(metxa, cordY(metxa), CZ, (Math.random() - .5), Math.random() * 1.5, 0, [1, .7, .3], .3, .4, 0);
      fumet(metxa, cordY(metxa), CZ, 0, .4, 0, [1, .78, .4], .9, .12, .35, 1); pc = Math.floor((metxa - CX0) / (CX1 - CX0) * NP) % 3;
      for (const t of trons) if (t.on && t.x <= metxa) { t.on = false; t.m.visible = false; peta(t.x, t.y, CZ, false); }
      if (metxa > CX1 && !terra) { terra = true; cordLines.visible = false;
        // el terratrèmol final
        for (let i = 0; i < 14; i++) setTimeout(() => peta(CX0 + Math.random() * (CX1 - CX0), .4 + Math.random() * .6, CZ + 2 - Math.random() * 3, true), i * 70);
      }
    }
    if (terra && fN === 0) { mT = -1; masc.visible = false; }
  }

  // ---------- estat i animació ----------
  const st = { slew: .55, tx: 3.2, drop: 1.2, sw: 0, swv: 0, sz: 0, szv: 0, t: 0 };
  const goal = { slew: 0, tx: 10.4, drop: 6.6 };
  let mx = 0, my = 0, intro = 0, prevTx = st.tx, prevSlew = st.slew, visible = true, raf = 0, lift = 0;
  const lerp = (a, b, t) => a + (b - a) * t, ease = t => 1 - Math.pow(1 - t, 3);

  function layout() {
    const r = host.getBoundingClientRect(), W = Math.max(1, r.width), Hh = Math.max(1, r.height);
    renderer.setSize(W, Hh, false); renderer.domElement.style.width = W + 'px'; renderer.domElement.style.height = Hh + 'px';
    camera.aspect = W / Hh; for (const m of mats) m.resolution.set(W, Hh);
    const mob = W / Hh < .95, apilat = getComputedStyle(host).position !== 'absolute';
    // a escriptori la torre queda a la dreta i la ploma vola cap a l'esquerra, damunt del títol
    crane.rotation.y = Math.PI + .62;
    if (mob) { goal.drop = 4.2; camera.fov = 34; camera.position.set(3, 9.5, 38); camera.lookAt(-4.8, 10.6, 0); crane.position.set(2.2, 0, 0); }
    else if (apilat) { goal.drop = 5.2; camera.fov = 30; camera.position.set(2, 8, 40); camera.lookAt(-3, 9.6, 0); crane.position.set(5.5, 0, -2); }
    else { const d = 50 * Math.max(1, 1.62 / camera.aspect); goal.drop = 6.6; camera.fov = 27; camera.position.set(1, 6.8, d); camera.lookAt(-6.4, 8.8, 0); crane.position.set(6.6, .2, -2); }
    pMat.uniforms.uScale.value = Hh * 3 * Math.min(devicePixelRatio || 1, 2); fMat.uniforms.uScale.value = Hh * 1.6 * Math.min(devicePixelRatio || 1, 2);
    if (mob) { cart.position.set(-12.5, 0, 3); cart.rotation.y = .6; cart.scale.setScalar(.75); city.position.set(6, -.3, -30); } else if (apilat) { cart.position.set(-9.5, 0, 6); cart.rotation.y = .5; cart.scale.setScalar(.9); } else { cart.position.set(-7.2, 0, 9); cart.rotation.y = .5; cart.scale.setScalar(1); city.position.set(9, -.3, -34); }
    camera.updateProjectionMatrix(); draw();
  }

  const q = new THREE.Vector3(), camW = new THREE.Vector3();
  function pose() {
    top.rotation.y = st.slew;
    trolley.position.x = st.tx;
    const len = st.drop;
    // pèndol: el ganxo penja amb un angle de balanceig dins i fora del pla de la ploma
    const hx = st.tx + Math.sin(st.sw) * len, hy = yb - .25 - Math.cos(st.sw) * Math.cos(st.sz) * len, hz = Math.sin(st.sz) * len;
    hook.position.set(hx, hy, hz); hook.rotation.set(st.sz * .9, 0, -st.sw * .9);
    cable.geometry.setPositions([st.tx - .12, yb - .25, 0, hx - .12, hy, hz, st.tx + .12, yb - .25, 0, hx + .12, hy, hz]);
    // la zebra sempre mira cap a la càmera (gira sobre el ganxo)
    hook.getWorldPosition(q); camera.getWorldPosition(camW);
    const yaw = Math.atan2(camW.x - q.x, camW.z - q.z);
    zebra.rotation.y = yaw - (crane.rotation.y + top.rotation.y) + Math.sin(st.t * .7) * .06;
    // banderola al vent
    for (let i = 0; i < fpos.count; i++) { const x = f0[i * 3]; fpos.array[i * 3 + 2] = Math.sin(st.t * 3.2 + x * 6) * .07 * (x + .38); }
    fpos.needsUpdate = true;
  }
  function draw() { pose(); renderer.render(scene, camera); }

  function tick(now) {
    raf = 0; if (!visible) return;
    const dt = Math.min(.05, (now - (tick.l || now)) / 1000); tick.l = now; st.t += dt;
    if (intro < 1) {
      intro = Math.min(1, intro + dt / 3.4);
      const a = ease(Math.min(1, intro * 1.25)), b = ease(Math.max(0, (intro - .3) / .7));
      st.slew = lerp(.55, goal.slew, a); st.tx = lerp(3.2, goal.tx, a); st.drop = lerp(1.2, goal.drop, b);
    } else {
      const gs = goal.slew + mx * .2, gt = goal.tx + mx * -2.2;
      let gd = goal.drop + my * .9;
      if (lift > 0) { lift = Math.max(0, lift - dt / 2.4); gd -= Math.sin(lift * Math.PI) * 4.2; }
      st.slew = lerp(st.slew, gs, 1 - Math.pow(.12, dt)); st.tx = lerp(st.tx, gt, 1 - Math.pow(.2, dt)); st.drop = lerp(st.drop, gd, 1 - Math.pow(.15, dt));
    }
    // física del pèndol: l'acceleració del carro i del gir el fan oscil·lar
    const ax = (st.tx - prevTx) / Math.max(dt, 1e-3), as = (st.slew - prevSlew) / Math.max(dt, 1e-3);
    prevTx = st.tx; prevSlew = st.slew;
    const g = 9.8 / Math.max(st.drop, 1);
    st.swv += (-g * Math.sin(st.sw) - st.swv * .9) * dt - ax * .012;
    st.szv += (-g * Math.sin(st.sz) - st.szv * .9) * dt + as * st.tx * .02 + Math.sin(st.t * .9) * .004;
    st.sw += st.swv * dt; st.sz += st.szv * dt;
    st.sw = Math.max(-.6, Math.min(.6, st.sw)); st.sz = Math.max(-.6, Math.min(.6, st.sz));
    show(dt);
    draw(); raf = requestAnimationFrame(tick);
  }
  const run = () => { if (!raf && !reduce) raf = requestAnimationFrame(tick); };

  if (reduce) { intro = 1; Object.assign(st, goal); }
  addEventListener('resize', layout);
  new ResizeObserver(layout).observe(host);
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) run(); }).observe(host);
  const zone = opts.zone || host;
  zone.addEventListener('pointermove', (e) => { if (e.pointerType !== 'mouse') return; const r = zone.getBoundingClientRect();
    mx = ((e.clientX - r.left) / r.width - .5) * 2; my = ((e.clientY - r.top) / r.height - .5) * 2; });
  zone.addEventListener('pointerleave', () => { mx = 0; my = 0; });
  // clic a la zebra: la grúa la puja i la torna a plantar
  const ray = new THREE.Raycaster(), v2 = new THREE.Vector2();
  zone.addEventListener('click', (e) => {
    if (e.target.closest('a,button,input,textarea,select')) return;
    const r = renderer.domElement.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(v2, camera);
    if (ray.intersectObject(zmesh).length && intro >= 1 && lift === 0) { lift = 1; opts.onLift && opts.onLift(); run(); return; }
    if (cart.visible && ray.intersectObject(cart, true).length) { const w = new THREE.Vector3(.55, 2, 0); cart.localToWorld(w);
      for (let i = 0; i < 40; i++) { const [a, b, d] = R3(); emit(w.x, w.y, w.z, a * 2, Math.abs(b) * 3 + 1, d * 2, nit ? PAL.or : [.55, .45, .25], .9, .28, 1); } sfx('paper'); try { window.__so && window.__so.vibra('bombetes'); } catch (_) {} run(); return; }
    if (nit && !reduce) { const r2 = zone.getBoundingClientRect(); if (e.clientY - r2.top < r2.height * .6) api.foc(e.clientX, e.clientY); }
  });
  zone.addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return; const r = renderer.domElement.getBoundingClientRect();
    v2.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
    zone.classList.toggle('sobre-zebra', ray.intersectObject(zmesh).length > 0);
  });

  layout(); run();
  setTimeout(() => mascleta(), 600);
  const api = {
    mascleta,
    theme(next, esNit) { // per al mode nit
      mInk.color.set(next.ink); mCable.color.set(next.ink); mBrace.color.set(next.soft);
      fPaper.color.set(next.paper); fBeix.color.set(next.beixP); fBeixD.color.set(next.beix);
      toonLines.forEach(l => l.material.color.set(next.ink));
      nit = !!esNit; city.visible = nit; mCity.color.set(next.soft); mCity2.color.set(next.soft);
      bulbMat.color.set(nit ? '#ffe7ae' : '#6d6450');
      tendalMat.color.set(nit ? '#b9b0a2' : '#ffffff');
      F.auto = nit && !reduce; if (!F.auto) F.clear();
      if (nit) { mT = -1; masc.visible = false; fN = 0; fg.setDrawRange(0, 0); }
      draw(); run();
    },
    foc(x, y) { // clic al cel: llança un coet allà on apuntes
      if (!nit || reduce) return false;
      const r = renderer.domElement.getBoundingClientRect();
      v2.set(((x - r.left) / r.width) * 2 - 1, -((y - r.top) / r.height) * 2 + 1); ray.setFromCamera(v2, camera);
      const pl = new THREE.Plane(new THREE.Vector3(0, 0, 1), 20), hit = new THREE.Vector3();
      if (!ray.ray.intersectPlane(pl, hit)) return false;
      F.llança(hit.x, Math.max(6, hit.y), -20, pick(tipusList)); run(); return true;
    }
  };
  return api;
}
