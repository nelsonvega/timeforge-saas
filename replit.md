# Multi-Tenant Time Tracking System

## Overview

This is a multi-tenant time tracking SaaS application designed for agencies, consulting firms, and teams to track billable and non-billable hours across clients and projects. The system provides comprehensive time management, project tracking, client management, team collaboration, and reporting capabilities with complete tenant isolation.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework & Core Technologies:**
- React 18 with TypeScript for type-safe component development
- Vite as the build tool and development server
- Wouter for lightweight client-side routing
- TanStack Query (React Query) for server state management and data fetching

**UI Framework:**
- Shadcn/ui component library (New York style variant) with Radix UI primitives
- Tailwind CSS for utility-first styling with custom design system
- CSS variables for theme customization supporting light/dark modes
- Design approach inspired by Linear and Material Design, prioritizing information clarity and professional appearance for B2B users

**State Management:**
- React Query for server state with custom `queryClient` configuration
- Local component state with React hooks
- Custom `ThemeProvider` context for theme management

**Design System:**
- Professional blue primary color (HSL: 220 90% 56%)
- Comprehensive neutral color scale for light/dark modes
- Status colors for success, warning, and error states
- Custom border radius values (9px, 6px, 3px)
- Elevated interaction states with hover and active effects
- Inter font family for interface text, JetBrains Mono for monospace/code

### Backend Architecture

**Server Framework:**
- Express.js as the HTTP server framework
- TypeScript for type safety across the backend
- Custom middleware for request logging and error handling
- Session-based architecture preparation (connect-pg-simple dependency present)

**API Design:**
- RESTful API structure with `/api` prefix convention
- Storage interface pattern for data access abstraction
- In-memory storage implementation (`MemStorage`) as the current data layer
- Extensible storage interface (`IStorage`) designed for future database integration

**Module Organization:**
- `server/routes.ts` - Route registration and HTTP server setup
- `server/storage.ts` - Data access layer with interface-based design
- `server/db.ts` - Database connection pool using Neon serverless PostgreSQL
- `server/vite.ts` - Development server integration with HMR support

### Data Storage Solutions

**Database:**
- PostgreSQL via Neon serverless platform (@neondatabase/serverless)
- Drizzle ORM for type-safe database queries and schema management
- Connection pooling for efficient resource utilization
- WebSocket-based connections (ws library) for serverless compatibility

**Schema Management:**
- Drizzle Kit for migrations (output directory: `./migrations`)
- Schema definition in `shared/schema.ts` for sharing between client and server
- Zod schema validation using drizzle-zod integration
- Tables: `users`, `tenants`, `workspaces`, `workspace_memberships`, `clients`, `projects`, `time_entries`, `project_assignments`, `sessions`
- All tables use UUID primary keys via `gen_random_uuid()`
- Composite indexes on workspace+status for efficient filtering

**Database Initialization Wizard:**
- Automatic database setup on server startup via `server/db-wizard.ts`
- Checks for existing tables using information_schema queries
- Auto-creates all tables if database is empty using `npm run db:push --force`
- Automatically applies schema updates on existing databases
- Verifies database connection with health check
- Displays colored status messages during startup
- Handles errors gracefully with actionable logging
- Server waits for database initialization before accepting requests

**Data Access Pattern:**
- Storage interface abstraction with workspace context filtering
- Database implementation using Drizzle ORM with complete data isolation
- All business entities (clients, projects, time entries) scoped to workspaces

**Multi-Tenant Architecture:**
- Tenant→Workspace→Membership domain model with complete data isolation
- Tables: `tenants`, `workspaces`, `workspace_memberships`
- All business tables include `workspaceId` foreign key with cascading deletes
- Workspace middleware validates membership before processing requests
- Role-based permissions moved from global `users.role` to per-workspace `workspace_memberships.role`
- Users can belong to multiple workspaces with different roles in each

**Plan & Subscription Management:**
- Two plan types: "free" and "paid" ($15 one-time payment)
- Tenant-level plan assignment stored in `tenants.plan` field
- Stripe integration for payment processing (via Stripe Elements)
- Payment flow: Register → Select Plan → (If paid) Complete Payment → Create Account
- Tenants table includes Stripe customer/subscription tracking: `stripeCustomerId`, `stripeSubscriptionId`
- Free plan users skip payment, paid plan users complete Stripe checkout during signup
- Registration creates: User (as admin) → Tenant (with plan) → Default Workspace → Workspace Membership

### Authentication and Authorization Mechanisms

