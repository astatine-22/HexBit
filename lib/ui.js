/**
 * Presentation metadata shared by the shelf, detail, workspace, and progress
 * views. Kept out of the data layer so challenges stay backend-agnostic.
 */

export const DIFFICULTY = {
  easy: {
    label: "Easy",
    hex: "#4da97b",
    hexBright: "#7bddaa",
    badge:
      "bg-[#e3f2e9] text-[#1f6a48] ring-[#2f7d58]/15",
    badgeDark:
      "bg-[#173a2c] text-[#8fe0b7] ring-[#8fe0b7]/20",
    dot: "bg-[#4da97b]",
  },
  medium: {
    label: "Medium",
    hex: "#c0952f",
    hexBright: "#e7c266",
    badge:
      "bg-[#f7eed6] text-[#7b5a12] ring-[#8a6718]/15",
    badgeDark:
      "bg-[#3b3115] text-[#e7c266] ring-[#e7c266]/20",
    dot: "bg-[#c0952f]",
  },
  hard: {
    label: "Hard",
    hex: "#bf5741",
    hexBright: "#ee917c",
    badge:
      "bg-[#f7e3dd] text-[#8a3523] ring-[#8a3523]/15",
    badgeDark:
      "bg-[#3d1f19] text-[#ee917c] ring-[#ee917c]/20",
    dot: "bg-[#bf5741]",
  },
};

export function getDifficulty(difficulty) {
  return DIFFICULTY[difficulty] ?? DIFFICULTY.easy;
}

export const LANGUAGE_META = {
  python: {
    label: "Python",
    glyph: "Py",
    ext: "py",
    monaco: "python",
    cover: { from: "#204b41", to: "#0c2722", accent: "#9fd8c2" },
  },
  javascript: {
    label: "JavaScript",
    glyph: "JS",
    ext: "js",
    monaco: "javascript",
    cover: { from: "#4a3c14", to: "#221b06", accent: "#f0d06a" },
  },
  java: {
    label: "Java",
    glyph: "Jv",
    ext: "java",
    monaco: "java",
    cover: { from: "#4a2a1d", to: "#25110a", accent: "#e8a07c" },
  },
  c: {
    label: "C",
    glyph: "C",
    ext: "c",
    monaco: "c",
    cover: { from: "#2c3540", to: "#111820", accent: "#a9c3d6" },
  },
  cpp: {
    label: "C++",
    glyph: "C++",
    ext: "cpp",
    monaco: "cpp",
    cover: { from: "#2a3150", to: "#11152a", accent: "#aeb8e6" },
  },
  go: {
    label: "Go",
    glyph: "Go",
    ext: "go",
    monaco: "go",
    cover: { from: "#12404d", to: "#072129", accent: "#83d5e4" },
  },
  ruby: {
    label: "Ruby",
    glyph: "Rb",
    ext: "rb",
    monaco: "ruby",
    cover: { from: "#4b1f2a", to: "#250c13", accent: "#e79aab" },
  },
  php: {
    label: "PHP",
    glyph: "PHP",
    ext: "php",
    monaco: "php",
    cover: { from: "#33284a", to: "#161025", accent: "#b6a6de" },
  },
  typescript: {
    label: "TypeScript",
    glyph: "TS",
    ext: "ts",
    monaco: "typescript",
    cover: { from: "#1e3956", to: "#0a1b2d", accent: "#8fc3ec" },
  },
  rust: {
    label: "Rust",
    glyph: "Rs",
    ext: "rs",
    monaco: "rust",
    cover: { from: "#4b2a15", to: "#251105", accent: "#eaa477" },
  },
};

export function getLanguage(language) {
  return LANGUAGE_META[language] ?? LANGUAGE_META.python;
}

export function coverStyle(language) {
  const cover = getLanguage(language).cover;
  return {
    "--cover-from": cover.from,
    "--cover-to": cover.to,
  };
}