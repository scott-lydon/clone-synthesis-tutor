/**
 * /boxy route — full polyomino-placement game.
 *
 * Ported from the standalone boxy-fractions repo. Layout mirrors that
 * repo's App.tsx so the game looks identical inside this unified app and
 * inside its original deployment.
 *
 * The Stage 1 cross-link placeholder is replaced; users who deep-link to
 * /boxy now play the actual game instead of bouncing to an external URL.
 */
import { Link } from 'react-router-dom';
import { GridView } from '../boxy/ui/GridView';
import { Tray } from '../boxy/ui/Tray';
import { RulesPanel } from '../boxy/ui/RulesPanel';
import { Toolbar } from '../boxy/ui/Toolbar';
import { MessagesPanel } from '../boxy/ui/MessagesPanel';

export const BoxyPage: React.FC = () => (
  <div className="min-h-screen w-full overflow-auto text-slate-100">
    <header className="px-6 md:px-12 pt-6 pb-4 flex items-center justify-between gap-6 flex-wrap max-w-6xl mx-auto">
      <div>
        <h1
          className="font-semibold text-3xl md:text-4xl tracking-tight"
          style={{ color: '#e8e0cc' }}
        >
          Boxy{' '}
          <span style={{ color: '#e6c879' /* dusty honey, matches yellow rule */ }}>
            Fractions
          </span>
        </h1>
        <p className="text-sm mt-1.5 max-w-md" style={{ color: 'rgba(212, 200, 178, 0.55)' }}>
          Place pieces so touching pieces share one of the count ratios in the rules panel.{' '}
          <Link to="/tutorial" className="underline hover:text-text-primary">
            Tutorial
          </Link>
          .
        </p>
      </div>
      <Toolbar />
    </header>

    {/* The inline How-to-play carousel that used to live below the tray now
        lives at /tutorial as full-page centered slides. The deep-link above
        sends players who want a refresher there; players who already know
        the rules see a cleaner play area without competing chrome. */}
    <main className="px-6 md:px-12 pb-16 flex flex-col lg:flex-row gap-10 max-w-6xl mx-auto">
      <section className="flex flex-col gap-8 flex-1 items-center lg:items-start">
        <GridView />
        <MessagesPanel />
        <Tray />
      </section>
      <aside className="w-full lg:w-72 flex-shrink-0">
        <RulesPanel />
      </aside>
    </main>
  </div>
);
