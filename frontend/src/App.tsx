import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { CheckCircle2, Circle, Filter, Loader2, Plus, Trash2, Inbox } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import { AddTodoForm } from './components/AddTodoForm';
import { useTodos } from './hooks/useTodos';

type Category = {
  id: number;
  name: string;
};

const API_URL = 'http://localhost:3001';

function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [categoriesLoading, setCategoriesLoading] = useState(true);
  const [categoriesError, setCategoriesError] = useState<string | null>(null);
  const [selectedTodoIds, setSelectedTodoIds] = useState<number[]>([]);

  const { todos, loading, error, toggleTodo, deleteTodo, createTodo, completeTodos } = useTodos(selectedCategory);

  useEffect(() => {
    const loadCategories = async () => {
      try {
        setCategoriesLoading(true);
        const response = await axios.get<Category[]>(`${API_URL}/categories`);
        setCategories(response.data);
        setCategoriesError(null);
      } catch {
        setCategoriesError('Failed to fetch categories.');
      } finally {
        setCategoriesLoading(false);
      }
    };

    void loadCategories();
  }, []);

  const filteredTodos = useMemo(() => todos, [todos]);
  const selectableTodos = useMemo(() => filteredTodos.filter(todo => !todo.isCompleted && !todo.isPendingRemoval), [filteredTodos]);
  const selectedTodos = useMemo(
    () => filteredTodos.filter(todo => selectedTodoIds.includes(todo.id)),
    [filteredTodos, selectedTodoIds],
  );
  const allSelectableSelected = selectableTodos.length > 0 && selectableTodos.every(todo => selectedTodoIds.includes(todo.id));
  const completedCount = filteredTodos.filter(todo => todo.isCompleted).length;
  const activeCount = filteredTodos.length - completedCount;

  const handleCreate = async (data: { text: string; categoryId: number }) => {
    const createdTodo = await createTodo(data);
    toast.success(`Added to ${createdTodo.categoryName}`);
  };

  const toggleSelection = (todoId: number) => {
    setSelectedTodoIds(prev => prev.includes(todoId)
      ? prev.filter(id => id !== todoId)
      : [...prev, todoId]);
  };

  // This only affects the currently visible list, not hidden categories.
  const toggleSelectAllVisible = () => {
    setSelectedTodoIds(prev => {
      if (allSelectableSelected) {
        return prev.filter(id => !selectableTodos.some(todo => todo.id === id));
      }

      const nextIds = new Set(prev);
      selectableTodos.forEach(todo => nextIds.add(todo.id));
      return Array.from(nextIds);
    });
  };

  const handleBulkComplete = () => {
    if (selectedTodos.length === 0) {
      return;
    }

    completeTodos(selectedTodos);
    setSelectedTodoIds([]);
  };

  useEffect(() => {
    setSelectedTodoIds([]);
  }, [selectedCategory]);

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(56,189,248,0.18),transparent_42%),linear-gradient(180deg,#f8fafc_0%,#eef2ff_100%)] text-slate-900">
      <Toaster position="top-center" toastOptions={{ duration: 5000 }} />
      <main className="mx-auto flex min-h-screen w-full max-w-6xl flex-col gap-6 px-4 py-8 lg:px-6">
        <section className="overflow-hidden rounded-4xl border border-white/70 bg-slate-950 px-6 py-8 text-white shadow-[0_30px_80px_rgba(15,23,42,0.25)] md:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-4">
              <span className="inline-flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.28em] text-cyan-200">
                <Plus className="h-3.5 w-3.5" /> UITOP Todo App
              </span>
              <div className="space-y-3">
                <h1 className="text-4xl font-black tracking-tight md:text-6xl">Tasks, categories, undo, done right.</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-300 md:text-base">
                  Create todos, filter by category, mark them complete with a 5 second undo window,
                  and keep everything persisted in SQLite through a small Express API.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-white/5 p-4 text-center backdrop-blur">
              <Stat label="Todos" value={filteredTodos.length} />
              <Stat label="Active" value={activeCount} />
              <Stat label="Done" value={completedCount} />
            </div>
          </div>
        </section>

        <section className="grid gap-5 lg:grid-cols-[1.25fr_0.75fr]">
          <div className="space-y-5">
            <AddTodoForm
              categories={categories}
              loading={categoriesLoading}
              onCreate={handleCreate}
            />

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">Todos</h2>
                  <p className="text-sm text-slate-500">Checkbox = complete with Undo. Trash = delete with Undo.</p>
                </div>

                <label className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
                  <Filter className="h-4 w-4" />
                  <select
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory(event.target.value)}
                    className="bg-transparent outline-none"
                  >
                    <option value="All">All</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.name}>{category.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              {categoriesError && <Alert message={categoriesError} />}
              {error && <Alert message={error} />}

              {loading ? (
                <LoadingState />
              ) : filteredTodos.length === 0 ? (
                <EmptyState />
              ) : (
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                    <label className="inline-flex items-center gap-2 text-sm font-medium text-slate-700">
                      <input
                        type="checkbox"
                        checked={allSelectableSelected}
                        onChange={toggleSelectAllVisible}
                        disabled={selectableTodos.length === 0}
                        className="h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                      />
                      Select all visible
                    </label>

                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        Selected: {selectedTodos.length}
                      </span>
                      <button
                        type="button"
                        onClick={handleBulkComplete}
                        disabled={selectedTodos.length === 0}
                        className="rounded-2xl bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Mark selected as done
                      </button>
                    </div>
                  </div>

                  {filteredTodos.map(todo => (
                    <article
                      key={todo.id}
                      className={`flex flex-col gap-3 rounded-2xl border px-4 py-4 transition sm:flex-row sm:items-center sm:justify-between ${todo.isCompleted ? 'border-emerald-200 bg-emerald-50/70' : 'border-slate-200 bg-white'} ${todo.isPendingRemoval ? 'ring-2 ring-amber-300/60' : ''}`}
                    >
                      <div className="flex flex-1 items-start gap-3">
                        <input
                          type="checkbox"
                          checked={selectedTodoIds.includes(todo.id)}
                          onChange={() => toggleSelection(todo.id)}
                          disabled={todo.isCompleted || todo.isPendingRemoval}
                          aria-label={`Select ${todo.text}`}
                          className="mt-1 h-5 w-5 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500 disabled:cursor-not-allowed"
                        />
                        <div className="flex flex-1 items-start gap-3">
                          <input
                            type="checkbox"
                            checked={todo.isCompleted}
                            onChange={() => toggleTodo(todo)}
                            disabled={todo.isPendingRemoval}
                            aria-label={`Mark ${todo.text} as completed`}
                            className="mt-1 h-5 w-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 disabled:cursor-not-allowed"
                          />
                        <div className="space-y-1">
                          <div className={`text-sm font-medium sm:text-base ${todo.isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>
                            {todo.text}
                          </div>
                          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 font-medium text-slate-600">{todo.categoryName}</span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 font-medium ${todo.isCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                              {todo.isCompleted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Circle className="h-3.5 w-3.5" />}
                              {todo.isCompleted ? 'Done' : 'Not done'}
                            </span>
                            {todo.isPendingRemoval && <span className="rounded-full bg-amber-100 px-2.5 py-1 font-medium text-amber-700">Undo available</span>}
                          </div>
                        </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => deleteTodo(todo)}
                        className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100"
                      >
                        <Trash2 className="h-4 w-4" /> Delete
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-950">What this app covers</h3>
              <ul className="mt-4 space-y-3 text-sm text-slate-600">
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> React Hook Form + Axios create flow.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> Category filter with an All option.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> Undo snackbar for both delete and complete actions.</li>
                <li className="flex gap-3"><span className="mt-1 h-2 w-2 rounded-full bg-cyan-500" /> Backend 5-task limit per category.</li>
              </ul>
            </div>

            <div className="rounded-3xl border border-slate-200/70 bg-white/90 p-5 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur">
              <h3 className="text-lg font-semibold text-slate-950">Про бэк</h3>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Тут живет Express API и хранит все в SQLite, как аккуратный завхоз с ключами от склада.
                Если бэк спит на порту 3001, фронт не делает вид, что всё нормально, а честно показывает ошибку,
                чтобы никто не играл в «у меня и так работает».
              </p>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="text-2xl font-black tracking-tight text-white">{value}</div>
      <div className="text-xs uppercase tracking-[0.24em] text-slate-400">{label}</div>
    </div>
  );
}

function Alert({ message }: { message: string }) {
  return (
    <div className="mb-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
      {message}
    </div>
  );
}

function LoadingState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-slate-600">
      <Loader2 className="h-6 w-6 animate-spin text-cyan-600" />
      <p className="text-sm font-medium">Loading tasks...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-slate-50 text-center text-slate-600">
      <Inbox className="h-8 w-8 text-slate-400" />
      <div>
        <p className="text-sm font-semibold text-slate-700">No tasks</p>
        <p className="text-sm text-slate-500">Create a task or change the filter.</p>
      </div>
    </div>
  );
}

export default App;
