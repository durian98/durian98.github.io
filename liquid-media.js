/* The poster paints first; a visible background starts only after critical page assets. */
(() => {
  const videos=[...document.querySelectorAll('.liquid-video')];
  if (!videos.length) return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const saveData=navigator.connection?.saveData;
  // Read a tiny frame at most four times a second; only AI text reverses tone.
  const aiVideo=document.querySelector('.ai-page .ai-flow video');
  if(aiVideo){
    const canvas=document.createElement('canvas');canvas.width=32;canvas.height=24;
    const ctx=canvas.getContext('2d',{willReadFrequently:true});
    const labels=[...document.querySelectorAll('.ai-hero-grid .project-title,.ai-hero-grid .project-subtitle')];
    let last=0;
    const luminance=(r,g,b)=>{
      const linear=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
      return .2126*linear(r)+.7152*linear(g)+.0722*linear(b);
    };
    function contrast(now){
      if(!document.hidden&&!aiVideo.paused&&aiVideo.readyState>=2&&now-last>=250){
        last=now;
        const rect=aiVideo.getBoundingClientRect(),scale=Math.max(rect.width/aiVideo.videoWidth,rect.height/aiVideo.videoHeight);
        const sw=rect.width/scale,sh=rect.height/scale;
        ctx.drawImage(aiVideo,(aiVideo.videoWidth-sw)/2,(aiVideo.videoHeight-sh)/2,sw,sh,0,0,32,24);
        const pixels=ctx.getImageData(0,0,32,24).data;
        labels.forEach(label=>{
          const range=document.createRange();range.selectNodeContents(label);
          const area=range.getBoundingClientRect(),points=[];
          for(const f of [.12,.35,.58,.82]){
            const x=Math.max(0,Math.min(31,Math.floor((area.left+area.width*f-rect.left)/rect.width*32)));
            const y=Math.max(0,Math.min(23,Math.floor((area.top+area.height*.5-rect.top)/rect.height*24)));
            const i=(y*32+x)*4;points.push(luminance(pixels[i],pixels[i+1],pixels[i+2]));
          }
          const dark=Math.min(...points.map(l=>(l+.05)/.068)),light=Math.min(...points.map(l=>1.01/(l+.05)));
          const tone=light>dark?'light':'dark';
          if(label.dataset.videoTone&&label.dataset.videoTone!==tone&&Math.max(light,dark)<Math.min(light,dark)*1.15)return;
          if(label.dataset.videoTone!==tone)label.dataset.videoTone=tone;
        });
      }
      aiVideo.requestVideoFrameCallback(contrast);
    }
    if(ctx&&'requestVideoFrameCallback' in aiVideo)aiVideo.requestVideoFrameCallback(contrast);
  }
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
