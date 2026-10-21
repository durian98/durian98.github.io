(() => {
  document.documentElement.classList.add('portfolio-ready');
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const players = [...document.querySelectorAll('[data-motion]')].map(root => {
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
  const panels = [...root.querySelectorAll('.skill-panel')];
  let selected = 0, automatic = !reduced.matches, hover = false, focus = false, visible = false;
  let offset = -30, lastTime = 0, frame = 0, drag = null, suppressClickUntil = 0, inertiaFrame = 0, resumeTimer = 0;
  let pitch = 108, cycle = pitch * tabs.length;
  const measure = () => { pitch = (tabs[0].offsetWidth || 88) + 20; cycle = pitch * tabs.length; };
  measure();
  root.classList.add('is-enhanced');
  track.setAttribute('role', 'tablist');
  tabs.forEach((tab, index) => {
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(index === 0));
    tab.tabIndex = index === 0 ? 0 : -1;
    panels[index].setAttribute('role', 'tabpanel');
    panels[index].tabIndex = 0;
    panels[index].hidden = index !== 0;
  });
  function centerTab(index, smooth = false) {
    const tab = tabs[index];
    track.scrollTo({ left: tab.offsetLeft - (track.clientWidth - tab.offsetWidth) / 2, behavior: smooth && !reduced.matches ? 'smooth' : 'instant' });
  }
  function manualMode() {
    if (track.classList.contains('is-manual')) return;
    track.classList.add('is-manual');
    tabs.forEach(tab => tab.style.removeProperty('transform'));
    centerTab(selected);
  }
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
    measure();
    const width = track.clientWidth;
    tabs.forEach((tab, i) => {
      let x = ((i * pitch - offset) % cycle + cycle) % cycle;
      if (x > cycle - pitch) x -= cycle;
      const distance = Math.min(1, Math.abs(x + (pitch - 20) / 2 - width / 2) / Math.max(1, width / 2));
      const scale = .7 + .3 * (1 - distance * distance);
      tab.style.transform = `translateX(${x.toFixed(2)}px) scale(${scale.toFixed(3)})`;
    });
  };
  function tick(time) {
    const dt = Math.min(50, time - (lastTime || time));
    lastTime = time;
    if (automatic && visible && !document.hidden && !hover && !focus && !drag) {
      offset += 14 * dt / 1000;
      paint();
    }
    if (automatic) frame = requestAnimationFrame(tick);
    else { frame = 0; lastTime = 0; }
  }
  function start() {
    cancelAnimationFrame(inertiaFrame);
    if (track.classList.contains('is-manual')) offset = track.scrollLeft - 12;
    track.classList.remove('is-manual');
    track.scrollLeft = 0;
    automatic = true;
    paint();
    if (!frame) frame = requestAnimationFrame(tick);
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
  track.addEventListener('pointerleave', event => { if (event.pointerType === 'mouse') { hover = false; resumeLater(); } });
  track.addEventListener('focusin', event => { focus = event.target.matches(':focus-visible'); if (!drag) stopAuto(); });
  track.addEventListener('focusout', event => { if (!track.contains(event.relatedTarget)) { focus = false; resumeLater(); } });
  track.addEventListener('pointerdown', event => {
    if (event.button !== 0) return;
    clearTimeout(resumeTimer);
    // Once in manual mode, touch uses the browser's own horizontal scrolling and momentum.
    if (event.pointerType !== 'mouse' && track.classList.contains('is-manual')) return;
    cancelAnimationFrame(inertiaFrame);
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
    track.scrollLeft -= dx;
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
      track.scrollLeft += velocity * dt; velocity *= Math.pow(.91, dt / 16);
      if (Math.abs(velocity) > .015) inertiaFrame = requestAnimationFrame(coast);
    }
    inertiaFrame = requestAnimationFrame(coast);
  }
  track.addEventListener('pointerup', release);
  track.addEventListener('pointercancel', event => { if (drag?.id === event.pointerId) drag = null; resumeLater(); });
  track.addEventListener('touchend', () => resumeLater(), { passive: true });
  track.addEventListener('scroll', () => { if (!automatic && !drag) resumeLater(); }, { passive: true });
  window.addEventListener('pointerup', release);
  window.addEventListener('resize', () => { if (automatic) paint(); });
  reduced.addEventListener('change', () => { if (reduced.matches) stopAuto(); });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; }, { threshold: .1 }).observe(track);
  } else visible = true;
  if (automatic) start(); else manualMode();
})();


