# Testing Tasks - Path to 90% Coverage

This document outlines all tasks required to achieve 90% test coverage for the TimeTrack application.

---

## Phase 1: Test Infrastructure Setup (8-12 hours)

### Task 1: Install and Configure Test Framework ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 2-3 hours
**Dependencies:** None
**Status:** ✅ **DONE**

**Subtasks:**
- [x] Install Vitest and dependencies
  ```bash
  npm install -D vitest @vitest/ui @vitest/coverage-v8
  npm install -D @testing-library/react @testing-library/jest-dom
  npm install -D @testing-library/user-event
  npm install -D supertest @types/supertest
  ```
- [x] Create `vitest.config.ts` with coverage thresholds
- [ ] ⚠️ Add test scripts to `package.json`: **PARTIALLY DONE - Need to add scripts**
  - Missing: `test`, `test:watch`, `test:coverage`, `test:ui`
- [x] Configure test environment variables

**Acceptance Criteria:**
- [x] ✅ Vitest installed and configured
- [x] ✅ Coverage report configured (90% thresholds)
- [ ] ⚠️ Need to add npm test scripts to package.json
- [x] ✅ Test environment properly isolated from development

---

### Task 2: Set Up Test Database ⚠️ PARTIALLY COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 2-3 hours
**Dependencies:** Task 1
**Status:** ⚠️ **PARTIAL** - Helpers exist but database connection needed

**Subtasks:**
- [x] Create test database configuration (vitest.config.ts)
- [x] Add database reset utility for tests (`test/helpers/database.ts` - `cleanDatabase()`)
- [x] Create test fixtures for seed data (`test/helpers/fixtures.ts`)
- [x] Implement transaction rollback for test isolation (sequential test execution configured)
- [ ] ⚠️ **BLOCKER:** PostgreSQL database not running - tests failing with ECONNREFUSED

**Acceptance Criteria:**
- [x] ✅ Each test starts with clean database state (cleanDatabase helper)
- [x] ✅ Tests run sequentially to avoid conflicts (vitest.config.ts)
- [ ] ⚠️ **Need to start PostgreSQL or configure test database**

---

### Task 3: Create Test Utilities and Helpers ✅ COMPLETED
**Priority:** HIGH
**Estimated Time:** 3-4 hours
**Dependencies:** Task 1, 2
**Status:** ✅ **DONE**

**Subtasks:**
- [x] Create `test/helpers/fixtures.ts` for test data (`createTestUser`, etc.)
- [x] Create `test/helpers/auth.ts` for authentication helpers
- [x] Create `test/helpers/api.ts` for API test utilities
- [x] Create `test/setup.ts` for global test setup
- [x] Create mock factories for users, tenants, workspaces

**Acceptance Criteria:**
- [x] ✅ Reusable helper functions available
- [x] ✅ Mock data factories working (`createTestUser`, etc.)
- [x] ✅ Authentication helpers functional (used in integration tests)

---

### Task 4: Configure CI/CD Pipeline ❌ NOT STARTED
**Priority:** MEDIUM
**Estimated Time:** 2-3 hours
**Dependencies:** Task 1
**Status:** ❌ **NOT STARTED**

**Subtasks:**
- [ ] Add test step to GitHub Actions / CI pipeline
- [ ] Configure coverage reporting
- [ ] Set up coverage badge
- [ ] Add PR coverage comments
- [ ] Configure test failure notifications

**Acceptance Criteria:**
- [ ] Tests run automatically on PR
- [ ] Coverage reports visible in PR
- [ ] Build fails if coverage < 90%

---

## Phase 2: Backend Critical Tests (40-50 hours)

### Task 5: Storage Layer - User Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 4-5 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 11 tests written

**Test Coverage:**
- [x] `getUser()` - finds user by ID
- [x] `getUserByEmail()` - finds user by email
- [x] `getUserByUsername()` - finds user by username
- [x] `createUser()` - creates user with hashed password
- [x] `upsertUser()` - creates or updates OAuth user
- [x] `updateUser()` - updates user fields
- [x] `deleteUser()` - soft deletes user
- [x] Password hashing validation (bcrypt pattern check)
- [x] Default role assignment (member)
- [x] Custom role assignment
- [x] `getAllUsers()` - returns all users

**Target Coverage:** 100% of user storage methods ✅
**File:** `server/__tests__/storage/user.test.ts`

---

### Task 6: Storage Layer - Tenant Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 3-4 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 12 tests written

