import { useState, useEffect, useCallback, useRef, createElement } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3001';

export interface Todo {
  id: number;
  text: string;
  categoryId: number;
  categoryName: string;
  isCompleted: boolean;
  isPendingRemoval?: boolean;
}

type CreateTodoInput = {
  text: string;
  categoryId: number;
};

export const useTodos = (selectedCategory: string) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const completionTimers = useRef(new Map<number, number>());
  const deletionTimers = useRef(new Map<number, number>());

  const clearTimer = (timerMap: { current: Map<number, number> }, todoId: number) => {
    const timerId = timerMap.current.get(todoId);
    if (timerId) {
      window.clearTimeout(timerId);
      timerMap.current.delete(todoId);
    }
  };

  const syncTodos = useCallback((items: Todo[]) => {
    const hiddenIds = new Set(deletionTimers.current.keys());
    const completionIds = new Set(completionTimers.current.keys());

    const normalized = items
      .filter(todo => !hiddenIds.has(todo.id))
      .map(todo => completionIds.has(todo.id) ? { ...todo, isPendingRemoval: true, isCompleted: true } : todo);

    setTodos(normalized);
  }, []);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/todos`, { params: { category: selectedCategory } });
      // SQLite возвращает 0/1 для boolean
      syncTodos(res.data.map((t: any) => ({ ...t, isCompleted: !!t.isCompleted })));
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, syncTodos]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const createTodo = useCallback(async ({ text, categoryId }: CreateTodoInput) => {
    const response = await axios.post(`${API_URL}/todos`, { text, categoryId });
    const createdTodo = {
      ...response.data,
      isCompleted: !!response.data.isCompleted,
    };

    setTodos(prev => {
      if (selectedCategory === 'All' || selectedCategory === createdTodo.categoryName) {
        return [createdTodo, ...prev];
      }

      return prev;
    });

    return createdTodo as Todo;
  }, [selectedCategory]);

  const actionWithUndo = useCallback((
    todo: Todo,
    actionName: 'complete' | 'delete',
    optimisticUpdate: () => void,
    revertUpdate: () => void,
    onCommit: () => Promise<void>
  ) => {
    optimisticUpdate();

    let isUndone = false;

    toast.custom((t) =>
      createElement(
        'div',
        { className: 'flex items-center gap-4 rounded-2xl bg-slate-950 px-4 py-3 text-white shadow-lg' },
        createElement('span', null, `Task ${actionName}d.`),
        createElement(
          'button',
          {
            onClick: () => {
              isUndone = true;
              toast.dismiss(t.id);
              revertUpdate();
            },
            className: 'rounded-full bg-white px-3 py-1 text-sm font-medium text-slate-950 hover:bg-slate-100',
          },
          'Undo'
        )
      ),
    { duration: 5000, id: `undo-${todo.id}` });

    const timerId = window.setTimeout(async () => {
      if (isUndone) {
        return;
      }

      try {
        await onCommit();
      } catch {
        revertUpdate();
        toast.error(`Failed to ${actionName} task`);
      }
    }, 5000);

    return timerId;
  }, []);

  const toggleTodo = (todo: Todo) => {
    if (todo.isPendingRemoval) {
      return;
    }

    clearTimer(completionTimers, todo.id);

    const snapshot = todo;
    void axios.patch(`${API_URL}/todos/${todo.id}`, { isCompleted: true });

    const timerId = actionWithUndo(
      todo,
      'complete',
      () => {
        setTodos(prev => prev.map(item => item.id === todo.id ? { ...item, isCompleted: true, isPendingRemoval: true } : item));
      },
      () => {
        clearTimer(completionTimers, todo.id);
        void axios.patch(`${API_URL}/todos/${todo.id}`, { isCompleted: false });
        setTodos(prev => prev.map(item => item.id === todo.id ? { ...snapshot, isCompleted: false, isPendingRemoval: false } : item));
      },
      async () => {
        clearTimer(completionTimers, todo.id);
        await axios.delete(`${API_URL}/todos/${todo.id}`);
        setTodos(prev => prev.filter(item => item.id !== todo.id));
      }
    );

    completionTimers.current.set(todo.id, timerId);
  };

  const deleteTodo = (todo: Todo) => {
    clearTimer(deletionTimers, todo.id);

    const snapshot = todo;
    const timerId = actionWithUndo(
      todo,
      'delete',
      () => {
        setTodos(prev => prev.filter(item => item.id !== todo.id));
      },
      () => {
        clearTimer(deletionTimers, todo.id);
        setTodos(prev => {
          if (prev.some(item => item.id === todo.id)) {
            return prev;
          }

          return [snapshot, ...prev];
        });
      },
      async () => {
        clearTimer(deletionTimers, todo.id);
        await axios.delete(`${API_URL}/todos/${todo.id}`);
      }
    );

    deletionTimers.current.set(todo.id, timerId);
  };

  return { todos, loading, error, toggleTodo, deleteTodo, fetchTodos, createTodo };
};