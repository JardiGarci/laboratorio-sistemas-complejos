/* ============================================================
   HERO — Mandelbrot rendered ONCE as a static backdrop.
   No animation loop — keeps the JS thread free for the
   concept-map's D3 simulation and other interactives.
============================================================ */
(function () {
  const canvas = document.getElementById('heroCanvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d', { alpha: false });

  // offscreen buffer — small for speed; the browser bilinear-upscales
  const buf = document.createElement('canvas');
  const bx  = buf.getContext('2d');
  const INTERNAL_W = 360;
  let INTERNAL_H = 220;
  const PALETTE_N = 1024;

  // an interesting deep-zoom location in seahorse valley
  const TARGET = { x: -0.7436438870371587, y: 0.1318259042053080 };
  const SCALE  = 0.0035;          // medium-deep zoom (about ×750)

  const palette = new Uint8ClampedArray(PALETTE_N * 4);
  (function buildPalette () {
    const stops = [
      [0.00,  10,  6, 22],
      [0.10,  15, 88, 110],
      [0.22,  15,181,196],
      [0.40,  90, 60,200],
      [0.55, 124, 58,237],
      [0.72, 234,126, 58],
      [0.85, 255,210,140],
      [1.00,  10,  6, 22],
    ];
    for (let i = 0; i < PALETTE_N; i++) {
      const t = i / (PALETTE_N - 1);
      let a = stops[0], b = stops[stops.length - 1];
      for (let j = 0; j < stops.length - 1; j++) {
        if (t >= stops[j][0] && t <= stops[j+1][0]) { a = stops[j]; b = stops[j+1]; break; }
      }
      const u = (t - a[0]) / (b[0] - a[0] || 1);
      palette[i*4  ] = a[1] + (b[1] - a[1]) * u;
      palette[i*4+1] = a[2] + (b[2] - a[2]) * u;
      palette[i*4+2] = a[3] + (b[3] - a[3]) * u;
      palette[i*4+3] = 255;
    }
  })();

  function mandel(cx, cy, maxIter) {
    let x = 0, y = 0, x2 = 0, y2 = 0, i = 0;
    while (x2 + y2 <= 256 && i < maxIter) {
      y = 2 * x * y + cy;
      x = x2 - y2 + cx;
      x2 = x * x; y2 = y * y;
      i++;
    }
    if (i === maxIter) return -1;
    const log_zn = Math.log(x2 + y2) / 2;
    const nu = Math.log(log_zn / Math.LN2) / Math.LN2;
    return i + 1 - nu;
  }

  function render() {
    const W = buf.width, H = buf.height;
    const img = bx.getImageData(0, 0, W, H);
    const data = img.data;

    const maxIter = 220;
    const aspect = W / H;
    const halfW = SCALE * aspect;
    const halfH = SCALE;

    for (let py = 0; py < H; py++) {
      const cy = TARGET.y + (py / (H - 1) - 0.5) * 2 * halfH;
      for (let px = 0; px < W; px++) {
        const cx = TARGET.x + (px / (W - 1) - 0.5) * 2 * halfW;
        const it = mandel(cx, cy, maxIter);
        const idx = (py * W + px) * 4;
        if (it < 0) {
          data[idx  ] = 10; data[idx+1] = 6; data[idx+2] = 22;
        } else {
          const t = Math.log(it + 1) / Math.log(maxIter + 1);
          const k = Math.floor((t * 1.5 % 1) * (PALETTE_N - 1)) * 4;
          data[idx  ] = palette[k];
          data[idx+1] = palette[k+1];
          data[idx+2] = palette[k+2];
        }
        data[idx+3] = 255;
      }
    }
    bx.putImageData(img, 0, 0);
  }

  function blit() {
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  }

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.4);
    canvas.width  = Math.max(1, Math.round(canvas.clientWidth  * dpr));
    canvas.height = Math.max(1, Math.round(canvas.clientHeight * dpr));
    const aspect = canvas.width / canvas.height || 1.5;
    INTERNAL_H = Math.max(120, Math.round(INTERNAL_W / aspect));
    buf.width  = INTERNAL_W;
    buf.height = INTERNAL_H;
    render();
    blit();
  }

  // Defer the heavy initial render so the rest of the page can lay out.
  setTimeout(resize, 80);

  // re-render on (debounced) resize
  let rT = null;
  window.addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(resize, 200);
  });

  // gentle scroll parallax (CSS only — no JS work per frame)
  window.addEventListener('scroll', () => {
    const y = Math.min(window.scrollY, window.innerHeight);
    canvas.style.transform = `translateY(${y * 0.05}px)`;
  }, { passive: true });

  // readouts
  const zoomEl = document.getElementById('heroZoomInfo');
  if (zoomEl) zoomEl.textContent = '×' + Math.round(2.6 / SCALE);
})();
