import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { BRAND } from "../brand";
import { KineticText } from "../components/KineticText";

export const HookStatement: React.FC<{
  text: string;
}> = ({ text }) => {
  const frame = useCurrentFrame();

  // Background slowly warms from dark to purple
  const bgLightness = interpolate(frame, [0, 100], [0, 0.15], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: BRAND.dark,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 120,
      }}
    >
      {/* Subtle purple wash */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(ellipse at center, ${BRAND.purple}${Math.round(bgLightness * 255).toString(16).padStart(2, "0")}, transparent)`,
        }}
      />

      <KineticText
        text={text}
        startFrame={10}
        mode="word-by-word"
        staggerDelay={5}
        fontSize={68}
        fontFamily="serif"
        style={{ maxWidth: 1400, textAlign: "center" }}
      />
    </AbsoluteFill>
  );
};
