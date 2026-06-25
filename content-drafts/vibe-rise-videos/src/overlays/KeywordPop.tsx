import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";

type Props = {
  word: string;
  subtitle?: string;
  color?: "gold" | "purple" | "white";
  exitAtFrame?: number;
};

export const KeywordPop: React.FC<Props> = ({
  word,
  subtitle,
  color = "gold",
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const colorMap = {
    gold: `linear-gradient(135deg, ${VR.gold} 0%, ${VR.goldBright} 100%)`,
    purple: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.purpleBright} 100%)`,
    white: `linear-gradient(135deg, ${VR.white} 0%, ${VR.bone} 100%)`,
  };

  const glowMap = {
    gold: `${VR.gold}70`,
    purple: `${VR.purple}70`,
    white: `${VR.white}30`,
  };

  // Enter: overshoot scale
  const enterScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.5 },
  });

  // Subtle pulse while visible
  const pulse = 1 + Math.sin(frame * 0.12) * 0.02;

  // Subtitle fade
  const subtitleOpacity = lerp(frame, [10, 20], [0, 1], EASE.out);
  const subtitleY = lerp(frame, [10, 20], [20, 0], EASE.out);

  // Exit: scale up and fade
  const exitScale = lerp(frame, [exitAtFrame, exitAtFrame + 10], [1, 1.4], EASE.out);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 10], [1, 0], EASE.in);

  return (
    <div
      style={{
        transform: `scale(${enterScale * pulse * exitScale})`,
        opacity: exitOpacity,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
      }}
    >
      {/* Main keyword */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 140,
          fontWeight: 900,
          letterSpacing: -3,
          background: colorMap[color],
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          textAlign: "center",
          lineHeight: 1,
          filter: `drop-shadow(0 6px 40px ${glowMap[color]})`,
        }}
      >
        {word}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <div
          style={{
            fontFamily: inter,
            fontSize: 36,
            fontWeight: 700,
            color: `${VR.bone}90`,
            letterSpacing: 6,
            textTransform: "uppercase" as const,
            opacity: subtitleOpacity,
            transform: `translateY(${subtitleY}px)`,
            textAlign: "center",
          }}
        >
          {subtitle}
        </div>
      )}
    </div>
  );
};
