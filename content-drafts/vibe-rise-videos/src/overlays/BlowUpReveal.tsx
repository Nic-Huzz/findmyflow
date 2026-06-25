import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter, WordReveal } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  blowUpYear: string;
  blowUpMoment: string;
  exitAtFrame?: number;
};

export const BlowUpReveal: React.FC<Props> = ({
  blowUpYear,
  blowUpMoment,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Container entrance
  const containerProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 100, mass: 0.7 },
  });
  const containerScale = 0.85 + containerProgress * 0.15;

  // Year — per character kinetic
  const yearChars = blowUpYear.split("");

  // Eyebrow
  const eyebrowOpacity = lerp(frame, [0, 15], [0, 1], EASE.out);

  // Decorative line
  const lineWidth = lerp(frame, [18, 38], [0, 200], EASE.out);

  // Exit
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 20], [1, 0], EASE.in);
  const exitScale = lerp(frame, [exitAtFrame, exitAtFrame + 20], [1, 0.9], EASE.in);

  return (
    <div
      style={{
        ...glassCard(0.9),
        transform: `scale(${containerScale * exitScale})`,
        opacity: containerProgress * exitOpacity,
        padding: "60px 72px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 28,
        maxWidth: 900,
        borderRadius: 32,
      }}
    >
      {/* Eyebrow */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 8,
          textTransform: "uppercase" as const,
          color: VR.purple,
          opacity: eyebrowOpacity,
        }}
      >
        THE BLOW-UP MOMENT
      </div>

      {/* Year — per character spring */}
      <div style={{ display: "flex", gap: 8 }}>
        {yearChars.map((char, i) => {
          const charProgress = spring({
            frame: frame - 5 - i * 4,
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.7 },
          });
          return (
            <span
              key={`blow-year-${i}`}
              style={{
                fontSize: 120,
                fontWeight: 900,
                fontFamily: inter,
                letterSpacing: -2,
                background: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.gold} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                transform: `translateY(${(1 - charProgress) * 60}px) scale(${charProgress})`,
                opacity: charProgress,
              }}
            >
              {char}
            </span>
          );
        })}
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

      {/* Blow up moment description */}
      <div style={{ maxWidth: 750 }}>
        <WordReveal
          text={blowUpMoment}
          delay={22}
          fontSize={34}
          fontWeight={400}
          color={`${VR.bone}90`}
          maxWidth={750}
        />
      </div>
    </div>
  );
};
