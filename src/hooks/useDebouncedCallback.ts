import { useCallback, useEffect, useRef } from 'react';

type AnyFunction = (...args: unknown[]) => void;

export const useDebouncedCallback = <T extends AnyFunction>(callback: T, delay = 300) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const debounced = useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = setTimeout(() => {
        callback(...args);
      }, delay);
    },
    [callback, delay],
  );

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debounced;
};

export default useDebouncedCallback;