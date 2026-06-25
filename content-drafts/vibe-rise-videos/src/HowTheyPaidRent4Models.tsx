/**
 * "How They Paid Rent" — The 4 Models (20s)
 *
 * Hook: "It takes 12 years to blow up. Here's how they paid rent."
 * Then 4 models with creator name-drops + trust years.
 * Closes with median stat + CTA.
 *
 * Timeline (30fps, 20s = 600 frames):
 *   0-2s     Hook text + face montage pop-ups
 *   2-5s     Model 1: Day Job + Side Project (Wim Hof 34y, Jay Shetty 9y)
 *   5-8s     Model 2: 1:1 Service (Esther Perel 25y, Priya Parker 16y)
 *   8-11s    Model 3: Small Group Paid (Tony Robbins 12y)
 *   11-14s   Model 4: Institutional Salary (Gabor Mate 44y, Bessel van der Kolk 30y)
 *   14-18s   The Average — median stat
 *   18-20s   CTA
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { lerp, EASE, VR } from "./common";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

// ─── Face Montage Pop-up ─────────────────────────────────────────────

const FacePop: React.FC<{
  src: string;
  delay: number;
  x: number;
  y: number;
  size?: number;
}> = ({ src, delay, x, y, size = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.4 },
  });

  const exitOpacity = lerp(frame, [55, 60], [1, 0], EASE.in);

  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        border: `3px solid ${VR.gold}50`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5)`,
        transform: `scale(${scale})`,
        opacity: scale * exitOpacity,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

// ─── Hook Scene ──────────────────────────────────────────────────────

const SceneHook: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // "12 years" number
  const numScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });

  // Subtitle
  const subOpacity = lerp(frame, [15, 25], [0, 1], EASE.out);
  const subY = lerp(frame, [15, 25], [20, 0], EASE.out);

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      {/* Face montage pop-ups */}
      <FacePop src="images/tony-robbins.png" delay={3} x={80} y={180} size={130} />
      <FacePop src="images/wim-hof.png" delay={6} x={700} y={140} size={110} />
      <FacePop src="images/esther-perel.png" delay={9} x={150} y={1300} size={115} />
      <FacePop src="images/gabor-mate.png" delay={12} x={750} y={1350} size={120} />
      <FacePop src="images/priya-parker.png" delay={15} x={820} y={700} size={100} />
      <FacePop src="images/jay-shetty.png" delay={18} x={60} y={750} size={105} />

      {/* Main hook text */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "38%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 20,
        }}
      >
        {/* "12 YEARS" */}
        <div
          style={{
            fontSize: 140,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${VR.gold} 0%, ${VR.goldBright} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: `scale(${numScale})`,
            lineHeight: 1,
            filter: `drop-shadow(0 6px 30px ${VR.gold}60)`,
          }}
        >
          12 YEARS
        </div>

        {/* "to blow up." */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: `${VR.bone}80`,
            opacity: subOpacity,
            transform: `translateY(${subY}px)`,
          }}
        >
          to blow up.
        </div>

        {/* "Here's how they paid rent." */}
        <div
          style={{
            fontSize: 40,
            fontWeight: 900,
            color: VR.white,
            opacity: lerp(frame, [28, 40], [0, 1], EASE.out),
            transform: `translateY(${lerp(frame, [28, 40], [15, 0], EASE.out)}px)`,
          }}
        >
          Here's how they paid rent.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Model Card Scene ────────────────────────────────────────────────

