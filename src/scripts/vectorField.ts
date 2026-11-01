// Background vector field: phase portrait of the damped pendulum
//   x' = y
//   y' = -sin(x) - c*y
// Drawn as a faint quiver plot (static layer) plus particles advected through the
// field with fading trails (animated layer). Cheap enough for phones: particle count
// scales with screen area, DPR is capped, and the loop stops when the tab is hidden.

type Opts = {
  damping?: number;      // c in the equation
  spanX?: number;        // phase-space width shown across the screen (radians)
  arrowSpacing?: number; // px between quiver arrows
  arrowAlpha?: number;   // opacity of the magnitude-colored arrows
  particleColor?: string;
  density?: number;      // particles per 10 000 px²
  speed?: number;        // time scale of the flow (phase-space units per frame / dt)
};

export function startVectorField(host: HTMLElement, opts: Opts = {}) {
  const {
    damping = 0.15,
    spanX = 6 * Math.PI,
    arrowSpacing = 46,
    arrowAlpha = 0.75,
    particleColor = 'rgba(28, 28, 34, 0.32)',
    density = 0.9,
    speed = 0.16,
  } = opts;

  const mk = () => {
    const c = document.createElement('canvas');
    c.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    host.appendChild(c);
    return c;
  };
  const arrows = mk();
  const flow = mk();
  const actx = arrows.getContext('2d')!;
  const fctx = flow.getContext('2d')!;

  let W = 0, H = 0, dpr = 1, scale = 1;
  type P = { x: number; y: number; life: number };
  let ps: P[] = [];

  // screen <-> phase space (origin at screen centre, y up)
  const toPhase = (sx: number, sy: number) => [(sx - W / 2) / scale, -(sy - H / 2) / scale];
  const field = (x: number, y: number) => [y, -Math.sin(x) - damping * y];

  // viridis colormap (t in 0..1): slow = deep purple, fast = yellow
  const VIRIDIS = [
    [68, 1, 84], [72, 40, 120], [62, 74, 137], [49, 104, 142], [38, 130, 142],
    [31, 158, 137], [53, 183, 121], [110, 206, 88], [181, 222, 43], [253, 231, 37],
  ];
  const colormap = (t: number) => {
    t = Math.min(1, Math.max(0, t)) * (VIRIDIS.length - 1);
    const i = Math.min(VIRIDIS.length - 2, Math.floor(t)), f = t - i;
    const a = VIRIDIS[i], b = VIRIDIS[i + 1];
    return `rgba(${a.map((v, k) => Math.round(v + (b[k] - v) * f)).join(',')},${arrowAlpha})`;
  };

  const spawn = (): P => ({ x: Math.random() * W, y: Math.random() * H, life: 2000 + Math.random() * 5500 });

  function drawArrows() {
    actx.setTransform(dpr, 0, 0, dpr, 0, 0);
    actx.clearRect(0, 0, W, H);
    actx.lineWidth = 1.4;
    actx.lineCap = 'round';
    const s = W < 640 ? arrowSpacing * 0.8 : arrowSpacing;
    // largest |F| on screen, so the colormap spans the visible range
    let mMax = 1e-6;
    for (let sy = s / 2; sy < H; sy += s)
      for (let sx = s / 2; sx < W; sx += s) {
        const [x, y] = toPhase(sx, sy);
        const [u, v] = field(x, y);
        mMax = Math.max(mMax, Math.hypot(u, v));
      }
    for (let sy = s / 2; sy < H; sy += s) {
      for (let sx = s / 2; sx < W; sx += s) {
        const [x, y] = toPhase(sx, sy);
        const [u, v] = field(x, y);
        const m = Math.hypot(u, v);
        if (m < 1e-4) continue;
        // length grows with magnitude but saturates, so the plot stays readable
        const len = s * 0.42 * (0.35 + 0.65 * Math.tanh(m / 1.5));
        const dx = (u / m) * len, dy = (-v / m) * len;
        const col = colormap(0.88 * Math.sqrt(m / mMax)); // sqrt spreads the slow region; 0.88 skips the palest yellow on white
        actx.strokeStyle = col;
        actx.fillStyle = col;
        const x0 = sx - dx / 2, y0 = sy - dy / 2, x1 = sx + dx / 2, y1 = sy + dy / 2;
        actx.beginPath();
        actx.moveTo(x0, y0);
        actx.lineTo(x1, y1);
        actx.stroke();
        const a = Math.atan2(dy, dx), h = 4.5;
        actx.beginPath();
        actx.moveTo(x1, y1);
        actx.lineTo(x1 - h * Math.cos(a - 0.45), y1 - h * Math.sin(a - 0.45));
        actx.lineTo(x1 - h * Math.cos(a + 0.45), y1 - h * Math.sin(a + 0.45));
        actx.closePath();
        actx.fill();
      }
    }
  }

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = host.clientWidth;
    H = host.clientHeight;
    for (const c of [arrows, flow]) {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
    }
    scale = W / spanX;
    fctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const n = Math.min(900, Math.round((W * H) / 10000 * density));
    ps = Array.from({ length: n }, spawn);
    drawArrows();
  }

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  let raf = 0;
  const dt = 0.016;

  function step() {
    // fade old trails toward transparent
    fctx.globalCompositeOperation = 'destination-out';
    fctx.fillStyle = 'rgba(0,0,0,0.02)';
    fctx.fillRect(0, 0, W, H);
    fctx.globalCompositeOperation = 'source-over';
    fctx.strokeStyle = particleColor;
    fctx.lineWidth = 1.3;
    fctx.beginPath();
    for (const p of ps) {
      const [x, y] = toPhase(p.x, p.y);
      // RK2 (midpoint) step in phase space
      const [u1, v1] = field(x, y);
      const [u2, v2] = field(x + u1 * dt * 0.5 * speed, y + v1 * dt * 0.5 * speed);
      const nx = p.x + u2 * dt * speed * scale;
      const ny = p.y - v2 * dt * speed * scale;
      fctx.moveTo(p.x, p.y);
      fctx.lineTo(nx, ny);
      p.x = nx; p.y = ny;
      if (--p.life <= 0 || nx < -10 || nx > W + 10 || ny < -10 || ny > H + 10) Object.assign(p, spawn());
    }
    fctx.stroke();
    raf = requestAnimationFrame(step);
  }

  resize();
  let rt = 0;
  addEventListener('resize', () => { clearTimeout(rt); rt = window.setTimeout(resize, 150); });

  if (!reduced) {
    raf = requestAnimationFrame(step);
    document.addEventListener('visibilitychange', () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) raf = requestAnimationFrame(step);
    });
  }
}
