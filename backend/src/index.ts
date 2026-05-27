import express from 'express';
import cors from 'cors';
import { initDB } from './db';

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;

initDB().then(db => {
  const asyncHandler = (handler: (req: any, res: any) => Promise<unknown>) => async (req: any, res: any) => {
    try {
      await handler(req, res);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };

  // Получить категории
  app.get('/categories', asyncHandler(async (_req, res) => {
    const categories = await db.all('SELECT * FROM categories');
    res.json(categories);
  }));

  // Получить задачи (с фильтрацией)
  app.get('/todos', asyncHandler(async (req, res) => {
    const { category } = req.query;
    let query = `
      SELECT t.*, c.name as categoryName 
      FROM todos t 
      JOIN categories c ON t.categoryId = c.id
    `;
    const params: any[] = [];

    if (category && category !== 'All') {
      query += ' WHERE c.name = ?';
      params.push(category);
    }
    
    query += ' ORDER BY t.id DESC';
    const todos = await db.all(query, params);
    res.json(todos);
  }));

  // Создать задачу (Проверка лимита 5 задач)
  app.post('/todos', asyncHandler(async (req, res) => {
    const { text, categoryId } = req.body;

    if (!text || typeof text !== 'string' || !String(categoryId)) {
      return res.status(400).json({ error: 'Text and category are required.' });
    }

    const category = await db.get('SELECT * FROM categories WHERE id = ?', [categoryId]);
    if (!category) {
      return res.status(400).json({ error: 'Selected category does not exist.' });
    }

    // Бизнес-логика: не более 5 задач в категории
    const { count } = await db.get('SELECT COUNT(*) as count FROM todos WHERE categoryId = ?', [categoryId]);
    if (count >= 5) {
      return res.status(400).json({ error: 'Maximum 5 tasks allowed per category.' });
    }

    const result = await db.run('INSERT INTO todos (text, categoryId) VALUES (?, ?)', [text, categoryId]);
    const newTodo = await db.get('SELECT t.*, c.name as categoryName FROM todos t JOIN categories c ON t.categoryId = c.id WHERE t.id = ?', [result.lastID]);
    res.status(201).json(newTodo);
  }));

  // Обновить статус
  app.patch('/todos/:id', asyncHandler(async (req, res) => {
    const { isCompleted } = req.body;
    await db.run('UPDATE todos SET isCompleted = ? WHERE id = ?', [isCompleted ? 1 : 0, req.params.id]);
    res.json({ success: true });
  }));

  // Удалить задачу
  app.delete('/todos/:id', asyncHandler(async (req, res) => {
    await db.run('DELETE FROM todos WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  }));

  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}).catch(error => {
  console.error('Failed to initialize database', error);
  process.exit(1);
});