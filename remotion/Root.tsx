import React from "react";
import { Composition } from "remotion";
import { NikigaiExplainer, nikigaiExplainerSchema } from "./compositions/NikigaiExplainer";
import { VIDEO } from "./brand";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="nikigai-explainer"
        component={NikigaiExplainer}
        durationInFrames={1350}
        fps={VIDEO.fps}
        width={VIDEO.width}
        height={VIDEO.height}
        schema={nikigaiExplainerSchema}
        defaultProps={{
          hookLine: "You're not broken. You're just building someone else's dream.",
          intersectionTitle: "THIS is your Nikigai",
          intersectionSubtitle: "Where your genius meets the world's need",
          ctaLine: "Stop surviving. Start thriving.",
          ctaUrl: "findmyflow.nichuzz.com",
          skillExamples: [
            "Teaching complex ideas simply",
            "Seeing patterns others miss",
            "Making people feel understood",
          ],
          problemExamples: [
            "Feeling stuck in the wrong career",
            "Knowing you're meant for more",
            "Burnout from misaligned work",
          ],
          peopleExamples: [
            "Burnt-out professionals seeking purpose",
            "Career changers craving clarity",
            "Dreamers ready to build",
          ],
          audioSrc: "",
        }}
      />
    </>
  );
};
