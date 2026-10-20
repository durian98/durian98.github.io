(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  document.documentElement.classList.add('enhanced');
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const closeMenu = () => { if (!toggle || !nav) return; nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = 'MENU +'; };
  toggle?.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); toggle.textContent = open ? 'CLOSE −' : 'MENU +'; });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  if ('IntersectionObserver' in window && !reducedMotion) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => { if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target); } }), { threshold: .08 });
    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
  } else document.querySelectorAll('.reveal').forEach(el => el.classList.add('visible'));
  const progress = document.querySelector('.reading-progress');
  let frame = null;
  const setProgress = () => { const max = document.documentElement.scrollHeight - window.innerHeight; if (progress) progress.style.transform = `scaleX(${max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0})`; frame = null; };
  window.addEventListener('scroll', () => { if (frame === null) frame = requestAnimationFrame(setProgress); }, { passive: true });
  window.addEventListener('resize', setProgress); setProgress();
  document.querySelectorAll('.back-top').forEach(el => el.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })));
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try { await navigator.clipboard.writeText('masdf13@naver.com'); status.textContent = '이메일 주소를 복사했어요.'; }
    catch { status.textContent = '이메일 주소: masdf13@naver.com'; }
  }));
  const art = document.querySelector('.hero-art');
  if (art && !reducedMotion && window.matchMedia('(pointer: fine)').matches) {
    art.addEventListener('pointermove', event => { const box = art.getBoundingClientRect(); art.style.setProperty('--mx', `${(event.clientX - box.left - box.width / 2) * .025}px`); art.style.setProperty('--my', `${(event.clientY - box.top - box.height / 2) * .025}px`); });
    art.addEventListener('pointerleave', () => { art.style.setProperty('--mx', '0px'); art.style.setProperty('--my', '0px'); });
  }
  const stages = [
    ['REQUEST ACCEPTED', '접수와 완료를 구분합니다', '화면이 날짜·예산·이동 조건과 취향을 보내면 여행과 제약을 저장합니다. 긴 추천 계산은 접수 응답(202)과 작업 번호(jobId)를 먼저 반환합니다. 같은 요청을 다시 보내도 중복 여행이 생기지 않도록 처리했습니다.'],
    ['BACKGROUND CALCULATION', '계산은 별도 실행기에서 이어갑니다', 'Spring 내부의 비동기 실행기가 추천 후보와 일정을 계산합니다. API 응답이 계산이 끝날 때까지 묶이지 않도록 요청 접수와 실행을 나눴습니다. 추천 알고리즘과 장소 데이터의 후속 확장은 팀 구현입니다.'],
    ['POSTGRESQL', '결과와 상태를 같은 작업에 연결합니다', '사용자·여행·작업 상태와 추천 결과를 PostgreSQL에 저장합니다. 새 후보 저장의 비용 비교는 프로젝트 뒤에 수행한 별도 로컬 실험이며, 운영 성능으로 표현하지 않았습니다.'],
    ['PROGRESS & RESULT', '화면은 진행 상태와 결과를 확인합니다', '서버가 SSE로 진행 상태를 전달하고, 조회 API로 작업 상태와 완료 결과를 확인합니다. 접수·진행·완료·실패를 구분해 화면과 서버가 같은 상태를 보도록 맞췄습니다.']
  ];
  const stageButtons = [...document.querySelectorAll('.stage-button')];
  const panel = document.querySelector('.stage-panel');
  stageButtons.forEach((button, index) => button.addEventListener('click', () => {
    stageButtons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
    if (panel) { panel.querySelector('.eyebrow').textContent = stages[index][0]; panel.querySelector('h3').textContent = stages[index][1]; panel.querySelector('p').textContent = stages[index][2]; }
  }));
})();
