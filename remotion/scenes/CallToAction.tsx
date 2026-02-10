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

export const CallToAction: React.FC<{
  headline: string;
  url: string;
}> = ({ headline, url }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Headline spring
  const headlineProgress = spring({
    frame: frame - 10,
    fps,
    config: BRAND.springSmooth,
  });

  // URL fades in after headline
  const urlOpacity = interpolate(frame, [50, 80], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // Gold shimmer on URL
  const shimmerX = interpolate(frame, [80, 160], [-100, 200], {
    extrapolateRight: "clamp",
    extrapolateLeft: "clamp",
  });

  return (
    <AbsoluteFill>
      <GradientBackground
        fromColor={BRAND.purpleDark}
        toColor={BRAND.gold}
        startAngle={135}
        endAngle={200}
      />

      <AbsoluteFill
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 40,
        }}
      >
        {/* Headline */}
        <div
          style={{
            fontSize: 76,
            fontFamily: FONTS.serif,
            color: BRAND.white,
            textAlign: "center",
            opacity: Math.min(headlineProgress, 1),
            transform: `scale(${0.85 + Math.min(headlineProgress, 1) * 0.15})`,
            textShadow: "0 4px 20px rgba(0,0,0,0.3)",
            maxWidth: 1200,
          }}
        >
          {headline}
        </div>

        {/* URL with shimmer */}
        <div
          style={{
            position: "relative",
            opacity: urlOpacity,
          }}
        >
          <div
            style={{
              fontSize: 36,
              fontFamily: FONTS.sans,
              color: BRAND.goldLight,
              fontWeight: 600,
              letterSpacing: 2,
              textShadow: `0 0 20px ${BRAND.gold}44`,
            }}
          >
            {url}
          </div>
          {/* Shimmer overlay */}
          <div
            style={{
              position: "absolute",
              inset: -10,
              background: `linear-gradient(90deg, transparent, ${BRAND.white}22, transparent)`,
              transform: `translateX(${shimmerX}%)`,
              pointerEvents: "none",
            }}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
