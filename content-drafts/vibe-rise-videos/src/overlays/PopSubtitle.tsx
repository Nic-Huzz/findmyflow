/**
 * Pop-up subtitle component — words appear with a spring scale animation,
 * grouped into short phrases (2-5 words). Each phrase pops in, holds, then exits.
 * Key words can be highlighted in gold.
 */
import React from "react";
import { spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lerp, EASE, VR } from "../common";
import { loadFont as loadInter } from "@remotion/google-fonts/Inter";

const { fontFamily: inter } = loadInter("normal", {
  weights: ["700", "900"],
  subsets: ["latin"],
});

export type SubtitlePhrase = {
  /** Start time in seconds (relative to composition start) */
  start: number;
  /** End time in seconds */
  end: number;
  /** The phrase text */
  text: string;
  /** Words to highlight in gold */
  highlight?: string[];
  /** Override font size */
  fontSize?: number;
};

type Props = {
  phrases: SubtitlePhrase[];
  /** Global offset in seconds (e.g. for second video starting at 27s) */
  offsetSeconds?: number;
};

const SinglePhrase: React.FC<{
  text: string;
  highlight?: string[];
  fontSize?: number;
  durationFrames: number;
}> = ({ text, highlight = [], fontSize = 52, durationFrames }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const words = text.split(" ");

  // Exit
  const exitOpacity = lerp(
    frame,
    [durationFrames - 8, durationFrames],
    [1, 0],
    EASE.in
  );

  return (
    <div
      style={{
        position: "absolute",
        top: "60%",
        left: 32,
        right: 32,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${fontSize * 0.15}px ${fontSize * 0.2}px`,
        opacity: exitOpacity,
      }}
    >
      {words.map((word, i) => {
        const wordDelay = i * 2;
        const scale = spring({
          frame: frame - wordDelay,
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.4 },
        });

        const isHighlighted = highlight.some(
          (h) => word.toLowerCase().replace(/[^a-z0-9]/g, "") === h.toLowerCase().replace(/[^a-z0-9]/g, "")
            || word.toLowerCase().includes(h.toLowerCase())
        );

        return (
          <span
            key={`word-${i}`}
            style={{
              fontFamily: inter,
              fontSize,
              fontWeight: 900,
              color: isHighlighted ? VR.gold : VR.white,
              display: "inline-block",
              transform: `scale(${scale})`,
              opacity: scale,
              textShadow: isHighlighted
                ? `0 2px 20px ${VR.gold}60, 0 0 40px ${VR.gold}30`
                : "0 2px 12px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)",
              lineHeight: 1.2,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

export const PopSubtitle: React.FC<Props> = ({
  phrases,
  offsetSeconds = 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const offset = offsetSeconds * fps;

  return (
    <>
      {phrases.map((phrase, i) => {
        const startFrame = Math.round(phrase.start * fps) - offset;
        const endFrame = Math.round(phrase.end * fps) - offset;
        const duration = endFrame - startFrame;

        if (frame < startFrame || frame >= endFrame) return null;

        return (
          <div
            key={`phrase-${i}`}
            style={{ position: "absolute", inset: 0 }}
          >
            <SinglePhraseAtFrame
              text={phrase.text}
              highlight={phrase.highlight}
              fontSize={phrase.fontSize}
              durationFrames={duration}
              startFrame={startFrame}
              currentFrame={frame}
            />
          </div>
        );
      })}
    </>
  );
};

/** Wrapper that adjusts frame for the phrase's local timeline */
const SinglePhraseAtFrame: React.FC<{
  text: string;
  highlight?: string[];
  fontSize?: number;
  durationFrames: number;
  startFrame: number;
  currentFrame: number;
}> = ({ text, highlight, fontSize = 52, durationFrames, startFrame, currentFrame }) => {
  const localFrame = currentFrame - startFrame;
  const { fps } = useVideoConfig();

  const words = text.split(" ");

  const exitOpacity = lerp(
    localFrame,
    [durationFrames - 8, durationFrames],
    [1, 0],
    EASE.in
  );

  return (
    <div
      style={{
        position: "absolute",
        top: "60%",
        left: 32,
        right: 32,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        gap: `${fontSize * 0.15}px ${fontSize * 0.2}px`,
        opacity: exitOpacity,
      }}
    >
      {words.map((word, i) => {
        const wordDelay = i * 2;
        const scale = spring({
          frame: localFrame - wordDelay,
          fps,
          config: { damping: 12, stiffness: 200, mass: 0.4 },
        });

        const isHighlighted = highlight?.some(
          (h) =>
            word.toLowerCase().replace(/[^a-z0-9]/g, "") ===
              h.toLowerCase().replace(/[^a-z0-9]/g, "") ||
            word.toLowerCase().includes(h.toLowerCase())
        );

        return (
          <span
            key={`word-${i}`}
            style={{
              fontFamily: inter,
              fontSize,
              fontWeight: 900,
              color: isHighlighted ? VR.gold : VR.white,
              display: "inline-block",
              transform: `scale(${scale})`,
              opacity: scale,
              textShadow: isHighlighted
                ? `0 2px 20px ${VR.gold}60, 0 0 40px ${VR.gold}30`
                : "0 2px 12px rgba(0,0,0,0.8), 0 0 30px rgba(0,0,0,0.5)",
              lineHeight: 1.2,
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};
