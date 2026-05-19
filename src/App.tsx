/**
 * Trade Mogging — top-level app.
 *
 * Single responsibility: mount the {@link Game} shell. All game state, drag-and-drop wiring,
 * sound, and overlay routing live inside Game.tsx so this file stays a stable entry point that
 * never needs to change as features are added.
 */
import { Game } from './components/Game';

export default function App() {
  return <Game />;
}
