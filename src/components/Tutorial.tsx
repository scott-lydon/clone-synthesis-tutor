/**
 * /tutorial route — Boxy how-to-play as full-page centered slides.
 *
 * Replaces the inline carousel that used to sit below the Boxy game. The
 * inline version had to compete with the rules panel, the grid, the tray,
 * and the messages for attention and lost. Now each tutorial step is the
 * ONLY thing on screen: a centered SVG illustration, a heading, a single
 * paragraph, and prev/next/skip controls. The reader meets one idea, takes
 * it in, then advances.
 *
 * Two exit affordances per page:
 *   - "Play Boxy →" jumps straight to the game (skip the rest of the tutorial)
 *   - dots / arrow keys / next button walks one step at a time
 *
 * Slides:
 *   1. Goal — fill the grid
 *   2. The count badge — every piece has a number
 *   3. Edge colors — what the colored sides mean
 *   4. Strict color contract — touching edges must match colors and the
 *      color's ratio rule must hold
 *   5. Miss counter — soft pressure against blind drops
 *   6. Reset vs New round — when to retry vs reshuffle
 */
import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

interface Slide {
  readonly title: string;
  readonly body: string;
  readonly art: React.ReactNode;
}

const RATIO_DEMO_FILL = '#f5efe3';
const RATIO_DEMO_STROKE = '#0a0e1a';
const COLOR_ORANGE = '#e8a87c';
const COLOR_GREEN = '#a8c69f';
const COLOR_PURPLE = '#b8a7c9';

/* ── art components, one per slide. SVG, no external assets. ── */

const ArtGoal: React.FC = () => (
  <svg viewBox="0 0 240 160" className="w-full max-w-md h-auto">
    {/* 6x4 grid, partial fill */}
    {Array.from({ length: 24 }).map((_, i) => {
      const r = Math.floor(i / 6);
      const c = i % 6;
      const filled = i < 14 && i !== 5 && i !== 11;
      return (
        <rect
          key={i}
          x={c * 38 + 6}
          y={r * 38 + 4}
          width={36}
          height={36}
          fill={filled ? RATIO_DEMO_FILL : 'transparent'}
          stroke={filled ? RATIO_DEMO_STROKE : 'rgba(212,200,178,0.18)'}
          strokeWidth={filled ? 1.5 : 1}
          rx={3}
        />
      );
    })}
    <text x="120" y="155" textAnchor="middle" fill="#e6c879" fontSize="11" fontFamily="monospace">
      filled 58% of 67% possible
    </text>
  </svg>
);

const ArtCount: React.FC = () => (
  <svg viewBox="0 0 240 140" className="w-full max-w-md h-auto">
    {/* a 4-cell L-piece with a 4 badge */}
    <rect x={30} y={20} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <rect x={30} y={60} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <rect x={70} y={60} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <rect x={70} y={100} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <circle cx={75} cy={70} r={14} fill="#1f242f" />
    <text x={75} y={75} textAnchor="middle" fill="#f5efe3" fontSize="16" fontWeight={700}>
      4
    </text>
    {/* small 2-cell I-piece to compare */}
    <rect x={150} y={50} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <rect x={190} y={50} width={40} height={40} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <circle cx={170} cy={70} r={12} fill="#1f242f" />
    <text x={170} y={75} textAnchor="middle" fill="#f5efe3" fontSize="14" fontWeight={700}>
      2
    </text>
  </svg>
);

const ArtEdges: React.FC = () => (
  <svg viewBox="0 0 240 140" className="w-full max-w-md h-auto">
    {/* a single cell with a colored right-side triangle */}
    <rect x={60} y={40} width={60} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <polygon points="120,40 120,100 90,70" fill={COLOR_GREEN} />
    <text x={90} y={120} textAnchor="middle" fill="#cbcab5" fontSize="11">
      green side
    </text>
    {/* a single cell with a colored top-side triangle */}
    <rect x={150} y={40} width={60} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <polygon points="150,40 210,40 180,70" fill={COLOR_ORANGE} />
    <text x={180} y={120} textAnchor="middle" fill="#cbcab5" fontSize="11">
      orange side
    </text>
  </svg>
);

