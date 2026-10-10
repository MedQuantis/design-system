// Colour maths for the token tests: WCAG 2.x contrast, alpha compositing, CIELAB, CIEDE2000
// and colour-vision-deficiency simulation. No dependency, so the gate cannot drift with a
// library release.

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i;
const RGBA = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/i;

export function parseColor(input) {
  if (typeof input === "object" && input !== null && "r" in input) return input;
  const text = String(input).trim();
  const hex = text.match(HEX);
  if (hex) {
    let digits = hex[1];
    if (digits.length === 3) digits = [...digits].map((d) => d + d).join("");
    const byte = (i) => Number.parseInt(digits.slice(i, i + 2), 16) / 255;
    return { r: byte(0), g: byte(2), b: byte(4), a: digits.length === 8 ? byte(6) : 1 };
  }
  const rgba = text.match(RGBA);
  if (rgba) {
    const [r, g, b] = rgba.slice(1, 4).map((c) => Number(c) / 255);
    return { r, g, b, a: rgba[4] === undefined ? 1 : Number(rgba[4]) };
  }
  throw new Error(`unsupported colour: ${text}`);
}

export const toHex = ({ r, g, b }) =>
  `#${[r, g, b].map((c) => Math.round(Math.min(1, Math.max(0, c)) * 255).toString(16).padStart(2, "0")).join("")}`;

