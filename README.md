# UITOP Todo App

Небольшое full-stack приложение для задач с категориями. Бэкенд хранит данные в SQLite, фронтенд умеет фильтровать задачи, отмечать их выполненными, удалять и откатывать действия через Undo.

## Что умеет

- Создавать задачу с текстом и категорией.
- Показывать список задач с категорией и статусом.
- Отмечать задачу выполненной.
- Удалять задачу.
- Фильтровать задачи по категории или показывать все.
- Не давать создавать больше 5 задач в одной категории.
- Показывать snackbar с Undo на 5 секунд при завершении и удалении.
- Показывать состояния загрузки, ошибки и пустого списка.

## Стек

- Frontend: React, TypeScript, Vite, React Hook Form, Axios, React Hot Toast, TailwindCSS.
- Backend: Node.js, Express, TypeScript, SQLite.

## Как запустить

### Вариант 1. Одной командой

```powershell
cd D:\uitop-todo-app
npm install
npm run dev
```

После запуска:
- backend: `http://localhost:3001`
- frontend: `http://localhost:5173`

### Вариант 2. Через Docker

```powershell
cd D:\uitop-todo-app
docker compose up --build
```

### Вариант 3. По отдельности

Backend:

```powershell
cd D:\uitop-todo-app\backend
npm install
npm run dev
```

Frontend:

```powershell
cd D:\uitop-todo-app\frontend
npm install
npm run dev
```

## Сборка

```powershell
cd D:\uitop-todo-app
npm run build
```

## Деплой

### Backend на Render

1. Создай новый Web Service из GitHub-репозитория.
2. Root directory: корень репозитория.
3. Build command:

```powershell
npm install && npm run build
```

4. Start command:

```powershell
npm --prefix backend run start
```

5. Environment:

```text
NODE_ENV=production
PORT=10000
```

`npm install` в корне теперь подтягивает зависимости для `backend` и `frontend` через npm workspaces, поэтому Render больше не падает на отсутствии `@types/node`.

### Frontend на Vercel

1. Создай новый Project из того же репозитория.
2. Root directory: `frontend`
3. Build command: `npm run build`
4. Output directory: `dist`
5. Добавь environment variable:

```text
VITE_API_URL=https://your-backend.onrender.com
```

После этого перезагрузи деплой фронта.

## API

- `GET /categories` - получить список категорий
- `GET /todos?category=Work` - получить задачи с фильтром по категории
- `POST /todos` - создать задачу
- `PATCH /todos/:id` - обновить статус задачи
- `DELETE /todos/:id` - удалить задачу

## Полезные заметки

- База данных лежит локально в SQLite-файле на бэкенде.
- Если backend не запущен, фронт честно покажет ошибку загрузки данных.
- Для сдачи проекта не хватает только публичного деплоя и, если хочется, тестов.