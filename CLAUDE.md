---
noteId: "69c7e450aaac11f08d91090a55325676"
tags: []

---

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TimeTrack is a multi-tenant time tracking SaaS application with workspace-based data isolation, dual authentication (local + OAuth), role-based permissions, and Stripe payment integration. Built with React + TypeScript frontend and Express + Drizzle ORM backend.

## Essential Commands

### Development
```bash
npm run dev              # Start dev server on localhost:5000 (Vite + Express)
npm run build            # Build for production (frontend + backend)
npm run start            # Run production build
npm run check            # TypeScript type checking
```

### Database
```bash
npm run db:push          # Push schema changes to database (drizzle-kit)
npm run db:test          # Test database connection and show details
```

### Testing
```bash
vitest                   # Run tests in watch mode
vitest run              # Run tests once
vitest --coverage       # Run with coverage report
vitest --ui             # Open Vitest UI
```

Tests run sequentially to avoid database race conditions (configured in vitest.config.ts).

## Critical Architecture Patterns

### Multi-Tenant Data Hierarchy

**ALWAYS enforce this hierarchy when accessing data:**
```
Tenant (Organization)
  └─> Workspace (Team/Department)
       └─> Membership (User + Role)
            └─> Business Data (Clients, Projects, Time Entries)
```

**Key Rules:**
1. All business entities MUST have `workspaceId` foreign key
2. NEVER query business data without workspace context
3. User can belong to multiple workspaces with different roles
4. Role is determined by workspace membership, not user table

### Database Driver Detection

The application automatically detects and switches between database drivers (`server/db.ts:17-55`):

- **Neon databases** (URLs containing `neon.tech` or `neon.dev`): Uses `@neondatabase/serverless` with WebSocket
- **Local/Network PostgreSQL**: Uses standard `pg` driver with connection pooling
- **SSL Configuration**: Automatically enabled for non-localhost connections with `sslmode=require`

When modifying database connection logic, maintain this dual-driver pattern.

### Session Store Fallback

Sessions use PostgreSQL by default but automatically fall back to in-memory storage if database is unavailable (`server/replitAuth.ts:29-64`). This allows development without database setup but sessions won't persist across server restarts.

**When modifying auth:**
- Never remove the fallback mechanism
- Test both with and without database
- Cookie security is environment-aware: `secure` only in production

### Workspace Context Propagation

**Client-side:** WorkspaceContext must be available before rendering authenticated routes. The context:
1. Fetches user's workspaces via `/api/workspaces`
2. Auto-selects from localStorage or defaults to first workspace
3. Passes `x-workspace-id` header in all API requests

**Server-side:** Use `requireWorkspace` middleware to validate membership:
```typescript
router.get('/api/clients',
  isAuthenticated,           // Verify logged in
  requireWorkspace,          // Validate workspace membership
  async (req, res) => {
    // req.workspaceId and req.userRole are now available
  }
);
```

### Permission System Loading States

The `usePermissions` hook has complex loading coordination to prevent race conditions:
```typescript
const isLoading = authLoading || workspaceLoading || !selectedWorkspace?.id || isFetching;
```

**When adding protected routes:**
1. Always check `isLoading` before checking permissions
2. Return `null` or loading state while `isLoading === true`
3. Only redirect after `isLoading === false && !permission`
4. This prevents flickering and premature redirects

### Dual Authentication Strategies

Two completely different auth flows exist side-by-side:

**Local Auth (Passport Local):**
- Session user: `{ id, email, name, role, isLocalAuth: true }`
- Password validation via bcrypt
- Direct database user lookup

**OAuth (Replit/Google):**
- Session user: `{ claims, access_token, refresh_token, expires_at }`
- Token refresh on expiration
- User upserted from OIDC claims

**When modifying auth middleware (`isAuthenticated`):**
- Check `sessionUser.isLocalAuth` to determine strategy
- Handle both paths through to `next()`
- Never assume one auth type

### Payment Flow State Machine

Registration with paid plan follows this exact sequence:

1. **POST /api/auth/register**: Creates user + tenant (plan="free"), returns `selectedPlan: "paid"`
2. **POST /api/create-payment-intent**: Creates Stripe PaymentIntent with metadata `{tenantId, userId}`
3. **Frontend**: Stripe Elements confirms payment
4. **POST /api/confirm-payment**: Verifies PaymentIntent metadata matches session, upgrades tenant to `plan="paid"`

**Critical:** Payment confirmation MUST validate metadata.userId matches req.user.id to prevent privilege escalation.

### Type Safety Through Schema Generation

All database types flow from a single source (`shared/schema.ts`):

```typescript
// 1. Define Drizzle schema
export const clients = pgTable("clients", { ... });

// 2. Auto-generate Zod schemas
export const insertClientSchema = createInsertSchema(clients).omit({ id: true });

// 3. Infer TypeScript types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
```

**When adding new tables:**
1. Define schema in `shared/schema.ts`
2. Export both insert and select schemas
3. Add indexes for foreign keys and common queries
4. Run `npm run db:push` to sync

### API Request Pattern

All authenticated API requests use this pattern:

```typescript
// Client-side
const data = await apiRequest("POST", "/api/endpoint", body);

// Automatically includes:
// - credentials: 'include' (session cookie)
// - x-workspace-id header (from context)
// - JSON content-type
```

