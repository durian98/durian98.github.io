(() => {
  const story=document.querySelector('.phone-story');
  if(!story)return;
  const visual=story.querySelector('.phone-story-visual');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let queued=false, visible=false;
  function draw(){
    queued=false;
    if(reduced.matches){story.classList.remove('is-motion');return;}
    story.classList.add('is-motion');
    const height=visual.getBoundingClientRect().height;
    const top=story.getBoundingClientRect().top;
    const progress=Math.max(0,Math.min(1,(-top+height*.12)/(height*.9)));
    story.style.setProperty('--phone-rise',(-progress*height*.92).toFixed(1)+'px');
  }
  function request(){if(!queued&&(visible||reduced.matches)){queued=true;requestAnimationFrame(draw);}}
  new IntersectionObserver(([entry])=>{visible=entry.isIntersecting;if(visible)request();},{rootMargin:'200px'}).observe(story);
  window.addEventListener('scroll',request,{passive:true});
  window.addEventListener('resize',request,{passive:true});
  reduced.addEventListener('change',draw);
  document.fonts.ready.then(draw);
  draw();
})();
