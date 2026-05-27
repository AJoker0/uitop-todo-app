import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const completeTodosMock = vi.fn();
const toggleTodoMock = vi.fn();
const deleteTodoMock = vi.fn();
const createTodoMock = vi.fn();

vi.mock('axios', () => ({
  default: {
    get: vi.fn(async () => ({
      data: [
        { id: 1, name: 'Work' },
        { id: 2, name: 'Study' },
      ],
    })),
  },
}));

vi.mock('./hooks/useTodos', () => ({
  useTodos: vi.fn(() => ({
    todos: [
      { id: 11, text: 'Write report', categoryId: 1, categoryName: 'Work', isCompleted: false },
      { id: 12, text: 'Read chapter', categoryId: 2, categoryName: 'Study', isCompleted: false },
    ],
    loading: false,
    error: null,
    toggleTodo: toggleTodoMock,
    deleteTodo: deleteTodoMock,
    createTodo: createTodoMock,
    completeTodos: completeTodosMock,
  })),
}));

describe('App bulk action', () => {
  beforeEach(() => {
    completeTodosMock.mockClear();
    toggleTodoMock.mockClear();
    deleteTodoMock.mockClear();
    createTodoMock.mockClear();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('allows selecting multiple todos and completing them in bulk', async () => {
    const user = userEvent.setup();

    render(<App />);

    await user.click(await screen.findByLabelText('Select all visible'));
    await user.click(screen.getByRole('button', { name: /mark selected as done/i }));

    expect(completeTodosMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ id: 11, text: 'Write report' }),
        expect.objectContaining({ id: 12, text: 'Read chapter' }),
      ])
    );
  });
});