---
noteId: "c989bf30aaac11f08d91090a55325676"
tags: []

---

# PLANNING.md

## Vision & Product Strategy

### Product Vision

TimeTrack (Focus Flow) is a professional time tracking SaaS platform designed for agencies, consulting firms, and teams who need to track billable and non-billable hours with complete data isolation and workspace-based collaboration.

### Target Users

- **Agencies & Consulting Firms**: Teams billing clients by the hour
- **Professional Services**: Lawyers, accountants, consultants tracking client work
- **Product Teams**: Internal time tracking for project management
- **Freelancers**: Individual professionals managing multiple clients

### Core Value Propositions

1. **Multi-Tenant Architecture**: Complete data isolation with workspace-based organization
2. **Flexible Access Control**: Role-based permissions (Admin, Manager, Member)
3. **Dual Authentication**: Email/password for internal teams, OAuth for easy onboarding
4. **Plan-Based Monetization**: Free tier for basic tracking, paid tier ($15) for advanced features
5. **Enterprise Ready**: Workspace memberships, cross-workspace support, audit trails

### Business Model

- **Free Plan**: Single workspace, basic time tracking, unlimited users
- **Paid Plan**: $15 one-time payment per organization
  - Full dashboard and analytics
  - Advanced reporting
  - Client and project management
  - Team collaboration features
  - Settings and customization

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  React 18 + TypeScript + Vite + TanStack Query + Wouter    │
│  Shadcn/ui + Radix UI + Tailwind CSS + Framer Motion       │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ HTTP/WebSocket
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      Application Layer                       │
│     Express.js + TypeScript + Passport.js + Sessions       │
│              Middleware: Auth, Workspace, RBAC              │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ Drizzle ORM
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│    PostgreSQL (Local/Network/Neon) + Session Store         │
│         Indexes, Constraints, Cascading Deletes             │
└─────────────────────────────────────────────────────────────┘
                              │
                              │ External APIs
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    External Services                         │
│         Stripe (Payments) + Replit Auth (OAuth)             │
└─────────────────────────────────────────────────────────────┘
```

### Data Architecture

#### Multi-Tenant Hierarchy

```
Organization (Tenant)
    ├── plan: "free" | "paid"
    ├── stripeCustomerId
    └── Workspaces[]
         ├── name, slug, timezone
         ├── Memberships[]
         │    ├── User + Role (admin/manager/member)
         │    └── invitedBy, joinedAt
         └── Business Data (workspace-scoped)
              ├── Clients
              ├── Projects
              ├── Time Entries
              └── Project Assignments
```

**Key Architectural Decisions:**

1. **Workspace as Context**: All business operations scoped to workspace
2. **User-Workspace Relationship**: Many-to-many via memberships table
3. **Role at Membership Level**: User can have different roles in different workspaces
4. **Cascading Deletes**: Referential integrity maintained through foreign keys
5. **Complete Isolation**: No cross-workspace data leakage possible

### Authentication Architecture

#### Dual Strategy Implementation

**Strategy 1: Local Authentication (Passport Local)**
- User registers with email + password
- Password hashed with bcrypt (10 rounds)
- Session established on successful login
- Session user: `{ id, email, name, role, isLocalAuth: true }`

**Strategy 2: OAuth (OpenID Connect via Replit)**
- User authenticates with Google
- ID token validated and claims extracted
- User upserted based on `sub` (subject identifier)
- Session with access token + refresh token
- Automatic token refresh on expiration
- Session user: `{ claims, access_token, refresh_token, expires_at }`

**Session Management:**
- **Production**: PostgreSQL-backed sessions (connect-pg-simple)
- **Development**: Automatic fallback to in-memory sessions if DB unavailable
- **Security**: httpOnly cookies, secure flag in production, 7-day TTL
- **Cross-domain**: SameSite=lax for OAuth flow support

### Permission System Architecture

#### Three-Layer Permission Model

**Layer 1: Role-Based Access (Workspace-level)**
```typescript
Roles: admin, manager, member

Permissions Matrix:
- Dashboard/Analytics: admin, manager
- Projects/Clients: admin, manager
- Team Management: admin, manager
- Reports: admin, manager
- Time Tracker: all roles
- Settings: all roles (when plan allows)
```

**Layer 2: Plan-Based Access (Tenant-level)**
```typescript
Free Plan: Time tracker only
Paid Plan: All features unlocked
```

**Layer 3: Resource Ownership**
- Users can only modify their own time entries
- Admins can modify team members' entries
- Managers have read access to team data

#### Permission Enforcement

**Client-Side:**
```typescript
usePermissions() hook:
  ├── Wait for auth loading
  ├── Wait for workspace context
  ├── Fetch workspace details (includes tenant plan)
  ├── Calculate permissions based on role + plan
  └── Return { canAccess*, isLoading }

