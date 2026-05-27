import { useForm } from 'react-hook-form';
import axios from 'axios';
import toast from 'react-hot-toast';

interface Props {
  categories: { id: number, name: string }[];
  onSuccess: () => void;
}

export const AddTodoForm = ({ categories, onSuccess }: Props) => {
  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

  const onSubmit = async (data: any) => {
    try {
      await axios.post('http://localhost:3001/todos', {
        text: data.text,
        categoryId: parseInt(data.category)
      });
      toast.success('Task created successfully!');
      reset();
      onSuccess();
    } catch (err: any) {
      // Обработка бизнес-логики: лимит 5 задач
      if (err.response?.status === 400) {
        toast.error(err.response.data.error);
      } else {
        toast.error('Server error');
      }
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex gap-2 mb-6 bg-white p-4 rounded-lg shadow-sm border border-gray-100">
      <div className="flex-1">
        <input 
          {...register('text', { required: 'Task text is required' })}
          placeholder="What needs to be done?"
          className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        {errors.text && <span className="text-red-500 text-xs">{(errors.text.message as string)}</span>}
      </div>
      
      <select 
        {...register('category', { required: true })}
        className="p-2 border rounded outline-none"
      >
        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      
      <button 
        type="submit" 
        disabled={isSubmitting}
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        Add Task
      </button>
    </form>
  );
};