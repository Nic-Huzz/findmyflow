import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONTS } from "../brand";

type Mode = "word-by-word" | "letter-by-letter" | "line-by-line";

export const KineticText: React.FC<{
  text: string;
  startFrame?: number;
  mode?: Mode;
  staggerDelay?: number;
  fontSize?: number;
  color?: string;
  fontFamily?: "serif" | "sans";
  lineHeight?: number;
  style?: React.CSSProperties;
}> = ({
  text,
  startFrame = 0,
  mode = "word-by-word",
  staggerDelay = 4,
  fontSize = 72,
  color = BRAND.white,
  fontFamily = "serif",
  lineHeight = 1.3,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const units =
    mode === "letter-by-letter"
      ? text.split("")
      : mode === "line-by-line"
        ? text.split("\n")
        : text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: mode === "letter-by-letter" ? 0 : 16,
        fontSize,
        fontFamily: fontFamily === "serif" ? FONTS.serif : FONTS.sans,
        color,
        lineHeight,
        ...style,
      }}
    >
      {units.map((unit, i) => {
        const unitStart = startFrame + i * staggerDelay;
        const progress = spring({
          frame: frame - unitStart,
          fps,
          config: BRAND.springPlayful,
        });

        const opacity = Math.min(progress, 1);
        const scale = interpolateSpring(progress, 0.7, 1);
        const translateY = interpolateSpring(progress, 20, 0);

        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity,
              transform: `scale(${scale}) translateY(${translateY}px)`,
              whiteSpace: mode === "letter-by-letter" ? "pre" : undefined,
            }}
          >
            {unit}
          </span>
        );
      })}
    </div>
  );
};

function interpolateSpring(progress: number, from: number, to: number): number {
  return from + (to - from) * Math.min(progress, 1);
}