Route Guards:
  ├── Check isLoading first
  ├── Redirect if !permission && !isLoading
  └── Render null while loading
```

**Server-Side:**
```typescript
Middleware Stack:
  1. isAuthenticated() - Verify session
  2. requireWorkspace() - Validate membership
  3. requireRole(...roles) - Check role permission
  4. Route handler - Business logic
```

### Payment Integration Architecture

#### Stripe Integration Flow

```
Registration (Paid Plan Selected)
    ├── Create User + Tenant (plan="free")
    ├── Create Default Workspace + Membership
    ├── User Auto-Login
    └── Return selectedPlan="paid"
         │
         ▼
    Create Payment Intent
         ├── Amount: $15.00
         ├── Metadata: { tenantId, userId }
         └── Return clientSecret
              │
              ▼
         Frontend Payment
              ├── Stripe Elements UI
              ├── User enters card details
              └── Stripe confirms payment
                   │
                   ▼
              Backend Confirmation
                   ├── Retrieve PaymentIntent from Stripe
                   ├── Validate metadata matches session
                   ├── Verify user is admin of tenant
                   ├── Create/retrieve Stripe customer
                   └── Upgrade tenant to plan="paid"
```

**Security Measures:**
- Tenant ID in payment metadata prevents privilege escalation
- User ID validation ensures payment by authorized user
- Admin-only access to payment endpoints
- Idempotent payment confirmation (won't double-charge)
- Lazy-loaded Stripe client (optional for free-only deployments)

### Database Architecture

#### Adaptive Driver Strategy

```typescript
Database Connection Logic:
  ├── Check DATABASE_URL
  ├── Detect database type:
  │    ├── Contains "neon.tech" or "neon.dev"?
  │    │    └── Use @neondatabase/serverless (WebSocket)
  │    └── Otherwise
  │         └── Use pg (Standard PostgreSQL)
  ├── Configure SSL:
  │    ├── localhost/127.0.0.1? → No SSL
  │    ├── sslmode=require in URL? → SSL enabled
  │    └── DB_SSL=true? → SSL enabled
  └── Create connection pool with error handling
