import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

const IDLE_TIMEOUT = 2 * 60 * 60 * 1000; // 2 hours

export default function IdleLogout() {
  const { logout } = useAuth();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        logout();
      }, IDLE_TIMEOUT);
    };

    const handleActivity = (event) => {
      if (event?.type === "visibilitychange" && document.hidden) {
        return;
      }
      resetTimer();
    };

    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "focus",
      "visibilitychange",
    ];

    events.forEach((event) => {
      const target = event === "visibilitychange" ? document : window;
      target.addEventListener(event, handleActivity);
    });

    resetTimer();

    return () => {
      clearTimeout(timer);
      events.forEach((event) => {
        const target = event === "visibilitychange" ? document : window;
        target.removeEventListener(event, handleActivity);
      });
    };
  }, [logout]);

  return null;
}