// Uniteco · interacciones del sitio
(function () {
  'use strict';

  /* ---------- Cabecera fija ---------- */
  const header = document.querySelector('.header');
  const onScroll = () => header && header.classList.toggle('is-scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ---------- Menú móvil accesible ---------- */
  const drawer = document.querySelector('.drawer');
  const openBtn = document.querySelector('[data-drawer-open]');
  if (drawer && openBtn) {
    const panel = drawer.querySelector('.drawer__panel');
    const focusables = () => [...panel.querySelectorAll('a[href], button:not([disabled])')];
    const open = () => {
      drawer.classList.add('open');
      drawer.inert = false;
      openBtn.setAttribute('aria-expanded', 'true');
      document.body.style.overflow = 'hidden';
      setTimeout(() => focusables()[0]?.focus(), 50);
    };
    const close = () => {
      if (!drawer.classList.contains('open')) return;
      drawer.classList.remove('open');
      drawer.inert = true;
      openBtn.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
      openBtn.focus();
    };
    openBtn.addEventListener('click', open);
    drawer.querySelectorAll('[data-drawer-close], nav a').forEach(el => el.addEventListener('click', close));
    drawer.addEventListener('keydown', e => {
      if (e.key === 'Escape') close();
      if (e.key !== 'Tab') return;
      const f = focusables(), first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  /* ---------- Acordeón de preguntas ---------- */
  document.querySelectorAll('.acc').forEach((acc, i) => {
    const q = acc.querySelector('.acc__q'), a = acc.querySelector('.acc__a');
    if (!q || !a) return;
    const id = 'faq-' + (i + 1);
    q.id = id + '-q';
    a.id = id + '-a';
    a.setAttribute('role', 'region');
    a.setAttribute('aria-labelledby', q.id);
    q.setAttribute('aria-controls', a.id);
    q.setAttribute('aria-expanded', acc.classList.contains('open'));
    q.addEventListener('click', () => q.setAttribute('aria-expanded', acc.classList.toggle('open')));
  });

  /* ---------- Filtros de preguntas ---------- */
  const tabs = document.querySelectorAll('.faq-tabs button');
  tabs.forEach(t => t.addEventListener('click', () => {
    tabs.forEach(x => { x.classList.remove('active'); x.setAttribute('aria-pressed', 'false'); });
    t.classList.add('active');
    t.setAttribute('aria-pressed', 'true');
    const cat = t.dataset.cat;
    document.querySelectorAll('.faq-list .acc').forEach(a => { a.hidden = cat !== 'all' && a.dataset.cat !== cat; });
  }));

  /* ---------- Contadores animados ---------- */
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const animate = el => {
    if (reduceMotion) return;
    const to = +el.dataset.count, dur = 1600, t0 = performance.now();
    const step = t => {
      const p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(to * e).toLocaleString('es-EC');
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- Aparición al hacer scroll ---------- */
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      en.target.classList.add('in');
      if (en.target.dataset.count) animate(en.target);
      io.unobserve(en.target);
    }), { threshold: .15 });
    document.querySelectorAll('.reveal, [data-count]').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el => el.classList.add('in'));
  }

  /* ---------- Buscador de la portada → formulario ---------- */
  const finder = document.querySelector('.finder');
  if (finder) finder.addEventListener('submit', e => {
    e.preventDefault();
    const v = (finder.querySelector('input:checked') || {}).value;
    const sel = document.querySelector('#f-tipo');
    if (sel && v) sel.value = v;
    document.querySelector('#contacto').scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
    setTimeout(() => document.querySelector('#f-nombre')?.focus({ preventScroll: true }), reduceMotion ? 0 : 700);
  });

  /* ---------- Formulario: validación accesible ----------
     Versión de demostración: no envía ni almacena datos. */
  const rules = {
    nombre: v => v.trim().length >= 2 ? '' : 'Indique su nombre y apellidos.',
    telefono: v => {
      const digits = v.replace(/\D/g, '');
      if (!v.trim()) return 'Indique un teléfono de contacto.';
      return /^[+\d\s()-]+$/.test(v) && digits.length >= 7 && digits.length <= 15 ? '' : 'Indique un teléfono válido (solo números, entre 7 y 15 dígitos).';
    },
    email: v => !v.trim() || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()) ? '' : 'El email no tiene un formato válido (ejemplo: nombre@dominio.com).',
    privacidad: (v, el) => el.checked ? '' : 'Debe autorizar el tratamiento de sus datos para que podamos atender su solicitud.',
  };
  document.querySelectorAll('form.form').forEach(form => {
    const summary = form.querySelector('.form__summary');
    const check = el => {
      const rule = rules[el.name];
      if (!rule) return '';
      const msg = rule(el.value, el);
      const err = document.getElementById(el.getAttribute('aria-describedby'));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      el.closest('.field')?.classList.toggle('error', !!msg);
      if (err) err.textContent = msg;
      return msg;
    };
    form.querySelectorAll('input').forEach(el => {
      el.addEventListener('blur', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
      el.addEventListener('change', () => { if (el.getAttribute('aria-invalid') === 'true') check(el); });
    });
    form.addEventListener('submit', e => {
      e.preventDefault();
      const fields = [...form.querySelectorAll('input[name]')].filter(el => rules[el.name]);
      const bad = fields.filter(el => check(el));
      if (bad.length) {
        summary.hidden = false;
        summary.textContent = bad.length === 1 ? 'Revise el campo marcado para continuar.' : `Revise los ${bad.length} campos marcados para continuar.`;
        bad[0].focus();
        return;
      }
      summary.hidden = true;
      form.classList.add('sent');
      form.querySelector('.form__ok')?.focus();
    });
  });

  /* ---------- Consentimiento de cookies ---------- */
  const KEY = 'uniteco_cookie_consent', VERSION = 1, MAX_AGE = 365 * 24 * 3600 * 1000;
  const store = {
    get() { try { const c = JSON.parse(localStorage.getItem(KEY)); return c && c.v === VERSION && Date.now() - c.date < MAX_AGE ? c : null; } catch (e) { return null; } },
    set(c) { try { localStorage.setItem(KEY, JSON.stringify(c)); } catch (e) { /* almacenamiento no disponible */ } },
  };
  // Activa solo los scripts marcados con <script type="text/plain" data-cookie-category="analytics|marketing">
  const apply = c => document.querySelectorAll('script[type="text/plain"][data-cookie-category]').forEach(s => {
    if (!c[s.dataset.cookieCategory] || s.dataset.loaded) return;
    const n = document.createElement('script');
    [...s.attributes].forEach(a => { if (a.name !== 'type') n.setAttribute(a.name, a.value); });
    n.text = s.text;
    s.dataset.loaded = '1';
    s.after(n);
  });

  const banner = document.createElement('div');
  banner.className = 'cc-banner';
  banner.setAttribute('role', 'region');
  banner.setAttribute('aria-label', 'Aviso de cookies');
  banner.hidden = true;
  banner.innerHTML = `
    <div class="cc-banner__inner">
      <p><strong>Su privacidad es importante.</strong> Este sitio solo utiliza almacenamiento técnico necesario para funcionar y recordar su elección. Las cookies analíticas o publicitarias solo se activarían si usted lo acepta. <a href="politica-de-cookies.html">Más información sobre cookies</a>.</p>
      <div class="cc-banner__btns">
        <button type="button" class="btn btn--teal btn--sm" data-cc="reject">Rechazar</button>
        <button type="button" class="btn btn--ghost btn--sm" data-cc="settings">Configurar</button>
        <button type="button" class="btn btn--teal btn--sm" data-cc="accept">Aceptar todas</button>
      </div>
    </div>`;

  const modal = document.createElement('dialog');
  modal.className = 'cc-modal';
  modal.setAttribute('aria-labelledby', 'cc-title');
  modal.innerHTML = `
    <div class="cc-modal__inner">
      <div class="cc-modal__head">
        <h2 id="cc-title">Configuración de cookies</h2>
        <button type="button" class="cc-close" data-cc="close" aria-label="Cerrar configuración de cookies">
          <svg aria-hidden="true" focusable="false"><use href="#i-x"/></svg>
        </button>
      </div>
      <p>Elija qué categorías permite. Puede cambiar su decisión en cualquier momento desde «Configurar cookies» en el pie de página.</p>
      <div class="cc-row">
        <div><p class="cc-row__t" id="cc-nec-t">Necesarias</p><p id="cc-nec-d">Imprescindibles para el funcionamiento del sitio y para recordar su elección. Siempre activas.</p></div>
        <input type="checkbox" role="switch" checked disabled aria-labelledby="cc-nec-t" aria-describedby="cc-nec-d">
      </div>
      <div class="cc-row">
        <div><p class="cc-row__t" id="cc-an-t">Analíticas</p><p id="cc-an-d">Medición agregada del uso del sitio. Actualmente no se utilizan.</p></div>
        <input type="checkbox" role="switch" name="analytics" aria-labelledby="cc-an-t" aria-describedby="cc-an-d">
      </div>
      <div class="cc-row">
        <div><p class="cc-row__t" id="cc-mk-t">Publicidad</p><p id="cc-mk-d">Publicidad personalizada. Actualmente no se utilizan.</p></div>
        <input type="checkbox" role="switch" name="marketing" aria-labelledby="cc-mk-t" aria-describedby="cc-mk-d">
      </div>
      <div class="cc-modal__btns">
        <button type="button" class="btn btn--teal btn--sm" data-cc="reject">Rechazar todas</button>
        <button type="button" class="btn btn--ghost btn--sm" data-cc="save">Guardar preferencias</button>
        <button type="button" class="btn btn--teal btn--sm" data-cc="accept">Aceptar todas</button>
      </div>
    </div>`;

  document.body.append(banner, modal);
  let lastFocus = null;

  const save = (analytics, marketing) => {
    const c = { v: VERSION, date: Date.now(), necessary: true, analytics: !!analytics, marketing: !!marketing };
    store.set(c);
    apply(c);
    banner.hidden = true;
    document.body.classList.remove('cc-visible');
    if (modal.open) modal.close();
  };
  const openSettings = () => {
    const c = store.get() || {};
    modal.querySelector('[name="analytics"]').checked = !!c.analytics;
    modal.querySelector('[name="marketing"]').checked = !!c.marketing;
    lastFocus = document.activeElement;
    if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
  };
  modal.addEventListener('close', () => { if (lastFocus && lastFocus.isConnected) lastFocus.focus(); });

  document.addEventListener('click', e => {
    const b = e.target.closest('[data-cc], [data-cc-open]');
    if (!b) return;
    if (b.hasAttribute('data-cc-open')) return openSettings();
    const a = b.dataset.cc;
    if (a === 'accept') save(true, true);
    else if (a === 'reject') save(false, false);
    else if (a === 'settings') openSettings();
    else if (a === 'save') save(modal.querySelector('[name="analytics"]').checked, modal.querySelector('[name="marketing"]').checked);
    else if (a === 'close') modal.close();
  });

  const existing = store.get();
  if (existing) apply(existing);
  else { banner.hidden = false; document.body.classList.add('cc-visible'); }

  /* ---------- Año del pie ---------- */
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();

/* ==========================================================
   Animaciones, mapa de Ecuador y test de protección
   ========================================================== */
(function () {
  'use strict';
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- Escalonado de apariciones ---------- */
  const groups = new Map();
  document.querySelectorAll('.reveal').forEach(el => {
    const p = el.parentElement;
    const n = groups.get(p) || 0;
    groups.set(p, n + 1);
    el.style.setProperty('--d', Math.min(n, 6) * 0.08 + 's');
  });
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .2 });
    document.querySelectorAll('.timeline, .steps').forEach(el => io.observe(el));
  } else {
    document.querySelectorAll('.timeline, .steps').forEach(el => el.classList.add('in'));
  }

  /* ---------- Barra de progreso de lectura ---------- */
  if (!reduce) {
    const bar = document.createElement('div');
    bar.className = 'scroll-progress';
    bar.setAttribute('aria-hidden', 'true');
    document.body.prepend(bar);
    let ticking = false;
    const upd = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = `scaleX(${h > 0 ? Math.min(window.scrollY / h, 1) : 0})`;
      ticking = false;
    };
    window.addEventListener('scroll', () => { if (!ticking) { requestAnimationFrame(upd); ticking = true; } }, { passive: true });
    upd();
  }

  /* ---------- Movimiento sutil en la cabecera ---------- */
  const hero = document.querySelector('.hero');
  if (hero && !reduce && window.matchMedia('(pointer: fine) and (min-width: 1101px)').matches) {
    const layers = [['.hero__ring', 10], ['.hero__blob', 18], ['.hero__img', 8]].map(([s, f]) => [hero.querySelector(s), f]).filter(x => x[0]);
    hero.addEventListener('mousemove', e => {
      const r = hero.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - .5, y = (e.clientY - r.top) / r.height - .5;
      layers.forEach(([el, f]) => {
        const base = el.classList.contains('hero__img') ? '' : 'translateY(-50%) ';
        el.style.transform = `${base}translate(${(-x * f).toFixed(1)}px, ${(-y * f).toFixed(1)}px)`;
      });
    });
    hero.addEventListener('mouseleave', () => layers.forEach(([el]) => { el.style.transform = ''; }));
  }

  /* ---------- Mapa de Ecuador ---------- */
  document.querySelectorAll('.map-sec').forEach(sec => {
    const svg = sec.querySelector('.ec-map'), box = sec.querySelector('.map-box');
    const sel = sec.querySelector('#map-prov'), name = sec.querySelector('[data-map-name]'), text = sec.querySelector('[data-map-text]'), cta = sec.querySelector('[data-map-cta]');
    if (!svg || !sel) return;
    const HQ = 'Sede central: Av. República de El Salvador N34-493 y Portugal, Edificio Torre Gibraltar, Quito.';
    const tip = document.createElement('div'); tip.className = 'map-tip'; tip.setAttribute('aria-hidden', 'true'); box.appendChild(tip);
    const paths = [...svg.querySelectorAll('path[data-prov]')];
    const select = prov => {
      paths.forEach(p => p.classList.toggle('is-active', p.dataset.prov === prov));
      name.textContent = prov;
      text.textContent = prov === 'Pichincha' ? HQ : `Asesoramos a profesionales e instituciones de la salud de ${prov}. Solicite un asesor y le contactaremos por teléfono, WhatsApp o videollamada.`;
      sel.value = prov;
      cta.textContent = `Solicitar asesor en ${prov}`;
    };
    paths.forEach(p => {
      p.addEventListener('click', () => select(p.dataset.prov));
      p.addEventListener('mousemove', e => {
        const r = box.getBoundingClientRect();
        tip.textContent = p.dataset.prov; tip.style.left = (e.clientX - r.left) + 'px'; tip.style.top = (e.clientY - r.top) + 'px'; tip.classList.add('show');
      });
      p.addEventListener('mouseleave', () => tip.classList.remove('show'));
    });
    sel.addEventListener('change', () => select(sel.value));
    cta.addEventListener('click', () => {
      const f = document.querySelector('#f-prov');
      if (f) f.value = sel.value;
      setTimeout(() => document.querySelector('#f-nombre')?.focus({ preventScroll: true }), reduce ? 0 : 700);
    });
    select(sel.value);
  });

  /* ---------- Test de protección ---------- */
  const quiz = document.getElementById('quiz');
  if (!quiz) return;
  const PR = window.UNITECO_PRODUCTS || {};
  const steps = [...quiz.querySelectorAll('.q-step')];
  const bar = quiz.querySelector('.quiz__bar'), now = quiz.querySelector('[data-q-now]'), err = quiz.querySelector('.quiz__err');
  const back = quiz.querySelector('[data-q-back]'), next = quiz.querySelector('[data-q-next]'), result = quiz.querySelector('.q-result');
  const count = quiz.querySelector('.quiz__count'), nav = quiz.querySelector('.quiz__nav');
  let i = 0;
  const val = n => (quiz.querySelector(`[name="${n}"]:checked`) || {}).value;
  const perfil = () => val('perfil');
  const show = k => {
    steps.forEach((s, j) => { s.hidden = j !== k; });
    const st = steps[k];
    if (st.dataset.step === 'detalle') {
      const isInst = perfil() === 'inst';
      st.querySelector('[data-only="prof"]').hidden = isInst;
      st.querySelector('[data-only="inst"]').hidden = !isInst;
      st.querySelector('legend').textContent = isInst ? '¿Qué tipo de institución dirige?' : '¿Cuál es su especialidad?';
    }
    if (st.dataset.step === 'extra') {
      const p = perfil();
      st.querySelectorAll('[value="instalaciones"], [value="directivos"]').forEach(x => { x.closest('.q-opt').hidden = p === 'prof'; if (p === 'prof') x.checked = false; });
    }
    bar.style.width = ((k + 1) / steps.length * 100) + '%';
    now.textContent = k + 1;
    back.hidden = k === 0;
    next.innerHTML = (k === steps.length - 1 ? 'Ver mi resultado ' : 'Siguiente ') + '<svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg>';
    err.hidden = true;
    const first = st.querySelector('input:not([hidden]), select');
    if (first && k > 0) first.focus({ preventScroll: true });
  };
  const valid = k => {
    const s = steps[k].dataset.step;
    if (s === 'perfil') return perfil() ? '' : 'Elija una opción para continuar.';
    if (s === 'detalle') return perfil() === 'inst' ? (val('institucion') ? '' : 'Elija el tipo de institución.') : (quiz.querySelector('#q-esp').value ? '' : 'Seleccione su especialidad.');
    if (s === 'seguro') return val('seguro') ? '' : 'Elija una opción para continuar.';
    return '';
  };
  const go = dir => {
    if (dir > 0) {
      const m = valid(i);
      if (m) { err.textContent = m; err.hidden = false; return; }
      if (i === steps.length - 1) return finish();
    }
    i = Math.max(0, Math.min(steps.length - 1, i + dir));
    show(i);
  };
  back.addEventListener('click', () => go(-1));

  const card = f => {
    const p = PR[f]; if (!p) return '';
    return `<a href="${f}" class="pcard"><span class="pcard__ic"><svg aria-hidden="true" focusable="false"><use href="#i-${p.icon}"/></svg></span><span class="pcard__cat">${p.cat}</span><span class="pcard__t">${p.name}</span><span class="pcard__d">${p.short}</span><span class="pcard__more">Ver seguro <svg aria-hidden="true" focusable="false"><use href="#i-arrow"/></svg></span></a>`;
  };
  function finish() {
    const p = perfil(), seg = val('seguro'), extras = [...quiz.querySelectorAll('[name^="extra-"]:checked')].map(x => x.value);
    const espSel = quiz.querySelector('#q-esp'), esp = espSel.value, high = espSel.selectedOptions[0]?.dataset.high === '1';
    const recs = [];
    if (p !== 'inst') recs.push('responsabilidad-civil-medica.html');
    if (p !== 'prof') recs.push('rc-medica-sociedades.html');
    const map = { familia: ['seguro-de-vida.html', 'accidentes-personales.html'], salud: ['seguro-gastos-medicos-mayores.html', 'asistencia-medica.html'], vehiculo: ['seguro-de-vehiculos.html'], hogar: ['seguro-de-hogar.html'], viajes: ['seguro-de-viaje.html'], instalaciones: ['multirriesgo-clinicas.html'], directivos: ['seguro-do.html'] };
    extras.forEach(x => (map[x] || []).forEach(f => { if (!recs.includes(f)) recs.push(f); }));
    if (p !== 'prof' && !recs.includes('multirriesgo-clinicas.html')) recs.push('multirriesgo-clinicas.html');

    const badge = result.querySelector('.q-badge'), title = result.querySelector('.q-title'), text = result.querySelector('.q-text');
    const subj = p === 'inst' ? 'su institución' : 'usted';
    const lv = seg === 'no' ? ['high', 'Prioridad alta', `Hoy ${p === 'inst' ? 'su institución ejerce' : 'ejerce'} sin respaldo frente a reclamaciones`] :
      seg === 'duda' ? ['mid', 'Revisión recomendada', 'Conviene revisar qué cubre exactamente su póliza'] :
        ['ok', 'Buena base', 'Tiene una base de protección: revisemos que sea suficiente'];
    badge.className = 'q-badge ' + lv[0]; badge.textContent = lv[1]; title.textContent = lv[2];
    const parts = [];
    if (p !== 'inst') {
      parts.push(high
        ? `<p><strong>${esp}</strong> suele estar entre las especialidades con más reclamaciones, por la naturaleza de sus procedimientos.</p>`
        : `<p>Cualquier acto médico puede dar lugar a una reclamación. Desde la reforma del COIP (art. 146), la mala práctica profesional puede tener también consecuencias penales.</p>`);
    } else {
      parts.push('<p>Una sola reclamación puede afectar la estabilidad financiera, la reputación y la continuidad de un centro de salud, también por actos de su personal.</p>');
    }
    if (seg === 'no') parts.push(`<p>Le recomendamos priorizar un seguro de responsabilidad civil que proteja a ${subj} en las vías penal, civil, administrativa y extrajudicial.</p>`);
    if (seg === 'duda') parts.push('<p>Revisamos su póliza actual <strong>sin costo</strong>: sumas aseguradas, exclusiones, retroactividad y si incluye defensa legal especializada.</p>');
    if (seg === 'si') parts.push('<p>Compruebe que la suma asegurada se ajusta a su riesgo actual y que la póliza incluye defensa legal y fianzas. Le ayudamos a revisarlo sin compromiso.</p>');
    text.innerHTML = parts.join('');
    result.querySelector('.q-recs').innerHTML = recs.slice(0, 6).map(card).join('');

    // Preparar el formulario de contacto con las respuestas
    const tipo = document.querySelector('#f-tipo'), fesp = document.querySelector('#f-esp');
    result.querySelector('[data-q-cta]').onclick = () => {
      if (tipo) tipo.value = p === 'inst' ? 'corp' : 'rc';
      if (fesp && esp && esp !== 'Otra especialidad') fesp.value = esp;
      setTimeout(() => document.querySelector('#f-nombre')?.focus({ preventScroll: true }), reduce ? 0 : 700);
    };
    steps.forEach(s => { s.hidden = true; });
    nav.hidden = true; count.hidden = true; err.hidden = true;
    bar.style.width = '100%';
    result.hidden = false;
    result.focus();
    result.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  }
  quiz.querySelector('[data-q-reset]').addEventListener('click', () => {
    quiz.reset(); result.hidden = true; nav.hidden = false; count.hidden = false; i = 0; show(0);
    quiz.querySelector('[name="perfil"]').focus();
  });
  quiz.addEventListener('submit', e => { e.preventDefault(); go(1); });
  show(0);
})();

