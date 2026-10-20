(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const closeMenu = () => { if (!toggle || !nav) return; nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '메뉴'; };
  toggle?.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); toggle.textContent = open ? '닫기' : '메뉴'; });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  document.querySelectorAll('.back-top').forEach(el => el.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })));
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try { await navigator.clipboard.writeText('masdf13@naver.com'); status.textContent = '이메일 주소를 복사했습니다.'; }
    catch { status.textContent = '이메일 주소: masdf13@naver.com'; }
  }));
  const stages = [
    ['01 · 요청 접수', '여행과 추천 작업 접수', '날짜·예산·이동 조건과 취향을 저장합니다. 긴 추천 계산은 접수 응답(202)과 작업 번호(jobId)를 먼저 반환합니다. 같은 요청을 다시 보내도 중복 여행이 생기지 않도록 처리했습니다.'],
    ['02 · 비동기 계산', '후보와 일정 계산', 'Spring 내부의 비동기 실행기가 추천 후보와 일정을 계산합니다. API가 계산 완료까지 기다리지 않도록 요청 접수와 실행을 나눴습니다. 추천 알고리즘과 장소 데이터의 후속 확장은 팀 구현입니다.'],
    ['03 · DB 저장', '결과와 작업 상태 저장', '사용자·여행·작업 상태와 추천 결과를 PostgreSQL에 저장합니다. 같은 작업 번호로 진행 상태와 결과를 조회할 수 있도록 연결했습니다.'],
    ['04 · 결과 확인', '진행 상태와 추천 결과 확인', '서버가 SSE로 진행 상태를 전달하고, 화면은 조회 API로 작업 상태와 완료 결과를 확인합니다. 접수·진행·완료·실패를 구분했습니다.']
  ];
  const stageButtons = [...document.querySelectorAll('.stage-button')];
  const panel = document.querySelector('.stage-panel');
  stageButtons.forEach((button, index) => button.addEventListener('click', () => {
    stageButtons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
    if (panel) { panel.querySelector('.eyebrow').textContent = stages[index][0]; panel.querySelector('h3').textContent = stages[index][1]; panel.querySelector('p').textContent = stages[index][2]; }
  }));
})();