// Source-over compositing of a possibly translucent colour onto an opaque one, rounded to
// 8-bit channels as a browser would paint it.
export function composite(top, bottom) {
  const fg = parseColor(top);
  const bg = parseColor(bottom);
  if (bg.a !== 1) throw new Error("composite needs an opaque bottom layer");
  const mix = (f, b) => Math.round((f * fg.a + b * (1 - fg.a)) * 255) / 255;
  return { r: mix(fg.r, bg.r), g: mix(fg.g, bg.g), b: mix(fg.b, bg.b), a: 1 };
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const fromLinear = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

// WCAG 2.x relative luminance (sRGB, 0.04045 threshold as in the sRGB standard).
export function relativeLuminance(color) {
  const { r, g, b } = parseColor(color);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

export function contrastRatio(foreground, background) {
  const bg = parseColor(background);
  if (bg.a !== 1) throw new Error("contrastRatio needs an opaque background; composite it first");
  const fg = composite(foreground, bg);
  const [light, dark] = [relativeLuminance(fg), relativeLuminance(bg)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

// sRGB (D65) to CIELAB (D65 reference white).
export function toLab(color) {
  const { r, g, b } = parseColor(color);
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const x = (0.4124564 * lr + 0.3575761 * lg + 0.1804375 * lb) / 0.95047;
  const y = 0.2126729 * lr + 0.7151522 * lg + 0.072175 * lb;
  const z = (0.0193339 * lr + 0.119192 * lg + 0.9503041 * lb) / 1.08883;
  const f = (t) => (t > 216 / 24389 ? Math.cbrt(t) : ((24389 / 27) * t + 16) / 116);
  const [fx, fy, fz] = [x, y, z].map(f);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

export function toLch(color) {
  const [l, a, b] = toLab(color);
  const hue = (Math.atan2(b, a) * 180) / Math.PI;
  return [l, Math.hypot(a, b), hue < 0 ? hue + 360 : hue];
}

// CIEDE2000 colour difference (Sharma, Wu and Dalal, 2005), kL = kC = kH = 1.
export function deltaE2000([l1, a1, b1], [l2, a2, b2]) {
  const rad = Math.PI / 180;
  const pow7 = (v) => v ** 7;
  const cBar = (Math.hypot(a1, b1) + Math.hypot(a2, b2)) / 2;
  const g = 0.5 * (1 - Math.sqrt(pow7(cBar) / (pow7(cBar) + pow7(25))));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.hypot(a1p, b1);
  const c2p = Math.hypot(a2p, b2);
  const hueOf = (b, a) => {
    if (a === 0 && b === 0) return 0;
    const h = Math.atan2(b, a) / rad;
    return h < 0 ? h + 360 : h;
  };
  const h1p = hueOf(b1, a1p);
  const h2p = hueOf(b2, a2p);
  const dLp = l2 - l1;
  const dCp = c2p - c1p;
  let dhp = 0;
  if (c1p * c2p !== 0) {
    dhp = h2p - h1p;
    if (dhp > 180) dhp -= 360;
    else if (dhp < -180) dhp += 360;
  }
  const dHp = 2 * Math.sqrt(c1p * c2p) * Math.sin((dhp * rad) / 2);
  const lBarP = (l1 + l2) / 2;
  const cBarP = (c1p + c2p) / 2;
  let hBarP = h1p + h2p;
  if (c1p * c2p !== 0) {
    if (Math.abs(h1p - h2p) <= 180) hBarP = (h1p + h2p) / 2;
    else hBarP = h1p + h2p < 360 ? (h1p + h2p + 360) / 2 : (h1p + h2p - 360) / 2;
  }
  const t =
    1 -
    0.17 * Math.cos((hBarP - 30) * rad) +
    0.24 * Math.cos(2 * hBarP * rad) +
    0.32 * Math.cos((3 * hBarP + 6) * rad) -
    0.2 * Math.cos((4 * hBarP - 63) * rad);
  const dTheta = 30 * Math.exp(-(((hBarP - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt(pow7(cBarP) / (pow7(cBarP) + pow7(25)));
  const sl = 1 + (0.015 * (lBarP - 50) ** 2) / Math.sqrt(20 + (lBarP - 50) ** 2);
  const sc = 1 + 0.045 * cBarP;
  const sh = 1 + 0.015 * cBarP * t;
  const rt = -Math.sin(2 * dTheta * rad) * rc;
  return Math.sqrt((dLp / sl) ** 2 + (dCp / sc) ** 2 + (dHp / sh) ** 2 + rt * (dCp / sc) * (dHp / sh));
}

// Machado, Oliveira and Fernandes (2009), severity 1.0, applied in linear RGB.
const DICHROMACY = {
  protanopia: [
    [0.152286, 1.052583, -0.204868],
    [0.114503, 0.786281, 0.099216],
    [-0.003882, -0.048116, 1.051998],
  ],
  deuteranopia: [
    [0.367322, 0.860646, -0.227968],
    [0.280085, 0.672501, 0.047413],
    [-0.01182, 0.04294, 0.968881],
  ],
  tritanopia: [
    [1.255528, -0.076749, -0.178779],
    [-0.078411, 0.930809, 0.147602],
    [0.004733, 0.691367, 0.3039],
  ],
};

export const CVD_KINDS = [...Object.keys(DICHROMACY), "achromatopsia"];

export function simulateCvd(color, kind) {
  const { r, g, b, a } = parseColor(color);
  const linear = [r, g, b].map(toLinear);
  let out;
  if (kind === "achromatopsia") {
    const y = 0.2126 * linear[0] + 0.7152 * linear[1] + 0.0722 * linear[2];
    out = [y, y, y];
  } else if (DICHROMACY[kind]) {
    out = DICHROMACY[kind].map((row) => row[0] * linear[0] + row[1] * linear[1] + row[2] * linear[2]);
  } else {
    throw new Error(`unknown CVD kind: ${kind}`);
  }
  const [sr, sg, sb] = out.map((c) => fromLinear(Math.min(1, Math.max(0, c))));
  return { r: sr, g: sg, b: sb, a };
}

// Smallest CIEDE2000 distance between any two colours, as seen with normal vision or one
// simulated deficiency.
export function minPairwiseDistance(colors, kind = "normal") {
  const view = (c) => toLab(kind === "normal" ? parseColor(c) : simulateCvd(c, kind));
  const labs = colors.map(view);
  let best = { distance: Number.POSITIVE_INFINITY, pair: [] };
  for (let i = 0; i < colors.length; i += 1) {
    for (let j = i + 1; j < colors.length; j += 1) {
      const distance = deltaE2000(labs[i], labs[j]);
      if (distance < best.distance) best = { distance, pair: [colors[i], colors[j]] };
    }
  }
  return best;
}

// OKLab and OKLCH (Ottosson, 2020), from and to sRGB. Hue in degrees.
export function toOklch(color) {
  const { r, g, b } = parseColor(color);
  const [lr, lg, lb] = [r, g, b].map(toLinear);
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  const hue = (Math.atan2(B, A) * 180) / Math.PI;
  return [L, Math.hypot(A, B), hue < 0 ? hue + 360 : hue];
}

// Linear-light sRGB channels of an OKLCH colour, unclamped, so callers can test the gamut.
function oklchToLinear([L, C, H]) {
  const A = C * Math.cos((H * Math.PI) / 180);
  const B = C * Math.sin((H * Math.PI) / 180);
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const GAMUT_EPSILON = 1e-7;
export const inSrgbGamut = (lch) => oklchToLinear(lch).every((c) => c >= -GAMUT_EPSILON && c <= 1 + GAMUT_EPSILON);

export function oklchToHex(lch) {
  const [r, g, b] = oklchToLinear(lch).map((c) => fromLinear(Math.min(1, Math.max(0, c))));
  return toHex({ r, g, b });
}

// Largest chroma at this lightness and hue that sRGB can display (bisection).
export function maxChroma(L, H) {
  let low = 0;
  let high = 0.5;
  for (let i = 0; i < 40; i += 1) {
    const mid = (low + high) / 2;
    if (inSrgbGamut([L, mid, H])) low = mid;
    else high = mid;
  }
  return low;
}
