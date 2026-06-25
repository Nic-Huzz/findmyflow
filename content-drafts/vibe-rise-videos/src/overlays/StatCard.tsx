import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  value: number;
  label: string;
  prefix?: string;
  suffix?: string;
  tickDurationInFrames?: number;
  exitAtFrame?: number;
};

export const StatCard: React.FC<Props> = ({
  value,
  label,
  prefix = "",
  suffix = "",
  tickDurationInFrames = 30,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: spring up
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 160, mass: 0.5 },
  });

  // Counter tick
  const displayValue = Math.floor(
    lerp(frame, [5, 5 + tickDurationInFrames], [0, value], EASE.out)
  );

  // Exit
  const exitY = lerp(frame, [exitAtFrame, exitAtFrame + 15], [0, -60], EASE.in);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 15], [1, 0], EASE.in);

  return (
    <div
      style={{
        ...glassCard(0.85),
        transform: `translateY(${(1 - enterProgress) * 60 + exitY}px)`,
        opacity: enterProgress * exitOpacity,
        padding: "48px 80px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        borderRadius: 28,
      }}
    >
      <span
        style={{
          fontFamily: inter,
          fontSize: 96,
          fontWeight: 900,
          color: VR.gold,
          lineHeight: 1,
        }}
      >
        {prefix}
        {displayValue}
        {suffix}
      </span>
      <span
        style={{
          fontFamily: inter,
          fontSize: 30,
          fontWeight: 400,
          color: `${VR.bone}80`,
          letterSpacing: 2,
        }}
      >
        {label}
      </span>
    </div>
  );
};
