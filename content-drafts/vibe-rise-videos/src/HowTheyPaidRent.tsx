import {
  AbsoluteFill,
  Img,
  Sequence,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, linearTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";
import { loadFont as loadFraunces } from "@remotion/google-fonts/Fraunces";
import { lerp, EASE, VR } from "./common";

export const { fontFamily: inter } = loadInter("normal", {
  weights: ["300", "400", "700", "900"],
  subsets: ["latin"],
});
export const { fontFamily: fraunces } = loadFraunces("italic", {
  weights: ["300", "500"],
  subsets: ["latin"],
});

export const MODEL_LABELS: Record<string, string> = {
  day_job_side_project: "Day Job + Side Project",
  one_on_one_service: "1:1 Service",
  free_events_paid_elsewhere: "Free Events, Paid Elsewhere",
  small_group_paid: "Small Group Paid Events",
  institutional_salary: "Institutional Salary",
};

export const MODEL_EMOJI: Record<string, string> = {
  day_job_side_project: "💼",
  one_on_one_service: "🤝",
  free_events_paid_elsewhere: "🎁",
  small_group_paid: "🎪",
  institutional_salary: "🏛️",
};

type Props = {
  name: string;
  oneLiner: string;
  bio: string;
  blowUpMoment: string;
  blowUpYear: string;
  revenueModel: string;
  earlyRevenue: string;
  trustYears: number;
  portraitSrc: string;
};

// ─── Aurora Background ────────────────────────────────────────────────

export const AuroraBackground: React.FC<{ seed?: string }> = ({ seed = "bg" }) => {
  const frame = useCurrentFrame();
  const l1x = Math.sin(frame * 0.015) * 15;
  const l2x = Math.cos(frame * 0.02) * 20;
  const l3x = Math.sin(frame * 0.01 + 1) * 18;

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: `${35 + l1x}%`,
          top: "5%",
          width: "55%",
          height: "45%",
          background: `radial-gradient(ellipse at center, ${VR.purple}50 0%, transparent 70%)`,
          filter: "blur(70px)",
          transform: `rotate(${frame * 0.15}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${20 + l2x}%`,
          top: "30%",
          width: "60%",
          height: "35%",
          background: `radial-gradient(ellipse at center, ${VR.gold}30 0%, transparent 70%)`,
          filter: "blur(80px)",
          transform: `rotate(${-frame * 0.1}deg)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: `${50 + l3x}%`,
          top: "60%",
          width: "45%",
          height: "40%",
          background: `radial-gradient(ellipse at center, ${VR.purpleBright}25 0%, transparent 70%)`,
          filter: "blur(60px)",
          transform: `rotate(${frame * 0.08}deg)`,
        }}
      />
      {/* Stars */}
      {Array.from({ length: 20 }).map((_, i) => {
        const twinkle = Math.sin(frame * 0.08 + i * 2) * 0.4 + 0.4;
        return (
          <div
            key={`star-${seed}-${i}`}
            style={{
              position: "absolute",
              left: `${random(`${seed}-sx-${i}`) * 100}%`,
              top: `${random(`${seed}-sy-${i}`) * 100}%`,
              width: random(`${seed}-ss-${i}`) * 2.5 + 0.5,
              height: random(`${seed}-ss-${i}`) * 2.5 + 0.5,
              background: VR.white,
              borderRadius: "50%",
              opacity: twinkle,
            }}
          />
        );
      })}
    </>
  );
};

// ─── Decorative Line ──────────────────────────────────────────────────

export const AnimatedLine: React.FC<{
  delay: number;
  width: number;
  y?: string;
  color?: string;
}> = ({ delay, width, y = "50%", color = VR.gray[700] }) => {
  const frame = useCurrentFrame();
  const w = lerp(frame, [delay, delay + 25], [0, width], EASE.out);
  return (
    <div
      style={{
        position: "absolute",
        left: "50%",
        top: y,
        transform: "translateX(-50%)",
        width: w,
        height: 1,
        background: color,
      }}
    />
  );
};

// ─── Staggered Word Reveal ────────────────────────────────────────────

export const WordReveal: React.FC<{
  text: string;
  delay?: number;
  fontSize?: number;
  fontWeight?: number;
  color?: string;
  family?: string;
  italic?: boolean;
  center?: boolean;
  maxWidth?: number;
}> = ({
  text,
  delay = 0,
  fontSize = 48,
  fontWeight = 900,
  color = VR.white,
  family = inter,
  italic = false,
  center = true,
  maxWidth = 800,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = text.split(" ");

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        justifyContent: center ? "center" : "flex-start",
        gap: fontSize * 0.22,
        maxWidth,
        fontFamily: family,
        fontSize,
        fontWeight,
        fontStyle: italic ? "italic" : "normal",
        lineHeight: 1.2,
        textAlign: center ? "center" : "left",
      }}
    >
      {words.map((word, i) => {
        const wordDelay = delay + i * 3;
        const progress = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 18, stiffness: 180, mass: 0.6 },
        });
        return (
          <span
            key={`word-${i}-${word}`}
            style={{
              display: "inline-block",
              color,
              opacity: progress,
              transform: `translateY(${(1 - progress) * 20}px)`,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

// ─── Scene 1: Intro ───────────────────────────────────────────────────

const SceneIntro: React.FC<Props> = ({ name, oneLiner, portraitSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const portraitProgress = spring({
    frame,
    fps,
    config: { damping: 18, stiffness: 120, mass: 0.5 },
  });

  const glowPulse = Math.sin(frame * 0.06) * 0.15 + 0.35;

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <AuroraBackground seed="intro" />

      {/* Portrait glow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "32%",
          transform: "translate(-50%, -50%)",
          width: 320,
          height: 320,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${VR.gold}${Math.floor(glowPulse * 255).toString(16).padStart(2, "0")} 0%, transparent 60%)`,
        }}
      />

      {/* Portrait */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "32%",
          transform: `translate(-50%, -50%) scale(${portraitProgress})`,
          width: 200,
          height: 200,
          borderRadius: 28,
          overflow: "hidden",
          border: `3px solid ${VR.gold}60`,
          boxShadow: `0 0 50px ${VR.purple}50, 0 20px 60px rgba(0,0,0,0.5)`,
        }}
      >
        <Img src={staticFile(portraitSrc)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
      </div>

      {/* Name — staggered word reveal */}
      <div style={{ position: "absolute", left: 0, right: 0, top: "52%", display: "flex", justifyContent: "center" }}>
        <WordReveal text={name} delay={10} fontSize={50} fontWeight={900} />
      </div>

      {/* Decorative line */}
      <AnimatedLine delay={25} width={120} y="62%" color={`${VR.gold}60`} />

      {/* One-liner */}
      <div style={{ position: "absolute", left: 60, right: 60, top: "66%", display: "flex", justifyContent: "center" }}>
        <WordReveal
          text={`"${oneLiner}"`}
          delay={20}
          fontSize={21}
          fontWeight={300}
          color={`${VR.bone}80`}
          family={fraunces}
          italic
        />
      </div>

      {/* Series badge */}
      <div
        style={{
          position: "absolute",
          bottom: "12%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase" as const,
          color: VR.gold,
          opacity: lerp(frame, [35, 50], [0, 1], EASE.out),
        }}
      >
        HOW THEY PAID RENT
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 2: Revenue Model ──────────────────────────────────────────

const SceneRevenue: React.FC<Props> = ({ name, revenueModel, earlyRevenue }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const badgeSpring = spring({
    frame: frame - 8,
    fps,
    config: { damping: 14, stiffness: 160, mass: 0.5 },
  });

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <AuroraBackground seed="revenue" />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "18%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase" as const,
          color: VR.gray[600],
          opacity: lerp(frame, [0, 15], [0, 1], EASE.out),
        }}
      >
        Before anyone noticed
      </div>

      {/* Revenue model badge */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "34%",
          transform: `translate(-50%, -50%) scale(${badgeSpring})`,
          display: "flex",
          alignItems: "center",
          gap: 16,
          padding: "22px 44px",
          borderRadius: 20,
          border: `1px solid ${VR.gold}40`,
          background: `linear-gradient(135deg, ${VR.gold}14, ${VR.purple}08)`,
          boxShadow: `0 0 40px ${VR.gold}15`,
        }}
      >
        <span style={{ fontSize: 44 }}>{MODEL_EMOJI[revenueModel] || "💼"}</span>
        <span style={{ fontSize: 26, fontWeight: 800, color: VR.gold }}>{MODEL_LABELS[revenueModel] || revenueModel}</span>
      </div>

      {/* Left accent line */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: "52%",
          width: 3,
          height: lerp(frame, [15, 45], [0, 200], EASE.out),
          background: `linear-gradient(to bottom, ${VR.purple}, ${VR.gold})`,
          borderRadius: 2,
        }}
      />

      {/* Description */}
      <div style={{ position: "absolute", left: 80, right: 60, top: "52%", paddingRight: 40 }}>
        <WordReveal
          text={earlyRevenue}
          delay={18}
          fontSize={24}
          fontWeight={400}
          color={`${VR.bone}90`}
          center={false}
          maxWidth={900}
        />
      </div>

      {/* Name reminder — bottom */}
      <div
        style={{
          position: "absolute",
          bottom: "10%",
          right: 60,
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 3,
          color: VR.gray[700],
          opacity: lerp(frame, [30, 45], [0, 1]),
        }}
      >
        {name.toUpperCase()}
      </div>
    </AbsoluteFill>
  );
};

