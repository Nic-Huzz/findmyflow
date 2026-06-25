/**
 * Preview composition showing all overlay components against aurora bg.
 * Use `npm run dev` and select "OverlayPreview" in Remotion Studio.
 */
import React from "react";
import { AbsoluteFill, Sequence, useVideoConfig } from "remotion";
import { VR } from "./common";
import { AuroraBackground } from "./HowTheyPaidRent";
import { PortraitCard } from "./overlays/PortraitCard";
import { RevenueBadge } from "./overlays/RevenueBadge";
import { StatCard } from "./overlays/StatCard";
import { SeriesBumper } from "./overlays/SeriesBumper";

export const OverlayPreview: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill style={{ background: VR.ink }}>
      {/* Simulated video background */}
      <AuroraBackground seed="preview" />

      {/* Semi-transparent face placeholder so you can see positioning */}
      <div
        style={{
          position: "absolute",
          left: "50%",
          top: "40%",
          transform: "translate(-50%, -50%)",
          width: 300,
          height: 400,
          borderRadius: 20,
          border: `2px dashed ${VR.gray[700]}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: VR.gray[700],
          fontSize: 14,
          fontWeight: 700,
          letterSpacing: 2,
        }}
      >
        YOUR FACE HERE
      </div>

      {/* 1. Series bumper — bottom center, 0-2s */}
      <Sequence from={0} durationInFrames={fps * 2.5}>
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SeriesBumper exitAtFrame={fps * 2.5 - 20} />
        </div>
      </Sequence>

      {/* 2. Portrait card — top right, 1-4s */}
      <Sequence from={fps * 1} durationInFrames={fps * 3.5}>
        <div style={{ position: "absolute", right: 20, top: "8%" }}>
          <PortraitCard
            name="Tony Robbins"
            oneLiner="Change your state, change your life."
            portraitSrc="images/tony-robbins.png"
            exitAtFrame={fps * 3.5 - 20}
          />
        </div>
      </Sequence>

      {/* 3. Revenue badge — bottom center, 4-7s */}
      <Sequence from={fps * 4} durationInFrames={fps * 3}>
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <RevenueBadge
            revenueModel="small_group_paid"
            exitAtFrame={fps * 3 - 20}
          />
        </div>
      </Sequence>

      {/* 4. Stat card — top center, 7-10s */}
      <Sequence from={fps * 7} durationInFrames={fps * 3}>
        <div
          style={{
            position: "absolute",
            top: "8%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <StatCard
            value={12}
            suffix=" years"
            label="before anyone noticed"
            exitAtFrame={fps * 3 - 20}
          />
        </div>
      </Sequence>

      {/* 5. Multiple revenue badges cascading — 10-14s */}
      {[
        { model: "day_job_side_project", delay: 0 },
        { model: "one_on_one_service", delay: 4 },
        { model: "free_events_paid_elsewhere", delay: 8 },
        { model: "small_group_paid", delay: 12 },
        { model: "institutional_salary", delay: 16 },
      ].map((item, i) => (
        <Sequence
          key={item.model}
          from={fps * 10 + item.delay}
          durationInFrames={fps * 4 - item.delay}
        >
          <div
            style={{
              position: "absolute",
              left: 40,
              top: `${12 + i * 11}%`,
            }}
          >
            <RevenueBadge
              revenueModel={item.model}
              exitAtFrame={fps * 4 - item.delay - 20}
            />
          </div>
        </Sequence>
      ))}

      {/* 6. Outro bumper — 14-16s */}
      <Sequence from={fps * 14} durationInFrames={fps * 2}>
        <div
          style={{
            position: "absolute",
            bottom: "15%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SeriesBumper
            seriesName="HOW THEY PAID RENT"
            tagline="viberise.nichuzz.com"
            variant="outro"
            exitAtFrame={fps * 2 - 15}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