When adding new API routes, follow existing patterns in `server/routes.ts`:
- Public paths in publicPaths array (line 26)
- Workspace-scoped routes use `requireWorkspace` middleware
- Admin actions use `requireRole('admin', 'owner')`

### React Query Cache Invalidation

Mutations must invalidate related queries:

```typescript
const mutation = useMutation({
  mutationFn: (data) => apiRequest("POST", "/api/clients", data),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
    queryClient.invalidateQueries({ queryKey: ['/api/workspaces/${workspaceId}'] });
  }
});
```

Invalidate both the list endpoint and any detail endpoints affected.

## Testing Architecture

### Test Database Pattern

Tests use real database with automatic cleanup:

```typescript
// test/setup.ts creates/cleans test database
beforeEach(async () => {
  await resetDatabase(); // Truncates all tables
});
```

**When writing tests:**
- Use `test/helpers/database.ts` utilities
- Never mock the storage layer (test real queries)
- Use `test/helpers/fixtures.ts` for consistent test data
- Tests run sequentially (vitest.config.ts) to avoid conflicts

### Integration Test Structure

```typescript
describe("Feature", () => {
  let testUser, testWorkspace, testMembership;

  beforeEach(async () => {
    const setup = await setupTestUser();
    testUser = setup.user;
    testWorkspace = setup.workspace;
    testMembership = setup.membership;
  });

  it("should enforce workspace isolation", async () => {
    // Create data in testWorkspace
    // Verify other workspace can't access it
  });
});
```

## Common Pitfalls

### ❌ Don't: Query without workspace context
```typescript
// BAD
const clients = await db.select().from(clients);
```

### ✅ Do: Always filter by workspaceId
```typescript
// GOOD
const clients = await db.select()
  .from(clients)
  .where(eq(clients.workspaceId, workspaceId));
```

### ❌ Don't: Check permissions before loading complete
```typescript
// BAD - causes flickering
if (!canAccessSettings) {
  redirect('/tracker');
}
```

### ✅ Do: Wait for loading state
```typescript
// GOOD
if (!isLoading && !canAccessSettings) {
  redirect('/tracker');
}
```

### ❌ Don't: Trust client-provided IDs without validation
```typescript
// BAD
const tenantId = req.body.tenantId;
await storage.upgradeTenant(tenantId);
```

### ✅ Do: Derive from authenticated session
```typescript
// GOOD
const membership = await storage.getWorkspaceMembership(workspaceId, req.user.id);
const tenantId = membership.workspace.tenantId;
```

## Environment Configuration

### Database URLs
- Local: `postgresql://user:pass@localhost:5432/db`
- Network: `postgresql://user:pass@host:5432/db?sslmode=require`
- Neon: `postgresql://user:pass@ep-xxx.neon.tech/db?sslmode=require`

See `docs/DATABASE_SETUP.md` for detailed configuration including SSL, connection pooling, and troubleshooting.

### Required Environment Variables
- `DATABASE_URL` - PostgreSQL connection string
- `SESSION_SECRET` - Cryptographically random string for session encryption
- `STRIPE_SECRET_KEY`, `VITE_STRIPE_PUBLIC_KEY` - Payment processing (optional for free-only)
- `REPL_ID`, `ISSUER_URL`, `REPLIT_DOMAINS` - OAuth configuration (optional if only using local auth)

### Development vs Production
- Cookie `secure` flag: false in development, true in production
- Session store: Falls back to memory in development if DB unavailable
- Host binding: `localhost` in development, configurable via `HOST` env var

## File Organization Logic

### Backend (`server/`)
- `index.ts` - Express app initialization, middleware setup
- `routes.ts` - All API endpoints and middleware composition
- `replitAuth.ts` - Passport strategies (local + OAuth), session config
- `storage.ts` - Data access layer (implements IStorage interface)
- `db.ts` - Database connection with driver detection
- `middleware/` - Reusable route middleware (workspace, authorization)

### Frontend (`client/src/`)
- `pages/` - Route components (one per URL)
- `components/` - Reusable UI components
- `hooks/` - Custom hooks (useAuth, usePermissions, useWorkspace)
- `contexts/` - React context providers (WorkspaceContext)
- `lib/` - Utilities (queryClient, apiRequest)

### Shared (`shared/`)
- `schema.ts` - Single source of truth for database schema, types, and validation

## Documentation
- `docs/DATABASE_SETUP.md` - Complete database configuration guide
- `docs/DATABASE_EXAMPLES.md` - Connection string examples for all scenarios
- `docs/IMPLEMENTATION.md` - Detailed technical architecture (read this for deep dives)
- `docs/TESTING.md` - Testing patterns and examples
- `docs/FEATURES.md` - User-facing feature list

## Development Workflow

1. **Database changes:** Modify `shared/schema.ts` → Run `npm run db:push`
2. **New API endpoint:** Add to `server/routes.ts` → Add middleware (auth, workspace, role)
3. **New page:** Create in `client/src/pages/` → Add route in `client/src/App.tsx`
4. **Protected route:** Use `usePermissions` hook → Check `isLoading` → Render or redirect
5. **New permission:** Add to `usePermissions` hook → Update route guards → Update sidebar visibility

When in doubt about architecture decisions, reference `docs/IMPLEMENTATION.md` for the full technical specification.
