// Focs artificials 3D i el perfil de València, compartits per la grúa i pel castell del final.
import * as THREE from './three.module.min.js';

export const sfx = (k, v = .5) => { try { const so = window.__so; if (so && so.pop) so.pop(k === 'tro' ? .12 + v * .3 : .05, k === 'tro' ? undefined : 'paper'); } catch (_) {} };

// el perfil de València de Miguel (il·lustració vectorial), de nit
export function skyline(w = 60) {
  const t = new THREE.TextureLoader().load('assets/vector/skyline.png'); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  const h = w * 350 / 2048, g = new THREE.PlaneGeometry(w, h); g.translate(0, h / 2, 0);
  const base = new THREE.Color('#6f7fae'), warm = new THREE.Color('#ffd9a8');
  const mat = new THREE.MeshBasicMaterial({ map: t, transparent: true, color: base.clone(), depthWrite: false });
  const mesh = new THREE.Mesh(g, mat); mesh.renderOrder = -1;
  mesh.userData.llum = (f) => { mat.color.copy(base).lerp(warm, Math.min(1, f) * .35); };
  return mesh;
}

export function ciutat(lines, lm, soft) {
  // ---------- València de nit: perfil a tinta al fons ----------
  const city = new THREE.Group();
  const mCity = lm(soft, 1.1), mCity2 = lm(soft, .9);
  function caixa(x, w, h, z = 0) { return [[[x, 0, z], [x, h, z]], [[x + w, 0, z], [x + w, h, z]], [[x, h, z], [x + w, h, z]]]; }
  function merlets(x, w, h, n, z = 0) { const g = [], d = w / (n * 2 - 1); for (let i = 0; i < n * 2 - 1; i++) { const a = x + i * d, b = a + d, up = i % 2 === 0;
      g.push([[a, h + (up ? .35 : 0), z], [b, h + (up ? .35 : 0), z]]); if (i < n * 2 - 2) g.push([[b, h + (up ? .35 : 0), z], [b, h + (up ? 0 : .35), z]]); } return g; }
  const sk = [], sk2 = [];
  // Torres de Serrans
  const TS = -22; sk.push(...caixa(TS, 2.6, 7.5), ...merlets(TS, 2.6, 7.5, 4), ...caixa(TS + 5.4, 2.6, 7.5), ...merlets(TS + 5.4, 2.6, 7.5, 4), ...caixa(TS + 2.6, 2.8, 6.2), ...merlets(TS + 2.6, 2.8, 6.2, 4));
  for (let i = 0; i <= 8; i++) { const a = i / 8 * Math.PI, b = (i + 1) / 8 * Math.PI; if (i < 8) sk.push([[TS + 4 - Math.cos(a) * .9, 2.2 + Math.sin(a) * .9, 0], [TS + 4 - Math.cos(b) * .9, 2.2 + Math.sin(b) * .9, 0]]); }
  sk.push([[TS + 3.1, 0, 0], [TS + 3.1, 2.2, 0]], [[TS + 4.9, 0, 0], [TS + 4.9, 2.2, 0]]);
  // el Micalet
  const MX = -11; sk.push(...caixa(MX, 2.1, 12.5)); for (let y = 2.5; y < 12; y += 2.5) sk2.push([[MX, y, 0], [MX + 2.1, y, 0]]);
  sk.push(...caixa(MX + .35, 1.4, 2.2).map(s => s.map(p => [p[0], p[1] + 12.5, p[2]])));
  sk.push([[MX + .2, 14.7, 0], [MX + 1.05, 15.9, 0]], [[MX + 1.9, 14.7, 0], [MX + 1.05, 15.9, 0]], [[MX + 1.05, 15.9, 0], [MX + 1.05, 16.6, 0]]);
  sk2.push([[MX + .7, 13.1, 0], [MX + .7, 14.2, 0]], [[MX + 1.4, 13.1, 0], [MX + 1.4, 14.2, 0]]);
  // cúpula de la Catedral
  const CX = -6.2; sk.push(...caixa(CX, 4.6, 5.2)); for (let i = 0; i < 14; i++) { const a = i / 14 * Math.PI, b = (i + 1) / 14 * Math.PI;
    sk.push([[CX + 2.3 - Math.cos(a) * 1.7, 5.2 + Math.sin(a) * 1.5, 0], [CX + 2.3 - Math.cos(b) * 1.7, 5.2 + Math.sin(b) * 1.5, 0]]); }
  sk.push([[CX + 2.3, 6.7, 0], [CX + 2.3, 7.6, 0]], [[CX + 1.95, 7.25, 0], [CX + 2.65, 7.25, 0]]);
  // façanes de la ciutat
  let bx = -34; const hs = [4.2, 5.6, 3.6, 6.4, 4.8, 3.2]; let k2 = 0;
  for (const [a, b] of [[-14.6, -11.2], [-1.4, 4], [8, 13.5], [33, 40]]) { bx = a; while (bx < b) { const w = 2 + (k2 * 1.7) % 2.4, h = hs[k2 % hs.length]; const ww = Math.min(w, b - bx);
      sk2.push(...caixa(bx, ww, h)); for (let y = 1.1; y < h - .6; y += 1.2) for (let x = bx + .45; x < bx + ww - .4; x += .9) sk2.push([[x, y, 0], [x + .32, y, 0]]); bx += ww; k2++; } }
  // l'Hemisfèric i el Palau de les Arts, cap a la dreta
  const HX = 14; for (let i = 0; i < 20; i++) { const a = i / 20 * Math.PI, b = (i + 1) / 20 * Math.PI; sk.push([[HX + 4 - Math.cos(a) * 4, 7 + Math.sin(a) * 2.2, 0], [HX + 4 - Math.cos(b) * 4, 7 + Math.sin(b) * 2.2, 0]]); }
  sk.push([[HX + 9, 0, 0], [HX + 10.5, 9.5, 0]], [[HX + 10.5, 9.5, 0], [HX + 17.5, 12.2, 0]], [[HX + 17.5, 12.2, 0], [HX + 15.5, 8.4, 0]], [[HX + 10.5, 9.5, 0], [HX + 13, 6, 0]], [[HX + 13, 6, 0], [HX + 18, 0, 0]]);
  sk.push([[-23, 0, 0], [42, 0, 0]]);
  city.add(lines(sk, mCity)); city.add(lines(sk2, mCity2));
  return { city, mCity, mCity2 };

}

