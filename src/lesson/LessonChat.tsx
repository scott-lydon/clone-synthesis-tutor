/**
 * Tutor chat column. Lines arrive one at a time on a small cadence, lifted
 * from the LESSON_SCRIPT.md style notes — warm, patient, no exclamation
 * stacks, no emojis. The kid reads at their own pace; lines pile up rather
 * than vanish so a slower reader does not lose context.
 *
 * The component is dumb. It receives the queue of {@link TutorLine} for the
 * current phase, animates them in, and signals "all lines done" via
 * onAllLinesShown so the parent can reveal the advance affordance (Continue
 * button, multiple-choice question, etc.). No side-effects on global state.
 */
import { useEffect, useState } from 'react';
import type { TutorLine } from './script';

interface Props {
  readonly lines: readonly TutorLine[];
  readonly onAllLinesShown?: () => void;
  /** Reset the line queue when this key changes (i.e., phase changed). */
  readonly resetKey: string;
}

export const LessonChat: React.FC<Props> = ({ lines, onAllLinesShown, resetKey }) => {
  const [visibleCount, setVisibleCount] = useState(0);

  // Reset to zero whenever the phase changes (lines + resetKey both change),
  // then animate forward.
  useEffect(() => {
    setVisibleCount(0);
  }, [resetKey]);

  useEffect(() => {
    if (visibleCount >= lines.length) {
      if (onAllLinesShown && lines.length > 0) onAllLinesShown();
      return;
    }
    const pause = lines[visibleCount]?.pauseAfterMs ?? 700;
    const t = setTimeout(() => {
      setVisibleCount((c) => c + 1);
    }, pause);
    return () => clearTimeout(t);
  }, [visibleCount, lines, onAllLinesShown]);

  return (
    <div
      className="flex flex-col gap-2.5 p-5 rounded-2xl h-full overflow-y-auto"
      style={{
        background: 'rgba(20, 27, 41, 0.55)',
        boxShadow: 'inset 0 0 0 1px rgba(212, 200, 178, 0.10)',
      }}
      aria-live="polite"
      aria-label="Tutor"
    >
      {lines.slice(0, visibleCount + 1).map((line, i) => (
        <div
          key={`${resetKey}-${i}`}
          className="rounded-xl px-4 py-2.5 text-text-primary leading-relaxed"
          style={{
            background: 'rgba(31, 41, 55, 0.55)',
            boxShadow: 'inset 0 0 0 1px rgba(230, 200, 121, 0.18)',
            maxWidth: '90%',
            animation: 'fadeUp 0.32s ease',
          }}
        >
          {line.text}
        </div>
      ))}
      <style>{`@keyframes fadeUp {
        from { opacity: 0; transform: translateY(8px); }
        to   { opacity: 1; transform: translateY(0); }
      }`}</style>
    </div>
  );
};
