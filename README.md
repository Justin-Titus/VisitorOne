# VisitorOne — Visitor Pass Management System (MERN Stack)

An enterprise-grade, full-stack **Visitor Pass Management System** built with **MongoDB**, **Express.js**, **React.js**, and **Node.js**, written in **TypeScript**.

Designed with sleek dark-mode aesthetics, responsive glassmorphism interfaces, role-based security access controls, real-time activity audit logging, interactive analytics reports, and strict business logic validation.

---

## 🚀 Technology Stack

- **Frontend**: React 19 (Vite), TypeScript, React Router v7, Framer Motion, TailwindCSS v4, Lucide Icons, React Hot Toast
- **Backend**: Node.js, Express.js, TypeScript, Mongoose ODM
- **Database**: MongoDB (Local or MongoDB Atlas)
- **Security & Authentication**: JWT (JSON Web Tokens), Bcrypt.js, Helmet security headers, CORS protection, `express-mongo-sanitize` (NoSQL Injection Protection), `xss-clean` (XSS Protection), ReDoS Safe Search Escaping
- **Deployment**: Vercel (Frontend) & Render (Backend REST API)

---

## 🔐 Functional Requirements & Roles

### 1. Administrator (`admin`)
- Overall Command Dashboard with real-time facility telemetry & KPIs
- Manage Employee Directory (Create, Edit, Activate/Deactivate)
- Manage User Accounts & Role Permissions
- View Visitor Analytics & Department Breakdown Reports
- Access System-wide Immutable Audit Activity Logs

### 2. Receptionist (`receptionist`)
- Register Visitors with ID proof credentials and live badge preview
- Check-In approved visitors with automatic timestamping
- Check-Out visitors upon departure
- View Visitor History & active gate passes
- Print digital high-DPI visitor badges with QR codes

### 3. Employee (`employee`)
- Personal host dashboard with pending request queue
- View detailed visitor requests assigned to them
- Approve or Reject visitor access requests
- Add mandatory remarks/reasons for approvals or rejections

---

## ⚙️ Business Rules Enforcement

The system strictly enforces the following **10 business rules** at both the backend service layer and database query level:

| Rule ID | Rule Description | Enforcement Mechanism |
|---|---|---|
| **Rule 1** | A visitor cannot have more than 1 active visit at the same time | Rejects new requests if visitor has a `PENDING`, `APPROVED`, or `CHECKED_IN` pass |
| **Rule 2** | Duplicate registrations for the same visitor on the same date are prohibited | Enforced by the `visitor` + `visitDateString` unique index and service-layer validation before saving |
| **Rule 3** | Visit date cannot be earlier than current date | Validates `visitDate >= today` |
| **Rule 4** | Arrival time cannot be earlier than current time for today's visits | Validates expected arrival time against system time |
| **Rule 5** | Host employee cannot exceed 3 pending requests awaiting approval | Caps pending requests per employee at 3 max |
| **Rule 6** | Visitors can only be checked in after employee approval | Rejects check-in attempts if status is not `APPROVED` |
| **Rule 7** | Checked-in visitor cannot be checked in again until checked out | Throws 400 bad request on duplicate check-in attempts |
| **Rule 8** | Check-out time must be strictly later than check-in time | Ensures valid timestamp duration sequence |
| **Rule 9** | Rejected visitor requests cannot be checked in | Prevents check-in state transition from `REJECTED` |
| **Rule 10** | Cancelled visits do not appear in active visitor lists | Filters out `CANCELLED` passes from active gate queues |

---

## 🛠️ Project Structure

```
VisitorOne/
├── client/                     # Frontend React (Vite) Application
│   ├── src/
│   │   ├── components/         # Layout, Modals, Shared & UI components
│   │   ├── context/            # AuthContext provider
│   │   ├── hooks/              # Custom React hooks (useAuth)
│   │   ├── pages/              # Role-specific & shared page views
│   │   │   ├── admin/          # Admin Dashboard, Users, Employees, Reports, Activity
│   │   │   ├── receptionist/   # Reception Dashboard, Register Visitor
│   │   │   ├── employee/       # Host Employee Dashboard
│   │   │   ├── shared/         # Visitor Requests linear table / badge grid
│   │   │   └── auth/           # Login screen
│   │   ├── services/           # Axios API client with interceptors
│   │   └── utils/              # Helper formatters & constants
│   └── package.json
│
├── server/                     # Backend Node.js / Express REST API
│   ├── src/
│   │   ├── config/             # DB and Environment config
│   │   ├── controllers/        # Express route request handlers
│   │   ├── middleware/         # Auth JWT, RBAC, Validate, Error Handlers
│   │   ├── models/             # Mongoose schemas (User, Employee, Visitor, VisitRequest, ActivityLog)
│   │   ├── routes/             # API routes
│   │   ├── seed/               # Database seeder script
│   │   └── services/           # Business logic & rule validation engines
│   ├── .env.example
│   └── package.json
│
└── README.md                   # System documentation
```