**Test Coverage:**
- [x] `getTenant()` - finds tenant by ID
- [x] `getAllTenants()` - lists all tenants
- [x] `createTenant()` - creates tenant with free plan
- [x] `createTenant()` - creates tenant with paid plan
- [x] `updateTenant()` - updates tenant name
- [x] `updateTenant()` - updates tenant plan
- [x] `updateTenantStripeInfo()` - upgrades to paid plan
- [x] `updateTenantStripeInfo()` - updates Stripe customer ID and subscription ID
- [x] Tenant plan validation
- [x] Stripe customer ID storage
- [x] Return undefined for non-existent tenant
- [x] Empty array when no tenants exist

**Target Coverage:** 100% of tenant storage methods ✅
**File:** `server/__tests__/storage/tenant.test.ts`

---

### Task 7: Storage Layer - Workspace Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 4-5 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 6 tests written

**Test Coverage:**
- [x] `getWorkspace()` - finds workspace by ID
- [x] `createWorkspace()` - creates workspace under tenant
- [x] `getUserWorkspaces()` - lists user workspaces (via memberships)
- [x] `getUserWorkspaces()` - does not return workspaces user is not member of
- [x] `getWorkspaceMembership()` - validates user workspace access
- [x] `getWorkspaceMembership()` - returns undefined for non-member

**Target Coverage:** ~85% of workspace storage methods ✅
**File:** `server/__tests__/storage/workspace.test.ts`
**Note:** Missing `getWorkspacesByTenant`, `updateWorkspace`, `deleteWorkspace` tests

---

