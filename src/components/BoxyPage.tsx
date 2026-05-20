/**
 * /boxy route — full polyomino-placement game.
 *
 * Mirrors the standalone boxy-fractions App.tsx layout: Text column on the
 * LEFT (Rules), Interaction column on the RIGHT (Grid, MessagesPanel, then
 * Parts and Dropped baskets side-by-side). The standalone repo's separate
 * Render service has been consolidated into this one, so users hitting
 * /boxy here get the same experience the standalone URL used to provide.
 *
 * The inline How-to-play carousel lives at /tutorial as full-page centered
 * slides; the cross-link in the subtitle sends players who want a refresher
 * there without competing for attention in the play area.
 */
import { Link } from 'react-router-dom';
import { GridView } from '../boxy/ui/GridView';
import { Tray, Dropped } from '../boxy/ui/Tray';
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

    <main className="px-6 md:px-12 pb-16 grid gap-10 max-w-6xl mx-auto lg:grid-cols-[18rem_1fr]">
      {/* TEXT column (left) — Rules. Drops below the interaction on narrow
          screens because a scrolling reader needs the rule context before
          the grid. */}
      <aside className="flex flex-col gap-8 order-1 min-w-0">
        <RulesPanel />
      </aside>

      {/* INTERACTION column (right) — Grid, in-flight feedback message,
          then Parts and Dropped baskets side by side. The two baskets sit
          in a tight 2-col grid so the "alive vs spent" comparison is one
          glance, not a scroll. */}
      <section className="flex flex-col gap-6 order-2 items-start min-w-0">
        <GridView />
        <MessagesPanel />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <Tray />
          <Dropped />
        </div>
      </section>
    </main>
  </div>
);
