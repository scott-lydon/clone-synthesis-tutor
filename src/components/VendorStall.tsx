/**
 * One vendor stall. Renders the vendor animal art, name, and a row of draggable pieces with prices.
 *
 * Inactive stalls (vendor doesn't sell the currently-requested food) are dimmed but still readable —
 * the kid can tap a dim piece to see "this is hummus, the customer wants pita". We don't disable
 * them entirely because preserving the kid's discovery is part of the lesson.
 */
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import type { Vendor, VendorPiece } from '../game/types';
import { VendorArt } from '../art/Animals';
import { FoodPiece } from '../art/Food';
import { formatFraction } from '../game/fraction';

interface VendorStallProps {
  readonly vendor: Vendor;
  readonly isActive: boolean;
  readonly moggedState: 'idle' | 'mogged' | 'served';
}

interface DraggablePieceProps {
  readonly piece: VendorPiece;
  readonly disabled: boolean;
}

const DraggablePiece: React.FC<DraggablePieceProps> = ({ piece, disabled }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: piece.id,
    data: { piece },
    disabled,
  });
  // We intentionally render an inline-block button-like wrapper sized big enough for thumb touch.
  return (
    <button
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        opacity: disabled ? 0.45 : isDragging ? 0.2 : 1,
        // Disable iOS Safari long-press callout that would interfere with drag.
        WebkitUserSelect: 'none',
        WebkitTouchCallout: 'none',
      }}
      {...listeners}
      {...attributes}
      className={`flex flex-col items-center gap-1 p-2 rounded-xl border-2 bg-bazaar-stall ${
        disabled
          ? 'border-bazaar-edge cursor-not-allowed'
          : 'border-lantern-deep hover:border-lantern-gold active:scale-95 transition-transform touch-none'
      }`}
      aria-label={`${formatFraction(piece.size)} of ${piece.food} for $${piece.price.toFixed(2)}`}
    >
      <FoodPiece food={piece.food} size={piece.size} diameter={56} />
      <div className="text-lg font-display text-lantern-gold leading-none">
        {formatFraction(piece.size)}
      </div>
      <div className="text-xs text-mint-fresh font-semibold">${piece.price.toFixed(2)}</div>
    </button>
  );
};

export const VendorStall: React.FC<VendorStallProps> = ({ vendor, isActive, moggedState }) => (
  <div
    className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all relative ${
      isActive
        ? 'bg-bazaar-stall border-lantern-deep shadow-lg'
        : 'bg-bazaar-stall/40 border-bazaar-edge'
    } ${vendor.isBoss ? 'ring-2 ring-spice-red ring-offset-2 ring-offset-bazaar-night' : ''}`}
  >
    {moggedState === 'mogged' && (
      <div className="absolute -top-3 -right-3 z-20 text-3xl animate-wobble">😵‍💫</div>
    )}
    <div className={`w-24 h-24 mb-1 ${moggedState === 'mogged' ? 'animate-wobble' : ''}`}>
      <VendorArt vendorId={vendor.id} state={moggedState} className="w-full h-full" />
    </div>
    <div className="text-sm font-semibold text-text-primary text-center leading-tight mb-1">
      {vendor.displayName}
    </div>
    <div className="text-xs text-text-muted mb-2 capitalize">{vendor.foodDisplayName}</div>
    <div className="flex flex-wrap justify-center gap-2">
      {vendor.pieces.map((piece) => (
        <DraggablePiece key={piece.id} piece={piece} disabled={!isActive} />
      ))}
    </div>
  </div>
);
