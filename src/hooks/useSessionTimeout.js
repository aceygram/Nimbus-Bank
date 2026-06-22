import { useEffect, useRef, useState } from "react";

// Tune these for your demo. In a real product these would be informed by
// risk tolerance — banks often use 5-15 min idle, 30-60 min absolute.
export const IDLE_LIMIT_MS = 5 * 60 * 1000; // log out after 5 min of no activity
export const WARNING_BEFORE_MS = 30 * 1000; // warn 30s before that happens
export const ABSOLUTE_LIMIT_MS = 30 * 60 * 1000; // hard cap regardless of activity

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
const SESSION_START_KEY = "nimbus_session_started_at";

/**
 * Tracks idle time and absolute session age. Calls onTimeout("idle" | "absolute")
 * once either limit is hit. Returns warning state so the UI can show a
 * "still there?" countdown before the idle logout actually happens.
 */
export function useSessionTimeout(onTimeout) {
  const [showWarning, setShowWarning] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(WARNING_BEFORE_MS / 1000);
  const lastActivityRef = useRef(Date.now());
  const sessionStartRef = useRef(null);
  const onTimeoutRef = useRef(onTimeout);
  onTimeoutRef.current = onTimeout;

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_START_KEY);
    sessionStartRef.current = stored ? parseInt(stored, 10) : Date.now();
    if (!stored) sessionStorage.setItem(SESSION_START_KEY, String(sessionStartRef.current));

    function markActivity() {
      lastActivityRef.current = Date.now();
      setShowWarning(false);
    }
    ACTIVITY_EVENTS.forEach((evt) => window.addEventListener(evt, markActivity));

    const interval = setInterval(() => {
      const now = Date.now();
      const idleFor = now - lastActivityRef.current;
      const sessionAge = now - sessionStartRef.current;

      if (sessionAge >= ABSOLUTE_LIMIT_MS) {
        clearInterval(interval);
        onTimeoutRef.current("absolute");
        return;
      }
      if (idleFor >= IDLE_LIMIT_MS) {
        clearInterval(interval);
        onTimeoutRef.current("idle");
        return;
      }
      if (idleFor >= IDLE_LIMIT_MS - WARNING_BEFORE_MS) {
        setShowWarning(true);
        setSecondsLeft(Math.ceil((IDLE_LIMIT_MS - idleFor) / 1000));
      }
    }, 1000);

    return () => {
      ACTIVITY_EVENTS.forEach((evt) => window.removeEventListener(evt, markActivity));
      clearInterval(interval);
    };
  }, []);

  function stayLoggedIn() {
    lastActivityRef.current = Date.now();
    setShowWarning(false);
  }

  return { showWarning, secondsLeft, stayLoggedIn };
}

export function clearSessionStart() {
  sessionStorage.removeItem(SESSION_START_KEY);
}
