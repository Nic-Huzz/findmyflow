import React from "react";
import { useCurrentFrame } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  years: number;
  fillDurationInFrames?: number;
  startLabel?: string;
  endLabel?: string;
  exitAtFrame?: number;
};

export const TimelineBar: React.FC<Props> = ({
  years,
  fillDurationInFrames = 45,
  startLabel = "Started",
  endLabel = "Blow Up",
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();

  // Container fade in
  const containerOpacity = lerp(frame, [0, 12], [0, 1], EASE.out);

  // Bar fill
  const barProgress = lerp(frame, [12, 12 + fillDurationInFrames], [0, 100], EASE.out);

  // Year counter ticks up
  const displayYears = Math.floor(
    lerp(frame, [12, 12 + fillDurationInFrames], [0, years], EASE.out)
  );

  // Labels
  const startLabelOpacity = lerp(frame, [0, 12], [0, 1], EASE.out);
  const endLabelOpacity = lerp(
    frame,
    [12 + fillDurationInFrames - 10, 12 + fillDurationInFrames],
    [0, 1],
    EASE.out
  );

  // Year counter scale pop at completion
  const yearScale =
    barProgress > 95
      ? 1 + Math.sin((frame - (12 + fillDurationInFrames)) * 0.15) * 0.03
      : 1;

  // Exit
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 10], [1, 0], EASE.in);

  return (
    <div
      style={{
        ...glassCard(0.8),
        opacity: containerOpacity * exitOpacity,
        padding: "44px 52px 36px",
        width: "100%",
        borderRadius: 28,
      }}
    >
      {/* Year counter — centered above bar */}
      <div
        style={{
          textAlign: "center",
          marginBottom: 24,
          transform: `scale(${yearScale})`,
        }}
      >
        <span
          style={{
            fontFamily: inter,
            fontSize: 72,
            fontWeight: 900,
            color: VR.gold,
          }}
        >
          {displayYears}
        </span>
        <span
          style={{
            fontFamily: inter,
            fontSize: 32,
            fontWeight: 400,
            color: `${VR.bone}70`,
            marginLeft: 10,
          }}
        >
          years
        </span>
      </div>

      {/* Bar track */}
      <div
        style={{
          height: 12,
          borderRadius: 6,
          background: `${VR.white}0a`,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${barProgress}%`,
            borderRadius: 6,
            background: `linear-gradient(90deg, ${VR.purple}, ${VR.gold})`,
            boxShadow: `0 0 24px ${VR.gold}50`,
          }}
        />
      </div>

      {/* Labels */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginTop: 16,
          fontFamily: inter,
          fontSize: 26,
          fontWeight: 700,
        }}
      >
        <span style={{ color: VR.gray[600], opacity: startLabelOpacity }}>
          {startLabel}
        </span>
        <span style={{ color: VR.gold, opacity: endLabelOpacity }}>
          {endLabel}
        </span>
      </div>
    </div>
  );
};
