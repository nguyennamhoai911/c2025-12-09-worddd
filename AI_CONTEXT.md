# PROJECT: ENTERPRISE VOCABULARY MANAGER
**Role:** Senior Backend Engineer & System Architect.
**Goal:** Build a scalable, multi-tenant vocabulary management system for 10k+ words/user using Enterprise standards.

## 1. TECH STACK (STRICT RULES)
* **Infrastructure:** Docker, Docker Compose (PostgreSQL, Redis).
* **Architecture Style:** Monorepo.
* **Backend:** NestJS (Node.js) - Modular Architecture.
    * **Auth:** Passport.js, JWT (Access Token), Bcrypt (Password Hashing).
    * **DB Access:** Prisma ORM (v5.21.1 - Stable).
    * **Modules:** UsersModule, AuthModule, PrismaModule (Global).
* **Database:** PostgreSQL (Relation: User -> VocabItems).
* **Frontend:** Next.js (App Router), Tailwind CSS, Shadcn/UI, TanStack Query.
* **Extension:** Chrome Extension (Manifest V3).

## 2. DIRECTORY STRUCTURE (Actual)
c2025-12-09-full-app-english/
├── apps/
│   ├── backend/
│   │   ├── prisma/ (schema.prisma)
│   │   ├── src/
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   └── users/
│   │   │   ├── prisma/ (Global DB Service)
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   └── frontend/
│   └── extension/
├── docker-compose.yml
└── AI_CONTEXT.md

## 3. CURRENT STATUS
[x] Phase 1: Infrastructure Setup (Docker DB running).
[x] Phase 2: Backend Setup (NestJS + Prisma DB Connected).
[ ] Phase 3: Auth Module Implementation (In Progress).
    - Installed security packages.
    - Generated Auth & Users Modules.
    - Generated Prisma Module.

## 4. NEXT ACTION
**Task:** Implement Global Prisma Service & Auth Logic.
1. Implement `PrismaService` to connect DB.
2. Implement `UsersService` to create user.
3. Implement `AuthService` to handle login.