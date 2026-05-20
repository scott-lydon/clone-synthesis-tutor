/**
 * /boxy route — Boxy polyomino puzzle placeholder for Stage 1.
 *
 * Stage 3 of the unified-app build replaces this placeholder with the full
 * polyomino-placement game ported from the boxy-fractions repo (domain types,
 * Zustand store, drag-drop UI, the Reset button just shipped, etc.). The
 * placeholder exists so the route resolves and so a direct-jump from the
 * entry page lands somewhere useful before the port lands.
 *
 * The cross-link to the still-deployed standalone boxy-fractions site keeps
 * the player unblocked in the meantime.
 */
import { Link } from 'react-router-dom';

export const BoxyPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 text-center">
    <h2 className="text-3xl font-display text-lantern-gold tracking-widest">
      Boxy Puzzles
    </h2>
    <p className="text-text-muted max-w-md">
      Place polyomino pieces so the boxes that touch satisfy a fraction
      ratio. Reset to retry; New round to start over.
    </p>
    <p className="text-text-muted text-sm max-w-md">
      The full game is shipping into this page in the next build. For now it
      lives at a separate URL while we port it.
    </p>
    <a
      href="https://boxy-fractions.onrender.com"
      target="_blank"
      rel="noopener noreferrer"
      className="px-5 py-3 rounded-xl bg-lantern-gold/20 border-2 border-lantern-gold/40 text-lantern-gold font-display tracking-wider active:scale-95"
    >
      Open Boxy in a new tab →
    </a>
    <Link to="/" className="text-text-muted text-sm hover:text-text-primary">
      ← back to home
    </Link>
  </div>
);
