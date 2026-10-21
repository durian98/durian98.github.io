// Fibre fan beside the AI title, in the site palette. Motion values come from the reference clip
// (30 fps, measured within shots): a steady turn of about 5°/s, the fan opening by roughly a fifth
// over 2–3 s, a core drift of a few pixels, and gently rising speed. Here they loop without cuts.
(() => {
  const canvas = document.querySelector('.ai-object');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lobes = [
    { cx: .47, cy: .66, r: .46, start: -2.35, sweep: 2.0, n: 190, tip: '196,183,212', mid: '120,104,160', core: '30,34,44', phase: 0 },
    { cx: .52, cy: .61, r: .40, start: -.75, sweep: 1.75, n: 160, tip: '226,214,176', mid: '128,156,110', core: '34,48,36', phase: 2.1 },
    { cx: .44, cy: .70, r: .24, start: .45, sweep: 1.5, n: 100, tip: '232,200,178', mid: '190,132,104', core: '52,40,60', phase: 4.2 }
  ];
  const TURN = 18 * Math.PI / 180, TURN_PERIOD = 13;   // ±18° swing, peak ≈ 8.7°/s, average near the measured 5°/s
  const OPEN = .18, OPEN_PERIOD = 9;                   // fan opens and closes by about 18 %
  const DRIFT = 6, DRIFT_PERIOD = 17;                  // core drifts a few pixels
  let width = 0, height = 0, visible = true, frame = 0, start = 0;
  const size = () => {
    const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const wave = (t, period, phase = 0) => Math.sin(2 * Math.PI * t / period + phase);
  const draw = t => {
    ctx.clearRect(0, 0, width, height);
    const unit = Math.min(width, height);
    const turn = TURN * wave(t, TURN_PERIOD);
    const ox = DRIFT * wave(t, DRIFT_PERIOD), oy = DRIFT * wave(t, DRIFT_PERIOD, 1.3);
    ctx.lineWidth = .7;
    for (const lobe of lobes) {
      const cx = lobe.cx * width + ox, cy = lobe.cy * height + oy, reachMax = lobe.r * unit * (1 + OPEN * .5);
      const shade = ctx.createRadialGradient(cx, cy, 0, cx, cy, reachMax);
      shade.addColorStop(0, `rgba(${lobe.core},.9)`);
      shade.addColorStop(.35, `rgba(${lobe.mid},.55)`);
      shade.addColorStop(.85, `rgba(${lobe.tip},.42)`);
      shade.addColorStop(1, `rgba(${lobe.tip},.12)`);
      ctx.strokeStyle = shade;
      const open = 1 + OPEN * wave(t, OPEN_PERIOD, lobe.phase);
      ctx.beginPath();
      for (let i = 0; i < lobe.n; i++) {
        const k = i / (lobe.n - 1);
        // each fibre trails its neighbour slightly, so the fan unfurls like a wave instead of moving as one sheet
        const lag = wave(t - k * 1.6, OPEN_PERIOD, lobe.phase);
        const angle = lobe.start + turn + lobe.sweep * k * (1 + OPEN * .6 * lag);
        const reach = lobe.r * unit * open * (.8 + .2 * Math.sin(k * Math.PI));
        const curl = .32 + .12 * wave(t - k * 2.2, 7, lobe.phase);
        ctx.moveTo(cx, cy);
        ctx.quadraticCurveTo(cx + Math.cos(angle - curl) * reach * .55, cy + Math.sin(angle - curl) * reach * .55,
          cx + Math.cos(angle) * reach, cy + Math.sin(angle) * reach);
      }
      ctx.stroke();
    }
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
