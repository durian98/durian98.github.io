/* The poster paints first; a visible background starts only after critical page assets. */
(() => {
  const videos=[...document.querySelectorAll('.liquid-video')];
  if (!videos.length) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=navigator.connection?.saveData;
  const visible=new WeakMap(); let ready=false;
  const prepare=video=>{
    if (video.dataset.prepared) return;
    const sources=[...video.querySelectorAll('source[data-src]')];
    const source=sources.find(item=>!item.media||matchMedia(item.media).matches);
    if (!source) return;
    video.src=source.dataset.src;video.dataset.prepared='true';video.load();
  };
  function update(video){
    if (!ready||document.hidden||reduced.matches||saveData||!visible.get(video)) {
      video.pause();video.dataset.motion='paused';return;
    }
    prepare(video);
    video.play().then(()=>{video.dataset.motion='playing';}).catch(()=>{video.dataset.motion='poster';});
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{
    visible.set(entry.target,entry.isIntersecting);update(entry.target);
  }),{threshold:.01});
  videos.forEach(video=>observer.observe(video));
  function resize(){
    const width=document.documentElement.clientWidth;
    document.documentElement.style.setProperty('--page-width',width+'px');
    document.querySelectorAll('.ai-flow').forEach(el=>{
      el.style.setProperty('--flow-width',width+'px');
      const grid=el.closest('.ai-hero-grid'),hero=el.closest('.project-hero');
      if(grid&&hero){
        el.style.setProperty('--flow-top',-(grid.getBoundingClientRect().top+scrollY)+'px');
        el.style.setProperty('--flow-height',(hero.getBoundingClientRect().bottom+scrollY)+'px');
      }
    });
  }
  const begin=()=>{
    const run=()=>{ready=true;videos.forEach(update);};
    if ('requestIdleCallback' in window) requestIdleCallback(run,{timeout:1000});
    else requestAnimationFrame(()=>requestAnimationFrame(run));
  };
  videos.forEach(video=>{video.muted=true;});
  if(document.readyState==='complete') begin();else addEventListener('load',begin,{once:true});
  document.addEventListener('visibilitychange',()=>videos.forEach(update));
  reduced.addEventListener('change',()=>videos.forEach(update));
  addEventListener('resize',resize,{passive:true});
  document.fonts.ready.then(resize);
  const hero=document.querySelector('.ai-page .project-hero');
  if(hero)new ResizeObserver(resize).observe(hero);
  resize();
})();