// ─── Scene 3: Blow Up Moment ─────────────────────────────────────────

const SceneBlowUp: React.FC<Props> = ({ blowUpMoment, blowUpYear, trustYears }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const yearChars = (blowUpYear || "").split("");
  const barProgress = lerp(frame, [25, 70], [0, 1], EASE.out);

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <AuroraBackground seed="blowup" />

      {/* Eyebrow */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "14%",
          transform: "translateX(-50%)",
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: 5,
          textTransform: "uppercase" as const,
          color: VR.purple,
          opacity: lerp(frame, [0, 15], [0, 1]),
        }}
      >
        The blow-up moment
      </div>

      {/* Year — per character kinetic */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "28%",
          transform: "translate(-50%, -50%)",
          display: "flex",
          gap: 4,
        }}
      >
        {yearChars.map((char, i) => {
          const charProgress = spring({
            frame: frame - 5 - i * 4,
            fps,
            config: { damping: 12, stiffness: 200, mass: 0.7 },
          });
          return (
            <span
              key={`year-${i}`}
              style={{
                fontSize: 90,
                fontWeight: 900,
                letterSpacing: -2,
                background: `linear-gradient(135deg, ${VR.purple} 0%, ${VR.gold} 100%)`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                display: "inline-block",
                transform: `translateY(${(1 - charProgress) * 60}px) scale(${charProgress})`,
                opacity: charProgress,
              }}
            >
              {char}
            </span>
          );
        })}
      </div>

      {/* Blow up description */}
      <div style={{ position: "absolute", left: 60, right: 60, top: "42%", display: "flex", justifyContent: "center" }}>
        <WordReveal
          text={blowUpMoment}
          delay={20}
          fontSize={23}
          fontWeight={400}
          color={`${VR.bone}80`}
          maxWidth={800}
        />
      </div>

      {/* Timeline bar */}
      {trustYears > 0 && (
        <div
          style={{
            position: "absolute",
            left: "10%",
            right: "10%",
            bottom: "18%",
          }}
        >
          <div
            style={{
              height: 6,
              borderRadius: 3,
              background: `${VR.white}0a`,
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${barProgress * 100}%`,
                borderRadius: 3,
                background: `linear-gradient(90deg, ${VR.purple}, ${VR.gold})`,
                boxShadow: `0 0 20px ${VR.gold}40`,
              }}
            />
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              marginTop: 10,
              fontSize: 13,
              fontWeight: 700,
              color: VR.gray[600],
            }}
          >
            <span style={{ opacity: lerp(frame, [30, 40], [0, 1]) }}>Started</span>
            <span
              style={{
                color: VR.gold,
                opacity: lerp(frame, [50, 65], [0, 1]),
              }}
            >
              {trustYears} years
            </span>
          </div>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ─── Scene 4: CTA ────────────────────────────────────────────────────

const SceneCTA: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill style={{ background: VR.ink, fontFamily: inter }}>
      <AuroraBackground seed="cta" />

      <div style={{ position: "absolute", left: 60, right: 60, top: "38%", display: "flex", justifyContent: "center" }}>
        <WordReveal
          text="Your movement doesn't need permission to start."
          delay={0}
          fontSize={42}
          fontWeight={900}
        />
      </div>

      {/* Decorative line */}
      <AnimatedLine delay={20} width={80} y="58%" color={VR.gold} />

      {/* Vibe Rise brand */}
      <div
        style={{
          position: "absolute",
          bottom: "16%",
          left: "50%",
          transform: "translateX(-50%)",
          fontSize: 15,
          fontWeight: 700,
          letterSpacing: 8,
          textTransform: "uppercase" as const,
          color: VR.gold,
          opacity: lerp(frame, [25, 40], [0, 1], EASE.out),
          textShadow: `0 0 30px ${VR.gold}40`,
        }}
      >
        VIBE RISE
      </div>
    </AbsoluteFill>
  );
};

// ─── Main Composition ────────────────────────────────────────────────

export const HowTheyPaidRent: React.FC<Props> = (props) => {
  const { fps } = useVideoConfig();

  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={fps * 6}>
        <SceneIntro {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={fps * 8}>
        <SceneRevenue {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={slide({ direction: "from-right" })}
        timing={linearTiming({ durationInFrames: 12 })}
      />
      <TransitionSeries.Sequence durationInFrames={fps * 7}>
        <SceneBlowUp {...props} />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition
        presentation={fade()}
        timing={linearTiming({ durationInFrames: 15 })}
      />
      <TransitionSeries.Sequence durationInFrames={fps * 5}>
        <SceneCTA />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