const ArtMatch: React.FC = () => (
  <svg viewBox="0 0 280 160" className="w-full max-w-md h-auto">
    {/* two pieces touching on a green edge */}
    <rect x={20} y={50} width={60} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <polygon points="80,50 80,110 50,80" fill={COLOR_GREEN} />
    <circle cx={50} cy={80} r={14} fill="#1f242f" />
    <text x={50} y={85} textAnchor="middle" fill="#f5efe3" fontSize="14" fontWeight={700}>
      3
    </text>
    <rect x={80} y={50} width={60} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <polygon points="80,50 80,110 110,80" fill={COLOR_GREEN} />
    <circle cx={110} cy={80} r={14} fill="#1f242f" />
    <text x={110} y={85} textAnchor="middle" fill="#f5efe3" fontSize="14" fontWeight={700}>
      5
    </text>
    <text x={80} y={145} textAnchor="middle" fill="#cbcab5" fontSize="11">
      green meets green ✓ ratio 3:5 ✓
    </text>
    {/* mismatched edge */}
    <rect x={170} y={50} width={60} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <polygon points="230,50 230,110 200,80" fill={COLOR_GREEN} />
    <rect x={230} y={50} width={40} height={60} fill={RATIO_DEMO_FILL} stroke={RATIO_DEMO_STROKE} strokeWidth={2} />
    <text x={250} y={145} textAnchor="middle" fill="#cbcab5" fontSize="11">
      green meets blank ✗ rejected
    </text>
  </svg>
);

const ArtMisses: React.FC = () => (
  <svg viewBox="0 0 240 100" className="w-full max-w-md h-auto">
    <rect
      x={20}
      y={20}
      width={200}
      height={60}
      rx={16}
      fill="rgba(31,41,55,0.5)"
      stroke="rgba(212,200,178,0.18)"
      strokeWidth={1.5}
    />
    <text x={50} y={42} fill="rgba(212,200,178,0.55)" fontSize="10" textAnchor="middle">FILLED</text>
    <text x={50} y={62} fill="#e8d9a8" fontSize="18" fontWeight={700} textAnchor="middle">40%</text>
    <text x={120} y={42} fill="rgba(212,200,178,0.55)" fontSize="10" textAnchor="middle">POSSIBLE</text>
    <text x={120} y={62} fill="rgba(212,200,178,0.7)" fontSize="18" fontWeight={700} textAnchor="middle">73%</text>
    <text x={190} y={42} fill="rgba(212,200,178,0.55)" fontSize="10" textAnchor="middle">MISSES</text>
    <text x={190} y={62} fill="#e6c879" fontSize="18" fontWeight={700} textAnchor="middle">3</text>
  </svg>
);

const ArtReset: React.FC = () => (
  <svg viewBox="0 0 280 80" className="w-full max-w-md h-auto">
    {/* mock toolbar with three pills */}
    <rect x={10} y={20} width={80} height={36} rx={18} fill="rgba(230,200,121,0.18)" stroke="rgba(230,200,121,0.35)" strokeWidth={1.5} />
    <text x={50} y={43} fill="#e8d9a8" fontSize="11" textAnchor="middle" fontWeight={600}>
      New round
    </text>
    <rect x={100} y={20} width={60} height={36} rx={18} fill="rgba(184,167,201,0.18)" stroke="rgba(184,167,201,0.40)" strokeWidth={1.5} />
    <text x={130} y={43} fill={COLOR_PURPLE} fontSize="11" textAnchor="middle" fontWeight={600}>
      Reset
    </text>
    <rect x={170} y={20} width={60} height={36} rx={18} fill="rgba(168,198,159,0.18)" stroke="rgba(168,198,159,0.40)" strokeWidth={1.5} />
    <text x={200} y={43} fill="#c9d8c0" fontSize="11" textAnchor="middle" fontWeight={600}>
      Submit
    </text>
  </svg>
);