const SceneModel: React.FC<{
  modelNumber: number;
  modelName: string;
  emoji: string;
  line1Name: string;
  line1Role: string;
  line1Years: number;
  line2Name?: string;
  line2Role?: string;
  line2Years?: number;
}> = ({
  modelNumber,
  modelName,
  emoji,
  line1Name,
  line1Role,
  line1Years,
  line2Name,
  line2Role,
  line2Years,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Model badge enters
  const badgeScale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  // Creator lines stagger
  const line1Opacity = lerp(frame, [12, 22], [0, 1], EASE.out);
  const line1Y = lerp(frame, [12, 22], [20, 0], EASE.out);
  const line2Opacity = lerp(frame, [22, 32], [0, 1], EASE.out);
  const line2Y = lerp(frame, [22, 32], [20, 0], EASE.out);

  // Year counter animation
  const year1Display = Math.floor(
    lerp(frame, [14, 35], [0, line1Years], EASE.out)
  );
  const year2Display = line2Years
    ? Math.floor(lerp(frame, [24, 45], [0, line2Years], EASE.out))
    : 0;

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      {/* Model number + name badge */}
      <div
        style={{
          position: "absolute",
          top: "12%",
          left: "50%",
          transform: `translateX(-50%) scale(${badgeScale})`,
          display: "flex",
          alignItems: "center",
          gap: 20,
          background: `rgba(6, 3, 15, 0.88)`,
          border: `2px solid ${VR.gold}30`,
          borderRadius: 24,
          padding: "28px 52px",
          backdropFilter: "blur(20px)",
          boxShadow: `0 8px 40px rgba(0,0,0,0.5)`,
        }}
      >
        <span style={{ fontSize: 56 }}>{emoji}</span>
        <div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 700,
              letterSpacing: 6,
              color: VR.gray[600],
              textTransform: "uppercase" as const,
            }}
          >
            MODEL {modelNumber}
          </div>
          <div
            style={{
              fontSize: 38,
              fontWeight: 900,
              color: VR.gold,
              marginTop: 4,
            }}
          >
            {modelName}
          </div>
        </div>
      </div>

      {/* Creator 1 */}
      <div
        style={{
          position: "absolute",
          top: "42%",
          left: 80,
          right: 80,
          opacity: line1Opacity,
          transform: `translateY(${line1Y}px)`,
        }}
      >
        <div style={{ fontSize: 48, fontWeight: 900, color: VR.white }}>
          {line1Name}
        </div>
        <div
          style={{
            fontSize: 28,
            fontWeight: 400,
            color: `${VR.bone}70`,
            marginTop: 8,
          }}
        >
          {line1Role}
        </div>
        <div
          style={{
            fontSize: 72,
            fontWeight: 900,
            color: VR.gold,
            marginTop: 12,
            lineHeight: 1,
          }}
        >
          {year1Display} years
        </div>
      </div>

      {/* Creator 2 (optional) */}
      {line2Name && (
        <div
          style={{
            position: "absolute",
            top: "68%",
            left: 80,
            right: 80,
            opacity: line2Opacity,
            transform: `translateY(${line2Y}px)`,
          }}
        >
          <div style={{ fontSize: 48, fontWeight: 900, color: VR.white }}>
            {line2Name}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 400,
              color: `${VR.bone}70`,
              marginTop: 8,
            }}
          >
            {line2Role}
          </div>
          <div
            style={{
              fontSize: 72,
              fontWeight: 900,
              color: VR.gold,
              marginTop: 12,
              lineHeight: 1,
            }}
          >
            {year2Display} years
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Average Scene ───────────────────────────────────────────────────

