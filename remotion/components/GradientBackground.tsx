import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";

export const GradientBackground: React.FC<{
  fromColor: string;
  toColor: string;
  startAngle?: number;
  endAngle?: number;
}> = ({ fromColor, toColor, startAngle = 135, endAngle }) => {
  const frame = useCurrentFrame();

  const angle = endAngle
    ? interpolate(frame, [0, 120], [startAngle, endAngle], {
        extrapolateRight: "clamp",
      })
    : startAngle;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(${angle}deg, ${fromColor}, ${toColor})`,
      }}
    />
  );
};
