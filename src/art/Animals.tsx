/**
 * Hand-drawn SVG art for Trade Mogging.
 *
 * Design system rules (do not break, the tight scheme is the brand):
 *   - All animals: flat vector, thick 4px black stroke, rounded corners.
 *   - All faces: same eye glyph (small filled circle, white highlight dot top-right).
 *   - All accessories: one "vibe" piece per animal (fez, sunglasses, gold chain, flat cap).
 *   - Palette: warm earth tones from tailwind config (sand-warm, lantern-gold, terracotta).
 *   - No outlines on accessories that compete with the body silhouette.
 *
 * Each component renders into its parent's allotted box and scales via viewBox. Parents control
 * the on-screen size by setting width/height on the wrapper div.
 *
 * The {@link Capybara} component takes a `mood` prop because it's the protagonist and reacts to
 * trade outcomes (chill while waiting, smug after a mog, sad after a wrong serve). Vendors take
 * a `state` prop ('idle' | 'mogged' | 'served') for their reaction.
 */
import type { FC } from 'react';

type CapybaraMood = 'chill' | 'smug' | 'sad';
type VendorState = 'idle' | 'mogged' | 'served';

interface AnimalProps {
  readonly className?: string;
}

interface CapybaraProps extends AnimalProps {
  readonly mood?: CapybaraMood;
}

interface VendorArtProps extends AnimalProps {
  readonly state?: VendorState;
}

/** Shared eye glyph. Two filled circles + a tiny white highlight = consistent gaze across all animals. */
const Eye: FC<{ cx: number; cy: number; r?: number }> = ({ cx, cy, r = 5 }) => (
  <g>
    <circle cx={cx} cy={cy} r={r} fill="#1a1a1a" />
    <circle cx={cx + r * 0.35} cy={cy - r * 0.35} r={r * 0.3} fill="#fff" />
  </g>
);

/** Sad eyes for the capybara after a wrong serve. Half-closed via path. */
const SadEye: FC<{ cx: number; cy: number }> = ({ cx, cy }) => (
  <path d={`M ${cx - 5} ${cy} Q ${cx} ${cy - 3} ${cx + 5} ${cy}`} stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
);

/**
 * Capybara protagonist. The chunky rectangular body is the read — capybaras IRL are famously
 * blocky, like a guinea pig that hit the gym. Tiny round ears, blocky nose, small black eyes.
 *
 * Why three moods: chill is the default (kid is shopping), smug appears during the MOG animation
 * (capybara has just sat on a vendor's head), sad appears in the lesson panel after a wrong serve.
 */
export const Capybara: FC<CapybaraProps> = ({ className, mood = 'chill' }) => (
  <svg viewBox="0 0 200 180" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body — chunky rounded rectangle */}
    <rect x="20" y="60" width="160" height="100" rx="35" fill="#a06b3f" stroke="#1a1a1a" strokeWidth="4" />
    {/* Belly — slightly lighter overlay */}
    <ellipse cx="100" cy="135" rx="55" ry="22" fill="#c98e5a" />
    {/* Head — blocky, sits on top */}
    <rect x="45" y="25" width="110" height="65" rx="28" fill="#a06b3f" stroke="#1a1a1a" strokeWidth="4" />
    {/* Ears — small rounded nubs */}
    <ellipse cx="62" cy="28" rx="10" ry="8" fill="#7a5230" stroke="#1a1a1a" strokeWidth="3" />
    <ellipse cx="138" cy="28" rx="10" ry="8" fill="#7a5230" stroke="#1a1a1a" strokeWidth="3" />
    {/* Eyes — switch on mood */}
    {mood === 'sad' ? (
      <>
        <SadEye cx={78} cy={55} />
        <SadEye cx={122} cy={55} />
      </>
    ) : (
      <>
        <Eye cx={78} cy={55} r={4} />
        <Eye cx={122} cy={55} r={4} />
      </>
    )}
    {/* Nose / muzzle — wide blocky rectangle (the capybara signature) */}
    <rect x="75" y="68" width="50" height="20" rx="10" fill="#7a5230" stroke="#1a1a1a" strokeWidth="3" />
    <circle cx="92" cy="78" r="2.5" fill="#1a1a1a" />
    <circle cx="108" cy="78" r="2.5" fill="#1a1a1a" />
    {/* Mouth — varies with mood */}
    {mood === 'smug' && (
      <path d="M 88 87 Q 100 95 112 87" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )}
    {mood === 'sad' && (
      <path d="M 88 92 Q 100 84 112 92" stroke="#1a1a1a" strokeWidth="2.5" fill="none" strokeLinecap="round" />
    )}
    {/* Feet — tiny stumps */}
    <rect x="35" y="155" width="22" height="18" rx="6" fill="#7a5230" stroke="#1a1a1a" strokeWidth="3" />
    <rect x="143" y="155" width="22" height="18" rx="6" fill="#7a5230" stroke="#1a1a1a" strokeWidth="3" />
    {mood === 'smug' && (
      // Sunglasses overlay — appears only on smug for the MOG flex
      <g>
        <rect x="62" y="48" width="76" height="16" rx="4" fill="#1a1a1a" />
        <rect x="66" y="51" width="28" height="10" rx="2" fill="#3a3a3a" />
        <rect x="106" y="51" width="28" height="10" rx="2" fill="#3a3a3a" />
      </g>
    )}
  </svg>
);

