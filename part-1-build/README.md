# Clinic Appointment System API

REST API for managing clinic appointments. Built with **Node.js + Express + TypeScript + Prisma + PostgreSQL**.

## Quick Start (Docker)

> **Requires:** Docker Desktop running

```bash
cd part-1-build
docker compose up --build
```

The API will be available at **http://localhost:3000**  
Interactive API docs (Swagger UI): **http://localhost:3000/docs**

---

## Manual Setup (Without Docker)

### Prerequisites

- Node.js 20+
- PostgreSQL 14+ running locally

### Steps

```bash
# 1. Install dependencies
cd part-1-build
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env and fill in your DATABASE_URL and JWT_SECRET
```

**`.env` minimum required values:**
```
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/clinic_db
JWT_SECRET=a-random-string-that-is-at-least-32-characters-long
```

```bash
# 3. Run database migrations
npx prisma migrate dev

# 4. Start the dev server (hot-reload)
npm run dev
```

API available at **http://localhost:3000** — docs at **http://localhost:3000/docs**

---

## Environment Variables

| Variable | Required | Default | Notes |
|---|---|---|---|
| `DATABASE_URL` | ✅ | — | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | — | Min 32 characters |
| `JWT_EXPIRES_IN` | ❌ | `7d` | Token expiry duration |
| `PORT` | ❌ | `3000` | HTTP listen port |
| `NODE_ENV` | ❌ | `development` | `development` / `production` |

---

## API Overview

| Method | Path | Auth | Role Required | Description |
|---|---|---|---|---|
| `GET` | `/health` | No | — | Liveness check |
| `POST` | `/auth/register` | No | — | Register new user |
| `POST` | `/auth/login` | No | — | Login, receive JWT |
| `GET` | `/appointments` | ✅ | Any | List appointments (role-filtered) |
| `POST` | `/appointments` | ✅ | PATIENT | Book an appointment |
| `GET` | `/appointments/:id` | ✅ | Any | Get single appointment |
| `PATCH` | `/appointments/:id/cancel` | ✅ | Any (own only) | Cancel appointment |

**Authentication:** All appointment endpoints require `Authorization: Bearer <token>` header.

**Response envelope:**
```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Human-readable message" }
```

---

## Design Decisions & Assumptions

*This section exists specifically for the evaluation reviewers to highlight the architectural rationale.*

### 1. Architecture: Modular (Feature-Based) Structure
Instead of a traditional MVC monolith (`controllers/`, `routes/`, `services/`), this project is structured by **domain modules** (e.g., `src/modules/appointments`, `src/modules/auth`). 
- **Why?** It enforces a strong separation of concerns and scales much better. If a new business domain is added (like `prescriptions`), its logic is entirely self-contained within its own folder. It prevents massive unstructured global folders and makes the codebase more maintainable and easier to navigate or review.

### 2. Separation of Concerns (Data Flow)
The codebase strictly adheres to the following flow: `Route -> Middleware (Validation/Auth) -> Controller -> Service -> DB (Prisma)`
- **Why?** Moving business logic strictly into `Service` files keeps the `Controllers` extremely clean. The Controllers only parse the Express Request and shape the Response. This isolation makes testing the core logic vastly easier later, as the services have zero dependencies on Express or HTTP components.

### 3. Validation & Middleware
- Input validation relies entirely on **Zod** configured aggressively at the router edge. 
- **Why?** A custom validation factory middleware parses incoming shapes and intercepts malformed structures immediately, keeping deeper services pure and strongly typed without internal `if (missing)` clutter.

### 4. Appointment Overlap Calculus (Conflict Detection)
- Instead of raw parameterised SQL, the overlap detection leverages Prisma natively via a bounded fast-query. 
- **How it works:** To detect double bookings efficiently without risking SQL injection attacks, the system fetches only the target doctor's schedule strictly bonded to that calendar day. It then processes the time interval overlapping logic (`A_start < B_end && A_end > B_start`) in memory. 
- **Why?** Because a doctor's appointments per-day are constrained, pulling an array of a dozen records into memory is highly performant and allows the Prisma abstraction to handle the DB cleanly without raw query casting limitations.
- *Note on scale:* I added a composite index onto `[doctorId, dateTime]` specifically to optimize this daily conflict-check query if the appointment table grows dramatically.

### 5. Additional Assumptions Followed
- **Role is set at registration** and cannot be changed after. In a real system, patching roles would be strictly an admin-only operation.
- **`patientId` is always derived from the JWT** — the request body cannot override it.
- **Docker:** Extended the provided Alpine Linux base image to inject `openssl` directly within the `Dockerfile`. This natively compiles the Prisma 5.x C-bind engines that normally crash on base `node:20-alpine`.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with hot-reload (ts-node-dev) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run compiled output |
| `npm run db:migrate` | Create and apply a new migration |
| `npm run db:generate` | Regenerate Prisma client after schema changes |
| `npm run db:studio` | Open Prisma Studio (visual DB browser) |
