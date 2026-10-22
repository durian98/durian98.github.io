(() => {
  document.documentElement.classList.add('portfolio-ready');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const players = [...document.querySelectorAll('.motion-media[data-motion]')].map(root => {
    const img = root.querySelector('img');
    const state = { root, img, paused: reduced.matches, visible: false, playing: false };
    const update = () => {
      const play = state.visible && !state.paused && !document.hidden;
      if (play !== state.playing) {
        img.src = play ? img.dataset.gifSrc : img.dataset.posterSrc;
        state.playing = play;
      }
    };
    state.update = update;
    update();
    return state;
  });
  if ('IntersectionObserver' in window) {
    const mediaObserver = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        const player = players.find(item => item.root === entry.target);
        player.visible = entry.isIntersecting;
        player.update();
      });
    }, { threshold: .12 });
    players.forEach(player => mediaObserver.observe(player.root));
  } else {
    players.forEach(player => { player.visible = true; player.update(); });
  }
  document.addEventListener('visibilitychange', () => players.forEach(player => player.update()));
  reduced.addEventListener('change', () => players.forEach(player => { player.paused = reduced.matches; player.update(); }));

  const root = document.querySelector('.skills');
  if (!root) return;
  const track = root.querySelector('.skill-track');
  const tabs = [...track.querySelectorAll('.skill-tab')];
  let copies = [], copyCycles = 0;
  const panels = [...root.querySelectorAll('.skill-panel')];
  let selected = 0, automatic = !reduced.matches, hover = false, focus = false, visible = false;
  let offset = -30, lastTime = 0, frame = 0, drag = null, suppressClickUntil = 0, inertiaFrame = 0, resumeTimer = 0;
  let pitch = 108, cycle = pitch * tabs.length, railWidth = track.clientWidth;
  const measure = () => { pitch = (tabs[0].offsetWidth || 88) + 20; cycle = pitch * tabs.length; railWidth = track.clientWidth; };
  measure();
  root.classList.add('is-enhanced');
  // The dock becomes measurable only after enhancement makes it visible.
  measure();
  track.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
    panels[index].hidden = index !== 0;
  });
  // The rail never switches to a finite scroll list: dragging, flicking and selecting all move the same looping
  // offset, so the last icon is always followed by the first.
  let glide = 0;
  function centerTab(index, smooth = false) {
    measure();
    const want = index * pitch - (track.clientWidth / 2 - (pitch - 20) / 2);
    const target = want + Math.round((offset - want) / cycle) * cycle;
    cancelAnimationFrame(glide);
    if (!smooth || reduced.matches) { offset = target; paint(); return; }
    const from = offset, begin = performance.now();
    const step = now => {
      const k = Math.min(1, (now - begin) / 420), e = 1 - Math.pow(1 - k, 3);
      offset = from + (target - from) * e; paint();
      if (k < 1) glide = requestAnimationFrame(step);
    };
    glide = requestAnimationFrame(step);
  }
  function manualMode() { paint(); }
  function stopAuto() { clearTimeout(resumeTimer); automatic = false; manualMode(); }
  function resumeLater() {
    clearTimeout(resumeTimer);
    resumeTimer = setTimeout(() => {
      if (!reduced.matches && !hover && !tabs.some(tab => tab.matches(':focus-visible')) && !drag) { focus = false; start(); }
    }, 3000);
  }
  function select(index) {
    selected = index;
    tabs.forEach((tab, i) => {
      tab.setAttribute('aria-selected', String(i === index));
      tab.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
      panels[i].classList.remove('is-entering');
    });
    panels[index].classList.add('is-entering');
    centerTab(index, true);
  }
  const paint = () => {
    const width = railWidth;
    const needed=Math.ceil(width/cycle);
    if(needed!==copyCycles){
      copies.forEach(({node})=>node.remove());copies=[];copyCycles=needed;
      for(let lap=1;lap<=needed;lap++)tabs.forEach((tab,index)=>{
        const node=tab.cloneNode(true);
        node.removeAttribute('id');node.removeAttribute('aria-controls');node.removeAttribute('aria-selected');
        node.setAttribute('aria-hidden','true');node.setAttribute('tabindex','-1');node.dataset.visualCopy='true';
        node.addEventListener('click',()=>tab.click());
        track.append(node);copies.push({node,index,lap});
      });
    }
    const position=(node,x)=>{
      const distance=Math.min(1,Math.abs(x+(pitch-20)/2-width/2)/Math.max(1,width/2));
      const scale=.7+.3*(1-distance*distance);
      node.style.transform=`translateX(${x.toFixed(2)}px) scale(${scale.toFixed(3)})`;
      node.style.visibility=(x < -pitch || x > width+pitch)?'hidden':'visible';
    };
    tabs.forEach((tab, i) => {
      let x = ((i * pitch - offset) % cycle + cycle) % cycle;
      if (x > cycle - pitch) x -= cycle;
      position(tab,x);
    });
    copies.forEach(({node,index,lap})=>{
      let x=((index*pitch-offset)%cycle+cycle)%cycle;
      if(x>cycle-pitch)x-=cycle;
      position(node,x+lap*cycle);
    });
  };
  function tick(time) {
    const dt = Math.min(50, time - (lastTime || time));
    lastTime = time;
    if (automatic && visible && !document.hidden && !hover && !focus && !drag) {
      offset += 14 * dt / 1000;
      paint();
    }
    if (automatic && visible && !document.hidden && !hover && !focus && !drag) frame = requestAnimationFrame(tick);
    else { frame = 0; lastTime = 0; }
  }
  function start() {
    cancelAnimationFrame(inertiaFrame); cancelAnimationFrame(glide);
    automatic = true;
    paint();
    if (!frame && visible && !document.hidden && !hover && !focus && !drag && !reduced.matches) frame = requestAnimationFrame(tick);
  }
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', () => {
      if (performance.now() < suppressClickUntil) return;
      stopAuto(); select(index);
    });
    tab.addEventListener('keydown', event => {
      let target = index;
      if (event.key === 'ArrowRight') target = (index + 1) % tabs.length;
      else if (event.key === 'ArrowLeft') target = (index - 1 + tabs.length) % tabs.length;
      else if (event.key === 'Home') target = 0;
      else if (event.key === 'End') target = tabs.length - 1;
      else return;
      event.preventDefault(); stopAuto(); select(target); tabs[target].focus({ preventScroll: true });
    });
  });
  // Hover pauses only for a mouse; a finger leaves no hover state behind, so auto movement can resume after touch.
  track.addEventListener('pointerenter', event => { if (event.pointerType === 'mouse') { hover = true; clearTimeout(resumeTimer); } });
  track.addEventListener('pointerleave', event => {
    if (event.pointerType !== 'mouse') return;
    hover = false;
    clearTimeout(resumeTimer);
    if (!reduced.matches && !drag && !tabs.some(tab => tab.matches(':focus-visible'))) {
      focus = false;
      start();
    }
  });
  track.addEventListener('focusin', event => { focus = event.target.matches(':focus-visible'); if (!drag) stopAuto(); });
  track.addEventListener('focusout', event => { if (!track.contains(event.relatedTarget)) { focus = false; resumeLater(); } });
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    clearTimeout(resumeTimer);
    cancelAnimationFrame(inertiaFrame); cancelAnimationFrame(glide);
    drag = { id: event.pointerId, start: event.clientX, previous: event.clientX, time: performance.now(), velocity: 0, moved: false };
  });
  track.addEventListener('pointermove', event => {
    if (!drag || drag.id !== event.pointerId) return;
    if (!drag.moved && Math.abs(event.clientX - drag.start) > 6) {
      stopAuto(); drag.moved = true; track.setPointerCapture(event.pointerId);
    }
    if (!drag.moved) return;
    const now = performance.now();
    const dx = event.clientX - drag.previous;
    offset -= dx; paint();
    drag.velocity = -dx / Math.max(1, now - drag.time);
    drag.previous = event.clientX; drag.time = now;
  });
  function release(event) {
    if (!drag || drag.id !== event.pointerId) return;
    const finished = drag; drag = null;
    resumeLater();
    if (!finished.moved) return;
    suppressClickUntil = performance.now() + 180;
    if (track.hasPointerCapture(event.pointerId)) track.releasePointerCapture(event.pointerId);
    if (reduced.matches) return;
    let velocity = Math.max(-1.8, Math.min(1.8, finished.velocity));
    let previous = performance.now();
    function coast(now) {
      const dt = Math.min(32, now - previous); previous = now;
      offset += velocity * dt; paint(); velocity *= Math.pow(.91, dt / 16);
      if (Math.abs(velocity) > .015) inertiaFrame = requestAnimationFrame(coast);
    }
    inertiaFrame = requestAnimationFrame(coast);
  }
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) drag = null; resumeLater(); });
  track.addEventListener('touchend', () => resumeLater(), { passive: true });
  window.addEventListener('pointerup', release);
  new ResizeObserver(() => { measure(); paint(); }).observe(track);
  reduced.addEventListener('change', () => { if (reduced.matches) stopAuto(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible && automatic) start(); }, { threshold: .1 }).observe(track);
    document.addEventListener('visibilitychange', () => { if (!document.hidden && automatic) start(); });
  } else visible = true;
  centerTab(selected);
  if (automatic) start(); else paint();
})();