/* ───────────────────────  Vendor Animals  ─────────────────────── */

/** Pita Camel — long neck, hump, flat cap. Chill seller, no signature accessory beyond the cap. */
export const PitaCamel: FC<VendorArtProps> = ({ className, state = 'idle' }) => (
  <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="105" cy="160" rx="60" ry="40" fill="#d4a86a" stroke="#1a1a1a" strokeWidth="4" />
    {/* Hump */}
    <path d="M 70 140 Q 105 100 145 140" fill="#b8895a" stroke="#1a1a1a" strokeWidth="4" />
    {/* Neck */}
    <rect x="45" y="80" width="22" height="80" fill="#d4a86a" stroke="#1a1a1a" strokeWidth="4" />
    {/* Head */}
    <ellipse cx="50" cy="65" rx="32" ry="24" fill="#d4a86a" stroke="#1a1a1a" strokeWidth="4" />
    {/* Snout */}
    <ellipse cx="28" cy="72" rx="14" ry="10" fill="#b8895a" stroke="#1a1a1a" strokeWidth="3" />
    {/* Eye */}
    {state === 'mogged' ? <SadEye cx={56} cy={58} /> : <Eye cx={56} cy={58} r={4} />}
    {/* Flat cap — squashed disc on top of head */}
    <ellipse cx="55" cy="42" rx="22" ry="6" fill="#5a3a2a" stroke="#1a1a1a" strokeWidth="3" />
    <rect x="40" y="36" width="30" height="10" rx="4" fill="#7a4a2a" stroke="#1a1a1a" strokeWidth="3" />
    {/* Legs */}
    <rect x="65" y="195" width="14" height="22" fill="#b8895a" stroke="#1a1a1a" strokeWidth="3" />
    <rect x="125" y="195" width="14" height="22" fill="#b8895a" stroke="#1a1a1a" strokeWidth="3" />
  </svg>
);

/** Hummus Goat — horns, beard, square pupils. Sunglasses signature. */
export const HummusGoat: FC<VendorArtProps> = ({ className, state = 'idle' }) => (
  <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="160" rx="58" ry="42" fill="#e8e0d0" stroke="#1a1a1a" strokeWidth="4" />
    {/* Head */}
    <ellipse cx="100" cy="90" rx="42" ry="36" fill="#e8e0d0" stroke="#1a1a1a" strokeWidth="4" />
    {/* Horns — curved back */}
    <path d="M 75 60 Q 65 40 75 30" stroke="#3a2a1a" strokeWidth="6" fill="none" strokeLinecap="round" />
    <path d="M 125 60 Q 135 40 125 30" stroke="#3a2a1a" strokeWidth="6" fill="none" strokeLinecap="round" />
    {/* Snout */}
    <ellipse cx="100" cy="108" rx="20" ry="13" fill="#c8b8a0" stroke="#1a1a1a" strokeWidth="3" />
    <circle cx="92" cy="106" r="2" fill="#1a1a1a" />
    <circle cx="108" cy="106" r="2" fill="#1a1a1a" />
    {/* Beard — pointy below snout */}
    <path d="M 92 120 L 100 135 L 108 120" fill="#e8e0d0" stroke="#1a1a1a" strokeWidth="3" />
    {/* Sunglasses — signature accessory */}
    <rect x="62" y="75" width="76" height="18" rx="4" fill="#1a1a1a" />
    <rect x="66" y="78" width="28" height="12" rx="2" fill="#2a2a2a" />
    <rect x="106" y="78" width="28" height="12" rx="2" fill="#2a2a2a" />
    {state === 'mogged' && (
      <g>
        {/* Cracked-lens X overlay for mogged state */}
        <line x1="70" y1="80" x2="90" y2="90" stroke="#fff" strokeWidth="1.5" />
        <line x1="90" y1="80" x2="70" y2="90" stroke="#fff" strokeWidth="1.5" />
      </g>
    )}
    {/* Ears — floppy */}
    <ellipse cx="58" cy="78" rx="10" ry="14" fill="#c8b8a0" stroke="#1a1a1a" strokeWidth="3" transform="rotate(-20 58 78)" />
    <ellipse cx="142" cy="78" rx="10" ry="14" fill="#c8b8a0" stroke="#1a1a1a" strokeWidth="3" transform="rotate(20 142 78)" />
    {/* Legs */}
    <rect x="70" y="195" width="14" height="22" fill="#c8b8a0" stroke="#1a1a1a" strokeWidth="3" />
    <rect x="116" y="195" width="14" height="22" fill="#c8b8a0" stroke="#1a1a1a" strokeWidth="3" />
  </svg>
);

