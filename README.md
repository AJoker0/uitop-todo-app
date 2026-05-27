# UITOP Todo App

Small full-stack todo app with categories, SQLite persistence, filtering, and undo actions.

## Features

- Create todos with text and category.
- Filter todos by category or show all.
- Mark todos as completed.
- Delete todos.
- Undo both completion and delete actions for 5 seconds.
- Enforced limit of 5 todos per category.
- Loading, error, and empty states in the UI.

## Tech Stack

- Frontend: React, TypeScript, Vite, React Hook Form, Axios, React Hot Toast, TailwindCSS.
- Backend: Node.js, Express, TypeScript, SQLite.

## Run Locally

### 1. Install dependencies

```powershell
cd D:\uitop-todo-app
npm install
```

### 2. Start both apps together

```powershell
cd D:\uitop-todo-app
npm run dev
```

This starts the backend on `http://localhost:3001` and the frontend on `http://localhost:5173`.

### 3. Build both apps

```powershell
cd D:\uitop-todo-app
npm run build
```

If you want to run them separately, you can still use the package-level commands in `backend/` and `frontend/`.

## Docker

```powershell
cd D:\uitop-todo-app
docker compose up --build
```

This starts the backend on `http://localhost:3001` and the frontend on `http://localhost:5173`.

## API

- `GET /categories`
- `GET /todos?category=Work`
- `POST /todos`
- `PATCH /todos/:id`
- `DELETE /todos/:id`

## Notes

- The backend stores data in a local SQLite database file.
- The frontend expects the backend at `http://localhost:3001`.