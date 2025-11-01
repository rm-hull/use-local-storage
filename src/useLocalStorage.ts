import { atom, useAtom } from "jotai";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LocalStorageError } from "./error";

export interface Serializer<T> {
  // eslint-disable-next-line no-unused-vars
  serialize: (value: T) => string | Promise<string>;
  // eslint-disable-next-line no-unused-vars
  deserialize: (value: string) => T | Promise<T>;
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
    throw new LocalStorageError(
      `Error deserializing localStorage key "${key}"`,
      { cause: error }
    );
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
      const serializedValue = await Promise.resolve(
        serializer.serialize(value)
      );
      window.localStorage.setItem(key, serializedValue);
    }

    window.dispatchEvent(new Event("local-storage"));
  } catch (error) {
    throw new LocalStorageError(
      `Error setting localStorage key "${key}"`,
      error as Error
    );
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
    initialValue?: T;
  }
) => {
  const [error, setError] = useState<Error | undefined>();
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

    const readValueFromStorage = () => {
      readValue<T>(key, serializer)
        .then((newValue) => {
          setError(undefined);
          updateValue(newValue);
        })
        .catch((error) => {
          setError(error);
          updateValue(undefined);
        })
        .finally(() => void setIsLoading(false));
    };

    readValueFromStorage();

    const handleStorageChange = (): void => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      debounceTimeoutRef.current = setTimeout(readValueFromStorage, 50);
    };

    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorageChange);
      window.addEventListener("local-storage", handleStorageChange);
    }

    return () => {
      if (typeof window !== "undefined") {
        window.removeEventListener("storage", handleStorageChange);
        window.removeEventListener("local-storage", handleStorageChange);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [key, serializer, setStoredValue]);

  return {
    value: error
      ? undefined
      : (storedValue?.[key] as T) ?? options?.initialValue,
    setValue: useCallback(
      (value?: T) => setValue(key, serializer, value),
      [key, serializer]
    ),
    isLoading,
    error,
  };
};
