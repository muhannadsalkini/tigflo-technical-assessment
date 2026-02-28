# Security Code Review — Medical Records API

## Executive Summary
This document outlines the security vulnerabilities discovered during the code review of the Medical Records API. Multiple critical and high-severity issues were identified, ranging from SQL Injection and Path Traversal to insecure password storage and hardcoded secrets. 

---

### 1. [CRITICAL] SQL Injection in Record Search

**Location:** `src/routes/records.routes.ts`, line 53

**Description:** The application uses `prisma.$queryRawUnsafe` to execute a raw SQL query that directly interpolates the user-controlled `name` query parameter without any sanitization or parameterization.

**Impact:** An attacker can inject arbitrary SQL commands. By passing crafted input like `'; DROP TABLE "Record"; --`, they can read, modify, or delete any data in the database, leading to complete database compromise and data loss.

**Fix:** Replace the raw SQL query with Prisma's standard ORM methods (e.g., `prisma.record.findMany` with `contains: name, mode: 'insensitive'`). If raw SQL is absolutely necessary, use the `Prisma.sql` tagged template literal (`prisma.$queryRaw\``) which safely parameterizes inputs.

---

### 2. [CRITICAL] Path Traversal in File Downloads

**Location:** `src/routes/files.routes.ts`, line 14

**Description:** The `filename` parameter from the URL is concatenated directly into a file path using `path.join` without verifying that the resolved path actually stays within the intended `uploads/` directory.

**Impact:** An attacker can pass directory traversal sequences like `../../.env` or `../../../../etc/passwd` as the filename. This allows them to read arbitrary files from the host server, exposing sensitive configuration, database credentials, or system files.

**Fix:** Validate the filename to ensure it does not contain path traversal characters (e.g., checking it against a regex like `/^[a-zA-Z0-9.\-_]+$/`). Additionally, use `path.resolve` to verify that the final requested path strictly starts with the absolute path of the `uploads/` directory.

---

### 3. [HIGH] Plaintext Password Storage

**Location:** `src/routes/auth.routes.ts`, line 30 & 61

**Description:** User passwords are saved directly into the database as plaintext strings during registration. During login, they are compared via a direct string equality check (`user.password !== password`).

**Impact:** If the database is compromised (e.g., via the SQL Injection mentioned above), all user passwords are immediately exposed in readable form. Since users often reuse passwords, this could compromise their peripheral accounts on other platforms.

**Fix:** Install `bcrypt` (or `bcryptjs`) and hash the passwords with a secure salt work factor (e.g., 10 or 12) before saving them to the database. During login, use `bcrypt.compare()` to securely verify provided passwords against the stored hashes.

---

### 4. [HIGH] Information Leakage (Stack Traces in Production)

**Location:** All route files (`auth.routes.ts`, `records.routes.ts`, `files.routes.ts`, `index.ts`), inside `catch` blocks.

**Description:** Whenever an unhandled exception occurs, the application responds with a 500 status and includes the full `error.stack` and `error.message` in the JSON response payload, regardless of the deployment environment.

**Impact:** Attackers can glean sensitive information about the application's underlying directory structure, framework versions, database schema, and dependencies. This information significantly aids in weaponizing targeted attacks.

**Fix:** Remove `stack` and detailed `details` from error responses. Prefer returning a generic error message like "Internal server error". If stack traces need to be retained for local debugging, wrap their inclusion in an environment check (e.g., `if (process.env.NODE_ENV === 'development')`).

---

### 5. [MEDIUM] Privilege Escalation (Mass Assignment) in Registration

**Location:** `src/routes/auth.routes.ts`, line 30

**Description:** The register endpoint accepts a `role` field directly from the `req.body` and creates the user with that role (`role: role || "STAFF"`).

**Impact:** Any unauthenticated user can escalate their privileges during registration simply by sending `{"role": "ADMIN"}` in their JSON payload. They would immediately gain any admin-level access control permissions in the system.

**Fix:** Ignore the `role` field from the incoming request body during registration. Hardcode the creation role to the default (e.g., `"STAFF"`). Promoting a user's role should be restricted to a separate, admin-only endpoint.

---

### 6. [MEDIUM] Hardcoded JWT Secrets

**Location:** `src/middleware/auth.middleware.ts` (line 5) and `src/routes/auth.routes.ts` (line 9).

**Description:** The application uses a hardcoded string `const JWT_SECRET = "clinic-portal-secret-2024";` to sign and verify JWT authentication tokens.

**Impact:** Since the secret is committed to the source code, anyone with read access to the repository knows the token signing key. An attacker can use this key to forge valid JWTs for any user (including admins) and completely bypass authentication.

**Fix:** Remove the hardcoded secret from the source files. Read the secret from an environment variable (`process.env.JWT_SECRET`). Ensure the application fails to start if this environment variable is omitted.

---

### 7. [LOW] Missing Input Validation

**Location:** Throughout `auth.routes.ts` and `records.routes.ts`.

**Description:** The application trusts client input implicitly. It does not validate the format of emails, the strength of passwords, or whether required JSON fields even exist or are of the correct type (string vs. object vs. array).

**Impact:** Passing unexpected data types can crash the application or pollute the database with malformed data. Empty passwords or invalid emails can be saved in the database.

**Fix:** Implement an input validation layer (e.g., using `zod`) at the boundary of all POST/PUT routes to ensure incoming data strictly adheres to expected schemas before it touches any business or database logic.