```

**Pool Configuration:**
- Max connections: 20
- Idle timeout: 30 seconds
- Connection timeout: 10 seconds
- Error event handling for idle clients

**Migration Strategy:**
- Schema defined in `shared/schema.ts` using Drizzle ORM
- Migrations generated automatically: `npm run db:push`
- Automatic initialization on server start (with graceful fallback)
- Test script available: `npm run db:test`

#### Schema Design Principles

1. **UUIDs for Primary Keys**: Globally unique, non-enumerable
2. **Timestamps on All Tables**: createdAt, updatedAt for audit trails
3. **Soft Deletes Where Needed**: Status fields (active/inactive/archived)
4. **Indexed Foreign Keys**: All FK columns have indexes for join performance
5. **Workspace Scoping**: Every business table has workspaceId + index

## Technology Stack

### Frontend Stack

#### Core Framework
- **React 18.3** - UI library with concurrent features
- **TypeScript 5.6** - Type safety and developer experience
- **Vite 5.4** - Build tool with fast HMR and optimized production builds

#### State Management
- **TanStack Query 5.60** - Server state management
  - Automatic caching and deduplication
  - Background refetching
  - Optimistic updates
  - Request cancellation
- **React Context** - Workspace selection, authentication state

#### Routing
- **Wouter 3.3** - Lightweight routing (2KB)
  - Hook-based API
  - No dependencies
  - Server-side rendering ready

#### UI Components
- **Shadcn/ui** - Accessible component primitives
- **Radix UI** - Unstyled, accessible UI primitives
  - Dialog, Dropdown, Popover, Toast, etc.
  - ARIA-compliant
  - Keyboard navigation
- **Tailwind CSS 3.4** - Utility-first CSS framework
- **Framer Motion 11.13** - Animation library

#### Forms & Validation
- **React Hook Form 7.55** - Performant form library
- **Zod 3.24** - Schema validation
- **@hookform/resolvers** - Zod + React Hook Form integration

#### Charts & Visualizations
- **Recharts 2.15** - React charting library
- **Lucide React 0.453** - Icon library

#### Payment Integration
- **@stripe/stripe-js 8.0** - Stripe client SDK
- **@stripe/react-stripe-js 5.0** - React components for Stripe

### Backend Stack

#### Core Framework
- **Express.js 4.21** - Web application framework
- **TypeScript 5.6** - Type-safe server code
- **tsx 4.20** - TypeScript execution for development

#### Authentication
- **Passport.js 0.7** - Authentication middleware
- **passport-local 1.0** - Email/password strategy
- **openid-client 6.8** - OAuth/OIDC client
- **bcrypt 6.0** - Password hashing
- **express-session 1.18** - Session middleware
- **connect-pg-simple 10.0** - PostgreSQL session store
- **memorystore 1.6** - In-memory session fallback

#### Database
- **Drizzle ORM 0.39** - Type-safe ORM
- **drizzle-kit 0.31** - Schema migrations
- **drizzle-zod 0.7** - Zod schema generation
- **@neondatabase/serverless 0.10** - Neon driver
- **pg 8.16** - PostgreSQL driver
- **ws 8.18** - WebSocket client for Neon

#### Payment Processing
- **Stripe 19.0** - Payment processing SDK

#### Utilities
- **dotenv 17.2** - Environment variable loading
- **memoizee 0.4** - Function memoization (OIDC config caching)
- **zod-validation-error 3.4** - Human-readable Zod errors

### Development Tools

#### Build Tools
- **Vite 5.4** - Frontend build and dev server
- **esbuild 0.25** - Backend bundling for production
- **cross-env 10.1** - Cross-platform environment variables

#### Type Checking
- **TypeScript 5.6** - Static type checking
- **@types/* packages** - Type definitions for libraries

#### Testing
- **Vitest 3.2** - Test runner and framework
- **@vitest/ui** - Visual test interface
- **@vitest/coverage-v8** - Code coverage
- **@testing-library/react 16.3** - React component testing
- **@testing-library/user-event 14.6** - User interaction simulation
- **@testing-library/jest-dom 6.9** - DOM matchers
- **happy-dom 19.0** - Lightweight DOM implementation
- **supertest 7.1** - HTTP API testing

#### Linting & Formatting
- **ESLint** (via Vite plugins) - Code linting
- **Tailwind CSS** - Style consistency

#### Replit-Specific
- **@replit/vite-plugin-cartographer** - Code navigation
- **@replit/vite-plugin-dev-banner** - Development banner
- **@replit/vite-plugin-runtime-error-modal** - Error overlay

### Shared Libraries

#### Schema & Validation
- **Zod 3.24** - Runtime type validation
- **Drizzle Zod 0.7** - Schema-to-Zod generation

#### Utilities
- **date-fns 3.6** - Date manipulation
- **clsx 2.1** - Conditional className utility
- **tailwind-merge 2.6** - Merge Tailwind classes
- **class-variance-authority 0.7** - Component variant management

## Required Tools & Environment

### Development Environment

#### Required Software
- **Node.js 20+** - JavaScript runtime
- **npm** - Package manager (comes with Node.js)
- **PostgreSQL 15+** - Database server (or use Neon cloud)
- **Git** - Version control

#### Recommended Tools
- **Visual Studio Code** - Code editor
- **PostgreSQL Client** - pgAdmin, TablePlus, or psql CLI
- **Postman/Insomnia** - API testing
- **Stripe CLI** - Payment testing (optional)

### Environment Variables

#### Required
```env
DATABASE_URL=postgresql://user:pass@host:5432/database
SESSION_SECRET=<cryptographically-random-string>
```

#### Optional (for full features)
```env
# Stripe Payments
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLIC_KEY=pk_test_...

# OAuth/OIDC
REPL_ID=<replit-app-id>
ISSUER_URL=https://replit.com/oidc
REPLIT_DOMAINS=<comma-separated-domains>

# Server Configuration
PORT=5000
HOST=localhost
NODE_ENV=development
```

#### Optional (advanced database config)
```env
# SSL Configuration
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false

# PostgreSQL Individual Parameters (alternative to DATABASE_URL)
PGHOST=localhost
PGPORT=5432
PGUSER=dbuser
PGPASSWORD=dbpass
PGDATABASE=dbname
```

### Database Setup Options

#### Option 1: Local PostgreSQL
```bash
# Install PostgreSQL
# macOS: brew install postgresql@15
# Ubuntu: apt install postgresql postgresql-contrib
# Windows: Download installer from postgresql.org

# Create database and user
createdb FocusFlow
psql -c "CREATE USER ff_user WITH PASSWORD 'your_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE FocusFlow TO ff_user;"
```

#### Option 2: Docker PostgreSQL
```bash
docker run -d \
  --name timetrack-postgres \
  -e POSTGRES_USER=ff_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=FocusFlow \
  -p 5432:5432 \
  postgres:15-alpine
```

#### Option 3: Neon Serverless (Cloud)
- Sign up at [neon.tech](https://neon.tech)
- Create project and database
- Copy connection string with `?sslmode=require`

### Deployment Requirements

#### Replit Deployment
- Replit account with project published
- Environment variables configured in Replit Secrets
- PostgreSQL database (Neon recommended for Replit)

#### General Deployment Requirements
- Node.js 20+ runtime
- PostgreSQL database (local or cloud)
- HTTPS/SSL for production (secure cookies)
- Environment variables securely configured
- Build artifacts: `npm run build`
- Start command: `npm start`

## Development Workflow

### Initial Setup
```bash
# 1. Clone repository
git clone <repository-url>
cd timeforge-saas

