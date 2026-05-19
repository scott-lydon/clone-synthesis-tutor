/**
 * Fractional food pieces. These are the DRAGGABLE objects of the game.
 *
 * Each food is rendered as a full disk (the "whole") with a wedge highlighted to show the
 * fraction-size the piece represents. The wedge geometry is computed from `numerator/denominator`,
 * so a 1/2 piece literally looks like half the disk, a 1/3 piece looks like a third, etc.
 *
 * The kid sees a real visual representation of the fraction at all times. Atom A2 (split) and
 * A4 (piece count) are taught by the art, not by text labels.
 */
import type { FC } from 'react';
import type { FoodId, Fraction } from '../game/types';

interface FoodPieceProps {
  readonly food: FoodId;
  readonly size: Fraction;
  /** Pixel dimensions of the SVG bounding box. */
  readonly diameter?: number;
  readonly className?: string;
  /** When true, render a faded "wedge missing from the whole" look. Used in the assembly tray to
   *  show pieces stacked or in the lesson panel to show what's needed. */
  readonly inset?: boolean;
}

/** Compute the SVG path string for a circular wedge from angle 0 to (num/den) * 2π. */
const wedgePath = (radius: number, fraction: Fraction): string => {
  const cx = radius;
  const cy = radius;
  const ratio = fraction.num / fraction.den;
  if (ratio >= 1) {
    // Full circle as a path
    return `M ${cx - radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx + radius} ${cy} A ${radius} ${radius} 0 1 1 ${cx - radius} ${cy} Z`;
  }
  const angle = ratio * Math.PI * 2;
  const endX = cx + radius * Math.sin(angle);
  const endY = cy - radius * Math.cos(angle);
  const largeArc = ratio > 0.5 ? 1 : 0;
  return `M ${cx} ${cy} L ${cx} ${cy - radius} A ${radius} ${radius} 0 ${largeArc} 1 ${endX} ${endY} Z`;
};

/** Per-food color + label. Wedge color is the food's primary, base color is a darker variant. */
const FOOD_VISUAL: Record<FoodId, { wedge: string; base: string; label: string; texture?: string }> = {
  pita: { wedge: '#e8c987', base: '#a8895a', label: 'Pita' },
  hummus: { wedge: '#d8b878', base: '#9a7e4a', label: 'Hummus' },
  'olive-scoop': { wedge: '#5a7e3a', base: '#3a5325', label: 'Olives' },
  falafel: { wedge: '#8a6a3a', base: '#5a4525', label: 'Falafel' },
  baklava: { wedge: '#d4a058', base: '#8a6535', label: 'Baklava' },
};

export const FoodPiece: FC<FoodPieceProps> = ({ food, size, diameter = 80, className, inset = false }) => {
  const radius = diameter / 2;
  const visual = FOOD_VISUAL[food];
  return (
    <svg
      viewBox={`0 0 ${diameter} ${diameter}`}
      width={diameter}
      height={diameter}
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* The "whole" outline — always a full disk, dashed so the kid sees the missing slice */}
      <circle
        cx={radius}
        cy={radius}
        r={radius - 3}
        fill={inset ? 'transparent' : visual.base}
        stroke="#1a1a1a"
        strokeWidth="2.5"
        strokeDasharray={inset ? '4 4' : 'none'}
      />
      {/* The wedge that represents this piece's size */}
      <path d={wedgePath(radius - 3, size)} fill={visual.wedge} stroke="#1a1a1a" strokeWidth="2.5" />
      {/* Food-specific texture dots so different foods read differently even at thumbnail size */}
      {food === 'olive-scoop' && (
        <>
          <circle cx={radius * 0.7} cy={radius * 0.6} r={3} fill="#1a1a1a" />
          <circle cx={radius * 1.05} cy={radius * 0.5} r={3} fill="#1a1a1a" />
          <circle cx={radius * 0.85} cy={radius * 0.9} r={3} fill="#1a1a1a" />
        </>
      )}
      {food === 'falafel' && (
        <>
          <circle cx={radius * 0.75} cy={radius * 0.65} r={4} fill="#5a4525" stroke="#1a1a1a" strokeWidth="1.5" />
          <circle cx={radius * 1.05} cy={radius * 0.55} r={4} fill="#5a4525" stroke="#1a1a1a" strokeWidth="1.5" />
        </>
      )}
      {food === 'baklava' && (
        <>
          {/* Diamond cross-hatch */}
          <line x1={radius * 0.5} y1={radius * 0.5} x2={radius * 1.4} y2={radius * 1.4} stroke="#5a3a1a" strokeWidth="1.5" />
          <line x1={radius * 1.4} y1={radius * 0.5} x2={radius * 0.5} y2={radius * 1.4} stroke="#5a3a1a" strokeWidth="1.5" />
        </>
      )}
    </svg>
  );
};

export const foodDisplayName = (food: FoodId): string => FOOD_VISUAL[food].label;
