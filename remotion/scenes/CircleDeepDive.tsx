import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { Circle } from "../components/Circle";

export const CircleDeepDive: React.FC<{
  label: string;
  color: string;
  examples: string[];
}> = ({ label, color, examples }) => {
  const frame = useCurrentFrame();

  // Background shifts to circle's color (subtle)
  const bgTint = interpolate(frame, [0, 30], [0, 0.12], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      {/* Color tint */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${color}${Math.round(bgTint * 255).toString(16).padStart(2, "0")}, transparent)`,
        }}
      />

      <Circle
        label={label}
        color={color}
        x={960}
        y={440}
        size={400}
        enterFrame={0}
        glowIntensity={0.5}
        examples={examples}
        showExamples
        examplesStartFrame={25}
      />
    </AbsoluteFill>
  );
};
