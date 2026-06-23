import { useState, useRef, useCallback } from 'react';
import { getErrorMessage } from '../../../utils/errorMessage';

export default function useToast(duration = 4000) {
  const [toasts, setToasts] = useState([]);
  const toastId = useRef(0);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (type, msg) => {
      const id = ++toastId.current;
      setToasts((prev) => [...prev, { id, type, msg: getErrorMessage(msg) }]);
      setTimeout(() => removeToast(id), duration);
    },
    [duration, removeToast]
  );

  return { toasts, toast, removeToast };
}