export function focs(scene, camera, opts = {}) {
  const area = Object.assign({ x0: -26, x1: 22, y0: 13, y1: 24, z0: -18, z1: -32 }, opts.area || {});
  // ---------- focs artificials ----------
  const MAXP = 7000;
  const pPos = new Float32Array(MAXP * 3), pCol = new Float32Array(MAXP * 3), pSize = new Float32Array(MAXP), pAlpha = new Float32Array(MAXP);
  const pVel = new Float32Array(MAXP * 3), pLife = new Float32Array(MAXP), pMax = new Float32Array(MAXP), pKind = new Uint8Array(MAXP), pBase = new Float32Array(MAXP);
  let pN = 0;
  const pg = new THREE.BufferGeometry();
  pg.setAttribute('position', new THREE.BufferAttribute(pPos, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('color', new THREE.BufferAttribute(pCol, 3).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('size', new THREE.BufferAttribute(pSize, 1).setUsage(THREE.DynamicDrawUsage));
  pg.setAttribute('alpha', new THREE.BufferAttribute(pAlpha, 1).setUsage(THREE.DynamicDrawUsage));
  const pMat = new THREE.ShaderMaterial({
    uniforms: { uScale: { value: 300 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, vertexColors: true,
    vertexShader: `attribute float size; attribute float alpha; varying vec3 vC; varying float vA; uniform float uScale;
      void main(){ vC = color; vA = alpha; vec4 mv = modelViewMatrix * vec4(position,1.0); gl_PointSize = size * uScale / -mv.z; gl_Position = projectionMatrix * mv; }`,
    fragmentShader: `varying vec3 vC; varying float vA; void main(){ vec2 d = gl_PointCoord - .5; float r = length(d); if (r > .5) discard;
      float core = smoothstep(.5, .0, r); float hot = smoothstep(.16, .0, r); float a = (pow(core, 2.2) * .85 + hot) * vA; gl_FragColor = vec4((vC * (0.75 + core) + hot * .6) * a, a); }`
  });
  const points = new THREE.Points(pg, pMat); points.frustumCulled = false; scene.add(points);
  const PAL = { or: [1, .78, .38], roig: [1, .26, .22], blau: [.45, .62, 1], blanc: [1, .96, .88], rosa: [1, .55, .7], verd: [.5, 1, .6], plata: [.85, .9, 1] };
  function emit(x, y, z, vx, vy, vz, col, life, size, kind = 0) {
    if (pN >= MAXP) return -1; const i = pN++;
    pPos[i * 3] = x; pPos[i * 3 + 1] = y; pPos[i * 3 + 2] = z; pVel[i * 3] = vx; pVel[i * 3 + 1] = vy; pVel[i * 3 + 2] = vz;
    pCol[i * 3] = col[0]; pCol[i * 3 + 1] = col[1]; pCol[i * 3 + 2] = col[2]; pLife[i] = 0; pMax[i] = life; pSize[i] = size; pBase[i] = size; pAlpha[i] = 1; pKind[i] = kind; return i;
  }
  const rockets = [];
  function llança(tx, ty, tz, tipus) {
    const sx = tx + (Math.random() - .5) * 4, sz = tz;
    rockets.push({ x: sx, y: -1, z: sz, vx: (tx - sx) / 1.25, vy: (ty + 1) / 1.25 + 4.5, vz: 0, t: 0, ty, tipus });
    sfx('xiulit');
  }
  const R3 = () => { const u = Math.random() * 2 - 1, th = Math.random() * Math.PI * 2, r = Math.sqrt(1 - u * u); return [r * Math.cos(th), u, r * Math.sin(th)]; };
  function esclata(x, y, z, tipus) {
    const tipusos = { peonia: () => { const c = pick([PAL.or, PAL.roig, PAL.blau, PAL.rosa, PAL.verd, PAL.blanc]), c2 = Math.random() < .5 ? c : pick([PAL.or, PAL.blanc]);
          for (let i = 0; i < 220; i++) { const [a, b, d] = R3(), sp = 10 + Math.random() * 1.6; emit(x, y, z, a * sp, b * sp, d * sp, i % 3 ? c : c2, 1.5 + Math.random() * .5, .55, 1); } },
      palmera: () => { for (let i = 0; i < 110; i++) { const [a, b, d] = R3(), sp = 8 + Math.random() * 2.5; emit(x, y, z, a * sp, b * sp + 1.5, d * sp, PAL.or, 2.8 + Math.random() * .8, .6, 2); } },
      anell: () => { const c = pick([PAL.blau, PAL.roig, PAL.verd, PAL.rosa]), rx = Math.random() * 1.2 - .6, rz = Math.random() * 1.2 - .6;
          const e = new THREE.Euler(rx + .9, 0, rz), v = new THREE.Vector3();
          for (let i = 0; i < 90; i++) { const a = i / 90 * Math.PI * 2; v.set(Math.cos(a), 0, Math.sin(a)).applyEuler(e).multiplyScalar(11); emit(x, y, z, v.x, v.y, v.z, c, 1.7, .6, 1); }
          for (let i = 0; i < 40; i++) { const [a, b, d] = R3(); emit(x, y, z, a * 2.5, b * 2.5, d * 2.5, PAL.blanc, 1.2, .45, 1); } },
      crepitant: () => { for (let i = 0; i < 150; i++) { const [a, b, d] = R3(), sp = 7 + Math.random() * 4; emit(x, y, z, a * sp, b * sp, d * sp, PAL.plata, 1.1 + Math.random() * .6, .45, 3); } },
      senyera: () => { for (let i = 0; i < 240; i++) { const [a, b, d] = R3(), sp = 10.5 + Math.random() * 1.2; emit(x, y, z, a * sp, b * sp, d * sp, i % 2 ? PAL.roig : PAL.or, 1.7 + Math.random() * .4, .55, 1); } },
      cor: () => { // un cor, per la terreta
          for (let i = 0; i < 120; i++) { const t = i / 120 * Math.PI * 2, hx = 16 * Math.pow(Math.sin(t), 3), hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
            emit(x, y, z, hx * .7, hy * .7 + 1, (Math.random() - .5) * .6, PAL.roig, 1.8, .6, 1); } } };
    (tipusos[tipus] || tipusos.peonia)();
    for (let i = 0; i < 14; i++) { const [a, b, d] = R3(); emit(x, y, z, a * 1.2, b * 1.2, d * 1.2, [1, .85, .6], .3, 2.4, 4); } // flash
    sfx('tro', Math.min(1, 40 / Math.hypot(x - camera.position.x, z - camera.position.z)));
    flashAt = Math.min(1.4, flashAt + .8);
  }
  const pick = a => a[(Math.random() * a.length) | 0];
  let nextShot = 1.2, auto = false, flashAt = 0;
  const tipusList = ['peonia', 'palmera', 'anell', 'crepitant', 'senyera', 'peonia', 'palmera', 'peonia'];
  function update(dt) {
    nextShot -= dt; flashAt *= Math.exp(-3.5 * dt);
    if (auto && nextShot <= 0) {
      const salva = Math.random() < .14; const n = salva ? 4 + (Math.random() * 3 | 0) : 1;
      for (let i = 0; i < n; i++) setTimeout(() => auto && llança(area.x0 + Math.random() * (area.x1 - area.x0), area.y0 + Math.random() * (area.y1 - area.y0), area.z0 + Math.random() * (area.z1 - area.z0), Math.random() < .05 ? 'cor' : pick(tipusList)), i * 140);
      nextShot = salva ? 3.4 : (opts.rate || 1) * (.7 + Math.random() * 1.1);
    }
    for (let r = rockets.length - 1; r >= 0; r--) { const k = rockets[r]; k.t += dt; k.vy -= 4 * dt; k.x += k.vx * dt; k.y += k.vy * dt;
      emit(k.x, k.y, k.z, (Math.random() - .5) * .4, -1, (Math.random() - .5) * .4, PAL.or, .5, .35, 0);
      if (k.vy < 2.5 || k.y >= k.ty) { esclata(k.x, k.y, k.z, k.tipus); rockets.splice(r, 1); } }
    const g = 3.2;
    for (let i = 0; i < pN; i++) {
      pLife[i] += dt; const t = pLife[i] / pMax[i];
      if (t >= 1) {
        const j = --pN; if (i !== j) { for (let c = 0; c < 3; c++) { pPos[i * 3 + c] = pPos[j * 3 + c]; pVel[i * 3 + c] = pVel[j * 3 + c]; pCol[i * 3 + c] = pCol[j * 3 + c]; }
          pLife[i] = pLife[j]; pMax[i] = pMax[j]; pSize[i] = pSize[j]; pBase[i] = pBase[j]; pAlpha[i] = pAlpha[j]; pKind[i] = pKind[j]; } i--; continue; }
      const kd = pKind[i], drag = kd === 2 ? 1.9 : kd === 4 ? 0 : kd === 5 ? .4 : 1.15;
      const f = Math.exp(-drag * dt);
      pVel[i * 3] *= f; pVel[i * 3 + 1] = pVel[i * 3 + 1] * f - g * dt * (kd === 2 ? .55 : kd === 5 ? -.05 : 1); pVel[i * 3 + 2] *= f;
      pPos[i * 3] += pVel[i * 3] * dt; pPos[i * 3 + 1] += pVel[i * 3 + 1] * dt; pPos[i * 3 + 2] += pVel[i * 3 + 2] * dt;
      if (kd === 4) { pAlpha[i] = 1 - t; pSize[i] = pBase[i] * (1 + t * 2); }
      else if (kd === 3) { pAlpha[i] = (t > .55 ? (Math.random() < .5 ? 1 : .1) : 1) * (1 - t * .6); }
      else if (kd === 5) { pAlpha[i] = Math.sin(t * Math.PI) * .5; pSize[i] = pBase[i] * (1 + t * 1.5); }
      else { pAlpha[i] = Math.pow(1 - t, 1.4); pSize[i] = pBase[i] * (1 - t * .5); }
      if ((kd === 2 && Math.random() < .25) || (kd === 1 && Math.random() < .06)) emit(pPos[i * 3], pPos[i * 3 + 1], pPos[i * 3 + 2], 0, -.3, 0, kd === 2 ? PAL.or : [pCol[i * 3], pCol[i * 3 + 1], pCol[i * 3 + 2]], kd === 2 ? .9 : .45, pBase[i] * .55, 0);
    }
    pg.setDrawRange(0, pN);
    for (const n of ['position', 'color', 'size', 'alpha']) pg.attributes[n].needsUpdate = true;
  }
  // el castell: un programa que va creixent i acaba amb la traca final
  function castell(onEnd) {
    const A = area, rx = () => A.x0 + Math.random() * (A.x1 - A.x0), ry = () => A.y0 + Math.random() * (A.y1 - A.y0), rz = () => A.z0 + Math.random() * (A.z1 - A.z0);
    const prog = []; let t = 0;
    for (let i = 0; i < 6; i++) prog.push([t += .9, () => llança(rx(), ry(), rz(), pick(['peonia', 'palmera']))]);
    for (let i = 0; i < 8; i++) prog.push([t += .55, () => llança(rx(), ry(), rz(), pick(tipusList))]);
    prog.push([t += .8, () => { for (let k = 0; k < 5; k++) llança(A.x0 + (k + .5) * (A.x1 - A.x0) / 5, A.y1 - 2, (A.z0 + A.z1) / 2, 'anell'); }]);
    for (let i = 0; i < 10; i++) prog.push([t += .32, () => llança(rx(), ry(), rz(), pick(['senyera', 'crepitant', 'peonia']))]);
    prog.push([t += 1.1, () => llança((A.x0 + A.x1) / 2, A.y1, (A.z0 + A.z1) / 2, 'cor')]);
    for (let i = 0; i < 26; i++) prog.push([t += .09, () => llança(rx(), ry(), rz(), pick(['palmera', 'senyera', 'crepitant']))]);
    const timers = prog.map(([at, fn]) => setTimeout(fn, at * 1000));
    timers.push(setTimeout(() => onEnd && onEnd(), (t + 3.5) * 1000));
    return () => timers.forEach(clearTimeout);
  }
  return {
    update, llança, esclata, emit, castell, PAL, R3, pick, tipusList,
    set auto(v) { auto = v; if (v) nextShot = .4; }, get auto() { return auto; },
    clear() { rockets.length = 0; pN = 0; pg.setDrawRange(0, 0); },
    get material() { return pMat; }, points, get flash() { return flashAt; }
  };
}
