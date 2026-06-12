# Projectly — Team Task Manager

A full-stack project and task management web app with role-based access control. Teams can create projects, assign tasks, and track progress — think of it as a simplified Trello/Asana built from scratch.

---

## Live Demo

- **Frontend:** https://your-frontend.railway.app
- **Backend API:** https://your-backend.railway.app

> Replace these URLs after Railway deployment.

---

## Tech Stack

| Layer    | Technology                              | Why                                              |
| -------- | --------------------------------------- | ------------------------------------------------ |
| Frontend | React 19 + Vite + TypeScript            | Fast dev server, type safety, modern SPA setup   |
| Routing  | TanStack Router                         | File-based routing with full type safety         |
| Styling  | Tailwind CSS v4 + shadcn/ui + Radix UI  | Utility-first styling with accessible components |
| State    | Zustand (persist)                       | Lightweight auth state with localStorage sync    |
| HTTP     | Axios                                   | Interceptors for auth token + auto logout on 401 |
| Backend  | Node.js + Express                       | Minimal REST API setup                           |
| Database | PostgreSQL                              | Relational data with proper FK constraints       |
| Auth     | JWT + bcryptjs                          | Stateless auth, 7-day token expiry               |
| Deploy   | Railway                                 | Single platform for backend + PostgreSQL         |

---

## Features

### Authentication
- Signup with Name, Email, Password, Role (Admin / Member)
- Secure login with JWT — token persisted across sessions
- Auto logout on token expiry (401 interceptor)

### Project Management
- Admin can create projects with name, description, deadline
- Admin can add / remove members from a project
- Members can only view projects they belong to

### Task Management
- Create tasks with Title, Description, Priority (Low / Medium / High), Due Date
- Assign tasks to project members (Admin assigns anyone; Member assigns only to themselves)
- Update task status: **To Do → In Progress → Done**
- Kanban-style column view per project
- Members can only update status of their own tasks
- Admin can edit all fields and delete tasks

### Dashboard
- Summary cards: Total, Todo, In Progress, Done, Overdue
- Overdue task list with priority and status badges
- **Tasks per member table** (Admin only) — see workload distribution at a glance
- Admin sees all tasks; Member sees only their own

### Role-Based Access

| Action                  | Admin | Member        |
| ----------------------- | ----- | ------------- |
| Create project          | ✅    | ❌            |
| Add / remove members    | ✅    | ❌            |
| Create task             | ✅    | ✅ (own only) |
| Assign task to anyone   | ✅    | ❌            |
| Edit task details       | ✅    | ❌            |
| Update task status      | ✅    | ✅ (own only) |
| Delete task / project   | ✅    | ❌            |
| Dashboard (all tasks)   | ✅    | ❌            |
| Dashboard (own tasks)   | ✅    | ✅            |

---

## Project Structure

```
projectly/
│
├── pp/                              # React frontend (Vite + TypeScript)
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.tsx           # Top nav with role-aware links
│   │   │   ├── ProtectedRoute.tsx   # Redirects unauthenticated users
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   └── ui-bits.tsx          # Shared reusable UI: badges, shells, fields
│   │   ├── lib/
│   │   │   ├── api.ts               # Axios instance with auth interceptors
│   │   │   ├── auth-store.ts        # Zustand store — user + token
│   │   │   └── types.ts             # Shared TypeScript interfaces
│   │   ├── routes/
│   │   │   ├── login.tsx            # Login page
│   │   │   ├── signup.tsx           # Signup page
│   │   │   ├── dashboard.tsx        # Stats + overdue + per-user table
│   │   │   ├── projects.index.tsx   # Projects list + create form
│   │   │   ├── projects.$id.tsx     # Project detail — members + kanban tasks
│   │   │   └── tasks.tsx            # My tasks page (member view)
│   │   └── styles.css               # Tailwind base styles
│   ├── .env.example
│   └── package.json
│
├── pp-backend/                      # Node.js + Express backend
│   ├── middleware/
│   │   └── auth.js                  # verifyToken + requireAdmin middleware
│   ├── routes/
│   │   ├── auth.js                  # POST /signup, POST /login
│   │   ├── projects.js              # Project CRUD + member management
│   │   ├── tasks.js                 # Task CRUD with RBAC
│   │   ├── dashboard.js             # Stats + overdue + per-user data
│   │   └── users.js                 # GET /users (Admin only)
│   ├── db.js                        # PostgreSQL pool (pg)
│   ├── setup-db.js                  # Creates all tables — run once
│   ├── index.js                     # Express app entry point
│   ├── Procfile                     # Railway start command
│   ├── .env.example
│   └── package.json
│
└── README.md
```

---

## Database Schema

```
users
  id, name, email, password_hash, role (admin|member), created_at

projects
  id, name, description, deadline, created_by → users.id, created_at

project_members
  project_id → projects.id (CASCADE), user_id → users.id (CASCADE)
  PRIMARY KEY (project_id, user_id)

tasks
  id, title, description, status (todo|in_progress|done),
  priority (low|medium|high), due_date,
  project_id → projects.id (CASCADE),
  assigned_to → users.id (SET NULL), created_at
```

