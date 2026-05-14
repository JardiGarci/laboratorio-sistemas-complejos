/* ============================================================
   FRACTALES — gallery card generators (6 fractals)
   Each renderer takes (canvas) and draws into it.
============================================================ */
(function () {
  const FRACTALS = [
    {
      id: 'mandelbrot',
      name: 'Conjunto de Mandelbrot',
      dim: 'D = 2',
      dimNote: 'boundary',
      hue: '#7c3aed',
      desc: 'El conjunto de puntos del plano complejo para los que la iteración z → z² + c permanece acotada. Es la madre de todos los fractales.',
      expand: `
        <p><strong>Construcción.</strong> Para cada punto <span class="mono">c</span> del plano, iteramos <span class="mono">zₙ₊₁ = zₙ² + c</span> partiendo de <span class="mono">z₀ = 0</span>. Si la órbita no escapa al infinito, <span class="mono">c</span> pertenece al conjunto.</p>
        <div class="card__expand-eq">∂M tiene dim<sub>H</sub> = 2  (Shishikura, 1998)</div>
        <p>Sorpresa: el <em>borde</em> del conjunto tiene dimensión 2 — pero su área en el plano es cero. Es una frontera tan rugosa que llena el espacio sin ocuparlo.</p>
      `,
      render: drawMandelbrot,
    },
    {
      id: 'julia',
      name: 'Conjunto de Julia',
      dim: 'D ≈ 1.5–2',
      dimNote: 'depende de c',
      hue: '#0fb5c4',
      desc: 'Misma iteración z² + c, pero ahora c está fijo y el plano son los z₀ iniciales. Cada c genera un Julia distinto.',
      expand: `
        <p><strong>Construcción.</strong> Fijamos <span class="mono">c</span> (aquí, <span class="mono">c = −0.8 + 0.156i</span>) y, para cada punto <span class="mono">z₀</span>, iteramos <span class="mono">zₙ₊₁ = zₙ² + c</span>. El conjunto de los <span class="mono">z₀</span> cuya órbita no escapa es el Julia <span class="mono">J<sub>c</sub></span>.</p>
        <div class="card__expand-eq">dim<sub>H</sub> J<sub>c</sub> ≈ 1 + |c|² / (4 log 2) + O(|c|⁴)</div>
        <p>La dimensión es analítica en <span class="mono">c</span> cerca del origen (Ruelle). Cuando <span class="mono">c</span> está en el Mandelbrot el Julia es conexo; fuera, es un polvo de Cantor.</p>
      `,
      render: drawJulia,
    },
    {
      id: 'koch',
      name: 'Copo de nieve de Koch',
      dim: 'D = log 4 / log 3 ≈ 1.2619',
      dimNote: 'exacto',
      hue: '#ea7e3a',
      desc: 'Cada segmento se divide en tres: el tercio medio se reemplaza por dos lados de un triángulo equilátero. Repetir ad infinitum.',
      expand: `
        <p><strong>Construcción.</strong> Empezamos con un triángulo equilátero. En cada iteración, cada uno de los <em>N</em> segmentos se reemplaza por 4 segmentos de longitud <span class="mono">1/3</span>.</p>
        <div class="card__expand-eq">D = log N / log (1/r) = log 4 / log 3 ≈ 1.2619</div>
        <p>La curva tiene perímetro infinito pero encierra área finita. Es el ejemplo canónico de una curva fractal autosemejante con dimensión exactamente calculable.</p>
      `,
      render: drawKoch,
    },
    {
      id: 'sierpinski',
      name: 'Triángulo de Sierpiński',
      dim: 'D = log 3 / log 2 ≈ 1.5850',
      dimNote: 'exacto',
      hue: '#e63990',
      desc: 'De un triángulo retiramos el triángulo central; en los tres restantes repetimos. El polvo que queda tiene área cero.',
      expand: `
        <p><strong>Construcción.</strong> Sistema iterativo de funciones (IFS) con 3 contracciones de razón <span class="mono">r = 1/2</span>, cada una hacia uno de los vértices.</p>
        <div class="card__expand-eq">D = log N / log (1/r) = log 3 / log 2 ≈ 1.5850</div>
        <p>Aparece espontáneamente en el triángulo de Pascal módulo 2, en el autómata celular Regla 90, y en el "juego del caos" partiendo de un punto al azar.</p>
      `,
      render: drawSierpinski,
    },
    {
      id: 'barnsley',
      name: 'Helecho de Barnsley',
      dim: 'D ≈ 1.85',
      dimNote: 'IFS estocástico',
      hue: '#16a34a',
      desc: 'Cuatro transformaciones afines aplicadas con probabilidades distintas a un punto cualquiera. Después de 50 000 iteraciones aparece un helecho.',
      expand: `
        <p><strong>Construcción.</strong> Cuatro mapas afines <span class="mono">fᵢ(x, y) = Aᵢ·(x, y)ᵀ + bᵢ</span>: tronco (1%), hoja completa (85%), hoja izquierda (7%) y hoja derecha (7%). Iteramos eligiendo <span class="mono">fᵢ</span> al azar.</p>
        <div class="card__expand-eq">D = dim<sub>H</sub>(atractor del IFS) ≈ 1.85</div>
        <p>Demuestra que estructura biológica compleja puede surgir de un puñado de reglas geométricas simples.</p>
      `,
      render: drawBarnsley,
    },
    {
      id: 'cantor',
      name: 'Conjunto de Cantor',
      dim: 'D = log 2 / log 3 ≈ 0.6309',
      dimNote: 'menos que 1',
      hue: '#1a1a1f',
      desc: 'De un segmento eliminamos el tercio central. Repetimos en los dos restantes. Lo que queda no tiene longitud pero sí infinitos puntos.',
      expand: `
        <p><strong>Construcción.</strong> Empezamos con <span class="mono">[0, 1]</span>. En cada paso, retiramos el tercio medio abierto de cada intervalo. En el límite, <span class="mono">N = 2</span> copias de razón <span class="mono">r = 1/3</span>.</p>
        <div class="card__expand-eq">D = log 2 / log 3 ≈ 0.6309</div>
        <p>El primer fractal documentado (Cantor, 1883). Es no numerable pero de medida de Lebesgue cero — fue uno de los puntos de partida del análisis moderno.</p>
      `,
      render: drawCantor,
    },
  ];

  // -------- shared helpers --------
  function fitCanvas(canvas) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const rect = canvas.getBoundingClientRect();
    canvas.width  = Math.max(1, Math.round(rect.width  * dpr));
    canvas.height = Math.max(1, Math.round(rect.height * dpr));
    return { w: canvas.width, h: canvas.height, dpr };
  }

  // -------- renderers --------
  function drawMandelbrot(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const maxIter = 180;

    // center view a bit left of origin to show whole set
    const cx0 = -0.6, cy0 = 0;
    const span = 3.0;
    const aspect = w / h;
    const halfW = span * 0.5 * aspect;
    const halfH = span * 0.5;

    // palette: deep purple → violet → cream
    function pal(t) {
      const stops = [[0,10,6,30],[0.3,67,30,150],[0.55,140,90,230],[0.78,235,180,120],[1,255,240,210]];
      let a = stops[0], b = stops[stops.length-1];
      for (let i=0;i<stops.length-1;i++) if (t>=stops[i][0]&&t<=stops[i+1][0]){a=stops[i];b=stops[i+1];break;}
      const u = (t-a[0])/(b[0]-a[0]||1);
      return [a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u, a[3]+(b[3]-a[3])*u];
    }

    for (let py = 0; py < h; py++) {
      const cy = cy0 + (py/(h-1) - 0.5) * 2 * halfH;
      for (let px = 0; px < w; px++) {
        const cx = cx0 + (px/(w-1) - 0.5) * 2 * halfW;
        let x = 0, y = 0, x2 = 0, y2 = 0, i = 0;
        while (x2 + y2 <= 256 && i < maxIter) {
          y = 2*x*y + cy; x = x2 - y2 + cx; x2 = x*x; y2 = y*y; i++;
        }
        const idx = (py*w + px)*4;
        if (i === maxIter) { data[idx]=14; data[idx+1]=8; data[idx+2]=28; }
        else {
          const log_zn = Math.log(x2 + y2)/2;
          const nu = Math.log(log_zn / Math.LN2)/Math.LN2;
          const t = (i + 1 - nu) / maxIter;
          const c = pal(Math.pow(t, 0.65));
          data[idx] = c[0]; data[idx+1] = c[1]; data[idx+2] = c[2];
        }
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawJulia(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    const img = ctx.createImageData(w, h);
    const data = img.data;
    const maxIter = 200;
    const cRe = -0.8, cIm = 0.156;
    const span = 3.4;
    const aspect = w/h;
    const halfW = span * 0.5 * aspect;
    const halfH = span * 0.5;

    function pal(t) {
      // teal → cyan → ice
      const stops = [[0,4,10,28],[0.25,5,80,110],[0.5,15,181,196],[0.78,160,240,255],[1,255,255,255]];
      let a = stops[0], b = stops[stops.length-1];
      for (let i=0;i<stops.length-1;i++) if (t>=stops[i][0]&&t<=stops[i+1][0]){a=stops[i];b=stops[i+1];break;}
      const u = (t-a[0])/(b[0]-a[0]||1);
      return [a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u, a[3]+(b[3]-a[3])*u];
    }

    for (let py = 0; py < h; py++) {
      let y0 = (py/(h-1) - 0.5) * 2 * halfH;
      for (let px = 0; px < w; px++) {
        let x = (px/(w-1) - 0.5) * 2 * halfW, y = y0;
        let i = 0, x2 = x*x, y2 = y*y;
        while (x2 + y2 <= 256 && i < maxIter) {
          y = 2*x*y + cIm; x = x2 - y2 + cRe; x2 = x*x; y2 = y*y; i++;
        }
        const idx = (py*w + px)*4;
        if (i === maxIter) { data[idx]=4; data[idx+1]=10; data[idx+2]=28; }
        else {
          const log_zn = Math.log(x2 + y2)/2;
          const nu = Math.log(log_zn / Math.LN2)/Math.LN2;
          const t = (i + 1 - nu)/maxIter;
          const c = pal(Math.pow(t, 0.55));
          data[idx]=c[0]; data[idx+1]=c[1]; data[idx+2]=c[2];
        }
        data[idx+3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawKoch(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1a0c2a'; ctx.fillRect(0, 0, w, h);

    // base equilateral
    const cx = w/2, cy = h/2 + h*0.08;
    const size = Math.min(w, h) * 0.78;
    const r = size / Math.sqrt(3);
    const A = { x: cx, y: cy - r };
    const B = { x: cx + size/2, y: cy + r/2 };
    const C = { x: cx - size/2, y: cy + r/2 };
    let pts = [A, B, C, A];

    function kochIter(arr) {
      const out = [arr[0]];
      for (let i = 0; i < arr.length - 1; i++) {
        const p = arr[i], q = arr[i+1];
        const dx = q.x - p.x, dy = q.y - p.y;
        const p1 = { x: p.x + dx/3, y: p.y + dy/3 };
        const p3 = { x: p.x + 2*dx/3, y: p.y + 2*dy/3 };
        // rotate p3-p1 by -60° around p1
        const ang = -Math.PI/3;
        const vx = p3.x - p1.x, vy = p3.y - p1.y;
        const p2 = {
          x: p1.x + vx*Math.cos(ang) - vy*Math.sin(ang),
          y: p1.y + vx*Math.sin(ang) + vy*Math.cos(ang),
        };
        out.push(p1, p2, p3, q);
      }
      return out;
    }
    for (let i = 0; i < 5; i++) pts = kochIter(pts);

    // glow stroke
    const grad = ctx.createLinearGradient(0, 0, w, h);
    grad.addColorStop(0, '#ffd9a8');
    grad.addColorStop(0.5, '#ea7e3a');
    grad.addColorStop(1, '#c2410c');

    // fill snowflake interior
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.closePath();
    ctx.fillStyle = 'rgba(234,126,58,0.10)';
    ctx.fill();

    // outline
    ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    ctx.strokeStyle = grad;
    ctx.lineWidth = Math.max(1.4, w / 480);
    ctx.shadowColor = '#ea7e3a'; ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.moveTo(pts[0].x, pts[0].y);
    for (let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  function drawSierpinski(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#1d0a18'; ctx.fillRect(0, 0, w, h);

    const margin = Math.min(w, h) * 0.08;
    const size = Math.min(w, h) - margin*2;
    const cx = w/2;
    const top = h/2 - size*Math.sqrt(3)/4;
    const A = { x: cx, y: top };
    const B = { x: cx + size/2, y: top + size*Math.sqrt(3)/2 };
    const C = { x: cx - size/2, y: top + size*Math.sqrt(3)/2 };

    function tri(a, b, c, depth) {
      if (depth === 0) {
        const t = (a.y + b.y + c.y) / (h * 3); // 0..1 vertical position
        const hue = 320 - t * 60;              // pink → magenta
        ctx.fillStyle = `hsl(${hue} 75% ${52 + t*12}%)`;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.lineTo(c.x, c.y);
        ctx.closePath(); ctx.fill();
        return;
      }
      const ab = { x: (a.x+b.x)/2, y: (a.y+b.y)/2 };
      const bc = { x: (b.x+c.x)/2, y: (b.y+c.y)/2 };
      const ca = { x: (c.x+a.x)/2, y: (c.y+a.y)/2 };
      tri(a, ab, ca, depth-1);
      tri(ab, b, bc, depth-1);
      tri(ca, bc, c, depth-1);
    }
    tri(A, B, C, 7);
  }

  function drawBarnsley(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#06120a'; ctx.fillRect(0, 0, w, h);

    // Standard Barnsley fern params
    const fns = [
      { p: 0.01, a: 0,    b: 0,    c: 0,     d: 0.16, e: 0,    f: 0    },
      { p: 0.85, a: 0.85, b: 0.04, c:-0.04,  d: 0.85, e: 0,    f: 1.6  },
      { p: 0.07, a: 0.20, b:-0.26, c: 0.23,  d: 0.22, e: 0,    f: 1.6  },
      { p: 0.07, a:-0.15, b: 0.28, c: 0.26,  d: 0.24, e: 0,    f: 0.44 },
    ];
    // cumulative probabilities
    let cum = 0;
    fns.forEach(f => { cum += f.p; f.cp = cum; });

    let x = 0, y = 0;
    // bounds known: x ∈ [-2.182, 2.6558], y ∈ [0, 9.9983]
    const minX = -2.182, maxX = 2.6558, minY = 0, maxY = 9.9983;
    const scaleX = w * 0.92 / (maxX - minX);
    const scaleY = h * 0.92 / (maxY - minY);
    const sc = Math.min(scaleX, scaleY);
    const offX = w/2 - ((minX+maxX)/2) * sc;
    const offY = h * 0.96 - (-minY)*sc;        // bottom-anchor

    // draw via pixel buffer for speed at high N
    const img = ctx.createImageData(w, h);
    const d = img.data;
    // fill bg
    for (let i = 0; i < d.length; i += 4) { d[i]=6; d[i+1]=18; d[i+2]=10; d[i+3]=255; }

    const N = 90000;
    for (let i = 0; i < N; i++) {
      const r = Math.random();
      let f;
      for (const ff of fns) { if (r <= ff.cp) { f = ff; break; } }
      const nx = f.a*x + f.b*y + f.e;
      const ny = f.c*x + f.d*y + f.f;
      x = nx; y = ny;
      const px = Math.round(offX + x * sc);
      const py = Math.round(offY - y * sc);
      if (px >= 0 && px < w && py >= 0 && py < h) {
        const idx = (py * w + px) * 4;
        // additive green w/ slight cyan tint
        const r0 = d[idx], g0 = d[idx+1], b0 = d[idx+2];
        d[idx]   = Math.min(255, r0 + 4);
        d[idx+1] = Math.min(255, g0 + 18);
        d[idx+2] = Math.min(255, b0 + 6);
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  function drawCantor(canvas) {
    const { w, h } = fitCanvas(canvas);
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#f5f1e8'; ctx.fillRect(0, 0, w, h);

    const LEVELS = 8;
    const top = h * 0.10;
    const rowH = h * 0.085;
    const padX = w * 0.06;
    const fullW = w - padX*2;

    // helper to draw recursively
    function row(level, x, len) {
      if (level >= LEVELS) return;
      const y = top + level * rowH;
      const thick = Math.max(2, rowH * 0.45 - level*0.5);
      // gradient ink — black with slight warm shift over depth
      const grey = 26 + level * 6;
      ctx.fillStyle = `rgb(${grey},${grey-4},${grey+2})`;
      ctx.fillRect(x, y, len, thick);

      // children
      const sub = len / 3;
      row(level+1, x,           sub);
      row(level+1, x + sub*2,   sub);
    }
    row(0, padX, fullW);

    // level labels
    ctx.fillStyle = '#9a9aa6';
    ctx.font = `${Math.max(9, w*0.018)}px JetBrains Mono, monospace`;
    ctx.textAlign = 'right';
    for (let i = 0; i < LEVELS; i++) {
      const y = top + i * rowH + rowH * 0.35;
      ctx.fillText('n='+i, padX - 4, y);
    }
  }

  // -------- inject gallery cards --------
  function build() {
    const grid = document.getElementById('gallery');
    if (!grid) return;

    FRACTALS.forEach((f, i) => {
      const card = document.createElement('article');
      card.className = 'card';
      card.dataset.id = f.id;
      card.innerHTML = `
        <div class="card__canvas-wrap">
          <span class="card__hue" style="color:${f.hue}"></span>
          <canvas></canvas>
        </div>
        <div class="card__body">
          <h3 class="card__name">${f.name}</h3>
          <p class="card__dim"><strong>${f.dim}</strong> · ${f.dimNote}</p>
          <p class="card__desc">${f.desc}</p>
        </div>
        <div class="card__expand">${f.expand}</div>
      `;
      grid.appendChild(card);

      // render after layout
      const canvas = card.querySelector('canvas');
      // observer: render once visible (saves CPU on initial load)
      const io = new IntersectionObserver((entries, obs) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            requestAnimationFrame(() => f.render(canvas));
            obs.disconnect();
          }
        }
      }, { rootMargin: '120px' });
      io.observe(card);

      card.addEventListener('click', (ev) => {
        // don't toggle when selecting text
        if (window.getSelection && window.getSelection().toString()) return;
        card.classList.toggle('is-open');
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', build);
  } else {
    build();
  }

  // expose for main.js to use Koch + Mandelbrot for nature placeholders
  window.LSCFractals = { drawMandelbrot, drawJulia, drawKoch, drawSierpinski, drawBarnsley, drawCantor, fitCanvas };
})();
