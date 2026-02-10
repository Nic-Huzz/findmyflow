import React from "react";
import {
  AbsoluteFill,
  spring,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
} from "remotion";
import { BRAND, FONTS } from "../brand";
import { GradientBackground } from "../components/GradientBackground";

export const BrandIntro: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Title spring bounce
  const titleScale = spring({
    frame,
    fps,
    config: BRAND.springPlayful,
  });

  // Gradient wash - starts dark, washes in
  const gradientOpacity = interpolate(frame, [20, 70], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Tagline fade
  const taglineOpacity = interpolate(frame, [40, 65], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ backgroundColor: BRAND.dark }}>
      {/* Purple-gold gradient wash */}
      <AbsoluteFill style={{ opacity: gradientOpacity }}>
        <GradientBackground
          fromColor={BRAND.purpleDark}
          toColor={BRAND.purple}
          startAngle={135}
          endAngle={180}
        />
      </AbsoluteFill>

      {/* Glow orb behind title */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 400,
          height: 400,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${BRAND.purple}66, transparent)`,
          transform: `translate(-50%, -50%) scale(${Math.min(titleScale, 1)})`,
          filter: "blur(60px)",
        }}
      />

      {/* Title */}
      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontFamily: FONTS.serif,
            color: BRAND.white,
            transform: `scale(${Math.min(titleScale, 1.0)})`,
            textShadow: `0 0 40px ${BRAND.purple}88`,
          }}
        >
          FindMyFlow
        </div>
        <div
          style={{
            fontSize: 28,
            fontFamily: FONTS.sans,
            color: BRAND.goldLight,
            opacity: taglineOpacity,
            letterSpacing: 4,
            textTransform: "uppercase",
            fontWeight: 300,
          }}
        >
          Discover Your Nikigai
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
