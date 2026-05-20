/**
 * Tutor text region. NOT a chat. The earlier version rendered each scripted
 * line as a chat bubble that arrived on a typed cadence — visually that
 * read as a messaging app and implied the student would reply. They don't.
 * The student's reply IS the manipulative on the right side of the lesson.
 * The bubbles, the typed delay, and the stacked alignment were all costs
 * with no benefit, so they're gone.
 *
 * New shape: one quiet text region with all of the current phase's lines
 * laid out as short paragraphs. Same width and panel surface as the
 * surrounding lesson layout, no bubble chrome, no "you have a new message"
 * affordance. The student reads top-to-bottom and acts on the right.
 *
 * The props (`lines`, `onAllLinesShown`, `resetKey`) are kept so Lesson.tsx
 * doesn't have to change. onAllLinesShown fires immediately on mount /
 * phase change since there's nothing to "wait for" anymore — the advance
 * affordance is gated only by the student's interaction with the
 * manipulative, not by a typing animation.
 */
import { useEffect } from 'react';
import type { TutorLine } from './script';

interface Props {
  readonly lines: readonly TutorLine[];
  readonly onAllLinesShown?: () => void;
  /** Reset key (phase id). Triggers re-firing onAllLinesShown for the new phase. */
  readonly resetKey: string;
}

export const LessonChat: React.FC<Props> = ({ lines, onAllLinesShown, resetKey }) => {
  // Notify the parent that the text is "shown" the instant the phase
  // mounts or changes. There's no animation queue any more, so chatDone
  // can be true immediately. The advance affordance reveals on the same
  // tick, which is fine: the student is reading the text while reaching
  // for the manipulative — they don't need a delay to confirm they saw
  // the text.
  useEffect(() => {
    if (onAllLinesShown && lines.length > 0) onAllLinesShown();
    // Re-fire on phase change. resetKey is the phase id.
  }, [resetKey, lines.length, onAllLinesShown]);

  return (
    <div
      className="flex flex-col gap-3 p-6 rounded-2xl h-full overflow-y-auto text-text-primary"
      style={{
        background: 'rgba(20, 27, 41, 0.55)',
        boxShadow: 'inset 0 0 0 1px rgba(212, 200, 178, 0.10)',
      }}
      aria-live="polite"
      aria-label="Lesson text"
    >
      {lines.map((line, i) => (
        <p
          key={`${resetKey}-${i}`}
          className="leading-relaxed text-base md:text-lg"
        >
          {line.text}
        </p>
      ))}
    </div>
  );
};
