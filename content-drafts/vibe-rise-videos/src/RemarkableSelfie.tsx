/**
 * "What Made Them Remarkable" — Selfie version (synced to speech)
 *
 * Video order: remarkable-1 (hook + ingredients 1-2), then remarkable-2 (ingredients 3-5 + stat + CTA)
 *
 * REMARKABLE-1 (46s):
 *   [0-5.5s]     Hook: "The five ingredients..."
 *   [5.8-10.1s]  "I studied a hundred of them..."
 *   [10.8-14.8s] Ingredient 1: They broke a rule
 *   [15.1-24.3s] Creator examples (Wim, Gabor, Tony)
 *   [24.3-26.8s] Ingredient 2: Unexpected combo
 *   [27.4-32.6s] "combining two worlds..."
 *   [33.2-44.6s] Creator examples (Tony, Wim, Gabor)
 *
 * REMARKABLE-2 (57s):
 *   [0-2.8s]     Ingredient 3: Remarkable results
 *   [3.2-15.2s]  Creator examples
 *   [16.2-20.7s] Ingredient 4: Stupid simplicity
 *   [21.0-27.6s] Creator one-liners
 *   [28.3-35.8s] Ingredient 5: Time in game + years
 *   [36.4-42.7s] "These years of reps..."
 *   [43.5-47.4s] "Across 100... average was 14 years"
 *   [47.8-55.6s] CTA
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

// ─── Subtitle phrases ────────────────────────────────────────────────

const remarkable1Subs: SubtitlePhrase[] = [
  { start: 0.0, end: 2.6, text: "The five ingredients", highlight: ["five", "ingredients"], fontSize: 52 },
  { start: 2.6, end: 5.5, text: "the biggest experience creator brands used to blow up", highlight: ["blow", "up"], fontSize: 38 },
  { start: 5.8, end: 7.2, text: "I studied a hundred of them", highlight: ["hundred"], fontSize: 44 },
  { start: 7.2, end: 10.1, text: "Tony Robbins, Wim Hof and Gabor Mate", highlight: ["Tony", "Robbins", "Wim", "Hof", "Gabor", "Mate"], fontSize: 38 },
  { start: 10.8, end: 12.3, text: "One: they broke a rule", highlight: ["broke", "rule"], fontSize: 44 },
  { start: 12.7, end: 14.8, text: "Doing something the existing industry didn't", fontSize: 38 },
  { start: 15.1, end: 18.2, text: "Wim Hof used ice and breathing to train his nervous system", highlight: ["ice", "breathing", "nervous", "system"], fontSize: 34 },
  { start: 18.5, end: 20.7, text: "Gabor Mate treated the trauma, not the addiction", highlight: ["trauma", "addiction"], fontSize: 34 },
  { start: 21.1, end: 24.3, text: "Tony Robbins used therapy in an empowering setting", highlight: ["therapy", "empowering"], fontSize: 34 },
  { start: 24.3, end: 26.8, text: "Two: unexpected combo", highlight: ["unexpected", "combo"], fontSize: 44 },
  { start: 27.4, end: 30.3, text: "This rule break often comes from combining two worlds", highlight: ["two", "worlds"], fontSize: 38 },
  { start: 30.5, end: 32.6, text: "using their experience from outside the space", fontSize: 38 },
  { start: 33.2, end: 36.3, text: "Tony Robbins: motivational speaking into therapy", highlight: ["motivational", "speaking", "therapy"], fontSize: 34 },
  { start: 36.7, end: 39.9, text: "Wim Hof: ice baths and breathing into treating mental health", highlight: ["ice", "baths", "mental", "health"], fontSize: 34 },
  { start: 40.3, end: 44.6, text: "Gabor Mate: childhood trauma into addiction medicine", highlight: ["childhood", "trauma", "addiction"], fontSize: 34 },
];

const remarkable2Subs: SubtitlePhrase[] = [
  { start: 0.0, end: 2.8, text: "Ingredient 3: remarkable results", highlight: ["remarkable", "results"], fontSize: 44 },
  { start: 3.2, end: 5.7, text: "Their method wasn't only a rule break, it worked", highlight: ["worked"], fontSize: 38 },
  { start: 6.4, end: 8.4, text: "Robbins coached presidents with no qualifications", highlight: ["presidents", "no", "qualifications"], fontSize: 34 },
  { start: 9.3, end: 12.5, text: "Hof had a peer-reviewed immune system control study", highlight: ["peer-reviewed", "immune"], fontSize: 34 },
  { start: 13.0, end: 15.2, text: "Mate rewrote how the world treats addiction", highlight: ["rewrote", "world", "addiction"], fontSize: 34 },
  { start: 16.2, end: 18.1, text: "Ingredient 4: stupid simplicity", highlight: ["stupid", "simplicity"], fontSize: 44 },
  { start: 18.4, end: 20.7, text: "Communicate their method in one sentence", highlight: ["one", "sentence"], fontSize: 38 },
  { start: 21.0, end: 23.1, text: "Robbins: change your state, change your life", highlight: ["change", "state", "life"], fontSize: 38 },
  { start: 23.4, end: 24.9, text: "Hof: breathe and get cold", highlight: ["breathe", "cold"], fontSize: 44 },
  { start: 25.4, end: 27.6, text: "Mate: not why the addiction, but why the pain", highlight: ["addiction", "pain"], fontSize: 38 },
  { start: 28.3, end: 30.6, text: "Ingredient 5: time in game", highlight: ["time", "game"], fontSize: 44 },
  { start: 31.0, end: 32.4, text: "Tony Robbins: 12 years", highlight: ["12"], fontSize: 52 },
  { start: 32.6, end: 33.8, text: "Wim Hof: 19 years", highlight: ["19"], fontSize: 52 },
  { start: 33.8, end: 35.8, text: "Gabor Mate: 44 years to blow up", highlight: ["44"], fontSize: 52 },
  { start: 36.4, end: 38.6, text: "These years of reps are what make you so good", highlight: ["reps"], fontSize: 38 },
  { start: 38.6, end: 40.6, text: "at creating a remarkable result", highlight: ["remarkable", "result"], fontSize: 38 },
  { start: 40.6, end: 42.7, text: "and compressing the method into one sentence", highlight: ["one", "sentence"], fontSize: 38 },
  { start: 43.5, end: 44.8, text: "Across 100 experience creators", highlight: ["100"], fontSize: 44 },
  { start: 45.1, end: 47.4, text: "the average was 14 years before they blew up", highlight: ["14", "years"], fontSize: 44 },
  { start: 47.8, end: 50.6, text: "So if you're keen to identify your five ingredients", highlight: ["five", "ingredients"], fontSize: 38 },
  { start: 50.8, end: 52.8, text: "I've created a portal to do exactly that", fontSize: 38 },
  { start: 53.2, end: 55.6, text: "Shoot me a message with keen", highlight: ["keen"], fontSize: 44 },
];

const R1_FRAMES = Math.round(44.8 * 30); // remarkable-1 duration (trimmed — speech ends ~44.6s)
const R2_FRAMES = Math.round(56.0 * 30); // remarkable-2 duration (trimmed — speech ends ~55.8s)

// ─── Glass card helper ───────────────────────────────────────────────

const glassStyle = (opacity = 0.88): React.CSSProperties => ({
  background: `rgba(6, 3, 15, ${opacity})`,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
  border: `2px solid ${VR.gold}25`,
  boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
});

// ─── Creator Portrait ────────────────────────────────────────────────

const CreatorPortrait: React.FC<{
  src: string;
  delay?: number;
  size?: number;
}> = ({ src, delay = 0, size = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame: frame - delay,
    fps,
    config: { damping: 10, stiffness: 200, mass: 0.4 },
  });

  const glowPulse = Math.sin(frame * 0.06) * 0.1 + 0.25;

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 20,
        overflow: "hidden",
        border: `3px solid ${VR.gold}50`,
        boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${VR.gold}${Math.floor(glowPulse * 255).toString(16).padStart(2, "0")}`,
        transform: `scale(${scale})`,
        opacity: scale,
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

// ─── Hook: Rapid-fire creator grid then name-drop pop-ins ────────────

const allCreatorImages = [
  "images/deepak-chopra.png",
  "images/eckhart-tolle.png",
  "images/esther-perel.png",
  "images/jay-shetty.png",
  "images/joe-dispenza.png",
  "images/jack-kornfield.png",
  "images/priya-parker.png",
  "images/gabby-bernstein.png",
  "images/phil-jackson.png",
  "images/marianne-williamson.png",
  "images/aubrey-marcus.png",
  "images/michael-beckwith.png",
  "images/mooji.png",
  "images/bessel-van-der-kolk.png",
  "images/bren-brown.png",
];

const HookCreatorGrid: React.FC<{ exitAtFrame: number }> = ({ exitAtFrame }) => {
  const frame = useCurrentFrame();
  const exitOpacity = lerp(frame, [exitAtFrame - 12, exitAtFrame], [1, 0], EASE.in);

  const rows = [
    allCreatorImages.slice(0, 5),
    allCreatorImages.slice(5, 10),
    allCreatorImages.slice(10, 15),
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "66%",
        left: 0,
        right: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 12,
        opacity: exitOpacity,
        zIndex: 4,
      }}
    >
      {rows.map((row, rowIdx) => (
        <div key={`row-${rowIdx}`} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {row.map((src, colIdx) => {
            const delay = rowIdx * 3 + colIdx * 1.5;
            return (
              <CreatorPortrait
                key={`grid-${rowIdx}-${colIdx}`}
                src={src}
                delay={delay}
                size={140}
              />
            );
          })}
        </div>
      ))}
    </div>
  );
};

// The 3 main creators pop in bigger when name-dropped (~7-10s)
const NameDropPortraits: React.FC<{ exitAtFrame: number }> = ({ exitAtFrame }) => {
  const frame = useCurrentFrame();
  const exitOpacity = lerp(frame, [exitAtFrame - 10, exitAtFrame], [1, 0], EASE.in);

  // Tony at ~7.2s, Wim at ~8.2s, Gabor at ~8.8s (relative to this sequence start)
  const creators = [
    { src: "images/tony-robbins.png", delay: 0 },
    { src: "images/wim-hof.png", delay: 6 },
    { src: "images/gabor-mate.png", delay: 12 },
  ];

  return (
    <div
      style={{
        position: "absolute",
        top: "65%",
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "center",
        gap: 24,
        opacity: exitOpacity,
        zIndex: 6,
      }}
    >
      {creators.map((c, i) => (
        <CreatorPortrait key={`namedrop-${i}`} src={c.src} delay={c.delay} size={280} />
      ))}
    </div>
  );
};

// ─── Ingredient Badge ────────────────────────────────────────────────

const IngredientBadge: React.FC<{
  number: number;
  name: string;
  durationFrames: number;
}> = ({ number, name, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeScale = spring({
    frame: frame - 3,
    fps,
    config: { damping: 12, stiffness: 180, mass: 0.5 },
  });

  const exitOpacity = lerp(frame, [durationFrames - 15, durationFrames - 5], [1, 0], EASE.in);

  return (
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
        opacity: exitOpacity,
      }}
    >
      <div
        style={{
          fontFamily: inter,
          fontSize: 64,
          fontWeight: 900,
          color: VR.gold,
          lineHeight: 1,
        }}
      >
        {number}
      </div>
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
          INGREDIENT
        </div>
        <div style={{ fontFamily: inter, fontSize: 44, fontWeight: 900, color: VR.gold, marginTop: 4 }}>
          {name}
        </div>
      </div>
    </div>
  );
};

// ─── Creator Card (portrait + text + year) ───────────────────────────

const CreatorCard: React.FC<{
  name: string;
  text: string;
  portrait: string;
  delay?: number;
  year?: string;
  position: "left" | "right" | "center";
}> = ({ name, text, portrait, delay = 0, year, position }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const opacity = lerp(frame, [delay, delay + 10], [0, 1], EASE.out);
  const y = lerp(frame, [delay, delay + 10], [20, 0], EASE.out);

  const posMap = { left: "8%", right: "52%", center: "26%" };

  return (
    <div
      style={{
        position: "absolute",
        bottom: "6%",
        left: posMap[position],
        width: "44%",
        opacity,
        transform: `translateY(${y}px)`,
        ...glassStyle(),
        padding: "20px 16px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 10,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <CreatorPortrait src={portrait} delay={delay + 3} size={100} />
        {year && (
          <div style={{ fontFamily: inter, fontSize: 72, fontWeight: 900, color: VR.gold, lineHeight: 1 }}>
            {year}
          </div>
        )}
      </div>
      <div style={{ fontFamily: inter, fontSize: 28, fontWeight: 900, color: VR.white, textAlign: "center" }}>
        {name}
      </div>
      <div style={{ fontFamily: inter, fontSize: 20, fontWeight: 400, color: `${VR.bone}70`, textAlign: "center" }}>
        {text}
      </div>
    </div>
  );
};

// ─── Stat Overlay ────────────────────────────────────────────────────

const StatOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const numScale = spring({
    frame: frame - 5,
    fps,
    config: { damping: 10, stiffness: 160, mass: 0.6 },
  });

  const displayYears = Math.floor(lerp(frame, [5, 40], [0, 14], EASE.out));

  return (
    <div
      style={{
        position: "absolute",
        top: "4%",
        left: "50%",
        transform: "translateX(-50%)",
        ...glassStyle(0.9),
        padding: "36px 56px",
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
            opacity: lerp(frame, [25, 40], [0, 1], EASE.out),
          }}
        >
          years
        </div>
      </div>
    </div>
  );
};

// ─── Progress Dots ───────────────────────────────────────────────────

const ProgressDots: React.FC<{ activeIngredient: number }> = ({ activeIngredient }) => (
  <div
    style={{
      position: "absolute",
      top: 24,
      left: "50%",
      transform: "translateX(-50%)",
      display: "flex",
      gap: 10,
      zIndex: 10,
    }}
  >
    {[1, 2, 3, 4, 5].map((n) => (
      <div
        key={`dot-${n}`}
        style={{
          width: n <= activeIngredient ? 28 : 10,
          height: 10,
          borderRadius: 5,
          background: n <= activeIngredient ? VR.gold : `${VR.white}25`,
          boxShadow: n <= activeIngredient ? `0 0 12px ${VR.gold}50` : "none",
        }}
      />
    ))}
  </div>
);

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

// ─── Zoom Punch ──────────────────────────────────────────────────────

const ZoomPunchVideo: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();

  let scale = 1;
  if (frame >= 0 && frame < 15) {
    const t = frame / 15;
    scale = 1 + Math.sin(t * Math.PI) * 0.06;
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
        Message "keen" to start
      </div>
    </div>
  );
};

// ─── Main Composition ────────────────────────────────────────────────

export const RemarkableSelfie: React.FC = () => {
  const fps = 30;
  const frame = useCurrentFrame();

  // Ingredient timestamps for progress dots
  const i1Start = Math.round(10.8 * fps); // ingredient 1 in r1
  const i2Start = Math.round(24.3 * fps); // ingredient 2 in r1
  const i3Start = R1_FRAMES; // ingredient 3 starts at r2
  const i4Start = R1_FRAMES + Math.round(16.2 * fps);
  const i5Start = R1_FRAMES + Math.round(28.3 * fps);
  const statsStart = R1_FRAMES + Math.round(43.5 * fps);

  let activeIngredient = 0;
  if (frame >= i1Start) activeIngredient = 1;
  if (frame >= i2Start) activeIngredient = 2;
  if (frame >= i3Start) activeIngredient = 3;
  if (frame >= i4Start) activeIngredient = 4;
  if (frame >= i5Start) activeIngredient = 5;

  const showDots = frame >= i1Start && frame < statsStart;

  return (
    <AbsoluteFill>
      {/* Background video: remarkable-1 first */}
      <Sequence from={0} durationInFrames={R1_FRAMES}>
        <ZoomPunchVideo src="remarkable-1.mov" />
      </Sequence>

      {/* Background video: remarkable-2 second */}
      <Sequence from={R1_FRAMES} durationInFrames={R2_FRAMES}>
        <ZoomPunchVideo src="remarkable-2.mov" />
      </Sequence>

      {/* ─── PERMANENT LAYERS ──────────────────────────────── */}
      <BottomGradient />
      {showDots && <ProgressDots activeIngredient={activeIngredient} />}

      {/* ─── POP SUBTITLES ─────────────────────────────────── */}
      <Sequence from={0} durationInFrames={R1_FRAMES}>
        <PopSubtitle phrases={remarkable1Subs} />
      </Sequence>
      <Sequence from={R1_FRAMES} durationInFrames={R2_FRAMES}>
        <PopSubtitle phrases={remarkable2Subs} />
      </Sequence>

      {/* ─── OVERLAYS ──────────────────────────────────────── */}

      {/* Hook: rapid-fire 15-creator grid (0-5.5s, during "The five ingredients...") */}
      <Sequence from={0} durationInFrames={Math.round(5.5 * fps)}>
        <HookCreatorGrid exitAtFrame={Math.round(5.5 * fps)} />
      </Sequence>

      {/* Hook: Tony/Wim/Gabor pop in big when name-dropped (7.2-10.8s) */}
      <Sequence from={Math.round(7.2 * fps)} durationInFrames={Math.round(3.6 * fps)}>
        <NameDropPortraits exitAtFrame={Math.round(3.6 * fps)} />
      </Sequence>

      {/* Ingredient 1: Broke a rule (10.8-24.3s of r1) */}
      <Sequence from={Math.round(10.8 * fps)} durationInFrames={Math.round(13.5 * fps)}>
        <IngredientBadge number={1} name="Broke a Rule" durationFrames={Math.round(13.5 * fps)} />
      </Sequence>

      {/* Ingredient 2: Unexpected combo (24.3-44.6s of r1) */}
      <Sequence from={Math.round(24.3 * fps)} durationInFrames={Math.round(20.3 * fps)}>
        <IngredientBadge number={2} name="Unexpected Combo" durationFrames={Math.round(20.3 * fps)} />
      </Sequence>

      {/* Ingredient 3: Remarkable results (0-15.2s of r2) */}
      <Sequence from={R1_FRAMES} durationInFrames={Math.round(15.2 * fps)}>
        <IngredientBadge number={3} name="Remarkable Results" durationFrames={Math.round(15.2 * fps)} />
      </Sequence>

      {/* Ingredient 4: Stupid simplicity (16.2-27.6s of r2) */}
      <Sequence from={R1_FRAMES + Math.round(16.2 * fps)} durationInFrames={Math.round(11.4 * fps)}>
        <IngredientBadge number={4} name="Stupid Simplicity" durationFrames={Math.round(11.4 * fps)} />
      </Sequence>

      {/* Ingredient 5: Time in game (28.3-35.8s of r2) */}
      <Sequence from={R1_FRAMES + Math.round(28.3 * fps)} durationInFrames={Math.round(7.5 * fps)}>
        <IngredientBadge number={5} name="Time in Game" durationFrames={Math.round(7.5 * fps)} />
      </Sequence>

      {/* Stat overlay (43.5-47.4s of r2) */}
      <Sequence from={R1_FRAMES + Math.round(43.5 * fps)} durationInFrames={Math.round(3.9 * fps)}>
        <StatOverlay />
      </Sequence>

      {/* CTA (47.8-end of r2) */}
      <Sequence from={R1_FRAMES + Math.round(47.8 * fps)} durationInFrames={Math.round(9.5 * fps)}>
        <CTAOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};