/** Olive Pigeon — round body, beak, fez. */
export const OlivePigeon: FC<VendorArtProps> = ({ className, state = 'idle' }) => (
  <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body — round */}
    <ellipse cx="100" cy="140" rx="60" ry="55" fill="#7a8090" stroke="#1a1a1a" strokeWidth="4" />
    {/* Belly */}
    <ellipse cx="100" cy="160" rx="40" ry="30" fill="#a8b0c0" />
    {/* Head */}
    <circle cx="100" cy="75" r="34" fill="#7a8090" stroke="#1a1a1a" strokeWidth="4" />
    {/* Beak */}
    <path d="M 130 75 L 152 73 L 130 83 Z" fill="#f5c542" stroke="#1a1a1a" strokeWidth="3" />
    {/* Eye */}
    {state === 'mogged' ? <SadEye cx={115} cy={68} /> : <Eye cx={115} cy={68} r={4} />}
    {/* Fez — signature: red cylinder + tassel */}
    <rect x="80" y="42" width="40" height="22" rx="2" fill="#d9533a" stroke="#1a1a1a" strokeWidth="3" />
    <ellipse cx="100" cy="42" rx="20" ry="4" fill="#d9533a" stroke="#1a1a1a" strokeWidth="3" />
    <circle cx="118" cy="38" r="3.5" fill="#1a1a1a" />
    <line x1="118" y1="42" x2="124" y2="56" stroke="#1a1a1a" strokeWidth="2" />
    {/* Wing */}
    <ellipse cx="65" cy="135" rx="22" ry="38" fill="#5a606e" stroke="#1a1a1a" strokeWidth="3" transform="rotate(-15 65 135)" />
    {/* Feet */}
    <line x1="85" y1="195" x2="85" y2="208" stroke="#f5c542" strokeWidth="4" strokeLinecap="round" />
    <line x1="115" y1="195" x2="115" y2="208" stroke="#f5c542" strokeWidth="4" strokeLinecap="round" />
  </svg>
);

/** Falafel Cat — triangular ears, whiskers, gold chain. */
export const FalafelCat: FC<VendorArtProps> = ({ className, state = 'idle' }) => (
  <svg viewBox="0 0 200 220" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body */}
    <ellipse cx="100" cy="155" rx="55" ry="45" fill="#3a3a48" stroke="#1a1a1a" strokeWidth="4" />
    {/* Head */}
    <ellipse cx="100" cy="80" rx="42" ry="38" fill="#3a3a48" stroke="#1a1a1a" strokeWidth="4" />
    {/* Ears */}
    <path d="M 65 55 L 60 25 L 85 45 Z" fill="#3a3a48" stroke="#1a1a1a" strokeWidth="3" />
    <path d="M 135 55 L 140 25 L 115 45 Z" fill="#3a3a48" stroke="#1a1a1a" strokeWidth="3" />
    <path d="M 70 50 L 70 32 L 80 44 Z" fill="#d9a3a3" />
    <path d="M 130 50 L 130 32 L 120 44 Z" fill="#d9a3a3" />
    {/* Eyes — green */}
    {state === 'mogged' ? (
      <>
        <SadEye cx={82} cy={78} />
        <SadEye cx={118} cy={78} />
      </>
    ) : (
      <>
        <circle cx="82" cy="78" r="5" fill="#3ad9a6" />
        <ellipse cx="82" cy="78" rx="1.5" ry="4" fill="#1a1a1a" />
        <circle cx="118" cy="78" r="5" fill="#3ad9a6" />
        <ellipse cx="118" cy="78" rx="1.5" ry="4" fill="#1a1a1a" />
      </>
    )}
    {/* Nose */}
    <path d="M 95 92 L 105 92 L 100 100 Z" fill="#d9533a" stroke="#1a1a1a" strokeWidth="2" />
    {/* Whiskers */}
    <line x1="65" y1="98" x2="85" y2="100" stroke="#fff" strokeWidth="1.5" />
    <line x1="65" y1="108" x2="85" y2="105" stroke="#fff" strokeWidth="1.5" />
    <line x1="135" y1="98" x2="115" y2="100" stroke="#fff" strokeWidth="1.5" />
    <line x1="135" y1="108" x2="115" y2="105" stroke="#fff" strokeWidth="1.5" />
    {/* Gold chain — signature */}
    <ellipse cx="100" cy="125" rx="32" ry="8" fill="none" stroke="#f5c542" strokeWidth="4" />
    <circle cx="100" cy="132" r="6" fill="#f5c542" stroke="#1a1a1a" strokeWidth="2" />
    <text x="100" y="135" textAnchor="middle" fontSize="6" fontWeight="bold" fill="#1a1a1a">$</text>
  </svg>
);

