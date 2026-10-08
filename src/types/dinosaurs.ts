export interface DinosaurData {
  name: string;
  folder: string;
  model: string;
  normalMap: string;
  patterns: {
    [key: number]: string;
  };
  juvenilePattern?: string;
  scale: number;
  position: [number, number, number];
  glbModel?: string;
  glbScale?: number;
  glbPosition?: [number, number, number];
  /** Camera start position [x,y,z] for the skin-creator viewer (looks at origin). */
  cameraStart?: [number, number, number];
  maskMap?: string;
  /** Overlay-mask colors composited above the pattern: [Red, Green, Blue] channels of maskMap. */
  overlayDefaults?: { color: string; alpha: number }[];
  racMap?: string;
  vfxMask?: string;
  detailScale?: number;
  defaultColors?: {
    color1: [number, number, number];
    color2: [number, number, number];
    color3: [number, number, number];
    color4: [number, number, number];
    color5: [number, number, number];
    color6: [number, number, number];
  };
}

// Trimmed to the 6 hero dinos shipped with the portfolio demo:
// Tyrannosaurus, Allosaurus, Carno, Cerato, Stego, Deino.
export const DINOSAURS: { [key: string]: DinosaurData } = {
  tyrannosaurus: {
    name: "Tyrannosaurus",
    folder: "Tyrannosaurus",
    model: "/SkinViewer/Tyrannosaurus/Tyrannosaurus.obj",
    normalMap: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_N.png",
    patterns: {
      1: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_Adult_Pattern_1.png",
      2: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_Adult_Pattern_2.png",
      3: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_Adult_Pattern_3.png",
    },
    juvenilePattern: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_Juvie_Pattern.png",
    scale: 0.01,
    position: [0, -2.4, 0],
    glbModel: "/SkinViewer/Tyrannosaurus/Tyrannosaurus.glb",
    glbScale: 0.0195,
    glbPosition: [0.0, -2.4, 0.0],
    maskMap: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_Detail_M.png",
    racMap: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_RAC.png",
    vfxMask: "/SkinViewer/Tyrannosaurus/T_Tyrannosaurus_VFX_M.png",
    detailScale: 12,
    defaultColors: {
      color1: [0.15, 0.038, 0.023],
      color2: [0.65, 0.455, 0.26],
      color3: [0.1, 0.068, 0.035],
      color4: [0.25, 0.178, 0.1],
      color5: [0.035, 0.028, 0.023],
      color6: [0.0, 0.0, 0.0],
    },
  },
  allosaurus: {
    name: "Allosaurus",
    folder: "Allosaurus",
    model: "/SkinViewer/Allosaurus/Allo.obj",
    normalMap: "/SkinViewer/Allosaurus/T_Allosaurus_N.png",
    patterns: {
      1: "/SkinViewer/Allosaurus/T_Allosaurus_Adult_Pattern_1.png",
      2: "/SkinViewer/Allosaurus/T_Allosaurus_Adult_Pattern_2.png",
      3: "/SkinViewer/Allosaurus/T_Allosaurus_Adult_Pattern_3.png",
    },
    juvenilePattern: "/SkinViewer/Allosaurus/T_Allosaurus_Juvenile_Pattern.png",
    scale: 0.014,
    position: [0, -2.4, 0],
    glbModel: "/SkinViewer/Allosaurus/Allosaurus.glb",
    glbScale: 0.0284,
    glbPosition: [0.0, -2.4, 0.0],
  },
  carno: {
    name: "Carno",
    folder: "Carno",
    model: "/SkinViewer/Carno/Carno.obj",
    normalMap: "/SkinViewer/Carno/T_Carno_Default_New_N.png",
    patterns: {
      1: "/SkinViewer/Carno/T_Carno_Adult_Male_Pattern_1.png",
      2: "/SkinViewer/Carno/T_Carno_Adult_Pattern_2.png",
      3: "/SkinViewer/Carno/T_Carnotaurus_Adult_Pattern_3.png",
    },
    juvenilePattern: "/SkinViewer/Carno/T_Carno_Juvie_Pattern.png",
    scale: 0.0125,
    position: [0, -2.4, 0],
    glbModel: "/SkinViewer/Carno/Carnotaurus.glb",
    glbScale: 0.0248,
    glbPosition: [0.0, -2.4, 0.0],
    maskMap: "/SkinViewer/Carno/T_Carno_Adult_Mouth-Claws-Teeth.png",
    overlayDefaults: [
      { color: "#0f0b06", alpha: 1.0 }, // R: 15,11,6
      { color: "#0d0d0d", alpha: 1.0 }, // G: 13,13,13
      { color: "#0d0d0d", alpha: 1.0 }, // B: 13,13,13
    ],
  },
  cerato: {
    name: "Cerato",
    folder: "Cerato",
    model: "/SkinViewer/Cerato/Cerato.obj",
    normalMap: "/SkinViewer/Cerato/T_Cerato_Adult_N.png",
    patterns: {
      1: "/SkinViewer/Cerato/T_Ceratosaurus_Adult_Pattern_1.png",
      2: "/SkinViewer/Cerato/T_Ceratosaurus_Adult_Pattern_2.png",
      3: "/SkinViewer/Cerato/T_Ceratosaurus_Adult_Pattern_3.png",
    },
    juvenilePattern: "/SkinViewer/Cerato/T_Ceratosaurus_Juvenile_Pattern.png",
    scale: 0.016,
    position: [0, -2.4, 0],
    glbModel: "/SkinViewer/Cerato/Ceratosaurus.glb",
    glbScale: 0.0332,
    glbPosition: [0.0, -2.4, 0.0],
    maskMap: "/SkinViewer/Cerato/T_Cerato_Adult_Mouth-Teeth-Claws.png",
    racMap: "/SkinViewer/Cerato/T_Cerato_Adult_RAC.png",
    vfxMask: "/SkinViewer/Cerato/T_Cerato_VFX_M.png",
    detailScale: 12,
    defaultColors: {
      color1: [1.0, 0.239, 0.0],
      color2: [1.0, 0.667, 0.4],
      color3: [0.545, 0.275, 0.149],
      color4: [0.796, 0.443, 0.251],
      color5: [0.184, 0.094, 0.051],
      color6: [0.0, 0.0, 0.0],
    },
  },
  stego: {
    name: "Stego",
    folder: "Stego",
    model: "/SkinViewer/Stego/Stego.obj",
    normalMap: "/SkinViewer/Stego/T_Stegosaurus_N.png",
    patterns: {
      1: "/SkinViewer/Stego/T_Stegosaurus_Adult_Pattern_1.png",
      2: "/SkinViewer/Stego/T_Stegosaurus_Adult_Pattern_2.png",
      3: "/SkinViewer/Stego/T_Stegosaurus_Adult_Pattern_3.png",
    },
    juvenilePattern: "/SkinViewer/Stego/T_Stegosaurus_Juvenile_Pattern.png",
    scale: 0.016,
    position: [0, -2.4, 0],
    glbModel: "/SkinViewer/Stego/Stegosaurus.glb",
    glbScale: 0.0252,
    glbPosition: [0.0, -2.4, 0.0],
    maskMap: "/SkinViewer/Stego/T_Stegosaurus_Detail_M.png",
    racMap: "/SkinViewer/Stego/T_Stegosaurus_RAC.png",
    vfxMask: "/SkinViewer/Stego/T_Stegosaurus_FX_M.png",
    detailScale: 12,
    defaultColors: {
      color1: [0.25, 0.083, 0.05],
      color2: [0.2, 0.154, 0.106],
      color3: [0.1, 0.1, 0.035],
      color4: [0.4, 0.236, 0.123],
      color5: [0.03, 0.03, 0.03],
      color6: [0.0, 0.0, 0.0],
    },
  },
  deino: {
    name: "Deino",
    folder: "Deino",
    model: "/SkinViewer/Deino/Deino.obj",
    normalMap: "/SkinViewer/Deino/T_Deinosuchus_N.png",
    patterns: {
      1: "/SkinViewer/Deino/T_Deinosuchus_Adult_Pattern_2.png",
      2: "/SkinViewer/Deino/T_Deinosuchus_Adult_Pattern_3.png",
      3: "/SkinViewer/Deino/T_Deinosuchus_Adult_Pattern_M.png",
    },
    juvenilePattern: "/SkinViewer/Deino/T_Deinosuchus_Juvie_Pattern.png",
    scale: 0.014,
    position: [0, -1, 0],
    glbModel: "/SkinViewer/Deino/Deinosuchus.glb",
    glbScale: 0.0282,
    glbPosition: [0.0, -0.55, 1.5],
  },
};
