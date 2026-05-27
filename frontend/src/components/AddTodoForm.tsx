import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

interface Category {
  id: number;
  name: string;
}

interface Props {
  categories: Category[];
  loading?: boolean;
  onCreate: (data: { text: string; categoryId: number }) => Promise<void>;
}

type FormValues = {
  text: string;
  category: string;
};

export const AddTodoForm = ({ categories, loading, onCreate }: Props) => {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    defaultValues: {
      text: '',
      category: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    clearErrors('root');

    try {
      await onCreate({
        text: data.text.trim(),
        categoryId: Number(data.category),
      });
      toast.success('Task created successfully!');
      reset({ text: '', category: categories[0]?.id ? String(categories[0].id) : '' });
    } catch (err: any) {
      const message = err?.response?.data?.error ?? 'Server error';
      setError('root', { type: 'server', message });
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid gap-3 rounded-3xl border border-slate-200/70 bg-white/90 p-4 shadow-[0_18px_45px_rgba(15,23,42,0.08)] backdrop-blur md:grid-cols-[1fr_220px_auto] md:items-end">
      <div className="flex-1">
        <input 
          {...register('text', {
            required: 'Task text is required',
            minLength: { value: 2, message: 'Task text is too short' },
          })}
          placeholder="What needs to be done?"
          className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
        />
        {errors.text && <span className="mt-1 block text-xs text-rose-600">{errors.text.message}</span>}
      </div>
      
      <select 
        {...register('category', { required: 'Category is required' })}
        className="rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white focus:ring-4 focus:ring-cyan-500/15"
        disabled={loading || categories.length === 0}
      >
        <option value="">{loading ? 'Loading categories...' : 'Select category'}</option>
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      {errors.category && <span className="-mt-1 text-xs text-rose-600 md:col-start-2">Category is required</span>}
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Add Task
      </button>
      {errors.root?.message && <p className="text-sm text-rose-600 md:col-span-3">{errors.root.message}</p>}
    </form>
  );
};