(() => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const updatePageWidth = () => document.documentElement.style.setProperty('--page-width', `${document.documentElement.clientWidth}px`);
  updatePageWidth();
  window.addEventListener('resize', updatePageWidth, {passive:true});
  const toggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.site-nav');
  const closeMenu = () => { if (!toggle || !nav) return; nav.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.textContent = '메뉴'; };
  toggle?.addEventListener('click', () => { const open = toggle.getAttribute('aria-expanded') !== 'true'; toggle.setAttribute('aria-expanded', String(open)); nav.classList.toggle('is-open', open); toggle.textContent = open ? '닫기' : '메뉴'; });
  nav?.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && nav?.classList.contains('is-open')) { closeMenu(); toggle.focus(); } });
  document.querySelectorAll('.back-top').forEach(el => el.addEventListener('click', () => window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' })));
  document.querySelectorAll('[data-page-back]').forEach(button => button.addEventListener('click', () => {
    const fromPortfolio = document.referrer && new URL(document.referrer).origin === location.origin;
    if (fromPortfolio && history.length > 1) {
      history.back();
    } else if (document.body.classList.contains('home')) {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'instant' : 'smooth' });
    } else {
      location.assign('index.html');
    }
  }));
  document.querySelectorAll('[data-copy-email]').forEach(button => button.addEventListener('click', async () => {
    const status = document.querySelector('.copy-status');
    try { await navigator.clipboard.writeText('masdf13@naver.com'); status.textContent = '이메일 주소를 복사했습니다.'; }
    catch { status.textContent = '이메일 주소: masdf13@naver.com'; }
  }));
  const stages = [
    ['01 · 요청 접수', '여행과 추천 작업 접수', '화면이 날짜·예산·이동 조건과 취향을 보내면 여행 정보와 조건을 저장하고, 계산이 끝나기 전에 작업 번호(jobId)를 먼저 돌려줍니다.'],
    ['02 · 비동기 계산', '후보와 일정 계산', 'Spring 내부의 비동기 실행기가 추천 후보와 일정을 계산합니다. API가 계산 완료까지 기다리지 않도록 요청 접수와 실행을 나눴습니다. 추천 알고리즘과 장소 데이터의 후속 확장은 팀 구현입니다.'],
    ['03 · DB 저장', '결과와 작업 상태 저장', '사용자·여행·작업 상태와 추천 결과를 PostgreSQL에 저장합니다. 같은 작업 번호로 진행 상태와 결과를 조회할 수 있도록 연결했습니다.'],
    ['04 · 결과 확인', '진행 상태와 추천 결과 확인', '서버가 SSE로 진행 상태를 전달하고, 화면은 조회 API로 작업 상태와 완료 결과를 확인합니다. 접수·진행·완료·실패를 구분했습니다.']
  ];
  const stageButtons = [...document.querySelectorAll('.stage-button')];
  const panel = document.querySelector('.stage-panel');
  const stageTabs = stageButtons[0]?.closest('.stage-tabs');
  const moveStageIndicator = () => {
    if (!stageTabs) return;
    const selected = stageTabs.querySelector('[aria-pressed="true"]');
    if (!selected) return;
    const tabRect = stageTabs.getBoundingClientRect();
    const buttonRect = selected.getBoundingClientRect();
    stageTabs.style.setProperty('--stage-x', `${buttonRect.left - tabRect.left - stageTabs.clientLeft}px`);
    stageTabs.style.setProperty('--stage-y', `${buttonRect.top - tabRect.top - stageTabs.clientTop}px`);
    stageTabs.style.setProperty('--stage-width', `${buttonRect.width}px`);
    stageTabs.style.setProperty('--stage-height', `${buttonRect.height}px`);
    stageTabs.classList.add('has-stage-indicator');
  };
  stageButtons.forEach((button, index) => button.addEventListener('click', () => {
    stageButtons.forEach((item, i) => item.setAttribute('aria-pressed', String(i === index)));
    moveStageIndicator();
    if (panel) { panel.querySelector('.eyebrow').textContent = stages[index][0]; panel.querySelector('h3').textContent = stages[index][1]; panel.querySelector('p').textContent = stages[index][2]; }
  }));
  if (stageTabs) {
    moveStageIndicator();
    new ResizeObserver(moveStageIndicator).observe(stageTabs);
  }

  const progress = document.querySelector('.reading-progress');
  if (progress) {
    let scheduled = false;
    const updateProgress = () => {
      const distance = document.documentElement.scrollHeight - window.innerHeight;
      const amount = distance > 0 ? Math.min(1, Math.max(0, window.scrollY / distance)) : 0;
      progress.style.transform = `scaleX(${amount})`;
      scheduled = false;
    };
    window.addEventListener('scroll', () => {
      if (!scheduled) { scheduled = true; window.requestAnimationFrame(updateProgress); }
    }, {passive: true});
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }
  if (!reducedMotion && 'IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) {
        if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
      }
    }, {rootMargin: '0px 0px 35px 0px', threshold: 0.07});
    document.querySelectorAll('.reveal').forEach(element => observer.observe(element));
    document.documentElement.classList.add('motion-ready');
  }
})();
/* Original petal texture, deformed continuously without replacing its silhouette. */
(() => {
  const field = document.querySelector('.home .hero .petal-field');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!field || reduced.matches) return;
  const canvas = document.createElement('canvas');
  canvas.className = 'hero-motion-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const gl = canvas.getContext('webgl', {alpha: false, antialias: false});
  if (!gl) return;
  const shader = (kind, source) => {
    const result = gl.createShader(kind);
    gl.shaderSource(result, source); gl.compileShader(result);
    if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) throw new Error('Petal shader compilation failed');
    return result;
  };
  const program = gl.createProgram();
  try {
    gl.attachShader(program, shader(gl.VERTEX_SHADER, 'attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
    gl.attachShader(program, shader(gl.FRAGMENT_SHADER, `
      precision mediump float;
      varying vec2 uv;
      uniform sampler2D image;
      uniform float time;
      uniform vec2 fit;
      void main(){
        vec2 p=(uv-.5)*fit;
        float t=time;
        // Different phases let the broad petals open, curl and settle independently.
        float opening=sin(t*.42);
        float curl=sin(t*.31+1.3);
        p.x+=.033*sin(p.y*5.5+t*.42)+.014*curl*cos(p.x*4.);
        p.y+=.028*sin(p.x*5.-t*.36)+.012*opening*cos(p.y*3.);
        float angle=.035*sin(t*.27);
        p=mat2(cos(angle),-sin(angle),sin(angle),cos(angle))*p;
        p/=(1.10+.025*sin(t*.38));
        vec3 color=texture2D(image,clamp(p+.5, .001,.999)).rgb;
        color=mix(color,vec3(1.,.94,.89),.08);
        gl_FragColor=vec4(color,1.);
      }`));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
  } catch (_) { return; }
  gl.useProgram(program);
  const buffer=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buffer);
  gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');
  gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const time=gl.getUniformLocation(program,'time'), fit=gl.getUniformLocation(program,'fit');
  const texture=gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D,texture);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
  const image=new Image(); let active=false,request=0,elapsed=0,last=0;
  const draw = now => {
    request=0;
    if (!active || document.hidden || reduced.matches) { last=0; return; }
    if (last) elapsed+=Math.min(now-last,60)/1000;
    last=now; gl.uniform1f(time,elapsed); gl.drawArrays(gl.TRIANGLES,0,6);
    request=requestAnimationFrame(draw);
  };
  const resume=()=>{if(active&&!document.hidden&&!reduced.matches&&!request)request=requestAnimationFrame(draw);};
  image.onload=()=>{
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL,true);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGB,gl.RGB,gl.UNSIGNED_BYTE,image);
    field.append(canvas); field.classList.add('has-liquid-motion');
    const resize=()=>{
      const box=field.getBoundingClientRect(), ratio=box.width/box.height, imageRatio=image.width/image.height;
      const dpr=Math.min(devicePixelRatio||1,1.5);
      canvas.width=Math.round(box.width*dpr);canvas.height=Math.round(box.height*dpr);
      gl.viewport(0,0,canvas.width,canvas.height);
      gl.uniform2f(fit,Math.min(1,ratio/imageRatio),Math.min(1,imageRatio/ratio));
      gl.uniform1f(time,elapsed);gl.drawArrays(gl.TRIANGLES,0,6);
    };
    new ResizeObserver(resize).observe(field);resize();
    new IntersectionObserver(entries=>{active=entries[0].isIntersecting;resume();},{threshold:0}).observe(field);
    document.addEventListener('visibilitychange',resume);
    reduced.addEventListener('change',()=>{
      canvas.hidden=reduced.matches;field.classList.toggle('has-liquid-motion',!reduced.matches);resume();
    });
  };
  image.src='assets/hero-floral-reference.webp';
})();
