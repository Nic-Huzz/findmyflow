import React from "react";
import { spring, useCurrentFrame, useVideoConfig, interpolate } from "remotion";
import { BRAND, FONTS } from "../brand";

export const Circle: React.FC<{
  label: string;
  color: string;
  size?: number;
  enterFrame?: number;
  x: number;
  y: number;
  glowIntensity?: number;
  examples?: string[];
  showExamples?: boolean;
  examplesStartFrame?: number;
}> = ({
  label,
  color,
  size = 320,
  enterFrame = 0,
  x,
  y,
  glowIntensity = 0.4,
  examples = [],
  showExamples = false,
  examplesStartFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scaleProgress = spring({
    frame: frame - enterFrame,
    fps,
    config: BRAND.springPlayful,
  });

  const scale = Math.min(scaleProgress, 1);
  const opacity = Math.min(scaleProgress, 1);

  // Subtle pulse after landed
  const landed = frame - enterFrame > 20;
  const pulsePhase = landed ? Math.sin((frame - enterFrame) * 0.05) * 0.03 : 0;

  // Label fade in slightly after circle
  const labelOpacity = spring({
    frame: frame - enterFrame - 15,
    fps,
    config: BRAND.springSmooth,
  });

  return (
    <div
      style={{
        position: "absolute",
        left: x - size / 2,
        top: y - size / 2,
        width: size,
        height: size,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* Glow */}
      <div
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          background: color,
          opacity: opacity * glowIntensity * (1 + pulsePhase * 3),
          filter: `blur(${size * 0.3}px)`,
          transform: `scale(${scale + pulsePhase})`,
        }}
      />

      {/* Circle */}
      <div
        style={{
          position: "absolute",
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle at 40% 35%, ${color}cc, ${color}55)`,
          border: `2px solid ${color}88`,
          transform: `scale(${scale + pulsePhase})`,
          opacity,
        }}
      />

      {/* Label */}
      <div
        style={{
          position: "relative",
          zIndex: 1,
          opacity: Math.min(labelOpacity, 1),
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 32,
            fontFamily: FONTS.serif,
            color: BRAND.white,
            textShadow: "0 2px 8px rgba(0,0,0,0.5)",
          }}
        >
          {label}
        </div>
      </div>

      {/* Examples */}
      {showExamples &&
        examples.map((ex, i) => {
          const exFrame = examplesStartFrame + i * 12;
          const exProgress = spring({
            frame: frame - exFrame,
            fps,
            config: BRAND.springSmooth,
          });
          const exOpacity = Math.min(exProgress, 1);

          return (
            <div
              key={i}
              style={{
                position: "relative",
                zIndex: 1,
                opacity: exOpacity,
                transform: `translateY(${(1 - Math.min(exProgress, 1)) * 10}px)`,
                fontSize: 20,
                fontFamily: FONTS.sans,
                color: BRAND.white,
                textShadow: "0 1px 4px rgba(0,0,0,0.6)",
                marginTop: i === 0 ? 12 : 4,
                textAlign: "center",
                maxWidth: size * 0.8,
              }}
            >
              {ex}
            </div>
          );
        })}
    </div>
  );
};
