// Gill-cap object beside the AI title, after the reference clip: rounded translucent caps filled with fine
// fibres that gather into a dark stem, warm in the middle and pale at the rim, recoloured to the site palette.
// Motion from the clip (30 fps, within shots): a steady turn of about 5 deg/s, the caps opening by roughly
// a fifth over 2-3 s and a slow drift. Here it loops without cuts.
(() => {
  const canvas = document.querySelector('.ai-object');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  // stem point, cap direction, cap size, how far the cap centre sits from the stem, colours
  const caps = [
    { sx: .50, sy: .58, dir: -1.75, size: .30, off: .55, n: 420, ph: 0,   core: [26, 34, 44], deep: [52, 84, 104],  warm: [222, 160, 120], rim: [176, 164, 206] },
    { sx: .50, sy: .60, dir: -.35,  size: .23, off: .60, n: 330, ph: 2.1, core: [28, 40, 34], deep: [74, 110, 92],  warm: [232, 196, 150], rim: [184, 200, 168] },
    { sx: .46, sy: .64, dir: 2.35,  size: .17, off: .62, n: 260, ph: 4.0, core: [40, 30, 52], deep: [118, 92, 150], warm: [236, 168, 140], rim: [200, 178, 214] }
  ];
  let width = 0, height = 0, visible = true, frame = 0, start = 0;
  const size = () => {
    const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const wave = (t, period, phase = 0) => Math.sin(2 * Math.PI * t / period + phase);
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;
  function drawCap(cap, t, unit, turn, ox, oy) {
    const open = 1 + .18 * wave(t, 9, cap.ph);                        // caps open and close by about 18 %
    const dir = cap.dir + turn + .1 * wave(t, 11, cap.ph);
    const sx = cap.sx * width + ox, sy = cap.sy * height + oy;
    const R = cap.size * unit * open, d = R * cap.off * 1.6;
    const cx = sx + Math.cos(dir) * d, cy = sy + Math.sin(dir) * d;    // cap centre, offset from the stem
    const outline = a => {                                             // rounded, slightly scalloped rim
      const wob = 1 + .045 * Math.sin(a * 3 + t * .7 + cap.ph) + .02 * Math.sin(a * 11 - t * 1.1);
      return [cx + Math.cos(a) * R * wob, cy + Math.sin(a) * R * wob];
    };
    const body = ctx.createRadialGradient(sx, sy, 0, sx, sy, d + R);
    body.addColorStop(0, rgba(cap.core, .95));
    body.addColorStop(.42, rgba(cap.deep, .8));
    body.addColorStop(.74, rgba(cap.warm, .6));
    body.addColorStop(1, rgba(cap.rim, .18));
    const trace = steps => {
      ctx.beginPath();
      for (let i = 0; i <= steps; i++) { const p = outline(i / steps * Math.PI * 2); if (i) ctx.lineTo(p[0], p[1]); else ctx.moveTo(p[0], p[1]); }
    };
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = body; ctx.globalAlpha = .38;                       // translucent membrane
    trace(96); ctx.fill();
    // fibres from the stem to the rim; each lags a little so the cap ripples open
    ctx.globalAlpha = .55; ctx.strokeStyle = body; ctx.lineWidth = .55;
    ctx.beginPath();
    for (let i = 0; i < cap.n; i++) {
      const k = i / cap.n, a = dir + Math.PI + (k - .5) * 2 * Math.PI * .97;
      const [ex, ey] = outline(a + .06 * wave(t - k * 2.4, 9, cap.ph));
      const twist = .55 + .15 * wave(t - k * 1.8, 7, cap.ph);
      const mx = (sx + ex) / 2 + Math.cos(a + Math.PI / 2) * R * .25 * twist;
      const my = (sy + ey) / 2 + Math.sin(a + Math.PI / 2) * R * .25 * twist;
      ctx.moveTo(sx, sy); ctx.quadraticCurveTo(mx, my, ex, ey);
    }
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = .5;  // thin rim line
    ctx.strokeStyle = rgba(cap.rim, .9); ctx.lineWidth = 1;
    trace(120); ctx.stroke();
    ctx.globalAlpha = 1;
  }
  const draw = t => {
    ctx.clearRect(0, 0, width, height);
    const unit = Math.min(width, height);
    const turn = .32 * wave(t, 13);                                    // about +-18 deg, near the measured 5 deg/s
    const ox = 8 * wave(t, 17), oy = 8 * wave(t, 17, 1.3);
    for (const cap of caps) drawCap(cap, t, unit, turn, ox, oy);
    // stem: a short dark twist under the caps
    ctx.globalCompositeOperation = 'multiply';
    const sx = .49 * width + ox, sy = .62 * height + oy;
    const stem = ctx.createLinearGradient(sx, sy - unit * .05, sx, sy + unit * .22);
    stem.addColorStop(0, 'rgba(26,34,44,.9)'); stem.addColorStop(1, 'rgba(118,92,150,0)');
    ctx.strokeStyle = stem; ctx.lineWidth = unit * .03; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(sx, sy);
    ctx.bezierCurveTo(sx + unit * .05 * wave(t, 8), sy + unit * .08, sx - unit * .04, sy + unit * .14, sx + unit * .02 * wave(t, 10, 1), sy + unit * .22);
    ctx.stroke();
    ctx.globalCompositeOperation = 'source-over';
  };
  const tick = time => {
    if (!start) start = time - 2000;
    draw((time - start) / 1000);
    frame = visible && !document.hidden && !reduced.matches ? requestAnimationFrame(tick) : 0;
  };
  const run = () => { if (reduced.matches) { draw(2); return; } if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); };
  size(); draw(2); run();
  addEventListener('resize', () => { size(); draw(2); });
  document.addEventListener('visibilitychange', run);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }).observe(canvas);
})();