const SLIDES: readonly Slide[] = [
  {
    title: 'Fill the grid',
    body: 'The grid starts with one piece already on it. Drag the rest of the pieces in so they cover as much of the grid as possible. The grid has intentional gaps; you do not need to fill it perfectly. The "possible" % is your real ceiling.',
    art: <ArtGoal />,
  },
  {
    title: 'Every piece has a count',
    body: 'Each piece shows a number in the middle — that\'s how many boxes the piece has. The rules are about the ratio between two pieces\' counts, so always read the number first.',
    art: <ArtCount />,
  },
  {
    title: 'Edges can be colored',
    body: 'Each side of each box is either blank or colored. A colored side carries a rule. The rules panel tells you what ratio each color demands.',
    art: <ArtEdges />,
  },
  {
    title: 'Touching edges must match',
    body: 'When two pieces touch, the meeting edges have to share a color AND the box counts have to satisfy that color\'s ratio. A colored edge cannot meet a blank one. If the math does not work, the piece bounces back.',
    art: <ArtMatch />,
  },
  {
    title: 'Misses are tracked',
    body: 'The toolbar counts placement rejections. It\'s a soft signal — not a score — to discourage dragging pieces randomly to see what sticks. The fewer misses you take to fill the grid, the better the round.',
    art: <ArtMisses />,
  },
  {
    title: 'Reset vs New round',
    body: 'Reset pulls every placed piece back to the tray so you can try the SAME puzzle again. New round generates a completely new puzzle with new rules and new pieces. Misses and the score clear on either.',
    art: <ArtReset />,
  },
];

export const Tutorial: React.FC = () => {
  const [idx, setIdx] = useState(0);
  const navigate = useNavigate();

  // Keyboard nav: left/right arrows, Enter advances, Esc skips to Boxy.
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'ArrowRight' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        setIdx((i) => Math.min(i + 1, SLIDES.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setIdx((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Escape') {
        navigate('/boxy');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [navigate]);

  const slide = SLIDES[idx];
  const isLast = idx === SLIDES.length - 1;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl flex flex-col items-center gap-6">
        {/* Progress dots */}
        <div className="flex gap-1.5">
          {SLIDES.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setIdx(i)}
              aria-label={`Go to step ${i + 1}`}
              className="w-2.5 h-2.5 rounded-full transition-colors"
              style={{
                background: i === idx ? '#e6c879' : 'rgba(212, 200, 178, 0.20)',
              }}
            />
          ))}
        </div>

        {/* Art */}
        <div
          className="w-full p-8 rounded-2xl flex items-center justify-center"
          style={{
            background: 'rgba(31, 41, 55, 0.45)',
            boxShadow: 'inset 0 0 0 1px rgba(212, 200, 178, 0.10)',
          }}
        >
          {slide.art}
        </div>

        {/* Title + body */}
        <div className="text-center max-w-xl">
          <div className="text-text-muted text-[11px] uppercase tracking-[0.18em] mb-2">
            Tutorial — step {idx + 1} of {SLIDES.length}
          </div>
          <h2 className="font-display text-3xl text-lantern-gold tracking-wider mb-3">
            {slide.title}
          </h2>
          <p className="text-text-primary leading-relaxed">{slide.body}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 w-full max-w-md justify-between">
          <button
            type="button"
            onClick={() => setIdx((i) => Math.max(i - 1, 0))}
            disabled={idx === 0}
            className="px-4 py-2 rounded-full text-sm disabled:opacity-30 text-text-muted hover:text-text-primary"
          >
            ← Back
          </button>
          <Link
            to="/boxy"
            className="px-5 py-2 rounded-full text-xs text-text-muted hover:text-text-primary tracking-wider"
          >
            Play Boxy →
          </Link>
          {isLast ? (
            <button
              type="button"
              onClick={() => navigate('/boxy')}
              className="px-5 py-2 rounded-full text-sm font-semibold active:scale-95"
              style={{
                background: 'rgba(168, 198, 159, 0.18)',
                color: '#c9d8c0',
                boxShadow: 'inset 0 0 0 1px rgba(168, 198, 159, 0.40)',
              }}
            >
              Start Boxy →
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setIdx((i) => Math.min(i + 1, SLIDES.length - 1))}
              className="px-5 py-2 rounded-full text-sm font-semibold active:scale-95"
              style={{
                background: 'rgba(230, 200, 121, 0.18)',
                color: '#e8d9a8',
                boxShadow: 'inset 0 0 0 1px rgba(230, 200, 121, 0.40)',
              }}
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
