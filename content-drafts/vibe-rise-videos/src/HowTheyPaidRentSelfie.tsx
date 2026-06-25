/**
 * "How They Paid Rent" — Selfie version (synced to speech)
 *
 * Video order: selfie-2 first (hook + models 1-2), then selfie-1 (models 3-4 + median + CTA)
 *
 * SELFIE-2 (0-26.2s of source):
 *   [0.0-4.4s]   Hook: "It takes 12 years to blow up your brand..."
 *   [4.9-9.9s]   "How they paid rent. There's four models."
 *   [10.6-18.0s] Model 1: Day Job (Wim Hof 34y, Jay Shetty 9y)
 *   [18.8-26.2s] Model 2: 1:1 Service (Esther Perel 25y, Priya Parker 16y)
 *
 * SELFIE-1 (0-38s of source):
 *   [0.0-7.7s]   Model 3: Small Group Paid (Tony Robbins 12y)
 *   [7.7-12.9s]  Model 4: Institutional Salary (Gabor Mate 44y, Bessel van der Kolk 30y)
 *   [13.4-22.8s] Median: "12 years was the average"
 *   [22.8-38.0s] Personal reflection + CTA
 *
 * Total: ~26.2s + ~38s = ~64.2s source, but we use natural cuts
 */
import React from "react";
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { lerp, EASE, VR } from "./common";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { PopSubtitle, SubtitlePhrase } from "./overlays/PopSubtitle";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["400", "700", "900"],
  subsets: ["latin"],
});

// ─── Subtitle phrases synced to word timestamps ──────────────────────

// 3 size tiers: 52px (short punch), 44px (model headers + medium), 38px (long sentences)
// Exception: "There's four models" at 60px for emphasis

// SELFIE-2 subtitles (absolute times, synced to small-model word timestamps)
const selfie2Subs: SubtitlePhrase[] = [
  { start: 0.0, end: 1.72, text: "It takes 12 years", highlight: ["12", "years"] },
  { start: 1.72, end: 2.74, text: "to blow up your brand", highlight: ["blow", "up"] },
  { start: 2.74, end: 4.42, text: "as an experience creator", highlight: ["experience", "creator"] },
  { start: 5.02, end: 6.36, text: "The part we really talk about though", fontSize: 38 },
  { start: 6.70, end: 8.46, text: "how they paid rent", highlight: ["paid", "rent"] },
  { start: 9.04, end: 10.00, text: "There's four models.", highlight: ["four"], fontSize: 60 },
  { start: 10.80, end: 13.04, text: "One: Day Job + Side Project", highlight: ["Day", "Job"], fontSize: 44 },
  { start: 13.42, end: 15.90, text: "Wim Hof as a postman for 34 years", highlight: ["Wim", "Hof", "34"], fontSize: 38 },
  { start: 15.90, end: 18.08, text: "Jay Shetty as a consultant for 9", highlight: ["Jay", "Shetty", "9"], fontSize: 38 },
  { start: 18.76, end: 20.50, text: "Two: One-to-One Service", highlight: ["One-to-One"], fontSize: 44 },
  { start: 21.06, end: 23.34, text: "Esther Perel couples therapy for 25 years", highlight: ["Esther", "Perel", "25"], fontSize: 38 },
  { start: 23.34, end: 26.14, text: "Priya Parker facilitated for 16", highlight: ["Priya", "Parker", "16"], fontSize: 38 },
];

