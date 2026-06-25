import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";

type Props = {
  name: string;
  title: string;
  exitAtFrame?: number;
};

export const LowerThird: React.FC<Props> = ({
  name,
  title,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Gold accent bar slides in from left
  const barWidth = lerp(frame, [0, 18], [0, 8], EASE.out);
  const barHeight = lerp(frame, [0, 22], [0, 150], EASE.out);

  // Container slides in from left
  const enterX = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100, mass: 0.7 },
  });
  const translateX = (1 - enterX) * -800;

  // Staggered text
  const nameOpacity = lerp(frame, [8, 18], [0, 1], EASE.out);
  const nameY = lerp(frame, [8, 18], [24, 0], EASE.out);
  const titleOpacity = lerp(frame, [14, 24], [0, 1], EASE.out);
  const titleY = lerp(frame, [14, 24], [16, 0], EASE.out);

  // Exit: slide left
  const exitX = lerp(frame, [exitAtFrame, exitAtFrame + 15], [0, -800], EASE.in);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 10], [1, 0], EASE.in);

  return (
    <div
      style={{
        transform: `translateX(${translateX + exitX}px)`,
        opacity: exitOpacity,
        display: "flex",
        alignItems: "stretch",
        gap: 0,
      }}
    >
      {/* Gold accent bar */}
      <div
        style={{
          width: barWidth,
          height: barHeight,
          background: `linear-gradient(to bottom, ${VR.gold}, ${VR.purple})`,
          borderRadius: "5px 0 0 5px",
          flexShrink: 0,
        }}
      />

      {/* Content panel */}
      <div
        style={{
          background: `rgba(6, 3, 15, 0.9)`,
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderRadius: "0 24px 24px 0",
          padding: "36px 72px 36px 40px",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap: 10,
          boxShadow: "0 12px 60px rgba(0, 0, 0, 0.7)",
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 56,
            fontWeight: 900,
            color: VR.white,
            opacity: nameOpacity,
            transform: `translateY(${nameY}px)`,
            letterSpacing: -1,
          }}
        >
          {name}
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 28,
            fontWeight: 700,
            color: VR.gold,
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            letterSpacing: 4,
            textTransform: "uppercase" as const,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
};