# 2. Install dependencies
npm install

# 3. Configure environment
cp .env.example .env
# Edit .env with your database credentials

# 4. Test database connection
npm run db:test

# 5. Initialize database
npm run db:push

# 6. Start development server
npm run dev
```

### Common Development Tasks

#### Adding a New Feature
1. Design database schema changes in `shared/schema.ts`
2. Run `npm run db:push` to apply migrations
3. Create API endpoints in `server/routes.ts`
4. Add middleware for auth/workspace/role checks
5. Create React components in `client/src/components/`
6. Create page component in `client/src/pages/`
7. Add route to `client/src/App.tsx`
8. Update `usePermissions` if new permission needed
9. Write integration tests in `server/__tests__/`
10. Test end-to-end in browser

#### Database Schema Changes
```bash
# 1. Modify shared/schema.ts
# 2. Push changes
npm run db:push

# 3. Verify in database
npm run db:test
```

#### Running Tests
```bash
# Watch mode (recommended during development)
vitest

# Run once
vitest run

# With coverage
vitest run --coverage

# Visual UI
vitest --ui
```

## Future Roadmap

### Phase 1: Core Features (Current)
- ✅ Multi-tenant architecture
- ✅ Dual authentication (local + OAuth)
- ✅ Role-based permissions
- ✅ Workspace management
- ✅ Time tracking
- ✅ Basic reporting
- ✅ Stripe payment integration

### Phase 2: Enhanced Features (Next)
- [ ] Advanced reporting with custom date ranges
- [ ] Export functionality (CSV, PDF)
- [ ] Project budgets and tracking
- [ ] Time entry approval workflow
- [ ] Email notifications
- [ ] Recurring time entries
- [ ] Mobile-responsive improvements

### Phase 3: Team Collaboration (Future)
- [ ] Real-time collaboration (WebSocket)
- [ ] Team activity feed
- [ ] Comments on time entries
- [ ] @mentions and notifications
- [ ] Slack/Teams integration
- [ ] API for third-party integrations

### Phase 4: Enterprise Features (Later)
- [ ] SSO (SAML, LDAP)
- [ ] Custom branding
- [ ] Advanced audit logs
- [ ] Data export automation
- [ ] Custom fields
- [ ] Multi-language support
- [ ] Subscription-based billing (recurring)

## Architecture Decision Records

### ADR-001: Multi-Tenant Architecture
**Decision**: Use workspace-based multi-tenancy with tenant → workspace → membership hierarchy

**Rationale**:
- Clear data isolation boundaries
- Flexible organization structures
- User can belong to multiple organizations
- Role varies by workspace context

**Consequences**:
- All queries must include workspace context
- Middleware required for workspace validation
- More complex permission system

### ADR-002: Dual Database Driver Support
**Decision**: Auto-detect and switch between Neon and standard PostgreSQL drivers

**Rationale**:
- Neon requires WebSocket-based driver
- Local development needs standard PostgreSQL
- Automatic detection eliminates configuration burden

**Consequences**:
- Slightly more complex database connection code
- Need to test both driver paths
- Better developer experience overall

### ADR-003: Session Fallback Strategy
**Decision**: Use PostgreSQL sessions with memory fallback if DB unavailable

**Rationale**:
- Development should work without database setup
- Production requires persistent sessions
- Graceful degradation improves DX

**Consequences**:
- Development sessions lost on restart
- Need to test both session stores
- Production deployment requires database

### ADR-004: Dual Authentication Strategies
**Decision**: Support both local (email/password) and OAuth simultaneously

**Rationale**:
- Internal teams prefer email/password control
- External users want quick OAuth signup
- Different user personas have different preferences

**Consequences**:
- Complex authentication middleware
- Two separate session user structures
- More code paths to test

### ADR-005: Plan-Based Feature Gating
**Decision**: Implement plan-based permissions at tenant level, enforced client and server

**Rationale**:
- Simple monetization model
- Clear upgrade path for users
- Prevents feature leakage

**Consequences**:
- Need to check plan on every protected route
- Permission system more complex
- Frontend and backend must stay in sync

## Conclusion

TimeTrack is architected as a robust, scalable multi-tenant SaaS platform with clear separation of concerns, comprehensive security measures, and a flexible permission system. The dual authentication, adaptive database drivers, and session fallback mechanisms ensure it works smoothly across development and production environments.

The technology stack leverages modern best practices with type safety throughout (TypeScript + Drizzle + Zod), reactive state management (TanStack Query), and accessible UI components (Radix UI). The architecture supports future enhancements while maintaining data integrity and security through workspace isolation and role-based access control.
