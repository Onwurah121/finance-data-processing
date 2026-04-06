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
