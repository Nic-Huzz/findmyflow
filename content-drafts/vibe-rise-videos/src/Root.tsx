import React from "react";
import { Composition } from "remotion";
import { HowTheyPaidRent } from "./HowTheyPaidRent";
import { OverlayPreview } from "./OverlayPreview";
import { ComponentShowcase } from "./ComponentShowcase";
import { SpeechOverlayTest } from "./SpeechOverlayTest";
import { HowTheyPaidRent4Models } from "./HowTheyPaidRent4Models";
import { HowTheyPaidRentSelfie } from "./HowTheyPaidRentSelfie";
import { RemarkableSelfie } from "./RemarkableSelfie";
import { RemarkableHookA, RemarkableHookB } from "./RemarkableHookVariants";
import creatorData from "../public/experienceCreatorDNA.json";
import revenueData from "../public/creatorEarlyRevenueModels.json";

const FPS = 30;
const DURATION_SECS = 25;
const SPEECH_DURATION_SECS = 66;

// Map revenue models to creators
const revenueCreators = (revenueData as any).creators || revenueData;
const dnaProfiles = (creatorData as any).profiles || creatorData;

const SLUG_OVERRIDES: Record<string, string> = {
  "Brené Brown": "brene-brown",
  "Gabor Maté": "gabor-mate",
};

function toSlug(name: string): string {
  return (
    SLUG_OVERRIDES[name] ??
    name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
  );
}

function getCreatorProps(name: string) {
  const revenue = Array.isArray(revenueCreators)
    ? revenueCreators.find((c: any) => c.name === name)
    : revenueCreators[name];
  const dna = dnaProfiles.find((p: any) => p.name === name);
  const slug = toSlug(name);

  return {
    name,
    oneLiner: dna?.oneLiner ?? "",
    bio: dna?.bio ?? "",
    blowUpMoment: dna?.blowUpMoment ?? "",
    blowUpYear: String(dna?.blowUpYear ?? ""),
    revenueModel: revenue?.early_revenue_model ?? "day_job_side_project",
    earlyRevenue: revenue?.early_revenue_description ?? "",
    trustYears: dna?.yearsToBlowUp ?? 0,
    portraitSrc: `images/${slug}.png`,
  };
}

export const RemotionRoot: React.FC = () => {
  const tony = getCreatorProps("Tony Robbins");
  const brene = getCreatorProps("Brené Brown");
  const wim = getCreatorProps("Wim Hof");

  return (
    <>
      {/* Remarkable — Hook A: "Are you an experience creator..." */}
      <Composition
        id="Remarkable-HookA"
        component={RemarkableHookA}
        durationInFrames={Math.round((12.1 - 1.2) * FPS) + Math.round((44.8 - 10.8) * FPS) + Math.round(56.0 * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* Remarkable — Hook B: "I studied a hundred..." */}
      <Composition
        id="Remarkable-HookB"
        component={RemarkableHookB}
        durationInFrames={Math.round(9.0 * FPS) + Math.round((44.8 - 10.8) * FPS) + Math.round(56.0 * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* What Made Them Remarkable — Selfie version (original hook) */}
      <Composition
        id="Remarkable-Selfie"
        component={RemarkableSelfie}
        durationInFrames={Math.round(44.8 * FPS) + Math.round(56.0 * FPS)}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* How They Paid Rent — Selfie version (65s: selfie-2 27s + selfie-1 38s) */}
      <Composition
        id="HowTheyPaidRent-Selfie"
        component={HowTheyPaidRentSelfie}
        durationInFrames={27 * FPS + 38 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* How They Paid Rent — 4 Models (20s) */}
      <Composition
        id="HowTheyPaidRent-4Models"
        component={HowTheyPaidRent4Models}
        durationInFrames={FPS * 20}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* Speech video overlay test */}
      <Composition
        id="SpeechOverlayTest"
        component={SpeechOverlayTest}
        durationInFrames={FPS * SPEECH_DURATION_SECS}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* Component showcase — one component at a time for feedback */}
      <Composition
        id="ComponentShowcase"
        component={ComponentShowcase}
        durationInFrames={FPS * 28}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* Overlay component preview — all pop-ups sequenced together */}
      <Composition
        id="OverlayPreview"
        component={OverlayPreview}
        durationInFrames={FPS * 16}
        fps={FPS}
        width={1080}
        height={1920}
      />

      {/* Original full-scene compositions */}
      <Composition
        id="HowTheyPaidRent-TonyRobbins"
        component={HowTheyPaidRent}
        durationInFrames={FPS * DURATION_SECS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={tony}
      />
      <Composition
        id="HowTheyPaidRent-BreneBrown"
        component={HowTheyPaidRent}
        durationInFrames={FPS * DURATION_SECS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={brene}
      />
      <Composition
        id="HowTheyPaidRent-WimHof"
        component={HowTheyPaidRent}
        durationInFrames={FPS * DURATION_SECS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={wim}
      />
    </>
  );
};
