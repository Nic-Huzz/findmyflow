import { interpolate, Easing } from "remotion";

export const lerp = (
  frame: number,
  range: [number, number],
  output: [number, number],
  easing?: (t: number) => number
) =>
  interpolate(frame, range, output, {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing,
  });

export const EASE = {
  out: Easing.bezier(0.16, 1, 0.3, 1),
  in: Easing.bezier(0.7, 0, 0.84, 0),
  inOut: Easing.bezier(0.87, 0, 0.13, 1),
  overshoot: Easing.bezier(0.34, 1.56, 0.64, 1),
  snap: Easing.bezier(0.075, 0.82, 0.165, 1),
  dramatic: Easing.bezier(0.6, 0.01, 0.05, 0.95),
  smooth: Easing.bezier(0.4, 0, 0.2, 1),
};

// Vibe Rise brand colours
export const VR = {
  ink: "#06030f",
  purple: "#5e17eb",
  purpleBright: "#8b5cf6",
  purpleDim: "#3b0f94",
  gold: "#E9A23B",
  goldBright: "#f5c45a",
  bone: "#efe6d4",
  boneDim: "#b7ad99",
  green: "#10b981",
  white: "#ffffff",
  gray: {
    600: "#52525b",
    700: "#3f3f46",
    800: "#27272a",
    900: "#18181b",
    950: "#0c0c0d",
  },
};
