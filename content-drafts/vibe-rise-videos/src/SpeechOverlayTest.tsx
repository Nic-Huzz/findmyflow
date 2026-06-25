/**
 * Test composition: overlays on the Vibe Rise Fest speech video.
 *
 * Design rules for talking-head overlays:
 *   - Face zone (center 30-70% vertical) stays CLEAR
 *   - Overlays live in bottom 25% or top 15%
 *   - Lower-third is the anchor (appears early, reappears if needed)
 *   - KeywordPops are brief (1.5-2s) and center-screen — the only exception
 *   - Glass cards hug the bottom edge
 *
 * Timeline (30fps, ~66s):
 *   0-4s      SeriesBumper intro (bottom)
 *   4-9s      LowerThird (bottom-left)
 *   12s       KeywordPop "VIBE RISE" (1.5s, center)
 *   16-20s    RevenueBadge (bottom)
 *   23s       KeywordPop "SILENCE" (1.5s, center)
 *   27-33s    EraCard (top-left, safe zone)
 *   36s       KeywordPop "THE SHIFT" (2s, center)
 *   40-46s    TimelineBar (bottom)
 *   49s       KeywordPop "2026" (1.5s, center, purple)
 *   52-57s    StatCard (top)
 *   60-66s    SeriesBumper outro (bottom)
 */
import React from "react";
import {
  AbsoluteFill,
  OffthreadVideo,
  Sequence,
  staticFile,
  useVideoConfig,
} from "remotion";
import { RevenueBadge } from "./overlays/RevenueBadge";
import { StatCard } from "./overlays/StatCard";
import { SeriesBumper } from "./overlays/SeriesBumper";
import { TimelineBar } from "./overlays/TimelineBar";
import { EraCard } from "./overlays/EraCard";
import { LowerThird } from "./overlays/LowerThird";
import { KeywordPop } from "./overlays/KeywordPop";

export const SpeechOverlayTest: React.FC = () => {
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill>
      {/* Background: speech video, scaled to fill */}
      <OffthreadVideo
        src={staticFile("speech-export.mp4")}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* ─── 1. Series bumper intro — 0-4s ─────────────────────────── */}
      <Sequence from={0} durationInFrames={fps * 4}>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SeriesBumper
            seriesName="VIBE RISE FEST"
            tagline="BALI — MAY 2026"
            exitAtFrame={fps * 4 - 20}
          />
        </div>
      </Sequence>

      {/* ─── 2. Lower third — 4-9s ─────────────────────────────────── */}
      <Sequence from={fps * 4} durationInFrames={fps * 5}>
        <div style={{ position: "absolute", bottom: "10%", left: 0 }}>
          <LowerThird
            name="Huzz Hurrell"
            title="Founder, Vibe Rise"
            exitAtFrame={fps * 5 - 18}
          />
        </div>
      </Sequence>

      {/* ─── 3. Keyword pop "VIBE RISE" — 12s (1.5s) ──────────────── */}
      <Sequence from={fps * 12} durationInFrames={fps * 1.5}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <KeywordPop
            word="VIBE RISE"
            color="gold"
            exitAtFrame={fps * 1.5 - 12}
          />
        </div>
      </Sequence>

      {/* ─── 4. Revenue badge — 16-20s ─────────────────────────────── */}
      <Sequence from={fps * 16} durationInFrames={fps * 4}>
        <div
          style={{
            position: "absolute",
            bottom: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <RevenueBadge
            revenueModel="free_events_paid_elsewhere"
            exitAtFrame={fps * 4 - 20}
          />
        </div>
      </Sequence>

      {/* ─── 5. Keyword pop "SILENCE" — 23s (1.5s) ────────────────── */}
      <Sequence from={fps * 23} durationInFrames={fps * 1.5}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <KeywordPop
            word="SILENCE"
            subtitle="3 years building"
            color="white"
            exitAtFrame={fps * 1.5 - 12}
          />
        </div>
      </Sequence>

      {/* ─── 6. Era card — 27-33s (top-left safe zone) ────────────── */}
      <Sequence from={fps * 27} durationInFrames={fps * 6}>
        <div style={{ position: "absolute", left: 24, top: "4%" }}>
          <EraCard
            year="2023"
            description="Left VC, moved to Bali, started building the thing that wouldn't leave his head"
            exitAtFrame={fps * 6 - 20}
          />
        </div>
      </Sequence>

      {/* ─── 7. Keyword pop "THE SHIFT" — 36s (2s) ────────────────── */}
      <Sequence from={fps * 36} durationInFrames={fps * 2}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <KeywordPop
            word="THE SHIFT"
            color="purple"
            exitAtFrame={fps * 2 - 12}
          />
        </div>
      </Sequence>

      {/* ─── 8. Timeline bar — 40-46s (bottom safe zone) ──────────── */}
      <Sequence from={fps * 40} durationInFrames={fps * 6}>
        <div
          style={{
            position: "absolute",
            bottom: "6%",
            left: "4%",
            right: "4%",
          }}
        >
          <TimelineBar
            years={3}
            startLabel="Quit VC"
            endLabel="Vibe Rise Fest"
            exitAtFrame={fps * 6 - 20}
          />
        </div>
      </Sequence>

      {/* ─── 9. Keyword pop "2026" — 49s (1.5s, purple) ───────────── */}
      <Sequence from={fps * 49} durationInFrames={fps * 1.5}>
        <div
          style={{
            position: "absolute",
            top: "10%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <KeywordPop
            word="2026"
            subtitle="the year it landed"
            color="gold"
            exitAtFrame={fps * 1.5 - 12}
          />
        </div>
      </Sequence>

      {/* ─── 10. Stat card — 52-57s (top safe zone) ───────────────── */}
      <Sequence from={fps * 52} durationInFrames={fps * 5}>
        <div
          style={{
            position: "absolute",
            top: "4%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <StatCard
            value={200}
            suffix="+"
            label="strangers at Vibe Rise Fest"
            exitAtFrame={fps * 5 - 20}
          />
        </div>
      </Sequence>

      {/* ─── 11. Series bumper outro — 60-66s ─────────────────────── */}
      <Sequence from={fps * 60} durationInFrames={fps * 6}>
        <div
          style={{
            position: "absolute",
            bottom: "12%",
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <SeriesBumper
            seriesName="HOW THEY PAID RENT"
            tagline="viberise.nichuzz.com"
            variant="outro"
            exitAtFrame={fps * 6 - 15}
          />
        </div>
      </Sequence>
    </AbsoluteFill>
  );
};
