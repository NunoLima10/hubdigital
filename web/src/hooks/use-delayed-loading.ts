import { useEffect, useState } from "react";

/**
 * Avoid flashing a loading placeholder when a request completes almost
 * immediately. The initial value stays false on both the server and client,
 * so hydration also starts from the same UI.
 */
export function useDelayedLoading(isLoading: boolean, delay = 200) {
  const [showLoading, setShowLoading] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      setShowLoading(false);
      return;
    }

    const timeout = window.setTimeout(() => setShowLoading(true), delay);
    return () => window.clearTimeout(timeout);
  }, [delay, isLoading]);

  return showLoading;
}
