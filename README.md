# 🇳🇬 Trackam — Nigeria's Business CRM Platform

<div align="center">

![Trackam Banner](https://img.shields.io/badge/Made%20in-Nigeria%20🇳🇬-008751?style=for-the-badge)
![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript)
![License](https://img.shields.io/badge/License-Proprietary-red?style=for-the-badge)

**The most complete business management CRM built specifically for Nigerian businesses.**

[🌐 Live Demo](https://trackam.ng) · [📩 Contact](mailto:hello@trackam.ng) · [🐛 Report a Bug](https://github.com/DEV-RAPHAEL/trackam/issues)

</div>

---

## 📌 What is Trackam?

Trackam is a **multi-tenant SaaS CRM** designed from the ground up for Nigerian enterprises — from solo founders in Aba to large sales teams in Lagos. It replaces the chaos of WhatsApp groups, scattered spreadsheets, and multiple disconnected tools with one unified, powerful platform.

**One flat fee. Unlimited everything. No per-seat pricing.**

---

## ✨ Core Features

| Module | What it does |
|--------|--------------|
| 🧑‍💼 **Client Management** | Store full client profiles, contact history, notes, status, and linked deals/invoices |
| 🎯 **Lead Pipeline** | Capture prospects, log WhatsApp/phone call updates, track stages, set follow-up reminders |
| 💼 **Deal Tracking** | Kanban pipeline, deal values in ₦, conversion rates, win/loss reporting |
| ✅ **Task Management** | Kanban boards, Gantt charts, team assignment, priority levels, progress tracking |
| 🧾 **Naira Invoicing** | Generate branded invoices in ₦, send via email, track paid/unpaid status |
| 📊 **Analytics Dashboard** | Live revenue trends, win rates, team performance, 6-month forecasts |
| 👥 **Team Management** | Invite team members by email, assign roles (Owner / Admin / User) |
| 🔔 **Activity Audit Log** | Real-time log of every action taken across your workspace |
| 🧩 **Module Store** | Unlock POS, HR, Accounting, Projects, and more as your business grows |

---

## 🏗️ Tech Stack

```
Frontend:   Next.js 16 (App Router) + React 19 + TypeScript 5
Styling:    Tailwind CSS v4
State:      Zustand (with persistence)
Database:   SQLite (better-sqlite3) in dev → PostgreSQL in production
Auth:       JWT (jsonwebtoken) — multi-tenant via subdomain routing
Email:      Nodemailer (SMTP) + Resend
Payments:   Paystack (Nigerian payment gateway)
PDF:        PDFKit (invoice generation)
Deploy:     Railway (primary) | Vercel/Netlify (frontend)
```

---

## 🚀 Getting Started (Local Dev)

### Prerequisites
- Node.js 18+
- npm or yarn

### 1. Clone the repo

```bash
git clone https://github.com/DEV-RAPHAEL/trackam.git
cd trackam
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Create a `.env` file in the root:

```env
# App
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_BASE_DOMAIN=localhost
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# Database (leave empty for local SQLite, set for PostgreSQL in prod)
DATABASE_URL=

# SQLite path (optional - defaults to ./trackam-dev.db)
SQLITE_DB_PATH=./trackam-dev.db

# Paystack (Nigerian payment gateway)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
PAYSTACK_SECRET_KEY=sk_test_your_key_here

# Email (SMTP or Resend)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password

# Optional: Resend
RESEND_API_KEY=re_your_key_here
```

### 4. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and you'll see the landing page.

> **Multi-tenant routing:** Each company gets a subdomain (e.g., `mycompany.localhost:3000`). After registering, you'll be redirected automatically.

### 5. Default Superadmin

A platform superadmin is seeded on first run. Access the control panel at `/superadmin`. Credentials are set securely via database seeds or environment variables.

---

## 🗄️ Database

### Local Development
Uses **better-sqlite3** — a simple `.db` file. No setup required. The database and all tables are auto-created on first API call.

### Production
Set `DATABASE_URL` in your environment to a **PostgreSQL** connection string. The app automatically switches to pg and provisions all tables on first boot.

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

---

## 🌍 Deployment (Railway)

### Option A: PostgreSQL (Recommended)

1. Push your code to GitHub
2. Create a new project on [Railway.app](https://railway.app)
3. Connect your GitHub repo
4. Add a **PostgreSQL** service to your project
5. Link `DATABASE_URL` from Postgres to your Next.js service
6. Add your other env variables (JWT_SECRET, PAYSTACK keys, etc.)
7. Deploy! 🚀

### Option B: SQLite with Persistent Volume

1. In Railway, go to your service → **Volumes** → Add Volume
2. Mount path: `/app/data`
3. Set env var: `SQLITE_DB_PATH=/app/data/trackam.db`
4. Deploy!

### Custom Domain on Railway ✅
Yes, Railway supports custom domains! Go to:
> **Your Service → Settings → Networking → Custom Domain**

Add your domain (e.g., `trackam.ng`) and point your DNS records as instructed. Railway provides a **free TLS/SSL certificate** automatically.

---

## 🏢 Multi-Tenancy Architecture

Each company gets:
- An **isolated subdomain** (e.g., `nova-labs.trackam.ng`)
- All data scoped by `company_id` — no cross-company data leakage
- Middleware routing handles subdomain detection on every request

```
trackam.ng              → Marketing landing page
app.trackam.ng          → (Optional: main app redirect)
nova-labs.trackam.ng    → Nova Labs Workspace
techbridge.trackam.ng   → TechBridge Solutions Workspace
```

---

## 📁 Project Structure

```
trackam-next/
├── app/
│   ├── (dashboard)/        # Authenticated app routes
│   │   ├── dashboard/      # Main analytics dashboard
│   │   ├── clients/        # Client management
│   │   ├── leads/          # Lead pipeline + detail pages
│   │   ├── deals/          # Deal tracking
│   │   ├── tasks/          # Task management
│   │   ├── invoices/       # Invoice generation
│   │   ├── settings/       # Company & team settings
│   │   └── modules/        # Module store
│   ├── api/                # Next.js Route Handlers (REST API)
│   ├── login/              # Auth pages
│   ├── register/
│   ├── onboarding/         # Guided setup flow
│   └── superadmin/         # Platform admin panel
├── components/             # Shared UI components
├── lib/
│   ├── db.ts               # Database abstraction (SQLite ↔ PostgreSQL)
│   ├── store.ts            # Zustand global state
│   ├── auth.ts             # JWT auth helpers
│   ├── mailer.ts           # Email sending
│   └── pdf-generator.ts    # Invoice PDF generation
└── types/
    └── index.ts            # Shared TypeScript types
```

---

## 🧩 Module System

Trackam ships with a **modular architecture**. The core CRM is always available. Additional business modules can be unlocked from the Module Store:

| Module | Status | Price |
|--------|--------|-------|
| POS System | Available | ₦49,000 |
| HR Management | Coming Soon | ₦99,000 |
| Accounting | Coming Soon | ₦79,000 |
| Project Tracker | Available | ₦39,000 |
| Support Tickets | Coming Soon | ₦29,000 |

---

## 🤝 Contributing

This is a proprietary project. For bug reports or feature requests, please [open an issue](https://github.com/DEV-RAPHAEL/trackam/issues).

---

## 📄 License

Proprietary — All rights reserved. © 2025 Trackam. Unauthorized copying, modification, or distribution is prohibited.

---

<div align="center">

**Built with ❤️ in Nigeria 🇳🇬**

[trackam.ng](https://trackam.ng) · hello@trackam.ng

</div>
