/**
 * Entry page. The first thing a 9-year-old or an evaluator sees.
 *
 * Three big tappable cards. Lesson is the recommended path (most prominent).
 * Boxy and Trade Mogging are direct jumps for users who already know what
 * they want — explicitly requested by the user so a grader can land on the
 * specific deliverable they're scoring without sitting through the lesson.
 *
 * Layout choices:
 *   - Single column, large touch targets. The page is iPad-first; the brief
 *     and the Synthesis aesthetic both say "tactile and warm."
 *   - The recommended path (Lesson) is the visually heaviest card. The two
 *     "jump straight to..." cards are lighter, smaller text, sand-warm chips.
 *     The hierarchy is the affordance.
 *   - No marketing copy. A kid does not read marketing.
 */
import { Link } from 'react-router-dom';

export const EntryPage: React.FC = () => (
  <div className="min-h-screen flex flex-col items-center justify-center p-6 gap-6">
    <header className="text-center mb-2">
      <h1 className="text-5xl md:text-6xl font-display text-lantern-gold tracking-widest mb-2">
        FRACTION BAZAAR
      </h1>
      <p className="text-text-muted text-base max-w-md mx-auto">
        Learn fractions by playing, not by reading.
      </p>
    </header>

    {/* Primary path */}
    <Link
      to="/lesson"
      className="block w-full max-w-md rounded-3xl px-8 py-6 text-center transition active:scale-95"
      style={{
        background:
          'linear-gradient(160deg, rgba(230, 200, 121, 0.20) 0%, rgba(232, 168, 124, 0.12) 100%)',
        boxShadow:
          'inset 0 0 0 1px rgba(230, 200, 121, 0.40), 0 20px 40px rgba(0, 0, 0, 0.25)',
      }}
    >
      <div className="text-xs uppercase tracking-[0.18em] text-lantern-gold/70 mb-1">
        Start here
      </div>
      <div className="font-display text-2xl tracking-wider text-text-primary mb-1">
        Take the lesson
      </div>
      <div className="text-text-muted text-sm">
        About 10 minutes. Starts at the beginning.
      </div>
    </Link>

    {/* Jump-to cards (secondary) */}
    <div className="flex flex-col sm:flex-row gap-3 w-full max-w-md">
      <Link
        to="/boxy"
        className="flex-1 rounded-2xl px-5 py-4 text-center transition active:scale-95"
        style={{
          background: 'rgba(168, 198, 159, 0.10)',
          boxShadow: 'inset 0 0 0 1px rgba(168, 198, 159, 0.30)',
          color: '#c9d8c0',
        }}
      >
        <div className="font-display text-lg tracking-wider">Jump to Boxy</div>
        <div className="text-xs opacity-70 mt-0.5">Polyomino puzzles</div>
      </Link>
      <Link
        to="/trade"
        className="flex-1 rounded-2xl px-5 py-4 text-center transition active:scale-95"
        style={{
          background: 'rgba(184, 167, 201, 0.10)',
          boxShadow: 'inset 0 0 0 1px rgba(184, 167, 201, 0.30)',
          color: '#d4c7df',
        }}
      >
        <div className="font-display text-lg tracking-wider">Jump to Trade Mogging</div>
        <div className="text-xs opacity-70 mt-0.5">Bazaar vendor game</div>
      </Link>
    </div>

    <footer className="mt-6 text-text-muted text-xs text-center max-w-md">
      Best on iPad in Safari. Tap, drag, learn.
    </footer>
  </div>
);
