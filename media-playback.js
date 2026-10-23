/* Fetch near the viewport; decode only while visible. */
(() => {
  const videos=[...document.querySelectorAll('.liquid-video,.demo-video')];
  if(!videos.length)return;
  const reduced=matchMedia('(prefers-reduced-motion: reduce)'),saveData=navigator.connection?.saveData===true;
  const visible=new WeakMap(),allowed=()=>!document.hidden&&!reduced.matches&&!saveData;
  function prepare(v){
    if(v.dataset.prepared)return;
    const source=[...v.querySelectorAll('source[data-src]')].find(s=>!s.media||matchMedia(s.media).matches);
    if(source){v.dataset.prepared='true';v.preload='auto';v.src=source.dataset.src;v.load();}
  }
  function update(v){
    if(!allowed()||!visible.get(v)){v.pause();v.dataset.motion='paused';return;}
    prepare(v);if(!v.paused)return;
    v.play().then(()=>{v.dataset.motion='playing';}).catch(()=>{v.dataset.motion='poster';});
  }
  const observer=new IntersectionObserver(entries=>entries.forEach(e=>{visible.set(e.target,e.isIntersecting);update(e.target);}),{threshold:.01});
  const warm=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting&&allowed()){prepare(e.target);warm.unobserve(e.target);}}),{rootMargin:'160px'});
  videos.forEach(v=>{v.muted=true;observer.observe(v);warm.observe(v);});
  document.addEventListener('visibilitychange',()=>videos.forEach(update));
  reduced.addEventListener('change',()=>videos.forEach(update));addEventListener('pageshow',()=>videos.forEach(update));

  const flows=[...document.querySelectorAll('.ai-flow')],aiVideo=document.querySelector('.ai-page .ai-flow video');
  const labels=[...document.querySelectorAll('.ai-hero-grid .project-title,.ai-hero-grid .project-subtitle')];
  let samples=[],layoutFrame=0,videoRect=null;
  function measure(){
    layoutFrame=0;const width=document.documentElement.clientWidth;
    const metrics=flows.map(el=>{const grid=el.closest('.ai-hero-grid'),hero=el.closest('.project-hero');return {el,top:grid?-(grid.getBoundingClientRect().top+scrollY):0,height:hero?hero.getBoundingClientRect().bottom+scrollY:0};});
    if(aiVideo){
      const rect=aiVideo.getBoundingClientRect();videoRect={width:rect.width,height:rect.height};
      samples=labels.map(label=>{const range=document.createRange();range.selectNodeContents(label);const box=range.getBoundingClientRect();return {label,points:[.12,.35,.58,.82].map(f=>({x:Math.max(0,Math.min(31,Math.floor((box.left+box.width*f-rect.left)/Math.max(1,rect.width)*32))),y:Math.max(0,Math.min(23,Math.floor((box.top+box.height*.5-rect.top)/Math.max(1,rect.height)*24)))}))};});
    }
    for(const {el,top,height} of metrics)for(const [name,value] of [['--flow-width',width+'px'],['--flow-top',top+'px'],['--flow-height',height+'px']])if(el.style.getPropertyValue(name)!==value)el.style.setProperty(name,value);
  }
  const schedule=()=>{if(!layoutFrame)layoutFrame=requestAnimationFrame(measure);};
  if(flows.length){
    const ro=new ResizeObserver(schedule);
    document.querySelectorAll('.ai-page .project-hero,.ai-hero-grid .project-title,.ai-hero-grid .project-subtitle').forEach(el=>ro.observe(el));
    addEventListener('resize',schedule,{passive:true});document.fonts.ready.then(schedule);schedule();
  }
  if(!aiVideo||!labels.length)return;
  const canvas=document.createElement('canvas');canvas.width=32;canvas.height=24;
  const ctx=canvas.getContext('2d',{willReadFrequently:true});if(!ctx)return;
  const linear=v=>{v/=255;return v<=.04045?v/12.92:Math.pow((v+.055)/1.055,2.4);};
  let frame=0,timer=0,last=-Infinity;
  function stop(){if(frame)aiVideo.cancelVideoFrameCallback?.(frame);clearTimeout(timer);frame=0;timer=0;}
  function next(){if(aiVideo.paused||!visible.get(aiVideo)||!allowed())return;if('requestVideoFrameCallback'in aiVideo)frame=aiVideo.requestVideoFrameCallback(contrast);else timer=setTimeout(()=>contrast(performance.now()),350);}
  function contrast(now){
    frame=0;timer=0;if(aiVideo.paused||!visible.get(aiVideo)||!allowed())return;
    if(now-last>=350&&aiVideo.readyState>=2&&samples.length&&videoRect){
      last=now;const scale=Math.max(videoRect.width/aiVideo.videoWidth,videoRect.height/aiVideo.videoHeight),sw=videoRect.width/scale,sh=videoRect.height/scale;
      try{
        ctx.drawImage(aiVideo,(aiVideo.videoWidth-sw)/2,(aiVideo.videoHeight-sh)/2,sw,sh,0,0,32,24);
        const pixels=ctx.getImageData(0,0,32,24).data;
        for(const {label,points}of samples){
          const values=points.map(({x,y})=>{const i=(y*32+x)*4;return .2126*linear(pixels[i])+.7152*linear(pixels[i+1])+.0722*linear(pixels[i+2]);});
          const dark=Math.min(...values.map(l=>(l+.05)/.068)),light=Math.min(...values.map(l=>1.01/(l+.05))),tone=light>dark?'light':'dark';
          if(label.dataset.videoTone&&label.dataset.videoTone!==tone&&Math.max(light,dark)<Math.min(light,dark)*1.15)continue;
          if(label.dataset.videoTone!==tone)label.dataset.videoTone=tone;
        }
      }catch{stop();return;}
    }next();
  }
  aiVideo.addEventListener('playing',()=>{stop();next();});aiVideo.addEventListener('pause',stop);aiVideo.addEventListener('ended',stop);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stop();});
})();
