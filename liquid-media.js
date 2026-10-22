/* Local reference-video draft. Playback stays silent and follows visibility. */
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const videos = [...document.querySelectorAll('.liquid-video')];
  const visible = new WeakMap();
  function update(video) {
    if (document.hidden || reduced.matches || !visible.get(video)) {
      video.pause();
      video.dataset.motion = 'paused';
      return;
    }
    video.play().then(() => {video.dataset.motion='playing';}).catch(() => {video.dataset.motion='poster';});
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {visible.set(entry.target,entry.isIntersecting);update(entry.target);});
  });
  function resize() {
    document.documentElement.style.setProperty('--page-width',document.documentElement.clientWidth+'px');
    document.querySelectorAll('.ai-flow').forEach(el => {
      el.style.setProperty('--flow-width',document.documentElement.clientWidth+'px');
      const grid=el.closest('.ai-hero-grid'),hero=el.closest('.project-hero');
      if(document.body.classList.contains('ai-page')&&grid&&hero){
        el.style.setProperty('--flow-top',-(grid.getBoundingClientRect().top+scrollY)+'px');
        el.style.setProperty('--flow-height',(hero.getBoundingClientRect().bottom+scrollY)+'px');
      }
    });
  }
  videos.forEach(video => {
    video.muted = true;
    observer.observe(video);
    video.addEventListener('loadeddata',()=>update(video));
  });
  document.addEventListener('visibilitychange',()=>videos.forEach(update));
  reduced.addEventListener('change',()=>videos.forEach(update));
  document.addEventListener('pointerdown',()=>videos.forEach(update),{once:true});
  window.addEventListener('resize',resize,{passive:true});
  document.fonts.ready.then(resize);
  const hero=document.querySelector('.ai-page .project-hero');
  if(hero)new ResizeObserver(resize).observe(hero);
  resize();
})();
