import React from "react";
import { VR } from "../common";

export const glassCard = (opacity = 0.85): React.CSSProperties => ({
  background: `rgba(6, 3, 15, ${opacity})`,
  border: `2px solid rgba(233, 162, 59, 0.25)`,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 28,
  boxShadow: "0 12px 60px rgba(0, 0, 0, 0.6)",
});

export const eyebrowText: React.CSSProperties = {
  fontSize: 24,
  fontWeight: 700,
  letterSpacing: 8,
  textTransform: "uppercase" as const,
  color: VR.gray[600],
};
