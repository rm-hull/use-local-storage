import { renderHook, act, waitFor } from '@testing-library/react';
import { useLocalStorage } from './useLocalStorage';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

describe('useLocalStorage with serializer', () => {
  const KEY = 'test-key';

  const reverseSerializer = {
    serialize: async (value: string) => {
      await delay(10);
      return value.split('').reverse().join('');
    },
    deserialize: async (value: string) => {
      await delay(10);
      return value.split('').reverse().join('');
    },
  };

  beforeEach(() => {
    window.localStorage.clear();
  });

  it('should serialize the value when setting', async () => {
    const { result } = renderHook(() =>
      useLocalStorage(KEY, { serializer: reverseSerializer })
    );

    act(() => {
      result.current.setValue('hello');
    });

    await waitFor(() => {
      expect(window.localStorage.getItem(KEY)).toBe('olleh');
    });
  });

  it('should deserialize the value when getting', async () => {
    window.localStorage.setItem(KEY, 'olleh');

    const { result } = renderHook(() =>
      useLocalStorage(KEY, { serializer: reverseSerializer })
    );

    await waitFor(() => {
      expect(result.current.value).toBe('hello');
    });
  });
});
