'use client';

// ─────────────────────────────────────────────────────────────────────────────
// Primal Heaven Skin Creator — PUBLIC PORTFOLIO DEMO
//
// Ported from the live primal_web2 editor. All backend / auth / commerce has
// been stripped: there is no login, no Primal Points, no Patreon gating, and no
// server. Saved skins live in localStorage. Import/export and shareable encoded
// codes work fully client-side. The full 3D viewer, region-color shader baking,
// pattern bleed / glitch handling, and lighting controls are kept intact.
// ─────────────────────────────────────────────────────────────────────────────

import React, { Suspense, useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Canvas, useLoader, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Environment } from '@react-three/drei';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as cloneSkinnedScene } from 'three/examples/jsm/utils/SkeletonUtils.js';
import * as THREE from 'three';
import { TextureLoader } from 'three';
import { DINOSAURS } from '@/types/dinosaurs';
import { isEncryptedSkin, decryptSkin, encryptSkin } from '@/lib/skinCrypto';
import {
  dinoSkinVertexShader,
  dinoSkinFragmentShader,
  createDinoSkinUniforms,
  hexToLinearRGB,
} from '@/lib/dinoSkinShader';
import { getPatternBleedInfo, COLOR_KEY_TO_ZONE_INDEX } from '@/lib/skin-utils';

// Types
type ColorState = {
  maleColor: string;
  highColor: string;
  midColor: string;
  mid2Color: string;
  lowColor: string;
  bottomColor: string;
  eyeColor: string;
};

// Glitch values stored as raw XYZ strings
type GlitchState = Partial<Record<keyof ColorState, string>>;

type ColorPickerItem = {
  label: string;
  key: keyof ColorState;
};

const colorPickers: ColorPickerItem[] = [
  { label: 'Male Color', key: 'maleColor' },
  { label: 'High Color', key: 'highColor' },
  { label: 'Mid Color', key: 'midColor' },
  { label: 'Mid 2 Color', key: 'mid2Color' },
  { label: 'Low Color', key: 'lowColor' },
  { label: 'Bottom Color', key: 'bottomColor' },
  { label: 'Eye Color', key: 'eyeColor' },
];

// Mapping from color keys to skin JSON keys
const COLOR_TO_JSON_KEY: Record<keyof ColorState, string> = {
  maleColor: 'md',
  highColor: 'f',
  midColor: 'm',
  mid2Color: 'd1',
  lowColor: 'b',
  bottomColor: 'u',
  eyeColor: 'e',
};

const JSON_KEY_TO_COLOR: Record<string, keyof ColorState> = {
  md: 'maleColor',
  f: 'highColor',
  m: 'midColor',
  d1: 'mid2Color',
  b: 'lowColor',
  u: 'bottomColor',
  e: 'eyeColor',
};

// Parse XYZ string to numbers
function parseXYZ(xyzStr: string): { X: number; Y: number; Z: number } {
  const matches = xyzStr.match(/X=([-\d.]+),Y=([-\d.]+),Z=([-\d.]+)/);
  if (!matches) {
    return { X: 0, Y: 0, Z: 0 };
  }
  return {
    X: parseFloat(matches[1]),
    Y: parseFloat(matches[2]),
    Z: parseFloat(matches[3])
  };
}

// Check if XYZ value is outside normal 0-1 range (glitch effect)
function isGlitchValue(xyzStr: string): boolean {
  const { X, Y, Z } = parseXYZ(xyzStr);
  return X < 0 || X > 1 || Y < 0 || Y > 1 || Z < 0 || Z > 1;
}

