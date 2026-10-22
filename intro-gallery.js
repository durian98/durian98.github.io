/* One photo at a time, changed only by the visitor. */
(() => {
  const gallery=document.querySelector('.intro-gallery');
  if(!gallery)return;
  const slides=[...gallery.querySelectorAll('.intro-slide')];
  const dots=[...gallery.querySelectorAll('[data-photo-index]')];
  const count=gallery.querySelector('.intro-photo-count span');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  let index=0,start=null,animations=[],revision=0;
  const warm=at=>[at,at+1,at-1].forEach(i=>{slides[(i+slides.length)%slides.length].querySelector('img').loading='eager';});
  const near=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){warm(index);near.disconnect();}},{rootMargin:'200px'});
  near.observe(gallery);
  function show(next,direction=next>index?1:-1){
    const target=(next+slides.length)%slides.length;
    if(target===index)return;
    const previous=index,token=++revision;
    animations.forEach(animation=>animation.cancel());animations=[];
    index=target;
    warm(index);
    slides.forEach((slide,i)=>{
      slide.hidden=i!==index;slide.classList.toggle('is-active',i===index);
      if(i===index)slide.removeAttribute('aria-hidden');else slide.setAttribute('aria-hidden','true');
    });
    if(!reduced.matches){
      const before=slides[previous],after=slides[index];before.hidden=false;
      const options={duration:480,easing:'cubic-bezier(.22,.72,.2,1)',fill:'both'};
      animations=[before.animate([{transform:'translateX(0) scale(1)',opacity:1},{transform:`translateX(${-direction*28}%) scale(.96)`,opacity:0}],options),after.animate([{transform:`translateX(${direction*100}%) scale(1.025)`,opacity:.6},{transform:'translateX(0) scale(1)',opacity:1}],options)];
      Promise.all(animations.map(animation=>animation.finished)).then(()=>{
        if(token!==revision)return;
        before.hidden=true;animations.forEach(animation=>animation.cancel());animations=[];
      }).catch(()=>{});
    }
    dots.forEach((dot,i)=>{if(i===index)dot.setAttribute('aria-current','true');else dot.removeAttribute('aria-current');});
    count.textContent=String(index+1).padStart(2,'0');
  }
  gallery.querySelector('.photo-prev').addEventListener('click',()=>show(index-1));
  gallery.querySelector('.photo-next').addEventListener('click',()=>show(index+1));
  dots.forEach((dot,i)=>dot.addEventListener('click',()=>show(i)));
  gallery.addEventListener('keydown',event=>{
    if(event.key==='ArrowRight'||event.key==='ArrowLeft'){
      event.preventDefault();show(index+(event.key==='ArrowRight'?1:-1));
    }
  });
  const stage=gallery.querySelector('.intro-photo-stage');
  stage.addEventListener('pointerdown',event=>{if(event.isPrimary)start={x:event.clientX,y:event.clientY};});
  stage.addEventListener('pointerup',event=>{
    if(!start)return;
    const dx=event.clientX-start.x,dy=event.clientY-start.y;start=null;
    if(Math.abs(dx)>45&&Math.abs(dx)>Math.abs(dy)*1.4)show(index+(dx<0?1:-1));
  });
  stage.addEventListener('pointercancel',()=>{start=null;});
})();

(() => {
  const reel=document.querySelector('.hero-disciplines');
  if(!reel)return;
  let visible=false;
  const update=()=>reel.classList.toggle('is-running',visible&&!document.hidden);
  new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;update();}).observe(reel);
  document.addEventListener('visibilitychange',update);
})();
