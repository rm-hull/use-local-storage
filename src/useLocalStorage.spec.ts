import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useLocalStorage, Serializer } from "./useLocalStorage";
import { LocalStorageError } from "./error";

describe("useLocalStorage", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it("should be defined", () => {
    expect(useLocalStorage).toBeDefined();
  });

  describe("Initial State", () => {
    it("should start with isLoading true", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));
      const { isLoading } = result.current;
      expect(isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should set isLoading to false after initialization", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should return undefined value when key does not exist", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBeUndefined();
    });

    it("should read initial value from localStorage", async () => {
      localStorage.setItem("test-key", JSON.stringify("initial-value"));

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBe("initial-value");
    });

    it("should handle complex objects", async () => {
      const complexObject = {
        name: "John",
        age: 30,
        hobbies: ["reading", "coding"],
      };
      localStorage.setItem("test-key", JSON.stringify(complexObject));

      const { result } = renderHook(() =>
        useLocalStorage<typeof complexObject>("test-key")
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toEqual(complexObject);
    });

    it("should handle arrays", async () => {
      const array = [1, 2, 3, 4, 5];
      localStorage.setItem("test-key", JSON.stringify(array));

      const { result } = renderHook(() =>
        useLocalStorage<number[]>("test-key")
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toEqual(array);
    });

    it("should handle boolean values", async () => {
      localStorage.setItem("test-key", JSON.stringify(true));

      const { result } = renderHook(() => useLocalStorage<boolean>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBe(true);
    });

    it("should handle number values", async () => {
      localStorage.setItem("test-key", JSON.stringify(42));

      const { result } = renderHook(() => useLocalStorage<number>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBe(42);
    });

    it("should handle null values", async () => {
      localStorage.setItem("test-key", JSON.stringify(null));

      const { result } = renderHook(() => useLocalStorage<null>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBeNull();
    });
  });

  describe("initialValue Option", () => {
    it("should use initialValue when localStorage is empty", async () => {
      const initialValue = { testValue: "default-value" };
      const { result } = renderHook(() =>
        useLocalStorage<TestBlob<string>>("test-key", { initialValue })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toStrictEqual(initialValue);
      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("should prioritize localStorage value over initialValue", async () => {
      const localStorageValue = { testValue: "stored-value" };
      localStorage.setItem("test-key", JSON.stringify(localStorageValue));
      const initialValue = { testValue: "default-value" };

      const { result } = renderHook(() =>
        useLocalStorage<TestBlob<string>>("test-key", { initialValue })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toStrictEqual(localStorageValue);
    });

    it("should be undefined when localStorage contains an invalid value", async () => {
      localStorage.setItem("test-key", "invalid-json");
      const initialValue = { testValue: "default-value-on-error" };

      const { result } = renderHook(() =>
        useLocalStorage<TestBlob<string>>("test-key", { initialValue })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(LocalStorageError);
      });

      expect(result.current.value).toBeUndefined();
      expect(localStorage.getItem("test-key")).toBe("invalid-json");
    });
  });

  describe("setValue", () => {
    it("should provide a setValue function", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));
      expect(typeof result.current.setValue).toBe("function");

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });

    it("should update the value in localStorage", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setValue("new-value");
      });

      const storedValue = localStorage.getItem("test-key");
      expect(storedValue).toBe(JSON.stringify("new-value"));
    });

    it("should update the hook value when setValue is called", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setValue("new-value");
      });

      await waitFor(() => {
        expect(result.current.value).toBe("new-value");
      });
    });

    it("should remove value from localStorage when setValue is called with undefined", async () => {
      localStorage.setItem("test-key", JSON.stringify("initial-value"));

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(undefined);
      });

      expect(localStorage.getItem("test-key")).toBeNull();
    });

    it("should update the hook value to undefined when setValue is called with undefined", async () => {
      localStorage.setItem("test-key", JSON.stringify("initial-value"));

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.value).toBe("initial-value");
      });

      act(() => {
        result.current.setValue(undefined);
      });

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
      });
    });

    it("should handle setting complex objects", async () => {
      const { result } = renderHook(() =>
        useLocalStorage<{ name: string; age: number }>("test-key")
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const newValue = { name: "Jane", age: 25 };

      act(() => {
        result.current.setValue(newValue);
      });

      await waitFor(() => {
        expect(result.current.value).toEqual(newValue);
      });

      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(newValue));
    });

    it("should dispatch custom local-storage event", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const eventListener = vi.fn();
      window.addEventListener("local-storage", eventListener);

      act(() => {
        result.current.setValue("test-value");
      });

      await waitFor(() => {
        expect(eventListener).toHaveBeenCalled();
      });

      window.removeEventListener("local-storage", eventListener);
    });
  });

  describe("Event Listeners", () => {
    it("should listen to storage events", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        localStorage.setItem("test-key", JSON.stringify("external-value"));
        window.dispatchEvent(new Event("storage"));
      });

      await waitFor(() => {
        expect(result.current.value).toBe("external-value");
      });
    });

    it("should listen to custom local-storage events", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        localStorage.setItem("test-key", JSON.stringify("custom-event-value"));
        window.dispatchEvent(new Event("local-storage"));
      });

      await waitFor(() => {
        expect(result.current.value).toBe("custom-event-value");
      });
    });

    it("should clean up event listeners on unmount", async () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");

      const { unmount } = renderHook(() => useLocalStorage<string>("test-key"));

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "storage",
        expect.any(Function)
      );
      expect(removeEventListenerSpy).toHaveBeenCalledWith(
        "local-storage",
        expect.any(Function)
      );

      removeEventListenerSpy.mockRestore();
    });

    it("should update event listeners when key changes", async () => {
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage<string>(key),
        { initialProps: { key: "key1" } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("value1");
      });

      await waitFor(() => {
        expect(result.current.value).toBe("value1");
      });

      rerender({ key: "key2" });

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
      });

      act(() => {
        localStorage.setItem("key2", JSON.stringify("value2"));
        window.dispatchEvent(new Event("local-storage"));
      });

      await waitFor(() => {
        expect(result.current.value).toBe("value2");
      });
    });
  });

  describe("Custom Synchronous Serializer", () => {
    const reverseSerializer: Serializer<string> = {
      serialize: (value) => value.split("").reverse().join(""),
      deserialize: (value) => value.split("").reverse().join(""),
    };

    it("should use custom serializer for setting value", async () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: reverseSerializer })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setValue("hello");
      });

      expect(localStorage.getItem("test-key")).toBe("olleh");
    });

    it("should use custom serializer for reading value", async () => {
      localStorage.setItem("test-key", "olleh");

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: reverseSerializer })
      );

      await waitFor(() => {
        expect(result.current.value).toBe("hello");
      });
    });
  });

  describe("Custom Asynchronous Serializer", () => {
    const asyncSerializer: Serializer<string> = {
      serialize: (value) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(value.split("").reverse().join("")), 10)
        ),
      deserialize: (value) =>
        new Promise((resolve) =>
          setTimeout(() => resolve(value.split("").reverse().join("")), 10)
        ),
    };

    it("should handle async serialization", async () => {
      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: asyncSerializer })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await act(async () => {
        await result.current.setValue("hello");
      });

      await waitFor(() => {
        expect(localStorage.getItem("test-key")).toBe("olleh");
      });
    });

    it("should handle async deserialization", async () => {
      localStorage.setItem("test-key", "olleh");

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: asyncSerializer })
      );

      await waitFor(() => {
        expect(result.current.value).toBe("hello");
      });
    });
  });

  describe("Multiple Hooks", () => {
    it("should sync multiple hooks with the same key", async () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage<string>("shared-key")
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage<string>("shared-key")
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      act(() => {
        result1.current.setValue("shared-value");
      });

      await waitFor(() => {
        expect(result1.current.value).toBe("shared-value");
        expect(result2.current.value).toBe("shared-value");
      });
    });

    it("should not interfere with hooks using different keys", async () => {
      const { result: result1 } = renderHook(() =>
        useLocalStorage<string>("key1")
      );
      const { result: result2 } = renderHook(() =>
        useLocalStorage<string>("key2")
      );

      await waitFor(() => {
        expect(result1.current.isLoading).toBe(false);
        expect(result2.current.isLoading).toBe(false);
      });

      act(() => {
        result1.current.setValue("value1");
      });

      await waitFor(() => {
        expect(result1.current.value).toBe("value1");
      });

      expect(result2.current.value).toBeUndefined();

      act(() => {
        result2.current.setValue("value2");
      });

      await waitFor(() => {
        expect(result2.current.value).toBe("value2");
      });

      expect(result1.current.value).toBe("value1");
    });
  });

  describe("Error Handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      localStorage.setItem("test-key", "invalid-json{");

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
        expect(result.current.error).toBeInstanceOf(LocalStorageError);
        expect(result.current.error?.message).toContain(
          'Error deserializing localStorage key "test-key"'
        );
      });
    });

    it("should handle serializer errors gracefully", async () => {
      const errorSerializer: Serializer<string> = {
        serialize: () => {
          throw new Error("Serialization failed");
        },
        deserialize: () => {
          throw new Error("Deserialization failed");
        },
      };

      localStorage.setItem("test-key", "some-value");

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: errorSerializer })
      );

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
        expect(result.current.error).toBeInstanceOf(LocalStorageError);
        expect(result.current.error?.message).toContain(
          'Error deserializing localStorage key "test-key"'
        );
      });
    });

    it("should clear error when a valid value is set", async () => {
      localStorage.setItem("test-key", "invalid-json{");

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.error).toBeInstanceOf(LocalStorageError);
      });

      act(() => {
        localStorage.setItem("test-key", JSON.stringify("valid-value"));
        window.dispatchEvent(new Event("local-storage"));
      });

      await waitFor(() => {
        expect(result.current.value).toBe("valid-value");
        expect(result.current.error).toBeUndefined();
      });
    });

    it("should throw LocalStorageError when serializer fails during setValue", async () => {
      const errorSerializer: Serializer<string> = {
        serialize: () => {
          throw new Error("Serialization failed during set");
        },
        deserialize: (value) => value, // Deserialization won't be called in this test path
      };

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: errorSerializer })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await expect(() => result.current.setValue("value-to-serialize")).rejects.toThrow(LocalStorageError)
      await waitFor(() => expect(localStorage.getItem("test-key")).toBeNull());
    });

    it("should throw LocalStorageError when serializer fails during deserialization", async () => {
      const errorSerializer: Serializer<string> = {
        serialize: (value) => value,
        deserialize: () => {
          throw new Error("Deserialization failed during read");
        },
      };

      localStorage.setItem("test-key", "some-value");

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: errorSerializer })
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.value).toBeUndefined();
      expect(result.current.error).toBeInstanceOf(LocalStorageError);
      expect(result.current.error?.message).toContain(
        'Error deserializing localStorage key "test-key"'
      );
      expect(result.current.error?.cause?.message).toBe(
        "Deserialization failed during read"
      );
    });
  });

  describe("setValue Callback Stability", () => {
    it("should maintain setValue reference when key does not change", async () => {
      const { result, rerender } = renderHook(() =>
        useLocalStorage<string>("test-key")
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstSetValue = result.current.setValue;

      rerender();

      expect(result.current.setValue).toBe(firstSetValue);
    });

    it("should update setValue reference when key changes", async () => {
      const { result, rerender } = renderHook(
        ({ key }) => useLocalStorage<string>(key),
        { initialProps: { key: "key1" } }
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      const firstSetValue = result.current.setValue;

      rerender({ key: "key2" });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.setValue).not.toBe(firstSetValue);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty string values", async () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("");
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe("");
        },
        { timeout: 2000 }
      );

      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(""));
    });

    it("should handle zero values", async () => {
      const { result } = renderHook(() => useLocalStorage<number>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(0);
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe(0);
        },
        { timeout: 2000 }
      );

      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(0));
    });

    it("should handle false boolean values", async () => {
      const { result } = renderHook(() => useLocalStorage<boolean>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(false);
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe(false);
        },
        { timeout: 2000 }
      );

      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(false));
    });

    it("should handle rapid successive setValue calls", async () => {
      const { result } = renderHook(() => useLocalStorage<number>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(1);
        result.current.setValue(2);
        result.current.setValue(3);
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe(3);
        },
        { timeout: 2000 }
      );

      expect(localStorage.getItem("test-key")).toBe(JSON.stringify(3));
    });

    it("should handle special characters in keys", async () => {
      const specialKey = "test-key:with@special#characters$";
      const { result } = renderHook(() => useLocalStorage<string>(specialKey));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue("test-value");
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe("test-value");
        },
        { timeout: 2000 }
      );

      expect(localStorage.getItem(specialKey)).toBe(
        JSON.stringify("test-value")
      );
    });

    it("should handle very long strings", async () => {
      const longString = "a".repeat(10000);
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(longString);
      });

      await waitFor(
        () => {
          expect(result.current.value).toBe(longString);
        },
        { timeout: 2000 }
      );
    });

    it("should handle nested objects", async () => {
      const nestedObject = {
        level1: {
          level2: {
            level3: {
              value: "deep",
            },
          },
        },
      };

      const { result } = renderHook(() =>
        useLocalStorage<typeof nestedObject>("test-key")
      );

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      act(() => {
        result.current.setValue(nestedObject);
      });

      await waitFor(
        () => {
          expect(result.current.value).toEqual(nestedObject);
        },
        { timeout: 2000 }
      );
    });
  });
});
