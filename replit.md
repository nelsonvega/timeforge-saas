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
- Current schema includes basic user table with UUID primary keys

**Data Access Pattern:**
- Storage interface abstraction allows switching between in-memory and database implementations
- Current implementation uses in-memory Map structures
- Database-ready with connection pool established but not yet utilized in storage layer

### Authentication and Authorization Mechanisms

**Implementation:**
- Replit Auth with OAuth 2.0 / OpenID Connect (supports Google, GitHub, Apple, X, and email/password)
- Session-based authentication using Passport.js with openid-client strategy
- PostgreSQL session store via connect-pg-simple with 7-day session TTL
- Automatic session refresh with refresh tokens to maintain user sessions
- Universal route protection: all `/api/*` endpoints require authentication except `/login`, `/callback`, `/logout`

**Database Schema:**
- `sessions` table for session persistence with expiration index
- `users` table includes OAuth profile fields: `email`, `firstName`, `lastName`, `profileImageUrl`
- Legacy fields maintained for backward compatibility: `username`, `password`, `name`, `role`, `hourlyRate`
- `upsertUser` operation handles OAuth user creation/updates on login

**Frontend Flow:**
- `useAuth` hook provides `user`, `isLoading`, and `isAuthenticated` state
- App-level authentication guard in `App.tsx` redirects unauthenticated users to `/login`
- Loading state displayed during auth check
- Login page redirects to `/api/login` which triggers OAuth flow
- After successful auth, user redirected to home page

**Backend Flow:**
- `server/replitAuth.ts` configures Passport strategies for each Replit domain
- `isAuthenticated` middleware checks session validity and refreshes tokens if needed
- `GET /api/auth/user` returns current user profile from database
- All protected routes return 401 for unauthenticated requests

**Security Considerations:**
- Environment-based configuration via `ISSUER_URL`, `REPL_ID`, `SESSION_SECRET`, `DATABASE_URL`
- Secure cookies with httpOnly, secure flags, and 7-day maxAge
- Trust proxy enabled for proper secure cookie handling in Replit environment
- OIDC discovery with memoization (1-hour cache) for performance

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