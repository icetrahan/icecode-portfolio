import * as THREE from 'three';

export const dinoSkinVertexShader = /* glsl */ `
  #include <skinning_pars_vertex>

  uniform bool uFlipV;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  void main() {
    vUv = uFlipV ? vec2(uv.x, 1.0 - uv.y) : uv;

    #include <beginnormal_vertex>
    #include <skinbase_vertex>
    #include <skinnormal_vertex>

    vNormal = normalize(normalMatrix * objectNormal);

    #include <begin_vertex>
    #include <skinning_vertex>

    vec4 worldPos = modelMatrix * vec4(transformed, 1.0);
    vWorldPosition = worldPos.xyz;
    vViewDir = normalize(cameraPosition - worldPos.xyz);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(transformed, 1.0);
  }
`;

export const dinoSkinFragmentShader = /* glsl */ `
  precision highp float;

  uniform vec3 uColor1; // Red zones     (maleColor / md)
  uniform vec3 uColor2; // Green zones   (bottomColor / u)
  uniform vec3 uColor3; // Blue zones    (highColor / f)
  uniform vec3 uColor4; // Cyan zones    (lowColor / b)
  uniform vec3 uColor5; // Magenta zones (midColor / m)
  uniform vec3 uColor6; // Yellow zones  (mid2Color / d1)

  uniform sampler2D uPatternMap;
  uniform sampler2D uRACMap;
  uniform sampler2D uNormalMap;
  uniform sampler2D uDetailNormalMap;

  // Pattern Bleed: juvenile pattern + per-zone bleed params
  // Each uBleedN: rgb = bleed overlay color, a = erosion pixels (-1.0 = no bleed)
  uniform sampler2D uJuvenilePatternMap;
  uniform bool uHasJuvenilePattern;
  uniform vec4 uBleed1;
  uniform vec4 uBleed2;
  uniform vec4 uBleed3;
  uniform vec4 uBleed4;
  uniform vec4 uBleed5;
  uniform vec4 uBleed6;

  uniform float uDetailScale;
  uniform vec3 uLightDir;
  uniform vec3 uLightColor;
  uniform float uAmbientIntensity;
  uniform float uSubsurfaceIntensity;
  uniform bool uHasRACMap;
  uniform vec2 uTexelSize;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  varying vec3 vViewDir;

  const vec3 REF_RED     = vec3(1.0, 0.0, 0.0);
  const vec3 REF_GREEN   = vec3(0.0, 1.0, 0.0);
  const vec3 REF_BLUE    = vec3(0.0, 0.00392, 0.96078);
  const vec3 REF_CYAN    = vec3(0.0, 1.0, 0.94510);
  const vec3 REF_MAGENTA = vec3(1.0, 0.0, 1.0);
  const vec3 REF_YELLOW  = vec3(1.0, 1.0, 0.0);
  const float ZONE_THRESHOLD = 0.42;

  vec3 srgbToLinear(vec3 srgb) {
    return pow(max(srgb, 0.0), vec3(2.2));
  }

  mat3 computeTBN(vec3 N, vec3 worldPos, vec2 texCoord) {
    vec3 dp1 = dFdx(worldPos);
    vec3 dp2 = dFdy(worldPos);
    vec2 duv1 = dFdx(texCoord);
    vec2 duv2 = dFdy(texCoord);
    vec3 dp2perp = cross(dp2, N);
    vec3 dp1perp = cross(N, dp1);
    vec3 T = dp2perp * duv1.x + dp1perp * duv2.x;
    vec3 B = dp2perp * duv1.y + dp1perp * duv2.y;
    float invmax = inversesqrt(max(dot(T, T), dot(B, B)));
    return mat3(T * invmax, B * invmax, N);
  }

  float ggxSpecular(vec3 N, vec3 V, vec3 L, float roughness) {
    vec3 H = normalize(V + L);
    float NdotH = max(dot(N, H), 0.0);
    float a = roughness * roughness;
    float a2 = a * a;
    float denom = NdotH * NdotH * (a2 - 1.0) + 1.0;
    return a2 / (3.14159 * denom * denom + 0.0001);
  }

  float squaredDist(vec3 a, vec3 b) {
    vec3 d = a - b;
    return dot(d, d);
  }

  void matchZone(vec3 pat, out float mDist, out vec3 mColor, out int mIdx) {
    mDist = squaredDist(pat, REF_RED);    mColor = uColor1;  mIdx = 1;
    float d;
    d = squaredDist(pat, REF_GREEN);   if (d < mDist) { mDist = d; mColor = uColor2; mIdx = 2; }
    d = squaredDist(pat, REF_BLUE);    if (d < mDist) { mDist = d; mColor = uColor3; mIdx = 3; }
    d = squaredDist(pat, REF_CYAN);    if (d < mDist) { mDist = d; mColor = uColor4; mIdx = 4; }
    d = squaredDist(pat, REF_MAGENTA); if (d < mDist) { mDist = d; mColor = uColor5; mIdx = 5; }
    d = squaredDist(pat, REF_YELLOW);  if (d < mDist) { mDist = d; mColor = uColor6; mIdx = 6; }
  }

  vec3 getRefForZone(int z) {
    if (z == 1) return REF_RED;
    if (z == 2) return REF_GREEN;
    if (z == 3) return REF_BLUE;
    if (z == 4) return REF_CYAN;
    if (z == 5) return REF_MAGENTA;
    return REF_YELLOW;
  }

  vec4 getBleedForZone(int z) {
    if (z == 1) return uBleed1;
    if (z == 2) return uBleed2;
    if (z == 3) return uBleed3;
    if (z == 4) return uBleed4;
    if (z == 5) return uBleed5;
    return uBleed6;
  }

  // Bleed radius per-channel: how many texels the negative channel bleeds outward
  // |1-250| → 1px, |251-2500| → 2px, |2501+| → 3px
  float getBleedRadius(float absVal) {
    if (absVal > 666666.0) return 1.5;
    if (absVal > 6666.0) return 1.0;
    if (absVal > 0.3) return 0.5;
    return 0.0;
  }

  void main() {
    vec3 patternSRGB = texture2D(uPatternMap, vUv).rgb;

    float minDist;
    vec3 zoneColor;
    int adultZone;
    matchZone(patternSRGB, minDist, zoneColor, adultZone);

    // Is this pixel a bleed SOURCE (negative zone)?
    bool isBleedSource = (minDist <= ZONE_THRESHOLD) &&
      (zoneColor.x < -1.0 || zoneColor.y < -1.0 || zoneColor.z < -1.0);

    vec3 baseColor;
    if (minDist <= ZONE_THRESHOLD) {
      baseColor = max(zoneColor, vec3(0.0001));
    } else {
      baseColor = srgbToLinear(patternSRGB);
    }

    float surfaceVis = clamp(max(max(baseColor.r, baseColor.g), baseColor.b), 0.0, 1.0);

    // --- Edge bleed (Line Bleed): magnitude-weighted complement colors ---
    if (!isBleedSource && surfaceVis > 0.02) {
      vec3 bestBleed = vec3(0.0);
      bool foundBleed = false;

      for (int dirIdx = 0; dirIdx < 8; dirIdx++) {
        vec2 dir;
        if (dirIdx == 0) dir = vec2(1.0, 0.0);
        else if (dirIdx == 1) dir = vec2(-1.0, 0.0);
        else if (dirIdx == 2) dir = vec2(0.0, 1.0);
        else if (dirIdx == 3) dir = vec2(0.0, -1.0);
        else if (dirIdx == 4) dir = vec2(0.707, 0.707);
        else if (dirIdx == 5) dir = vec2(-0.707, 0.707);
        else if (dirIdx == 6) dir = vec2(0.707, -0.707);
        else dir = vec2(-0.707, -0.707);

        float diagMul = dirIdx >= 4 ? 1.414 : 1.0;

        for (int ri = 1; ri <= 3; ri++) {
          vec2 sampleUV = vUv + dir * float(ri) * uTexelSize;
          vec3 nPat = texture2D(uPatternMap, sampleUV).rgb;

          float nDist;
          vec3 nCol;
          int nIdx;
          matchZone(nPat, nDist, nCol, nIdx);

          if (nDist < ZONE_THRESHOLD &&
              (nCol.x < -1.0 || nCol.y < -1.0 || nCol.z < -1.0)) {

            float pixelDist = float(ri) * diagMul;

            vec3 activeNeg = vec3(0.0);
            if (nCol.x < -1.0 && pixelDist <= getBleedRadius(abs(nCol.x)))
              activeNeg.x = abs(nCol.x);
            if (nCol.y < -1.0 && pixelDist <= getBleedRadius(abs(nCol.y)))
              activeNeg.y = abs(nCol.y);
            if (nCol.z < -1.0 && pixelDist <= getBleedRadius(abs(nCol.z)))
              activeNeg.z = abs(nCol.z);

            float maxActive = max(activeNeg.x, max(activeNeg.y, activeNeg.z));
            if (maxActive > 0.0) {
              vec3 bleedRGB = vec3(1.0) - (activeNeg / maxActive);
              bestBleed = max(bestBleed, bleedRGB);
              foundBleed = true;
            }

            break;
          }
        }
      }

      if (foundBleed) {
        baseColor = bestBleed * surfaceVis;
        surfaceVis = clamp(surfaceVis + 0.1, 0.0, 1.0);
      }
    }

    // --- Pattern Bleed: overlay juvenile pattern layer with additive blending ---
    if (uHasJuvenilePattern) {
      vec3 juvPat = texture2D(uJuvenilePatternMap, vUv).rgb;

      float jDist;
      vec3 jColor;
      int jZone;
      matchZone(juvPat, jDist, jColor, jZone);

      if (jDist < ZONE_THRESHOLD && jZone > 0) {
        vec4 bleed = getBleedForZone(jZone);

        if (bleed.a >= 0.0) {
          float erosion = bleed.a;
          bool isEroded = false;

          // Erosion: check 8 directions at erosion distance for zone edge
          if (erosion > 0.5) {
            vec3 jRef = getRefForZone(jZone);
            for (int eDir = 0; eDir < 8; eDir++) {
              vec2 eVec;
              if (eDir == 0) eVec = vec2(1.0, 0.0);
              else if (eDir == 1) eVec = vec2(-1.0, 0.0);
              else if (eDir == 2) eVec = vec2(0.0, 1.0);
              else if (eDir == 3) eVec = vec2(0.0, -1.0);
              else if (eDir == 4) eVec = vec2(0.707, 0.707);
              else if (eDir == 5) eVec = vec2(-0.707, 0.707);
              else if (eDir == 6) eVec = vec2(0.707, -0.707);
              else eVec = vec2(-0.707, -0.707);

              vec2 erodeUV = vUv + eVec * erosion * uTexelSize;
              vec3 ePat = texture2D(uJuvenilePatternMap, erodeUV).rgb;
              float eDist = squaredDist(ePat, jRef);
              if (eDist > ZONE_THRESHOLD) {
                isEroded = true;
                break;
              }
            }
          }

          if (!isEroded) {
            float minChan = min(baseColor.r, min(baseColor.g, baseColor.b));

            if (minChan < 0.1) {
              baseColor = vec3(0.0);
              surfaceVis = 0.0;
            } else {
              float brightness = clamp(max(baseColor.r, max(baseColor.g, baseColor.b)), 0.0, 1.0);
              float nonBleedFactor = 1.0 - brightness * brightness;
              baseColor = mix(vec3(nonBleedFactor), vec3(1.0), bleed.rgb);
              surfaceVis = max(surfaceVis, 0.5);
            }
          }
        }
      }
    }

    // --- RAC Processing ---
    float roughness = 0.75;
    float albedoMul = 1.0;
    float cavity = 1.0;
    if (uHasRACMap) {
      vec4 rac = texture2D(uRACMap, vUv);
      roughness = 0.9;
      albedoMul = rac.g;
      cavity = rac.b;
    }
    // Minimum albedo floor so black zones still receive lighting and show normal map detail
    // Minimum albedo floor so black zones still receive lighting and show normal map detail
    vec3 albedo = max(baseColor, vec3(0.06)) * albedoMul * cavity;

    // --- Normal Mapping ---
    vec3 geomNormal = normalize(vNormal);
    mat3 TBN = computeTBN(geomNormal, vWorldPosition, vUv);
    vec3 baseNormalTex = texture2D(uNormalMap, vUv).rgb * 2.0 - 1.0;
    vec3 detailNormalTex = texture2D(uDetailNormalMap, vUv * uDetailScale).rgb * 2.0 - 1.0;
    vec3 blendedTangentNormal = normalize(vec3(
      baseNormalTex.xy + detailNormalTex.xy,
      baseNormalTex.z
    ));
    vec3 N = normalize(TBN * blendedTangentNormal);

    // --- Lighting ---
    vec3 L = normalize(uLightDir);
    vec3 V = normalize(vViewDir);

    // Wrap lighting: softens the shadow terminator so it bleeds around the surface
    float wrap = 0.4;
    float NdotL = max((dot(N, L) + wrap) / (1.0 + wrap), 0.0);
    vec3 diffuse = albedo * NdotL * uLightColor;

    float sss = max(0.0, dot(-V, L)) * uSubsurfaceIntensity;
    vec3 subsurface = albedo * sss * vec3(1.0, 0.6, 0.4);

    float spec = ggxSpecular(N, V, L, roughness);
    vec3 specular = uLightColor * spec * (1.0 - roughness) * 0.15 * surfaceVis;

    vec3 ambient = albedo * uAmbientIntensity;

    float rim = 1.0 - max(dot(N, V), 0.0);
    rim = pow(rim, 4.0) * 0.02;
    vec3 rimLight = uLightColor * rim * surfaceVis;

    vec3 finalColor = diffuse + specular + ambient + subsurface + rimLight;

    gl_FragColor = vec4(finalColor, 1.0);
  }
`;

