/**
 * Lesson — from-zero scripted walk through fraction equivalence.
 *
 * Layout: chat tutor on the left, tactile manipulative on the right, advance
 * affordance below the chat. On each phase, the chat lines play, then the
 * advance affordance reveals (Continue button, multiple-choice question, or
 * implicit "keep interacting with the bar"). When the kid satisfies the
 * phase's advance condition, the lesson rolls to the next phase.
 *
 * The component is one reducer-ish useReducer with a tight `LessonState`
 * shape — no Zustand, no XState. The lesson's complexity is small enough
 * that an extra abstraction would hurt readability more than it would help.
 *
 * Bridge phases (id ending in `bridge-`) carry a route in their advance;
 * the Continue button on those phases issues navigate() instead of
 * advancing to the next phase. That is how the lesson hands the kid off
 * to Boxy and to Trade Mogging in the right order.
 */
import { useCallback, useEffect, useMemo, useReducer, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PHASES, nextPhaseId, type Phase } from '../lesson/script';
import { LessonChat } from '../lesson/LessonChat';
import { BarManipulative } from '../lesson/BarManipulative';

interface LessonState {
  readonly phaseId: string;
  /** Tap-split progress: how many splits the kid has done in this phase. */
  readonly splitCount: number;
  /** Compare-bars progress: how many pieces are in the bottom bar. */
  readonly fillCount: number;
  /** Has the chat finished animating in for the current phase? */
  readonly chatDone: boolean;
  /** Sticky "wrong-answer" remediation line for the current phase. */
  readonly remediation: string | null;
}

type Action =
  | { kind: 'reset-to'; phaseId: string }
  | { kind: 'chat-done' }
  | { kind: 'tap-split'; pieces: number }
  | { kind: 'fill-progress'; count: number }
  | { kind: 'remediate'; text: string }
  | { kind: 'clear-remediation' };

const reducer = (s: LessonState, a: Action): LessonState => {
  switch (a.kind) {
    case 'reset-to':
      return { phaseId: a.phaseId, splitCount: 0, fillCount: 0, chatDone: false, remediation: null };
    case 'chat-done':
      return s.chatDone ? s : { ...s, chatDone: true };
    case 'tap-split':
      return { ...s, splitCount: s.splitCount + 1 };
    case 'fill-progress':
      return { ...s, fillCount: a.count };
    case 'remediate':
      return { ...s, remediation: a.text };
    case 'clear-remediation':
      return { ...s, remediation: null };
  }
};

export const Lesson: React.FC = () => {
  const [state, dispatch] = useReducer(reducer, {
    phaseId: PHASES[0].id,
    splitCount: 0,
    fillCount: 0,
    chatDone: false,
    remediation: null,
  });
  const navigate = useNavigate();
  const phase: Phase = useMemo(() => {
    const p = PHASES.find((x) => x.id === state.phaseId);
    if (!p) {
      throw new Error(
        `Lesson state references unknown phase id "${state.phaseId}". ` +
          `Bug: a reducer dispatch wrote a phase id that does not exist in PHASES (src/lesson/script.ts). ` +
          `Check the dispatch site or the PHASES array.`,
      );
    }
    return p;
  }, [state.phaseId]);

  const goNext = useCallback((): void => {
    const next = nextPhaseId(state.phaseId);
    if (!next) return;
    dispatch({ kind: 'reset-to', phaseId: next });
  }, [state.phaseId]);

  /* Phase-advance evaluation. Triggered by manipulative updates and choice clicks. */
  const onTapSplit = useCallback(
    (currentPieces: number): void => {
      dispatch({ kind: 'tap-split', pieces: currentPieces });
      if (phase.advance.kind === 'tap-anywhere') goNext();
      // "split-twice" advances when the kid has split at least once after the
      // starting state. startingSplit is 2 (already a half) and split-twice
      // means they should split a half into fourths → pieces becomes 4.
      if (phase.advance.kind === 'split-twice' && currentPieces >= 4) goNext();
    },
    [phase.advance, goNext],
  );

  const onFillProgress = useCallback(
    (count: number): void => {
      dispatch({ kind: 'fill-progress', count });
      if (phase.advance.kind === 'bar-filled' && phase.manipulative.kind === 'compare-bars') {
        if (count >= phase.manipulative.bottomTarget) goNext();
      }
    },
    [phase.advance, phase.manipulative, goNext],
  );

  /* Multiple-choice click handler. Sticky remediation on wrong; advance on right. */
  const onChoice = useCallback(
    (correct: boolean, remediation?: string): void => {
      if (correct) {
        dispatch({ kind: 'clear-remediation' });
        goNext();
        return;
      }
      dispatch({ kind: 'remediate', text: remediation ?? 'Not quite. Try another.' });
    },
    [goNext],
  );

  const isLast = state.phaseId === PHASES[PHASES.length - 1].id;

  return (
    <div className="min-h-screen p-4 md:p-6 flex flex-col">
      <header className="mb-4">
        <div className="text-text-muted text-[11px] uppercase tracking-[0.18em] mb-1">
          Lesson — fraction equivalence
        </div>
        <h2 className="font-display text-2xl text-lantern-gold tracking-wider">
          {phase.title}
        </h2>
        <PhaseProgress phaseId={state.phaseId} />
      </header>

      <main className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-[420px]">
        <div className="min-h-[360px]">
          <LessonChat
            lines={phase.chat}
            resetKey={phase.id}
            onAllLinesShown={() => dispatch({ kind: 'chat-done' })}
          />
        </div>
        <div
          className="flex flex-col items-center justify-center p-6 rounded-2xl"
          style={{
            background: 'rgba(31, 41, 55, 0.45)',
            boxShadow: 'inset 0 0 0 1px rgba(212, 200, 178, 0.10)',
          }}
        >
          <BarManipulative
            manipulative={phase.manipulative}
            resetKey={phase.id}
            onTapSplit={onTapSplit}
            onFillProgress={onFillProgress}
          />
        </div>
      </main>

      <footer className="mt-4 min-h-[64px] flex flex-col items-center gap-2">
        {state.remediation && (
          <div
            className="rounded-md px-4 py-2 text-sm max-w-2xl text-center"
            style={{
              background: 'rgba(230, 200, 121, 0.10)',
              boxShadow: 'inset 0 0 0 1px rgba(230, 200, 121, 0.35)',
              color: '#f0e3b5',
            }}
          >
            {state.remediation}
          </div>
        )}
        <Advance
          phase={phase}
          chatDone={state.chatDone}
          onContinue={goNext}
          onChoice={onChoice}
          onJump={(route) => navigate(route)}
        />
        {isLast && (
          <Link to="/" className="text-text-muted text-xs hover:text-text-primary mt-1">
            ← back to home
          </Link>
        )}
      </footer>
    </div>
  );
};

