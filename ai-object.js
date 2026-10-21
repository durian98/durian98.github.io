// Gill-cap object beside the AI title, drawn on the GPU (WebGL fragment shader, no library).
// After the reference clip: rounded translucent caps packed with fine fibres that gather into a dark stem,
// dark at the stem, warm in the middle and pale with a thin rim at the edge, recoloured to the site palette.
// Motion from the clip (30 fps, within shots): a steady turn of about 5 deg/s, the caps opening by roughly a
// fifth over 2-3 s and a slow drift. Here it loops without cuts.
(() => {
  const canvas = document.querySelector('.ai-object');
  if (!canvas) return;
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) { canvas.hidden = true; return; }
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');

  const vertex = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fragment = `
precision highp float;
uniform vec2 res;
uniform float t;
uniform float dpr;
uniform vec4 capA[3];   // stem x, stem y (0..1, y up), direction, size
uniform vec4 capB[3];   // centre offset, phase, fibre count, how far the lobe swings as the body opens
uniform vec3 cCore[3];
uniform vec3 cDeep[3];
uniform vec3 cWarm[3];
uniform vec3 cRim[3];
const float PI = 3.14159265;

float wave(float time, float period, float phase){ return sin(6.2831853 * time / period + phase); }

// thin bright line every 'step' radians along angle a, at radius r (px); returns 0..1 coverage
float fibres(float a, float r, float count){
  float step = 6.2831853 / count;
  float d = abs(mod(a + step * 0.5, step) - step * 0.5) * r;   // pixel distance to the nearest fibre
  float spacing = step * r;                                     // fade fibres where they crowd closer than a few pixels (no moire)
  return (1.0 - smoothstep(0.25 * dpr, 1.15 * dpr, d)) * smoothstep(2.5 * dpr, 5.0 * dpr, spacing);
}

void main(){
  float unit = min(res.x, res.y);
  vec2 q = gl_FragCoord.xy;
  vec2 drift = vec2(wave(t, 17.0, 0.0), wave(t, 17.0, 1.3)) * 8.0 * dpr;
  float turn = 0.32 * wave(t, 13.0, 0.0);
  vec4 acc = vec4(0.0);

  for (int i = 0; i < 3; i++) {
    vec4 A = capA[i]; vec4 B = capB[i];
    float breath = wave(t, 8.0, 0.0);                       // the whole body spreads and gathers together
    float open = 1.0 + 0.17 * breath + 0.04 * wave(t, 3.1, B.y);
    float dir = A.z + turn + B.w * breath;                 // lobes fan apart as the body opens
    vec2 stem = A.xy * res + drift;
    float R = A.w * unit * open;
    float d = R * B.x * 1.6;
    vec2 centre = stem + vec2(cos(dir), sin(dir)) * d;

    vec2 fromC = q - centre;
    float ac = atan(fromC.y, fromC.x);
    float wob = 1.0 + 0.045 * sin(ac * 3.0 + t * 0.7 + B.y) + 0.02 * sin(ac * 11.0 - t * 1.1);
    float rim = R * wob;
    float dc = length(fromC);
    float inside = 1.0 - smoothstep(rim - 3.0 * dpr, rim + 0.5 * dpr, dc);
    float rimLine = 0.7 * exp(-pow((dc - rim) / (1.1 * dpr), 2.0));
    if (inside < 0.001 && rimLine < 0.01) continue;

    vec2 fromS = q - stem;
    float r = length(fromS);
    float reach = d + rim;
    float u = clamp(r / reach, 0.0, 1.0);               // 0 at the stem, 1 at the far rim
    float as = atan(fromS.y, fromS.x);
    // fibres curl a little as they leave the stem; each band lags so the cap ripples open
    float twist = (0.55 + 0.15 * wave(t - u * 1.8, 7.0, B.y)) * u * 0.9;
    float a = as + twist + 0.06 * wave(t - u * 2.4, 9.0, B.y);
    float line = max(fibres(a, r, B.z), 0.6 * fibres(a + 0.0137, r, B.z * 2.7));

    // colour along the fibre: dark stem -> deep -> warm -> pale rim
    vec3 col = mix(cCore[i], cDeep[i], smoothstep(0.02, 0.42, u));
    col = mix(col, cWarm[i], smoothstep(0.36, 0.76, u));
    col = mix(col, cRim[i], smoothstep(0.72, 1.0, u));
    // silky body: a dense coloured membrane with faint fibres over it, thick near the stem, thin at the edge
    float membrane = mix(0.96, 0.16, smoothstep(0.0, 1.0, u));
    float sheen = 0.5 + 0.5 * sin(a * 7.0 + t * 0.4 + B.y);
    float alpha = inside * clamp(membrane * (0.68 + 0.08 * sheen) + line * mix(0.32, 0.14, u), 0.0, 1.0);
    alpha = max(alpha, rimLine * 0.45);
    col = mix(col, cRim[i] * 0.9, rimLine * (1.0 - inside));

    acc.rgb = col * alpha + acc.rgb * (1.0 - alpha);    // back-to-front over
    acc.a = alpha + acc.a * (1.0 - alpha);
  }

  gl_FragColor = acc;
}`;

  const compile = (type, source) => {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source); gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  };
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) { console.warn('[ai-object]', error); canvas.hidden = true; return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(program, 'p');
  gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = name => gl.getUniformLocation(program, name);

  const rgb = hex => [parseInt(hex.slice(1, 3), 16) / 255, parseInt(hex.slice(3, 5), 16) / 255, parseInt(hex.slice(5, 7), 16) / 255];
  // shared stem x, y (y from the bottom), lobe direction (rad), size | offset, phase, fibre count, swing
  const caps = [
    { a: [.48, .32, 1.45, .27], b: [.62, 0.0, 640, 0.10],  core: '#1b2330', deep: '#3a5f78', warm: '#e2a27c', rim: '#b4a8d2' },
    { a: [.48, .32, .15, .20],  b: [.66, 0.7, 480, -0.22], core: '#1d2a24', deep: '#4f7a66', warm: '#e8c494', rim: '#bccab0' },
    { a: [.48, .32, -1.95, .14], b: [.70, 1.4, 360, 0.26], core: '#2a2036', deep: '#6d5a96', warm: '#ecae8e', rim: '#cbb6da' }
  ];
  gl.uniform4fv(u('capA'), caps.flatMap(c => c.a));
  gl.uniform4fv(u('capB'), caps.flatMap(c => c.b));
  for (const key of ['core', 'deep', 'warm', 'rim']) gl.uniform3fv(u('c' + key[0].toUpperCase() + key.slice(1)), caps.flatMap(c => rgb(c[key])));
  const uRes = u('res'), uT = u('t'), uDpr = u('dpr');

  let visible = true, frame = 0, start = 0;
  const size = () => {
    const dpr = Math.min(1.5, devicePixelRatio || 1), box = canvas.getBoundingClientRect();
    canvas.width = Math.max(1, Math.round(box.width * dpr)); canvas.height = Math.max(1, Math.round(box.height * dpr));
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(uRes, canvas.width, canvas.height); gl.uniform1f(uDpr, dpr);
  };
  const draw = seconds => { gl.uniform1f(uT, seconds); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
  const tick = time => {
    if (!start) start = time - 2000;
    draw((time - start) / 1000);
    frame = visible && !document.hidden && !reduced.matches ? requestAnimationFrame(tick) : 0;
  };
  const run = () => { if (reduced.matches) { draw(2); return; } if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); };
  size(); draw(2); run();
  addEventListener('resize', () => { size(); draw(2); });
  document.addEventListener('visibilitychange', run);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }).observe(canvas);
})();
