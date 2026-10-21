// Single gill-cap body beside the AI title, drawn on the GPU (WebGL fragment shader, no library).
// After the reference clip: one translucent cap flaring from one twisted dark throat, packed with fine fibres,
// folded into an S at one side; dark at the throat, warm in the middle, pale with a thin edge line at the rim.
// Motion from the clip: the cap spreads and gathers (about a third), the throat twists and the fold opens slowly.
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
const float PI = 3.14159265;
float wave(float time, float period, float phase){ return sin(6.2831853 * time / period + phase); }

// One body: a single cap flaring from one twisted throat, folded into an S at the lower right.
// Colours follow the clip (dark throat -> deep -> warm -> pale rim with a thin edge line), in the site palette.
vec3 cThroat = vec3(0.09, 0.12, 0.17);
vec3 cDeep   = vec3(0.14, 0.28, 0.40);
vec3 cMid    = vec3(0.30, 0.44, 0.42);
vec3 cWarm   = vec3(0.93, 0.62, 0.45);
vec3 cRim    = vec3(0.78, 0.74, 0.90);

float fibres(float a, float r, float count){
  float step = 6.2831853 / count;
  float d = abs(mod(a + step * 0.5, step) - step * 0.5) * r;
  return (1.0 - smoothstep(0.25 * dpr, 1.1 * dpr, d)) * smoothstep(2.5 * dpr, 5.0 * dpr, step * r);
}

void main(){
  float unit = min(res.x, res.y);
  vec2 q = gl_FragCoord.xy;
  float grow  = 1.0 + 0.20 * wave(t, 9.0, 0.0);              // the cap spreads and gathers (~35 % peak to peak)
  float spin  = 0.18 * wave(t, 14.0, 0.0);                   // slow turn of the whole body
  float curl  = 0.55 + 0.35 * wave(t, 11.0, 1.0);            // the S fold opens and closes
  vec2 throat = vec2(0.46, 0.24) * res + vec2(wave(t, 17.0, 0.0), wave(t, 17.0, 1.3)) * 6.0 * dpr;

  vec2 d = q - throat;
  float r = length(d);
  float th = atan(d.y, d.x) - spin;                          // 0 = right, PI/2 = up
  float R = 0.40 * unit * grow;
  // outline seen from the throat: a large dome above, a narrower fold curling to the lower right, a notch between
  float up = max(0.0, cos(th - 1.65));
  float dome = 0.22 + 1.05 * pow(up, 0.55);                  // the dome rises above the throat, only a short skirt below
  float fold = 0.62 * exp(-pow(th + 0.45, 2.0) / 0.20) * curl;
  float notch = 0.30 * exp(-pow(th - 0.25, 2.0) / 0.05);
  float edge = 1.0 + 0.04 * sin(th * 5.0 + t * 0.6) + 0.015 * sin(th * 17.0 - t * 1.2);
  float rim = R * max(0.28, dome + fold - notch) * edge;

  float inside = 1.0 - smoothstep(rim - 3.0 * dpr, rim + 0.5 * dpr, r);
  float rimLine = 0.75 * exp(-pow((r - rim) / (1.2 * dpr), 2.0));
  float u = clamp(r / rim, 0.0, 1.0);

  // fibres leave the throat and bend as they spread; the twist sweeps through the cap over time
  float twist = (0.35 + 0.25 * wave(t - u * 2.0, 8.0, 0.0)) * u + 0.25 * curl * u * u;
  float a = th + twist;
  float line = max(fibres(a, r, 260.0), 0.6 * fibres(a + 0.011, r, 620.0));

  vec3 col = mix(cThroat, cDeep, smoothstep(0.0, 0.25, u));
  col = mix(col, cMid, smoothstep(0.18, 0.42, u));
  col = mix(col, cWarm, smoothstep(0.32, 0.62, u));
  col = mix(col, cRim, smoothstep(0.74, 1.0, u));
  float membrane = mix(0.97, 0.34, smoothstep(0.0, 1.0, u));
  col *= 1.0 - 0.28 * line * smoothstep(0.15, 0.6, u);            // fibres read as fine darker strands
  float alpha = inside * clamp(membrane * 0.70 + line * mix(0.45, 0.22, u), 0.0, 1.0);
  col = mix(col, vec3(0.50, 0.54, 0.76), rimLine);
  alpha = max(alpha, rimLine * 0.5);

  // twisted throat below the cap: tapered, soft-edged, fading in where it meets the cap
  vec4 outCol = vec4(col * alpha, alpha);
  float yy = throat.y - q.y;
  if (yy > -0.04 * unit && yy < 0.24 * unit) {
    float k = clamp(yy / (0.24 * unit), 0.0, 1.0);
    float x = throat.x + unit * 0.04 * sin(k * PI * 1.3 + t * 0.5) * k;
    float w = unit * mix(0.016, 0.004, k);
    float m = (1.0 - smoothstep(w - 2.0 * dpr, w + 2.0 * dpr, abs(q.x - x))) * (1.0 - k) * smoothstep(-0.04 * unit, 0.02 * unit, yy) * 0.85;
    vec3 sc = mix(cThroat, cDeep, k);
    outCol = vec4(sc * m, m) + outCol * (1.0 - m);
  }
  gl_FragColor = outCol;
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
