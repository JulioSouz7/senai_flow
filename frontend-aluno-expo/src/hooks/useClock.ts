import { useCallback, useEffect, useState } from "react";

export function useClock() {
  const [now, setNow] = useState(0);
  const updateNow = useCallback(() => setNow(Date.now()), []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(timer);
  }, []);

  return { now, updateNow };
}