/* ============================================================
   BOX-COUNTING — interactive demo
   Renders Koch curve, overlays grid at chosen ε, counts cells.
   Plots log N(ε) vs log(1/ε) in real time.
============================================================ */
(function () {
  const canvas = document.getElementById('bcCanvas');
  const plot   = document.getElementById('bcPlot');
  const slider = document.getElementById('bcSlider');
  const autoBtn= document.getElementById('bcAuto');
  if (!canvas || !plot) return;

  const cx = canvas.getContext('2d');
  const px = plot.getContext('2d');

  // ----------- generate Koch curve (open, single curve) -----------
  function genKoch() {
    // start: horizontal segment, two endpoints in normalized [0,1] coords
    let pts = [[0.02, 0.55], [0.98, 0.55]];
    const DEPTH = 6;
    for (let d = 0; d < DEPTH; d++) {
      const out = [pts[0]];
      for (let i = 0; i < pts.length - 1; i++) {
        const [px1, py1] = pts[i];
        const [px2, py2] = pts[i+1];
        const dx = px2 - px1, dy = py2 - py1;
        const a = [px1 + dx/3, py1 + dy/3];
        const c = [px1 + 2*dx/3, py1 + 2*dy/3];
        // peak above (negative y in screen coords)
        const ang = -Math.PI/3;
        const vx = c[0] - a[0], vy = c[1] - a[1];
        const b = [
          a[0] + vx*Math.cos(ang) - vy*Math.sin(ang),
          a[1] + vx*Math.sin(ang) + vy*Math.cos(ang),
        ];
        out.push(a, b, c, [px2, py2]);
      }
      pts = out;
    }
    return pts;
  }
  const koch = genKoch();   // ~4^6 + 1 = 4097 points
  // segment length at depth 6: (1/3)^6 ≈ 0.00137 (normalized)
  const SEG_LEN = Math.pow(1/3, 6);

  // ----------- size + ε levels -----------
  let W, H;
  function fit() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    [canvas, plot].forEach(c => {
      const r = c.getBoundingClientRect();
      c.width  = Math.max(1, Math.round(r.width  * dpr));
      c.height = Math.max(1, Math.round(r.height * dpr));
    });
    W = canvas.width; H = canvas.height;
  }

  // 10 ε levels (in normalized coords, 0..1 = canvas width)
  // start coarse, end fine
  const N_LEVELS = 10;
  const EPS = [];
  for (let i = 0; i < N_LEVELS; i++) {
    // geometric progression from 0.18 to 0.012
    const t = i / (N_LEVELS - 1);
    EPS.push(0.18 * Math.pow(0.012/0.18, t));
  }

  // ----------- compute N(ε) for each level using cell-rasterization -----------
  // Walk Koch path; for each segment, mark every grid cell it crosses.
  // Use a Set keyed by (col, row).
  function countCells(eps) {
    const set = new Set();
    // bbox of curve in normalized coords (approx)
    const minX = 0, minY = 0.08, maxX = 1, maxY = 0.62;
    const W = (maxX - minX), H = (maxY - minY);
    // grid origin = (minX, minY)
    for (let i = 0; i < koch.length - 1; i++) {
      const [x0, y0] = koch[i];
      const [x1, y1] = koch[i+1];
      // sample along segment
      const len = Math.hypot(x1 - x0, y1 - y0);
      const steps = Math.max(2, Math.ceil(len / (eps * 0.25)));
      for (let s = 0; s <= steps; s++) {
        const t = s / steps;
        const x = x0 + (x1 - x0) * t;
        const y = y0 + (y1 - y0) * t;
        const col = Math.floor((x - minX) / eps);
        const row = Math.floor((y - minY) / eps);
        set.add(col + '|' + row);
      }
    }
    return set;
  }

  // precompute counts + cells for each level
  let cellSets = [];
  let counts   = [];
  function precompute() {
    cellSets = EPS.map(e => countCells(e));
    counts   = cellSets.map(s => s.size);
  }
  precompute();

  // linear regression on log(1/ε) vs log N (all points so far)
  function regress(upToIdx) {
    const n = upToIdx + 1;
    let sX=0, sY=0, sXX=0, sXY=0;
    for (let i = 0; i <= upToIdx; i++) {
      const x = Math.log(1/EPS[i]);
      const y = Math.log(counts[i]);
      sX += x; sY += y; sXX += x*x; sXY += x*y;
    }
    const slope = n > 1 ? (n*sXY - sX*sY)/(n*sXX - sX*sX) : 0;
    const intercept = n > 1 ? (sY - slope*sX)/n : 0;
    return { slope, intercept };
  }
  // full-data regression (across all 10 levels) is the "ideal" D
  const FULL = regress(N_LEVELS - 1);

  // ----------- drawing: koch + grid + highlighted cells -----------
  function drawKochScene(level) {
    const eps = EPS[level];
    cx.fillStyle = '#fbf9f6';
    cx.fillRect(0, 0, W, H);

    // map normalized → canvas (use H scaled so curve fits)
    const pad = 12;
    const sx = W - pad*2, sy = H - pad*2;
    const tx = x => pad + x * sx;
    const ty = y => pad + y * sy;

    // grid (subtle)
    const gridLineColor = '#e6e1d4';
    cx.strokeStyle = gridLineColor;
    cx.lineWidth = 0.5;
    cx.beginPath();
    for (let g = 0; g <= 1/eps + 1; g++) {
      const xx = tx(g * eps);
      cx.moveTo(xx, ty(0.08)); cx.lineTo(xx, ty(0.62));
    }
    for (let g = 0; g <= (0.62-0.08)/eps + 1; g++) {
      const yy = ty(0.08 + g * eps);
      cx.moveTo(tx(0), yy); cx.lineTo(tx(1), yy);
    }
    cx.stroke();

    // highlight occupied cells
    cx.fillStyle = 'rgba(124,58,237,0.18)';
    cx.strokeStyle = 'rgba(124,58,237,0.55)';
    cx.lineWidth = 0.7;
    const cells = cellSets[level];
    for (const key of cells) {
      const [col, row] = key.split('|').map(Number);
      const x = tx(0 + col * eps);
      const y = ty(0.08 + row * eps);
      const w = sx * eps, h = sy * eps;
      cx.fillRect(x, y, w, h);
      cx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
    }

    // koch curve on top
    cx.beginPath();
    cx.moveTo(tx(koch[0][0]), ty(koch[0][1]));
    for (let i = 1; i < koch.length; i++) cx.lineTo(tx(koch[i][0]), ty(koch[i][1]));
    cx.strokeStyle = '#ea7e3a';
    cx.lineWidth = Math.max(1.2, W/520);
    cx.lineJoin = 'round'; cx.lineCap = 'round';
    cx.stroke();

    // caption inside canvas
    cx.fillStyle = '#9a9aa6';
    cx.font = `${Math.max(11, W*0.018)}px JetBrains Mono, monospace`;
    cx.textAlign = 'right';
    cx.fillText(`ε = ${eps.toFixed(4)}  ·  N = ${counts[level]}`, W - pad, H - pad + 2);
  }

  // ----------- drawing: log-log plot -----------
  function drawPlot(level) {
    const W = plot.width, H = plot.height;
    px.fillStyle = '#fbf9f6';
    px.fillRect(0, 0, W, H);

    const LP = 64, RP = 16, TP = 28, BP = 44;
    const IW = W - LP - RP, IH = H - TP - BP;

    // axes ranges
    const xs = EPS.map(e => Math.log(1/e));
    const ys = counts.map(c => Math.log(c));
    const xMin = Math.min(...xs) - 0.2, xMax = Math.max(...xs) + 0.2;
    const yMin = Math.min(...ys) - 0.3, yMax = Math.max(...ys) + 0.4;
    const xToP = x => LP + (x - xMin)/(xMax - xMin) * IW;
    const yToP = y => TP + (1 - (y - yMin)/(yMax - yMin)) * IH;

    // grid
    px.setLineDash([3, 4]); px.strokeStyle = '#e6e1d4'; px.lineWidth = 0.8;
    px.beginPath();
    for (let i = 0; i <= 5; i++) {
      const x = LP + IW * i/5;
      px.moveTo(x, TP); px.lineTo(x, TP+IH);
      const y = TP + IH * i/5;
      px.moveTo(LP, y); px.lineTo(LP+IW, y);
    }
    px.stroke();
    px.setLineDash([]);

    // axes
    px.strokeStyle = '#cbc3b1'; px.lineWidth = 1.2;
    px.beginPath();
    px.moveTo(LP, TP); px.lineTo(LP, TP+IH); px.lineTo(LP+IW, TP+IH); px.stroke();

    // axis labels
    px.fillStyle = '#6a6a76';
    px.font = `${Math.max(11, W*0.020)}px JetBrains Mono, monospace`;
    px.textAlign = 'center';
    px.fillText('log (1/ε)', LP + IW/2, H - 12);
    px.save();
    px.translate(16, TP + IH/2);
    px.rotate(-Math.PI/2);
    px.fillText('log N(ε)', 0, 0);
    px.restore();

    // regression on points 0..level (live)
    let reg = level >= 1 ? regress(level) : null;

    // regression line — full-data, faint guide
    px.strokeStyle = 'rgba(124,58,237,0.20)';
    px.lineWidth = 1.4;
    px.setLineDash([5, 4]);
    px.beginPath();
    px.moveTo(xToP(xMin), yToP(FULL.slope*xMin + FULL.intercept));
    px.lineTo(xToP(xMax), yToP(FULL.slope*xMax + FULL.intercept));
    px.stroke();
    px.setLineDash([]);

    // live regression
    if (reg) {
      px.strokeStyle = '#7c3aed';
      px.lineWidth = 2.4;
      px.beginPath();
      // bound to first..last visible x
      const x0 = xs[0] - 0.1, x1 = xs[level] + 0.3;
      px.moveTo(xToP(x0), yToP(reg.slope*x0 + reg.intercept));
      px.lineTo(xToP(x1), yToP(reg.slope*x1 + reg.intercept));
      px.stroke();

      // slope label
      px.fillStyle = '#7c3aed';
      px.font = `bold ${Math.max(12, W*0.024)}px JetBrains Mono, monospace`;
      px.textAlign = 'left';
      const lx = xToP((x0 + x1) / 2);
      const ly = yToP(reg.slope*((x0+x1)/2) + reg.intercept) - 14;
      px.fillText(`D ≈ ${reg.slope.toFixed(3)}`, lx + 6, ly);
    }

    // dots — past + current
    for (let i = 0; i <= level; i++) {
      const xp = xToP(xs[i]);
      const yp = yToP(ys[i]);
      px.beginPath();
      px.arc(xp, yp, i === level ? 7 : 4, 0, 2*Math.PI);
      px.fillStyle = i === level ? '#ea7e3a' : '#7c3aed';
      px.fill();
      if (i === level) {
        px.strokeStyle = '#fff'; px.lineWidth = 2; px.stroke();
      }
    }
    // unvisited points — faded outline
    for (let i = level + 1; i < N_LEVELS; i++) {
      const xp = xToP(xs[i]);
      const yp = yToP(ys[i]);
      px.beginPath();
      px.arc(xp, yp, 3.2, 0, 2*Math.PI);
      px.strokeStyle = '#d0c9b8'; px.lineWidth = 1;
      px.stroke();
    }

    // title
    px.fillStyle = '#3a3a44';
    px.font = `bold ${Math.max(12, W*0.022)}px JetBrains Mono, monospace`;
    px.textAlign = 'left';
    px.fillText('regresión log–log', LP, TP - 10);
  }

  // ----------- DOM readouts -----------
  function updateReadouts(level) {
    const eEl = document.getElementById('bcEps');
    const nEl = document.getElementById('bcN');
    const dEl = document.getElementById('bcD');
    if (eEl) eEl.textContent = EPS[level].toFixed(4);
    if (nEl) nEl.textContent = counts[level].toString();
    if (dEl) {
      if (level < 1) dEl.textContent = '—';
      else {
        const r = regress(level);
        dEl.textContent = r.slope.toFixed(3);
      }
    }
  }

  function update(level) {
    drawKochScene(level);
    drawPlot(level);
    updateReadouts(level);
  }

  // ----------- wiring -----------
  let cur = 0;
  let autoTimer = null;
  function setLevel(i) { cur = i; slider.value = i; update(cur); }

  slider.addEventListener('input', e => {
    stopAuto();
    setLevel(+e.target.value);
  });

  function stopAuto() {
    if (autoTimer) { clearInterval(autoTimer); autoTimer = null; autoBtn.textContent = '▶ auto'; }
  }
  autoBtn.addEventListener('click', () => {
    if (autoTimer) { stopAuto(); return; }
    autoBtn.textContent = '⏸ pausa';
    autoTimer = setInterval(() => {
      cur = (cur + 1) % N_LEVELS;
      setLevel(cur);
    }, 1100);
  });

  // init only when in view
  let inited = false;
  function init() {
    if (inited) return;
    inited = true;
    fit();
    update(0);
  }

  const io = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (e.isIntersecting) { init(); }
      else { stopAuto(); }
    }
  }, { rootMargin: '100px' });
  io.observe(canvas);

  let rT = null;
  window.addEventListener('resize', () => {
    if (!inited) return;
    clearTimeout(rT);
    rT = setTimeout(() => { fit(); update(cur); }, 120);
  });
})();
