/**
 * Persistent top navigation. Three direct-jump links plus a wordmark home
 * link. Hidden on `/` so the entry page reads as a clean splash, then
 * present everywhere else so the player can hop between the lesson, Boxy,
 * and Trade Mogging without going back to the entry.
 *
 * The active route is highlighted in lantern-gold; inactive routes sit in
 * muted sand. NavLink's `isActive` callback handles this without us having
 * to subscribe to location ourselves.
 */
import { NavLink, useLocation, Link } from 'react-router-dom';

const linkClass = ({ isActive }: { isActive: boolean }): string =>
  [
    'px-3 py-1.5 rounded-md text-sm font-display tracking-wider transition-colors',
    isActive
      ? 'text-lantern-gold bg-bazaar-panel'
      : 'text-text-muted hover:text-text-primary',
  ].join(' ');

export const SiteNav: React.FC = () => {
  const location = useLocation();
  if (location.pathname === '/') return null;
  return (
    <nav
      className="sticky top-0 z-40 flex items-center justify-between gap-2 px-4 py-2 backdrop-blur-md"
      style={{
        background: 'rgba(15, 20, 36, 0.72)',
        boxShadow: 'inset 0 -1px 0 rgba(212, 200, 178, 0.10)',
      }}
      aria-label="Site sections"
    >
      <Link
        to="/"
        className="text-lantern-gold font-display tracking-widest text-sm hover:opacity-80"
      >
        ▸ HOME
      </Link>
      <div className="flex gap-1 flex-wrap justify-end">
        <NavLink to="/lesson" className={linkClass}>
          Lesson
        </NavLink>
        <NavLink to="/tutorial" className={linkClass}>
          Tutorial
        </NavLink>
        <NavLink to="/boxy" className={linkClass}>
          Boxy
        </NavLink>
        <NavLink to="/trade" className={linkClass}>
          Trade Mog
        </NavLink>
      </div>
    </nav>
  );
};
