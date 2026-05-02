# TaskFlow – Project Management App

A full-stack project management web app with role-based access control (Admin/Member).

## Live URL
https://taskflow-app-production-e96d.up.railway.app/login

## Tech Stack
- **Backend:** Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs
- **Frontend:** React (Vite), React Router, Axios

## Features
- JWT Authentication (Signup/Login)
- Role-based access — Admin and Member roles
- Project creation and management
- Task creation, assignment, status tracking
- Kanban board (To Do / In Progress / Done)
- Dashboard with stats (total, done, overdue)
- Overdue task detection
- Team members view with stats

## Role Permissions
| Action | Admin | Member |
|--------|-------|--------|
| Create project | ✅ | ❌ |
| Create task | ✅ | ❌ |
| Update task status | ✅ | ✅ |
| Delete task/project | ✅ | ❌ |
| View everything | ✅ | ✅ |

## Setup & Run Locally

### 1. MongoDB Atlas
- Create free account at mongodb.com/atlas
- Create a cluster and get your connection string
- Replace `MONGO_URI` in `backend/.env`

### 2. Backend
```bash
cd backend
npm install
node index.js
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:3000

## Deployment (Railway)
1. Push this repo to GitHub
2. Go to railway.app → New Project → Deploy from GitHub
3. Deploy `backend` folder → Add env vars: `MONGO_URI`, `JWT_SECRET`, `PORT`
4. Deploy `frontend` folder → Set build: `npm run build`, start: `npm run preview`
5. Update the `baseURL` in `frontend/src/api/axios.js` to your Railway backend URL

## API Endpoints
| Method | Route | Auth | Role |
|--------|-------|------|------|
| POST | /api/auth/signup | No | — |
| POST | /api/auth/login | No | — |
| GET | /api/projects | Yes | Any |
| POST | /api/projects | Yes | Admin |
| GET | /api/tasks | Yes | Any |
| POST | /api/tasks | Yes | Admin |
| PUT | /api/tasks/:id | Yes | Any* |
| DELETE | /api/tasks/:id | Yes | Admin |
| GET | /api/users | Yes | Any |

*Members can only update status field
