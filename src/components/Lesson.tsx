/**
 * Lesson route placeholder for Stage 1 of the unified-app build.
 *
 * Real lesson content lands in Stage 2: a from-zero scripted flow that
 * teaches "parts of a whole → halves → quarters → the N/D notation →
 * equivalence" before handing off to Boxy and then Trade Mogging. The flow
 * follows the {@link clone-synthesis-tutor-LESSON_SCRIPT.md} draft already
 * in the Gauntlet folder.
 *
 * Until the script lands, this page exists so the route resolves, the
 * nav shows it as active, and a deep-link to /lesson lands somewhere
 * sensible rather than 404-ing.
 */
import { Link } from 'react-router-dom';

export const Lesson: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6 text-center">
    <h2 className="text-3xl font-display text-lantern-gold tracking-widest">
      The Lesson
    </h2>
    <p className="text-text-muted max-w-md">
      Coming up in the next build: a from-zero walk through halves, quarters,
      the N over D notation, and equivalence — then the lesson hands you off
      to Boxy and to Trade Mogging when it's time.
    </p>
    <p className="text-text-muted text-sm max-w-md italic">
      For now, you can jump straight to either game below.
    </p>
    <div className="flex gap-3">
      <Link
        to="/boxy"
        className="px-5 py-3 rounded-xl bg-bazaar-panel border-2 border-bazaar-edge text-text-primary font-display tracking-wider active:scale-95"
      >
        Boxy
      </Link>
      <Link
        to="/trade"
        className="px-5 py-3 rounded-xl bg-lantern-gold/20 border-2 border-lantern-gold/40 text-lantern-gold font-display tracking-wider active:scale-95"
      >
        Trade Mogging
      </Link>
    </div>
  </div>
);
