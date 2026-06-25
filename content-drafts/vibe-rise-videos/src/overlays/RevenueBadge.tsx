import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { inter, MODEL_LABELS, MODEL_EMOJI } from "../HowTheyPaidRent";
import { glassCard } from "./styles";

type Props = {
  revenueModel: string;
  label?: string;
  emoji?: string;
  exitAtFrame?: number;
};

export const RevenueBadge: React.FC<Props> = ({
  revenueModel,
  label,
  emoji,
  exitAtFrame = 9999,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Enter: spring scale
  const enterScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  // Exit: scale down + fade
  const exitScale = lerp(frame, [exitAtFrame, exitAtFrame + 12], [1, 0.6], EASE.in);
  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 12], [1, 0], EASE.in);

  const displayLabel = label || MODEL_LABELS[revenueModel] || revenueModel;
  const displayEmoji = emoji || MODEL_EMOJI[revenueModel] || "💼";

  return (
    <div
      style={{
        ...glassCard(0.88),
        transform: `scale(${enterScale * exitScale})`,
        opacity: exitOpacity,
        display: "flex",
        alignItems: "center",
        gap: 28,
        padding: "48px 72px",
        borderRadius: 28,
      }}
    >
      <span style={{ fontSize: 72 }}>{displayEmoji}</span>
      <span
        style={{
          fontFamily: inter,
          fontSize: 44,
          fontWeight: 900,
          color: VR.gold,
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
};
