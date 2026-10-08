/**
 * Shared skin JSON parsing and formatting for the skin creator.
 */

export type ColorState = {
  maleColor: string;
  highColor: string;
  midColor: string;
  mid2Color: string;
  lowColor: string;
  bottomColor: string;
  eyeColor: string;
};

export type GlitchState = Partial<Record<keyof ColorState, string>>;

export const COLOR_TO_JSON_KEY: Record<keyof ColorState, string> = {
  maleColor: 'md',
  highColor: 'f',
  midColor: 'm',
  mid2Color: 'd1',
  lowColor: 'b',
  bottomColor: 'u',
  eyeColor: 'e',
};

export const JSON_KEY_TO_COLOR: Record<string, keyof ColorState> = {
  md: 'maleColor',
  f: 'highColor',
  m: 'midColor',
  d1: 'mid2Color',
  b: 'lowColor',
  u: 'bottomColor',
  e: 'eyeColor',
};

export function parseXYZ(xyzStr: string): { X: number; Y: number; Z: number } {
  const matches = xyzStr.match(/X=([-\d.]+),Y=([-\d.]+),Z=([-\d.]+)/);
  if (!matches) return { X: 0, Y: 0, Z: 0 };
  return {
    X: parseFloat(matches[1]),
    Y: parseFloat(matches[2]),
    Z: parseFloat(matches[3])
  };
}

export function isGlitchValue(xyzStr: string): boolean {
  const { X, Y, Z } = parseXYZ(xyzStr);
  return X < 0 || X > 1 || Y < 0 || Y > 1 || Z < 0 || Z > 1;
}

export function xyzToHex(xyzStr: string): string {
  const { X, Y, Z } = parseXYZ(xyzStr);
  const r = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, X)) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, Y)) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, Z)) * 255)));
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

export function hexToXYZ(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const safeValue = (v: number) => v === 0 ? 0.0001 : v;
  return `X=${safeValue(r)},Y=${safeValue(g)},Z=${safeValue(b)}`;
}

// Replace any exact-zero component in an XYZ glitch string with 0.0001.
// The Isle's material does not handle a literal 0 in any color channel -
// the test/save would silently fall back to default colors. Negatives and
// HDR (>1) values are intentional glitch effects, so we leave those alone.
// Used for the glitch-input path which would otherwise pipe raw 0s through.
export function sanitizeGlitchXYZ(xyzStr: string): string {
  const { X, Y, Z } = parseXYZ(xyzStr);
  const safe = (v: number) => v === 0 ? 0.0001 : v;
  return `X=${safe(X)},Y=${safe(Y)},Z=${safe(Z)}`;
}

export function parseSkinJson(jsonStr: string): {
  colors: ColorState;
  glitchValues: GlitchState;
  pattern: number;
  marks: boolean;
} {
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
    let decodeCount = 0;
    while (typeof data === 'string' && decodeCount < 5) {
      data = JSON.parse(data);
      decodeCount++;
    }
  } catch {
    return {
      colors: {
        maleColor: '#FFFFFF',
        highColor: '#FFFFFF',
        midColor: '#FFFFFF',
        mid2Color: '#FFFFFF',
        lowColor: '#FFFFFF',
        bottomColor: '#FFFFFF',
        eyeColor: '#FFFFFF',
      },
      glitchValues: {},
      pattern: 1,
      marks: false
    };
  }

  const obj = data as Record<string, unknown>;
  const colors: ColorState = {
    maleColor: '#FFFFFF',
    highColor: '#FFFFFF',
    midColor: '#FFFFFF',
    mid2Color: '#FFFFFF',
    lowColor: '#FFFFFF',
    bottomColor: '#FFFFFF',
    eyeColor: '#FFFFFF',
  };
  const glitchValues: GlitchState = {};

  for (const [jsonKey, colorKey] of Object.entries(JSON_KEY_TO_COLOR)) {
    const value = obj[jsonKey];
    if (value && typeof value === 'string') {
      if (isGlitchValue(value)) {
        glitchValues[colorKey] = value;
        colors[colorKey] = '#808080';
      } else {
        colors[colorKey] = xyzToHex(value);
      }
    }
  }

  return {
    colors,
    glitchValues,
    pattern: parseInt(String(obj.pi)) || 1,
    marks: obj.sv === '1'
  };
}

