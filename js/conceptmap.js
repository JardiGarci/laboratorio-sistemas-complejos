/* ============================================================
   MAPA CONCEPTUAL (hero) — núcleo Sistemas Complejos + 3 ramas
   Layout radial-jerárquico con D3 force simulation
   Click en núcleo → abre modal; click en rama/hoja → navega a sección
============================================================ */
(function () {
  const svgEl = document.getElementById('mapSvg');
  if (!svgEl || !window.d3) return;

  // ---- data ----
  // kinds: core | branch | leaf | locked
  // status: visited | active | current | locked
  const nodes = [
    // CORE
    { id: 'core', label: 'Sistemas Complejos', kind: 'core', status: 'current',
      action: 'modal', desc: 'El estudio de cómo muchas partes interactuando producen comportamiento emergente.',
      cta: 'clic para abrir' },

    // BRANCH 1 — Fractal
    { id: 'b-fractal', label: 'Análisis Fractal', kind: 'branch', status: 'active',
      href: 'fractal.html', branch: 1,
      desc: 'Geometría de lo rugoso, autosemejanza, dimensiones no enteras.', cta: 'abrir página →' },
    { id: 'f-intro',  label: '¿Qué es un fractal?',     kind: 'leaf', status: 'active', href: 'fractal.html#fractales',     branch: 1,
      desc: 'Definición intuitiva, autosemejanza, paradoja de la costa.' },
    { id: 'f-dim',    label: 'Dimensión fractal',        kind: 'leaf', status: 'active', href: 'fractal.html#dimension',     branch: 1,
      desc: 'Cómo medir la rugosidad: Hausdorff y box-counting.' },
    { id: 'f-gal',    label: 'Fractales sintéticos',     kind: 'leaf', status: 'active', href: 'fractal.html#galeria',       branch: 1,
      desc: 'Mandelbrot, Julia, Koch, Sierpiński, Barnsley, Cantor.' },
    { id: 'f-nat',    label: 'Fractales en la naturaleza', kind: 'leaf', status: 'active', href: 'fractal.html#naturaleza',  branch: 1,
      desc: 'Costas, pulmones, árboles, sismos, mercados.' },
    { id: 'f-mf',     label: 'Análisis multifractal',    kind: 'leaf', status: 'active', href: 'fractal.html#multifractal',  branch: 1,
      desc: 'Espectro f(α): cuando una sola dimensión no basta.' },

    // BRANCH 2 — Topológico
    { id: 'b-tda', label: 'Análisis Topológico', kind: 'branch', status: 'active',
      href: 'topologia.html', branch: 2,
      desc: 'La forma de los datos: invariantes que sobreviven a la deformación continua.', cta: 'abrir página →' },
    { id: 't-simp',  label: 'Complejos simpliciales', kind: 'leaf', status: 'active', href: 'topologia.html#tda-simplex',     branch: 2,
      desc: 'Puntos, aristas, triángulos: la unidad básica de TDA.' },
    { id: 't-filt',  label: 'Filtración Vietoris–Rips', kind: 'leaf', status: 'active', href: 'topologia.html#tda-filtration', branch: 2,
      desc: 'Secuencia anidada de complejos según ε.' },
    { id: 't-hom',   label: 'Grupos de homología',     kind: 'leaf', status: 'active', href: 'topologia.html#tda-homology',   branch: 2,
      desc: 'Números de Betti: contar componentes, lazos y cavidades.' },
    { id: 't-pers',  label: 'Persistencia',            kind: 'leaf', status: 'active', href: 'topologia.html#tda-persistence',             branch: 2,
      desc: 'Qué rasgos sobreviven a escalas crecientes: el barcode.' },

    // BRANCH 3 — Redes
    { id: 'b-net', label: 'Redes Complejas', kind: 'branch', status: 'active',
      href: 'redes.html', branch: 3,
      desc: 'La arquitectura de las interacciones: nodos, aristas, emergencia.', cta: 'abrir página →' },
    { id: 'n-types',  label: 'Tipos de redes',     kind: 'leaf', status: 'active', href: 'redes.html#redes-tipos',    branch: 3,
      desc: 'Regulares, aleatorias, mundo pequeño, libres de escala.' },
    { id: 'n-metric', label: 'Métricas',           kind: 'leaf', status: 'active', href: 'redes.html#redes-metricas', branch: 3,
      desc: 'Grado, intermediación, cercanía, eigenvector, clustering.' },
    { id: 'n-small',  label: 'Mundo pequeño',      kind: 'leaf', status: 'active', href: 'redes.html#redes-mundo',    branch: 3,
      desc: 'Modelo Watts–Strogatz, interactivo.' },
    { id: 'n-cases',  label: 'Casos · usos reales', kind: 'leaf', status: 'active', href: 'redes.html#redes-casos',   branch: 3,
      desc: 'PageRank, epidemias, conectoma, fraude, recomendación.' },
  ];

  const links = [];
  // core → branches
  ['b-fractal', 'b-tda', 'b-net'].forEach(t => links.push({ source: 'core', target: t, strong: true }));
  // branch → leaves
  nodes.filter(n => n.kind === 'leaf').forEach(leaf => {
    const branchId = leaf.branch === 1 ? 'b-fractal' : leaf.branch === 2 ? 'b-tda' : 'b-net';
    links.push({ source: branchId, target: leaf.id, strong: true });
  });

  // ---- svg + sizing ----
  const svg = d3.select(svgEl);
  let w = 1200, h = 700;
  function size() {
    const rect = svgEl.getBoundingClientRect();
    w = Math.max(360, rect.width);
    h = Math.max(420, rect.height);
    svg.attr('viewBox', `0 0 ${w} ${h}`).attr('preserveAspectRatio', 'xMidYMid meet');
  }
  size();

  // ---- defs ----
  const defs = svg.append('defs');
  // glow filter
  defs.append('filter').attr('id', 'mapGlow').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%')
    .html(`
      <feGaussianBlur stdDeviation="6" result="coloredBlur"/>
      <feMerge>
        <feMergeNode in="coloredBlur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    `);

  // core gradient (cyan→violet→orange)
  const coreGrad = defs.append('radialGradient').attr('id', 'coreGrad');
  coreGrad.append('stop').attr('offset', '0%').attr('stop-color', '#fff');
  coreGrad.append('stop').attr('offset', '40%').attr('stop-color', '#f6c5ff');
  coreGrad.append('stop').attr('offset', '70%').attr('stop-color', '#7c3aed');
  coreGrad.append('stop').attr('offset', '100%').attr('stop-color', '#0fb5c4');

  // branch gradients
  const BRANCH_COLORS = {
    1: { from: '#ea7e3a', to: '#c2410c', tint: 'rgba(234,126,58,0.18)' },  // fractal — orange
    2: { from: '#7c3aed', to: '#5b21b6', tint: 'rgba(124,58,237,0.18)' },  // tda — violet
    3: { from: '#0fb5c4', to: '#047d89', tint: 'rgba(15,181,196,0.18)' },  // net — cyan
  };

  // edges + nodes containers
  const linkG = svg.append('g').attr('class', 'mapLinks');
  const nodeG = svg.append('g').attr('class', 'mapNodes');

  // ---- anchor positions (radial) ----
  // core at center
  // 3 branches at 90° (up), 210°, 330° — top + bottom-left + bottom-right
  // For better visual: top, bottom-left, bottom-right at 120° intervals
  const branchAngles = {
    'b-fractal': -Math.PI / 2,                     // top
    'b-tda':     -Math.PI / 2 + (2 * Math.PI / 3), // bottom-right
    'b-net':     -Math.PI / 2 - (2 * Math.PI / 3), // bottom-left
  };

  function layout() {
    const cx = w / 2, cy = h / 2;
    // landscape map: branches/leaves spread more horizontally
    const R = Math.min(w * 0.42, h * 0.46);
    const Rbranch = R * 0.62;   // push branches further from core
    const Rleaf   = R * 1.05;

    nodes.forEach(n => {
      if (n.id === 'core') {
        n.fx0 = cx; n.fy0 = cy;
      } else if (n.kind === 'branch') {
        const a = branchAngles[n.id];
        n.fx0 = cx + Math.cos(a) * Rbranch;
        n.fy0 = cy + Math.sin(a) * Rbranch;
      } else {
        // leaf: spread around the branch angle within a sector
        const branchId = n.branch === 1 ? 'b-fractal' : n.branch === 2 ? 'b-tda' : 'b-net';
        const branchA = branchAngles[branchId];
        const siblings = nodes.filter(x => x.kind === 'leaf' && x.branch === n.branch);
        const idx = siblings.indexOf(n);
        const total = siblings.length;
        const spread = Math.PI * 0.65;  // ~117° fan, wide
        const offset = total === 1 ? 0 : (idx / (total - 1) - 0.5) * spread;
        const a = branchA + offset;
        // record leaf angle for label placement
        n._leafAngle = a;
        n.fx0 = cx + Math.cos(a) * Rleaf;
        n.fy0 = cy + Math.sin(a) * Rleaf;
      }
      if (n.x == null) { n.x = n.fx0; n.y = n.fy0; }
    });
  }
  layout();

  // ---- simulation ----
  const sim = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
      const s = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
      const t = typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target;
      if (s && (s.kind === 'core' || t.kind === 'core')) return Math.min(w, h) * 0.20;
      return Math.min(w, h) * 0.22;
    }).strength(0.45))
    .force('charge', d3.forceManyBody().strength(-220))
    .force('collide', d3.forceCollide().radius(d => d.kind === 'core' ? 56 : d.kind === 'branch' ? 46 : 28))
    .force('x', d3.forceX(d => d.fx0).strength(d => d.id === 'core' ? 0.95 : d.kind === 'branch' ? 0.55 : 0.28))
    .force('y', d3.forceY(d => d.fy0).strength(d => d.id === 'core' ? 0.95 : d.kind === 'branch' ? 0.55 : 0.28))
    .stop();   // stop d3's internal timer; we drive ticks ourselves

  // register tick early — it references linkSel/gNode which are defined below
  // but the simulation only fires tick events on requestAnimationFrame, by
  // which time the script body has finished and those are defined.
  function tickFn() {
    if (!gNode) return;
    // clamp to bounds
    nodes.forEach(n => {
      const r = n.kind === 'core' ? 72 : n.kind === 'branch' ? 50 : 30;
      n.x = Math.max(r, Math.min(w - r, n.x));
      n.y = Math.max(r, Math.min(h - r, n.y));
    });
    if (linkSel) linkSel.attr('d', d => {
      const dx = d.target.x - d.source.x;
      const dy = d.target.y - d.source.y;
      const dr = Math.hypot(dx, dy) * 2.2;
      return `M${d.source.x},${d.source.y} A${dr},${dr} 0 0,1 ${d.target.x},${d.target.y}`;
    });
    gNode.attr('transform', d => `translate(${d.x},${d.y})`);
  }
  sim.on('tick', tickFn);

  // ---- edges ----
  const linkSel = linkG.selectAll('path').data(links).join('path')
    .attr('fill', 'none')
    .attr('stroke', d => {
      const s = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
      const t = typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target;
      if (s.id === 'core') {
        const br = BRANCH_COLORS[t.branch];
        return br ? br.from : '#888';
      }
      if (s.kind === 'branch') {
        const br = BRANCH_COLORS[s.branch];
        return br ? br.from : '#888';
      }
      return 'rgba(244,238,223,0.3)';
    })
    .attr('stroke-width', d => {
      const s = typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source;
      return s.id === 'core' ? 2 : 1.2;
    })
    .attr('opacity', 0.55);

  // ---- nodes ----
  const gNode = nodeG.selectAll('g.mapNode').data(nodes).join('g')
    .attr('class', d => `mapNode mapNode--${d.kind} mapNode--${d.status}`)
    .style('cursor', d => 'pointer');

  // halo (animated for core, static for others)
  gNode.append('circle')
    .attr('class', 'halo')
    .attr('r', d => d.kind === 'core' ? 70 : d.kind === 'branch' ? 36 : 22)
    .attr('fill', d => {
      if (d.kind === 'core') return 'rgba(124,58,237,0.15)';
      if (d.kind === 'branch') return (BRANCH_COLORS[d.branch] || {}).tint || 'rgba(255,255,255,0.05)';
      return 'rgba(244,238,223,0.04)';
    });

  // core gets a second pulsing halo
  gNode.filter(d => d.kind === 'core').append('circle')
    .attr('class', 'pulse')
    .attr('r', 70)
    .attr('fill', 'none')
    .attr('stroke', '#7c3aed')
    .attr('stroke-width', 1.5)
    .attr('opacity', 0.6);

  // main circle
  gNode.append('circle')
    .attr('class', 'core')
    .attr('r', d => d.kind === 'core' ? 48 : d.kind === 'branch' ? 22 : 11)
    .attr('fill', d => {
      if (d.kind === 'core') return 'url(#coreGrad)';
      if (d.kind === 'branch') {
        const br = BRANCH_COLORS[d.branch];
        return br ? br.from : '#fff';
      }
      return '#fff';
    })
    .attr('stroke', d => {
      if (d.kind === 'core') return '#fff';
      if (d.kind === 'branch') return '#fff';
      return (BRANCH_COLORS[d.branch] || {}).from || '#aaa';
    })
    .attr('stroke-width', d => d.kind === 'core' ? 2.5 : d.kind === 'branch' ? 2 : 2)
    .attr('filter', d => d.kind === 'core' ? 'url(#mapGlow)' : null);

  // label — multi-line wrap for long branch names
  gNode.each(function(d) {
    const sel = d3.select(this);
    const text = sel.append('text')
      .attr('class', 'label')
      .attr('text-anchor', 'middle')
      .attr('font-family', 'Space Grotesk, sans-serif')
      .attr('font-weight', d.kind === 'core' ? 600 : d.kind === 'branch' ? 600 : 500)
      .attr('font-size', d.kind === 'core' ? 16 : d.kind === 'branch' ? 14 : 12)
      .attr('fill', d.kind === 'core' ? '#fff' : d.kind === 'branch' ? '#fff' : 'rgba(244,238,223,0.95)');

    // core: white text inside the circle — two stacked lines, sized to fit
    if (d.kind === 'core') {
      text.attr('y', 0).attr('font-size', 13).attr('font-weight', 600);
      text.append('tspan').attr('x', 0).attr('dy', '-0.3em').text('Sistemas');
      text.append('tspan').attr('x', 0).attr('dy', '1.2em').text('Complejos');
    } else if (d.kind === 'branch') {
      // Place label on the side AWAY from the core circle so it never
      // overlaps with the central "Sistemas Complejos" node.
      const angle = branchAngles[d.id] != null ? branchAngles[d.id] : Math.PI / 2;
      const isAbove = Math.sin(angle) < 0;
      const yOff = isAbove ? -32 : 42;
      text.attr('y', yOff);
      const parts = d.label.split(' ');
      if (parts.length === 1) {
        text.text(d.label);
      } else if (isAbove) {
        // labels above: stack upward — second line first, first line on top
        text.append('tspan').attr('x', 0).attr('dy', '-1em').text(parts[0]);
        text.append('tspan').attr('x', 0).attr('dy', '1em').text(parts.slice(1).join(' '));
      } else {
        text.append('tspan').attr('x', 0).text(parts[0]);
        text.append('tspan').attr('x', 0).attr('dy', 17).text(parts.slice(1).join(' '));
      }
    } else {
      // leaf: label placed RADIALLY OUTWARD from the core
      const angle = d._leafAngle != null ? d._leafAngle : 0;
      const cosA = Math.cos(angle), sinA = Math.sin(angle);
      const off = 22;
      const lx = cosA * off;
      const ly = sinA * off;
      text.attr('x', lx).attr('y', ly + 4);
      // text-anchor depending on horizontal angle
      if (cosA > 0.3) text.attr('text-anchor', 'start');
      else if (cosA < -0.3) text.attr('text-anchor', 'end');
      else text.attr('text-anchor', 'middle');
      text.text(d.label);
    }
  });

  // ----- interactions -----
  const tooltip = document.getElementById('mapTooltip');
  function showTooltip(d, ev) {
    if (!tooltip) return;
    tooltip.innerHTML = `
      <span class="map__tooltip-title">${d.label}</span>
      <span class="map__tooltip-desc">${d.desc || ''}</span>
      ${d.cta ? `<span class="map__tooltip-cta">${d.cta}</span>` : ''}
    `;
    tooltip.classList.add('is-visible');
    positionTooltip(ev);
  }
  function hideTooltip() { tooltip && tooltip.classList.remove('is-visible'); }
  function positionTooltip(ev) {
    if (!tooltip) return;
    tooltip.style.left = ev.clientX + 'px';
    tooltip.style.top  = ev.clientY + 'px';
  }

  gNode
    .on('mouseenter', (ev, d) => showTooltip(d, ev))
    .on('mousemove',  (ev) => positionTooltip(ev))
    .on('mouseleave', hideTooltip)
    .on('click', (ev, d) => {
      hideTooltip();
      if (d.action === 'modal') {
        const modal = document.getElementById('modalSC');
        if (modal) { modal.classList.add('is-open'); modal.setAttribute('aria-hidden', 'false'); }
        return;
      }
      if (d.href) {
        // Navigate to a different page (external URL with optional #anchor)
        // — no smooth-scroll; just go.
        window.location.href = d.href;
      }
    });

  // hover lift
  gNode.on('mouseover.lift', function(ev, d){
    d3.select(this).select('.halo')
      .transition().duration(180)
      .attr('r', d.kind === 'core' ? 86 : d.kind === 'branch' ? 46 : 28);
    d3.select(this).select('.core')
      .transition().duration(180)
      .attr('stroke-width', d.kind === 'core' ? 3.5 : 3);
  });
  gNode.on('mouseout.lift', function(ev, d){
    d3.select(this).select('.halo')
      .transition().duration(220)
      .attr('r', d.kind === 'core' ? 70 : d.kind === 'branch' ? 36 : 22);
    d3.select(this).select('.core')
      .transition().duration(220)
      .attr('stroke-width', d.kind === 'core' ? 2.5 : d.kind === 'branch' ? 2 : 2);
  });

  // drag — manually advance the simulation while dragging
  let _dragTimer = null;
  function _dragLoop() {
    sim.tick();
    tickFn();
  }
  gNode.call(d3.drag()
    .on('start', (ev, d) => {
      d.fx = d.x; d.fy = d.y;
      sim.alpha(0.5);
      if (_dragTimer) cancelAnimationFrame(_dragTimer);
      const loop = () => { _dragLoop(); _dragTimer = requestAnimationFrame(loop); };
      _dragTimer = requestAnimationFrame(loop);
    })
    .on('drag',  (ev, d) => { d.fx = ev.x; d.fy = ev.y; })
    .on('end',   (ev, d) => {
      d.fx = null; d.fy = null;
      // run a brief settle then stop
      setTimeout(() => {
        if (_dragTimer) cancelAnimationFrame(_dragTimer);
        _dragTimer = null;
      }, 600);
    })
  );

  // pulse animation on the core
  function pulse() {
    svg.select('.pulse')
      .transition().duration(1800).ease(d3.easeCubicOut)
      .attr('r', 110).attr('opacity', 0)
      .on('end', function() {
        d3.select(this).attr('r', 70).attr('opacity', 0.6);
        pulse();
      });
  }
  pulse();

  // tick (replaced — registered above)
  // sim.on('tick', tickFn);  // already done

  // Sync settle + push to DOM. We stop d3's internal timer above and drive
  // a short rAF loop to animate the settling, falling back to a one-shot
  // sync layout for environments where rAF is throttled.
  sim.tick(180);
  tickFn();
  let _frames = 0;
  function _animLoop() {
    if (_frames++ > 60) return;
    sim.tick();
    tickFn();
    requestAnimationFrame(_animLoop);
  }
  requestAnimationFrame(_animLoop);

  // gentle continuous wobble — disabled; we drive ticks manually now
  // setTimeout(() => sim.alphaTarget(0.015).restart(), 2400);

  // resize handler — re-layout and re-settle
  let rT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      size();
      layout();
      nodes.forEach(n => { n.fx = null; n.fy = null; n.vx = 0; n.vy = 0; });
      sim.force('x', d3.forceX(d => d.fx0).strength(d => d.id === 'core' ? 0.95 : d.kind === 'branch' ? 0.55 : 0.28))
         .force('y', d3.forceY(d => d.fy0).strength(d => d.id === 'core' ? 0.95 : d.kind === 'branch' ? 0.55 : 0.28));
      sim.alpha(0.7);
      sim.tick(180);
      tickFn();
    }, 150);
  });

  // ----- MODAL wiring -----
  const modal = document.getElementById('modalSC');
  if (modal) {
    modal.addEventListener('click', (ev) => {
      if (ev.target.hasAttribute('data-close')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
    document.addEventListener('keydown', (ev) => {
      if (ev.key === 'Escape' && modal.classList.contains('is-open')) {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
      }
    });
  }
})();