---

## API Endpoints

### Auth
| Method | Endpoint         | Auth | Description          |
| ------ | ---------------- | ---- | -------------------- |
| POST   | /api/auth/signup | ❌   | Register new user    |
| POST   | /api/auth/login  | ❌   | Login, returns JWT   |

### Projects
| Method | Endpoint                          | Auth | Role  | Description            |
| ------ | --------------------------------- | ---- | ----- | ---------------------- |
| GET    | /api/projects                     | ✅   | Any   | List joined projects   |
| POST   | /api/projects                     | ✅   | Admin | Create project         |
| DELETE | /api/projects/:id                 | ✅   | Admin | Delete project         |
| GET    | /api/projects/:id/members         | ✅   | Any   | List project members   |
| POST   | /api/projects/:id/members         | ✅   | Admin | Add member             |
| DELETE | /api/projects/:id/members/:userId | ✅   | Admin | Remove member          |
| GET    | /api/projects/:id/tasks           | ✅   | Any   | List tasks for project |

### Tasks
| Method | Endpoint        | Auth | Role   | Description                          |
| ------ | --------------- | ---- | ------ | ------------------------------------ |
| GET    | /api/tasks/mine | ✅   | Any    | Tasks assigned to logged-in user     |
| POST   | /api/tasks      | ✅   | Any*   | Create task (*must be project member)|
| PATCH  | /api/tasks/:id  | ✅   | Any**  | Update task (**own tasks for member) |
| DELETE | /api/tasks/:id  | ✅   | Admin  | Delete task                          |

### Dashboard & Users
| Method | Endpoint       | Auth | Role  | Description               |
| ------ | -------------- | ---- | ----- | ------------------------- |
| GET    | /api/dashboard | ✅   | Any   | Stats + overdue + per-user|
| GET    | /api/users     | ✅   | Admin | List all users            |

---

## How to Run Locally

> Requires Node.js 18+ and PostgreSQL installed.

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO.git
cd YOUR_REPO
```

### 2. Setup the backend

```bash
cd pp-backend
npm install

# Copy env file and fill in your Postgres password
cp .env.example .env

# Create all database tables (run once)
npm run setup-db

# Start the backend
npm run dev
```

Backend runs at **http://localhost:5000**

### 3. Setup the frontend (new terminal)

```bash
cd pp
npm install

# Copy env file
cp .env.example .env
# VITE_API_URL is already set to http://localhost:5000 in .env.example

npm run dev
```

Frontend runs at **http://localhost:8080**

---

## Environment Variables

### Backend — `pp-backend/.env`

```env
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/projectly
JWT_SECRET=your_random_secret_key_here
PORT=5000
NODE_ENV=development
FRONTEND_URL=http://localhost:8080
```

### Frontend — `pp/.env`

```env
VITE_API_URL=http://localhost:5000
```

---

## Deployment on Railway

### Backend

1. Push code to GitHub
2. Go to [railway.app](https://railway.app) → New Project → Deploy from GitHub
3. Select the repo → set **Root Directory** to `pp-backend`
4. Add a **PostgreSQL** plugin from Railway dashboard
5. Set environment variables:
   - `DATABASE_URL` → auto-provided by Railway PostgreSQL plugin
   - `JWT_SECRET` → any long random string
   - `NODE_ENV` → `production`
   - `FRONTEND_URL` → your deployed frontend URL (set after frontend deploy)
6. Open Railway terminal and run: `node setup-db.js`
7. Copy your backend URL (e.g. `https://projectly-backend.railway.app`)

### Frontend

1. Add a new service in the same Railway project → Deploy from GitHub
2. Set **Root Directory** to `pp`
3. Set environment variable:
   - `VITE_API_URL` → your backend Railway URL from above
4. Deploy — copy the frontend URL
5. Go back to backend service → update `FRONTEND_URL` to the frontend URL → redeploy

---

## What Works

- ✅ Signup / Login with JWT authentication
- ✅ Role-based access — Admin vs Member with granular permissions
- ✅ Project creation, listing, deletion
- ✅ Team management — add / remove members per project
- ✅ Task creation with title, description, priority, due date, assignee
- ✅ Kanban-style task board (Todo / In Progress / Done columns)
- ✅ Task status updates with permission enforcement
- ✅ Dashboard — stats, overdue tasks, tasks per member (Admin)
- ✅ Auto logout on token expiry
- ✅ Protected routes on frontend
- ✅ Loading skeletons and empty states
- ✅ Fully deployed on Railway

---

## Next Steps

With more time, I would add:

- **Email notifications** — alert members when a task is assigned to them
- **Task comments** — threaded discussion per task
- **File attachments** — upload files to tasks (S3 / Cloudflare R2)
- **Activity log** — audit trail of who changed what and when
- **Search & filters** — filter tasks by priority, assignee, date range
- **Tests** — Jest + Supertest for API endpoints, Vitest for frontend components
