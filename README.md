# Spark Grid CRM - Next.js

A modern Customer Relationship Management (CRM) application built with **Next.js**, designed to manage customers, leads, employees, tasks, sales, and business operations through a responsive web interface.

---

## 🚀 Tech Stack

- **Framework:** Next.js
- **Language:** JavaScript / TypeScript
- **UI:** Material UI (MUI)
- **Authentication:** JWT / NextAuth (if configured)
- **API:** REST API
- **State Management:** React Hooks / Context API
- **HTTP Client:** Axios
- **Styling:** CSS / SCSS / Tailwind (Project dependent)
- **Deployment:** Vercel / Linux Server

---

# Features

- 🔐 Secure Authentication
- 👥 User & Role Management
- 🏢 Customer Management
- 📞 Lead Management
- 📋 Task Management
- 📊 Dashboard Analytics
- 📈 Sales Reports
- 📁 Document Management
- 🔔 Notifications
- 📱 Responsive Design
- 🌐 Multi-language Support (if enabled)
- ⚡ Optimized Performance

---

# Project Structure

```
.
├── public/
├── src/
│   ├── app/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   ├── utils/
│   ├── contexts/
│   ├── layouts/
│   ├── styles/
│   └── assets/
├── package.json
├── next.config.js
└── README.md
```

---

# Prerequisites

Before starting, install:

- Node.js >= 18
- npm or yarn
- Git

---

# Installation

Clone the repository

```bash
git clone <repository-url>
```

Go inside project

```bash
cd spark-grid-crm-nextjs
```

Install dependencies

```bash
npm install
```

or

```bash
yarn install
```

---

# Environment Variables

Create a `.env.local` file.

```env
NEXT_PUBLIC_API_URL=
NEXT_PUBLIC_SOCKET_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
```

Add other environment variables as required by your backend.

---

# Running Development Server

```bash
npm run dev
```

Open

```
http://localhost:3000
```

---

# Build for Production

```bash
npm run build
```

Start production server

```bash
npm start
```

---

# Available Scripts

| Command | Description |
|----------|-------------|
| npm run dev | Start development server |
| npm run build | Create production build |
| npm start | Start production server |
| npm run lint | Run ESLint |

---

# Authentication Flow

```
Login
      │
      ▼
API Authentication
      │
      ▼
Receive Access Token
      │
      ▼
Store Session
      │
      ▼
Access Protected Routes
```

---

# API Communication

The frontend communicates with backend REST APIs using Axios.

Typical flow:

```
Component
     │
     ▼
Axios Service
     │
     ▼
REST API
     │
     ▼
Backend Response
     │
     ▼
Update UI
```

---

# Folder Description

| Folder | Purpose |
|---------|----------|
| app | App Router Pages |
| components | Reusable UI Components |
| services | API Calls |
| hooks | Custom React Hooks |
| contexts | Global Context |
| layouts | Layout Components |
| utils | Utility Functions |
| assets | Images, Icons |
| styles | CSS / SCSS |

---

# Deployment

Generate production build

```bash
npm run build
```

Deploy to:

- Vercel
- Nginx
- Apache
- Docker

---

# Best Practices

- Keep components reusable.
- Store API calls inside services.
- Never expose secrets.
- Use environment variables.
- Follow ESLint rules.
- Optimize images.
- Use lazy loading where applicable.

---

# Troubleshooting

## Module not found

```bash
rm -rf node_modules
npm install
```

## Clear Next Cache

```bash
rm -rf .next
npm run dev
```

## Build Issues

```bash
npm run build
```

Review console errors and resolve any TypeScript or ESLint issues.

---

# Contributing

1. Create a feature branch.

```bash
git checkout -b feature/new-feature
```

2. Commit changes.

```bash
git commit -m "Add new feature"
```

3. Push branch.

```bash
git push origin feature/new-feature
```

4. Create a Pull Request.

---

# License

This project is proprietary and intended for internal use unless otherwise specified.

---

# Author

**Spark Grid CRM Development Team**

---

## Version

**v1.0.0**