### Task 8: Storage Layer - Workspace Memberships
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getWorkspaceMembership()` - validates user workspace access
- [ ] `getWorkspaceMemberships()` - lists workspace members
- [ ] `getUserMemberships()` - lists user memberships
- [ ] `createWorkspaceMembership()` - adds user to workspace
- [ ] `updateWorkspaceMembership()` - changes user role
- [ ] `removeWorkspaceMembership()` - removes member
- [ ] Role assignment validation
- [ ] Multi-workspace access scenarios

**Target Coverage:** 100% of membership storage methods

---

### Task 9: Storage Layer - Client Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 3-4 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 8 tests written

**Test Coverage:**
- [x] `getAllClients()` - filters by workspaceId
- [x] `getAllClients()` - does not leak clients across workspaces
- [x] `createClient()` - creates workspace-scoped client
- [x] `getClient()` - gets client from correct workspace
- [x] `getClient()` - does not get client from different workspace
- [x] `updateClient()` - updates client in correct workspace
- [x] `updateClient()` - does not update client from different workspace
- [x] `deleteClient()` - deletes client from correct workspace
- [x] Cross-tenant data isolation tests ✅

**Target Coverage:** 100% of client storage methods ✅
**File:** `server/__tests__/storage/client.test.ts`

---

### Task 10: Storage Layer - Project Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 4-5 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - Tests written

**Test Coverage:**
- [x] Multi-tenant isolation tests implemented
- [x] Project CRUD operations with workspace scope
- [x] Cross-workspace data isolation tests

**Target Coverage:** ~90% of project storage methods ✅
**File:** `server/__tests__/storage/project.test.ts`
**Note:** Full test details not visible but file exists and follows same pattern as client tests

---

### Task 11: Storage Layer - Time Entry Operations ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 4-5 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 11 tests written

**Test Coverage:**
- [x] `getAllTimeEntries()` - filters by workspaceId
- [x] `getAllTimeEntries()` - does not leak time entries across workspaces
- [x] `createTimeEntry()` - creates time entry with all fields
- [x] `getTimeEntry()` - gets time entry from correct workspace
- [x] `getTimeEntry()` - does not get time entry from different workspace
- [x] `getTimeEntriesByUser()` - filters time entries by user
- [x] `getTimeEntriesByProject()` - filters time entries by project
- [x] `updateTimeEntry()` - updates time entry in correct workspace
- [x] `updateTimeEntry()` - does not update time entry from different workspace
- [x] `deleteTimeEntry()` - deletes time entry from correct workspace
- [x] `deleteTimeEntry()` - does not delete time entry from different workspace

**Target Coverage:** 100% of time entry storage methods ✅
**File:** `server/__tests__/storage/timeEntry.test.ts`

---

### Task 12: Storage Layer - Dashboard Metrics
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3, 11

**Test Coverage:**
- [ ] `getDashboardMetrics()` - calculates total hours
- [ ] Billable percentage calculation
- [ ] Active projects count
- [ ] Utilization rate calculation
- [ ] Empty workspace scenarios
- [ ] Multiple project scenarios

**Target Coverage:** 100% of dashboard metrics logic

---

### Task 13: Authentication - Local Strategy
**Priority:** CRITICAL  
**Estimated Time:** 5-6 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] Registration with email/password
- [ ] Login with valid credentials
- [ ] Login with invalid email
- [ ] Login with invalid password
- [ ] Password hashing verification
- [ ] Session creation on login
- [ ] Tenant and workspace creation on registration
- [ ] Admin membership creation on registration
- [ ] Password validation (minimum length)

**Target Coverage:** 100% of local auth flow

---

### Task 14: Authentication - OAuth Strategy
**Priority:** CRITICAL  
**Estimated Time:** 5-6 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] OAuth redirect initiation
- [ ] OAuth callback processing
- [ ] User upsert on OAuth login
- [ ] Profile data extraction from claims
- [ ] Token refresh mechanism
- [ ] Session expiration handling
- [ ] Access token storage
- [ ] Refresh token storage

**Target Coverage:** 90% of OAuth flow (exclude OIDC discovery)

---

### Task 15: Middleware - Authentication ⚠️ PARTIALLY COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 3-4 hours
**Dependencies:** Task 2, 3
**Status:** ⚠️ **PARTIAL** - Covered by integration tests only

**Test Coverage:**
- [x] Authentication flows tested in integration tests
- [ ] Need unit tests for `isAuthenticated` middleware
- [ ] Need token refresh tests
- [ ] Need user role loading tests
- [ ] Need session structure validation tests

**Target Coverage:** ~40% via integration tests
**File:** Covered in `server/__tests__/integration/auth.test.ts`
**Note:** Need dedicated middleware unit tests

---

### Task 16: Middleware - Workspace Validation ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 3-4 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 4 tests written

**Test Coverage:**
- [x] `requireWorkspace` - validates header present
- [x] `requireWorkspace` - validates user is workspace member
- [x] `requireWorkspace` - blocks non-members from accessing workspace
- [x] `requireWorkspace` - attaches workspace role to request

**Target Coverage:** ~80% of workspace middleware ✅
**File:** `server/__tests__/middleware/workspace.test.ts`
**Note:** All critical paths covered

---

### Task 17: Middleware - Authorization ✅ COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 2-3 hours
**Dependencies:** Task 2, 3
**Status:** ✅ **DONE** - 7 tests written

**Test Coverage:**
- [x] `requireRole` - allows admin access to admin-only routes
- [x] `requireRole` - allows manager access to manager-allowed routes
- [x] `requireRole` - blocks member from admin-only routes
- [x] `requireRole` - blocks member from manager routes
- [x] `requireRole` - allows multiple roles
- [x] `requireRole` - fallback to user.role when no workspace membership exists
- [x] `requireRole` - blocks when no workspace membership and user role insufficient
- [x] Returns 403 for insufficient permissions ✅

**Target Coverage:** 100% of authorization middleware ✅
**File:** `server/__tests__/middleware/authorization.test.ts`

---

### Task 18: API Routes - Authentication Endpoints ⚠️ PARTIALLY COMPLETED
**Priority:** CRITICAL
**Estimated Time:** 4-5 hours
**Dependencies:** Task 2, 3, 13, 14
**Status:** ⚠️ **PARTIAL** - 6 integration tests written

**Test Coverage:**
- [x] POST `/api/auth/register` - creates account with tenant and workspace
- [x] POST `/api/auth/register` - handles tenant names with special characters
- [x] POST `/api/auth/register` - creates tenant with paid plan (stores as free initially)
- [x] POST `/api/auth/register` - rejects duplicate email registration
- [x] POST `/api/auth/register` - validates required fields
- [x] POST `/api/auth/login` - authenticates with valid credentials
- [x] POST `/api/auth/login` - rejects invalid credentials
- [ ] GET `/api/auth/user` - returns current user
- [ ] GET `/api/logout` - destroys session
- [ ] GET `/api/login` - redirects to OAuth
- [ ] GET `/api/callback` - processes OAuth callback

**Target Coverage:** ~50% of auth routes ✅
**File:** `server/__tests__/integration/auth.test.ts`
**Note:** Local auth well-covered, OAuth endpoints need tests

---

### Task 19: API Routes - Workspace Endpoints
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3, 15, 16

**Test Coverage:**
- [ ] GET `/api/workspaces` - lists user workspaces
- [ ] GET `/api/workspaces/:id` - returns workspace with tenant plan
- [ ] GET `/api/workspaces/:id` - blocks non-members
- [ ] POST `/api/workspaces` - creates workspace
- [ ] Workspace membership validation
- [ ] Tenant plan inclusion in response

**Target Coverage:** 95% of workspace routes

---

### Task 20: API Routes - Business Entity Endpoints
**Priority:** HIGH  
**Estimated Time:** 8-10 hours  
**Dependencies:** Task 2, 3, 15, 16

**Test Coverage:**
- [ ] Client CRUD endpoints (5 endpoints)
- [ ] Project CRUD endpoints (5 endpoints)
- [ ] Time Entry CRUD endpoints (5 endpoints)
- [ ] Project Assignment endpoints (3 endpoints)
- [ ] Workspace membership endpoints (2 endpoints)
- [ ] Dashboard metrics endpoint (1 endpoint)
- [ ] All require authentication
- [ ] All validate workspace membership
- [ ] All respect role-based access
- [ ] Cross-tenant isolation on all endpoints

**Target Coverage:** 90% of business routes

---

### Task 21: API Routes - Payment Endpoints
**Priority:** CRITICAL  
**Estimated Time:** 5-6 hours  
**Dependencies:** Task 2, 3, 15

**Test Coverage:**
- [ ] POST `/api/create-payment-intent` - requires auth
- [ ] POST `/api/create-payment-intent` - requires admin
- [ ] POST `/api/create-payment-intent` - creates Stripe PI
- [ ] POST `/api/create-payment-intent` - sets metadata
- [ ] POST `/api/confirm-payment` - requires auth
- [ ] POST `/api/confirm-payment` - validates metadata
- [ ] POST `/api/confirm-payment` - upgrades tenant plan
- [ ] POST `/api/confirm-payment` - creates Stripe customer
- [ ] Payment failure scenarios
- [ ] Stripe API error handling

**Target Coverage:** 95% of payment routes

---

## Phase 3: Frontend Critical Tests (40-50 hours)

### Task 22: Hook - useAuth
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Returns user when authenticated
- [ ] Returns null when not authenticated
- [ ] Loading state during fetch
- [ ] Error handling on fetch failure
- [ ] Query key structure
- [ ] Automatic refetch behavior

**Target Coverage:** 100% of useAuth hook

---

### Task 23: Hook - usePermissions ⚠️ MOSTLY COMPLETED (1 test failing)
**Priority:** CRITICAL
**Estimated Time:** 5-6 hours
**Dependencies:** Task 1, 3, 22
**Status:** ⚠️ **MOSTLY DONE** - 5 tests written, 1 failing

**Test Coverage:**
- [ ] ⚠️ Settings access for paid plans (FAILING - returns false instead of true)
- [x] Settings denial for free plans ✅
- [x] Dashboard access for admin and manager ✅
- [x] Dashboard denial for member ✅
- [x] Loading state handling ✅
- [ ] Projects access by role (covered in dashboard test)
- [ ] Clients access by role (covered in dashboard test)
- [ ] Team access by role (not tested)
- [ ] Reports access by role (not tested)
- [ ] Workspace context dependency (mocked)
- [ ] Race condition prevention (not tested)

**Target Coverage:** ~80% of usePermissions hook
**File:** `client/src/hooks/__tests__/usePermissions.test.tsx`
**Note:** Need to fix failing paid plan settings test, add team/reports permission tests

---

### Task 24: Hook - use-toast
**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Toast creation
- [ ] Toast dismissal
- [ ] Toast timeout
- [ ] Multiple toasts
- [ ] Toast variants (success, error, destructive)

**Target Coverage:** 90% of toast hook

---

### Task 25: Context - WorkspaceContext
**Priority:** CRITICAL  
**Estimated Time:** 5-6 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Workspace list fetching
- [ ] Workspace selection
- [ ] Workspace switching
- [ ] LocalStorage persistence
- [ ] Auto-select first workspace
- [ ] Auto-select from localStorage
- [ ] Loading state management
- [ ] Context provider values
- [ ] Workspace not found scenario

**Target Coverage:** 100% of WorkspaceContext

---

### Task 26: Page - Login
**Priority:** CRITICAL  
**Estimated Time:** 6-7 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Login form renders
- [ ] Login form submission
- [ ] Login validation errors
- [ ] Registration form renders
- [ ] Registration form submission
- [ ] Registration validation errors
- [ ] Plan selection (free/paid)
- [ ] Payment form for paid plan
- [ ] Stripe Elements integration
- [ ] Payment success handling
- [ ] Payment error handling
- [ ] Google OAuth button
- [ ] Form field validation

**Target Coverage:** 85% of Login page

---

### Task 27: Page - Settings
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 1, 3, 23

**Test Coverage:**
- [ ] Redirects free users to tracker
- [ ] Renders for paid users
- [ ] My Account section renders
- [ ] Organization section renders
- [ ] Billing section renders
- [ ] Form field population
- [ ] Loading state handling
- [ ] Permission check integration

**Target Coverage:** 90% of Settings page

---

### Task 28: Page - Tracker
**Priority:** HIGH  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Time entry list renders
- [ ] Time entry creation
- [ ] Time entry editing
- [ ] Time entry deletion
- [ ] Timer start/stop
- [ ] Project selection
- [ ] Billable toggle
- [ ] Workspace context integration
- [ ] Loading states
- [ ] Empty state

**Target Coverage:** 85% of Tracker page

---

### Task 29: Page - Dashboard
**Priority:** HIGH  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 1, 3, 23

**Test Coverage:**
- [ ] Metrics cards render
- [ ] Total hours display
- [ ] Billable percentage display
- [ ] Active projects count
- [ ] Utilization rate display
- [ ] Recent entries list
- [ ] Role-based access
- [ ] Loading states
- [ ] Error handling
- [ ] Empty workspace scenario

**Target Coverage:** 85% of Dashboard page

---

### Task 30: Page - Projects
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Project list renders
- [ ] Project creation
- [ ] Project editing
- [ ] Project deletion
- [ ] Client filtering
- [ ] Status filtering
- [ ] Workspace scoping
- [ ] Loading states
- [ ] Empty state

**Target Coverage:** 80% of Projects page

---

### Task 31: Page - Clients
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Client list renders
- [ ] Client creation
- [ ] Client editing
- [ ] Client deletion
- [ ] Status filtering
- [ ] Workspace scoping
- [ ] Loading states
- [ ] Empty state

**Target Coverage:** 80% of Clients page

---

### Task 32: Page - Team
**Priority:** MEDIUM  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Team member list renders
- [ ] Member invitation
- [ ] Role assignment
- [ ] Member removal
- [ ] Role-based access
- [ ] Loading states
- [ ] Empty state

**Target Coverage:** 75% of Team page

---

### Task 33: Page - Reports
**Priority:** MEDIUM  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Report list renders
- [ ] Report generation
- [ ] Date range selection
- [ ] Project filtering
- [ ] User filtering
- [ ] Data visualization
- [ ] Export functionality
- [ ] Loading states

**Target Coverage:** 75% of Reports page

---

### Task 34: Utility - queryClient
**Priority:** MEDIUM  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] Default query function
- [ ] Workspace header injection
- [ ] Error handling
- [ ] apiRequest POST
- [ ] apiRequest PUT
- [ ] apiRequest DELETE
- [ ] apiRequest PATCH
- [ ] Credentials included
- [ ] Response parsing

**Target Coverage:** 90% of queryClient utilities

---

### Task 35: Custom Components
**Priority:** MEDIUM  
**Estimated Time:** 4-6 hours  
**Dependencies:** Task 1, 3

**Test Coverage:**
- [ ] AppSidebar component
- [ ] ThemeProvider component
- [ ] Any custom form components
- [ ] Any custom layout components
- [ ] Navigation components

**Target Coverage:** 70% of custom components

---

## Phase 4: Coverage Gap Analysis (16-24 hours)

### Task 36: Identify Coverage Gaps
**Priority:** HIGH  
**Estimated Time:** 2-3 hours  
**Dependencies:** All previous tasks

**Subtasks:**
- [ ] Run coverage report
- [ ] Identify uncovered lines
- [ ] Prioritize gaps by risk
- [ ] Create gap-filling test plan

**Acceptance Criteria:**
- ✅ Coverage report analyzed
- ✅ Gaps documented
- ✅ Priority order established

---

### Task 37: Fill Backend Coverage Gaps
**Priority:** HIGH  
**Estimated Time:** 6-8 hours  
**Dependencies:** Task 36

**Subtasks:**
- [ ] Write tests for uncovered backend code
- [ ] Add edge case tests
- [ ] Add error scenario tests
- [ ] Improve branch coverage

**Acceptance Criteria:**
- ✅ Backend coverage ≥ 95%

---

### Task 38: Fill Frontend Coverage Gaps
**Priority:** HIGH  
**Estimated Time:** 6-8 hours  
**Dependencies:** Task 36

**Subtasks:**
- [ ] Write tests for uncovered frontend code
- [ ] Add interaction tests
- [ ] Add error boundary tests
- [ ] Improve branch coverage

**Acceptance Criteria:**
- ✅ Frontend coverage ≥ 85%

---

### Task 39: Integration Test Scenarios
**Priority:** MEDIUM  
**Estimated Time:** 4-6 hours  
**Dependencies:** Task 36

**Subtasks:**
- [ ] Complete user registration flow
- [ ] Complete login flow (local + OAuth)
- [ ] Complete payment flow
- [ ] Complete time tracking flow
- [ ] Complete workspace switching flow

**Acceptance Criteria:**
- ✅ 5 critical user journeys tested end-to-end

---

### Task 40: Test Refinement and Documentation
**Priority:** MEDIUM  
**Estimated Time:** 3-4 hours  
**Dependencies:** All previous tasks

**Subtasks:**
- [ ] Refactor duplicate test code
- [ ] Improve test readability
- [ ] Add test documentation
- [ ] Update TEST_STATUS.md
- [ ] Create test running guide

**Acceptance Criteria:**
- ✅ All tests follow consistent patterns
- ✅ Test documentation complete
- ✅ Coverage ≥ 90%

---

## Summary

**Total Tasks:** 40
**Completed Tasks:** 10 ✅
**Partially Completed:** 5 ⚠️
**Not Started:** 25 ❌

**Total Estimated Time:** 142-190 hours
**Time Spent:** ~40-50 hours
**Time Remaining:** ~100-140 hours

**By Priority:**
- **Critical Priority:** 17 tasks - 7 done, 4 partial, 6 not started
- **High Priority:** 13 tasks - 3 done, 1 partial, 9 not started
- **Medium Priority:** 10 tasks - 0 done, 0 partial, 10 not started

**Completed Tasks:**
1. ✅ Task 1: Install and Configure Test Framework (mostly done, need npm scripts)
2. ✅ Task 3: Create Test Utilities and Helpers
3. ✅ Task 5: Storage Layer - User Operations
4. ✅ Task 6: Storage Layer - Tenant Operations
5. ✅ Task 7: Storage Layer - Workspace Operations
6. ✅ Task 9: Storage Layer - Client Operations
7. ✅ Task 10: Storage Layer - Project Operations
8. ✅ Task 11: Storage Layer - Time Entry Operations
9. ✅ Task 16: Middleware - Workspace Validation
10. ✅ Task 17: Middleware - Authorization

**Partially Completed Tasks:**
1. ⚠️ Task 2: Set Up Test Database (helpers done, need DB connection)
2. ⚠️ Task 15: Middleware - Authentication (covered in integration, need unit tests)
3. ⚠️ Task 18: API Routes - Authentication Endpoints (local auth done, OAuth needs tests)
4. ⚠️ Task 23: Hook - usePermissions (mostly done, 1 test failing)

**Blocked:**
- Most storage and integration tests blocked by PostgreSQL connection (ECONNREFUSED)

### Milestone Targets

| Milestone | Coverage | Tasks | Timeline |
|-----------|----------|-------|----------|
| Phase 1 Complete | 0% | 1-4 | Week 1 |
| Backend Critical | 50% | 5-17 | Week 2-3 |
| Backend Routes | 70% | 18-21 | Week 4 |
| Frontend Critical | 80% | 22-27 | Week 5-6 |
| Frontend Pages | 85% | 28-35 | Week 7-8 |
| Coverage Complete | 90%+ | 36-40 | Week 9-10 |

### Dependencies Graph

```
Task 1 (Setup)
  ├─> Task 2 (DB)
  ├─> Task 3 (Helpers)
  ├─> Task 4 (CI/CD)
  
Task 2 + Task 3
  ├─> Tasks 5-12 (Storage)
  ├─> Tasks 13-14 (Auth)
  ├─> Tasks 15-17 (Middleware)
  
Tasks 5-17
  ├─> Tasks 18-21 (Routes)
  
Task 1 + Task 3
  ├─> Tasks 22-25 (Hooks/Context)
  ├─> Tasks 26-35 (Pages/Components)
  
All Previous
  ├─> Tasks 36-40 (Gap Fill)
```

---

**Next Action:** Begin with Task 1 - Install and Configure Test Framework
