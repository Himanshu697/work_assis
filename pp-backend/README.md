# Projectly Backend API

REST API for Projectly — a project management app with role-based access control.

## Tech Stack
- Node.js + Express
- PostgreSQL
- JWT Authentication
- bcryptjs for password hashing

## Local Setup

### 1. Install PostgreSQL
Download from https://www.postgresql.org/download/windows/
During install, set password for `postgres` user (remember this!)

### 2. Create Database
Open pgAdmin or psql and run:
```sql
CREATE DATABASE projectly;
```

### 3. Setup Backend
```bash
cd pp-backend
npm install

# Copy .env.example to .env
copy .env.example .env
# Edit .env with your postgres password

# Create tables
npm run setup-db

# Start server
npm run dev
```

Server runs at http://localhost:5000

## API Endpoints

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/auth/signup | Register new user |
| POST | /api/auth/login | Login, returns JWT |

### Projects
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | /api/projects | ✅ | Any |
| POST | /api/projects | ✅ | Admin |
| DELETE | /api/projects/:id | ✅ | Admin |
| GET | /api/projects/:id/members | ✅ | Any |
| POST | /api/projects/:id/members | ✅ | Admin |
| DELETE | /api/projects/:id/members/:userId | ✅ | Admin |
| GET | /api/projects/:id/tasks | ✅ | Any |

### Tasks
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | /api/tasks/mine | ✅ | Any |
| POST | /api/tasks | ✅ | Any |
| PATCH | /api/tasks/:id | ✅ | Any* |
| DELETE | /api/tasks/:id | ✅ | Admin |

*Members can only update status of their own tasks

### Dashboard & Users
| Method | Endpoint | Auth | Role |
|--------|----------|------|------|
| GET | /api/dashboard | ✅ | Any |
| GET | /api/users | ✅ | Admin |

## Deploy on Railway

1. Push this folder to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Add PostgreSQL plugin
4. Set environment variables:
   - `DATABASE_URL` → auto-set by Railway
   - `JWT_SECRET` → any random string
   - `NODE_ENV` → production
5. Run setup: In Railway terminal run `node setup-db.js`
6. Your API is live!
