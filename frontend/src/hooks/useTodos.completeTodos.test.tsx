import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useTodos } from './useTodos';

const axiosGet = vi.fn();
const axiosPost = vi.fn();
const axiosPatch = vi.fn();
const axiosDelete = vi.fn();

vi.mock('axios', () => ({
  default: {
    get: (...args: unknown[]) => axiosGet(...args),
    post: (...args: unknown[]) => axiosPost(...args),
    patch: (...args: unknown[]) => axiosPatch(...args),
    delete: (...args: unknown[]) => axiosDelete(...args),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    custom: vi.fn(),
    dismiss: vi.fn(),
    error: vi.fn(),
  },
}));

describe('useTodos bulk complete', () => {
  beforeEach(() => {
    axiosGet.mockResolvedValue({
      data: [
        { id: 1, text: 'Task A', categoryId: 1, categoryName: 'Work', isCompleted: 0 },
        { id: 2, text: 'Task B', categoryId: 1, categoryName: 'Work', isCompleted: 0 },
      ],
    });
    axiosPost.mockReset();
    axiosPatch.mockReset();
    axiosDelete.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('removes bulk-completed todos after the undo window', async () => {
    const { result } = renderHook(() => useTodos('All'));

    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.todos).toHaveLength(2);

    vi.useFakeTimers();

    act(() => {
      result.current.completeTodos(result.current.todos);
    });

    expect(result.current.todos.every(todo => todo.isCompleted && todo.isPendingRemoval)).toBe(true);

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
    });

    expect(result.current.todos).toHaveLength(0);

    expect(axiosDelete).toHaveBeenCalledTimes(2);
  });
});