# Testing Tasks - Path to 90% Coverage

This document outlines all tasks required to achieve 90% test coverage for the TimeTrack application.

---

## Phase 1: Test Infrastructure Setup (8-12 hours)

### Task 1: Install and Configure Test Framework
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours  
**Dependencies:** None

**Subtasks:**
- [ ] Install Vitest and dependencies
  ```bash
  npm install -D vitest @vitest/ui @vitest/coverage-v8
  npm install -D @testing-library/react @testing-library/jest-dom
  npm install -D @testing-library/user-event
  npm install -D supertest @types/supertest
  ```
- [ ] Create `vitest.config.ts` with coverage thresholds
- [ ] Add test scripts to `package.json`:
  - `test`: Run all tests
  - `test:watch`: Watch mode
  - `test:coverage`: Generate coverage report
  - `test:ui`: Open Vitest UI
- [ ] Configure test environment variables

**Acceptance Criteria:**
- ✅ `npm test` runs without errors
- ✅ Coverage report generates successfully
- ✅ Test environment properly isolated from development

---

### Task 2: Set Up Test Database
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 1

**Subtasks:**
- [ ] Create test database configuration
- [ ] Add database reset utility for tests
- [ ] Create test fixtures for seed data
- [ ] Implement transaction rollback for test isolation

**Acceptance Criteria:**
- ✅ Each test starts with clean database state
- ✅ Tests run in parallel without conflicts
- ✅ Test database separate from development

---

### Task 3: Create Test Utilities and Helpers
**Priority:** HIGH  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 1, 2

**Subtasks:**
- [ ] Create `test/helpers/fixtures.ts` for test data
- [ ] Create `test/helpers/auth.ts` for authentication helpers
- [ ] Create `test/helpers/api.ts` for API test utilities
- [ ] Create `test/helpers/setup.ts` for global test setup
- [ ] Create mock factories for users, tenants, workspaces

**Acceptance Criteria:**
- ✅ Reusable helper functions available
- ✅ Mock data factories working
- ✅ Authentication helpers functional

---

### Task 4: Configure CI/CD Pipeline
**Priority:** MEDIUM  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 1

**Subtasks:**
- [ ] Add test step to GitHub Actions / CI pipeline
- [ ] Configure coverage reporting
- [ ] Set up coverage badge
- [ ] Add PR coverage comments
- [ ] Configure test failure notifications

**Acceptance Criteria:**
- ✅ Tests run automatically on PR
- ✅ Coverage reports visible in PR
- ✅ Build fails if coverage < 90%

---

## Phase 2: Backend Critical Tests (40-50 hours)

### Task 5: Storage Layer - User Operations
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getUser()` - finds user by ID
- [ ] `getUserByEmail()` - finds user by email
- [ ] `getUserByUsername()` - finds user by username
- [ ] `createUser()` - creates user with hashed password
- [ ] `upsertUser()` - creates or updates OAuth user
- [ ] `updateUser()` - updates user fields
- [ ] `deleteUser()` - soft deletes user
- [ ] Password hashing validation
- [ ] Email uniqueness validation

**Target Coverage:** 100% of user storage methods

---

### Task 6: Storage Layer - Tenant Operations
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getTenant()` - finds tenant by ID
- [ ] `getAllTenants()` - lists all tenants
- [ ] `createTenant()` - creates tenant with free plan
- [ ] `updateTenant()` - updates tenant fields
- [ ] `updateTenantStripeInfo()` - upgrades to paid plan
- [ ] Tenant plan validation
- [ ] Stripe customer ID storage

**Target Coverage:** 100% of tenant storage methods

---

### Task 7: Storage Layer - Workspace Operations
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getWorkspace()` - finds workspace by ID
- [ ] `getWorkspacesByTenant()` - lists tenant workspaces
- [ ] `getUserWorkspaces()` - lists user workspaces (via memberships)
- [ ] `createWorkspace()` - creates workspace under tenant
- [ ] `updateWorkspace()` - updates workspace fields
- [ ] `deleteWorkspace()` - cascades to memberships
- [ ] Workspace-tenant relationship validation

**Target Coverage:** 100% of workspace storage methods

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

### Task 9: Storage Layer - Client Operations
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getClient()` - requires workspace scope
- [ ] `getAllClients()` - filters by workspaceId
- [ ] `createClient()` - creates workspace-scoped client
- [ ] `updateClient()` - validates workspace membership
- [ ] `deleteClient()` - validates workspace ownership
- [ ] Cross-tenant data isolation tests
- [ ] Client status management

