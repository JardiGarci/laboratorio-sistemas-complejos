/* ============================================================
   MAIN — orchestration
   - sticky nav: active-section highlighting, scroll progress
   - reveal-on-scroll IntersectionObserver
   - parallax (hero content)
   - nature cards: generate + render
============================================================ */
(function () {

  // -----------------------------------------------------------
  //  sticky nav: active section + progress bar
  // -----------------------------------------------------------
  const navLinks = document.querySelectorAll('.nav__links a');
  const sections = ['hero','fractales','dimension','multifractal','tda','redes']
    .map(id => document.getElementById(id))
    .filter(Boolean);

  function setActive(id) {
    navLinks.forEach(a => {
      const href = a.getAttribute('href') || '';
      a.classList.toggle('is-current', href === '#' + id);
    });
  }

  const navObserver = new IntersectionObserver(entries => {
    // find the entry with the largest intersection ratio that is intersecting
    let best = null;
    entries.forEach(e => {
      if (e.isIntersecting && (!best || e.intersectionRatio > best.intersectionRatio)) best = e;
    });
    if (best) setActive(best.target.id);
  }, { rootMargin: '-40% 0px -40% 0px', threshold: [0, 0.25, 0.5, 0.75, 1] });
  sections.forEach(s => navObserver.observe(s));

  // progress bar
  const progressEl = document.getElementById('navProgress');
  function updateProgress() {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const pct = max > 0 ? (window.scrollY / max) * 100 : 0;
    if (progressEl) progressEl.style.width = pct + '%';
  }
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();

  // smooth scroll w/ nav offset
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (ev) => {
      const id = a.getAttribute('href').slice(1);
      const el = document.getElementById(id);
      if (!el) return;
      ev.preventDefault();
      const y = el.getBoundingClientRect().top + window.scrollY - 56;
      window.scrollTo({ top: y, behavior: 'smooth' });
    });
  });

  // -----------------------------------------------------------
  //  reveal on scroll
  // -----------------------------------------------------------
  const revealTargets = document.querySelectorAll(
    '.section__title, .prose, .embed, .bc, .formal, .gallery, .nature, .callout, .dim-intuition, ' +
    '.tda-cards, .metrics, .net-types, .cases, .ws, .why-grid, .section__sub-title, .branch-intro__inner'
  );
  revealTargets.forEach(el => el.classList.add('reveal'));
  const revealObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('is-in');
        revealObs.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -8% 0px' });
  revealTargets.forEach(el => revealObs.observe(el));

  // -----------------------------------------------------------
  //  parallax — hero content drift
  // -----------------------------------------------------------
  const parallaxEls = document.querySelectorAll('[data-parallax]');
  function onScrollParallax() {
    const y = window.scrollY;
    parallaxEls.forEach(el => {
      const k = parseFloat(el.dataset.parallax) || 0;
      el.style.transform = `translateY(${-y * k}px)`;
    });
  }
  window.addEventListener('scroll', onScrollParallax, { passive: true });

  // -----------------------------------------------------------
  //  NATURE CARDS — procedural fractal illustrations
  // -----------------------------------------------------------
  const NATURE = [
    {
      id: 'costa',
      tag: 'GEOFÍSICA',
      name: 'Costas',
      dim: 'D ≈ 1.25',
      txt: 'La costa de Bretaña, Noruega o Chile no es una línea — es una curva rugosa cuya longitud diverge cuando afinas la regla. La pendiente Richardson la fija entre 1 y 2.',
      render: drawCoast,
    },
    {
      id: 'pulmon',
      tag: 'ANATOMÍA',
      name: 'Pulmones · árbol bronquial',
      dim: 'D ≈ 2.97',
      txt: 'Los bronquios se ramifican 23 veces, llenando el volumen torácico de superficie respiratoria. Casi tridimensionales — un fractal evolutivo para maximizar intercambio gaseoso.',
      render: drawLung,
    },
    {
      id: 'arbol',
      tag: 'BOTÁNICA',
      name: 'Árboles · copas',
      dim: 'D ≈ 2.6',
      txt: 'La copa de un árbol cubre el espacio aéreo como un Sierpiński tridimensional: cada rama se divide en sub-ramas que siguen la misma regla — el mejor empaque solar con la menor masa.',
      render: drawTree,
    },
    {
      id: 'sismo',
      tag: 'SISMOLOGÍA',
      name: 'Sismos · ley de Gutenberg-Richter',
      dim: 'D ≈ 1.6–2.0',
      txt: 'La distribución espacial y temporal de epicentros y réplicas es autosemejante. La misma pendiente log-log que define un fractal aparece en la distribución de magnitudes.',
      render: drawQuake,
    },
    {
      id: 'mercado',
      tag: 'ECONOFÍSICA',
      name: 'Mercados financieros',
      dim: 'D ≈ 1.4 (intradía)',
      txt: 'Las series de precios — divisas, acciones, índices — exhiben rugosidad fractal y leyes de potencia en sus fluctuaciones. Mandelbrot lo observó en los precios del algodón en 1963.',
      render: drawMarket,
    },
  ];

  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    return { w: canvas.width, h: canvas.height };
  }

  // ----- coastline (midpoint displacement) -----
  function seedRng(seed) {
    let s = (seed | 0) % 2147483647; if (s <= 0) s += 2147483646;
    return () => { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; };
  }
  function drawCoast(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    // sea
    const sea = ctx.createLinearGradient(0, 0, 0, h);
    sea.addColorStop(0, '#0fb5c4'); sea.addColorStop(1, '#047d89');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, w, h);

    // coast — midpoint displacement on a polyline
    let pts = [
      { x: -0.05, y: 0.62 },
      { x: 0.20, y: 0.50 },
      { x: 0.45, y: 0.58 },
      { x: 0.65, y: 0.46 },
      { x: 0.85, y: 0.55 },
      { x: 1.05, y: 0.48 },
    ];
    const rng = seedRng(7);
    let sigma = 0.06;
    for (let it = 0; it < 6; it++) {
      const next = [];
      for (let i = 0; i < pts.length - 1; i++) {
        next.push(pts[i]);
        next.push({
          x: (pts[i].x + pts[i+1].x)/2 + (rng()-0.5) * sigma * 0.4,
          y: (pts[i].y + pts[i+1].y)/2 + (rng()-0.5) * sigma,
        });
      }
      next.push(pts[pts.length - 1]);
      pts = next;
      sigma *= 0.62;
    }

    // land below curve
    const grad = ctx.createLinearGradient(0, h*0.3, 0, h);
    grad.addColorStop(0, '#f4eedf'); grad.addColorStop(1, '#cdbf9b');
    ctx.beginPath();
    ctx.moveTo(-2, h+2);
    pts.forEach(p => ctx.lineTo(p.x * w, p.y * h));
    ctx.lineTo(w+2, h+2);
    ctx.closePath();
    ctx.fillStyle = grad; ctx.fill();

    // foam line
    ctx.strokeStyle = '#fff'; ctx.lineWidth = Math.max(1, w/280);
    ctx.lineJoin = 'round';
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * w, y = p.y * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }

  // ----- bronchial tree -----
  function drawLung(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a0c20'; ctx.fillRect(0, 0, w, h);

    function branch(x, y, ang, len, thick, depth) {
      if (depth === 0 || len < 1.2) return;
      const x2 = x + Math.cos(ang) * len;
      const y2 = y + Math.sin(ang) * len;
      ctx.lineWidth = thick;
      const hue = 290 + (10 - depth) * 5;
      const light = 55 + depth * 1.5;
      ctx.strokeStyle = `hsl(${hue} 70% ${light}% / ${0.55 + depth*0.04})`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();

      const spread = 0.45 + Math.random()*0.20;
      const lenK   = 0.70 + Math.random()*0.10;
      branch(x2, y2, ang - spread, len * lenK, thick * 0.78, depth - 1);
      branch(x2, y2, ang + spread, len * lenK, thick * 0.78, depth - 1);
      // occasional 3rd branch for asymmetry
      if (Math.random() < 0.25 && depth > 4) {
        branch(x2, y2, ang + (Math.random()-0.5)*0.4, len * lenK * 0.85, thick * 0.6, depth - 2);
      }
    }
    // root upward from bottom-center
    ctx.lineCap = 'round';
    branch(w/2, h*0.98, -Math.PI/2, h*0.20, Math.max(3, w/100), 10);
  }

  // ----- recursive tree -----
  function drawTree(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    // sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#fdf3e1'); sky.addColorStop(1, '#e8d8b2');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, w, h);

    function branch(x, y, ang, len, thick, depth) {
      if (depth === 0 || len < 1.2) return;
      const x2 = x + Math.cos(ang) * len;
      const y2 = y + Math.sin(ang) * len;
      ctx.lineWidth = thick;
      const light = 22 + (10 - depth) * 4;
      ctx.strokeStyle = `hsl(28 45% ${light}%)`;
      ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x2, y2); ctx.stroke();
      // leaves on terminal branches
      if (depth <= 2) {
        ctx.fillStyle = `hsla(${15 + Math.random()*15} 70% 55% / 0.55)`;
        ctx.beginPath(); ctx.arc(x2, y2, Math.max(1.4, thick*1.4), 0, 2*Math.PI); ctx.fill();
      }
      const dA = 0.38 + Math.random()*0.20;
      const k  = 0.70 + Math.random()*0.10;
      branch(x2, y2, ang - dA, len * k, thick * 0.72, depth - 1);
      branch(x2, y2, ang + dA, len * k, thick * 0.72, depth - 1);
      if (Math.random() < 0.35 && depth > 4) {
        branch(x2, y2, ang + (Math.random()-0.5)*0.5, len * k * 0.85, thick * 0.55, depth - 2);
      }
    }
    ctx.lineCap = 'round';
    branch(w/2, h*1.0, -Math.PI/2, h*0.22, Math.max(4, w/80), 10);
  }

  // ----- seismic time series -----
  function drawQuake(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#0c0e18'; ctx.fillRect(0, 0, w, h);

    // baseline + ruler grid
    ctx.strokeStyle = 'rgba(255,255,255,0.05)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const y = h * (0.2 + i*0.13);
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // Generate spike series using fBm-like noise + clustered bursts
    const N = 720;
    const series = new Float32Array(N);
    // background noise
    const rng = seedRng(42);
    for (let i = 0; i < N; i++) series[i] = (rng() - 0.5) * 0.04;
    // clustered bursts (self-similar): a few big ones, more medium, many small
    const bursts = [
      { center: 0.30, mag: 0.92 },
      { center: 0.65, mag: 0.65 },
      { center: 0.15, mag: 0.40 },
      { center: 0.78, mag: 0.35 },
      { center: 0.50, mag: 0.30 },
      { center: 0.45, mag: 0.20 },
      { center: 0.85, mag: 0.18 },
      { center: 0.10, mag: 0.20 },
    ];
    bursts.forEach(b => {
      const c = Math.floor(b.center * N);
      const spread = Math.max(2, Math.floor(b.mag * 18));
      for (let j = -spread; j <= spread; j++) {
        const k = c + j;
        if (k < 0 || k >= N) continue;
        // a few high-frequency spikes inside each burst
        const decay = Math.exp(-Math.abs(j) / (spread * 0.6));
        series[k] += (rng() - 0.5) * 2 * b.mag * decay;
      }
      // sharp central spike
      series[c] += (Math.sign(rng() - 0.5)) * b.mag * 1.4;
    });

    // draw
    ctx.lineWidth = Math.max(1, w / 540);
    ctx.strokeStyle = '#ea7e3a';
    ctx.shadowBlur = 6; ctx.shadowColor = '#ea7e3a';
    ctx.beginPath();
    const midY = h * 0.55;
    for (let i = 0; i < N; i++) {
      const x = (i / (N - 1)) * w;
      const y = midY - series[i] * h * 0.32;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // baseline
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, midY); ctx.lineTo(w, midY); ctx.stroke();
  }

  // ----- market price walk -----
  function drawMarket(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, '#0a0c1a'); bg.addColorStop(1, '#141425');
    ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h);

    // fBm-like walk via midpoint displacement
    let pts = [{ x: 0, y: 0.5 }, { x: 1, y: 0.55 }];
    const rng = seedRng(11);
    let sigma = 0.18;
    for (let it = 0; it < 9; it++) {
      const next = [];
      for (let i = 0; i < pts.length - 1; i++) {
        next.push(pts[i]);
        next.push({
          x: (pts[i].x + pts[i+1].x)/2,
          y: (pts[i].y + pts[i+1].y)/2 + (rng()-0.5) * sigma,
        });
      }
      next.push(pts[pts.length - 1]);
      pts = next;
      sigma *= 0.62;   // H ≈ 0.69 — slight persistence
    }

    // grid
    ctx.strokeStyle = 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const y = h * i / 5;
      ctx.moveTo(0, y); ctx.lineTo(w, y);
    }
    ctx.stroke();

    // fill below
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * w, y = (0.15 + p.y * 0.7) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
    const fill = ctx.createLinearGradient(0, 0, 0, h);
    fill.addColorStop(0, 'rgba(15,181,196,0.30)');
    fill.addColorStop(1, 'rgba(15,181,196,0.02)');
    ctx.fillStyle = fill; ctx.fill();

    // stroke
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = p.x * w, y = (0.15 + p.y * 0.7) * h;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#0fb5c4'; ctx.lineWidth = Math.max(1.4, w/420);
    ctx.shadowColor = '#0fb5c4'; ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // build nature grid
  function buildNature() {
    const root = document.getElementById('nature');
    if (!root) return;
    NATURE.forEach(item => {
      const card = document.createElement('article');
      card.className = 'ncard';
      card.dataset.id = item.id;
      card.innerHTML = `
        <div class="ncard__img">
          <span class="ncard__tag">${item.tag}</span>
          <canvas></canvas>
        </div>
        <div class="ncard__body">
          <h3 class="ncard__name">${item.name}</h3>
          <p class="ncard__dim"><strong>${item.dim}</strong></p>
          <p class="ncard__txt">${item.txt}</p>
        </div>
      `;
      root.appendChild(card);
      const canvas = card.querySelector('canvas');
      const io = new IntersectionObserver((entries, obs) => {
        for (const e of entries) if (e.isIntersecting) {
          requestAnimationFrame(() => item.render(canvas));
          obs.disconnect();
        }
      }, { rootMargin: '100px' });
      io.observe(card);
    });
  }
  buildNature();

})();
