import React from "react";
import { AbsoluteFill } from "remotion";
import { BRAND } from "../brand";
import { Circle } from "../components/Circle";

const CX = 960;
const CY = 540;
const SPREAD = 250;

export const ThreeCircles: React.FC = () => {
  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      {/* Skills - top left */}
      <Circle
        label="Your Skills"
        color={BRAND.skills}
        x={CX - SPREAD * 0.65}
        y={CY - SPREAD * 0.4}
        enterFrame={15}
        size={360}
      />

      {/* Problems - top right */}
      <Circle
        label="Problems You Solve"
        color={BRAND.problems}
        x={CX + SPREAD * 0.65}
        y={CY - SPREAD * 0.4}
        enterFrame={50}
        size={360}
      />

      {/* People - bottom center */}
      <Circle
        label="Your People"
        color={BRAND.people}
        x={CX}
        y={CY + SPREAD * 0.55}
        enterFrame={85}
        size={360}
      />
    </AbsoluteFill>
  );
};