/** Boss Water Buffalo — bigger, horns curving wide, nose ring, intimidating brow. */
export const BossBuffalo: FC<VendorArtProps> = ({ className, state = 'idle' }) => (
  <svg viewBox="0 0 240 240" className={className} xmlns="http://www.w3.org/2000/svg">
    {/* Body — chunky */}
    <ellipse cx="120" cy="170" rx="78" ry="55" fill="#2a2a35" stroke="#1a1a1a" strokeWidth="5" />
    {/* Head */}
    <ellipse cx="120" cy="95" rx="55" ry="48" fill="#2a2a35" stroke="#1a1a1a" strokeWidth="5" />
    {/* Horns — wide curving outward */}
    <path d="M 75 75 Q 35 65 30 95" stroke="#5a4530" strokeWidth="9" fill="none" strokeLinecap="round" />
    <path d="M 165 75 Q 205 65 210 95" stroke="#5a4530" strokeWidth="9" fill="none" strokeLinecap="round" />
    {/* Brow ridge — intimidating */}
    <path d="M 75 85 Q 95 75 110 88" stroke="#1a1a1a" strokeWidth="4" fill="none" />
    <path d="M 130 88 Q 145 75 165 85" stroke="#1a1a1a" strokeWidth="4" fill="none" />
    {/* Eyes — red angry */}
    {state === 'mogged' ? (
      <>
        <SadEye cx={95} cy={100} />
        <SadEye cx={145} cy={100} />
      </>
    ) : (
      <>
        <circle cx="95" cy="100" r="6" fill="#d9533a" />
        <circle cx="95" cy="100" r="3" fill="#1a1a1a" />
        <circle cx="145" cy="100" r="6" fill="#d9533a" />
        <circle cx="145" cy="100" r="3" fill="#1a1a1a" />
      </>
    )}
    {/* Snout */}
    <ellipse cx="120" cy="125" rx="28" ry="18" fill="#3a3a45" stroke="#1a1a1a" strokeWidth="4" />
    {/* Nostrils */}
    <ellipse cx="111" cy="125" rx="2.5" ry="4" fill="#1a1a1a" />
    <ellipse cx="129" cy="125" rx="2.5" ry="4" fill="#1a1a1a" />
    {/* Nose ring — signature, gold hoop through septum */}
    <circle cx="120" cy="138" r="7" fill="none" stroke="#f5c542" strokeWidth="3" />
    {/* Legs */}
    <rect x="78" y="218" width="18" height="20" fill="#1f1f28" stroke="#1a1a1a" strokeWidth="3" />
    <rect x="144" y="218" width="18" height="20" fill="#1f1f28" stroke="#1a1a1a" strokeWidth="3" />
  </svg>
);

/* ───────────────────────  Resolver  ─────────────────────── */

/** Render the right vendor SVG by id. Keeps callers from knowing the component names. */
export const VendorArt: FC<{ vendorId: string; state?: VendorState; className?: string }> = ({
  vendorId,
  state = 'idle',
  className,
}) => {
  switch (vendorId) {
    case 'camel-pita':
      return <PitaCamel state={state} className={className} />;
    case 'goat-hummus':
      return <HummusGoat state={state} className={className} />;
    case 'pigeon-olive':
      return <OlivePigeon state={state} className={className} />;
    case 'cat-falafel':
      return <FalafelCat state={state} className={className} />;
    case 'buffalo-boss':
      return <BossBuffalo state={state} className={className} />;
    default:
      // Better to render a visible placeholder than fail silently — if a vendor id is wrong
      // we want the kid (and devs) to immediately see "?" not an empty stall.
      return (
        <div className="flex items-center justify-center text-spice-red text-4xl font-bold border-4 border-spice-red border-dashed">
          ?{vendorId}
        </div>
      );
  }
};
