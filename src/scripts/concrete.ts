// Procedural concrete material, rendered once with WebGL into a seamless tile.
//
// There is no 3D lighting on a web page, so the "material" is baked: the fragment shader
// builds albedo + a height field, derives a normal from the height (bump), lights it with a
// fixed top-left light and a faint roughness-controlled sheen, and writes the result.
// The tile is centred around mid-grey so CSS can lay it over any slab color with `overlay`
// blending (0.5 = no change), which is how every slab keeps its category color.
//
// Every noise is periodic over the tile (integer periods), so the texture repeats seamlessly.
// Domain warping keeps tiling because the warp offset is itself periodic.

export type ConcreteParams = {
  scale: number;        // overall feature scale (1 = default; >1 = smaller features)
  mottle: number;       // contrast of the curing blotches (0..1)
  grain: number;        // sand speckle amount (0..1)
  poreDensity: number;  // fraction of Voronoi cells that hold an air bubble (0..1)
  poreSize: number;     // pore radius multiplier (0.5..2)
  stain: number;        // vertical water-stain strength (0..1)
  crack: number;        // hairline crack strength (0..1)
  bump: number;         // relief strength (keep low: concrete is mostly flat)
  tint: [number, number, number]; // base color multiplier (neutral grey for overlay use)
  seed: number;
};

export const defaults: ConcreteParams = {
  scale: 1,
  mottle: 0.55,       // soft, wide blotches
  grain: 0.4,         // fine sand, no salt-and-pepper noise
  poreDensity: 0.1,   // a few scattered bubbles
  poreSize: 0.75,
  stain: 0.15,
  crack: 0,
  bump: 0.45,
  tint: [1, 1, 1],
  seed: 0.137,
};

