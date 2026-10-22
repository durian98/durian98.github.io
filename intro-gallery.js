/* One photo at a time, changed only by the visitor. */
(() => {
  const gallery=document.querySelector('.intro-gallery');
  if(!gallery)return;
  const slides=[...gallery.querySelectorAll('.intro-slide')];
  const dots=[...gallery.querySelectorAll('[data-photo-index]')];
  const count=gallery.querySelector('.intro-photo-count span');
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const track=gallery.querySelector('.intro-photo-track');
  let index=0,start=null,fade=null;
  const warm=at=>[at,at+1,at-1].forEach(i=>{slides[(i+slides.length)%slides.length].querySelector('img').loading='eager';});
  const near=new IntersectionObserver(entries=>{if(entries[0].isIntersecting){warm(index);near.disconnect();}},{rootMargin:'200px'});
  near.observe(gallery);
  slides.forEach((slide,i)=>{slide.hidden=false;slide.setAttribute('aria-hidden',String(i!==0));});
  function show(next){
    const target=(next+slides.length)%slides.length;
    if(target===index)return;
    const jump=Math.abs(target-index)>1;
    fade?.cancel();
    track.style.transition=jump||reduced.matches?'none':'';
    index=target;warm(index);
    track.style.transform=`translate3d(${-index*100}%,0,0)`;
    slides.forEach((slide,i)=>{slide.classList.toggle('is-active',i===index);slide.setAttribute('aria-hidden',String(i!==index));});
    if(jump&&!reduced.matches)fade=track.animate([{opacity:.3},{opacity:1}],{duration:350,easing:'ease-out'});
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
