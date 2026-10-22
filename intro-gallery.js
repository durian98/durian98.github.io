/* One photo at a time, changed only by the visitor. */
(() => {
  const gallery=document.querySelector('.intro-gallery');
  if(!gallery)return;
  const slides=[...gallery.querySelectorAll('.intro-slide')];
  const dots=[...gallery.querySelectorAll('[data-photo-index]')];
  const count=gallery.querySelector('.intro-photo-count span');
  let index=0,start=null;
  function show(next){
    index=(next+slides.length)%slides.length;
    slides.forEach((slide,i)=>{slide.hidden=i!==index;slide.classList.toggle('is-active',i===index);});
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