const FRAG = /* glsl */ `
precision highp float;
uniform vec2  uRes;
uniform float uScale, uMottle, uGrain, uPoreDensity, uPoreSize, uStain, uCrack, uBump, uSeed;
uniform vec3  uTint;

// ---------- hashing & periodic noise ----------
float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21) + uSeed);
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 hash2(vec2 p) { return vec2(hash(p), hash(p + 17.17)); }

// Perlin gradient noise, periodic with integer period 'per' (x already in lattice units)
float pnoise(vec2 x, vec2 per) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * f * (f * (f * 6.0 - 15.0) + 10.0);
  float n00 = dot(hash2(mod(i,               per)) * 2.0 - 1.0, f);
  float n10 = dot(hash2(mod(i + vec2(1,0),   per)) * 2.0 - 1.0, f - vec2(1,0));
  float n01 = dot(hash2(mod(i + vec2(0,1),   per)) * 2.0 - 1.0, f - vec2(0,1));
  float n11 = dot(hash2(mod(i + vec2(1,1),   per)) * 2.0 - 1.0, f - vec2(1,1));
  return mix(mix(n00, n10, u.x), mix(n01, n11, u.x), u.y) * 1.4; // ~[-1,1]
}

// fBm: 5 octaves, lacunarity 2, gain 0.5. uv in [0,1) tile space, 'per' = base period
float fbm(vec2 uv, vec2 per) {
  float s = 0.0, a = 0.5;
  for (int i = 0; i < 5; i++) {
    s += a * pnoise(uv * per, per);
    per *= 2.0;
    a *= 0.5;
  }
  return s / 0.96875; // ~[-1,1]
}

// Worley: F1, F2 and the id of the nearest cell
vec3 worley(vec2 uv, float per) {
  vec2 x = uv * per;
  vec2 i = floor(x), f = fract(x);
  float f1 = 9.0, f2 = 9.0, id = 0.0;
  for (int y = -1; y <= 1; y++)
  for (int xx = -1; xx <= 1; xx++) {
    vec2 g = vec2(float(xx), float(y));
    vec2 cell = mod(i + g, per);
    vec2 r = g + hash2(cell + 7.7) - f;
    float d = length(r);
    if (d < f1) { f2 = f1; f1 = d; id = hash(cell + 3.1); }
    else if (d < f2) { f2 = d; }
  }
  return vec3(f1, f2, id);
}

// ---------- layers ----------

// 1. Base mottling: slightly domain-warped fBm -> narrow grey band (uneven curing)
float mottling(vec2 uv) {
  float p = floor(3.0 * uScale + 0.5);
  vec2 warp = vec2(fbm(uv + 0.13, vec2(p)), fbm(uv + 0.71, vec2(p))) * 0.06;
  float n = smoothstep(-0.3, 0.3, fbm(uv + warp, vec2(p)));   // stretched to use the full 0..1
  float n2 = smoothstep(-0.35, 0.35, fbm(uv + 0.9, vec2(p * 4.0))); // smaller blotches on top
  n = mix(n, n2, 0.3);
  return mix(0.525, mix(0.36, 0.68, n), uMottle);        // 0.36..0.68 at full contrast
}

// 2. Fine grain (sand aggregate)
//    speckle: per-pixel hash, salt-and-pepper, used lightly in color
float speckle(vec2 uv) {
  return hash(mod(floor(uv * uRes), uRes) + 9.1) - 0.5;  // -0.5..0.5
}
//    sand relief: smooth value noise at two fine scales, used in bump/roughness
float vnoise(vec2 x, float per) {
  vec2 i = floor(x), f = fract(x);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(mod(i, per)), hash(mod(i + vec2(1,0), per)), u.x),
             mix(hash(mod(i + vec2(0,1), per)), hash(mod(i + vec2(1,1), per)), u.x), u.y);
}
float grainNoise(vec2 uv) {
  float p = floor(220.0 * uScale + 0.5);
  return vnoise(uv * p, p) * 0.6 + vnoise(uv * p * 2.0 + 3.3, p * 2.0) * 0.4 - 0.5;
}

// 3. Pores: F1 tightly thresholded; each cell gets its own radius, most cells get none
float pores(vec2 uv) {
  float p = floor(46.0 * uScale + 0.5);
  vec3 w = worley(uv, p);
  float cluster = smoothstep(-0.3, 0.4, fbm(uv + 3.7, vec2(4.0)));  // bubbles gather in patches
  float has = step(1.0 - uPoreDensity * (0.3 + 1.4 * cluster), w.z); // only some cells hold one
  float r = mix(0.05, 0.16, fract(w.z * 37.1)) * uPoreSize;
  return has * (1.0 - smoothstep(r * 0.55, r, w.x));     // 1 inside the dimple
}

// 4a. Water stains: low-frequency noise stretched vertically (8 periods across, 1 down)
float stains(vec2 uv) {
  vec2 warp = vec2(fbm(uv + 2.2, vec2(3.0)), 0.0) * 0.05;          // wobble the streaks sideways
  float n = smoothstep(-0.4, 0.4, fbm(uv + warp + 0.42, vec2(8.0, 1.0)));
  float mask = smoothstep(-0.1, 0.35, fbm(uv + 6.1, vec2(3.0, 2.0)));  // only in some areas
  return smoothstep(0.6, 0.95, n) * mask * uStain;       // 0..stain
}

// 4b. Hairline cracks: thin F2-F1 ridges, masked by noise so they appear in patches
float cracks(vec2 uv) {
  float p = floor(5.0 * uScale + 0.5);
  vec2 warp = vec2(fbm(uv + 1.3, vec2(4.0)), fbm(uv + 2.9, vec2(4.0))) * 0.015;
  vec3 w = worley(uv + warp, p);
  float line = 1.0 - smoothstep(0.0, 0.012, w.y - w.x);
  float mask = smoothstep(0.62, 0.78, fbm(uv + 5.5, vec2(3.0)) * 0.5 + 0.5);
  return line * mask * uCrack;
}

// height field for the bump: mostly flat, sand roughens it, pores and cracks cut in
float height(vec2 uv) {
  return grainNoise(uv) * uGrain * 0.4
       + (mottling(uv) - 0.525) * 0.4
       - pores(uv) * 0.9
       - cracks(uv) * 0.6;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 px = 1.0 / uRes;

  // albedo
  float m  = mottling(uv);
  float g  = grainNoise(uv);
  float sp = speckle(uv);
  float pr = pores(uv);
  float st = stains(uv);
  float ck = cracks(uv);

  float alb = m;
  alb += sp * uGrain * 0.16;    // salt-and-pepper, only lightly in color
  alb += g * uGrain * 0.08;
  alb *= 1.0 - st * 0.35;       // stains darken
  alb *= 1.0 - pr * 0.65;       // pores are dark dimples
  alb *= 1.0 - ck * 0.7;        // cracks are dark lines

  // roughness: high, a little higher in stains and where grain is coarse
  float rough = clamp(0.86 + st * 0.08 + abs(g) * uGrain * 0.08, 0.8, 0.95);

  // bump -> normal (central differences)
  float hL = height(uv - vec2(px.x, 0.0)), hR = height(uv + vec2(px.x, 0.0));
  float hD = height(uv - vec2(0.0, px.y)), hU = height(uv + vec2(0.0, px.y));
  vec3 n = normalize(vec3((hL - hR) * uBump * 3.0, (hD - hU) * uBump * 3.0, 1.0));

  // light from the top-left, viewer straight on
  vec3 L = normalize(vec3(-0.5, 0.55, 0.67));
  float diff = max(dot(n, L), 0.0) / L.z;                      // 1.0 on a flat surface
  vec3 H = normalize(L + vec3(0.0, 0.0, 1.0));
  float spec = pow(max(dot(n, H), 0.0), mix(60.0, 8.0, rough)) * (1.0 - rough) * 0.35;

  vec3 col = uTint * alb * diff + spec;
  // recentre so the average sits near 0.5 (neutral for CSS overlay blending)
  col = col - 0.525 + 0.5;
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`;

const VERT = `attribute vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

export function renderConcrete(size = 1024, params: Partial<ConcreteParams> = {}): Promise<string | null> {
  const P = { ...defaults, ...params };
  return new Promise((resolve) => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = size;
      const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true, antialias: false });
      if (!gl) return resolve(null);

      const sh = (type: number, src: string) => {
        const s = gl.createShader(type)!;
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
        return s;
      };
      const prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VERT));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FRAG));
      gl.linkProgram(prog);
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, 'p');
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

      const u = (n: string) => gl.getUniformLocation(prog, n);
      gl.uniform2f(u('uRes'), size, size);
      gl.uniform1f(u('uScale'), P.scale);
      gl.uniform1f(u('uMottle'), P.mottle);
      gl.uniform1f(u('uGrain'), P.grain);
      gl.uniform1f(u('uPoreDensity'), P.poreDensity);
      gl.uniform1f(u('uPoreSize'), P.poreSize);
      gl.uniform1f(u('uStain'), P.stain);
      gl.uniform1f(u('uCrack'), P.crack);
      gl.uniform1f(u('uBump'), P.bump);
      gl.uniform1f(u('uSeed'), P.seed);
      gl.uniform3f(u('uTint'), ...P.tint);

      gl.viewport(0, 0, size, size);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      // data: URL (not blob:) so it also loads on pages with a strict image policy
      const url = canvas.toDataURL('image/webp', 0.9);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      resolve(url);
    } catch (e) {
      console.warn('concrete shader failed, using fallback texture', e);
      resolve(null);
    }
  });
}
