/**
 * Top-level app router.
 *
 * Routes:
 *   /         Entry page. Three jump buttons: Start the lesson, Boxy puzzles,
 *             Trade Mogging. A 9-year-old or an adult evaluator can land on
 *             this page and reach any of the three experiences with one tap.
 *   /lesson   Synthesis-style scripted lesson teaching fractions from zero.
 *             Boxy and Trade Mogging appear inline as later stages of the
 *             lesson; the routes below are direct entry points for users who
 *             already know what they want.
 *   /boxy     Polyomino placement puzzle (ported from boxy-fractions).
 *   /trade    Trade Mogging — the bazaar-vendor game with the LLM-scored
 *             "explain what went wrong" lesson on a missed serve. This is the
 *             original {@link Game} shell.
 *
 * BrowserRouter and not HashRouter because the deployment is a Node web
 * service that owns its own routing — index.html is served for any GET that
 * isn't /api/* or /healthz, so deep-linking works. See server/index.mjs.
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Game } from './components/Game';
import { EntryPage } from './components/EntryPage';
import { Lesson } from './components/Lesson';
import { BoxyPage } from './components/BoxyPage';
import { SiteNav } from './components/SiteNav';

export default function App() {
  return (
    <BrowserRouter>
      <SiteNav />
      <Routes>
        <Route path="/" element={<EntryPage />} />
        <Route path="/lesson" element={<Lesson />} />
        <Route path="/boxy" element={<BoxyPage />} />
        <Route path="/trade" element={<Game />} />
        {/* Any unknown path bounces back to the entry. The router is the
            single source of truth — a stray link is never a dead end. */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