// SELFIE-1 subtitles (times relative to selfie-1 start)
const selfie1Subs: SubtitlePhrase[] = [
  { start: 0.0, end: 2.90, text: "Three: Small Paid Groups", highlight: ["Small", "Paid"], fontSize: 44 },
  { start: 3.28, end: 6.14, text: "Tony Robbins filled hotel rooms for 12 years", highlight: ["Tony", "Robbins", "12"], fontSize: 38 },
  { start: 6.72, end: 9.12, text: "Four: Institutional Salary", highlight: ["Institutional"], fontSize: 44 },
  { start: 9.52, end: 11.54, text: "Gabor Maté was a doctor for 44 years", highlight: ["Gabor", "Maté", "44"], fontSize: 38 },
  { start: 11.54, end: 12.94, text: "Bessel van der Kolk", highlight: ["Bessel"], fontSize: 44 },
  { start: 13.26, end: 15.14, text: "the writer of Body Keeps the Score", highlight: ["Body", "Score"], fontSize: 38 },
  { start: 15.60, end: 16.90, text: "researched trauma for 30", highlight: ["30"] },
  { start: 17.40, end: 20.26, text: "On average across 100 experience creators", highlight: ["100"], fontSize: 38 },
  { start: 20.60, end: 23.74, text: "12 years before they became a household name", highlight: ["12", "years"], fontSize: 38 },
  { start: 24.18, end: 26.28, text: "So if you're sometimes mean to yourself", fontSize: 38 },
  { start: 26.82, end: 28.44, text: "judging yourself as slow progress", highlight: ["slow", "progress"], fontSize: 38 },
  { start: 28.92, end: 31.08, text: "hopefully this makes you feel a little bit better", fontSize: 38 },
  { start: 31.84, end: 34.16, text: "and trust that if you keep going", highlight: ["keep", "going"], fontSize: 38 },
  { start: 34.40, end: 35.98, text: "you will scale to the income", highlight: ["scale", "income"], fontSize: 38 },
  { start: 35.98, end: 38.00, text: "and impact you're capable of", highlight: ["impact", "capable"], fontSize: 38 },
];

// Selfie-2 duration we use (up to ~27s)
const SELFIE2_FRAMES = 27 * 30; // 810 frames
// Selfie-1 duration we use (up to ~38s)
const SELFIE1_FRAMES = 38 * 30; // 1140 frames
const TOTAL_FRAMES = SELFIE2_FRAMES + SELFIE1_FRAMES; // ~65s

// ─── Glass card helper ───────────────────────────────────────────────

const glassStyle = (opacity = 0.88): React.CSSProperties => ({
  background: `rgba(6, 3, 15, ${opacity})`,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
  border: `2px solid ${VR.gold}25`,
  boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
});

// ─── Hook Overlay (0-4.4s) ───────────────────────────────────────────

const HookOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({
    frame,
    fps,
    config: { damping: 10, stiffness: 180, mass: 0.5 },
  });

  const subOpacity = lerp(frame, [15, 25], [0, 1], EASE.out);
  const exitOpacity = lerp(frame, [fps * 4 - 10, fps * 4], [1, 0], EASE.in);

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <div
        style={{
          position: "absolute",
          top: "6%",
          left: "50%",
          transform: `translateX(-50%) scale(${numScale})`,
          ...glassStyle(0.9),
          padding: "36px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 80,
            fontWeight: 900,
            background: `linear-gradient(135deg, ${VR.gold} 0%, ${VR.goldBright} 100%)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
          }}
        >
          12 YEARS
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 28,
            fontWeight: 400,
            color: `${VR.bone}80`,
            opacity: subOpacity,
          }}
        >
          to blow up your brand.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── "4 Models" title (4.9-9.9s) ────────────────────────────────────

const FourModelsTitle: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 12, stiffness: 160, mass: 0.5 },
  });

  const exitOpacity = lerp(frame, [fps * 5 - 15, fps * 5], [1, 0], EASE.in);

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: `translateX(-50%) scale(${scale})`,
          ...glassStyle(0.9),
          padding: "36px 60px",
          display: "flex",
          alignItems: "center",
          gap: 20,
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 72,
            fontWeight: 900,
            color: VR.gold,
            lineHeight: 1,
          }}
        >
          4
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 32,
            fontWeight: 700,
            color: VR.white,
            letterSpacing: 4,
            textTransform: "uppercase" as const,
          }}
        >
          MODELS
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Model Card Overlay ──────────────────────────────────────────────

const ModelOverlay: React.FC<{
  modelNumber: number;
  modelName: string;
  emoji: string;
  line1Name: string;
  line1Role: string;
  line1Years: number;
  line1Portrait?: string;
  line2Name?: string;
  line2Role?: string;
  line2Years?: number;
  line2Portrait?: string;
  durationFrames: number;
}> = ({
  modelNumber,
  modelName,
  emoji,
  line1Name,
  line1Role,
  line1Years,
  line1Portrait,
  line2Name,
  line2Role,
  line2Years,
  line2Portrait,
  durationFrames,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  const line1Opacity = lerp(frame, [10, 18], [0, 1], EASE.out);
  const line1Y = lerp(frame, [10, 18], [20, 0], EASE.out);
  const line2Opacity = lerp(frame, [18, 28], [0, 1], EASE.out);
  const line2Y = lerp(frame, [18, 28], [20, 0], EASE.out);

  const year1Display = Math.floor(lerp(frame, [12, 40], [0, line1Years], EASE.out));
  const year2Display = line2Years
    ? Math.floor(lerp(frame, [20, 48], [0, line2Years], EASE.out))
    : 0;

  const exitOpacity = lerp(frame, [durationFrames - 15, durationFrames - 5], [1, 0], EASE.in);

  return (
    <AbsoluteFill style={{ opacity: exitOpacity }}>
      {/* Model badge — top */}
      <div
        style={{
          position: "absolute",
          top: "4%",
          left: "50%",
          transform: `translateX(-50%) scale(${badgeScale})`,
          ...glassStyle(0.9),
          display: "flex",
          alignItems: "center",
          gap: 24,
          padding: "36px 56px",
        }}
      >
        <span style={{ fontSize: 64 }}>{emoji}</span>
        <div>
          <div
            style={{
              fontFamily: inter,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 8,
              color: VR.gray[600],
              textTransform: "uppercase" as const,
            }}
          >
            MODEL {modelNumber}
          </div>
          <div style={{ fontFamily: inter, fontSize: 44, fontWeight: 900, color: VR.gold, marginTop: 4 }}>
            {modelName}
          </div>
        </div>
      </div>

      {/* Creator cards — side by side, or centered if solo */}
      <div
        style={{
          position: "absolute",
          bottom: "6%",
          left: 20,
          right: 20,
          display: "flex",
          justifyContent: line2Name ? "stretch" : "center",
          gap: 16,
        }}
      >
        {/* Creator 1 */}
        <div
          style={{
            flex: line2Name ? 1 : undefined,
            width: line2Name ? undefined : "48%",
            opacity: line1Opacity,
            transform: `translateY(${line1Y}px)`,
            ...glassStyle(),
            padding: "24px 20px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {line1Portrait && (
              <CreatorPortrait src={line1Portrait} delay={8} size={120} />
            )}
            <div style={{ fontFamily: inter, fontSize: 88, fontWeight: 900, color: VR.gold, lineHeight: 1 }}>
              {year1Display}y
            </div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: inter, fontSize: 32, fontWeight: 900, color: VR.white }}>{line1Name}</div>
            <div style={{ fontFamily: inter, fontSize: 22, fontWeight: 400, color: `${VR.bone}70`, marginTop: 2 }}>{line1Role}</div>
          </div>
        </div>

        {/* Creator 2 */}
        {line2Name && (
          <div
            style={{
              flex: 1,
              opacity: line2Opacity,
              transform: `translateY(${line2Y}px)`,
              ...glassStyle(),
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              {line2Portrait && (
                <CreatorPortrait src={line2Portrait} delay={18} size={120} />
              )}
              <div style={{ fontFamily: inter, fontSize: 88, fontWeight: 900, color: VR.gold, lineHeight: 1 }}>
                {year2Display}y
              </div>
            </div>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: inter, fontSize: 32, fontWeight: 900, color: VR.white }}>{line2Name}</div>
              <div style={{ fontFamily: inter, fontSize: 22, fontWeight: 400, color: `${VR.bone}70`, marginTop: 2 }}>{line2Role}</div>
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ─── Median Overlay (13.4-22.8s of selfie-1) ────────────────────────

const MedianOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.6 },
  });

  const displayYears = Math.floor(lerp(frame, [5, 40], [0, 12], EASE.out));
  const labelOpacity = lerp(frame, [25, 40], [0, 1], EASE.out);

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          top: "5%",
          left: "50%",
          transform: "translateX(-50%)",
          ...glassStyle(0.9),
          padding: "40px 60px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 18,
            fontWeight: 700,
            letterSpacing: 4,
            color: VR.gray[600],
            textTransform: "uppercase" as const,
          }}
        >
          THE AVERAGE
        </div>
        <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
          <div
            style={{
              fontFamily: inter,
              fontSize: 80,
              fontWeight: 900,
              background: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.gold} 100%)`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              transform: `scale(${numScale})`,
              lineHeight: 1,
            }}
          >
            {displayYears}
          </div>
          <div
            style={{
              fontFamily: inter,
              fontSize: 36,
              fontWeight: 700,
              color: VR.gold,
              opacity: labelOpacity,
            }}
          >
            years
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── CTA Overlay ─────────────────────────────────────────────────────

const CTAOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const brandScale = spring({
    frame: frame - 10,
    fps,
    config: { damping: 16, stiffness: 120, mass: 0.6 },
  });

  return (
    <AbsoluteFill>
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          left: "50%",
          transform: `translateX(-50%) scale(${brandScale})`,
          ...glassStyle(0.9),
          padding: "32px 56px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12,
        }}
      >
        <div
          style={{
            fontFamily: inter,
            fontSize: 56,
            fontWeight: 900,
            letterSpacing: 12,
            color: VR.gold,
            textShadow: `0 0 30px ${VR.gold}40`,
          }}
        >
          VIBE RISE
        </div>
        <div
          style={{
            fontFamily: inter,
            fontSize: 28,
            fontWeight: 400,
            color: `${VR.bone}70`,
            letterSpacing: 4,
          }}
        >
          Find which model fits you.
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ─── Creator Portrait Pop-up ─────────────────────────────────────────

const CreatorPortrait: React.FC<{
  src: string;
  delay?: number;
  size?: number;
  x?: number;
  y?: number;
  exitAtFrame?: number;
}> = ({ src, delay = 0, size = 100, x, y, exitAtFrame = 9999 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.4 },
  });

  const exitOpacity = lerp(frame, [exitAtFrame, exitAtFrame + 8], [1, 0], EASE.in);
  const glowPulse = Math.sin(frame * 0.06) * 0.1 + 0.25;

  const posStyle: React.CSSProperties = x !== undefined && y !== undefined
    ? { position: "absolute" as const, left: x, top: y }
    : {};

  return (
    <div
      style={{
        ...posStyle,
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        border: `3px solid ${VR.gold}50`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${VR.gold}${Math.floor(glowPulse * 255).toString(16).padStart(2, "0")}`,
        transform: `scale(${scale})`,
        opacity: scale * exitOpacity,
        flexShrink: 0,
      }}
    >
      <Img
        src={staticFile(src)}
        style={{ width: "100%", height: "100%", objectFit: "cover" }}
      />
    </div>
  );
};

// ─── Hook Face Row (all creator faces below subtitle) ────────────────

const HookFaceRow: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitOpacity = lerp(frame, [fps * 4 - 10, fps * 4], [1, 0], EASE.in);

  const row1 = [
    { src: "images/tony-robbins.png", delay: 3 },
    { src: "images/wim-hof.png", delay: 6 },
    { src: "images/esther-perel.png", delay: 9 },
  ];
  const row2 = [
    { src: "images/gabor-mate.png", delay: 12 },
    { src: "images/priya-parker.png", delay: 15 },
    { src: "images/jay-shetty.png", delay: 18 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "68%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 20,
        opacity: exitOpacity,
        zIndex: 5,
      }}
    >
      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        {row1.map((c, i) => (
          <CreatorPortrait key={`hook-r1-${i}`} src={c.src} delay={c.delay} size={280} />
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 20 }}>
        {row2.map((c, i) => (
          <CreatorPortrait key={`hook-r2-${i}`} src={c.src} delay={c.delay} size={280} />
        ))}
      </div>
    </div>
  );
};

// ─── Progress Dots ───────────────────────────────────────────────────

const ProgressDots: React.FC<{ activeModel: number }> = ({ activeModel }) => {
  return (
    <div
      style={{
        position: "absolute",
        top: 24,
        left: "50%",
        transform: "translateX(-50%)",
        display: "flex",
        gap: 12,
        zIndex: 10,
      }}
    >
      {[1, 2, 3, 4].map((n) => (
        <div
          key={`dot-${n}`}
          style={{
            width: n <= activeModel ? 32 : 12,
            height: 12,
            borderRadius: 6,
            background: n <= activeModel ? VR.gold : `${VR.white}25`,
            transition: "all 0.3s ease",
            boxShadow: n <= activeModel ? `0 0 12px ${VR.gold}50` : "none",
          }}
        />
      ))}
    </div>
  );
};

// ─── Bottom Gradient ─────────────────────────────────────────────────

const BottomGradient: React.FC = () => (
  <div
    style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: "30%",
      background: "linear-gradient(to top, rgba(6, 3, 15, 0.7) 0%, rgba(6, 3, 15, 0.3) 50%, transparent 100%)",
      pointerEvents: "none",
      zIndex: 1,
    }}
  />
);

// ─── Zoom Punch on video cut ─────────────────────────────────────────

const ZoomPunchVideo: React.FC<{
  src: string;
  punchAtFrame?: number;
}> = ({ src, punchAtFrame }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let scale = 1;
  if (punchAtFrame !== undefined) {
    // Quick scale up and back down over 10 frames
    const punchProgress = spring({
      frame: frame - punchAtFrame,
      fps,
      config: { damping: 8, stiffness: 300, mass: 0.3 },
    });
    // Punch up to 1.06 then settle to 1.0
    scale = 1 + (1 - punchProgress) * 0.06 * (frame >= punchAtFrame ? 1 : 0);
    // Actually use a different approach: quick bump
    if (frame >= punchAtFrame && frame < punchAtFrame + 15) {
      const t = (frame - punchAtFrame) / 15;
      scale = 1 + Math.sin(t * Math.PI) * 0.06;
    }
  }

  return (
    <OffthreadVideo
      src={staticFile(src)}
      style={{
        width: "100%",
        height: "100%",
        objectFit: "cover" as const,
        transform: `scale(${scale})`,
      }}
    />
  );
};

// ─── Main Composition ────────────────────────────────────────────────

export const HowTheyPaidRentSelfie: React.FC = () => {
  const fps = 30;
  const frame = useCurrentFrame();

  // Timestamps in frames (from transcription)
  // SELFIE-2 timings
  const s2_hook = 0;                    // 0s
  const s2_fourModels = Math.round(4.9 * fps);  // 4.9s = 147
  const s2_model1 = Math.round(10.6 * fps);     // 10.6s = 318
  const s2_model2 = Math.round(18.8 * fps);     // 18.8s = 564

  // SELFIE-1 timings (offset by SELFIE2_FRAMES)
  const s1_offset = SELFIE2_FRAMES;
  const s1_model3 = s1_offset;                          // 0s of selfie-1
  const s1_model4 = s1_offset + Math.round(7.7 * fps);  // 7.7s
  const s1_median = s1_offset + Math.round(13.4 * fps); // 13.4s
  const s1_cta = s1_offset + Math.round(22.8 * fps);    // 22.8s

  // Determine which model is active for progress dots
  let activeModel = 0;
  if (frame >= s2_model1) activeModel = 1;
  if (frame >= s2_model2) activeModel = 2;
  if (frame >= s1_model3) activeModel = 3;
  if (frame >= s1_model4) activeModel = 4;

  // Show progress dots only during model sections
  const showDots = frame >= s2_model1 && frame < s1_median;

  return (
    <AbsoluteFill>
      {/* Background video: selfie-2 first (with zoom punch at start) */}
      <Sequence from={0} durationInFrames={SELFIE2_FRAMES}>
        <ZoomPunchVideo src="selfie-2.mov" punchAtFrame={0} />
      </Sequence>

      {/* Background video: selfie-1 second (with zoom punch at cut) */}
      <Sequence from={SELFIE2_FRAMES} durationInFrames={SELFIE1_FRAMES}>
        <ZoomPunchVideo src="selfie-1.mov" punchAtFrame={0} />
      </Sequence>

      {/* ─── PERMANENT LAYERS ──────────────────────────────── */}

      {/* Bottom gradient — always on for subtitle readability */}
      <BottomGradient />

      {/* Progress dots — visible during model sections only */}
      {showDots && <ProgressDots activeModel={activeModel} />}

      {/* ─── POP SUBTITLES synced to speech ─────────────────── */}

      {/* Selfie-2 subtitles (0-27s) */}
      <Sequence from={0} durationInFrames={SELFIE2_FRAMES}>
        <PopSubtitle phrases={selfie2Subs} />
      </Sequence>

      {/* Selfie-1 subtitles (27s onward, offset to local time) */}
      <Sequence from={SELFIE2_FRAMES} durationInFrames={SELFIE1_FRAMES}>
        <PopSubtitle phrases={selfie1Subs} />
      </Sequence>

      {/* ─── OVERLAYS synced to speech ─────────────────────── */}

      {/* Hook: "12 YEARS to blow up" (0-4.4s) + face row */}
      <Sequence from={s2_hook} durationInFrames={Math.round(4.4 * fps)}>
        <HookOverlay />
        <HookFaceRow />
      </Sequence>

      {/* "4 Models" title (4.9-9.9s) */}
      <Sequence from={s2_fourModels} durationInFrames={Math.round(5 * fps)}>
        <FourModelsTitle />
      </Sequence>

      {/* Model 1: Day Job (10.6-18.0s) */}
      <Sequence from={s2_model1} durationInFrames={Math.round(7.4 * fps)}>
        <ModelOverlay
          modelNumber={1}
          modelName="Day Job + Side Project"
          emoji="💼"
          line1Name="Wim Hof"
          line1Role="was a postman"
          line1Years={34}
          line1Portrait="images/wim-hof.png"
          line2Name="Jay Shetty"
          line2Role="was a consultant"
          line2Years={9}
          line2Portrait="images/jay-shetty.png"
          durationFrames={Math.round(7.4 * fps)}
        />
      </Sequence>

      {/* Model 2: 1:1 Service (18.8-26.2s) */}
      <Sequence from={s2_model2} durationInFrames={Math.round(7.4 * fps)}>
        <ModelOverlay
          modelNumber={2}
          modelName="1:1 Service"
          emoji="🤝"
          line1Name="Esther Perel"
          line1Role="did couples therapy"
          line1Years={25}
          line1Portrait="images/esther-perel.png"
          line2Name="Priya Parker"
          line2Role="facilitated"
          line2Years={16}
          line2Portrait="images/priya-parker.png"
          durationFrames={Math.round(7.4 * fps)}
        />
      </Sequence>

      {/* Model 3: Small Group Paid (0-7.7s of selfie-1) */}
      <Sequence from={s1_model3} durationInFrames={Math.round(7.7 * fps)}>
        <ModelOverlay
          modelNumber={3}
          modelName="Small Group Paid"
          emoji="🎪"
          line1Name="Tony Robbins"
          line1Role="filled hotel rooms"
          line1Years={12}
          line1Portrait="images/tony-robbins.png"
          durationFrames={Math.round(7.7 * fps)}
        />
      </Sequence>

      {/* Model 4: Institutional Salary (7.7-12.9s of selfie-1) */}
      <Sequence from={s1_model4} durationInFrames={Math.round(5.2 * fps)}>
        <ModelOverlay
          modelNumber={4}
          modelName="Institutional Salary"
          emoji="🏛️"
          line1Name="Gabor Maté"
          line1Role="was a family doctor"
          line1Years={44}
          line1Portrait="images/gabor-mate.png"
          line2Name="Bessel van der Kolk"
          line2Role="researched trauma"
          line2Years={30}
          line2Portrait="images/bessel-van-der-kolk.png"
          durationFrames={Math.round(5.2 * fps)}
        />
      </Sequence>

      {/* Median stat (13.4-22.8s of selfie-1) */}
      <Sequence from={s1_median} durationInFrames={Math.round(9.4 * fps)}>
        <MedianOverlay />
      </Sequence>

      {/* CTA (22.8s-end of selfie-1) */}
      <Sequence from={s1_cta} durationInFrames={Math.round(15.2 * fps)}>
        <CTAOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};
