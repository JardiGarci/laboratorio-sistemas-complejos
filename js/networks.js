/* ============================================================
   REDES COMPLEJAS
   - Tipos de redes (4 small inline SVG visualizations)
   - Métricas / centralidad (cards)
   - Watts-Strogatz interactivo (network + L/C plot)
   - Casos de uso (cards)
============================================================ */
(function () {

  // -----------------------------------------------------------
  // 1. TIPOS DE REDES — 4 small SVG vis
  // -----------------------------------------------------------
  const TYPES = [
    {
      id: 'regular',
      name: 'Red regular',
      meta: 'ring lattice · k constante',
      txt: 'Cada nodo conectado con sus k vecinos más cercanos. Estructurada y predecible: alta agrupación local, caminos largos.',
      render: drawRegular,
    },
    {
      id: 'random',
      name: 'Red aleatoria',
      meta: 'Erdős–Rényi · G(n, p)',
      txt: 'Cada par de nodos conectado con probabilidad p. Distribución de grado Poisson. Caminos cortos pero sin estructura local.',
      render: drawRandom,
    },
    {
      id: 'small',
      name: 'Mundo pequeño',
      meta: 'Watts–Strogatz · p pequeño',
      txt: 'Una red regular con pocas reconexiones al azar. Lo mejor de ambos mundos: caminos cortos y alta agrupación. Aparece en sociales, neuronales, eléctricas.',
      render: drawSmallWorld,
    },
    {
      id: 'scalefree',
      name: 'Libre de escala',
      meta: 'Barabási–Albert · P(k) ~ k^-γ',
      txt: 'Pocos hubs muy conectados y muchos nodos periféricos. Crecimiento preferencial. Internet, WWW, citaciones, biología celular.',
      render: drawScaleFree,
    },
  ];

  function _ring(n, k) {
    const pts = [];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 2 * Math.PI - Math.PI / 2;
      pts.push({ a, x: 50 + Math.cos(a) * 36, y: 50 + Math.sin(a) * 36 });
    }
    const edges = [];
    for (let i = 0; i < n; i++) for (let j = 1; j <= k; j++) edges.push([i, (i + j) % n]);
    return { pts, edges };
  }

  function drawRegular(svg) {
    const { pts, edges } = _ring(18, 2);
    let s = '';
    edges.forEach(([i, j]) => {
      s += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke="#0fb5c4" stroke-opacity="0.55" stroke-width="0.7"/>`;
    });
    pts.forEach(p => {
      s += `<circle cx="${p.x}" cy="${p.y}" r="2.3" fill="#0fb5c4"/>`;
    });
    svg.innerHTML = s;
  }

  function drawRandom(svg) {
    const n = 18;
    const pts = [];
    const rng = (() => { let s = 7; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
    for (let i = 0; i < n; i++) pts.push({ x: 8 + rng() * 84, y: 8 + rng() * 84 });
    let s = '';
    const p = 0.14;
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) {
      if (rng() < p) {
        s += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke="#0fb5c4" stroke-opacity="0.4" stroke-width="0.6"/>`;
      }
    }
    pts.forEach(p => { s += `<circle cx="${p.x}" cy="${p.y}" r="2.3" fill="#0fb5c4"/>`; });
    svg.innerHTML = s;
  }

  function drawSmallWorld(svg) {
    const n = 18, k = 2;
    const { pts, edges } = _ring(n, k);
    const rng = (() => { let s = 13; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
    const used = new Set();
    const rewired = edges.map(([i, j]) => {
      if (rng() < 0.12) {
        let nj = Math.floor(rng() * n);
        let tries = 0;
        while ((nj === i || used.has(i + '|' + nj) || used.has(nj + '|' + i)) && tries < 20) {
          nj = Math.floor(rng() * n); tries++;
        }
        used.add(i + '|' + nj);
        return [i, nj];
      }
      used.add(i + '|' + j);
      return [i, j];
    });
    let s = '';
    rewired.forEach(([i, j]) => {
      const ringDist = Math.min(Math.abs(i - j), n - Math.abs(i - j));
      const isShortcut = ringDist > k;
      s += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke="${isShortcut ? '#7c3aed' : '#9388a8'}" stroke-opacity="${isShortcut ? 0.95 : 0.5}" stroke-width="${isShortcut ? 1.2 : 0.6}"/>`;
    });
    pts.forEach(p => { s += `<circle cx="${p.x}" cy="${p.y}" r="2.3" fill="#7c3aed"/>`; });
    svg.innerHTML = s;
  }

  function drawScaleFree(svg) {
    const n = 22;
    const rng = (() => { let s = 21; return () => (s = (s * 9301 + 49297) % 233280) / 233280; })();
    const degrees = new Array(n).fill(0);
    const edges = [];
    edges.push([0, 1]); edges.push([1, 2]); edges.push([0, 2]);
    degrees[0] = degrees[1] = degrees[2] = 2;
    for (let i = 3; i < n; i++) {
      for (let a = 0; a < 2; a++) {
        const total = degrees.slice(0, i).reduce((s, d) => s + d, 0);
        let r = rng() * total;
        let target = 0;
        for (let j = 0; j < i; j++) { r -= degrees[j]; if (r <= 0) { target = j; break; } }
        if (!edges.some(([u, v]) => (u === i && v === target) || (u === target && v === i))) {
          edges.push([i, target]); degrees[i]++; degrees[target]++;
        }
      }
    }
    const pts = new Array(n);
    const sorted = degrees.map((d, i) => ({ i, d })).sort((a, b) => b.d - a.d);
    const order = new Array(n);
    sorted.forEach((s, k) => order[s.i] = k);
    for (let i = 0; i < n; i++) {
      const k = order[i];
      const ring = k < 4 ? 0 : (k < 12 ? 1 : 2);
      const ringR = ring === 0 ? 11 : ring === 1 ? 26 : 42;
      const ringN = ring === 0 ? 4 : ring === 1 ? 8 : 10;
      const ringIdx = ring === 0 ? k : ring === 1 ? k - 4 : k - 12;
      const a = (ringIdx / ringN) * 2 * Math.PI + (ring * 0.3);
      pts[i] = { x: 50 + Math.cos(a) * ringR, y: 50 + Math.sin(a) * ringR };
    }
    let s = '';
    edges.forEach(([i, j]) => {
      s += `<line x1="${pts[i].x}" y1="${pts[i].y}" x2="${pts[j].x}" y2="${pts[j].y}" stroke="#ea7e3a" stroke-opacity="0.55" stroke-width="0.7"/>`;
    });
    pts.forEach((p, i) => {
      const r = Math.max(1.6, Math.min(4.8, 1.4 + degrees[i] * 0.35));
      s += `<circle cx="${p.x}" cy="${p.y}" r="${r}" fill="#ea7e3a"/>`;
    });
    svg.innerHTML = s;
  }

  function buildTypes() {
    const root = document.getElementById('netTypes');
    if (!root) return;
    TYPES.forEach(t => {
      const card = document.createElement('article');
      card.className = 'nt-card';
      card.innerHTML =
        '<div class="nt-card__viz"><svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet"></svg></div>' +
        '<div class="nt-card__body">' +
          '<h4 class="nt-card__name">' + t.name + '</h4>' +
          '<p class="nt-card__meta">' + t.meta + '</p>' +
          '<p class="nt-card__txt">' + t.txt + '</p>' +
        '</div>';
      root.appendChild(card);
      const svg = card.querySelector('svg');
      const io = new IntersectionObserver((entries, obs) => {
        for (const e of entries) if (e.isIntersecting) { t.render(svg); obs.disconnect(); }
      }, { rootMargin: '120px' });
      io.observe(card);
    });
  }
  buildTypes();

  // -----------------------------------------------------------
  // 2. METRICAS / CENTRALIDAD
  // -----------------------------------------------------------
  const METRICS = [
    { name: 'Grado · degree',
      formula: 'k_i = Σⱼ A_ij',
      txt: 'El número de conexiones del nodo. La más simple y a menudo la más útil. Un nodo de alto grado es un hub.',
      use: 'Encontrar nodos populares; detectar hubs.',
      svg: '<circle cx="11" cy="11" r="9" fill="none" stroke="#ea7e3a" stroke-width="1.6"/><circle cx="11" cy="11" r="3" fill="#ea7e3a"/>' },
    { name: 'Intermediación · betweenness',
      formula: 'B_i = Σ σ(s,t|i) / σ(s,t)',
      txt: 'Fracción de caminos más cortos entre todos los pares que pasan por el nodo. Mide cuánto cuello-de-botella es.',
      use: 'Detectar puntos críticos; vulnerabilidad de la red.',
      svg: '<path d="M3 11 L11 4 L19 11 L11 18 Z" fill="none" stroke="#7c3aed" stroke-width="1.6"/><circle cx="11" cy="11" r="2.5" fill="#7c3aed"/>' },
    { name: 'Cercanía · closeness',
      formula: 'C_i = 1 / Σⱼ d(i,j)',
      txt: 'Inverso de la suma de distancias del nodo al resto. Alto = puede alcanzar a todos rápidamente.',
      use: 'Difusión de información, ubicación óptima.',
      svg: '<circle cx="11" cy="11" r="3" fill="#0fb5c4"/><circle cx="11" cy="11" r="7" fill="none" stroke="#0fb5c4" stroke-width="1" stroke-opacity="0.5"/><circle cx="11" cy="11" r="10" fill="none" stroke="#0fb5c4" stroke-width="1" stroke-opacity="0.25"/>' },
    { name: 'Eigenvector · PageRank',
      formula: 'x_i = (1/λ) Σⱼ A_ij x_j',
      txt: 'Tu importancia es proporcional a la suma de la importancia de tus vecinos. Recursivo. Base del PageRank de Google.',
      use: 'Ranking de páginas web, influencia en redes sociales.',
      svg: '<circle cx="6" cy="14" r="2" fill="#7c3aed"/><circle cx="16" cy="14" r="2" fill="#7c3aed"/><circle cx="11" cy="6" r="3" fill="#ea7e3a"/><line x1="11" y1="6" x2="6" y2="14" stroke="#ea7e3a" stroke-width="1"/><line x1="11" y1="6" x2="16" y2="14" stroke="#ea7e3a" stroke-width="1"/>' },
    { name: 'Clustering · agrupamiento',
      formula: 'C_i = 2e_i / k_i(k_i − 1)',
      txt: 'Qué tan conectados están los vecinos de un nodo entre sí. Mide si "los amigos de mis amigos también son amigos entre ellos".',
      use: 'Detección de comunidades, cohesión local.',
      svg: '<circle cx="11" cy="6" r="2" fill="#16a34a"/><circle cx="5" cy="16" r="2" fill="#16a34a"/><circle cx="17" cy="16" r="2" fill="#16a34a"/><path d="M11 6 L5 16 L17 16 Z" fill="#16a34a" fill-opacity="0.18" stroke="#16a34a" stroke-width="1"/>' },
    { name: 'Distancia media · L',
      formula: '⟨L⟩ = (1/n(n−1)) Σ d(i,j)',
      txt: 'Longitud típica del camino más corto entre dos nodos al azar. En redes pequeñas-mundo, sorprendentemente baja: 6 grados de separación.',
      use: 'Caracterizar topología global; difusión.',
      svg: '<circle cx="4" cy="11" r="2" fill="#e63990"/><circle cx="18" cy="11" r="2" fill="#e63990"/><circle cx="9" cy="11" r="1.5" fill="#e63990" opacity="0.6"/><circle cx="14" cy="11" r="1.5" fill="#e63990" opacity="0.6"/><line x1="4" y1="11" x2="18" y2="11" stroke="#e63990" stroke-width="0.8" stroke-dasharray="2 2"/>' },
  ];
  function buildMetrics() {
    const root = document.getElementById('metrics');
    if (!root) return;
    METRICS.forEach(m => {
      const card = document.createElement('article');
      card.className = 'metric';
      card.innerHTML =
        '<div class="metric__head">' +
          '<span class="metric__icon"><svg viewBox="0 0 22 22">' + m.svg + '</svg></span>' +
          '<h4 class="metric__name">' + m.name + '</h4>' +
        '</div>' +
        '<span class="metric__formula">' + m.formula + '</span>' +
        '<p class="metric__txt">' + m.txt + '</p>' +
        '<p class="metric__use">↗ ' + m.use + '</p>';
      root.appendChild(card);
    });
  }
  buildMetrics();

  // -----------------------------------------------------------
  // 3. CASOS DE USO
  // -----------------------------------------------------------
  const CASES = [
    { tag: 'Internet · Google', name: 'PageRank',
      txt: 'El algoritmo que ordenó la web. Trata enlaces como votos: una página es importante si páginas importantes la enlazan. Centralidad de eigenvector aplicada al WWW.',
      metric: 'centralidad eigenvector', color: '#7c3aed' },
    { tag: 'Epidemiología', name: 'Modelos de contagio',
      txt: 'En SARS-CoV-2 y otros patógenos, la topología de contactos determina la propagación. La intervención sobre super-spreaders (hubs) es desproporcionadamente eficaz.',
      metric: 'umbral epidémico · k²', color: '#e63990' },
    { tag: 'Neurociencia', name: 'Conectoma cerebral',
      txt: 'El cerebro es una red de ~10¹¹ neuronas con ~10¹⁴ conexiones. Mapearlo permite estudiar trastornos como Alzheimer y esquizofrenia desde su arquitectura.',
      metric: 'small-world + scale-free', color: '#0fb5c4' },
    { tag: 'Finanzas', name: 'Riesgo sistémico',
      txt: 'Una banca interconectada propaga shocks: la quiebra de un nodo central puede colapsar el sistema. La regulación post-2008 mide esta exposición topológicamente.',
      metric: 'centralidad + cascadas', color: '#ea7e3a' },
    { tag: 'Sociología', name: 'Redes sociales',
      txt: 'La difusión de innovaciones, opiniones y comportamientos sigue la estructura de quién está conectado con quién. Permite identificar líderes de opinión y burbujas.',
      metric: 'comunidades · modularidad', color: '#16a34a' },
    { tag: 'Logística', name: 'Cadenas de suministro',
      txt: 'Comercio global, transporte aéreo, distribución de paquetes — todo se modela como red. Optimizar es minimizar L; resistir disrupciones es maximizar robustez.',
      metric: 'L, robustez', color: '#0fb5c4' },
  ];
  function buildCases() {
    const root = document.getElementById('cases');
    if (!root) return;
    CASES.forEach(c => {
      const card = document.createElement('article');
      card.className = 'case';
      card.innerHTML =
        '<div class="case__strip" style="background:' + c.color + '"></div>' +
        '<p class="case__tag">' + c.tag + '</p>' +
        '<h4 class="case__name">' + c.name + '</h4>' +
        '<p class="case__txt">' + c.txt + '</p>' +
        '<p class="case__metric">↗ ' + c.metric + '</p>';
      root.appendChild(card);
    });
  }
  buildCases();

  // -----------------------------------------------------------
  // 4. WATTS-STROGATZ INTERACTIVE
  // -----------------------------------------------------------
  const wsNet  = document.getElementById('wsNet');
  const wsPlot = document.getElementById('wsPlot');
  const slider = document.getElementById('wsSlider');
  const wsRegen= document.getElementById('wsRegen');
  if (!wsNet || !wsPlot || !slider) return;

  const N = 32;
  const K = 4;
  let seed = 17;
  function mkRng(s) {
    let v = s | 0;
    if (v <= 0) v += 2147483646;
    return () => { v = (v * 16807) % 2147483647; return (v - 1) / 2147483646; };
  }

  const pts = [];
  for (let i = 0; i < N; i++) {
    const a = (i / N) * 2 * Math.PI - Math.PI / 2;
    pts.push({ a, x: 200 + Math.cos(a) * 150, y: 200 + Math.sin(a) * 150 });
  }

  function buildRegular() {
    const edges = [];
    for (let i = 0; i < N; i++) for (let j = 1; j <= K; j++) {
      const t = (i + j) % N;
      const a = Math.min(i, t), b = Math.max(i, t);
      edges.push({ a, b });
    }
    return edges;
  }
  const BASE_EDGES = buildRegular();

  function rewireGraph(p, seedV) {
    const rng = mkRng(seedV);
    const edgeSet = new Set();
    const edges = BASE_EDGES.map(e => ({ ...e }));
    edges.forEach(e => edgeSet.add(e.a + '|' + e.b));
    edges.forEach((e, idx) => {
      if (rng() < p) {
        edgeSet.delete(e.a + '|' + e.b);
        let placed = false;
        for (let tries = 0; tries < 60 && !placed; tries++) {
          const nb = Math.floor(rng() * N);
          if (nb === e.a) continue;
          const a = Math.min(e.a, nb), b = Math.max(e.a, nb);
          const key = a + '|' + b;
          if (!edgeSet.has(key)) {
            edges[idx] = { a, b };
            edgeSet.add(key);
            placed = true;
          }
        }
        if (!placed) edgeSet.add(e.a + '|' + e.b);
      }
    });
    return edges;
  }

  function adjacency(edges) {
    const adj = Array.from({ length: N }, () => new Set());
    edges.forEach(e => { adj[e.a].add(e.b); adj[e.b].add(e.a); });
    return adj;
  }

  function avgPathLength(adj) {
    let sum = 0, count = 0;
    for (let s = 0; s < N; s++) {
      const dist = new Int32Array(N).fill(-1); dist[s] = 0;
      const q = [s];
      while (q.length) {
        const u = q.shift();
        for (const v of adj[u]) {
          if (dist[v] === -1) { dist[v] = dist[u] + 1; q.push(v); }
        }
      }
      for (let t = 0; t < N; t++) if (t !== s && dist[t] > 0) { sum += dist[t]; count++; }
    }
    return count > 0 ? sum / count : 0;
  }

  function clusteringCoef(adj) {
    let total = 0, cnt = 0;
    for (let i = 0; i < N; i++) {
      const nb = [...adj[i]];
      const k = nb.length;
      if (k < 2) continue;
      let e = 0;
      for (let a = 0; a < nb.length; a++)
        for (let b = a + 1; b < nb.length; b++)
          if (adj[nb[a]].has(nb[b])) e++;
      total += (2 * e) / (k * (k - 1));
      cnt++;
    }
    return cnt > 0 ? total / cnt : 0;
  }

  const P_SAMPLES = 24;
  const P_AXIS = [0];
  for (let i = 0; i < P_SAMPLES; i++) {
    const t = i / (P_SAMPLES - 1);
    P_AXIS.push(Math.pow(10, -3 + t * 3));
  }
  let L0 = 1, C0 = 1;
  let curveL = [], curveC = [];

  function precomputeCurves() {
    const baseAdj = adjacency(BASE_EDGES);
    L0 = avgPathLength(baseAdj);
    C0 = clusteringCoef(baseAdj);
    curveL = []; curveC = [];
    const trials = 4;
    P_AXIS.forEach((p, idx) => {
      let sumL = 0, sumC = 0;
      for (let t = 0; t < trials; t++) {
        const edges = rewireGraph(p, seed + t * 113 + idx * 17);
        const adj = adjacency(edges);
        sumL += avgPathLength(adj);
        sumC += clusteringCoef(adj);
      }
      curveL.push(sumL / trials / L0);
      curveC.push(sumC / trials / C0);
    });
  }

  function drawNet(p) {
    const edges = rewireGraph(p, seed);
    const adj = adjacency(edges);
    let s = '';
    edges.forEach(e => {
      const ringDist = Math.min(Math.abs(e.a - e.b), N - Math.abs(e.a - e.b));
      const isShort = ringDist <= K;
      const stroke = isShort ? '#cbc3b1' : '#7c3aed';
      const op     = isShort ? 0.45 : 0.90;
      const sw     = isShort ? 0.8 : 1.4;
      s += `<line x1="${pts[e.a].x}" y1="${pts[e.a].y}" x2="${pts[e.b].x}" y2="${pts[e.b].y}" stroke="${stroke}" stroke-opacity="${op}" stroke-width="${sw}"/>`;
    });
    pts.forEach((pt, i) => {
      const deg = adj[i].size;
      const r = 3 + Math.min(4, deg * 0.25);
      s += `<circle cx="${pt.x}" cy="${pt.y}" r="${r}" fill="#0fb5c4" stroke="#fff" stroke-width="1"/>`;
    });
    wsNet.innerHTML = s;

    const L = avgPathLength(adj);
    const C = clusteringCoef(adj);
    const Ln = L / L0, Cn = C / C0;
    document.getElementById('wsP').textContent = p.toFixed(3);
    document.getElementById('wsL').textContent = Ln.toFixed(3);
    document.getElementById('wsC').textContent = Cn.toFixed(3);
    drawPlot(p, Ln, Cn);
  }

  function fitPlot() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = wsPlot.getBoundingClientRect();
    wsPlot.width  = Math.max(1, Math.round(r.width  * dpr));
    wsPlot.height = Math.max(1, Math.round(r.height * dpr));
  }

  function drawPlot(curP, curL, curC) {
    const W = wsPlot.width, H = wsPlot.height;
    const px = wsPlot.getContext('2d');
    px.fillStyle = '#fbf9f6';
    px.fillRect(0, 0, W, H);

    const LP = 58, RP = 18, TP = 24, BP = 50;
    const IW = W - LP - RP, IH = H - TP - BP;

    const xMin = -3, xMax = 0;
    const yMin = 0, yMax = 1.05;
    const xToP = x => LP + (x - xMin)/(xMax - xMin) * IW;
    const yToP = y => TP + (1 - (y - yMin)/(yMax - yMin)) * IH;

    // grid
    px.strokeStyle = '#e6e1d4'; px.setLineDash([3, 4]); px.lineWidth = 0.8;
    px.beginPath();
    for (let i = 0; i <= 5; i++) {
      const y = TP + IH * i/5;
      px.moveTo(LP, y); px.lineTo(LP + IW, y);
    }
    for (let i = xMin; i <= xMax; i++) {
      const x = xToP(i);
      px.moveTo(x, TP); px.lineTo(x, TP + IH);
    }
    px.stroke(); px.setLineDash([]);

    // small-world band
    const xb1 = xToP(-2.3), xb2 = xToP(-1);
    px.fillStyle = 'rgba(124,58,237,0.10)';
    px.fillRect(xb1, TP, xb2 - xb1, IH);

    // axes
    px.strokeStyle = '#cbc3b1'; px.lineWidth = 1.2;
    px.beginPath(); px.moveTo(LP, TP); px.lineTo(LP, TP + IH); px.lineTo(LP + IW, TP + IH);
    px.stroke();

    px.fillStyle = '#6a6a76';
    px.font = `${Math.max(11, W * 0.020)}px JetBrains Mono, monospace`;
    px.textAlign = 'center';
    px.fillText('log₁₀ p', LP + IW/2, H - 14);
    px.save();
    px.translate(14, TP + IH/2);
    px.rotate(-Math.PI / 2);
    px.textAlign = 'center';
    px.fillText('valor normalizado', 0, 0);
    px.restore();

    px.fillStyle = '#9a9aa6';
    px.font = `${Math.max(10, W * 0.018)}px JetBrains Mono, monospace`;
    px.textAlign = 'center';
    const exponents = ['⁻³','⁻²','⁻¹','⁰'];
    for (let i = xMin; i <= xMax; i++) {
      const tx = xToP(i);
      px.fillText('10' + exponents[i + 3], tx, TP + IH + 18);
    }
    px.textAlign = 'right';
    [0, 0.25, 0.5, 0.75, 1].forEach(y => {
      const ty = yToP(y);
      px.fillText(y.toFixed(2), LP - 6, ty + 3);
    });

    // legend
    px.font = `bold ${Math.max(11, W * 0.022)}px JetBrains Mono, monospace`;
    px.textAlign = 'left';
    px.fillStyle = '#0fb5c4'; px.fillText('— L(p)/L(0)', LP + 8, TP + 14);
    px.fillStyle = '#ea7e3a'; px.fillText('— C(p)/C(0)', LP + 8, TP + 32);

    function drawCurve(values, color) {
      px.strokeStyle = color; px.lineWidth = 2.2;
      px.beginPath();
      let started = false;
      for (let i = 0; i < P_AXIS.length; i++) {
        const p = P_AXIS[i];
        if (p < 1e-3) continue;
        const lx = xToP(Math.log10(p));
        const ly = yToP(values[i]);
        if (!started) { px.moveTo(lx, ly); started = true; }
        else px.lineTo(lx, ly);
      }
      px.stroke();
    }
    drawCurve(curveL, '#0fb5c4');
    drawCurve(curveC, '#ea7e3a');

    function drawDots(values, color) {
      px.fillStyle = color;
      for (let i = 0; i < P_AXIS.length; i++) {
        const p = P_AXIS[i];
        if (p < 1e-3) continue;
        const lx = xToP(Math.log10(p));
        const ly = yToP(values[i]);
        px.beginPath(); px.arc(lx, ly, 2.5, 0, 2 * Math.PI); px.fill();
      }
    }
    drawDots(curveL, '#0fb5c4');
    drawDots(curveC, '#ea7e3a');

    if (curP >= 1e-3) {
      const cxp = xToP(Math.log10(curP));
      px.strokeStyle = '#1a1a1f'; px.setLineDash([4, 3]); px.lineWidth = 1.2;
      px.beginPath(); px.moveTo(cxp, TP); px.lineTo(cxp, TP + IH); px.stroke();
      px.setLineDash([]);

      px.fillStyle = '#0fb5c4'; px.beginPath();
      px.arc(cxp, yToP(Math.min(1, curL)), 6, 0, 2 * Math.PI); px.fill();
      px.strokeStyle = '#fff'; px.lineWidth = 2; px.stroke();
      px.fillStyle = '#ea7e3a'; px.beginPath();
      px.arc(cxp, yToP(Math.min(1, curC)), 6, 0, 2 * Math.PI); px.fill();
      px.strokeStyle = '#fff'; px.lineWidth = 2; px.stroke();
    }
  }

  let curP = 0;
  function update() { drawNet(curP); }

  slider.addEventListener('input', e => {
    curP = parseFloat(e.target.value);
    update();
  });

  if (wsRegen) {
    wsRegen.addEventListener('click', () => {
      seed = (seed * 7 + 31) % 99991;
      precomputeCurves();
      update();
    });
  }

  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    fitPlot();
    precomputeCurves();
    update();
  }
  const io = new IntersectionObserver(entries => {
    for (const e of entries) if (e.isIntersecting) init();
  }, { rootMargin: '100px' });
  io.observe(wsPlot);

  let rT = null;
  window.addEventListener('resize', () => {
    if (!inited) return;
    clearTimeout(rT);
    rT = setTimeout(() => { fitPlot(); update(); }, 120);
  });
})();