// Mouse-wheel scrolling glides to a stop (about half a second), like the reference; touch, keyboard and reduced motion keep native scrolling.
(() => {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let target = scrollY, current = scrollY, running = false;
  const limit = () => document.documentElement.scrollHeight - innerHeight;
  const step = () => {
    if (!running) return;
    current += (target - current) * .14;
    if (Math.abs(target - current) < .5) current = target;
    scrollTo({ top: current, behavior: 'instant' });
    if (current === target) running = false; else requestAnimationFrame(step);
  };
  addEventListener('wheel', event => {
    if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return;
    // Touchpads already glide natively; only notched mouse wheels (large, whole-step deltas) are smoothed.
    if (event.deltaMode === 0 && (Math.abs(event.deltaY) < 50 || !Number.isInteger(event.deltaY))) { running = false; return; }
    for (let el = event.target; el && el !== document.body; el = el.parentElement) {
      if (/(auto|scroll)/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight) return;
    }
    event.preventDefault();
    const delta = event.deltaMode === 1 ? event.deltaY * 40 : event.deltaMode === 2 ? event.deltaY * innerHeight : event.deltaY;
    if (!running) target = current = scrollY;
    target = Math.max(0, Math.min(limit(), target + delta));
    if (!running) { running = true; requestAnimationFrame(step); }
  }, { passive: false });
  addEventListener('scroll', () => { if (!running) target = current = scrollY; }, { passive: true });
  document.addEventListener('click', event => { if (event.target.closest('a[href^="#"]')) running = false; });
})();