// Convert XYZ (0-1 range) to hex color
function xyzToHex(xyzStr: string): string {
  const { X, Y, Z } = parseXYZ(xyzStr);

  // Clamp to 0-1 for display purposes
  const r = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, X)) * 255)));
  const g = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, Y)) * 255)));
  const b = Math.min(255, Math.max(0, Math.round(Math.min(1, Math.max(0, Z)) * 255)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Convert hex color to XYZ string
function hexToXYZ(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  // Ensure no value is exactly 0 (game doesn't like 0)
  const safeValue = (v: number) => v === 0 ? 0.0001 : v;
  return `X=${safeValue(r)},Y=${safeValue(g)},Z=${safeValue(b)}`;
}

// Replace any exact-zero component in an XYZ glitch string with 0.0001.
function sanitizeGlitchXYZ(xyzStr: string): string {
  const { X, Y, Z } = parseXYZ(xyzStr);
  const safe = (v: number) => v === 0 ? 0.0001 : v;
  return `X=${safe(X)},Y=${safe(Y)},Z=${safe(Z)}`;
}

// Parse the wire-format `sv` field into a clamped [0,∞) float.
function parseScarsValue(raw: unknown): number {
  if (raw === undefined || raw === null) return 0;
  const n = parseFloat(String(raw));
  if (!isFinite(n)) return 0;
  return Math.max(0, n);
}

// Parse skin JSON (DB / import format)
function parseSkinJson(jsonStr: string): {
  colors: ColorState;
  glitchValues: GlitchState;
  pattern: number;
  marks: number
} {
  let data: unknown;
  try {
    data = JSON.parse(jsonStr);
    // Handle multiple levels of double-encoded JSON
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
      marks: 0
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

  // Process each color
  for (const [jsonKey, colorKey] of Object.entries(JSON_KEY_TO_COLOR)) {
    const value = obj[jsonKey];
    if (value && typeof value === 'string') {
      if (isGlitchValue(value)) {
        // Store glitch value and show neutral color in picker
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
    marks: parseScarsValue(obj.sv)
  };
}

// Format skin data for export / save
function formatSkinDataForSave(
  colors: ColorState,
  pattern: number,
  marks: number,
  glitchValues: GlitchState
): string {
  const sv = Math.max(0, isFinite(marks) ? marks : 0);
  const skinData: Record<string, string> = {
    pi: pattern.toString(),
    sv: sv.toString()
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

// Color key -> UE4 Color layer mapping
const COLOR_KEY_TO_UNIFORM: Record<string, string> = {
  maleColor: 'uColor1',   // Red layer
  bottomColor: 'uColor2', // Green layer
  highColor: 'uColor3',   // Blue layer
  lowColor: 'uColor4',    // Cyan layer
  midColor: 'uColor5',    // Magenta layer
  mid2Color: 'uColor6',   // Yellow layer
};

const ZONE_INDEX_TO_BLEED_UNIFORM: Record<number, string> = {
  1: 'uBleed1',
  2: 'uBleed2',
  3: 'uBleed3',
  4: 'uBleed4',
  5: 'uBleed5',
  6: 'uBleed6',
};

// Reference colors in the pattern texture (zone identification)
const ZONE_REFERENCE_COLORS: Record<keyof Omit<ColorState, 'eyeColor'>, { r: number; g: number; b: number }> = {
  maleColor:   { r: 255, g: 0,   b: 0   },
  bottomColor: { r: 0,   g: 255, b: 0   },
  highColor:   { r: 0,   g: 1,   b: 245 },
  lowColor:    { r: 0,   g: 255, b: 241 },
  midColor:    { r: 255, g: 0,   b: 255 },
  mid2Color:   { r: 255, g: 255, b: 0   },
};

// Resolve all colors to proper hex, matching the custom shader's handling.
function getDisplayColors(colors: ColorState, glitchValues: GlitchState): ColorState {
  const result = { ...colors };
  for (const [colorKey, glitchStr] of Object.entries(glitchValues)) {
    if (!glitchStr) continue;
    const toHex = (r: number, g: number, b: number) =>
      `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    const bleedInfo = getPatternBleedInfo(glitchStr);
    if (bleedInfo) {
      const r = Math.round(bleedInfo.bleedColor[0] * 255);
      const g = Math.round(bleedInfo.bleedColor[1] * 255);
      const b = Math.round(bleedInfo.bleedColor[2] * 255);
      result[colorKey as keyof ColorState] = toHex(r, g, b);
    } else {
      const { X, Y, Z } = parseXYZ(glitchStr);
      const maxVal = Math.max(X, Y, Z, 1.0);
      result[colorKey as keyof ColorState] = toHex(
        Math.min(255, Math.max(0, Math.round((X / maxVal) * 255))),
        Math.min(255, Math.max(0, Math.round((Y / maxVal) * 255))),
        Math.min(255, Math.max(0, Math.round((Z / maxVal) * 255))),
      );
    }
  }
  return result;
}

// Bake base + detail normal maps into a single texture.
function bakeNormalMap(baseTexture: THREE.Texture, detailTexture: THREE.Texture, detailScale = 12, flipY = true): THREE.Texture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  const baseImg = baseTexture.image as HTMLImageElement;
  const W = baseImg.width, H = baseImg.height;
  canvas.width = W; canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(baseImg, 0, 0);
  const baseData = ctx.getImageData(0, 0, W, H).data;

  const detailImg = detailTexture.image as HTMLImageElement;
  const dW = detailImg.width, dH = detailImg.height;
  const dCanvas = document.createElement('canvas');
  dCanvas.width = dW; dCanvas.height = dH;
  const dCtx = dCanvas.getContext('2d')!;
  dCtx.imageSmoothingEnabled = false;
  dCtx.drawImage(detailImg, 0, 0);
  const detailData = dCtx.getImageData(0, 0, dW, dH).data;

  const out = new Uint8ClampedArray(W * H * 4);
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const bi = (y * W + x) * 4;
      const bx = (baseData[bi]     / 255) * 2 - 1;
      const by = (baseData[bi + 1] / 255) * 2 - 1;
      const bz = (baseData[bi + 2] / 255) * 2 - 1;

      const dx = Math.floor(((x / W) * detailScale % 1 + 1) % 1 * dW);
      const dy = Math.floor(((y / H) * detailScale % 1 + 1) % 1 * dH);
      const di = (dy * dW + dx) * 4;
      const dnx = (detailData[di]     / 255) * 2 - 1;
      const dny = (detailData[di + 1] / 255) * 2 - 1;

      const rx = bx + dnx, ry = by + dny, rz = bz;
      const len = Math.sqrt(rx * rx + ry * ry + rz * rz) || 1;
      out[bi]     = Math.round(((rx / len) * 0.5 + 0.5) * 255);
      out[bi + 1] = Math.round(((ry / len) * 0.5 + 0.5) * 255);
      out[bi + 2] = Math.round(((rz / len) * 0.5 + 0.5) * 255);
      out[bi + 3] = 255;
    }
  }
  ctx.putImageData(new ImageData(out, W, H), 0, 0);
  const newTex = new THREE.Texture(canvas);
  newTex.minFilter = THREE.LinearMipmapLinearFilter;
  newTex.magFilter = THREE.LinearFilter;
  newTex.anisotropy = baseTexture.anisotropy;
  newTex.generateMipmaps = true;
  newTex.flipY = flipY;
  newTex.needsUpdate = true;
  return newTex;
}

// Multiply the RAC map's AO (green) + cavity (blue) channels into the baked albedo.
function bakeAOIntoAlbedo(albedoTexture: THREE.Texture, racTexture: THREE.Texture, strength = 0.85): THREE.Texture {
  const src = albedoTexture.image as HTMLCanvasElement;
  const W = src.width, H = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, W, H);
  const albedo = ctx.getImageData(0, 0, W, H);
  const aData = albedo.data;

  const racImg = racTexture.image as HTMLImageElement;
  const rCanvas = document.createElement('canvas');
  rCanvas.width = W; rCanvas.height = H;
  const rCtx = rCanvas.getContext('2d')!;
  rCtx.imageSmoothingEnabled = false;
  rCtx.drawImage(racImg, 0, 0, W, H);
  const rData = rCtx.getImageData(0, 0, W, H).data;

  for (let i = 0; i < aData.length; i += 4) {
    const ao = rData[i + 1] / 255;   // green channel = ambient occlusion
    const cav = rData[i + 2] / 255;  // blue channel  = cavity
    const factor = 1 - strength * (1 - ao * cav);
    aData[i]     = Math.round(aData[i]     * factor);
    aData[i + 1] = Math.round(aData[i + 1] * factor);
    aData[i + 2] = Math.round(aData[i + 2] * factor);
  }
  ctx.putImageData(albedo, 0, 0);

  const tex = new THREE.Texture(canvas);
  tex.colorSpace = albedoTexture.colorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = albedoTexture.anisotropy;
  tex.generateMipmaps = true;
  tex.flipY = albedoTexture.flipY;
  tex.needsUpdate = true;
  return tex;
}

// Skin-noise overlay (sv): a global noise mask multiplied over everything.
function bakeNoiseOverlay(albedoTexture: THREE.Texture, noiseTexture: THREE.Texture, color: string, strength: number, scale: number, blur: number): THREE.Texture {
  if (strength <= 0) return albedoTexture;
  const src = albedoTexture.image as HTMLCanvasElement;
  const W = src.width, H = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, W, H);
  const albedo = ctx.getImageData(0, 0, W, H);
  const aData = albedo.data;

  const noiseImg = noiseTexture.image as HTMLImageElement;
  const s = Math.max(0.0001, scale);
  const tileW = W / s, tileH = H / s;
  const nCanvas = document.createElement('canvas');
  nCanvas.width = W; nCanvas.height = H;
  const nCtx = nCanvas.getContext('2d')!;
  nCtx.imageSmoothingEnabled = true;
  nCtx.imageSmoothingQuality = 'high';
  for (let ty = -tileH; ty < H; ty += tileH) {
    for (let tx = -tileW; tx < W; tx += tileW) {
      nCtx.drawImage(noiseImg, tx, ty, tileW, tileH);
    }
  }
  let noiseSrc: HTMLCanvasElement = nCanvas;
  if (blur > 0) {
    const bCanvas = document.createElement('canvas');
    bCanvas.width = W; bCanvas.height = H;
    const bCtx = bCanvas.getContext('2d')!;
    bCtx.filter = `blur(${blur}px)`;
    bCtx.drawImage(nCanvas, 0, 0);
    noiseSrc = bCanvas;
  }
  const nData = noiseSrc.getContext('2d')!.getImageData(0, 0, W, H).data;

  void color;
  for (let i = 0; i < aData.length; i += 4) {
    const n = nData[i] / 255;
    const f = 1 - strength * (1 - n);
    aData[i]     = Math.round(aData[i]     * f);
    aData[i + 1] = Math.round(aData[i + 1] * f);
    aData[i + 2] = Math.round(aData[i + 2] * f);
  }
  ctx.putImageData(albedo, 0, 0);

  const tex = new THREE.Texture(canvas);
  tex.colorSpace = albedoTexture.colorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = albedoTexture.anisotropy;
  tex.generateMipmaps = true;
  tex.flipY = albedoTexture.flipY;
  tex.needsUpdate = true;
  return tex;
}

// An overlay-mask channel: a flat color composited where the mask channel is lit.
type OverlayChannel = { color: string; alpha: number };

// Composite the overlay mask's R/G/B channels on top of the baked albedo.
function bakeOverlayMask(albedoTexture: THREE.Texture, maskTexture: THREE.Texture, channels: OverlayChannel[]): THREE.Texture {
  const src = albedoTexture.image as HTMLCanvasElement;
  const W = src.width, H = src.height;
  const canvas = document.createElement('canvas');
  canvas.width = W; canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(src, 0, 0, W, H);
  const albedo = ctx.getImageData(0, 0, W, H);
  const aData = albedo.data;

  const maskImg = maskTexture.image as HTMLImageElement;
  const mCanvas = document.createElement('canvas');
  mCanvas.width = W; mCanvas.height = H;
  const mCtx = mCanvas.getContext('2d')!;
  mCtx.imageSmoothingEnabled = false;
  mCtx.drawImage(maskImg, 0, 0, W, H);
  const mData = mCtx.getImageData(0, 0, W, H).data;

  const cols = channels.map((c) => {
    const hex = c.color.replace('#', '');
    return [parseInt(hex.slice(0, 2), 16), parseInt(hex.slice(2, 4), 16), parseInt(hex.slice(4, 6), 16), c.alpha] as const;
  });

  for (let i = 0; i < aData.length; i += 4) {
    for (let ch = 0; ch < 3; ch++) {
      const [cr, cg, cb, alpha] = cols[ch];
      if (alpha <= 0) continue;
      const cov = (mData[i + ch] / 255) * alpha;
      if (cov <= 0) continue;
      aData[i]     = Math.round(aData[i]     * (1 - cov) + cr * cov);
      aData[i + 1] = Math.round(aData[i + 1] * (1 - cov) + cg * cov);
      aData[i + 2] = Math.round(aData[i + 2] * (1 - cov) + cb * cov);
    }
  }
  ctx.putImageData(albedo, 0, 0);

  const tex = new THREE.Texture(canvas);
  tex.colorSpace = albedoTexture.colorSpace;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.anisotropy = albedoTexture.anisotropy;
  tex.generateMipmaps = true;
  tex.flipY = albedoTexture.flipY;
  tex.needsUpdate = true;
  return tex;
}

const LINE_BLEED_RATIO = 10;
const LINE_BLEED_MAX = 99999;

function computeLineBleed(X: number, Y: number, Z: number): { color: [number, number, number]; radius: number } | null {
  const ax = Math.abs(X), ay = Math.abs(Y), az = Math.abs(Z);
  const sorted = [ax, ay, az].sort((a, b) => b - a);
  const maxAbs = sorted[0], secondAbs = sorted[1];
  if (maxAbs <= 1) return null;
  if (maxAbs / Math.max(secondAbs, 1) < LINE_BLEED_RATIO) return null;
  const nx = X < 0 ? ax : 0;
  const ny = Y < 0 ? ay : 0;
  const nz = Z < 0 ? az : 0;
  const maxNeg = Math.max(nx, ny, nz);
  if (maxNeg === 0) return null;
  if (maxNeg > LINE_BLEED_MAX) return null;
  return {
    color: [1 - nx / maxNeg, 1 - ny / maxNeg, 1 - nz / maxNeg],
    radius: 1,
  };
}

type GlitchTuning = { bleedReach: number; juviErosion: number; darkBleed: number; juviOpacity: number; juviTint: string };
const DEFAULT_GLITCH_TUNING: GlitchTuning = { bleedReach: 0.5, juviErosion: 0, darkBleed: 0, juviOpacity: 1, juviTint: '#ffffff' };

// Bake skin colors into the pattern texture pixels (three-layer blending order).
function modifyTextureColors(
  texture: THREE.Texture,
  colors: ColorState,
  glitchValues: GlitchState = {},
  flipY = true,
  brightness = 0.55,
  juvenileTexture?: THREE.Texture,
  tuning: GlitchTuning = DEFAULT_GLITCH_TUNING,
): THREE.Texture {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Failed to get 2D context');
  const img = texture.image as HTMLImageElement;
  canvas.width = img.width;
  canvas.height = img.height;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(img, 0, 0);
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;
  const W = canvas.width, H = canvas.height;

  const ZONE_THRESHOLD = 0.42;
  const ZONE_THRESHOLD_OVERRIDES: Partial<Record<string, number>> = { midColor: 0.44 };

  type BleedEntry = { bleedR: number; bleedG: number; bleedB: number; compR: number; compG: number; compB: number; erosionPx: number; expandRadius: number };
  const BLEED_SUPER_NEG = 2 ** 24;
  const zoneIndexBleedMap = new Map<number, BleedEntry>();
  for (const [colorKey, glitchStr] of Object.entries(glitchValues)) {
    if (!glitchStr) continue;
    const bleedInfo = getPatternBleedInfo(glitchStr);
    if (!bleedInfo) continue;
    const zoneIdx = COLOR_KEY_TO_ZONE_INDEX[colorKey];
    if (!zoneIdx) continue;
    const { X, Y, Z } = parseXYZ(glitchStr);
    const isSuperNeg = (v: number) => v < 0 && Math.abs(v) >= BLEED_SUPER_NEG;
    const compR = isSuperNeg(X) ? 0 : 255;
    const compG = isSuperNeg(Y) ? 0 : 255;
    const compB = isSuperNeg(Z) ? 0 : 255;
    const expandRadius = Math.max(0, Math.round(2 - bleedInfo.erosionPx));
    zoneIndexBleedMap.set(zoneIdx, {
      bleedR: Math.round(bleedInfo.bleedColor[0] * 255),
      bleedG: Math.round(bleedInfo.bleedColor[1] * 255),
      bleedB: Math.round(bleedInfo.bleedColor[2] * 255),
      compR, compG, compB,
      erosionPx: bleedInfo.erosionPx,
      expandRadius,
    });
  }

  const adultKeyBleedMap = new Map<string, BleedEntry>();
  for (const [colorKey, glitchStr] of Object.entries(glitchValues)) {
    if (!glitchStr) continue;
    const bleedInfo = getPatternBleedInfo(glitchStr);
    if (!bleedInfo) continue;
    const zoneIdx = COLOR_KEY_TO_ZONE_INDEX[colorKey];
    if (!zoneIdx) continue;
    adultKeyBleedMap.set(colorKey, zoneIndexBleedMap.get(zoneIdx)!);
  }

  type LineBleedEntry = { r: number; g: number; b: number; radius: number };
  const lineBleedZoneMap = new Map<string, LineBleedEntry>();
  for (const [colorKey, glitchStr] of Object.entries(glitchValues)) {
    if (!glitchStr) continue;
    const { X, Y, Z } = parseXYZ(glitchStr);
    const lb = computeLineBleed(X, Y, Z);
    if (!lb) continue;
    lineBleedZoneMap.set(colorKey, {
      r: Math.round(lb.color[0] * 255),
      g: Math.round(lb.color[1] * 255),
      b: Math.round(lb.color[2] * 255),
      radius: Math.floor(lb.radius),
    });
  }

  const hasBleedZones = zoneIndexBleedMap.size > 0 || lineBleedZoneMap.size > 0;

  const ZONE_REF_BY_INDEX: Array<{ r: number; g: number; b: number }> = [
    { r: 255, g: 0,   b: 0   }, // 1 Red
    { r: 0,   g: 255, b: 0   }, // 2 Green
    { r: 0,   g: 1,   b: 245 }, // 3 Blue
    { r: 0,   g: 255, b: 241 }, // 4 Cyan
    { r: 255, g: 0,   b: 255 }, // 5 Magenta
    { r: 255, g: 255, b: 0   }, // 6 Yellow
  ];

  let juvData: Uint8ClampedArray | null = null;
  let juvW = W, juvH = H;
  if (hasBleedZones && juvenileTexture) {
    const juvImg = juvenileTexture.image as HTMLImageElement;
    if (juvImg && juvImg.width > 0) {
      const jc = document.createElement('canvas');
      juvW = juvImg.width; juvH = juvImg.height;
      jc.width = juvW; jc.height = juvH;
      const jctx = jc.getContext('2d')!;
      jctx.imageSmoothingEnabled = false;
      jctx.drawImage(juvImg, 0, 0);
      juvData = jctx.getImageData(0, 0, juvW, juvH).data;
    }
  }

  function matchZone(pr: number, pg: number, pb: number): { zoneIdx: number; dist: number } {
    let minDist = Infinity, bestIdx = 0;
    for (let z = 0; z < 6; z++) {
      const ref = ZONE_REF_BY_INDEX[z];
      const dr = pr / 255 - ref.r / 255;
      const dg = pg / 255 - ref.g / 255;
      const db = pb / 255 - ref.b / 255;
      const d = dr*dr + dg*dg + db*db;
      if (d < minDist) { minDist = d; bestIdx = z + 1; }
    }
    return { zoneIdx: minDist <= ZONE_THRESHOLD ? bestIdx : 0, dist: minDist };
  }

  const bleedSourceMask = hasBleedZones ? new Uint8Array(W * H) : null;
  const bleedEntryPerPixel = hasBleedZones ? new Array<BleedEntry | null>(W * H).fill(null) : null;
  const lineBleedMask = lineBleedZoneMap.size > 0 ? new Uint8Array(W * H) : null;
  const lineBleedPerPixel = lineBleedZoneMap.size > 0 ? new Array<LineBleedEntry | null>(W * H).fill(null) : null;

  // ── Pass 1: Adult zone base colors ──
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const pixelIdx = y * W + x;
      const i = pixelIdx * 4;
      const pr = data[i], pg = data[i + 1], pb = data[i + 2];
      let minDist = Infinity, bestKey = '';
      for (const [key, ref] of Object.entries(ZONE_REFERENCE_COLORS)) {
        const dr = pr / 255 - ref.r / 255, dg = pg / 255 - ref.g / 255, db = pb / 255 - ref.b / 255;
        const d = dr*dr + dg*dg + db*db;
        if (d < minDist) { minDist = d; bestKey = key; }
      }
      const zoneThresh = ZONE_THRESHOLD_OVERRIDES[bestKey] ?? ZONE_THRESHOLD;
      if (minDist <= zoneThresh && bestKey) {
        const bleedEntry = adultKeyBleedMap.get(bestKey);
        if (bleedEntry) {
          const hex = colors[bestKey as keyof ColorState];
          data[i]     = Math.round(parseInt(hex.slice(1, 3), 16) * brightness);
          data[i + 1] = Math.round(parseInt(hex.slice(3, 5), 16) * brightness);
          data[i + 2] = Math.round(parseInt(hex.slice(5, 7), 16) * brightness);
          data[i + 3] = 255;
          bleedSourceMask![pixelIdx] = 1;
          bleedEntryPerPixel![pixelIdx] = bleedEntry;
        } else {
          const hex = colors[bestKey as keyof ColorState];
          data[i]     = Math.round(parseInt(hex.slice(1, 3), 16) * brightness);
          data[i + 1] = Math.round(parseInt(hex.slice(3, 5), 16) * brightness);
          data[i + 2] = Math.round(parseInt(hex.slice(5, 7), 16) * brightness);
          data[i + 3] = 255;
        }
        const lbEntry = lineBleedZoneMap.get(bestKey);
        if (lbEntry && lineBleedMask) {
          lineBleedMask[pixelIdx] = 1;
          lineBleedPerPixel![pixelIdx] = lbEntry;
        }
      }
    }
  }

  // ── Pass 2: Line bleed ──
  if (lineBleedMask && lineBleedPerPixel) {
    const DIRS = [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]] as const;
    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const pidx = y * W + x;
        if (!lineBleedMask[pidx]) continue;
        const entry = lineBleedPerPixel[pidx]!;
        const reach = Math.max(0, Math.round(entry.radius * tuning.bleedReach));
        for (const [dx, dy] of DIRS) {
          for (let rad = 1; rad <= reach; rad++) {
            const nx = x + dx * rad, ny = y + dy * rad;
            if (nx < 0 || nx >= W || ny < 0 || ny >= H) continue;
            const nIdx = ny * W + nx;
            if (lineBleedMask[nIdx]) continue;
            const di = nIdx * 4;
            const tv = Math.max(Math.max(data[di], data[di + 1], data[di + 2]) / 255, tuning.darkBleed);
            data[di]     = Math.round(entry.r * tv);
            data[di + 1] = Math.round(entry.g * tv);
            data[di + 2] = Math.round(entry.b * tv);
            data[di + 3] = 255;
          }
        }
      }
    }
  }

  // ── Pass 3: Pattern bleed ──
  if (juvData && hasBleedZones) {
    const tintR = parseInt(tuning.juviTint.slice(1, 3), 16) / 255;
    const tintG = parseInt(tuning.juviTint.slice(3, 5), 16) / 255;
    const tintB = parseInt(tuning.juviTint.slice(5, 7), 16) / 255;
    const jOp = tuning.juviOpacity;

    for (let y = 0; y < H; y++) {
      for (let x = 0; x < W; x++) {
        const jx = Math.floor(x * juvW / W);
        const jy = Math.floor(y * juvH / H);
        const ji = (jy * juvW + jx) * 4;
        const { zoneIdx: jZone } = matchZone(juvData[ji], juvData[ji + 1], juvData[ji + 2]);
        if (jZone === 0) continue;

        const bleed = zoneIndexBleedMap.get(jZone);
        if (!bleed || bleed.erosionPx < 0) continue;

        let isEroded = false;
        const baseEro = bleed.erosionPx >= 1.5 ? bleed.erosionPx : 0;
        const ero = baseEro + tuning.juviErosion;
        if (ero > 0) {
          const ref = ZONE_REF_BY_INDEX[jZone - 1];
          const CARD = [[1,0],[-1,0],[0,1],[0,-1]] as const;
          for (const [dx, dy] of CARD) {
            const ex = Math.floor(jx + dx * ero);
            const ey = Math.floor(jy + dy * ero);
            if (ex < 0 || ex >= juvW || ey < 0 || ey >= juvH) { isEroded = true; break; }
            const ei = (ey * juvW + ex) * 4;
            const dr = juvData[ei] / 255 - ref.r / 255;
            const dg = juvData[ei + 1] / 255 - ref.g / 255;
            const db = juvData[ei + 2] / 255 - ref.b / 255;
            if (dr*dr + dg*dg + db*db > ZONE_THRESHOLD) { isEroded = true; break; }
          }
        }
        if (isEroded) continue;

        const pi = (y * W + x) * 4;
        const mr = 1 - jOp + jOp * (bleed.compR / 255) * tintR;
        const mg = 1 - jOp + jOp * (bleed.compG / 255) * tintG;
        const mb = 1 - jOp + jOp * (bleed.compB / 255) * tintB;
        data[pi]     = Math.round(data[pi]     * mr);
        data[pi + 1] = Math.round(data[pi + 1] * mg);
        data[pi + 2] = Math.round(data[pi + 2] * mb);
        data[pi + 3] = 255;
      }
    }
  }

  ctx.putImageData(imageData, 0, 0);
  const newTex = new THREE.Texture(canvas);
  newTex.colorSpace = texture.colorSpace;
  newTex.minFilter = THREE.LinearMipmapLinearFilter;
  newTex.magFilter = THREE.LinearFilter;
  newTex.anisotropy = texture.anisotropy;
  newTex.generateMipmaps = true;
  newTex.flipY = flipY;
  newTex.needsUpdate = true;
  return newTex;
}

function getColorVec3(
  colorKey: keyof ColorState,
  colors: ColorState,
  glitchValues: GlitchState
): THREE.Vector3 {
  const glitch = glitchValues[colorKey];
  if (glitch) {
    const { X, Y, Z } = parseXYZ(glitch);
    const maxVal = Math.max(X, Y, Z, 1.0);
    return new THREE.Vector3(X / maxVal, Y / maxVal, Z / maxVal);
  }
  const [r, g, b] = hexToLinearRGB(colors[colorKey]);
  return new THREE.Vector3(r, g, b);
}

const GLB_SCALE_CORRECTION = 1;

const DEFAULT_CAMERA_START: [number, number, number] = [-19.33, 0.89, -0.02];

type BgScene = { id: string; label: string; preset?: string; image?: string };
const BG_SCENES: BgScene[] = [
  { id: 'lagoon', label: '🏞️ Waterfall Lagoon', image: '/SkinViewer/backgrounds/lagoon.png' },
  { id: 'jungle', label: '🌴 Jungle Trail', image: '/SkinViewer/backgrounds/jungle.png' },
  { id: 'riverbank', label: '🌅 Twilight Riverbank', image: '/SkinViewer/backgrounds/riverbank.png' },
  { id: 'canyon', label: '🪨 River Canyon', image: '/SkinViewer/backgrounds/canyon.png' },
  { id: 'swamp', label: '🐊 Misty Swamp', image: '/SkinViewer/backgrounds/swamp.png' },
  { id: 'sunset', label: '🌇 Savanna Dusk', preset: 'sunset' },
  { id: 'forest', label: '🌲 Woodland', preset: 'forest' },
  { id: 'night', label: '🌙 Moonlit Night', preset: 'night' },
];

type ModelProps = {
  colors: ColorState;
  glitchValues: GlitchState;
  selectedPattern: number;
  selectedDino: string;
  useDefaultMaterial?: boolean;
  aoStrength?: number;
  overlay?: OverlayChannel[];
  glitchTuning?: GlitchTuning;
  noiseColor?: string;
  noiseStrength?: number;
  noiseScale?: number;
  noiseBlur?: number;
};

function useSkinTextures(selectedDino: string, selectedPattern: number) {
  const dinoData = DINOSAURS[selectedDino];
  const patternTexture = useLoader(TextureLoader, dinoData.patterns[selectedPattern]);
  const normalMap = useLoader(TextureLoader, dinoData.normalMap);
  const hasRAC = !!dinoData.racMap;
  const racMap = useLoader(TextureLoader, dinoData.racMap || dinoData.patterns[selectedPattern]);
  const detailNormalMap = useLoader(TextureLoader, '/SkinViewer/shared/T_DinoSkinDetail_5_N.png');
  const hasJuvenile = !!dinoData.juvenilePattern;
  const juvenileTexture = useLoader(
    TextureLoader,
    dinoData.juvenilePattern || dinoData.patterns[selectedPattern]
  );
  const hasMask = !!dinoData.maskMap;
  const maskMap = useLoader(TextureLoader, dinoData.maskMap || dinoData.patterns[selectedPattern]);
  const noiseMap = useLoader(TextureLoader, '/SkinViewer/shared/T_SkinNoise_M.png');
  return { dinoData, patternTexture, normalMap, hasRAC, racMap, detailNormalMap, hasJuvenile, juvenileTexture, hasMask, maskMap, noiseMap };
}

function useSkinMaterial() {
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  if (!materialRef.current) {
    materialRef.current = new THREE.ShaderMaterial({
      vertexShader: dinoSkinVertexShader,
      fragmentShader: dinoSkinFragmentShader,
      uniforms: createDinoSkinUniforms(),
      lights: false,
    });
  }
  return materialRef.current;
}

function useUpdateSkinUniforms(
  material: THREE.ShaderMaterial,
  textures: ReturnType<typeof useSkinTextures>,
  colors: ColorState,
  glitchValues: GlitchState,
) {
  const { dinoData, patternTexture, normalMap, hasRAC, racMap, detailNormalMap, hasJuvenile, juvenileTexture } = textures;

  useEffect(() => {
    detailNormalMap.wrapS = detailNormalMap.wrapT = THREE.RepeatWrapping;
    material.uniforms.uPatternMap.value = patternTexture;
    material.uniforms.uNormalMap.value = normalMap;
    material.uniforms.uDetailNormalMap.value = detailNormalMap;
    material.uniforms.uDetailScale.value = dinoData.detailScale ?? 12.0;
    material.uniforms.uRACMap.value = hasRAC ? racMap : null;
    material.uniforms.uHasRACMap.value = hasRAC;
    material.uniforms.uJuvenilePatternMap.value = hasJuvenile ? juvenileTexture : null;
    if (patternTexture.image) {
      const w = patternTexture.image.width || 2048;
      const h = patternTexture.image.height || 2048;
      (material.uniforms.uTexelSize.value as THREE.Vector2).set(1.0 / w, 1.0 / h);
    }
    material.uniformsNeedUpdate = true;
  }, [normalMap, detailNormalMap, patternTexture, racMap, hasRAC, dinoData.detailScale, material, hasJuvenile, juvenileTexture]);

  useEffect(() => {
    for (const [colorKey, uniformName] of Object.entries(COLOR_KEY_TO_UNIFORM)) {
      const vec = getColorVec3(colorKey as keyof ColorState, colors, glitchValues);
      (material.uniforms[uniformName].value as THREE.Vector3).copy(vec);
    }
    let hasAnyBleed = false;
    for (let z = 1; z <= 6; z++) {
      const bleedUniform = ZONE_INDEX_TO_BLEED_UNIFORM[z];
      (material.uniforms[bleedUniform].value as THREE.Vector4).set(0, 0, 0, -1);
    }
    if (hasJuvenile) {
      for (const [colorKey, glitchStr] of Object.entries(glitchValues)) {
        if (!glitchStr) continue;
        const zoneIdx = COLOR_KEY_TO_ZONE_INDEX[colorKey];
        if (!zoneIdx) continue;
        const bleedInfo = getPatternBleedInfo(glitchStr);
        if (bleedInfo) {
          const bleedUniform = ZONE_INDEX_TO_BLEED_UNIFORM[zoneIdx];
          (material.uniforms[bleedUniform].value as THREE.Vector4).set(
            bleedInfo.bleedColor[0], bleedInfo.bleedColor[1], bleedInfo.bleedColor[2], bleedInfo.erosionPx
          );
          hasAnyBleed = true;
        }
      }
    }
    material.uniforms.uHasJuvenilePattern.value = hasAnyBleed && hasJuvenile;
    material.uniformsNeedUpdate = true;
  }, [colors, glitchValues, material, hasJuvenile]);
}

// Static OBJ model (no animation)
function StaticModel({ colors, glitchValues, selectedPattern, selectedDino, useDefaultMaterial, aoStrength = 0.85, overlay, glitchTuning = DEFAULT_GLITCH_TUNING, noiseColor = '#000000', noiseStrength = 0, noiseScale = 1, noiseBlur = 0 }: ModelProps) {
  const dinoData = DINOSAURS[selectedDino];
  const obj = useLoader(OBJLoader, dinoData.model);
  const textures = useSkinTextures(selectedDino, selectedPattern);
  const customMaterial = useSkinMaterial();
  useUpdateSkinUniforms(customMaterial, textures, colors, glitchValues);

  const displayColors = useMemo(() => getDisplayColors(colors, glitchValues), [colors, glitchValues]);
  const bakedTexture = useMemo(
    () => modifyTextureColors(textures.patternTexture, displayColors, glitchValues, true, 0.55, textures.hasJuvenile ? textures.juvenileTexture : undefined, glitchTuning),
    [textures.patternTexture, textures.juvenileTexture, textures.hasJuvenile, displayColors, glitchValues, glitchTuning.bleedReach, glitchTuning.juviErosion, glitchTuning.darkBleed, glitchTuning.juviOpacity, glitchTuning.juviTint],
  );
  const bakedTextureAO = useMemo(
    () => (textures.hasRAC && aoStrength > 0 ? bakeAOIntoAlbedo(bakedTexture, textures.racMap, aoStrength) : bakedTexture),
    [bakedTexture, textures.hasRAC, textures.racMap, aoStrength],
  );
  const bakedTextureOverlay = useMemo(
    () => (textures.hasMask && overlay && overlay.some((c) => c.alpha > 0) ? bakeOverlayMask(bakedTextureAO, textures.maskMap, overlay) : bakedTextureAO),
    [bakedTextureAO, textures.hasMask, textures.maskMap, overlay],
  );
  const bakedTextureFinal = useMemo(
    () => bakeNoiseOverlay(bakedTextureOverlay, textures.noiseMap, noiseColor, noiseStrength, noiseScale, noiseBlur),
    [bakedTextureOverlay, textures.noiseMap, noiseColor, noiseStrength, noiseScale, noiseBlur],
  );
  const bakedNormalMap = useMemo(
    () => bakeNormalMap(textures.normalMap, textures.detailNormalMap, textures.dinoData.detailScale ?? 12, true),
    [textures.normalMap, textures.detailNormalMap, textures.dinoData.detailScale],
  );
  const defaultMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bakedTextureFinal,
    normalMap: bakedNormalMap,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  }), [bakedTextureFinal, bakedNormalMap]);

  const activeMaterial = useDefaultMaterial ? defaultMaterial : customMaterial;

  useEffect(() => {
    obj.traverse((child: THREE.Object3D) => {
      if (child instanceof THREE.Mesh) {
        child.material = activeMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [obj, activeMaterial]);

  return (
    <primitive
      object={obj}
      scale={dinoData.scale}
      position={dinoData.position}
      rotation={[0, -Math.PI / 6, 0]}
    />
  );
}

// Animated GLB model with skeletal animation
function AnimatedModel({ colors, glitchValues, selectedPattern, selectedDino, useDefaultMaterial, aoStrength = 0.85, overlay, glitchTuning = DEFAULT_GLITCH_TUNING, noiseColor = '#000000', noiseStrength = 0, noiseScale = 1, noiseBlur = 0 }: ModelProps) {
  const dinoData = DINOSAURS[selectedDino];
  const gltf = useLoader(GLTFLoader, dinoData.glbModel!);
  const textures = useSkinTextures(selectedDino, selectedPattern);
  const customMaterial = useSkinMaterial();
  useUpdateSkinUniforms(customMaterial, textures, colors, glitchValues);

  const displayColors = useMemo(() => getDisplayColors(colors, glitchValues), [colors, glitchValues]);
  const bakedTexture = useMemo(
    () => modifyTextureColors(textures.patternTexture, displayColors, glitchValues, false, 0.55, textures.hasJuvenile ? textures.juvenileTexture : undefined, glitchTuning),
    [textures.patternTexture, textures.juvenileTexture, textures.hasJuvenile, displayColors, glitchValues, glitchTuning.bleedReach, glitchTuning.juviErosion, glitchTuning.darkBleed, glitchTuning.juviOpacity, glitchTuning.juviTint],
  );
  const bakedTextureAO = useMemo(
    () => (textures.hasRAC && aoStrength > 0 ? bakeAOIntoAlbedo(bakedTexture, textures.racMap, aoStrength) : bakedTexture),
    [bakedTexture, textures.hasRAC, textures.racMap, aoStrength],
  );
  const bakedTextureOverlay = useMemo(
    () => (textures.hasMask && overlay && overlay.some((c) => c.alpha > 0) ? bakeOverlayMask(bakedTextureAO, textures.maskMap, overlay) : bakedTextureAO),
    [bakedTextureAO, textures.hasMask, textures.maskMap, overlay],
  );
  const bakedTextureFinal = useMemo(
    () => bakeNoiseOverlay(bakedTextureOverlay, textures.noiseMap, noiseColor, noiseStrength, noiseScale, noiseBlur),
    [bakedTextureOverlay, textures.noiseMap, noiseColor, noiseStrength, noiseScale, noiseBlur],
  );
  const bakedNormalMap = useMemo(
    () => bakeNormalMap(textures.normalMap, textures.detailNormalMap, textures.dinoData.detailScale ?? 12, false),
    [textures.normalMap, textures.detailNormalMap, textures.dinoData.detailScale],
  );
  const defaultMaterial = useMemo(() => new THREE.MeshStandardMaterial({
    map: bakedTextureFinal,
    normalMap: bakedNormalMap,
    normalScale: new THREE.Vector2(1, 1),
    roughness: 0.95,
    metalness: 0.0,
    envMapIntensity: 0.4,
    side: THREE.DoubleSide,
  }), [bakedTextureFinal, bakedNormalMap]);

  const activeMaterial = useDefaultMaterial ? defaultMaterial : customMaterial;

  const mixerRef = useRef<THREE.AnimationMixer | null>(null);

  const clonedScene = useMemo(() => cloneSkinnedScene(gltf.scene), [gltf.scene]);

  useEffect(() => {
    if (!useDefaultMaterial) customMaterial.uniforms.uFlipV.value = true;
    clonedScene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.SkinnedMesh).isSkinnedMesh || (child as THREE.Mesh).isMesh) {
        (child as THREE.Mesh).material = activeMaterial;
        (child as THREE.Mesh).castShadow = true;
        (child as THREE.Mesh).receiveShadow = true;
      }
    });
  }, [clonedScene, activeMaterial, customMaterial, useDefaultMaterial]);

  useEffect(() => {
    if (gltf.animations.length > 0) {
      const mixer = new THREE.AnimationMixer(clonedScene);
      const action = mixer.clipAction(gltf.animations[0]);
      action.play();
      mixerRef.current = mixer;
      return () => {
        mixer.stopAllAction();
        mixer.uncacheRoot(clonedScene);
      };
    }
  }, [gltf.animations, clonedScene]);

  useFrame((_, delta) => {
    mixerRef.current?.update(delta);
  });

  const scale = (dinoData.glbScale ?? dinoData.scale) * GLB_SCALE_CORRECTION;
  const position = dinoData.glbPosition ?? dinoData.position;

  return (
    <primitive
      object={clonedScene}
      scale={scale}
      position={position}
      rotation={[0, -Math.PI / 6, 0]}
    />
  );
}

// Camera controls: orbit + zoom on left/scroll, middle/right vertical pan with limits
function CameraControls({ selectedDino }: { selectedDino: string }) {
  const controlsRef = useRef<React.ComponentRef<typeof OrbitControls>>(null);
  const isDragging = useRef(false);
  const lastClientY = useRef(0);
  const panOffset = useRef(0);

  const PAN_SENSITIVITY = 0.012;
  const PAN_MIN = -3;
  const PAN_MAX = 2.5;

  useEffect(() => {
    const controls = controlsRef.current as unknown as { object: THREE.Camera; target?: THREE.Vector3; update: () => void } | null;
    if (!controls) return;
    const cs = DINOSAURS[selectedDino]?.cameraStart ?? DEFAULT_CAMERA_START;
    controls.object.position.set(cs[0], cs[1], cs[2]);
    controls.target?.set(0, 0, 0);
    controls.update();
  }, [selectedDino]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const domElement = (controls as unknown as { domElement?: HTMLElement }).domElement || document.querySelector('canvas');
    if (!domElement) return;

    const onPointerDown = (e: PointerEvent) => {
      if (e.button === 2) {
        isDragging.current = true;
        lastClientY.current = e.clientY;
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!isDragging.current) return;
      const delta = (e.clientY - lastClientY.current) * PAN_SENSITIVITY;
      lastClientY.current = e.clientY;

      const newOffset = THREE.MathUtils.clamp(panOffset.current + delta, PAN_MIN, PAN_MAX);
      const actualDelta = newOffset - panOffset.current;
      panOffset.current = newOffset;

      const ctrl = controlsRef.current as unknown as { target: THREE.Vector3; object: THREE.Camera; update: () => void } | null;
      if (ctrl) {
        ctrl.target.y -= actualDelta;
        ctrl.object.position.y -= actualDelta;
        ctrl.update();
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      if (e.button === 2) isDragging.current = false;
    };

    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    domElement.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    domElement.addEventListener('contextmenu', preventContextMenu);

    return () => {
      domElement.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      domElement.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  return <OrbitControls ref={controlsRef} enableZoom={true} enablePan={false} />;
}

// Rock platform beneath the dino
function RockPlatform() {
  const gltf = useLoader(GLTFLoader, '/SkinViewer/PrimalRock.glb');
  const scene = useMemo(() => gltf.scene.clone(), [gltf.scene]);

  useEffect(() => {
    scene.traverse((child: THREE.Object3D) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.receiveShadow = true;
        const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
        for (const mat of materials) {
          mat.side = THREE.DoubleSide;
          mat.transparent = false;
          mat.opacity = 1;
          mat.alphaTest = 0;
          mat.depthWrite = true;
          if ((mat as THREE.MeshStandardMaterial).alphaMap) {
            (mat as THREE.MeshStandardMaterial).alphaMap = null;
          }
          mat.needsUpdate = true;
        }
      }
    });
  }, [scene]);

  return (
    <primitive
      object={scene}
      scale={0.176}
      position={[-4.5, -5.13, 0]}
      rotation={[0, 0, 0]}
    />
  );
}

// Slider + typeable number input on one row
function TuneRow({ label, value, min, max, step, onChange, title }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void; title?: string;
}) {
  return (
    <label className="block">
      <div className="mb-0.5 flex items-center justify-between">
        <span>{label}</span>
        <input
          type="number"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(e) => { const v = parseFloat(e.target.value); if (!Number.isNaN(v)) onChange(v); }}
          className="w-16 px-1 py-0.5 rounded bg-black/60 text-ice-blue border border-white/10 text-[10px] font-mono text-right outline-none focus:border-ice-blue/50"
        />
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-ice-blue" title={title} />
    </label>
  );
}

// 2D pad to position the sun
function SunPad({ azimuth, elevation, onChange }: { azimuth: number; elevation: number; onChange: (az: number, el: number) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  const update = (clientX: number, clientY: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    const py = Math.min(1, Math.max(0, (clientY - rect.top) / rect.height));
    onChange(Math.round(px * 360), Math.round(5 + (1 - py) * 85));
  };

  const onDown = (e: React.PointerEvent) => {
    dragging.current = true;
    try { (e.target as HTMLElement).setPointerCapture(e.pointerId); } catch {}
    update(e.clientX, e.clientY);
  };
  const onMove = (e: React.PointerEvent) => { if (dragging.current) update(e.clientX, e.clientY); };
  const onUp = (e: React.PointerEvent) => {
    dragging.current = false;
    try { (e.target as HTMLElement).releasePointerCapture(e.pointerId); } catch {}
  };

  const hx = (azimuth / 360) * 100;
  const hy = (1 - (elevation - 5) / 85) * 100;

  return (
    <div>
      <div className="mb-0.5 flex items-center justify-between">
        <span>🌞 Sun position</span>
        <span className="font-mono text-[10px] text-ice-blue">{Math.round(elevation)}° · {Math.round(azimuth)}°</span>
      </div>
      <div
        ref={ref}
        onPointerDown={onDown}
        onPointerMove={onMove}
        onPointerUp={onUp}
        className="relative w-full aspect-square max-h-[130px] rounded bg-black/50 border border-white/10 cursor-crosshair overflow-hidden select-none"
        style={{ touchAction: 'none' }}
        title="Drag the sun — left/right = direction, up/down = height (top = overhead)"
      >
        <div className="absolute inset-x-0 top-1/2 border-t border-white/5 pointer-events-none" />
        <div className="absolute inset-y-0 left-1/2 border-l border-white/5 pointer-events-none" />
        <span className="absolute top-0.5 left-1 text-[8px] opacity-30 pointer-events-none">overhead</span>
        <span className="absolute bottom-0.5 left-1 text-[8px] opacity-30 pointer-events-none">horizon</span>
        <div
          className="absolute w-3 h-3 rounded-full bg-ice-blue shadow-[0_0_8px_2px_rgba(88,225,255,0.7)] -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{ left: `${hx}%`, top: `${hy}%` }}
        />
      </div>
    </div>
  );
}

// Applies the tone-mapping exposure to the live renderer
function ExposureControl({ exposure }: { exposure: number }) {
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    gl.toneMappingExposure = exposure;
  }, [gl, exposure]);
  return null;
}

// Wrapper that picks static or animated model
function DinoViewer(props: ModelProps) {
  const dinoData = DINOSAURS[props.selectedDino];
  if (dinoData.glbModel) {
    return <AnimatedModel {...props} />;
  }
  return <StaticModel {...props} />;
}

// Loading fallback
function ModelLoader() {
  return (
    <mesh>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#333" />
    </mesh>
  );
}

// ── localStorage persistence (replaces the DB) ──
type SavedSkin = {
  id: string;
  name: string;
  dino: string;
  skinJson: string;
  savedAt: number;
};

const STORAGE_KEY = 'iceSkinCreator.savedSkins';

function loadSavedSkins(): SavedSkin[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function persistSavedSkins(skins: SavedSkin[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(skins));
  } catch {
    /* quota / unavailable — ignore in the demo */
  }
}

function SkinCreator() {
  const [selectedDino, setSelectedDino] = useState<string>('tyrannosaurus');
  const [selectedPattern, setSelectedPattern] = useState<number>(1);
  const [marks, setMarks] = useState<number>(0);
  const useDefaultMaterial = true;

  const [bgLevel, setBgLevel] = useState<number>(0.8);
  const [dayNight, setDayNight] = useState<number>(0.85);

  const [showLightSettings, setShowLightSettings] = useState<boolean>(false);
  const [sunStrength, setSunStrength] = useState<number>(25);
  const [sunElevation, setSunElevation] = useState<number>(76);
  const [sunAzimuth, setSunAzimuth] = useState<number>(0);
  const [brightness, setBrightness] = useState<number>(1.08);
  const [saturation, setSaturation] = useState<number>(1.0);

  const NOISE_COLOR = '#050505';
  const NOISE_AMOUNT = 0.95;
  const NOISE_BLUR = 2;
  const noiseStrength = marks > 0 ? NOISE_AMOUNT : 0;
  const noiseScale = marks > 0 ? marks : 1;

  const overlay = useMemo<OverlayChannel[]>(() => DINOSAURS[selectedDino]?.overlayDefaults ?? [], [selectedDino]);
  const AO_STRENGTH = 1.0;
  const AMBIENT_FILL = 0;
  const EXPOSURE = 0.99;
  const sunPosition = useMemo<[number, number, number]>(() => {
    const el = (sunElevation * Math.PI) / 180;
    const az = (sunAzimuth * Math.PI) / 180;
    const r = 12;
    return [r * Math.cos(el) * Math.sin(az), r * Math.sin(el), r * Math.cos(el) * Math.cos(az)];
  }, [sunElevation, sunAzimuth]);

  const [bgScene, setBgScene] = useState<string>('lagoon');
  const [bgEnabled, setBgEnabled] = useState<boolean>(true);
  const currentScene = BG_SCENES.find((s) => s.id === bgScene) ?? BG_SCENES[0];
  const showImageBackdrop = bgEnabled && !!currentScene.image;
  const imageBackdropStyle: React.CSSProperties | undefined = showImageBackdrop
    ? (() => {
        const dim = Math.max(0, 0.85 - 0.85 * bgLevel);
        return {
          backgroundImage: `linear-gradient(rgba(0,0,0,${dim.toFixed(2)}), rgba(0,0,0,${dim.toFixed(2)})), url(${currentScene.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        };
      })()
    : undefined;
  const sunColor = useMemo(
    () => new THREE.Color().setRGB(0.35 + 0.65 * dayNight, 0.45 + 0.5 * dayNight, 0.78 + 0.12 * dayNight),
    [dayNight],
  );
  const dn = Math.min(1, 0.35 + 0.588 * dayNight);
  const lightT = Math.pow(dn, 2.6);

  type ViewerQuality = 'auto' | 'low' | 'medium' | 'high';
  const [viewerEnabled, setViewerEnabled] = useState<boolean>(true);
  const [viewerQuality, setViewerQuality] = useState<ViewerQuality>('auto');

  useEffect(() => {
    try {
      const savedEnabled = localStorage.getItem('skinViewer.enabled');
      const savedQuality = localStorage.getItem('skinViewer.quality') as ViewerQuality | null;
      if (savedEnabled !== null) setViewerEnabled(savedEnabled === 'true');
      if (savedQuality && ['auto', 'low', 'medium', 'high'].includes(savedQuality)) {
        setViewerQuality(savedQuality);
      }
    } catch {}
  }, []);
  useEffect(() => { try { localStorage.setItem('skinViewer.enabled', String(viewerEnabled)); } catch {} }, [viewerEnabled]);
  useEffect(() => { try { localStorage.setItem('skinViewer.quality', viewerQuality); } catch {} }, [viewerQuality]);

  const resolvedQuality: Exclude<ViewerQuality, 'auto'> = useMemo(() => {
    if (viewerQuality !== 'auto') return viewerQuality;
    if (typeof navigator === 'undefined') return 'high';
    const mem = (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 8;
    const cores = navigator.hardwareConcurrency ?? 8;
    if (mem <= 2 || cores <= 2) return 'low';
    if (mem <= 4 || cores <= 4) return 'medium';
    return 'high';
  }, [viewerQuality]);

  const qualityDpr: [number, number] = resolvedQuality === 'low'
    ? [0.5, 0.75]
    : resolvedQuality === 'medium'
      ? [0.75, 1]
      : [1, 2];
  const qualityAA = resolvedQuality === 'high';

  const [skinName, setSkinName] = useState<string>('My Custom Skin');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importJson, setImportJson] = useState('');
  const [showMoreActions, setShowMoreActions] = useState(false);

  // Saved skins (localStorage)
  const [savedSkins, setSavedSkins] = useState<SavedSkin[]>([]);
  useEffect(() => { setSavedSkins(loadSavedSkins()); }, []);

  const [colors, setColors] = useState<ColorState>({
    maleColor: '#FFFFFF',
    highColor: '#FFFFFF',
    midColor: '#FFFFFF',
    mid2Color: '#FFFFFF',
    lowColor: '#FFFFFF',
    bottomColor: '#FFFFFF',
    eyeColor: '#FFFFFF',
  });

  const [glitchValues, setGlitchValues] = useState<GlitchState>({});

  const randomizeColors = () => {
    const rand = () => '#' + Math.floor(Math.random() * 0xffffff).toString(16).padStart(6, '0');
    setColors({
      maleColor: rand(), highColor: rand(), midColor: rand(), mid2Color: rand(),
      lowColor: rand(), bottomColor: rand(), eyeColor: rand(),
    });
    setGlitchValues({});
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleColorChange = (key: keyof ColorState, value: string) => {
    if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
      setColors(prev => ({ ...prev, [key]: value }));
      if (glitchValues[key]) {
        setGlitchValues(prev => {
          const updated = { ...prev };
          delete updated[key];
          return updated;
        });
      }
    }
  };

  const handleResetGlitch = (key: keyof ColorState) => {
    setGlitchValues(prev => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
    setColors(prev => ({ ...prev, [key]: '#FFFFFF' }));
  };

  // Export skin as plain JSON (copied to clipboard)
  const handleExportJson = async () => {
    const skinData = formatSkinDataForSave(colors, selectedPattern, marks, glitchValues);
    try {
      const raw = JSON.parse(skinData);
      const ordered: Record<string, string> = {};
      for (const k of ['pi', 'md', 'm', 'f', 'b', 'u', 'd1', 'e', 'sv']) {
        if (k in raw) ordered[k] = raw[k];
      }
      const jsonString = JSON.stringify(ordered, null, 2);
      await navigator.clipboard.writeText(jsonString);
      showToast('Skin JSON copied!', 'success');
    } catch {
      showToast('Failed to export skin', 'error');
    }
  };

  // Export an encrypted, shareable code (copied to clipboard)
  const handleExportCode = async () => {
    try {
      const skinData = formatSkinDataForSave(colors, selectedPattern, marks, glitchValues);
      const code = await encryptSkin(skinData);
      await navigator.clipboard.writeText(code);
      showToast('Shareable code copied!', 'success');
    } catch {
      showToast('Failed to create share code', 'error');
    }
  };

  // Import skin — accepts encrypted (PHSKIN:...) and plain JSON
  const handleImportJson = async () => {
    try {
      let jsonToParse = importJson.trim();

      if (isEncryptedSkin(jsonToParse)) {
        try {
          jsonToParse = await decryptSkin(jsonToParse);
        } catch {
          showToast('Invalid or corrupted skin code', 'error');
          return;
        }
      } else if (jsonToParse.startsWith('"') && jsonToParse.endsWith('"')) {
        try { jsonToParse = JSON.parse(jsonToParse); } catch { /* use as-is */ }
      }

      const parsed = parseSkinJson(jsonToParse);
      setColors(parsed.colors);
      setGlitchValues(parsed.glitchValues);
      setSelectedPattern(parsed.pattern);
      setMarks(parsed.marks);
      setShowImportModal(false);
      setImportJson('');
      showToast('Skin imported successfully!', 'success');
    } catch {
      showToast('Invalid skin code', 'error');
    }
  };

  // Save the current skin to localStorage (named)
  const handleSaveSkin = () => {
    const name = skinName.trim() || 'Untitled Skin';
    const skinJson = formatSkinDataForSave(colors, selectedPattern, marks, glitchValues);
    const entry: SavedSkin = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name,
      dino: selectedDino,
      skinJson,
      savedAt: Date.now(),
    };
    setSavedSkins(prev => {
      const next = [entry, ...prev];
      persistSavedSkins(next);
      return next;
    });
    showToast('Skin saved to this browser!', 'success');
  };

  // Load a saved skin back into the editor
  const handleLoadSavedSkin = (skin: SavedSkin) => {
    const parsed = parseSkinJson(skin.skinJson);
    if (DINOSAURS[skin.dino]) setSelectedDino(skin.dino);
    setSkinName(skin.name);
    setColors(parsed.colors);
    setGlitchValues(parsed.glitchValues);
    setSelectedPattern(parsed.pattern);
    setMarks(parsed.marks);
    showToast(`Loaded "${skin.name}"`, 'success');
  };

  // Delete a saved skin
  const handleDeleteSavedSkin = (id: string) => {
    setSavedSkins(prev => {
      const next = prev.filter(s => s.id !== id);
      persistSavedSkins(next);
      return next;
    });
  };

  return (
    <div className="min-h-screen relative pb-14 lg:h-[100dvh] lg:pb-0 lg:overflow-hidden">
      <main className="relative z-10 p-4 sm:p-6 lg:p-8 lg:h-[100dvh] lg:flex lg:flex-col lg:overflow-hidden max-w-[1500px] mx-auto w-full">
        {/* Page Header */}
        <div className="flex items-start justify-between gap-4 flex-wrap mb-2">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-ice-blue flex items-center gap-2">
              🎨 Skin Creator
            </h1>
            <p className="text-gray-400 text-sm mt-1">
              A live demo of the Primal Heaven dinosaur skin editor — color zones, patterns, and a
              real-time 3D preview. Runs entirely in your browser.
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <span className="px-3 py-1 bg-ice-blue/10 border border-ice-blue/30 text-ice-blue rounded-full text-xs font-bold uppercase tracking-wider">
              Public Demo
            </span>
            <Link
              href="/projects"
              className="px-4 py-2 rounded-xl text-sm font-semibold bg-gray-800 border border-gray-700 text-gray-200 hover:border-ice-blue/50 hover:text-ice-blue transition-colors"
            >
              ← Projects
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_350px] lg:grid-rows-[minmax(0,1fr)] gap-5 items-stretch lg:flex-1 lg:min-h-0 mt-4">
          {/* 3D Preview */}
          <div className="flex flex-col gap-4 min-w-0 lg:min-h-0">
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 overflow-hidden flex-1 flex flex-col">
              <div className="p-4 border-b border-gray-700 flex items-center justify-between gap-4 flex-wrap">
                <div className="flex items-center gap-3 flex-1 min-w-[180px]">
                  <input
                    type="text"
                    value={skinName}
                    onChange={(e) => setSkinName(e.target.value)}
                    className="text-xl font-bold bg-transparent text-white border-b-2 border-transparent hover:border-gray-600 focus:border-ice-blue/60 focus:outline-none transition-colors px-1 py-1 max-w-[300px]"
                    placeholder="Enter skin name..."
                  />
                  <span className="text-white/30">✏️</span>
                </div>
                <div className="flex items-center gap-4 text-white/40 text-sm">
                  <label className="flex items-center gap-2 text-gray-400">
                    <span className="select-none">Marks</span>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.01}
                      value={marks}
                      onChange={(e) => setMarks(parseFloat(e.target.value))}
                      className="w-32 accent-ice-blue cursor-pointer"
                      title="Scar/marks intensity (0 = none, 1 = full)"
                    />
                    <input
                      type="number"
                      min={0}
                      step={0.01}
                      value={Number(marks.toFixed(4))}
                      onChange={(e) => {
                        const v = parseFloat(e.target.value);
                        setMarks(isFinite(v) ? Math.max(0, v) : 0);
                      }}
                      className="w-14 px-1.5 py-0.5 bg-white/[0.03] border border-gray-700 rounded text-white text-[11px] font-mono text-right focus:border-ice-blue/60 focus:outline-none"
                      title="Scar/marks intensity — slider is 0–1, but you can type higher (e.g. 50)"
                    />
                  </label>
                </div>
              </div>
              <div className="relative flex-1 min-h-[320px] lg:min-h-0 bg-gradient-to-br from-gray-900 to-black bg-no-repeat" style={imageBackdropStyle}>
                {/* Top-right viewer controls */}
                <div className="absolute top-2 right-2 z-10 flex items-center gap-2">
                  {viewerEnabled && (
                    <select
                      value={viewerQuality}
                      onChange={(e) => setViewerQuality(e.target.value as ViewerQuality)}
                      title="Render quality (lower = better performance)"
                      className="px-2 py-1 text-xs rounded bg-black/60 text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all cursor-pointer outline-none"
                    >
                      <option value="auto">Auto ({resolvedQuality})</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  )}
                  <button
                    onClick={() => setViewerEnabled(v => !v)}
                    title={viewerEnabled ? 'Turn 3D viewer off' : 'Turn 3D viewer on'}
                    className="px-2 py-1 text-xs rounded bg-black/60 text-white/70 hover:text-white border border-white/10 hover:border-white/30 transition-all"
                  >
                    {viewerEnabled ? '3D: On' : '3D: Off'}
                  </button>
                </div>

                {/* Viewer controls */}
                {viewerEnabled && (
                  <div className="absolute bottom-2 left-2 z-20 w-[210px] max-h-[calc(100%-1rem)] overflow-y-auto rounded-lg border border-gray-700 bg-black/70 backdrop-blur-sm p-3 text-[11px] text-white/80 space-y-3">
                    <div className="flex items-center justify-between">
                      <span>🖼️ Background</span>
                      <button
                        onClick={() => setBgEnabled((v) => !v)}
                        title="Show the backdrop scene, or switch to a plain black room."
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition-colors ${
                          bgEnabled
                            ? 'bg-ice-blue/15 border-ice-blue/40 text-ice-blue'
                            : 'bg-white/5 border-white/15 text-white/50 hover:text-white/80'
                        }`}
                      >
                        {bgEnabled ? 'On' : 'Off · Black room'}
                      </button>
                    </div>

                    {bgEnabled && (
                      <>
                        <label className="block">
                          <div className="mb-0.5"><span>🏞️ Scene</span></div>
                          <select
                            value={bgScene}
                            onChange={(e) => setBgScene(e.target.value)}
                            title="Backdrop scene (visual only — doesn't light the dino)"
                            className="w-full px-2 py-1 rounded bg-black/60 text-white/80 border border-white/10 hover:border-white/30 focus:border-ice-blue/50 outline-none cursor-pointer text-[11px]"
                          >
                            {BG_SCENES.map((s) => (
                              <option key={s.id} value={s.id} className="bg-[#1a1a1a] text-white">{s.label}</option>
                            ))}
                          </select>
                        </label>
                        <label className="block">
                          <div className="mb-0.5 flex items-center justify-between">
                            <span>🌗 Backdrop brightness</span>
                            <span className="font-mono text-[10px] text-ice-blue">{Math.round(bgLevel * 100)}%</span>
                          </div>
                          <input type="range" min={0} max={1} step={0.01} value={bgLevel} onChange={(e) => setBgLevel(parseFloat(e.target.value))} className="w-full accent-ice-blue" title="Backdrop image brightness (visual only)" />
                        </label>
                      </>
                    )}

                    <label className="block border-t border-white/10 pt-2">
                      <div className="mb-0.5 flex items-center justify-between">
                        <span>☀️ Lighting <span className="opacity-50">(day/night)</span> 🌙</span>
                        <span className="font-mono text-[10px] text-ice-blue">{Math.round(dayNight * 100)}%</span>
                      </div>
                      <input type="range" min={0} max={1} step={0.01} value={dayNight} onChange={(e) => setDayNight(parseFloat(e.target.value))} className="w-full accent-ice-blue" title="Sun brightness + warmth on the dino (night → day)" />
                    </label>

                    <div className="border-t border-white/10 pt-2">
                      <button
                        type="button"
                        onClick={() => setShowLightSettings((v) => !v)}
                        className="w-full flex items-center justify-between text-left hover:text-ice-blue transition-colors"
                        title="Sun strength + position controls"
                      >
                        <span>⚙️ Settings</span>
                        <span className="text-[10px] opacity-50">{showLightSettings ? '▲' : '▼'}</span>
                      </button>

                      {showLightSettings && (
                        <div className="space-y-2 pt-2">
                          <TuneRow label="☀️ Sun strength" value={sunStrength} min={0} max={100} step={0.1} onChange={setSunStrength} title="Directional sun intensity" />
                          <TuneRow label="💡 Brightness" value={brightness} min={0} max={3} step={0.01} onChange={setBrightness} title="Render brightness multiplier" />
                          <TuneRow label="🎨 Saturation" value={saturation} min={0} max={10} step={0.05} onChange={setSaturation} title="Render saturation multiplier" />

                          <SunPad azimuth={sunAzimuth} elevation={sunElevation} onChange={(az, el) => { setSunAzimuth(az); setSunElevation(el); }} />
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {viewerEnabled ? (
                  <Canvas
                    shadows
                    camera={{ position: DINOSAURS[selectedDino]?.cameraStart ?? DEFAULT_CAMERA_START, fov: 40 }}
                    dpr={qualityDpr}
                    gl={{ toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.0, antialias: qualityAA, powerPreference: 'high-performance' }}
                    style={{ filter: `brightness(${brightness}) saturate(${saturation})` }}
                  >
                    <ExposureControl exposure={EXPOSURE} />
                    <Suspense fallback={<ModelLoader />}>
                      <DinoViewer
                        colors={colors}
                        glitchValues={glitchValues}
                        selectedPattern={selectedPattern}
                        selectedDino={selectedDino}
                        useDefaultMaterial={useDefaultMaterial}
                        aoStrength={AO_STRENGTH}
                        overlay={overlay}
                        noiseColor={NOISE_COLOR}
                        noiseStrength={noiseStrength}
                        noiseScale={noiseScale}
                        noiseBlur={NOISE_BLUR}
                      />
                      <RockPlatform />
                      <ambientLight intensity={0.002 + AMBIENT_FILL * lightT} />
                      <directionalLight
                        position={sunPosition}
                        intensity={sunStrength * lightT}
                        color={sunColor}
                        castShadow
                        shadow-mapSize-width={2048}
                        shadow-mapSize-height={2048}
                        shadow-camera-near={0.5}
                        shadow-camera-far={60}
                        shadow-camera-left={-12}
                        shadow-camera-right={12}
                        shadow-camera-top={12}
                        shadow-camera-bottom={-12}
                        shadow-bias={-0.0004}
                        shadow-normalBias={0.02}
                      />
                      <CameraControls selectedDino={selectedDino} />

                      <Environment preset="warehouse" environmentIntensity={0.04 + 0.85 * lightT} />

                      {!bgEnabled ? (
                        <color attach="background" args={['#050505']} />
                      ) : currentScene.preset ? (
                        <Environment
                          preset={currentScene.preset as React.ComponentProps<typeof Environment>['preset']}
                          background="only"
                          blur={0.8}
                          backgroundIntensity={0.12 + 1.3 * bgLevel}
                        />
                      ) : null}
                    </Suspense>
                  </Canvas>
                ) : (
                  <div className="flex items-center justify-center h-full text-white/40 text-sm">
                    3D viewer disabled - click &quot;3D: Off&quot; to re-enable.
                  </div>
                )}
              </div>
            </div>

            {/* Pattern Selection */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 py-2.5 px-4 shrink-0">
              <label className="text-gray-300 text-xs block mb-1.5">Pattern</label>
              <div className="flex gap-2">
                {[1, 2, 3].map((pattern) => (
                  <button
                    key={pattern}
                    onClick={() => setSelectedPattern(pattern)}
                    className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-all ${
                      selectedPattern === pattern
                        ? 'bg-ice-blue/10 border border-ice-blue/40 text-ice-blue'
                        : 'bg-white/[0.02] text-gray-400 hover:text-white border border-gray-700 hover:border-ice-blue/25'
                    }`}
                  >
                    Pattern {pattern}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Controls Panel */}
          <div className="space-y-4 lg:overflow-y-auto lg:min-h-0 lg:pr-1">
            {/* Dinosaur Selection */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 p-4">
              <label className="text-gray-300 text-sm block mb-2">Dinosaur Preview</label>
              <select
                value={selectedDino}
                onChange={(e) => setSelectedDino(e.target.value)}
                className="w-full px-4 py-3 bg-black/30 border border-gray-700 rounded-lg text-white focus:border-ice-blue/50 focus:outline-none transition-colors appearance-none cursor-pointer"
                style={{ backgroundColor: '#1a1a1a' }}
              >
                {Object.entries(DINOSAURS).map(([key, dino]) => (
                  <option key={key} value={key} className="bg-[#1a1a1a] text-white">{dino.name}</option>
                ))}
              </select>
            </div>

            {/* Color Pickers */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 p-3">
              <div className="flex items-center justify-between pb-2">
                <h3 className="text-white font-semibold flex items-center gap-1.5">🎨 Colors</h3>
                <button
                  onClick={randomizeColors}
                  className="rounded-lg border border-ice-blue/40 bg-ice-blue/15 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-ice-blue transition hover:brightness-125"
                  title="Randomize all colors"
                >
                  🎲 Randomize
                </button>
              </div>
              <div className="space-y-0">
                {colorPickers.map(({ label, key }) => {
                  const hasGlitch = !!glitchValues[key];

                  return (
                    <div key={key} className="flex items-center justify-between py-1 border-b border-white/[0.04] last:border-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-gray-300 text-xs">{label}</span>
                        {hasGlitch && (
                          <span className="px-1 py-0.5 bg-ice-blue/12 border border-ice-blue/30 text-ice-blue text-[9px] rounded">
                            GLITCH
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5">
                        {hasGlitch ? (
                          <>
                            <div
                              className="w-7 h-7 rounded border-2 border-ice-blue/50 bg-ice-blue/10 flex items-center justify-center text-[10px]"
                              title={glitchValues[key]}
                            >
                              ⚡
                            </div>
                            <button
                              onClick={() => handleResetGlitch(key)}
                              className="px-1.5 py-0.5 bg-red-500/20 text-red-400 rounded text-[10px] hover:bg-red-500/30"
                            >
                              Reset
                            </button>
                          </>
                        ) : (
                          <input
                            type="color"
                            value={colors[key]}
                            onChange={(e) => handleColorChange(key, e.target.value)}
                            className="w-7 h-7 rounded cursor-pointer border-2 border-gray-700 hover:border-ice-blue/50 transition-colors"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 p-4 space-y-2">
              <button
                onClick={handleSaveSkin}
                className="w-full flex flex-col items-center justify-center px-2 py-3 font-bold rounded-xl transition-all text-sm leading-tight bg-ice-blue/15 border border-ice-blue/40 text-ice-blue hover:bg-ice-blue/25"
                title="Save this skin to your browser's local storage"
              >
                <span>💾 Save Skin</span>
                <span className="text-[10px] font-normal opacity-70 mt-0.5">stored in this browser</span>
              </button>

              {/* More actions: Import / Export */}
              <div>
                <button
                  onClick={() => setShowMoreActions((v) => !v)}
                  className="w-full px-4 py-2 font-medium rounded-xl transition-colors text-xs text-gray-400 hover:text-gray-200 bg-white/[0.02] border border-gray-700 hover:border-ice-blue/25 flex items-center justify-center gap-1.5"
                >
                  <span>{showMoreActions ? '▴' : '•••'}</span>
                  <span>Import / Export</span>
                </button>

                {showMoreActions && (
                  <div className="mt-2 space-y-2">
                    <div className="flex gap-2">
                      <button
                        onClick={() => setShowImportModal(true)}
                        className="flex-1 px-3 py-2.5 font-medium rounded-xl transition-colors text-sm bg-white/[0.03] border border-gray-700 text-gray-200 hover:bg-white/[0.07] hover:border-ice-blue/25"
                        title="Paste a skin code or JSON"
                      >
                        📥 Import
                      </button>
                      <button
                        onClick={handleExportJson}
                        className="flex-1 px-3 py-2.5 font-medium rounded-xl transition-colors text-sm bg-white/[0.03] border border-gray-700 text-gray-200 hover:bg-white/[0.07] hover:border-ice-blue/25"
                        title="Copy this skin's JSON"
                      >
                        📤 JSON
                      </button>
                      <button
                        onClick={handleExportCode}
                        className="flex-1 px-3 py-2.5 font-medium rounded-xl transition-colors text-sm bg-white/[0.03] border border-gray-700 text-gray-200 hover:bg-white/[0.07] hover:border-ice-blue/25"
                        title="Copy a shareable encoded skin link"
                      >
                        🔗 Share
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Glitch Skins Info */}
              {Object.keys(glitchValues).length > 0 && (
                <div className="bg-ice-blue/5 border border-ice-blue/20 rounded-xl p-3">
                  <p className="text-ice-blue text-xs">
                    ⚡ This skin contains {Object.keys(glitchValues).length} glitch effect(s) — they are preserved on save/export.
                  </p>
                </div>
              )}
            </div>

            {/* Saved Skins (localStorage) */}
            <div className="rounded-xl bg-gray-800/40 border border-gray-700 p-4">
              <h3 className="text-white font-semibold flex items-center gap-1.5 mb-2">💾 Saved Skins</h3>
              {savedSkins.length === 0 ? (
                <p className="text-gray-500 text-xs">
                  No saved skins yet. Hit <span className="text-ice-blue">Save Skin</span> to store one in this browser.
                </p>
              ) : (
                <ul className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                  {savedSkins.map((skin) => (
                    <li
                      key={skin.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-black/30 border border-gray-700 px-2.5 py-2"
                    >
                      <button
                        onClick={() => handleLoadSavedSkin(skin)}
                        className="flex-1 text-left min-w-0"
                        title="Load this skin into the editor"
                      >
                        <span className="block text-sm text-gray-100 truncate">{skin.name}</span>
                        <span className="block text-[10px] text-gray-500">
                          {DINOSAURS[skin.dino]?.name ?? skin.dino}
                        </span>
                      </button>
                      <button
                        onClick={() => handleLoadSavedSkin(skin)}
                        className="px-2 py-1 text-[10px] rounded bg-ice-blue/15 border border-ice-blue/30 text-ice-blue hover:bg-ice-blue/25"
                      >
                        Load
                      </button>
                      <button
                        onClick={() => handleDeleteSavedSkin(skin.id)}
                        className="px-2 py-1 text-[10px] rounded bg-red-500/15 border border-red-500/30 text-red-400 hover:bg-red-500/25"
                        title="Delete"
                      >
                        ✕
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-4 right-4 px-6 py-3 rounded-lg font-medium z-50 ${
          toast.type === 'success' ? 'bg-ice-blue text-black' : 'bg-red-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-gray-900 border border-gray-700 rounded-2xl w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl text-ice-blue tracking-wider uppercase font-bold">📥 Import Skin</h2>
              <button
                onClick={() => { setShowImportModal(false); setImportJson(''); }}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ×
              </button>
            </div>
            <p className="text-gray-300 text-sm mb-4">
              Paste a JSON skin code or a shareable <span className="font-mono text-ice-blue">PHSKIN:</span> link.
              This replaces your current colors and settings.
            </p>
            <textarea
              value={importJson}
              onChange={(e) => setImportJson(e.target.value)}
              placeholder='{"md": "X=1,Y=0,Z=0", ...}  or  PHSKIN:...'
              className="w-full h-48 px-4 py-3 bg-black/40 border border-gray-700 rounded-xl text-white font-mono text-sm focus:border-ice-blue/50 focus:outline-none resize-none"
            />
            <div className="flex gap-3 mt-4">
              <button
                onClick={() => { setShowImportModal(false); setImportJson(''); }}
                className="flex-1 px-4 py-3 bg-white/10 text-white rounded-xl hover:bg-white/20 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={importJson.trim() ? handleImportJson : undefined}
                disabled={!importJson.trim()}
                className={`flex-1 px-4 py-3 rounded-xl font-semibold transition-colors ${
                  importJson.trim()
                    ? 'bg-ice-blue text-black hover:brightness-110'
                    : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SkinCreatorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading Skin Creator...</div>
      </div>
    }>
      <SkinCreator />
    </Suspense>
  );
}