// Hero photo stack: the front card sits flush with the top; hold, then move one card up with a slight overshoot.
(() => {
  const root = document.querySelector('.hero-photos');
  if (!root) return;
  const track = root.querySelector('.hero-track');
  const cards = [...track.children];
  if (cards.length < 2) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const head = cards[cards.length - 1].cloneNode(true), tail = cards[0].cloneNode(true);
  for (const clone of [head, tail]) { clone.setAttribute('aria-hidden', 'true'); clone.querySelector('img').removeAttribute('loading'); }
  track.prepend(head); track.append(tail);
  // Desktop stacks photos vertically; phones lay them out in a row that moves right to left.
  const phone = matchMedia('(max-width: 760px)');
  let index = 1, pitch = 0, base = 0, timer = 0, visible = true;
  // Dots beside the stack show which photo is in front and jump to one when pressed.
  const dots = document.createElement('div');
  dots.className = 'hero-dots';
  dots.setAttribute('aria-label', '사진 선택');
  const buttons = cards.map((card, i) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.setAttribute('aria-label', `${i + 1}번째 사진: ${card.querySelector('figcaption')?.textContent || ''}`);
    button.addEventListener('click', () => { index = i + 1; place(true); schedule(); });
    dots.append(button);
    return button;
  });
  root.append(dots);
  // Only the card resting at the top loses its upper corners; peeking cards stay rounded.
  const markFront = () => [...track.children].forEach((card, i) => card.classList.toggle('is-front', i === index));
  const place = animate => {
    if (animate) track.querySelector('.is-front')?.classList.remove('is-front'); else markFront();
    const current = ((index - 1) % cards.length + cards.length) % cards.length;
    buttons.forEach((button, i) => button.toggleAttribute('aria-current', i === current));
    track.style.transition = animate ? 'transform 1.1s cubic-bezier(.6,0,.2,1.12)' : 'none';
    const shift = (base - index * pitch).toFixed(1);
    track.style.transform = phone.matches ? `translate3d(${shift}px, 0, 0)` : `translate3d(0, ${shift}px, 0)`;
  };
  const layout = () => {
    if (phone.matches) {
      // Equal side margins (the page gutter); the gap matches, so the next photo waits just off screen.
      const gutter = parseFloat(getComputedStyle(root).paddingLeft) || 20;
      const card = Math.round(root.clientWidth - gutter * 2);
      track.style.setProperty('--card-w', `${card}px`);
      track.style.setProperty('--card-gap', `${gutter}px`);
      pitch = card + gutter; base = gutter;
    } else {
      const card = Math.round(root.clientHeight * .88);
      track.style.setProperty('--card-h', `${card}px`);
      pitch = card + 10; base = 0;
    }
    place(false);
  };
  track.addEventListener('transitionend', event => {
    if (event.target !== track) return;
    if (index === cards.length + 1) index = 1;
    place(false);
  });
  const schedule = () => {
    clearTimeout(timer);
    if (reduced.matches || !visible || document.hidden) return;
    timer = setTimeout(() => { index += 1; place(true); schedule(); }, 3600);
  };
  layout(); schedule();
  addEventListener('resize', layout);
  phone.addEventListener('change', layout);
  document.addEventListener('visibilitychange', schedule);
  // Coming back into view re-places the stack, so a browser that dropped the offscreen layer repaints it.
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; if (visible) place(false); schedule(); }).observe(root);
  addEventListener('pageshow', () => place(false));
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
  items.forEach(el => el.classList.add('rv-item'));
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
