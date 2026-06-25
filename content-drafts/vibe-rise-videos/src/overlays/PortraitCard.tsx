import React from "react";
import { Img, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter, fraunces } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  name: string;
  oneLiner: string;
  portraitSrc: string;
  exitAtFrame?: number;
};

export const PortraitCard: React.FC<Props> = ({
  name,
  oneLiner,
  portraitSrc,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: slide from right
  const enterProgress = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 140, mass: 0.6 },
  });

  // Exit: slide back right
  const exitX = lerp(frame, [exitAtFrame, exitAtFrame + 18], [0, 400], EASE.in);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 12], [1, 0], EASE.in);

  const translateX = (1 - enterProgress) * 400 + exitX;

  // Staggered content
  const nameOpacity = lerp(frame, [8, 20], [0, 1], EASE.out);
  const nameY = lerp(frame, [8, 20], [12, 0], EASE.out);
  const linerOpacity = lerp(frame, [14, 26], [0, 1], EASE.out);
  const linerY = lerp(frame, [14, 26], [8, 0], EASE.out);

  // Portrait glow
  const glowPulse = Math.sin(frame * 0.06) * 0.12 + 0.28;

  return (
    <div
      style={{
        ...glassCard(),
        transform: `translateX(${translateX}px)`,
        opacity: exitOpacity,
        padding: "24px 28px",
        width: 340,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
      }}
    >
      {/* Portrait with glow */}
      <div style={{ position: "relative" }}>
        <div
          style={{
            position: "absolute",
            inset: -20,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${VR.gold}${Math.floor(glowPulse * 255)
              .toString(16)
              .padStart(2, "0")} 0%, transparent 60%)`,
          }}
        />
        <div
          style={{
            width: 120,
            height: 120,
            borderRadius: 16,
            overflow: "hidden",
            border: `2px solid ${VR.gold}50`,
            position: "relative",
          }}
        >
          <Img
            src={staticFile(portraitSrc)}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>

      {/* Name */}
      <div
        style={{
          fontFamily: inter,
          fontSize: 28,
          fontWeight: 900,
          color: VR.white,
          opacity: nameOpacity,
          transform: `translateY(${nameY}px)`,
          textAlign: "center",
        }}
      >
        {name}
      </div>

      {/* One-liner */}
      <div
        style={{
          fontFamily: fraunces,
          fontSize: 16,
          fontWeight: 300,
          fontStyle: "italic",
          color: `${VR.bone}80`,
          opacity: linerOpacity,
          transform: `translateY(${linerY}px)`,
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        "{oneLiner}"
      </div>
    </div>
  );
};
