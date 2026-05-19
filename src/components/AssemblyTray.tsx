/**
 * Assembly tray: where the kid drops vendor pieces to build up the customer's order.
 *
 * Layout:
 *   - Live numeric total ("3/4" or "out of order")
 *   - Visual fill bar (filled wedge / target wedge) so the kid sees the math, not just reads it
 *   - Stacked tiny piece icons, each tappable to remove
 *   - SERVE button (disabled until tray has at least one piece)
 *   - CLEAR button (always enabled if tray is non-empty)
 *
 * Drop zone is the entire tray panel; dnd-kit handles the touch detection.
 */
import { useDroppable } from '@dnd-kit/core';
import type { Customer, TrayPiece } from '../game/types';
import { FoodPiece } from '../art/Food';
import { equalFractions, formatFraction, sumSizes, toNumber } from '../game/fraction';

interface AssemblyTrayProps {
  readonly customer: Customer;
  readonly tray: ReadonlyArray<TrayPiece>;
  readonly onSubmit: () => void;
  readonly onRemove: (trayId: string) => void;
  readonly onClear: () => void;
}

export const AssemblyTray: React.FC<AssemblyTrayProps> = ({ customer, tray, onSubmit, onRemove, onClear }) => {
  const { setNodeRef, isOver } = useDroppable({ id: 'assembly-tray' });
  const total = sumSizes(tray.map((tp) => tp.piece.size));
  const totalCost = tray.reduce((acc, tp) => acc + tp.piece.price, 0);
  const fillRatio = Math.min(1, toNumber(total) / toNumber(customer.target));
  const isExact = equalFractions(total, customer.target);
  const isOver100 = toNumber(total) > toNumber(customer.target);

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-3 p-4 rounded-2xl border-4 transition-colors min-h-[180px] ${
        isOver ? 'border-lantern-gold bg-bazaar-panel' : 'border-dashed border-bazaar-edge bg-bazaar-stall/50'
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="text-text-muted text-xs uppercase tracking-widest">Your tray</div>
        <div className="text-text-muted text-xs">
          Spent <span className="text-spice-red font-bold">${totalCost.toFixed(2)}</span>
        </div>
      </div>

      {/* Visual fill bar — width is fraction-of-target. Color changes at exact (green) or over (red). */}
      <div className="relative h-8 rounded-full bg-bazaar-night overflow-hidden border-2 border-bazaar-edge">
        <div
          className={`h-full transition-all duration-200 ${
            isExact ? 'bg-mint-fresh' : isOver100 ? 'bg-spice-red' : 'bg-lantern-gold'
          }`}
          style={{ width: `${Math.min(100, fillRatio * 100)}%` }}
        />
        <div className="absolute inset-0 flex items-center justify-center text-sm font-bold text-bazaar-night drop-shadow">
          {formatFraction(total)} of {formatFraction(customer.target)}
          {isExact && <span className="ml-2">✓</span>}
          {isOver100 && <span className="ml-2">! TOO MUCH</span>}
        </div>
      </div>

      {/* Stacked pieces in tray */}
      <div className="flex flex-wrap gap-2 min-h-[64px]">
        {tray.length === 0 ? (
          <div className="text-text-muted text-sm italic flex items-center w-full justify-center">
            Drag fraction pieces from the stalls here
          </div>
        ) : (
          tray.map((tp) => (
            <button
              key={tp.trayId}
              onClick={() => onRemove(tp.trayId)}
              className="relative group"
              aria-label={`Remove ${formatFraction(tp.piece.size)} of ${tp.piece.food}`}
            >
              <FoodPiece food={tp.piece.food} size={tp.piece.size} diameter={48} />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-spice-red text-white text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 group-active:opacity-100 transition-opacity">
                ✕
              </div>
              <div className="text-xs text-lantern-gold font-display text-center leading-none">
                {formatFraction(tp.piece.size)}
              </div>
            </button>
          ))
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSubmit}
          disabled={tray.length === 0}
          className="flex-1 px-5 py-3 rounded-xl bg-lantern-gold text-bazaar-night font-display text-xl tracking-wider disabled:opacity-30 disabled:cursor-not-allowed active:scale-95 transition-transform"
        >
          SERVE
        </button>
        <button
          onClick={onClear}
          disabled={tray.length === 0}
          className="px-4 py-3 rounded-xl bg-bazaar-edge text-text-muted font-semibold disabled:opacity-30 active:scale-95 transition-transform"
        >
          Clear
        </button>
      </div>
    </div>
  );
};
