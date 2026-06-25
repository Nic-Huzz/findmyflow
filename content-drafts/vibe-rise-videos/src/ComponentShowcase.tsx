/**
 * Showcase composition — renders each overlay component one at a time
 * with a label, so we can screenshot each for feedback.
 *
 * Timeline (30fps):
 *   0-89    (0-3s)    SeriesBumper
 *   90-209  (3-7s)    PortraitCard
 *   210-329 (7-11s)   RevenueBadge
 *   330-449 (11-15s)  StatCard
 *   450-569 (15-19s)  TimelineBar
 *   570-689 (19-23s)  EraCard
 *   690-839 (23-28s)  BlowUpReveal
 */
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { VR } from "./common";
import { AuroraBackground, inter } from "./HowTheyPaidRent";
import { PortraitCard } from "./overlays/PortraitCard";
import { RevenueBadge } from "./overlays/RevenueBadge";
import { StatCard } from "./overlays/StatCard";
import { SeriesBumper } from "./overlays/SeriesBumper";
import { TimelineBar } from "./overlays/TimelineBar";
import { EraCard } from "./overlays/EraCard";
import { BlowUpReveal } from "./overlays/BlowUpReveal";

const Label: React.FC<{ text: string; number: number }> = ({ text, number }) => (
  <div
    style={{
      position: "absolute",
      top: 40,
      left: "50%",
      transform: "translateX(-50%)",
      fontFamily: inter,
      fontSize: 13,
      fontWeight: 700,
      letterSpacing: 4,
      color: VR.gray[600],
      textAlign: "center",
    }}
  >
    {number}/7 — {text}
  </div>
);

const FacePlaceholder: React.FC = () => (
  <div
    style={{
      position: "absolute",
      left: "50%",
      top: "42%",
      transform: "translate(-50%, -50%)",
      width: 280,
      height: 380,
      borderRadius: 20,
      border: `2px dashed ${VR.gray[800]}`,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: VR.gray[800],
      fontSize: 12,
      fontWeight: 700,
      letterSpacing: 2,
    }}
  >
    FACE
  </div>
);

export const ComponentShowcase: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: VR.ink }}>
      <AuroraBackground seed="showcase" />
      <FacePlaceholder />

      {/* 1. SeriesBumper */}
      <Sequence from={0} durationInFrames={90}>
        <Label text="SERIES BUMPER" number={1} />
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SeriesBumper />
        </div>
      </Sequence>

      {/* 2. PortraitCard */}
      <Sequence from={90} durationInFrames={120}>
        <Label text="PORTRAIT CARD" number={2} />
        <div style={{ position: "absolute", right: 20, top: "8%" }}>
          <PortraitCard
            name="Tony Robbins"
            oneLiner="Change your state, change your life."
            portraitSrc="images/tony-robbins.png"
          />
        </div>
      </Sequence>

      {/* 3. RevenueBadge */}
      <Sequence from={210} durationInFrames={120}>
        <Label text="REVENUE BADGE" number={3} />
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <RevenueBadge revenueModel="small_group_paid" />
        </div>
      </Sequence>

      {/* 4. StatCard */}
      <Sequence from={330} durationInFrames={120}>
        <Label text="STAT CARD" number={4} />
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <StatCard value={12} suffix=" years" label="before anyone noticed" />
        </div>
      </Sequence>

      {/* 5. TimelineBar */}
      <Sequence from={450} durationInFrames={120}>
        <Label text="TIMELINE BAR" number={5} />
        <div
          style={{
            position: "absolute",
            bottom: "8%",
            left: "5%",
            right: "5%",
          }}
        >
          <TimelineBar years={12} />
        </div>
      </Sequence>

      {/* 6. EraCard */}
      <Sequence from={570} durationInFrames={120}>
        <Label text="ERA CARD" number={6} />
        <div style={{ position: "absolute", left: 30, top: "12%" }}>
          <EraCard
            year="1979"
            description="Hotel conference rooms, 15 people, NLP seminars starting at age 17"
            showGrain
          />
        </div>
      </Sequence>

      {/* 7. BlowUpReveal */}
      <Sequence from={690} durationInFrames={150}>
        <Label text="BLOW-UP REVEAL" number={7} />
        <div
          style={{
            position: "absolute",
            left: "50%",
            top: "50%",
            transform: "translate(-50%, -50%)",
          }}
        >
          <BlowUpReveal
            blowUpYear="1991"
            blowUpMoment="His infomercial Personal Power became one of the most successful self-help products ever sold"
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
