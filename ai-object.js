// Fibre fan beside the AI title: two translucent lobes of thin strokes, drawn in the site palette.
// Motion follows the reference's within-shot drift: a slow turn and breathing, no cuts.
(() => {
  const canvas = document.querySelector('.ai-object');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const lobes = [
    { cx: .40, cy: .70, r: .62, start: -2.35, sweep: 2.0, n: 200, tip: [196, 183, 212], mid: [120, 104, 160], core: [30, 34, 44], spin: .06 },
    { cx: .46, cy: .64, r: .52, start: -.75, sweep: 1.75, n: 170, tip: [226, 214, 176], mid: [128, 156, 110], core: [34, 48, 36], spin: -.05 },
    { cx: .36, cy: .74, r: .30, start: .45, sweep: 1.5, n: 110, tip: [232, 200, 178], mid: [190, 132, 104], core: [52, 40, 60], spin: .08 }
  ];
  const mix = (a, b, t) => a.map((v, i) => Math.round(v + (b[i] - v) * t));
  let width = 0, height = 0, visible = true, frame = 0, start = 0;
  const size = () => {
    const box = canvas.getBoundingClientRect(), dpr = Math.min(2, devicePixelRatio || 1);
    width = box.width; height = box.height;
    canvas.width = Math.round(width * dpr); canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const draw = time => {
    const t = time / 1000;
    ctx.clearRect(0, 0, width, height);
    const unit = Math.min(width, height);
    for (const lobe of lobes) {
      const cx = lobe.cx * width, cy = lobe.cy * height;
      const breathe = 1 + .05 * Math.sin(t * .52 + lobe.cx * 9);
      const turn = lobe.spin * Math.sin(t * .26);
      for (let i = 0; i < lobe.n; i++) {
        const k = i / (lobe.n - 1);
        const angle = lobe.start + turn + lobe.sweep * k;
        const reach = lobe.r * unit * breathe * (.82 + .18 * Math.sin(k * Math.PI));
        const bend = .35 * Math.sin(t * .4 + k * 3);
        const ex = cx + Math.cos(angle) * reach, ey = cy + Math.sin(angle) * reach;
        const qx = cx + Math.cos(angle - .35 + bend * .2) * reach * .55, qy = cy + Math.sin(angle - .35 + bend * .2) * reach * .55;
        const gradient = ctx.createLinearGradient(cx, cy, ex, ey);
        gradient.addColorStop(0, `rgba(${lobe.core},.9)`);
        gradient.addColorStop(.35, `rgba(${lobe.mid},.55)`);
        gradient.addColorStop(.85, `rgba(${lobe.tip},.45)`);
        gradient.addColorStop(1, `rgba(${lobe.tip},.15)`);
        ctx.strokeStyle = gradient;
        ctx.lineWidth = .7;
        ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(qx, qy, ex, ey); ctx.stroke();
      }
    }
  };
  const tick = time => {
    if (!start) start = time;
    draw(time - start + 4000);
    frame = visible && !document.hidden && !reduced.matches ? requestAnimationFrame(tick) : 0;
  };
  const run = () => { if (!frame && visible && !document.hidden && !reduced.matches) frame = requestAnimationFrame(tick); else if (reduced.matches) draw(4000); };
  size(); draw(4000); run();
  addEventListener('resize', () => { size(); draw(4000); });
  document.addEventListener('visibilitychange', run);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }).observe(canvas);
})();
