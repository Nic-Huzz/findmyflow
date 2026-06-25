import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  seriesName?: string;
  tagline?: string;
  variant?: "intro" | "outro";
  exitAtFrame?: number;
};

export const SeriesBumper: React.FC<Props> = ({
  seriesName = "HOW THEY PAID RENT",
  tagline = "VIBE RISE",
  variant = "intro",
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: slide up
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.6 },
  });
  const enterY = (1 - enterProgress) * 120;
  const enterOpacity = enterProgress;

  // Exit: slide up and fade
  const exitY = lerp(frame, [exitAtFrame, exitAtFrame + 12], [0, -100], EASE.in);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 12], [1, 0], EASE.in);

  // Staggered content
  const lineWidth = lerp(frame, [15, 35], [0, 200], EASE.out);
  const taglineOpacity = lerp(frame, [25, 40], [0, 1], EASE.out);

  return (
    <div
      style={{
        ...glassCard(0.8),
        transform: `translateY(${enterY + exitY}px)`,
        opacity: enterOpacity * exitOpacity,
        padding: "60px 100px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 24,
        borderRadius: 32,
      }}
    >
      {/* Series name */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 42,
          fontWeight: 900,
          letterSpacing: 10,
          color: VR.gold,
          textAlign: "center",
        }}
      >
        {seriesName}
      </div>

      {/* Decorative line */}
      <div
        style={{
          width: lineWidth,
          height: 3,
          background: `linear-gradient(90deg, transparent, ${VR.gold}, transparent)`,
          borderRadius: 2,
        }}
      />

      {/* Tagline */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 28,
          fontWeight: 400,
          letterSpacing: 8,
          color: `${VR.bone}70`,
          opacity: taglineOpacity,
        }}
      >
        {tagline}
      </div>
    </div>
  );
};
