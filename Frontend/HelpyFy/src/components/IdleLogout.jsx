import { useEffect } from "react";
import { useAuth } from "../auth/AuthContext";

export default function IdleLogout() {
  const { logout } = useAuth();

  useEffect(() => {
    let timer;

    const resetTimer = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        logout();
      }, 60 * 60 * 1000); // 1 hour
    };

    const events = [
      "mousemove",
      "mousedown",
      "keypress",
      "scroll",
      "touchstart",
    ];

    events.forEach((event) =>
      window.addEventListener(event, resetTimer)
    );

    resetTimer();

    return () => {
      clearTimeout(timer);

      events.forEach((event) =>
        window.removeEventListener(event, resetTimer)
      );
    };
  }, [logout]);

  return null;
}