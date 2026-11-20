// La revista Visca! en 3D: es pot obrir, fullejar arrossegant i ampliar cada pàgina.
export function llibre(host, pagines, opts = {}) {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = opts.text || {};
  // pàgines en ordre d'impressió: portada, interior de coberta, 1…32, interior de contracoberta, contracoberta
  const P = [pagines.portada, null, ...pagines.interior, null, pagines.contra];
  const N = P.length / 2; // fulls
  host.classList.add('llibre3d');
  host.innerHTML = `
    <div class="ll-escena">
      <div class="ll-llibre" tabindex="0" role="group" aria-roledescription="revista" aria-label="${T.label || 'Revista'}">
        <div class="ll-gruix esq" aria-hidden="true"></div><div class="ll-gruix dre" aria-hidden="true"></div>
        ${Array.from({ length: N }, (_, i) => `<div class="ll-full" data-i="${i}" style="--z:${N - i}">
          <div class="ll-cara davant">${cara(P[2 * i], 2 * i)}</div>
          <div class="ll-cara darrere">${cara(P[2 * i + 1], 2 * i + 1)}</div></div>`).join('')}
      </div>
    </div>
    <div class="ll-ctrl">
      <button type="button" class="ll-ant" aria-label="${T.ant || 'Anterior'}">←</button>
      <span class="ll-pag" aria-live="polite"></span>
      <button type="button" class="ll-seg" aria-label="${T.seg || 'Següent'}">→</button>
    </div>
    <p class="ll-pista">${T.pista || ''}</p>
    <div class="ll-zoom" hidden><button type="button" class="ll-tanca" aria-label="${T.tanca || 'Tanca'}">×</button><img alt=""><div class="ll-zoom-nav"><button type="button" data-z="-1" aria-label="${T.ant || 'Anterior'}">←</button><span></span><button type="button" data-z="1" aria-label="${T.seg || 'Següent'}">→</button></div></div>`;
  function cara(src, k) {
    if (!src) return `<div class="ll-buida ${k === 1 ? 'coberta' : ''}"></div>`;
    return `<img data-src="${src}" alt="" draggable="false"><i class="ll-ombra"></i>`;
  }
  const book = host.querySelector('.ll-llibre'), fulls = [...host.querySelectorAll('.ll-full')];
  const lbl = host.querySelector('.ll-pag'), zoom = host.querySelector('.ll-zoom'), zimg = zoom.querySelector('img');
  let pos = 0; // fulls girats (0 = tancada per davant, N = tancada per darrere)
  const carrega = () => {
    fulls.forEach((f, i) => { if (Math.abs(i - pos) <= 2) f.querySelectorAll('img[data-src]').forEach(im => { im.src = im.dataset.src; im.removeAttribute('data-src'); }); });
  };
  const etiqueta = () => {
    if (pos === 0) return T.portada || 'Portada';
    if (pos === N) return T.contra || 'Contraportada';
    const esq = 2 * pos - 1, dre = 2 * pos; const num = k => (k >= 2 && k <= 33) ? k - 1 : null;
    const a = num(esq), b = num(dre); return [a, b].filter(Boolean).join('–') || (T.interior || 'Interior');
  };
  const zOk = (f, i) => { f.style.zIndex = i < pos ? i + 1 : N - i; };
  function posa(n, anim = true, actiu = -1) {
    pos = Math.max(0, Math.min(N, n));
    fulls.forEach((f, i) => { const g = i < pos; f.classList.toggle('girat', g); f.style.transform = ''; if (!anim) f.style.transition = 'none';
      if (i === actiu && anim && !reduce) { f.style.zIndex = 999; const fi = () => { zOk(f, i); f.removeEventListener('transitionend', fi); }; f.addEventListener('transitionend', fi); setTimeout(fi, 1200); } else zOk(f, i); });
    book.style.setProperty('--dre', (N - pos) / N); book.style.setProperty('--esq', pos / N);
    if (!anim) requestAnimationFrame(() => fulls.forEach(f => f.style.transition = ''));
    book.classList.toggle('tancada-davant', pos === 0); book.classList.toggle('tancada-darrere', pos === N);
    lbl.textContent = etiqueta(); carrega();
    host.querySelector('.ll-ant').disabled = pos === 0; host.querySelector('.ll-seg').disabled = pos === N;
  }
  const pas = (d) => { if ((d > 0 && pos < N) || (d < 0 && pos > 0)) { const a = d > 0 ? pos : pos - 1; posa(pos + d, true, a); opts.onFlip && opts.onFlip(); } };
  host.querySelector('.ll-ant').onclick = () => pas(-1);
  host.querySelector('.ll-seg').onclick = () => pas(1);
  book.addEventListener('keydown', e => { if (e.key === 'ArrowRight') { e.preventDefault(); pas(1); } if (e.key === 'ArrowLeft') { e.preventDefault(); pas(-1); } });

  // arrossegar per a girar la fulla (ratolí i dit)
  let drag = null;
  book.addEventListener('pointerdown', e => {
    const r = book.getBoundingClientRect(), mig = r.left + r.width / 2, dreta = e.clientX > mig;
    const i = dreta ? pos : pos - 1; if (i < 0 || i >= N) { drag = { tap: true, x: e.clientX, y: e.clientY, dreta, r }; return; }
    drag = { i, dreta, x: e.clientX, y: e.clientY, r, mogut: false, id: e.pointerId };
  });
  addEventListener('pointermove', e => {
    if (!drag || drag.tap || e.pointerId !== drag.id) return;
    const dx = e.clientX - drag.x, dy = e.clientY - drag.y;
    if (!drag.mogut) { if (Math.abs(dx) < 8 || Math.abs(dy) > Math.abs(dx)) return; drag.mogut = true; try { book.setPointerCapture(e.pointerId); } catch (_) {} }
    const w = drag.r.width / 2; let p = drag.dreta ? Math.min(1, Math.max(0, -dx / (w * 1.2))) : 1 - Math.min(1, Math.max(0, dx / (w * 1.2)));
    const f = fulls[drag.i]; f.style.transition = 'none'; f.style.zIndex = 999; f.style.transform = `rotateY(${-180 * p}deg)`; drag.p = p;
  });
  addEventListener('pointerup', e => {
    if (!drag) return; const d = drag; drag = null;
    if (d.tap || !d.mogut) { // un toc: amplia la pàgina tocada o gira si està tancada
      if (pos === 0 || pos === N) { pas(pos === 0 ? 1 : -1); return; }
      const k = d.dreta ? 2 * pos : 2 * pos - 1; obri(k); return; }
    const f = fulls[d.i]; f.style.transition = '';
    requestAnimationFrame(() => { if (d.dreta) posa(d.p > .35 ? pos + 1 : pos, true, d.i); else posa(d.p < .65 ? pos - 1 : pos, true, d.i); opts.onFlip && opts.onFlip(); });
  });
  addEventListener('pointercancel', () => { if (drag && !drag.tap) posa(pos); drag = null; });

  // ampliar
  let zk = 0;
  function obri(k) { if (!P[k]) return; zk = k; zimg.src = P[k]; zoom.hidden = false; zoom.querySelector('span').textContent = (k >= 2 && k <= 33) ? (k - 1) + ' / 32' : (k === 0 ? (T.portada || 'Portada') : (T.contra || 'Contraportada')); document.documentElement.classList.add('ll-zoom-obert'); zoom.querySelector('.ll-tanca').focus(); }
  function tanca() { zoom.hidden = true; document.documentElement.classList.remove('ll-zoom-obert'); book.focus({ preventScroll: true }); }
  zoom.querySelector('.ll-tanca').onclick = tanca;
  zoom.addEventListener('click', e => { if (e.target === zoom) tanca(); const b = e.target.closest('[data-z]'); if (b) { let k = zk + +b.dataset.z; while (k > 0 && k < P.length - 1 && !P[k]) k += +b.dataset.z; if (P[k]) obri(k); } });
  addEventListener('keydown', e => { if (zoom.hidden) return; if (e.key === 'Escape') tanca(); if (e.key === 'ArrowRight') zoom.querySelector('[data-z="1"]').click(); if (e.key === 'ArrowLeft') zoom.querySelector('[data-z="-1"]').click(); });

  // es carrega només quan s'acosta a la pantalla
  new IntersectionObserver(([e]) => { if (e.isIntersecting) carrega(); }, { rootMargin: '400px' }).observe(host);
  posa(0, false);
  return { posa: (n) => posa(n), get pos() { return pos; } };
}
