import React from "react";
import { Audio, staticFile } from "remotion";
import { TransitionSeries, linearTiming, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { z } from "zod";

import { BrandIntro } from "../scenes/BrandIntro";
import { HookStatement } from "../scenes/HookStatement";
import { ThreeCircles } from "../scenes/ThreeCircles";
import { CircleDeepDive } from "../scenes/CircleDeepDive";
import { Intersection } from "../scenes/Intersection";
import { CallToAction } from "../scenes/CallToAction";
import { BRAND } from "../brand";

export const nikigaiExplainerSchema = z.object({
  hookLine: z.string(),
  intersectionTitle: z.string(),
  intersectionSubtitle: z.string(),
  ctaLine: z.string(),
  ctaUrl: z.string(),
  skillExamples: z.array(z.string()),
  problemExamples: z.array(z.string()),
  peopleExamples: z.array(z.string()),
  audioSrc: z.string(),
});

type Props = z.infer<typeof nikigaiExplainerSchema>;

export const NikigaiExplainer: React.FC<Props> = ({
  hookLine,
  intersectionTitle,
  intersectionSubtitle,
  ctaLine,
  ctaUrl,
  skillExamples,
  problemExamples,
  peopleExamples,
  audioSrc,
}) => {
  const transitionDuration = 20;

  return (
    <>
      {audioSrc && (
        <Audio src={staticFile(audioSrc)} volume={0.3} />
      )}

      <TransitionSeries>
        {/* Scene 1: Brand Intro (0-3s = 90 frames) */}
        <TransitionSeries.Sequence durationInFrames={90}>
          <BrandIntro />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 2: Hook Statement (3-7s = 120 frames) */}
        <TransitionSeries.Sequence durationInFrames={120}>
          <HookStatement text={hookLine} />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: transitionDuration })}
        />

        {/* Scene 3: Three Circles Appear (7-15s = 240 frames) */}
        <TransitionSeries.Sequence durationInFrames={240}>
          <ThreeCircles />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 4a: Skills Deep Dive (130 frames) */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <CircleDeepDive
            label="Your Skills"
            color={BRAND.skills}
            examples={skillExamples}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: transitionDuration })}
        />

        {/* Scene 4b: Problems Deep Dive (130 frames) */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <CircleDeepDive
            label="Problems You Solve"
            color={BRAND.problems}
            examples={problemExamples}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: transitionDuration })}
        />

        {/* Scene 4c: People Deep Dive (130 frames) */}
        <TransitionSeries.Sequence durationInFrames={130}>
          <CircleDeepDive
            label="Your People"
            color={BRAND.people}
            examples={peopleExamples}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: 30 })}
        />

        {/* Scene 5: Intersection (28-38s = 300 frames) */}
        <TransitionSeries.Sequence durationInFrames={300}>
          <Intersection
            title={intersectionTitle}
            subtitle={intersectionSubtitle}
          />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={linearTiming({ durationInFrames: transitionDuration })}
        />

        {/* Scene 6: Call to Action (38-45s = 210 frames) */}
        <TransitionSeries.Sequence durationInFrames={210}>
          <CallToAction headline={ctaLine} url={ctaUrl} />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </>
  );
};
