// Eleven-step colour scales (50 to 950) derived from one anchor token in OKLCH.
//
// Algorithm, identical for every scale:
// 1. The anchor is step 500 and is emitted as the token's own hex, so the scale can never
//    drift from the token it is built on.
// 2. Hue is the anchor's OKLCH hue, fixed for every step.
// 3. Lightness: lighter steps move from the anchor towards L_TOP by the LIGHTER weights,
//    darker steps towards half the anchor's lightness by the DARKER weights.
// 4. Chroma: lighter steps fade from the anchor's chroma towards CHROMA_FLOOR times it by
//    the same LIGHTER weights; darker steps scale it with lightness (l / anchor l), keeping
//    the anchor's saturation. A step whose chroma sRGB cannot show at its lightness and hue
//    is clipped to the largest chroma that fits (hue and lightness kept); clipped steps are
//    reported by the `clipped` flag.
// 5. Each step is rounded to 8-bit sRGB hex.
import { maxChroma, oklchToHex, toOklch } from "./color-math.mjs";

export const STEPS = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950];
export const ANCHOR_STEP = 500;
export const L_TOP = 0.97;
export const LIGHTER = { 50: 1, 100: 0.92, 200: 0.8, 300: 0.62, 400: 0.4 };
export const CHROMA_FLOOR = 0.1;
export const DARKER = { 600: 0.2, 700: 0.4, 800: 0.6, 900: 0.8, 950: 1 };

export function deriveScale(anchorHex) {
  const [l0, c0, hue] = toOklch(anchorHex);
  const bottom = l0 / 2;
  return STEPS.map((step) => {
    if (step === ANCHOR_STEP) return { step, hex: anchorHex.toLowerCase(), l: l0, c: c0, h: hue, clipped: false };
    const lighter = step in LIGHTER;
    const l = lighter ? l0 + (L_TOP - l0) * LIGHTER[step] : l0 - (l0 - bottom) * DARKER[step];
    const wanted = lighter ? c0 * (1 - (1 - CHROMA_FLOOR) * LIGHTER[step]) : (c0 * l) / l0;
    const limit = maxChroma(l, hue);
    const c = Math.min(wanted, limit);
    return { step, hex: oklchToHex([l, c, hue]), l, c, h: hue, clipped: wanted > limit };
  });
}
