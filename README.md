# Finance Data Processing API

A RESTful API for managing personal or organizational financial data. Built with **NestJS**, **Prisma ORM**, and **PostgreSQL**, it supports JWT authentication, role-based access control (RBAC), transaction tracking, category management, and dashboard analytics.

---

## Table of Contents

- [Tech Stack](#tech-stack)
- [Features](#features)
- [Project Structure](#project-structure)
- [Database Schema](#database-schema)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Running the Application](#running-the-application)
- [Database Migrations & Seeding](#database-migrations--seeding)
- [API Reference](#api-reference)
  - [Authentication](#authentication)
  - [Categories](#categories)
  - [Transactions](#transactions)
  - [Dashboard](#dashboard)
  - [Permissions](#permissions)
- [Authorization & Permissions](#authorization--permissions)
- [Standard Response Format](#standard-response-format)
- [Error Handling](#error-handling)
- [Technical Decisions & Trade-offs](#technical-decisions--trade-offs)

---

## Tech Stack

| Layer         | Technology                        |
|---------------|-----------------------------------|
| Framework     | NestJS (Node.js / TypeScript)     |
| ORM           | Prisma                            |
| Database      | PostgreSQL                        |
| Auth          | JWT (Passport.js + `@nestjs/jwt`) |
| Hashing       | bcrypt                            |
| Validation    | class-validator / class-transformer |

---

## Features

- **JWT Authentication** — Secure login with access tokens. All routes are protected by default; use `@Public()` to opt out.
- **Role-Based Permissions (RBAC)** — Every protected route requires one or more permission codes. Permissions are assigned to roles and inherited by users in those roles.
- **Transaction Management** — Create, read, update, and delete financial transactions typed as `INCOME` or `EXPENSE`, each linked to a category.
- **Category Management** — Full CRUD for transaction entry categories.
- **Dashboard Analytics** — Aggregated summaries, category breakdowns, recent activity, and monthly trends over configurable date ranges.
- **Standardized Responses** — Every response follows a consistent `{ success, message, data }` envelope via a global interceptor.
- **Global Exception Handling** — All errors (HTTP and unexpected) are caught and returned in a uniform error shape.

---

## Project Structure

```
src/
├── app/                  # Root module & app controller
├── auth/                 # Authentication (JWT strategy, login)
├── category/             # Category CRUD module
├── common/               # Shared decorators, guards, filters, interceptors
│   ├── decorators/       # @Public(), @Permissions(), @ResponseMessage()
│   ├── filters/          # GlobalExceptionFilter, PrismaExceptionFilter
│   ├── guards/           # JwtAuthGuard, PermissionsGuard
│   └── interceptors/     # TransformInterceptor (response envelope)
├── dashboard/            # Analytics & reporting
├── database/             # Prisma DatabaseService
├── permission/           # Permission & role-permission management
├── transaction/          # Transaction CRUD module
└── user/                 # User module & role enums
prisma/
├── schema.prisma         # Database schema
├── seed.ts               # Seed script
└── migrations/           # Migration history
generated/prisma/         # Auto-generated Prisma client
```

---

## Database Schema

```
User          — email, fullName, password, role (FK → Role), soft-delete flags
Role          — name; has many Users and RolePermissions
Permissions   — code (unique); has many RolePermissions
RolePermission— join table linking Role ↔ Permissions (unique per pair)

TransactionEntryCategory — name (unique)
TransactionEntry         — type (INCOME | EXPENSE), amount, description,
                           date, category (FK → TransactionEntryCategory)
```

Indexes on `TransactionEntry`: `date`, `type`, `categoryId`, and the composite `(type, categoryId, date)` for efficient analytical queries.

---

## Getting Started

### Prerequisites

- Node.js ≥ 18
- PostgreSQL database instance
- npm

### Installation

```bash
npm install
```

---

## Environment Variables

Create a `.env` file in the project root:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

# JWT
JWT_SECRET="your-very-secret-key"
JWT_EXPIRY="7d"
```

---

## Running the Application

```bash
# Development (watch mode)
npm run start:dev

# Standard development
npm run start

# Production (requires prior build)
npm run build
npm run start:prod

# Debug mode
npm run start:debug
```

The server starts on `http://localhost:3000` by default.

---

## Database Migrations & Seeding

```bash
# Apply pending migrations
npx prisma migrate dev

# Generate Prisma client after schema changes
npx prisma generate

# Seed the database with initial data
npx prisma db seed

# Open Prisma Studio (GUI)
npx prisma studio
```

---

## API Reference

All responses follow the [Standard Response Format](#standard-response-format).  
All endpoints except `/auth/login` require a valid `Authorization: Bearer <token>` header.

---

### Authentication

| Method | Endpoint       | Auth Required | Description                        |
|--------|----------------|---------------|------------------------------------|
| POST   | `/auth/login`  | No            | Authenticate and receive a JWT     |

**POST `/auth/login`**

Request body:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```

Response `data`:
```json
{
    "success": true,
    "data": {
        "accessToken": "eyJh.....",
        "tokenType": "Bearer",
        "expiresIn": 900
    },
    "message": "Login successful"
}
```

---

### Categories

| Method | Endpoint                  | Permission        | Description            |
|--------|---------------------------|-------------------|------------------------|
| POST   | `/categories/create`      | `category_create` | Create a category      |
| GET    | `/categories/all`         | `category_read`   | List all categories    |
| GET    | `/categories/one/:id`     | `category_read`   | Get a single category  |
| PATCH  | `/categories/update/:id`  | `category_update` | Update a category      |

**POST `/categories/create`** — Request body:
```json
{ "name": "Utilities" }
```

---

### Transactions

| Method | Endpoint                      | Permission           | Description                           |
|--------|-------------------------------|----------------------|---------------------------------------|
| POST   | `/transactions/create`        | `transaction_create` | Create a transaction                  |
| GET    | `/transactions/all`           | `transaction_read`   | List transactions (filterable)        |
| GET    | `/transactions/view/:id`      | `transaction_read`   | Get a single transaction              |
| PATCH  | `/transactions/update/:id`    | `transaction_update` | Update a transaction                  |
| DELETE | `/transactions/delete/:id`    | `transaction_delete` | Delete a transaction                  |

**POST `/transactions/create`** — Request body:
```json
{
  "type": "INCOME",
  "amount": 1500.00,
  "description": "Freelance payment",
  "date": "2026-04-01",
  "categoryId": 3
}
```

**GET `/transactions/all`** — Query parameters:

| Param        | Type     | Description                          |
|--------------|----------|--------------------------------------|
| `type`       | string   | `INCOME` or `EXPENSE`                |
| `categoryId` | number   | Filter by category                   |
| `dateFrom`   | ISO date | Start of date range                  |
| `dateTo`     | ISO date | End of date range                    |
| `page`       | number   | Page number (default: 1)             |
| `limit`      | number   | Records per page (default: 20)       |

Example: `GET /transactions/all?type=INCOME&dateFrom=2026-01-01&dateTo=2026-04-05&page=1&limit=20`

---

### Dashboard

All dashboard endpoints require the `dashboard_read` permission.

| Method | Endpoint                        | Description                                      |
|--------|---------------------------------|--------------------------------------------------|
| GET    | `/dashboard/summary`            | Total income, expenses, net balance, count       |
| GET    | `/dashboard/categories`         | Income / expense / net broken down per category  |
| GET    | `/dashboard/recent`             | N most recent transactions                       |
| GET    | `/dashboard/trends/monthly`     | Monthly income / expense / net over a date range |

All endpoints accept `dateFrom` and `dateTo` query parameters (ISO date strings).  
`/dashboard/recent` accepts a `limit` (number) query parameter.

**GET `/dashboard/summary`** — Response `data` example:
```json
{
  "totalIncome": "8500.00",
  "totalExpenses": "3200.00",
  "netBalance": "5300.00",
  "transactionCount": 42
}
```

---

### Permissions

| Method | Endpoint                        | Permission           | Description                              |
|--------|---------------------------------|----------------------|------------------------------------------|
| POST   | `/permissions/create`           | `manage_permissions` | Create a new permission code             |
| GET    | `/permissions/all`              | `view_permissions`   | List all permissions                     |
| GET    | `/permissions/one/:id`          | `view_permissions`   | Get a single permission                  |
| GET    | `/permissions/users/:userId`    | `view_permissions`   | Get all permissions for a user           |
| PATCH  | `/permissions/update/:id`       | `manage_permissions` | Update a permission                      |
| POST   | `/permissions/assign`           | `manage_permissions` | Assign a permission to a role            |
| DELETE | `/permissions/revoke`           | `manage_permissions` | Revoke a permission from a role          |

**POST `/permissions/assign`** — Request body:
```json
{
  "roleId": 1,
  "permissionId": 5
}
```

---

## Authorization & Permissions

The application uses a two-layer security model:

1. **JWT Guard** (`JwtAuthGuard`) — Applied globally. Every request must carry a valid Bearer token unless the route is decorated with `@Public()`.
2. **Permissions Guard** (`PermissionsGuard`) — Checks that the authenticated user's role has all required permission codes for the route.

### User Roles

| Role      | Description                          |
|-----------|--------------------------------------|
| `admin`   | Full system access                   |
| `analyst` | Read and analytical access           |
| `viewer`  | Read-only access                     |

Permissions are assigned to **roles**, not individual users. A user inherits all permissions of their assigned role.

### Permission Code Convention

Permission codes follow a `resource_action` naming pattern:

| Code                   | Description                               |
|------------------------|-------------------------------------------|
| `transaction_create`   | Create transactions                       |
| `transaction_read`     | View transactions                         |
| `transaction_update`   | Update transactions                       |
| `transaction_delete`   | Delete transactions                       |
| `category_create`      | Create categories                         |
| `category_read`        | View categories                           |
| `category_update`      | Update categories                         |
| `dashboard_read`       | Access dashboard analytics                |
| `manage_permissions`   | Create, update, assign, revoke permissions|
| `view_permissions`     | View permissions and user permissions     |

---

## Standard Response Format

All successful responses are wrapped in a consistent envelope by the global `TransformInterceptor`:

```json
{
  "success": true,
  "message": "Human-readable status message",
  "data": { }
}
```

---

## Error Handling

All errors (HTTP exceptions and unexpected runtime errors) are handled by the global `GlobalExceptionFilter` and returned in a uniform shape:

```json
{
  "success": false,
  "statusCode": 403,
  "error": "ForbiddenException",
  "message": "You do not have permission to perform this action",
  "path": "/transactions/create",
  "timestamp": "2026-04-06T10:00:00.000Z"
}
```

Prisma-specific errors (e.g. unique constraint violations) are caught by a dedicated `PrismaExceptionFilter` and translated into meaningful HTTP responses.

---

## Technical Decisions & Trade-offs

### Framework — NestJS

**Decision:** NestJS was chosen over plain Express or Fastify.

| Consideration | Detail |
|---|---|
| Opinionated structure | Enforces a modular architecture (modules, controllers, services, guards, interceptors, filters) via decorators — the codebase scales predictably. |
| First-class TypeScript | Built for TypeScript from the ground up; full type-safety across the request/response lifecycle. |
| DI container | Built-in dependency injection removes manual wiring boilerplate. |
| Ecosystem | `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler` all drop in without configuration friction. |

**Trade-off:** The decorator/DI pattern adds abstraction that can obscure execution flow for developers unfamiliar with Angular-style architecture. A bare Express server would have less boilerplate for a small project, but would not scale as cleanly.

---

### Database — PostgreSQL

**Decision:** PostgreSQL was chosen over a NoSQL alternative (e.g. MongoDB).

| Consideration | Detail |
|---|---|
| ACID compliance | Financial data demands strong consistency guarantees. Every transaction (insert/update/delete) is rolled back on failure — no partial writes. |
| Relational integrity | Foreign keys between `User → Role`, `RolePermission → Role/Permissions`, and `TransactionEntry → Category` are enforced at the database level, not just the application layer. |
| Analytical queries | Dashboard aggregations (SUM, GROUP BY month, category breakdown) are expressed naturally in SQL. PostgreSQL's query planner optimises these efficiently. |
| Index support | Composite index on `(type, categoryId, date)` directly supports the most common dashboard filter patterns. |

**Trade-off:** PostgreSQL requires a running server and migration management. A document store like MongoDB would have a simpler schema-evolution story, but eventual consistency is unacceptable for monetary records.

---

### ORM — Prisma

**Decision:** Prisma was chosen over TypeORM or raw pg.

| Consideration | Detail |
|---|---|
| Type-safe queries | The generated client provides fully typed query results — no `as any` casting. |
| Schema as source of truth | `prisma/schema.prisma` is the single authoritative definition of the data model; the client and migration SQL are derived from it. |
| Migration tooling | `prisma migrate dev` tracks schema history, generates idempotent SQL, and keeps the generated client in sync automatically. |

**Trade-off:**
- Prisma does not support all SQL aggregations via its fluent API (e.g. `SUM` across joined fields). The dashboard service uses `$queryRaw` for these cases, which means manual dollars-to-cents conversion (`/ 100`) outside the Prisma extension.
- The Prisma extension (in `DatabaseService`) that intercepts `create` to multiply amounts by 100 and `findMany` to divide by 100 is invisible to callers — a developer reading a service file cannot see the conversion without knowing the extension exists.

---

### Authentication — Stateless JWT

**Decision:** JWT tokens (via `@nestjs/jwt` + Passport.js) with no server-side session store.

| Consideration | Detail |
|---|---|
| Horizontal scalability | Any API instance can verify a token without a shared session store. |
| Simplicity | No Redis/database session table to maintain. |
| Standard | Bearer token pattern is well understood and compatible with any HTTP client. |

**Trade-off:** JWTs cannot be invalidated before they expire (short of maintaining a denylist). If a token is compromised, it remains valid until `JWT_EXPIRY` elapses. Mitigation is to keep expiry short and use HTTPS.

---

### Access Control — RBAC via Permission Codes

**Decision:** A flexible `Role → RolePermission → Permissions` model instead of hardcoded role checks.

| Consideration | Detail |
|---|---|
| Flexibility | New permissions can be created and assigned to roles at runtime without code changes. |
| Granularity | Each route declares exactly which permission codes it requires via `@Permissions(...)`. |
| Auditability | The `RolePermission` table is a clear record of what each role may do. |

**Trade-off:** Every authenticated (non-admin) request hits the database to fetch the user's role permissions. The `PermissionsGuard` short-circuits for `admin` to skip the permission lookup, but all other roles pay this cost. Caching role permissions (e.g. in Redis or a short-lived in-memory map) would eliminate this per-request query.

---

### Monetary Storage — Integer Cents

**Decision:** `TransactionEntry.amount` is stored as an integer (cents) in the database rather than a floating-point `DECIMAL`.

| Consideration | Detail |
|---|---|
| Precision | Floating-point arithmetic is inherently imprecise for base-10 fractions. `0.1 + 0.2 !== 0.3` in JavaScript. Integers have no rounding error. |
| Performance | Integer comparison and summation are cheaper than arbitrary-precision arithmetic. |

**Trade-off:** The conversion (×100 on write, ÷100 on read) is done inside a Prisma extension in `DatabaseService`. This makes it invisible at the service/controller layer. Dashboard `$queryRaw` calls bypass extensions entirely and must divide by 100 manually, creating a hidden contract between the extension and raw SQL code. Any developer adding a new `$queryRaw` aggregation must know this convention.

---

### Rate Limiting — Two Named Throttlers

**Decision:** `@nestjs/throttler` with two named throttlers: `default` (100 req / 60 s globally) and `auth` (5 req / 60 s on the login endpoint).

| Consideration | Detail |
|---|---|
| Separation of concerns | The stricter limit on `/auth/login` protects against brute-force credential stuffing without penalising normal API usage. |
| Declarative | Per-route overrides are a single decorator (`@Throttle({ auth: { ... } })`) rather than custom middleware. |
| Zero infrastructure | The default in-memory store requires no additional dependencies. |

**Trade-off:** The in-memory throttle store is local to each process — rate-limit counters are lost on restart and are not shared across multiple instances. For a multi-instance production deployment, the throttler storage should be replaced with a Redis adapter (`ThrottlerStorageRedisService`).

---

### Global Guard / Filter / Interceptor Pattern

**Decision:** `ThrottlerGuard`, `JwtAuthGuard`, and `PermissionsGuard` are registered as global `APP_GUARD` providers (in that order). `TransformInterceptor`, `GlobalExceptionFilter`, and `PrismaExceptionFilter` are also global.

| Consideration | Detail |
|---|---|
| Uniform behaviour | Every route automatically gets rate-limiting, authentication, permission checks, response wrapping, and error normalisation — no per-controller wiring. |
| Single source of truth | Security policy is defined once in `AppModule`, not scattered across controllers. |

**Trade-off:** Opting *out* requires explicit decorator escape hatches (`@Public()` to bypass JWT, `@SkipThrottle()` to bypass rate limiting). A developer adding a new public endpoint must remember to add `@Public()` or the endpoint will return 401.

---

### Modular Architecture

**Decision:** Each domain (auth, user, category, transaction, dashboard, permission) is a self-contained NestJS feature module with its own controller, service, and DTOs.

| Consideration | Detail |
|---|---|
| Separation of concerns | Business logic for each domain is isolated; changes to `TransactionService` cannot accidentally break `CategoryService`. |
| Testability | Modules can be individually bootstrapped in tests with only their dependencies. |
| Scalability | Feature modules can be extracted into separate microservices if the application outgrows a monolith. |

**Trade-off:** The module/controller/service/DTO pattern generates more files and boilerplate than a flat Express router approach. For a very small API this overhead is disproportionate, but it pays off as the codebase grows.

---