/**
 * Pattern Bleed detection. A value has pattern bleed when one channel is
 * "super negative" (8+ digit magnitude) while the other two are much closer
 * to zero. The super-negative channel shoves the remaining two channels'
 * colors out onto adjacent layers using the juvenile pattern.
 *
 * Returns null if no pattern bleed, otherwise returns bleed parameters.
 */
export interface PatternBleedInfo {
  bleedColor: [number, number, number];
  erosionPx: number;
}

// Minimum absolute value for a channel to be considered "super-negative" (bleed source).
// Empirically: pattern just begins to show at ≈ 2^24 (16,777,216), which maps to
// maximum erosion (erosionPx ≈ 3). Full pattern shows at ≈ 2^27 (134,217,728) = erosionPx 0.
const BLEED_SUPER_NEG_THRESHOLD = 2 ** 24; // 16,777,216

export function getPatternBleedInfo(xyzStr: string): PatternBleedInfo | null {
  const { X, Y, Z } = parseXYZ(xyzStr);
  const vals = [X, Y, Z];
  const absVals = vals.map(v => Math.abs(v));

  const maxAbs = Math.max(...absVals);
  if (maxAbs < BLEED_SUPER_NEG_THRESHOLD) return null;

  const maxIdx = absVals.indexOf(maxAbs);
  if (vals[maxIdx] >= 0) return null; // must be negative

  // If multiple channels are super-negative, all must not be (that would leave no bleed color)
  const superNegCount = absVals.filter(v => v >= BLEED_SUPER_NEG_THRESHOLD).length;
  if (superNegCount === 3) return null;

  // Continuous erosion formula derived from empirical data:
  //   erosionPx = 27 - log2(maxAbs)
  //   2^24 → erosionPx = 3  (barely shows - maximum erosion)
  //   2^25 → erosionPx = 2
  //   2^26 → erosionPx = 1
  //   2^27 → erosionPx = 0  (fully shows - no erosion)
  const erosionPx = Math.max(0, 27 - Math.log2(maxAbs));

  // Non-super-negative channels define the bleed color via their actual value:
  //   positive  → that amount of that channel (e.g. Y=1 → G=1.0, Y=0.5 → G=0.5)
  //   zero/neg  → 0 (e.g. Y=-1 → G=0, Y=0 → G=0)
  // This matches the shader: baseColor = max(zoneColor, 0.0001)
  const bleedColor: [number, number, number] = [0, 0, 0];
  for (let i = 0; i < 3; i++) {
    if (absVals[i] < BLEED_SUPER_NEG_THRESHOLD) {
      bleedColor[i] = Math.max(0, vals[i]);
    }
  }

  return { bleedColor, erosionPx };
}

/**
 * Map from color key to the shader uniform index (1-6) for zone matching.
 * This determines which zone in the pattern texture this color layer maps to.
 */
export const COLOR_KEY_TO_ZONE_INDEX: Record<string, number> = {
  maleColor: 1,   // Red zone
  bottomColor: 2, // Green zone
  highColor: 3,   // Blue zone
  lowColor: 4,    // Cyan zone
  midColor: 5,    // Magenta zone
  mid2Color: 6,   // Yellow zone
};

export function formatSkinDataForSave(
  colors: ColorState,
  pattern: number,
  marks: boolean,
  glitchValues: GlitchState
): string {
  const skinData: Record<string, string> = {
    pi: pattern.toString(),
    sv: marks ? '1' : '0'
  };
  for (const [colorKey, jsonKey] of Object.entries(COLOR_TO_JSON_KEY)) {
    const key = colorKey as keyof ColorState;
    if (glitchValues[key]) {
      skinData[jsonKey] = sanitizeGlitchXYZ(glitchValues[key]!);
    } else {
      skinData[jsonKey] = hexToXYZ(colors[key]);
    }
  }
  return JSON.stringify(skinData);
}