**Target Coverage:** 100% of client storage methods

---

### Task 10: Storage Layer - Project Operations
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getProject()` - requires workspace scope
- [ ] `getAllProjects()` - filters by workspaceId
- [ ] `getProjectsByClient()` - filters by client and workspace
- [ ] `createProject()` - validates client exists in workspace
- [ ] `updateProject()` - validates workspace membership
- [ ] `deleteProject()` - cascades to time entries
- [ ] Project-client relationship validation

**Target Coverage:** 100% of project storage methods

---

### Task 11: Storage Layer - Time Entry Operations
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `getTimeEntry()` - requires workspace scope
- [ ] `getAllTimeEntries()` - filters by workspaceId
- [ ] `getTimeEntriesByUser()` - filters by user and workspace
- [ ] `getTimeEntriesByProject()` - filters by project and workspace
- [ ] `createTimeEntry()` - validates project in workspace
- [ ] `updateTimeEntry()` - validates ownership
- [ ] `deleteTimeEntry()` - validates ownership
- [ ] Duration calculation
- [ ] Billable flag validation

**Target Coverage:** 100% of time entry storage methods

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

### Task 15: Middleware - Authentication
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `isAuthenticated` - allows authenticated users
- [ ] `isAuthenticated` - blocks unauthenticated users
- [ ] Token refresh for expired OAuth tokens
- [ ] User role loading from database
- [ ] Session user object structure
- [ ] Public path bypass

**Target Coverage:** 100% of authentication middleware

---

### Task 16: Middleware - Workspace Validation
**Priority:** CRITICAL  
**Estimated Time:** 3-4 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `requireWorkspace` - validates header present
- [ ] `requireWorkspace` - validates membership
- [ ] `requireWorkspace` - blocks non-members
- [ ] `requireWorkspace` - attaches workspaceId to request
- [ ] `requireWorkspace` - attaches userRole to request
- [ ] Multiple workspace access scenarios

**Target Coverage:** 100% of workspace middleware

---

### Task 17: Middleware - Authorization
**Priority:** CRITICAL  
**Estimated Time:** 2-3 hours  
**Dependencies:** Task 2, 3

**Test Coverage:**
- [ ] `requireRole` - allows admin
- [ ] `requireRole` - allows manager
- [ ] `requireRole` - blocks member
- [ ] `requireRole` - multiple allowed roles
- [ ] `requireRole` - returns 403 for insufficient permissions

**Target Coverage:** 100% of authorization middleware

---

### Task 18: API Routes - Authentication Endpoints
**Priority:** CRITICAL  
**Estimated Time:** 4-5 hours  
**Dependencies:** Task 2, 3, 13, 14

**Test Coverage:**
- [ ] POST `/api/auth/register` - creates account
- [ ] POST `/api/auth/login` - authenticates user
- [ ] GET `/api/auth/user` - returns current user
- [ ] GET `/api/logout` - destroys session
- [ ] GET `/api/login` - redirects to OAuth
- [ ] GET `/api/callback` - processes OAuth callback
- [ ] Registration with paid plan
- [ ] Registration with free plan
- [ ] Login validation errors

**Target Coverage:** 95% of auth routes

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

### Task 23: Hook - usePermissions
**Priority:** CRITICAL  
**Estimated Time:** 5-6 hours  
**Dependencies:** Task 1, 3, 22

**Test Coverage:**
- [ ] Settings access for paid plans
- [ ] Settings denial for free plans
- [ ] Dashboard access for admin/manager
- [ ] Dashboard denial for member
- [ ] Projects access by role
- [ ] Clients access by role
- [ ] Team access by role
- [ ] Reports access by role
- [ ] Loading state handling
- [ ] Workspace context dependency
- [ ] Race condition prevention

**Target Coverage:** 100% of usePermissions hook

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
**Total Estimated Time:** 142-190 hours  
**Critical Priority:** 17 tasks (85-110 hours)  
**High Priority:** 13 tasks (45-60 hours)  
**Medium Priority:** 10 tasks (12-20 hours)

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