/* ==========================================================
   Últimos artículos del blog (WordPress en /blog)
   Lee la API de WordPress del mismo dominio. Si no responde,
   se mantienen los artículos incluidos en la página.
   ========================================================== */
(function () {
  'use strict';
  if (!/^https?:$/.test(location.protocol)) return;
  const grids = document.querySelectorAll('.posts[data-feed]');
  if (!grids.length || !window.fetch) return;
  const max = Math.max(...[...grids].map(g => +g.dataset.feed || 3));
  const API = '/blog/wp-json/wp/v2/posts?per_page=' + max + '&_embed=wp:featuredmedia,wp:term';
  const text = html => new DOMParser().parseFromString(html || '', 'text/html').body.textContent.trim();
  const safeUrl = u => { try { const x = new URL(u, location.origin); return /^https?:$/.test(x.protocol) ? x.href : ''; } catch (e) { return ''; } };
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt) n.textContent = txt; return n; };
  const arrow = () => { const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); s.setAttribute('aria-hidden', 'true'); s.setAttribute('focusable', 'false'); const u = document.createElementNS('http://www.w3.org/2000/svg', 'use'); u.setAttribute('href', '#i-arrow'); s.appendChild(u); return s; };
  const ctrl = 'AbortController' in window ? new AbortController() : null;
  const timer = setTimeout(() => ctrl && ctrl.abort(), 6000);
  fetch(API, { signal: ctrl ? ctrl.signal : undefined, credentials: 'omit', headers: { Accept: 'application/json' } })
    .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
    .then(posts => {
      clearTimeout(timer);
      if (!Array.isArray(posts) || posts.length < 3) return;
      grids.forEach(grid => {
        const n = +grid.dataset.feed || 3;
        const frag = document.createDocumentFragment();
        posts.slice(0, n).forEach(p => {
          const link = safeUrl(p.link); if (!link) return;
          const media = (p._embedded && p._embedded['wp:featuredmedia'] || [])[0] || {};
          const sizes = media.media_details && media.media_details.sizes || {};
          const img = safeUrl((sizes.medium_large || sizes.large || sizes.medium || {}).source_url || media.source_url || '');
          const cat = ((p._embedded && p._embedded['wp:term'] || [])[0] || [])[0];
          const a = el('a', 'post reveal in'); a.href = link;
          const fig = el('div', 'post__img');
          if (img) { const i = el('img'); i.src = img; i.alt = ''; i.loading = 'lazy'; fig.appendChild(i); }
          const body = el('div', 'post__body');
          body.appendChild(el('span', 'post__cat', cat ? text(cat.name) : 'Blog'));
          body.appendChild(el('h3', '', text(p.title && p.title.rendered)));
          const more = el('span', 'post__more', 'Leer artículo '); more.appendChild(arrow());
          body.appendChild(more);
          a.append(fig, body); frag.appendChild(a);
        });
        if (frag.childNodes.length >= 3) { grid.replaceChildren(frag); grid.setAttribute('aria-live', 'polite'); }
      });
    })
    .catch(() => clearTimeout(timer));
})();
