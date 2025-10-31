import { renderHook, act, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useLocalStorage, Serializer } from "./useLocalStorage";

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
    it("should start with isLoading true", () => {
      const { result } = renderHook(() => useLocalStorage<string>("test-key"));
      const { isLoading } = result.current;
      expect(isLoading).toBe(true);
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
  });

  describe("setValue", () => {
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

  describe("Error Handling", () => {
    it("should handle JSON parse errors gracefully", async () => {
      localStorage.setItem("test-key", "invalid-json{");
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      const { result } = renderHook(() => useLocalStorage<string>("test-key"));

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
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

      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      localStorage.setItem("test-key", "some-value");

      const { result } = renderHook(() =>
        useLocalStorage<string>("test-key", { serializer: errorSerializer })
      );

      await waitFor(() => {
        expect(result.current.value).toBeUndefined();
      });

      await act(async () => {
        await result.current.setValue("new-value");
      });

      expect(consoleErrorSpy).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