**Authentication Implementation:**
- **Dual Authentication System**: Custom email/password login AND Google OAuth via Replit Auth
- **Local Authentication**: Passport.js Local Strategy with bcrypt password hashing (10 rounds)
- **OAuth Authentication**: Replit Auth with OAuth 2.0 / OpenID Connect (Google, GitHub, Apple, X)
- Session-based authentication using Passport.js with both strategies
- PostgreSQL session store via connect-pg-simple with 7-day session TTL
- Automatic session refresh with refresh tokens for OAuth sessions
- Universal route protection: all `/api/*` endpoints require authentication except `/login`, `/callback`, `/logout`, `/auth/login`, `/auth/register`
- **Automatic Tenant & Workspace Creation**: Both local registration and OAuth signup automatically create a default tenant and "Main Workspace" for new users, assigning them as workspace owner (highest privilege level)

**Role-Based Access Control (RBAC):**
- Four role levels: `owner`, `admin`, `manager`, and `member`
- Backend middleware (`requireRole`) protects API endpoints based on user role
- Frontend permissions hook (`usePermissions`) controls UI visibility and route access
- Dynamic sidebar navigation that shows/hides menu items based on role
- Route guards redirect unauthorized users to appropriate default pages

**Role Permissions:**
- **Owner**: Highest privilege level assigned to account creator - full access to all features including settings regardless of plan
- **Admin & Manager**: Full access to dashboard, projects, clients, team, and reports
- **Member**: Access restricted to time tracker only (and settings for paid plans)
- Time tracking functionality available to all roles

**Plan-Based Feature Access:**
- **Free Plan**: Access to tracker only
- **Paid Plan**: Access to tracker and settings
- Settings page is hidden from free plan users in the sidebar

**Database Schema:**
- `sessions` table for session persistence with expiration index
- `users` table includes OAuth profile fields: `email`, `firstName`, `lastName`, `profileImageUrl`, `role`
- Role stored in `role` field with default value of "member"
- `upsertUser` operation handles OAuth user creation/updates on login

**Frontend Flow:**
- `useAuth` hook provides `user`, `isLoading`, and `isAuthenticated` state
- `usePermissions` hook provides role-based access flags and user role information
- App-level authentication guard in `App.tsx` redirects unauthenticated users to `/login`
- Protected routes redirect unauthorized users to `/tracker` (their default landing page)
- Login page redirects to dashboard for admin/manager or tracker for members after authentication
- Sidebar dynamically filters menu items based on user permissions

**Backend Flow:**
- `server/replitAuth.ts` configures Passport strategies for each Replit domain
- `isAuthenticated` middleware validates session, refreshes tokens if needed, loads full user record with role
- `requireRole` middleware checks user role and returns 403 Forbidden for unauthorized access
- `GET /api/auth/user` returns sanitized user profile (id, email, name, profileImageUrl, role)
- Protected routes return 401 for unauthenticated requests, 403 for unauthorized role access

**Security Considerations:**
- Environment-based configuration via `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`
- Secure cookies with httpOnly, secure flags, and 7-day maxAge
- Trust proxy enabled for proper secure cookie handling in Replit environment
- OIDC discovery with memoization (1-hour cache) for performance
- Session tokens preserved during role validation to maintain refresh capability
- User role loaded from database on every request for accurate authorization

### External Dependencies

**UI Component Libraries:**
- Radix UI primitives for accessible, unstyled components (accordion, dialog, dropdown, select, tooltip, etc.)
- Recharts for data visualization (charts and graphs)
- React Day Picker for calendar/date selection
- CMDK for command palette functionality
- Lucide React for icon system

**Utility Libraries:**
- class-variance-authority for component variant management
- clsx and tailwind-merge for conditional className composition
- date-fns for date manipulation and formatting
- nanoid for generating unique identifiers

**Development Tools:**
- Replit-specific plugins for development experience (cartographer, dev banner, runtime error overlay)
- TSX for running TypeScript in development
- esbuild for production builds
- Drizzle Kit for database migrations

**Database & Infrastructure:**
- Neon serverless PostgreSQL as the managed database platform
- WebSocket support for real-time database connections
- Environment variable configuration for database URLs

**Form Management:**
- React Hook Form (@hookform/resolvers) for form state and validation
- Zod schemas for validation rules shared between client and server

**Payment Processing:**
- Stripe (@stripe/stripe-js, @stripe/react-stripe-js) for payment collection
- Stripe Elements for secure card input and payment confirmation
- Payment Intent API for one-time payments ($15 paid plan)
- Client-side payment confirmation with redirect_if_required flow
- Backend payment verification and tenant upgrade on successful payment