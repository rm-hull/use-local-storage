import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useRef, useState } from "react";

const localStorageAtom = atom<Record<string, unknown> | undefined>(undefined);

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

function readValue<T>(key: string): T | undefined {
  if (typeof window === "undefined") {
    return undefined;
  }

  const item = window.localStorage.getItem(key);
  return item === null || item === undefined
    ? undefined
    : (JSON.parse(item) as T);
}

function setValue<T>(key: string, value?: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      window.localStorage.setItem(key, JSON.stringify(value));
    }

    window.dispatchEvent(new Event("local-storage"));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

export const useLocalStorage = <T>(key: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [storedValue, setStoredValue] = useAtom(localStorageAtom);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );

  useEffect(() => {
    const updateValue = (newValue: T | undefined) => {
      setStoredValue((prev) => {
        const currentValue = prev?.[key];
        if (isEqual(currentValue, newValue)) {
          return prev ?? {};
        }
        return { ...(prev ?? {}), [key]: newValue };
      });
    };

    updateValue(readValue<T>(key));

    const handleStorageChange = (): void => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        updateValue(readValue<T>(key));
      }, 50);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("local-storage", handleStorageChange);
    }

    const timeoutId = setTimeout(() => setIsLoading(false), 0);

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("local-storage", handleStorageChange);
      }
      clearTimeout(timeoutId);
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [key, setStoredValue]);

  return {
    value: storedValue?.[key] as T,
    setValue: useCallback(
      (value?: T) => {
        setValue(key, value);
      },
      [key]
    ),
    isLoading,
  };
};
