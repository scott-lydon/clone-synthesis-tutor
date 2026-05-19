/**
 * Game shell. Owns the XState machine, dnd-kit DndContext, and the screen-state switch.
 *
 * On any drop into the tray, we synthesize a TrayPiece (vendor piece + new trayId) and dispatch
 * DROP_PIECE to the machine. The machine is the only thing that mutates the tray; the React
 * components are pure renders of context.
 *
 * The "active customer" lookup is centralized here. If we ever index past the end of CUSTOMERS
 * we surface a clear error message rather than render an empty bazaar.
 */
import { DndContext, type DragEndEvent, PointerSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useMachine } from '@xstate/react';
import { useEffect } from 'react';
import { gameMachine, customerFromContext } from '../game/machine';
import { ALL_VENDORS, CUSTOMERS } from '../game/curriculum';
import type { TrayPiece, VendorPiece } from '../game/types';
import { CustomerCard } from './CustomerCard';
import { VendorStall } from './VendorStall';
import { AssemblyTray } from './AssemblyTray';
import { CashStack } from './CashStack';
import { MogSplash } from './MogSplash';
import { ProfitSplash } from './ProfitSplash';
import { LessonPanel } from './LessonPanel';
import { playPieceDrop } from '../game/sound';

let pieceCounter = 0;
const nextTrayId = (): string => `tray-${Date.now()}-${++pieceCounter}`;

export const Game: React.FC = () => {
  const [snapshot, send] = useMachine(gameMachine);
  const { context, value } = snapshot;
  const customer = customerFromContext(context);

  // Sensor config tuned for iPad Safari: 8px activation threshold so a tap-without-drag does not
  // become a phantom drop, and touch delay zero so kid's finger feels responsive.
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 80, tolerance: 6 } }),
  );

  useEffect(() => {
    // Reset the pieceCounter when game restarts so trayIds don't grow unbounded across sessions.
    if (value === 'intro') pieceCounter = 0;
  }, [value]);

  const handleDragEnd = (e: DragEndEvent): void => {
    if (e.over?.id !== 'assembly-tray') return;
    const piece = e.active.data.current?.piece as VendorPiece | undefined;
    if (!piece) {
      // eslint-disable-next-line no-console
      console.warn(
        '[Game] DragEnd over tray with no piece data. ' +
          'Likely cause: a draggable was registered without passing { data: { piece } }. ' +
          'Check VendorStall.DraggablePiece useDraggable args.',
      );
      return;
    }
    const tp: TrayPiece = { trayId: nextTrayId(), piece };
    playPieceDrop();
    send({ type: 'DROP_PIECE', tp });
  };

  /* ─────────────  Intro screen  ─────────────── */
  if (value === 'intro') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🐹</div>
        <h1 className="text-6xl font-display text-lantern-gold tracking-widest mb-2">TRADE MOGGING</h1>
        <p className="text-text-muted text-lg max-w-md mb-6">
          You are a capybara at the bazaar. Build customer orders from vendor pieces. Find the cheapest combo and mog the trader. Wrong amounts lose money.
        </p>
        <button
          onClick={() => send({ type: 'START' })}
          className="px-8 py-4 rounded-2xl bg-lantern-gold text-bazaar-night font-display text-2xl tracking-widest active:scale-95"
        >
          OPEN THE STALL
        </button>
        <div className="mt-12 text-text-muted text-xs max-w-sm">
          Tap to start. Touch and drag fraction pieces from vendor stalls to your tray. Tap SERVE when ready.
        </div>
      </div>
    );
  }

  /* ─────────────  Complete screen  ─────────────── */
  if (value === 'complete') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="text-6xl mb-4">🏆</div>
        <h2 className="text-4xl font-display text-lantern-gold tracking-widest mb-3">BAZAAR CLOSED</h2>
        <div className="text-text-muted mb-2">You served {CUSTOMERS.length} customers.</div>
        <div className="text-5xl font-display text-mint-fresh mb-6">${context.cash.toFixed(2)}</div>
        <button
          onClick={() => send({ type: 'RESTART' })}
          className="px-6 py-3 rounded-xl bg-bazaar-panel border-2 border-lantern-deep text-lantern-gold font-display text-lg tracking-wider active:scale-95"
        >
          Open tomorrow's bazaar
        </button>
      </div>
    );
  }

  /* ─────────────  Active game  ─────────────── */
  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-spice-red text-center">
        <div>
          <div className="text-3xl mb-2">No customer at index {context.customerIndex}.</div>
          <div className="text-text-muted text-sm max-w-md">
            CUSTOMERS array has {CUSTOMERS.length} entries. This is a curriculum bug. Check that
            advancing past the last customer transitions to 'complete', not 'shopping'.
          </div>
        </div>
      </div>
    );
  }

  const moggedState = (vendorId: string): 'idle' | 'mogged' | 'served' =>
    value === 'mogSplash' && context.moggedVendorId === vendorId ? 'mogged' : 'idle';

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      <div className="h-screen flex flex-col p-3 overflow-hidden">
        {/* Top bar: cash + progress */}
        <div className="flex justify-between items-center mb-3">
          <CashStack cash={context.cash} />
          <div className="text-text-muted text-sm font-semibold">
            Customer {context.customerIndex + 1} / {CUSTOMERS.length}
          </div>
        </div>

        {/* Customer card */}
        <CustomerCard customer={customer} isBoss={customer.id.startsWith('c-boss-')} />

        {/* Assembly tray */}
        <div className="my-3">
          <AssemblyTray
            customer={customer}
            tray={context.tray}
            onSubmit={() => send({ type: 'SUBMIT' })}
            onRemove={(trayId) => send({ type: 'REMOVE_PIECE', trayId })}
            onClear={() => send({ type: 'CLEAR_TRAY' })}
          />
        </div>

        {/* Vendor stalls */}
        <div className="flex-1 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
            {ALL_VENDORS.map((vendor) => (
              <VendorStall
                key={vendor.id}
                vendor={vendor}
                isActive={vendor.food === customer.food}
                moggedState={moggedState(vendor.id)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Outcome overlays */}
      {value === 'mogSplash' && context.lastOutcome?.kind === 'mog' && context.moggedVendorId && (
        <MogSplash
          vendor={ALL_VENDORS.find((v) => v.id === context.moggedVendorId)!}
          profit={context.lastOutcome.profit}
          bonus={context.lastOutcome.bonus}
          customerLabel={`Order: ${customer.orderText}`}
          hasMore={context.customerIndex + 1 < CUSTOMERS.length}
          onAdvance={() => send({ type: 'ADVANCE' })}
        />
      )}
      {value === 'profitOk' && context.lastOutcome?.kind === 'profit' && (
        <ProfitSplash
          profit={context.lastOutcome.profit}
          cheaperBy={context.lastOutcome.cheaperBy}
          hasMore={context.customerIndex + 1 < CUSTOMERS.length}
          onAdvance={() => send({ type: 'ADVANCE' })}
        />
      )}
      {value === 'lesson' && context.lastOutcome && (context.lastOutcome.kind === 'wrong-amount' || context.lastOutcome.kind === 'wrong-food') && (
        <LessonPanel
          customer={customer}
          outcome={context.lastOutcome}
          hasMore={context.customerIndex + 1 < CUSTOMERS.length}
          onRetry={() => send({ type: 'CLEAR_TRAY' })}
          onAdvance={() => send({ type: 'ADVANCE' })}
        />
      )}
    </DndContext>
  );
};
