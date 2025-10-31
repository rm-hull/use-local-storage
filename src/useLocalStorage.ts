import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export interface Serializer<T> {
  // eslint-disable-next-line no-unused-vars
  serialize: (_value: T) => string | Promise<string>;
  // eslint-disable-next-line no-unused-vars
  deserialize: (_value: string) => T | Promise<T>;
}

export class JsonSerializer<T> implements Serializer<T> {
  public serialize(value: T): string {
    return JSON.stringify(value);
  }

  public deserialize(value: string): T {
    return JSON.parse(value) as T;
  }
}

const localStorageAtom = atom<Record<string, unknown> | undefined>(undefined);

function isEqual(a: unknown, b: unknown): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

async function readValue<T>(
  key: string,
  serializer: Serializer<T>
): Promise<T | undefined> {
  if (typeof window === "undefined") {
    return undefined;
  }

  const item = window.localStorage.getItem(key);
  if (item === null || item === undefined) {
    return undefined;
  }

  try {
    return await Promise.resolve(serializer.deserialize(item));
  } catch (error) {
    console.error(`Error deserializing localStorage key "${key}":`, error);
    return undefined;
  }
}

async function setValue<T>(key: string, serializer: Serializer<T>, value?: T) {
  if (typeof window === "undefined") {
    return;
  }

  try {
    if (value === undefined) {
      window.localStorage.removeItem(key);
    } else {
      const serializedValue = await Promise.resolve(serializer.serialize(value));
      window.localStorage.setItem(key, serializedValue);
    }

    window.dispatchEvent(new Event("local-storage"));
  } catch (error) {
    console.error(`Error setting localStorage key "${key}":`, error);
  }
}

export const useLocalStorage = <T>(
  key: string,
  options?: {
    /**
     * A serializer to use when reading/writing to localStorage.
     *
     * The main use case for this is to encrypt the data before writing it to
     * localStorage, and to decrypt it when reading it.
     *
     * @example
     * A silly example that reverses the string before writing it to localStorage:
     * ```ts
     * const reverseSerializer = {
     *   serialize: (value: string) => value.split('').reverse().join(''),
     *   deserialize: (value: string) => value.split('').reverse().join(''),
     * };
     *
     * const { value } = useLocalStorage('my-key', { serializer: reverseSerializer });
     * ```
     */
    serializer?: Serializer<T>;
  }
) => {
  const [isLoading, setIsLoading] = useState(true);
  const [storedValue, setStoredValue] = useAtom(localStorageAtom);
  const debounceTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
    undefined
  );
  const serializer = useMemo(
    () => options?.serializer ?? new JsonSerializer<T>(),
    [options?.serializer]
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

    readValue<T>(key, serializer)
      .then(updateValue)
      .catch((error) => {
        console.error(`Error reading localStorage key "${key}":`, error);
        updateValue(undefined);
      });

    const handleStorageChange = (): void => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }

      debounceTimeoutRef.current = setTimeout(() => {
        readValue<T>(key, serializer)
          .then(updateValue)
          .catch((error) => {
            console.error(`Error reading localStorage key "${key}":`, error);
            updateValue(undefined);
          });
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
  }, [key, serializer, setStoredValue]);

  return {
    value: storedValue?.[key] as T,
    setValue: useCallback(
      (value?: T) => {
        return setValue(key, serializer, value);
      },
      [key, serializer]
    ),
    isLoading,
  };
};
