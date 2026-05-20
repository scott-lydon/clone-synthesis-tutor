import { useGameStore } from "../store/gameStore";

/**
 * Message panel: shows ONLY the most recent message, with a dismiss × on the
 * right. Three tones:
 *
 *   info  — neutral status (e.g. submit results below 100%)
 *   warn  — placement suggestion (dusty honey, NOT red)
 *   win   — completion (soft sage)
 *
 * Previously the panel stacked the latest 3, so a player making three
 * placement attempts in a row saw three identical messages piled up.
 * Now one slot, one message, dismissible. The store dedupes consecutive
 * identical messages on the append side as a second safety net.
 */
export function MessagesPanel() {
  const messages = useGameStore((s) => s.messages);
  const dismissMessages = useGameStore((s) => s.dismissMessages);
  if (messages.length === 0) return null;
  const m = messages[messages.length - 1];
  const style = tone(m.kind);
  return (
    <div
      key={m.id}
      className="text-sm rounded-md px-3 py-2 flex items-start gap-3"
      style={style}
    >
      <span className="flex-1 leading-relaxed">{m.text}</span>
      <button
        type="button"
        onClick={dismissMessages}
        aria-label="Dismiss message"
        className="flex-shrink-0 rounded-md w-6 h-6 -mr-1 -mt-0.5 flex items-center justify-center text-base leading-none transition-colors"
        style={{ color: style.color, opacity: 0.6 }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
      >
        ×
      </button>
    </div>
  );
}

function tone(kind: "info" | "warn" | "win"): React.CSSProperties {
  switch (kind) {
    case "warn":
      return {
        background: "rgba(230, 200, 121, 0.10)",
        boxShadow: "inset 0 0 0 1px rgba(230, 200, 121, 0.35)",
        color: "#f0e3b5",
      };
    case "win":
      return {
        background: "rgba(168, 198, 159, 0.12)",
        boxShadow: "inset 0 0 0 1px rgba(168, 198, 159, 0.35)",
        color: "#d4e3cb",
      };
    case "info":
    default:
      return {
        background: "rgba(31, 41, 55, 0.5)",
        boxShadow: "inset 0 0 0 1px rgba(212, 200, 178, 0.18)",
        color: "#dcd4be",
      };
  }
}
