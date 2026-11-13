(function () {
  'use strict';

  /* Año del pie de página y sombra del header */
  const year = document.getElementById('anio');
  if (year) year.textContent = new Date().getFullYear();
  const header = document.querySelector('.header-marca');
  const onScroll = () => { if (header) header.classList.toggle('con-sombra', window.scrollY > 10); };
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* Proyecto destacado */
  const grid = document.getElementById('proyectos-grid');
  if (grid) grid.innerHTML = `
    <a class="proyecto" href="https://remaxunited.mx/" target="_blank" rel="noopener noreferrer" aria-label="Explorar el proyecto RE/MAX UNITED">
      <figure class="proyecto-img"><img src="remax-united-proyecto.png" alt="Sitio web de RE/MAX UNITED: proyecto Miramar Punta Sur" loading="lazy"></figure>
      <div class="proyecto-info">
        <div><h3>RE/MAX UNITED</h3><p>Portal inmobiliario a medida</p></div>
        <span class="proyecto-link">Explorar ↗</span>
      </div>
    </a>`;

  /* Carrusel de soluciones */
  const track = document.getElementById('sv-track');
  const prev = document.getElementById('sv-prev');
  const next = document.getElementById('sv-next');
  if (track && prev && next) {
    const step = () => {
      const card = track.querySelector('.sv-card');
      const gap = parseFloat(getComputedStyle(track).columnGap) || 16;
      return card ? card.getBoundingClientRect().width + gap : track.clientWidth * 0.8;
    };
    const update = () => {
      prev.disabled = track.scrollLeft < 4;
      next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
    };
    prev.addEventListener('click', () => track.scrollBy({ left: -step(), behavior: 'smooth' }));
    next.addEventListener('click', () => track.scrollBy({ left: step(), behavior: 'smooth' }));
    track.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  }

  /* Frase rotativa del hero */
  const rota = document.getElementById('rota');
  if (rota && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const frases = ['sitios web que venden', 'tiendas abiertas 24/7', 'sistemas a tu medida', 'reservas en línea'];
    let n = 0;
    setInterval(() => {
      rota.classList.add('sale');
      setTimeout(() => {
        n = (n + 1) % frases.length;
        rota.textContent = frases[n];
        rota.classList.add('abajo'); rota.classList.remove('sale');
        void rota.offsetWidth;
        rota.classList.remove('abajo');
      }, 360);
    }, 2800);
  }

  /* Logo 3D: se arrastra, gira solo despacio y tiene grosor real (capas apiladas) */
  const stage = document.getElementById('logo3d-stage');
  const logo = document.getElementById('logo3d');
  const escena = document.getElementById('logo3d-escena');
  const hero = document.querySelector('.hero');
  if (stage && logo) {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const src = logo.querySelector('img').getAttribute('src');
    const LAYERS = 9, STEP = 1.3;
    logo.textContent = '';
    for (let i = 0; i < LAYERS; i++) {
      const f = new Image(); f.src = src; f.alt = ''; f.draggable = false;
      f.style.transform = `translateZ(${i * STEP}px)`;
      logo.appendChild(f);
    }
    for (let i = 1; i <= LAYERS; i++) {
      const b = new Image(); b.src = src; b.alt = ''; b.draggable = false;
      b.style.transform = `rotateY(180deg) translateZ(${i * STEP}px)`;
      logo.appendChild(b);
    }

    const AUTO = reduce ? 0 : 0.22;          // grados por cuadro (a 60 fps)
    let ry = reduce ? -18 : -200, rx = 8;     // giro de entrada al cargar
    let vy = reduce ? 0 : 9, vx = 0;
    let mx = 0, my = 0, px = 0, py = 0;
    let dragging = false, lastX = 0, lastY = 0, visible = true, prevT = 0, raf = 0;

    const render = () => { logo.style.transform = `rotateX(${rx.toFixed(2)}deg) rotateY(${ry.toFixed(2)}deg)`; };
    const markUsed = () => stage.classList.add('usado');

    const tick = (t) => {
      raf = 0;
      const dt = Math.min((t - (prevT || t)) / 16.67, 3); prevT = t;
      if (!dragging) {
        ry += vy * dt;
        rx += vx * dt;
        vy += (AUTO - vy) * 0.035 * dt;      // la inercia se apaga y vuelve al giro lento
        vx *= Math.pow(0.92, dt);
        rx += ((8 - my * 12) - rx) * 0.05 * dt; // se inclina hacia el cursor
      }
      px += (mx - px) * 0.06 * dt; py += (my - py) * 0.06 * dt;
      if (escena) escena.style.transform = `translate3d(${(px * 16).toFixed(1)}px, ${(py * 12).toFixed(1)}px, 0)`;
      render();
      if (visible) raf = requestAnimationFrame(tick);
    };
    const start = () => { if (!raf && visible) { prevT = 0; raf = requestAnimationFrame(tick); } };

    if (hero && !reduce) {
      hero.addEventListener('pointermove', (e) => {
        if (e.pointerType !== 'mouse') return;
        const r = hero.getBoundingClientRect();
        mx = ((e.clientX - r.left) / r.width - 0.5) * 2;
        my = ((e.clientY - r.top) / r.height - 0.5) * 2;
      });
      hero.addEventListener('pointerleave', () => { mx = 0; my = 0; });
    }
    if (reduce) document.querySelectorAll('.orbita animateMotion').forEach((a) => a.remove());
    stage.addEventListener('pointerdown', (e) => {
      dragging = true; lastX = e.clientX; lastY = e.clientY; vy = 0; vx = 0;
      stage.classList.add('arrastrando'); markUsed();
      stage.setPointerCapture(e.pointerId);
    });
    stage.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX, dy = e.clientY - lastY;
      lastX = e.clientX; lastY = e.clientY;
      ry += dx * 0.6;
      rx = Math.max(-35, Math.min(35, rx - dy * 0.35));
      vy = dx * 0.6; vx = 0;                 // última velocidad = inercia al soltar
    });
    const release = () => { dragging = false; stage.classList.remove('arrastrando'); };
    stage.addEventListener('pointerup', release);
    stage.addEventListener('pointercancel', release);
    stage.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowLeft') { vy = -7; markUsed(); e.preventDefault(); }
      if (e.key === 'ArrowRight') { vy = 7; markUsed(); e.preventDefault(); }
    });

    new IntersectionObserver((entries) => {
      visible = entries[0].isIntersecting;
      if (visible) start();
    }).observe(stage);
    render(); start();
  }
})();
