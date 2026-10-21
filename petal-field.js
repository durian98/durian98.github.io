// Out-of-focus petal background. Measured from the reference clip (30 fps): the frame is not still, the
// petal edges sway by about 2 % of the width in different directions and the field comes back close to its
// first shape after about 7 s. A blurred petal image is sampled through a slow, looping warp on the GPU.
// The blur means half resolution is enough, so it stays light; without WebGL the still image shows instead.
(() => {
  const fields = [...document.querySelectorAll('.petal-field')];
  if (!fields.length) return;
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const vertex = 'attribute vec2 p; varying vec2 v; void main(){ v = p * 0.5 + 0.5; gl_Position = vec4(p, 0.0, 1.0); }';
  const fragment = `
precision mediump float;
varying vec2 v;
uniform sampler2D img;
uniform float t;
uniform vec2 cover;   // scale that makes the image cover the box
void main(){
  float w = 6.2831853 * t / 7.0;                       // one loop every 7 s
  vec2 uv = (v - 0.5) * cover + 0.5;
  vec2 warp = vec2(
    sin(uv.y * 5.1 + w + sin(uv.x * 3.3 - w)) + 0.6 * sin(uv.x * 2.2 - w + 1.7),
    cos(uv.x * 4.3 - w + cos(uv.y * 2.9 + w)) + 0.6 * cos(uv.y * 3.1 + w + 0.4)
  ) * 0.011;                                           // about 2 % of the width peak to peak
  gl_FragColor = texture2D(img, vec2(uv.x, 1.0 - uv.y) + warp);
}`;
  const image = new Image();
  image.src = 'assets/petal-field.webp';
  image.decode().then(() => fields.forEach(setup)).catch(() => {});

  function setup(field) {
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
    gl.bindTexture(gl.TEXTURE_2D, gl.createTexture());
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    const uT = gl.getUniformLocation(program, 't'), uCover = gl.getUniformLocation(program, 'cover');
    field.append(canvas);
    let visible = true, frame = 0, start = 0;
    const size = () => {
      const box = field.getBoundingClientRect();
      canvas.width = Math.max(1, Math.round(box.width * .5)); canvas.height = Math.max(1, Math.round(box.height * .5));
      gl.viewport(0, 0, canvas.width, canvas.height);
      const boxRatio = box.width / Math.max(1, box.height), imgRatio = image.width / image.height;
      gl.uniform2f(uCover, boxRatio > imgRatio ? 0.94 : 0.94 * boxRatio / imgRatio, boxRatio > imgRatio ? 0.94 * imgRatio / boxRatio : 0.94);
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
  }
})();
