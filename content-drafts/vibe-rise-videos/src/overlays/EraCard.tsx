import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  year: string;
  description: string;
  showGrain?: boolean;
  exitAtFrame?: number;
};

export const EraCard: React.FC<Props> = ({
  year,
  description,
  showGrain = false,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: slide from left
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.6 },
  });
  const enterX = (1 - enterProgress) * -400;

  // Left accent bar grows
  const barHeight = lerp(frame, [5, 30], [0, 140], EASE.out);

  // Year chars stagger
  const yearChars = year.split("");

  // Description words fade in
  const words = description.split(" ");

  // Exit
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 15], [1, 0], EASE.in);
  const exitX = lerp(frame, [exitAtFrame, exitAtFrame + 15], [0, -200], EASE.in);

  return (
    <div
      style={{
        ...glassCard(0.85),
        transform: `translateX(${enterX + exitX}px)`,
        opacity: exitOpacity,
        padding: "44px 52px",
        display: "flex",
        gap: 28,
        maxWidth: 800,
        borderRadius: 28,
      }}
    >
      {/* Left accent bar */}
      <div
        style={{
          width: 5,
          height: barHeight,
          borderRadius: 3,
          background: `linear-gradient(to bottom, ${VR.purple}, ${VR.gold})`,
          flexShrink: 0,
          marginTop: 6,
        }}
      />

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Year — per-character spring */}
        <div style={{ display: "flex", gap: 4 }}>
          {yearChars.map((char, i) => {
            const charProgress = spring({
              frame: frame - 3 - i * 3,
              fps,
              config: { damping: 14, stiffness: 200, mass: 0.5 },
            });
            return (
              <span
                key={`year-${i}`}
                style={{
                  fontFamily: inter,
                  fontSize: 64,
                  fontWeight: 900,
                  color: VR.gold,
                  display: "inline-block",
                  transform: `translateY(${(1 - charProgress) * 30}px)`,
                  opacity: charProgress,
                }}
              >
                {char}
              </span>
            );
          })}
        </div>

        {/* Description — word reveal */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px 10px",
            lineHeight: 1.5,
          }}
        >
          {words.map((word, i) => {
            const wordDelay = 12 + i * 2;
            const wordProgress = spring({
              frame: frame - wordDelay,
              fps,
              config: { damping: 18, stiffness: 180, mass: 0.6 },
            });
            return (
              <span
                key={`word-${i}`}
                style={{
                  fontFamily: inter,
                  fontSize: 32,
                  fontWeight: 400,
                  color: `${VR.bone}90`,
                  opacity: wordProgress,
                  transform: `translateY(${(1 - wordProgress) * 14}px)`,
                  display: "inline-block",
                }}
              >
                {word}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};