const SceneAverage: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.6 },
  });

  const displayYears = Math.floor(lerp(frame, [5, 40], [0, 12], EASE.out));

  const labelOpacity = lerp(frame, [20, 35], [0, 1], EASE.out);
  const labelY = lerp(frame, [20, 35], [20, 0], EASE.out);

  const subOpacity = lerp(frame, [40, 55], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: "30%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 16,
        }}
      >
        {/* Eyebrow */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: 8,
            color: VR.gray[600],
            textTransform: "uppercase" as const,
            opacity: lerp(frame, [0, 12], [0, 1], EASE.out),
          }}
        >
          THE MEDIAN ACROSS 85 EXPERIENCE CREATORS
        </div>

        {/* Big number */}
        <div
          style={{
            fontSize: 200,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.gold} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            transform: `scale(${numScale})`,
            lineHeight: 1,
            filter: `drop-shadow(0 8px 40px ${VR.gold}50)`,
          }}
        >
          {displayYears}
        </div>

        {/* "years" */}
        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: VR.gold,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}
        >
          years
        </div>

        {/* "before anyone noticed" */}
        <div
          style={{
            fontSize: 36,
            fontWeight: 400,
            color: `${VR.bone}60`,
            opacity: subOpacity,
            marginTop: 20,
          }}
        >
          before anyone noticed.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── CTA Scene ───────────────────────────────────────────────────────

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const textScale = spring({
    frame,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.6 },
  });

  const brandOpacity = lerp(frame, [20, 35], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <div
        style={{
          position: "absolute",
          left: 60,
          right: 60,
          top: "38%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: 52,
            fontWeight: 900,
            color: VR.white,
            transform: `scale(${textScale})`,
            lineHeight: 1.2,
          }}
        >
          Find which model fits you.
        </div>
      </div>

      {/* Decorative line */}
      <div
        style={{
          position: "absolute",
          top: "58%",
          left: "50%",
          transform: "translateX(-50%)",
          width: lerp(frame, [15, 35], [0, 200], EASE.out),
          height: 3,
          background: `linear-gradient(90deg, transparent, ${VR.gold}, transparent)`,
          borderRadius: 2,
        }}
      />

      {/* Brand */}
      <div
        style={{
          position: "absolute",
          bottom: "18%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 44,
          fontWeight: 900,
          letterSpacing: 12,
          color: VR.gold,
          opacity: brandOpacity,
          textShadow: `0 0 40px ${VR.gold}40`,
        }}
      >
        VIBE RISE
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────

export const HowTheyPaidRent4Models: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <>
      {/* 0-2s: Hook */}
      <Sequence from={0} durationInFrames={fps * 2}>
        <SceneHook />
      </Sequence>

      {/* 2-5s: Model 1 — Day Job + Side Project */}
      <Sequence from={fps * 2} durationInFrames={fps * 3}>
        <SceneModel
          modelNumber={1}
          modelName="Day Job + Side Project"
          emoji="💼"
          line1Name="Wim Hof"
          line1Role="was a postman"
          line1Years={34}
          line2Name="Jay Shetty"
          line2Role="was a consultant"
          line2Years={9}
        />
      </Sequence>

      {/* 5-8s: Model 2 — 1:1 Service */}
      <Sequence from={fps * 5} durationInFrames={fps * 3}>
        <SceneModel
          modelNumber={2}
          modelName="1:1 Service"
          emoji="🤝"
          line1Name="Esther Perel"
          line1Role="did couples therapy"
          line1Years={25}
          line2Name="Priya Parker"
          line2Role="facilitated"
          line2Years={16}
        />
      </Sequence>

      {/* 8-11s: Model 3 — Small Group Paid */}
      <Sequence from={fps * 8} durationInFrames={fps * 3}>
        <SceneModel
          modelNumber={3}
          modelName="Small Group Paid"
          emoji="🎪"
          line1Name="Tony Robbins"
          line1Role="filled hotel rooms"
          line1Years={12}
        />
      </Sequence>

      {/* 11-14s: Model 4 — Institutional Salary */}
      <Sequence from={fps * 11} durationInFrames={fps * 3}>
        <SceneModel
          modelNumber={4}
          modelName="Institutional Salary"
          emoji="🏛️"
          line1Name="Gabor Maté"
          line1Role="was a family doctor"
          line1Years={44}
          line2Name="Bessel van der Kolk"
          line2Role="researched trauma"
          line2Years={30}
        />
      </Sequence>

      {/* 14-18s: The Average */}
      <Sequence from={fps * 14} durationInFrames={fps * 4}>
        <SceneAverage />
      </Sequence>

      {/* 18-20s: CTA */}
      <Sequence from={fps * 18} durationInFrames={fps * 2}>
        <SceneCTA />
      </Sequence>
    </>
  );
};