// Scroll rendering: each block fades up as it enters, items in the same batch 70ms apart (measured from the reference clip).
(() => {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) return;
  const roots = document.querySelectorAll('.reveal, .intro-inner, .contact-section');
  const pick = 'h1, h2, h3, p, li, dl > div, figure, details, table, .browser-frame, .work-visual, .phone-frame, .app-gallery > div, .work-meta, .work-open, .contact-links, .contact-top, .intro-links, .eyebrow, .case-label';
  const items = [];
  roots.forEach(root => {
    if (root.closest('#skills')) return;
    root.querySelectorAll(pick).forEach(el => {
      const owner = el.parentElement.closest(pick);
      if (owner && root.contains(owner)) return;
      if (el.closest('.skill-panel, .hero')) return;
      if (!items.includes(el)) items.push(el);
    });
  });
  if (!items.length) return;
  document.documentElement.classList.add('rv-ready');
  items.forEach(el => { if (el.getBoundingClientRect().top < innerHeight) el.classList.add('is-in'); el.classList.add('rv-item'); });
  const observer = new IntersectionObserver(entries => {
    const shown = entries.filter(entry => entry.isIntersecting).map(entry => entry.target)
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top || a.getBoundingClientRect().left - b.getBoundingClientRect().left);
    shown.forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i, 6) * 70}ms`;
      el.classList.add('is-in');
      observer.unobserve(el);
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0 });
  items.forEach(el => observer.observe(el));
})();
