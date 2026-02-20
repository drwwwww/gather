import { useCallback, useEffect, useRef, useState } from "react";

type ToastTone = "success" | "error";

type ToastState = {
  message: string;
  tone: ToastTone;
};

export function useToast(timeoutMs = 3200) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const timerRef = useRef<number | null>(null);

  const clearToast = useCallback(() => {
    setToast(null);
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const pushToast = useCallback(
    (message: string, tone: ToastTone = "success") => {
      setToast({ message, tone });
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
      timerRef.current = window.setTimeout(() => setToast(null), timeoutMs);
    },
    [timeoutMs]
  );

  useEffect(() => () => clearToast(), [clearToast]);

  return { toast, pushToast, clearToast };
}
