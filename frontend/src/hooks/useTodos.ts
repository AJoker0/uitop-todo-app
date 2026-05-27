import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = 'http://localhost:3001';

export interface Todo {
  id: number;
  text: string;
  categoryId: number;
  categoryName: string;
  isCompleted: boolean;
}

export const useTodos = (selectedCategory: string) => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/todos`, { params: { category: selectedCategory } });
      // SQLite возвращает 0/1 для boolean
      setTodos(res.data.map((t: any) => ({ ...t, isCompleted: !!t.isCompleted })));
      setError(null);
    } catch (err) {
      setError('Failed to fetch tasks.');
    } finally {
      setLoading(false);
    }
  }, [selectedCategory]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const actionWithUndo = (
    todoId: number, 
    actionName: 'complete' | 'delete', 
    optimisticUpdate: () => void, 
    revertUpdate: () => void, 
    apiCall: () => Promise<void>
  ) => {
    // 1. Оптимистичный UI (сразу меняем стейт)
    optimisticUpdate();

    let isUndone = false;

    // 2. Показываем Toast с кнопкой Undo
    toast((t) => (
      <div className="flex items-center gap-4">
        <span>Task {actionName}d.</span>
        <button
          onClick={() => {
            isUndone = true;
            toast.dismiss(t.id);
            revertUpdate(); // Откат в UI
          }}
          className="bg-gray-800 text-white px-3 py-1 rounded text-sm hover:bg-gray-700"
        >
          Undo
        </button>
      </div>
    ), { duration: 5000, id: `undo-${todoId}` });

    // 3. Через 5 секунд выполняем реальный API запрос, если не отменили
    setTimeout(async () => {
      if (!isUndone) {
        try {
          await apiCall();
        } catch (err) {
          revertUpdate();
          toast.error(`Failed to ${actionName} task`);
        }
      }
    }, 5000);
  };

  const toggleTodo = (todo: Todo) => {
    actionWithUndo(
      todo.id,
      'complete',
      () => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, isCompleted: true } : t)),
      () => setTodos(prev => prev.map(t => t.id === todo.id ? { ...t, isCompleted: false } : t)),
      () => axios.patch(`${API_URL}/todos/${todo.id}`, { isCompleted: true })
    );
  };

  const deleteTodo = (todo: Todo) => {
    // Сохраняем элемент для возможности восстановления
    const currentTodos = [...todos]; 
    actionWithUndo(
      todo.id,
      'delete',
      () => setTodos(prev => prev.filter(t => t.id !== todo.id)),
      () => setTodos(currentTodos),
      () => axios.delete(`${API_URL}/todos/${todo.id}`)
    );
  };

  return { todos, loading, error, toggleTodo, deleteTodo, fetchTodos };
};