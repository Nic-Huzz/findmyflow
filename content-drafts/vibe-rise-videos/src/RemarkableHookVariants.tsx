/**
 * Two hook variants for A/B testing.
 * Each uses a different hook video, then cuts to the same body footage.
 *
 * Hook A (13.6s): "Are you an experience creator wondering why your brand isn't growing?"
 * Hook B (10s): "I studied a hundred experience creator brands. Tony Robbins, Wim Hof, Gabor Mate."
 *
 * Body: remarkable-1 (ingredients 1-2) + remarkable-2 (ingredients 3-5 + stat + CTA)
 * Same subtitles/overlays as RemarkableSelfie but offset by hook duration.
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

// ─── Durations ───────────────────────────────────────────────────────

// Hook A: skip first 1.2s stumble, play from 1.2s to 12.1s
const HOOK_A_SKIP = 1.2; // skip initial stumble
const HOOK_A_FRAMES = Math.round((12.1 - HOOK_A_SKIP) * 30);
const HOOK_B_FRAMES = Math.round(9.0 * 30);  // trim before movement
const R1_SKIP = 10.8; // seconds to skip (old hook in remarkable-1)
const R1_FRAMES = Math.round((44.8 - R1_SKIP) * 30); // body only, no old hook
const R2_FRAMES = Math.round(56.0 * 30);

// ─── Hook Subtitles ──────────────────────────────────────────────────

// Subtitles offset by -HOOK_A_SKIP since video starts at 0.5s
const hookASubs: SubtitlePhrase[] = [
  { start: 0.0 - HOOK_A_SKIP, end: 2.5 - HOOK_A_SKIP, text: "Are you an experience creator", highlight: ["experience", "creator"], fontSize: 44 },
  { start: 2.5 - HOOK_A_SKIP, end: 4.5 - HOOK_A_SKIP, text: "wondering why your brand isn't growing?", highlight: ["brand", "growing"], fontSize: 38 },
  { start: 4.8 - HOOK_A_SKIP, end: 7.0 - HOOK_A_SKIP, text: "I studied a hundred of the biggest", highlight: ["hundred"], fontSize: 38 },
  { start: 7.0 - HOOK_A_SKIP, end: 8.8 - HOOK_A_SKIP, text: "Tony Robbins, Wim Hof and Gabor Mate", highlight: ["Tony", "Robbins", "Wim", "Hof", "Gabor", "Mate"], fontSize: 38 },
  { start: 9.1 - HOOK_A_SKIP, end: 12.1 - HOOK_A_SKIP, text: "Five ingredients all of them used to blow up", highlight: ["Five", "ingredients", "blow", "up"], fontSize: 38 },
];

const hookBSubs: SubtitlePhrase[] = [
  { start: 0.0, end: 2.0, text: "I studied a hundred experience creator brands", highlight: ["hundred"], fontSize: 38 },
  { start: 2.0, end: 4.4, text: "Tony Robbins, Wim Hof, Gabor Mate", highlight: ["Tony", "Robbins", "Wim", "Hof", "Gabor", "Mate"], fontSize: 44 },
  { start: 4.9, end: 6.5, text: "The same five ingredients", highlight: ["five", "ingredients"], fontSize: 52 },
  { start: 6.5, end: 9.0, text: "led to all their brands blowing up", highlight: ["blowing", "up"], fontSize: 38 },
];

// ─── Body Subtitles (offset by -10.8s since we skip the old hook in remarkable-1) ───

const BODY_SKIP = 10.8; // seconds to skip at start of remarkable-1 (old hook)

const remarkable1Subs: SubtitlePhrase[] = [
  { start: 10.8 - BODY_SKIP, end: 12.3 - BODY_SKIP, text: "One: they broke a rule", highlight: ["broke", "rule"], fontSize: 44 },
  { start: 12.7 - BODY_SKIP, end: 14.8 - BODY_SKIP, text: "Doing something the existing industry didn't", fontSize: 38 },
  { start: 15.1 - BODY_SKIP, end: 18.2 - BODY_SKIP, text: "Wim Hof used ice and breathing to train his nervous system", highlight: ["ice", "breathing", "nervous", "system"], fontSize: 34 },
  { start: 18.5 - BODY_SKIP, end: 20.7 - BODY_SKIP, text: "Gabor Mate treated the trauma, not the addiction", highlight: ["trauma", "addiction"], fontSize: 34 },
  { start: 21.1 - BODY_SKIP, end: 24.3 - BODY_SKIP, text: "Tony Robbins used therapy in an empowering setting", highlight: ["therapy", "empowering"], fontSize: 34 },
  { start: 24.3 - BODY_SKIP, end: 26.8 - BODY_SKIP, text: "Two: unexpected combo", highlight: ["unexpected", "combo"], fontSize: 44 },
  { start: 27.4 - BODY_SKIP, end: 30.3 - BODY_SKIP, text: "This rule break often comes from combining two worlds", highlight: ["two", "worlds"], fontSize: 38 },
  { start: 30.5 - BODY_SKIP, end: 32.6 - BODY_SKIP, text: "using their experience from outside the space", fontSize: 38 },
  { start: 33.2 - BODY_SKIP, end: 36.3 - BODY_SKIP, text: "Tony Robbins: motivational speaking into therapy", highlight: ["motivational", "speaking", "therapy"], fontSize: 34 },
  { start: 36.7 - BODY_SKIP, end: 39.9 - BODY_SKIP, text: "Wim Hof: ice baths and breathing into treating mental health", highlight: ["ice", "baths", "mental", "health"], fontSize: 34 },
  { start: 40.3 - BODY_SKIP, end: 44.6 - BODY_SKIP, text: "Gabor Mate: childhood trauma into addiction medicine", highlight: ["childhood", "trauma", "addiction"], fontSize: 34 },
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

// ─── Shared Components ───────────────────────────────────────────────

const glassStyle = (opacity = 0.88): React.CSSProperties => ({
  background: `rgba(6, 3, 15, ${opacity})`,
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  borderRadius: 24,
  border: `2px solid ${VR.gold}25`,
  boxShadow: `0 8px 40px rgba(0,0,0,0.6)`,
});

const CreatorPortrait: React.FC<{ src: string; delay?: number; size?: number }> = ({ src, delay = 0, size = 120 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 200, mass: 0.4 } });
  const glowPulse = Math.sin(frame * 0.06) * 0.1 + 0.25;

  return (
    <div style={{
      width: size, height: size, borderRadius: 20, overflow: "hidden",
      border: `3px solid ${VR.gold}50`,
      boxShadow: `0 4px 24px rgba(0,0,0,0.5), 0 0 20px ${VR.gold}${Math.floor(glowPulse * 255).toString(16).padStart(2, "0")}`,
      transform: `scale(${scale})`, opacity: scale, flexShrink: 0,
    }}>
      <Img src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
    </div>
  );
};

const allCreatorImages = [
  "images/deepak-chopra.png", "images/eckhart-tolle.png", "images/esther-perel.png",
  "images/jay-shetty.png", "images/joe-dispenza.png", "images/jack-kornfield.png",
  "images/priya-parker.png", "images/gabby-bernstein.png", "images/phil-jackson.png",
  "images/marianne-williamson.png", "images/aubrey-marcus.png", "images/michael-beckwith.png",
  "images/mooji.png", "images/bessel-van-der-kolk.png", "images/bren-brown.png",
];

const HookCreatorGrid: React.FC<{ exitAtFrame: number }> = ({ exitAtFrame }) => {
  const frame = useCurrentFrame();
  const exitOpacity = lerp(frame, [exitAtFrame - 12, exitAtFrame], [1, 0], EASE.in);
  const rows = [allCreatorImages.slice(0, 5), allCreatorImages.slice(5, 10), allCreatorImages.slice(10, 15)];

  return (
    <div style={{ position: "absolute", top: "66%", left: 0, right: 0, display: "flex", flexDirection: "column", alignItems: "center", gap: 12, opacity: exitOpacity, zIndex: 4 }}>
      {rows.map((row, ri) => (
        <div key={`r-${ri}`} style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          {row.map((src, ci) => <CreatorPortrait key={`g-${ri}-${ci}`} src={src} delay={ri * 3 + ci * 1.5} size={140} />)}
        </div>
      ))}
    </div>
  );
};

const NameDropPortraits: React.FC<{ exitAtFrame: number }> = ({ exitAtFrame }) => {
  const frame = useCurrentFrame();
  const exitOpacity = lerp(frame, [exitAtFrame - 10, exitAtFrame], [1, 0], EASE.in);
  const creators = [
    { src: "images/tony-robbins.png", delay: 0 },
    { src: "images/wim-hof.png", delay: 6 },
    { src: "images/gabor-mate.png", delay: 12 },
  ];

  return (
    <div style={{ position: "absolute", top: "65%", left: 0, right: 0, display: "flex", justifyContent: "center", gap: 24, opacity: exitOpacity, zIndex: 6 }}>
      {creators.map((c, i) => <CreatorPortrait key={`nd-${i}`} src={c.src} delay={c.delay} size={280} />)}
    </div>
  );
};

const IngredientBadge: React.FC<{ number: number; name: string; durationFrames: number }> = ({ number, name, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const badgeScale = spring({ frame: frame - 3, fps, config: { damping: 12, stiffness: 180, mass: 0.5 } });
  const exitOpacity = lerp(frame, [durationFrames - 15, durationFrames - 5], [1, 0], EASE.in);

  return (
    <div style={{ position: "absolute", top: "4%", left: "50%", transform: `translateX(-50%) scale(${badgeScale})`, ...glassStyle(0.9), display: "flex", alignItems: "center", gap: 24, padding: "36px 56px", opacity: exitOpacity }}>
      <div style={{ fontFamily: inter, fontSize: 64, fontWeight: 900, color: VR.gold, lineHeight: 1 }}>{number}</div>
      <div>
        <div style={{ fontFamily: inter, fontSize: 24, fontWeight: 700, letterSpacing: 8, color: VR.gray[600], textTransform: "uppercase" as const }}>INGREDIENT</div>
        <div style={{ fontFamily: inter, fontSize: 44, fontWeight: 900, color: VR.gold, marginTop: 4 }}>{name}</div>
      </div>
    </div>
  );
};

const ProgressDots: React.FC<{ active: number }> = ({ active }) => (
  <div style={{ position: "absolute", top: 24, left: "50%", transform: "translateX(-50%)", display: "flex", gap: 10, zIndex: 10 }}>
    {[1, 2, 3, 4, 5].map((n) => (
      <div key={`d-${n}`} style={{ width: n <= active ? 28 : 10, height: 10, borderRadius: 5, background: n <= active ? VR.gold : `${VR.white}25`, boxShadow: n <= active ? `0 0 12px ${VR.gold}50` : "none" }} />
    ))}
  </div>
);

const BottomGradient: React.FC = () => (
  <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "30%", background: "linear-gradient(to top, rgba(6, 3, 15, 0.7) 0%, rgba(6, 3, 15, 0.3) 50%, transparent 100%)", pointerEvents: "none", zIndex: 1 }} />
);

const ZoomPunchVideo: React.FC<{ src: string }> = ({ src }) => {
  const frame = useCurrentFrame();
  let scale = 1;
  if (frame >= 0 && frame < 15) { scale = 1 + Math.sin((frame / 15) * Math.PI) * 0.06; }
  return <OffthreadVideo src={staticFile(src)} style={{ width: "100%", height: "100%", objectFit: "cover" as const, transform: `scale(${scale})` }} />;
};

const StatOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const numScale = spring({ frame: frame - 5, fps, config: { damping: 10, stiffness: 160, mass: 0.6 } });
  const displayYears = Math.floor(lerp(frame, [5, 40], [0, 14], EASE.out));

  return (
    <div style={{ position: "absolute", top: "4%", left: "50%", transform: "translateX(-50%)", ...glassStyle(0.9), padding: "36px 56px", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontFamily: inter, fontSize: 18, fontWeight: 700, letterSpacing: 4, color: VR.gray[600], textTransform: "uppercase" as const }}>THE AVERAGE</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
        <div style={{ fontFamily: inter, fontSize: 80, fontWeight: 900, background: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.gold} 100%)`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", transform: `scale(${numScale})`, lineHeight: 1 }}>{displayYears}</div>
        <div style={{ fontFamily: inter, fontSize: 36, fontWeight: 700, color: VR.gold, opacity: lerp(frame, [25, 40], [0, 1], EASE.out) }}>years</div>
      </div>
    </div>
  );
};

const CTAOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brandScale = spring({ frame: frame - 10, fps, config: { damping: 16, stiffness: 120, mass: 0.6 } });

  return (
    <div style={{ position: "absolute", bottom: "10%", left: "50%", transform: `translateX(-50%) scale(${brandScale})`, ...glassStyle(0.9), padding: "32px 56px", display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
      <div style={{ fontFamily: inter, fontSize: 56, fontWeight: 900, letterSpacing: 12, color: VR.gold, textShadow: `0 0 30px ${VR.gold}40` }}>VIBE RISE</div>
      <div style={{ fontFamily: inter, fontSize: 28, fontWeight: 400, color: `${VR.bone}70`, letterSpacing: 4 }}>Message "keen" to start</div>
    </div>
  );
};

// ─── Variant Builder ─────────────────────────────────────────────────

const RemarkableVariant: React.FC<{
  hookSrc: string;
  hookFrames: number;
  hookSubs: SubtitlePhrase[];
  hookNameDropStart: number; // seconds into the TRIMMED hook when names are said
  hookGridStart: number; // seconds into the TRIMMED hook when grid should appear
  hookGridEnd: number; // seconds into the TRIMMED hook when grid should exit
  hookSkipFrames: number; // frames to skip at start of hook video
}> = ({ hookSrc, hookFrames, hookSubs, hookNameDropStart, hookGridStart, hookGridEnd, hookSkipFrames }) => {
  const fps = 30;
  const frame = useCurrentFrame();

  const r1Start = hookFrames;
  const r2Start = hookFrames + R1_FRAMES;

  // Ingredient timestamps (adjusted for skipped 10.8s in remarkable-1)
  const i1Start = r1Start + Math.round((10.8 - R1_SKIP) * fps);
  const i2Start = r1Start + Math.round((24.3 - R1_SKIP) * fps);
  const i3Start = r2Start;
  const i4Start = r2Start + Math.round(16.2 * fps);
  const i5Start = r2Start + Math.round(28.3 * fps);
  const statsStart = r2Start + Math.round(43.5 * fps);

  let active = 0;
  if (frame >= i1Start) active = 1;
  if (frame >= i2Start) active = 2;
  if (frame >= i3Start) active = 3;
  if (frame >= i4Start) active = 4;
  if (frame >= i5Start) active = 5;
  const showDots = frame >= i1Start && frame < statsStart;

  return (
    <AbsoluteFill>
      {/* Hook video */}
      <Sequence from={0} durationInFrames={hookFrames}>
        {hookSkipFrames > 0 ? (
          <OffthreadVideo
            src={staticFile(hookSrc)}
            startFrom={hookSkipFrames}
            style={{ width: "100%", height: "100%", objectFit: "cover" as const }}
          />
        ) : (
          <ZoomPunchVideo src={hookSrc} />
        )}
      </Sequence>
      {/* Body video 1 (skip old hook, start at 10.8s) */}
      <Sequence from={r1Start} durationInFrames={R1_FRAMES}>
        <OffthreadVideo
          src={staticFile("remarkable-1.mov")}
          startFrom={Math.round(R1_SKIP * 30)}
          style={{ width: "100%", height: "100%", objectFit: "cover" as const }}
        />
      </Sequence>
      {/* Body video 2 */}
      <Sequence from={r2Start} durationInFrames={R2_FRAMES}>
        <ZoomPunchVideo src="remarkable-2.mov" />
      </Sequence>

      <BottomGradient />
      {showDots && <ProgressDots active={active} />}

      {/* Hook subtitles */}
      <Sequence from={0} durationInFrames={hookFrames}>
        <PopSubtitle phrases={hookSubs} />
      </Sequence>
      {/* Body subtitles */}
      <Sequence from={r1Start} durationInFrames={R1_FRAMES}>
        <PopSubtitle phrases={remarkable1Subs} />
      </Sequence>
      <Sequence from={r2Start} durationInFrames={R2_FRAMES}>
        <PopSubtitle phrases={remarkable2Subs} />
      </Sequence>

      {/* Hook grid */}
      <Sequence from={Math.round(hookGridStart * fps)} durationInFrames={Math.round((hookGridEnd - hookGridStart) * fps)}>
        <HookCreatorGrid exitAtFrame={Math.round((hookGridEnd - hookGridStart) * fps)} />
      </Sequence>
      {/* Name-drop portraits */}
      <Sequence from={Math.round(hookNameDropStart * fps)} durationInFrames={hookFrames - Math.round(hookNameDropStart * fps)}>
        <NameDropPortraits exitAtFrame={hookFrames - Math.round(hookNameDropStart * fps)} />
      </Sequence>

      {/* Ingredient badges (durations adjusted for trimmed remarkable-1) */}
      <Sequence from={i1Start} durationInFrames={i2Start - i1Start}>
        <IngredientBadge number={1} name="Broke a Rule" durationFrames={i2Start - i1Start} />
      </Sequence>
      <Sequence from={i2Start} durationInFrames={r2Start - i2Start}>
        <IngredientBadge number={2} name="Unexpected Combo" durationFrames={r2Start - i2Start} />
      </Sequence>
      <Sequence from={i3Start} durationInFrames={Math.round(15.2 * fps)}>
        <IngredientBadge number={3} name="Remarkable Results" durationFrames={Math.round(15.2 * fps)} />
      </Sequence>
      <Sequence from={i4Start} durationInFrames={Math.round(11.4 * fps)}>
        <IngredientBadge number={4} name="Stupid Simplicity" durationFrames={Math.round(11.4 * fps)} />
      </Sequence>
      <Sequence from={i5Start} durationInFrames={Math.round(7.5 * fps)}>
        <IngredientBadge number={5} name="Time in Game" durationFrames={Math.round(7.5 * fps)} />
      </Sequence>

      <Sequence from={statsStart} durationInFrames={Math.round(3.9 * fps)}>
        <StatOverlay />
      </Sequence>
      <Sequence from={r2Start + Math.round(47.8 * fps)} durationInFrames={Math.round(8.2 * fps)}>
        <CTAOverlay />
      </Sequence>
    </AbsoluteFill>
  );
};

// ─── Exports ─────────────────────────────────────────────────────────

// Hook A: "Are you an experience creator wondering why your brand isn't growing?"
// Trimmed: skip 0.5s stumble. Grid appears at "I studied a hundred" (~4.3s trimmed)
export const RemarkableHookA: React.FC = () => (
  <RemarkableVariant
    hookSrc="hook-a.mov"
    hookFrames={HOOK_A_FRAMES}
    hookSubs={hookASubs}
    hookNameDropStart={6.5}
    hookGridStart={4.3}
    hookGridEnd={6.5}
    hookSkipFrames={Math.round(HOOK_A_SKIP * 30)}
  />
);

// Hook B: "I studied a hundred experience creator brands. Tony Robbins, Wim Hof, Gabor Mate."
export const RemarkableHookB: React.FC = () => (
  <RemarkableVariant
    hookSrc="hook-b.mov"
    hookFrames={HOOK_B_FRAMES}
    hookSubs={hookBSubs}
    hookNameDropStart={2.0}
    hookGridStart={0}
    hookGridEnd={2.0}
    hookSkipFrames={0}
  />
);