/* ──────────────────────────  Phase progress dots  ────────────────────────── */

const PhaseProgress: React.FC<{ phaseId: string }> = ({ phaseId }) => {
  const i = PHASES.findIndex((p) => p.id === phaseId);
  return (
    <div className="flex gap-1 mt-2">
      {PHASES.map((p, idx) => (
        <span
          key={p.id}
          className="w-5 h-1.5 rounded-full transition-colors"
          style={{
            background:
              idx < i
                ? 'rgba(230, 200, 121, 0.7)'
                : idx === i
                  ? '#e6c879'
                  : 'rgba(212, 200, 178, 0.18)',
          }}
          aria-current={idx === i ? 'step' : undefined}
        />
      ))}
    </div>
  );
};

/* ──────────────────────────  Advance affordance  ────────────────────────── */

interface AdvanceProps {
  readonly phase: Phase;
  readonly chatDone: boolean;
  readonly onContinue: () => void;
  readonly onChoice: (correct: boolean, remediation?: string) => void;
  readonly onJump: (route: '/boxy' | '/trade' | '/tutorial') => void;
}

const Advance: React.FC<AdvanceProps> = ({ phase, chatDone, onContinue, onChoice, onJump }) => {
  // The advance affordance is hidden until the chat has finished playing —
  // otherwise the kid races the tutor and the cadence collapses. `revealed`
  // resets to false whenever the phase changes (phase.id keys the effect),
  // then flips true once chatDone goes high.
  const [revealed, setRevealed] = useState(false);
  useEffect(() => {
    setRevealed(false);
  }, [phase.id]);
  useEffect(() => {
    if (chatDone) setRevealed(true);
  }, [chatDone]);
  if (!revealed) return null;

  const advance = phase.advance;
  switch (advance.kind) {
    case 'continue':
      return (
        <button
          type="button"
          onClick={onContinue}
          className="px-6 py-3 rounded-full font-display tracking-wider text-base active:scale-95"
          style={{
            background: 'rgba(230, 200, 121, 0.18)',
            color: '#e8d9a8',
            boxShadow: 'inset 0 0 0 1px rgba(230, 200, 121, 0.40)',
          }}
        >
          Continue →
        </button>
      );
    case 'jump-out': {
      // Each route has its own palette so the kid associates the button color
      // with the destination they're about to land on. /tutorial routes to the
      // dusty terracotta tutorial entrance, /boxy is sage, /trade is mauve.
      const palette: Record<typeof advance.route, { bg: string; color: string; border: string; label: string }> = {
        '/tutorial': {
          bg: 'rgba(232, 168, 124, 0.18)',
          color: '#e8c7b0',
          border: 'rgba(232, 168, 124, 0.40)',
          label: 'Open the tutorial →',
        },
        '/boxy': {
          bg: 'rgba(168, 198, 159, 0.18)',
          color: '#c9d8c0',
          border: 'rgba(168, 198, 159, 0.40)',
          label: 'Go to Boxy →',
        },
        '/trade': {
          bg: 'rgba(184, 167, 201, 0.18)',
          color: '#d4c7df',
          border: 'rgba(184, 167, 201, 0.40)',
          label: 'Go to Trade Mogging →',
        },
      };
      const p = palette[advance.route];
      return (
        <button
          type="button"
          onClick={() => onJump(advance.route)}
          className="px-6 py-3 rounded-full font-display tracking-wider text-base active:scale-95"
          style={{
            background: p.bg,
            color: p.color,
            boxShadow: `inset 0 0 0 1px ${p.border}`,
          }}
        >
          {p.label}
        </button>
      );
    }
    case 'choice':
      return (
        <div className="flex flex-col items-center gap-2 max-w-2xl">
          <div className="text-text-primary text-sm mb-1">{advance.question.question}</div>
          <div className="flex flex-wrap gap-2 justify-center">
            {advance.question.choices.map((c, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChoice(c.correct, c.remediation)}
                className="px-4 py-2 rounded-full text-sm font-medium active:scale-95"
                style={{
                  background: 'rgba(31, 41, 55, 0.6)',
                  color: '#e8e0cc',
                  boxShadow: 'inset 0 0 0 1px rgba(212, 200, 178, 0.30)',
                }}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
      );
    // tap-anywhere / split-twice / bar-filled: the manipulative IS the
    // advance affordance, nothing to render here.
    case 'tap-anywhere':
    case 'split-twice':
    case 'bar-filled':
      return null;
  }
};
