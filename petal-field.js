// Out-of-focus petal background, tone on tone. Measured from the reference clip (30 fps): soft petals of one
// colour family sway at their edges by about 2 % of the width in different directions and come back close to
// their first shape after about 7 s. The petals are drawn directly in a fragment shader (no image), each one
// swinging on its own phase, so the motion stays smooth; half resolution is enough because everything is soft.
(() => {
  const fields = [...document.querySelectorAll('.petal-field')];
  if (!fields.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const vertex = 'attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }';
  const fragment = `
precision mediump float;
uniform vec2 res;
uniform float t;
// one colour family: paper cream -> pale sage -> sage -> deep sage
vec3 tone(float k){
  vec3 a = vec3(0.945, 0.937, 0.902), b = vec3(0.835, 0.866, 0.784), c = vec3(0.690, 0.757, 0.643), d = vec3(0.533, 0.627, 0.510);
  return k < 0.5 ? mix(a, b, k * 2.0) : (k < 0.8 ? mix(b, c, (k - 0.5) / 0.3) : mix(c, d, (k - 0.8) / 0.2));
}
float petal(vec2 p, vec2 origin, float angle, float len, float wid){
  vec2 d = p - origin;
  float ca = cos(angle), sa = sin(angle);
  vec2 l = vec2(d.x * ca + d.y * sa, -d.x * sa + d.y * ca);    // along, across
  float x = l.x / len;
  float taper = sin(clamp(x, 0.0, 1.0) * 3.14159) * 0.85 + 0.15;
  float e = length(vec2((x - 0.55) / 0.62, l.y / (wid * taper)));
  return (1.0 - smoothstep(0.35, 1.25, e)) * smoothstep(-0.05, 0.12, x);   // very soft edge, like a lens blur
}
void main(){
  vec2 uv = gl_FragCoord.xy / res;
  vec2 p = vec2(uv.x * res.x / res.y, uv.y);
  float aspect = res.x / res.y;
  float w = 6.2831853 * t / 7.0;
  vec2 origin = vec2(aspect * 0.78, -0.12) + vec2(sin(w) * 0.012, cos(w * 0.5) * 0.010);
  vec3 col = tone(0.06);
  // petals: angle, length, width, tone, phase
  for (int i = 0; i < 7; i++) {
    float fi = float(i);
    float base = 1.25 + fi * 0.33;
    float sway = 0.07 * sin(w + fi * 1.7) + 0.03 * sin(w * 2.0 + fi * 0.9);     // about 2 % of the width at the tips
    float len = (0.95 + 0.18 * fract(sin(fi * 12.9) * 43.7)) * (1.0 + 0.03 * sin(w + fi));
    float wid = 0.17 + 0.05 * fract(sin(fi * 7.3) * 91.1);
    float k = 0.42 + 0.5 * fract(sin(fi * 3.1) * 51.3);
    float a = petal(p, origin, base + sway, len, wid);
    col = mix(col, tone(k), a * 0.62);
  }
  // soft light falling across from the upper left, drifting slowly
  float glow = exp(-pow(length(p - vec2(aspect * 0.25 + 0.04 * sin(w), 0.85)), 2.0) / 0.10);
  col = mix(col, vec3(0.985, 0.975, 0.945), glow * 0.55);
  gl_FragColor = vec4(col, 1.0);
}`;
  fields.forEach(field => {
    const canvas = document.createElement('canvas');
    canvas.setAttribute('aria-hidden', 'true');
    const gl = canvas.getContext('webgl', { alpha: false, antialias: false });
    if (!gl) return;
    const shader = (type, src) => { const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null; };
    const vs = shader(gl.VERTEX_SHADER, vertex), fs = shader(gl.FRAGMENT_SHADER, fragment);
    if (!vs || !fs) return;
    const program = gl.createProgram(); gl.attachShader(program, vs); gl.attachShader(program, fs); gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(program, 'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
    const uT = gl.getUniformLocation(program, 't'), uRes = gl.getUniformLocation(program, 'res');
    field.append(canvas);
    let visible = true, frame = 0, start = 0;
    const size = () => {
      const box = field.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * .5)); canvas.height = Math.max(1, Math.round(box.height * .5));
      gl.viewport(0, 0, canvas.width, canvas.height); gl.uniform2f(uRes, canvas.width, canvas.height);
    };
    const draw = seconds => { gl.uniform1f(uT, seconds); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); };
    const tick = time => {
      if (!start) start = time;
      draw((time - start) / 1000);
      frame = visible && !document.hidden && !reduced.matches ? requestAnimationFrame(tick) : 0;
    };
    const run = () => { if (reduced.matches) { draw(0); return; } if (!frame && visible && !document.hidden) frame = requestAnimationFrame(tick); };
    size(); draw(0); field.classList.add('is-live'); run();
    addEventListener('resize', () => { size(); draw(0); });
    document.addEventListener('visibilitychange', run);
    if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; run(); }).observe(field);
  });
})();
