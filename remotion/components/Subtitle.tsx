import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { BRAND, FONTS } from "../brand";

export const Subtitle: React.FC<{
  text: string;
  enterFrame?: number;
  fontSize?: number;
  color?: string;
  bottom?: number;
}> = ({
  text,
  enterFrame = 0,
  fontSize = 28,
  color = `${BRAND.white}cc`,
  bottom = 120,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const progress = spring({
    frame: frame - enterFrame,
    fps,
    config: BRAND.springSmooth,
  });

  const opacity = Math.min(progress, 1);

  return (
    <div
      style={{
        position: "absolute",
        bottom,
        left: 0,
        right: 0,
        textAlign: "center",
        opacity,
        transform: `translateY(${(1 - opacity) * 15}px)`,
        fontSize,
        fontFamily: FONTS.sans,
        color,
        fontWeight: 400,
        letterSpacing: 1,
      }}
    >
      {text}
    </div>
  );
};