---

## 🔑 Quick Start & Setup Instructions

### 1. Prerequisites
- Node.js (v18+ recommended)
- MongoDB running locally at `mongodb://127.0.0.1:27017` OR a MongoDB Atlas cluster URI.

### 2. Backend Setup
```bash
# Navigate to server directory
cd server

# Install dependencies
npm install

# Create environment file
cp .env.example .env
```

Ensure `.env` contains:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/visitor_pass_management
JWT_SECRET=super_secret_jwt_key_replace_me_in_production
JWT_EXPIRES_IN=8h
CORS_ORIGIN=http://localhost:5173
```

Seed initial database records:
```bash
npm run seed
```

Start backend development server:
```bash
npm run dev
```
*(Backend runs on `http://localhost:5000`)*

---

### 3. Frontend Setup
```bash
# Navigate to client directory
cd client

# Install dependencies
npm install

# Create environment file (optional for local dev)
cp .env.example .env

# Start Vite dev server
npm run dev
```
*(Frontend runs on `http://localhost:5173`)*

---

## 👥 Default Demo Credentials

After running `npm run seed`, use any of the pre-configured accounts:

| Role | Name | Email | Password |
|---|---|---|---|
| **Administrator** | Super Admin | `admin@visitorone.com` | `Admin@123` |
| **Receptionist** | Front Desk | `reception@visitorone.com` | `Reception@123` |
| **Host Employee** | Alice Smith | `alice.smith@visitorone.com` | `Employee@123` |
| **Host Employee** | Bob Jones | `bob.jones@visitorone.com` | `Employee@123` |
| **Host Employee** | Charlie Brown | `charlie.brown@visitorone.com` | `Employee@123` |

---

## 📡 REST API Reference Documentation

### Authentication (`/api/auth`)
- `POST /api/auth/login` — Authenticate user and issue JWT token
- `GET /api/auth/me` — Fetch current logged-in user profile

### User Accounts (`/api/users`) — Admin Only
- `GET /api/users` — List all user accounts
- `POST /api/users` — Create new user account
- `PUT /api/users/:id` — Update user details
- `PATCH /api/users/:id/status` — Toggle active/inactive status

### Employees (`/api/employees`)
- `GET /api/employees` — Fetch staff list (All roles)
- `POST /api/employees` — Add employee profile (Admin)
- `PUT /api/employees/:id` — Update employee profile (Admin)
- `PATCH /api/employees/:id/status` — Toggle employee active status (Admin)

### Visitor Requests (`/api/visitor-requests`)
- `POST /api/visitor-requests` — Register visitor pass (Receptionist)
- `GET /api/visitor-requests` — Search & list visitor passes (Role-filtered)
- `GET /api/visitor-requests/:id` — Get pass details & double-sided badge info
- `PATCH /api/visitor-requests/:id/approve` — Approve request (Host Employee)
- `PATCH /api/visitor-requests/:id/reject` — Reject request with remarks (Host Employee)
- `PATCH /api/visitor-requests/:id/check-in` — Check in visitor (Receptionist)
- `PATCH /api/visitor-requests/:id/check-out` — Check out visitor (Receptionist)
- `PATCH /api/visitor-requests/:id/cancel` — Cancel pass (Admin / Receptionist)
- `GET /api/visitor-requests/:id/activity` — Get audit trail for specific request
- `PATCH /api/visitor-requests/bulk-approve` — Bulk approve multiple passes
- `PATCH /api/visitor-requests/bulk-reject` — Bulk reject multiple passes
- `PATCH /api/visitor-requests/bulk-check-in` — Bulk check-in multiple visitors

### Dashboards (`/api/dashboard`)
- `GET /api/dashboard/admin` — Admin analytics & summary KPIs
- `GET /api/dashboard/receptionist` — Reception gate statistics
- `GET /api/dashboard/employee` — Host employee metrics

### Reports & Audit Logs (`/api/reports` & `/api/activity-logs`)
- `GET /api/reports/visitor-analytics` — Comprehensive report (Supports `range=today`, `range=week`, or custom date filters)
- `GET /api/reports/export/pdf` — Export analytics as PDF document
- `GET /api/reports/export/excel` — Export analytics as ExcelJS spreadsheet
- `GET /api/activity-logs` — Global security audit trail (Admin)

---

## 🌐 Production Deployment Guide

### Deploy Backend to Render
1. Connect GitHub repository to **Render**.
2. Select **Web Service** and choose the `/server` directory.
3. Set environment variables: `MONGO_URI` (MongoDB Atlas URI), `JWT_SECRET`, `CORS_ORIGIN` (Your Vercel URL).

### Deploy Frontend to Vercel
1. Connect repository to **Vercel**.
2. Set Root Directory to `client`.
3. Set Build Command: `npm run build` and Output Directory: `dist`.
4. Add environment variable `VITE_API_BASE_URL` pointing to deployed Render backend API URL (e.g. `https://visitorone-api.onrender.com/api`).


