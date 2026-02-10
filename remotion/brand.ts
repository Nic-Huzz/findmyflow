import { loadFont as loadSerif } from "@remotion/google-fonts/DMSerifDisplay";
import { loadFont as loadSans } from "@remotion/google-fonts/PlusJakartaSans";

const { fontFamily: serifFamily } = loadSerif();
const { fontFamily: sansFamily } = loadSans();

export const FONTS = {
  serif: serifFamily,
  sans: sansFamily,
};

export const BRAND = {
  // Core palette
  purple: "#5e17eb",
  purpleLight: "#8b5cf6",
  purpleDark: "#3b0a99",
  gold: "#E9A23B",
  goldLight: "#f5c469",
  white: "#ffffff",
  dark: "#0f0a1a",

  // Circle colors (for Nikigai diagram)
  skills: "#8b5cf6", // Purple - what you're great at
  problems: "#E9A23B", // Gold - what problems you solve
  people: "#10b981", // Green - who needs you

  // Spring configs
  springPlayful: { damping: 12, mass: 0.5, stiffness: 120 },
  springSmooth: { damping: 20, mass: 1, stiffness: 100 },
  springSnappy: { damping: 15, mass: 0.3, stiffness: 200 },
};

export const VIDEO = {
  width: 1920,
  height: 1080,
  fps: 30,
};
