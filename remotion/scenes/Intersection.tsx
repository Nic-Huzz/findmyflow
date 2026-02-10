import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { BRAND, FONTS } from "../brand";
import { Circle } from "../components/Circle";

const CX = 960;
const CY = 480;

export const Intersection: React.FC<{
  title: string;
  subtitle: string;
}> = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Circles converge over first 60 frames
  const converge = interpolate(frame, [0, 60], [1, 0], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  const spread = 250;
  const overlap = 140;
  const currentSpread = overlap + (spread - overlap) * converge;

  // Center glow appears after convergence
  const glowScale = spring({
    frame: frame - 70,
    fps,
    config: BRAND.springPlayful,
  });

  // Title appears
  const titleProgress = spring({
    frame: frame - 100,
    fps,
    config: BRAND.springSmooth,
  });

  // Subtitle follows
  const subtitleOpacity = interpolate(frame, [140, 170], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      {/* Skills - top left */}
      <Circle
        label="Your Skills"
        color={BRAND.skills}
        x={CX - currentSpread * 0.65}
        y={CY - currentSpread * 0.4}
        enterFrame={-100}
        size={360}
        glowIntensity={0.3}
      />

      {/* Problems - top right */}
      <Circle
        label="Problems You Solve"
        color={BRAND.problems}
        x={CX + currentSpread * 0.65}
        y={CY - currentSpread * 0.4}
        enterFrame={-100}
        size={360}
        glowIntensity={0.3}
      />

      {/* People - bottom center */}
      <Circle
        label="Your People"
        color={BRAND.people}
        x={CX}
        y={CY + currentSpread * 0.55}
        enterFrame={-100}
        size={360}
        glowIntensity={0.3}
      />

      {/* Center intersection glow */}
      <div
        style={{
          position: "absolute",
          left: CX - 100,
          top: CY - 60,
          width: 200,
          height: 200,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.gold}, ${BRAND.gold}44, transparent)`,
          transform: `scale(${Math.min(glowScale, 1)})`,
          opacity: Math.min(glowScale, 1),
          filter: "blur(20px)",
        }}
      />

      {/* Title text */}
      <div
        style={{
          position: "absolute",
          top: CY + 240,
          left: 0,
          right: 0,
          textAlign: "center",
          opacity: Math.min(titleProgress, 1),
          transform: `scale(${0.8 + Math.min(titleProgress, 1) * 0.2})`,
        }}
      >
        <div
          style={{
            fontSize: 72,
            fontFamily: FONTS.serif,
            color: BRAND.gold,
            textShadow: `0 0 30px ${BRAND.gold}66`,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 30,
            fontFamily: FONTS.sans,
            color: `${BRAND.white}cc`,
            marginTop: 16,
            opacity: subtitleOpacity,
            fontWeight: 300,
          }}
        >
          {subtitle}
        </div>
      </div>
    </AbsoluteFill>
  );
};
