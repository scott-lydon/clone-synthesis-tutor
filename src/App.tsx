import { Board } from './components/Board';
import { LEVEL_1 } from './data/levels';
import { formatFraction } from './lib/fractions';

function App() {
  const level = LEVEL_1;
  return (
    <div className="min-h-screen flex flex-col items-center justify-start px-6 py-8">
      <header className="text-center mb-6">
        <h1 className="text-5xl font-bold text-boxy-gold tracking-tight">Boxy</h1>
        <p className="text-sm text-slate-400 mt-2">
          {level.gradeLabel} · {level.title}
        </p>
      </header>

      <section className="flex flex-wrap items-center justify-center gap-3 mb-6">
        {level.rules.map((rule) => (
          <div
            key={rule.color}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 text-slate-200"
          >
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ backgroundColor: ruleSwatch(rule.color) }}
              aria-hidden
            />
            <span className="uppercase tracking-wider text-xs">{rule.color}</span>
            <span className="font-mono text-sm">= {formatFraction(rule.fraction)}</span>
          </div>
        ))}
      </section>

      <main className="flex justify-center">
        <Board level={level} />
      </main>

      <footer className="mt-8 text-xs text-slate-500">
        Drag-and-drop, hand, scoring, and tutor hint arrive in subsequent phases.
      </footer>
    </div>
  );
}

function ruleSwatch(color: 'blue' | 'red' | 'green' | 'yellow'): string {
  switch (color) {
    case 'blue':
      return '#3b82f6';
    case 'red':
      return '#ef4444';
    case 'green':
      return '#22c55e';
    case 'yellow':
      return '#eab308';
  }
}

export default App;
