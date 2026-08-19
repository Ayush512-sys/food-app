# FoodBack AI — Hostel Mess Waste Reduction Platform

A full-stack AI-powered Hostel Mess Management system built with React, Node.js/Express, and MongoDB.

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Tailwind CSS 3, React Router 6, Recharts, Axios, Lucide Icons |
| Backend | Node.js, Express 4, Mongoose 8, JWT, bcryptjs |
| Database | MongoDB (Local or Atlas) |
| Deployment | Frontend → Vercel, Backend → Render |

## 📦 Project Structure

```
Food App Management/
├── backend/
│   ├── config/db.js          # MongoDB connection
│   ├── middleware/            # JWT auth + error handler
│   ├── models/               # 12 Mongoose schemas
│   ├── routes/               # 11 Express route files
│   ├── seed.js               # Auto-seeder with mock data
│   ├── server.js             # Express entry point
│   ├── package.json
│   └── .env
└── frontend/
    ├── src/
    │   ├── components/        # Sidebar, Navbar, ThemeContext, ProtectedRoute
    │   ├── pages/             # Login, Register, Student/Manager/Admin Dashboards
    │   ├── App.jsx            # React Router
    │   ├── main.jsx           # Vite entry
    │   └── index.css          # Tailwind + custom styles
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.js
    └── package.json
```

## 🔧 Setup Instructions

### Prerequisites
- **Node.js** v18+ and npm
- **MongoDB** running locally on default port (27017) OR a MongoDB Atlas connection string

### 1. Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file (already included with defaults):
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/foodback-ai
JWT_SECRET=super_secret_foodback_ai_token_key_12345
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev
```

The server auto-seeds mock data on first run:
- **Student**: `student@foodback.com` / `password123` (Roll: `2026S001`)
- **Manager**: `manager1` / `password123`
- **Admin**: `admin@foodback.com` / `password123`

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend runs on `http://localhost:3000` and proxies API calls to `http://localhost:5000`.

### 3. Open in Browser

Navigate to `http://localhost:3000` and log in with the seeded credentials above.

## 🎯 Features

### Student Dashboard
- View today's menu & notifications
- Mark meal absence with time-lock enforcement
- QR code display for mess entry
- Submit meal ratings & feedback
- File complaints (Food/Hygiene/Service)
- View subscription & make payments

### Mess Manager Dashboard
- Live attendance monitoring with meal-wise stats
- QR Scanner simulation (correct absent→present)
- AI-powered food demand forecasting
- Waste tracking with cost estimation & charts
- Weekly menu management
- CSV report downloads

### System Admin Dashboard
- Manage all students & managers
- View hostel registrations & subscription tiers
- Revenue analytics & MRR charts

### Cross-Cutting
- JWT authentication with role-based access control
- Dark mode toggle
- Sandbox time simulator for testing cutoff locks
- Responsive design for all screen sizes

## 🔒 Security
- bcrypt password hashing
- JWT token authentication
- Role-based route protection
- Express rate limiting
- Input validation via Mongoose schemas

## 📊 API Endpoints

| Route | Description |
|-------|-------------|
| `POST /api/auth/login` | Login (student/manager/admin) |
| `POST /api/auth/register` | Register student |
| `GET /api/students/stats` | Student dashboard stats |
| `POST /api/attendance/leave` | Mark meal absence |
| `PATCH /api/attendance/scan` | QR scan entry |
| `GET /api/attendance/live` | Live attendance counts |
| `POST /api/feedback` | Submit meal rating |
| `GET /api/forecasting` | AI demand prediction |
| `GET/POST /api/waste` | Waste tracking |
| `GET /api/reports/export` | Download CSV reports |
| `GET /api/admin/revenue` | Revenue analytics |

## 📄 License

MIT © 2026 FoodBack AI