export function createDinoSkinUniforms() {
  const noBleed = new THREE.Vector4(0, 0, 0, -1);
  return {
    uColor1: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uColor2: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uColor3: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uColor4: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uColor5: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uColor6: { value: new THREE.Vector3(0.5, 0.5, 0.5) },
    uPatternMap: { value: null as THREE.Texture | null },
    uRACMap: { value: null as THREE.Texture | null },
    uNormalMap: { value: null as THREE.Texture | null },
    uDetailNormalMap: { value: null as THREE.Texture | null },
    uJuvenilePatternMap: { value: null as THREE.Texture | null },
    uHasJuvenilePattern: { value: false },
    uBleed1: { value: noBleed.clone() },
    uBleed2: { value: noBleed.clone() },
    uBleed3: { value: noBleed.clone() },
    uBleed4: { value: noBleed.clone() },
    uBleed5: { value: noBleed.clone() },
    uBleed6: { value: noBleed.clone() },
    uDetailScale: { value: 12.0 },
    uLightDir: { value: new THREE.Vector3(0.4, 0.8, 0.4).normalize() },
    uLightColor: { value: new THREE.Vector3(1.0, 0.95, 0.9) },
    uAmbientIntensity: { value: 0.6 },
    uSubsurfaceIntensity: { value: 0.06 },
    uHasRACMap: { value: false },
    uTexelSize: { value: new THREE.Vector2(1.0 / 2048.0, 1.0 / 2048.0) },
    uFlipV: { value: false },
  };
}

export function hexToLinearRGB(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const toLinear = (c: number) => c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [toLinear(r), toLinear(g), toLinear(b)];
}
