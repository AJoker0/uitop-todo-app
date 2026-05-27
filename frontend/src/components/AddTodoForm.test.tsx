import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { AddTodoForm } from './AddTodoForm';

describe('AddTodoForm', () => {
  it('submits trimmed values to the parent handler', async () => {
    const user = userEvent.setup();
    const onCreate = vi.fn().mockResolvedValue(undefined);

    render(
      <AddTodoForm
        categories={[
          { id: 1, name: 'Work' },
          { id: 2, name: 'Study' },
        ]}
        onCreate={onCreate}
      />
    );

    await user.type(screen.getByPlaceholderText('What needs to be done?'), '  Finish homework  ');
    await user.selectOptions(screen.getByRole('combobox'), '2');
    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(onCreate).toHaveBeenCalledWith({
      text: 'Finish homework',
      categoryId: 2,
    });
  });

  it('shows validation errors for empty submit', async () => {
    const user = userEvent.setup();

    render(
      <AddTodoForm
        categories={[{ id: 1, name: 'Work' }]}
        onCreate={vi.fn()}
      />
    );

    await user.click(screen.getByRole('button', { name: /add task/i }));

    expect(await screen.findByText('Task text is required')).toBeInTheDocument();
    expect(screen.getByText('Category is required')).toBeInTheDocument();
  });
});