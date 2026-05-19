/**
 * Customer card: shows who's at the counter and what they want.
 *
 * The fraction is rendered both as numeric notation ("3/4") AND as a visual wedge (a transparent
 * piece showing the target shape). Atom A6 (notation) and A10 (equals) are reinforced here without
 * forcing the kid to read.
 */
import type { Customer } from '../game/types';
import { FoodPiece } from '../art/Food';
import { formatFraction } from '../game/fraction';

interface CustomerCardProps {
  readonly customer: Customer;
  readonly isBoss: boolean;
}

export const CustomerCard: React.FC<CustomerCardProps> = ({ customer, isBoss }) => (
  <div
    className={`flex items-center gap-4 px-5 py-4 rounded-2xl border-2 shadow-lg ${
      isBoss ? 'bg-spice-red/20 border-spice-red' : 'bg-bazaar-panel border-bazaar-edge'
    }`}
  >
    <div className="text-4xl">{isBoss ? '😤' : '🧑'}</div>
    <div className="flex-1">
      <div className="text-text-muted text-xs uppercase tracking-widest mb-1">
        {isBoss ? 'BOSS CUSTOMER' : 'Customer wants'}
      </div>
      <div className="text-base text-text-primary mb-2">"{customer.orderText}"</div>
      <div className="flex items-center gap-3">
        <FoodPiece food={customer.food} size={customer.target} diameter={56} />
        <div className="text-4xl font-display text-lantern-gold">{formatFraction(customer.target)}</div>
        <div className="text-text-muted text-sm">
          pays <span className="text-mint-fresh font-bold">${customer.payout.toFixed(2)}</span>
        </div>
      </div>
    </div>
  </div>
);
