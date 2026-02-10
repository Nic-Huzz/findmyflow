import React from "react";
import { AbsoluteFill } from "remotion";

export const SceneWrapper: React.FC<{
  children: React.ReactNode;
  backgroundColor?: string;
  padding?: number;
}> = ({ children, backgroundColor = "transparent", padding = 80 }) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding,
      }}
    >
      {children}
    </AbsoluteFill>
  );
};
