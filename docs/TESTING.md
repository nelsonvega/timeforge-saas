# Testing Guide

## Testing Strategy

### Test Categories

1. **Unit Tests**: Individual functions and components
2. **Integration Tests**: API endpoints and workflows
3. **End-to-End Tests**: Complete user journeys
4. **Security Tests**: Authentication and authorization
5. **Performance Tests**: Load and stress testing

## Unit Testing

### Backend Unit Tests

#### Authentication Tests

```typescript
describe('Password Hashing', () => {
  it('should hash passwords with bcrypt', async () => {
    const password = 'testpassword123';
    const hashed = await bcrypt.hash(password, 10);
    
    expect(hashed).not.toBe(password);
    expect(await bcrypt.compare(password, hashed)).toBe(true);
  });

  it('should reject incorrect passwords', async () => {
    const password = 'correct';
    const hashed = await bcrypt.hash(password, 10);
    
    expect(await bcrypt.compare('incorrect', hashed)).toBe(false);
  });
});

describe('User Registration', () => {
  it('should create user with hashed password', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'User',
      name: 'Test User',
      role: 'admin',
    };

    const user = await storage.createUser(userData);

    expect(user.email).toBe(userData.email);
    expect(user.password).not.toBe(userData.password);
    expect(user.password).toMatch(/^\$2[aby]\$/); // bcrypt hash pattern
  });

  it('should create tenant and workspace on registration', async () => {
    // Test complete registration flow
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        tenantName: 'Test Company',
        plan: 'free',
      });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.tenant).toBeDefined();
    expect(response.body.tenant.plan).toBe('free');
  });
});
```

#### Storage Layer Tests

```typescript
describe('DbStorage', () => {
  let storage: DbStorage;

  beforeEach(() => {
    storage = new DbStorage();
  });

  describe('Workspace Operations', () => {
    it('should filter clients by workspaceId', async () => {
      const workspace1 = 'workspace-1';
      const workspace2 = 'workspace-2';

      await storage.createClient({ 
        workspaceId: workspace1, 
        name: 'Client A' 
      });
      await storage.createClient({ 
        workspaceId: workspace2, 
        name: 'Client B' 
      });

      const clients = await storage.getAllClients(workspace1);

      expect(clients).toHaveLength(1);
      expect(clients[0].name).toBe('Client A');
      expect(clients[0].workspaceId).toBe(workspace1);
    });

    it('should verify workspace membership', async () => {
      const workspaceId = 'test-workspace';
      const userId = 'test-user';

      const membership = await storage.getWorkspaceMembership(
        workspaceId,
        userId
      );

      expect(membership).toBeNull(); // User not in workspace

      await storage.createWorkspaceMembership({
        workspaceId,
        userId,
        role: 'member',
      });

      const newMembership = await storage.getWorkspaceMembership(
        workspaceId,
        userId
      );

      expect(newMembership).toBeDefined();
      expect(newMembership.role).toBe('member');
    });
  });

  describe('Tenant Operations', () => {
    it('should update tenant plan and Stripe info', async () => {
      const tenant = await storage.createTenant({
        name: 'Test Org',
        slug: 'test-org',
        plan: 'free',
      });

      const updated = await storage.updateTenantStripeInfo(
        tenant.id,
        'cus_123456',
        'sub_123456'
      );

      expect(updated.plan).toBe('paid');
      expect(updated.stripeCustomerId).toBe('cus_123456');
      expect(updated.stripeSubscriptionId).toBe('sub_123456');
    });
  });
});
```

### Frontend Unit Tests

#### Hook Tests

```typescript
describe('usePermissions', () => {
  it('should grant settings access for paid plans', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider user={{ role: 'admin' }}>
            <WorkspaceProvider 
              workspace={{ 
                tenant: { plan: 'paid' } 
              }}
            >
              {children}
            </WorkspaceProvider>
          </AuthProvider>
        </QueryClientProvider>
      ),
    });

    expect(result.current.canAccessSettings).toBe(true);
  });

  it('should deny settings access for free plans', () => {
    const { result } = renderHook(() => usePermissions(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>
          <AuthProvider user={{ role: 'admin' }}>
            <WorkspaceProvider 
              workspace={{ 
                tenant: { plan: 'free' } 
              }}
            >
              {children}
            </WorkspaceProvider>
          </AuthProvider>
        </QueryClientProvider>
      ),
    });

    expect(result.current.canAccessSettings).toBe(false);
  });

  it('should grant dashboard access for admins and managers', () => {
    const { result: adminResult } = renderHook(() => usePermissions(), {
      wrapper: createWrapper({ role: 'admin' }),
    });

    const { result: managerResult } = renderHook(() => usePermissions(), {
      wrapper: createWrapper({ role: 'manager' }),
    });

    const { result: memberResult } = renderHook(() => usePermissions(), {
      wrapper: createWrapper({ role: 'member' }),
    });

    expect(adminResult.current.canAccessDashboard).toBe(true);
    expect(managerResult.current.canAccessDashboard).toBe(true);
    expect(memberResult.current.canAccessDashboard).toBe(false);
  });
});
```

#### Component Tests

```typescript
describe('Settings Page', () => {
  it('should redirect free users to tracker', async () => {
    const { result } = render(<Settings />, {
      wrapper: createWrapper({ 
        user: { role: 'admin' },
        workspace: { tenant: { plan: 'free' } }
      }),
    });

    await waitFor(() => {
      expect(window.location.pathname).toBe('/tracker');
    });
  });

  it('should render for paid users', async () => {
    const { getByText } = render(<Settings />, {
      wrapper: createWrapper({ 
        user: { role: 'admin' },
        workspace: { tenant: { plan: 'paid' } }
      }),
    });

    await waitFor(() => {
      expect(getByText('My Account')).toBeInTheDocument();
      expect(getByText('Organization Details')).toBeInTheDocument();
    });
  });
});
```

## Integration Testing

### API Endpoint Tests

#### Authentication Endpoints

```typescript
describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    await createUser({
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
    });

    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.user.email).toBe('test@example.com');
  });

  it('should reject invalid credentials', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wrong@example.com',
        password: 'wrongpassword',
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBeDefined();
  });
});

describe('POST /api/auth/register', () => {
  it('should create complete tenant hierarchy', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'newuser@example.com',
        password: 'password123',
        firstName: 'New',
        lastName: 'User',
        tenantName: 'New Company',
        plan: 'free',
      });

    expect(response.status).toBe(201);

    // Verify tenant created
    const tenant = await storage.getTenant(response.body.tenant.id);
    expect(tenant.name).toBe('New Company');
    expect(tenant.plan).toBe('free');

    // Verify workspace created
    const workspaces = await storage.getWorkspacesByTenant(tenant.id);
    expect(workspaces).toHaveLength(1);
    expect(workspaces[0].name).toBe('Main Workspace');

    // Verify membership created
    const memberships = await storage.getWorkspaceMemberships(
      workspaces[0].id
    );
    expect(memberships).toHaveLength(1);
    expect(memberships[0].role).toBe('admin');
  });
});
```

#### Payment Endpoints

```typescript
describe('Payment Integration', () => {
  let authCookie: string;
  let tenantId: string;

  beforeEach(async () => {
    // Create user and login
    const loginResponse = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'paytest@example.com',
        password: 'password123',
        firstName: 'Pay',
        lastName: 'Test',
        tenantName: 'Payment Test Co',
        plan: 'free',
      });

    authCookie = loginResponse.headers['set-cookie'];
    tenantId = loginResponse.body.tenant.id;
  });

  describe('POST /api/create-payment-intent', () => {
    it('should create payment intent for admin', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', authCookie)
        .send({ tenantId });

      expect(response.status).toBe(200);
      expect(response.body.clientSecret).toBeDefined();
      expect(response.body.clientSecret).toMatch(/^pi_/);
    });

    it('should reject unauthenticated requests', async () => {
      const response = await request(app)
        .post('/api/create-payment-intent')
        .send({ tenantId });

      expect(response.status).toBe(401);
    });

    it('should reject non-admin users', async () => {
      // Create member user
      const memberLogin = await createMemberUser();

      const response = await request(app)
        .post('/api/create-payment-intent')
        .set('Cookie', memberLogin.cookie)
        .send({ tenantId });

      expect(response.status).toBe(403);
    });
  });

  describe('POST /api/confirm-payment', () => {
    it('should upgrade tenant after successful payment', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId,
          userId: 'user-id',
        },
      };

      stripe.paymentIntents.retrieve = jest.fn()
        .mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', authCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId,
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify tenant upgraded
      const tenant = await storage.getTenant(tenantId);
      expect(tenant.plan).toBe('paid');
    });

    it('should reject mismatched metadata', async () => {
      const mockPaymentIntent = {
        id: 'pi_test123',
        status: 'succeeded',
        metadata: {
          tenantId: 'different-tenant',
          userId: 'user-id',
        },
      };

      stripe.paymentIntents.retrieve = jest.fn()
        .mockResolvedValue(mockPaymentIntent);

      const response = await request(app)
        .post('/api/confirm-payment')
        .set('Cookie', authCookie)
        .send({
          paymentIntentId: 'pi_test123',
          tenantId,
        });

      expect(response.status).toBe(403);
    });
  });
});
```

#### Workspace-Scoped Data Tests

```typescript
describe('Workspace Data Isolation', () => {
  let workspace1: string;
  let workspace2: string;
  let user1Cookie: string;
  let user2Cookie: string;

  beforeEach(async () => {
    // Create two separate tenants with workspaces
    const tenant1 = await createTenantWithUser();
    const tenant2 = await createTenantWithUser();

    workspace1 = tenant1.workspaceId;
    workspace2 = tenant2.workspaceId;
    user1Cookie = tenant1.cookie;
    user2Cookie = tenant2.cookie;
  });

  it('should only return workspace-specific clients', async () => {
    // Create clients in different workspaces
    await request(app)
      .post('/api/clients')
      .set('Cookie', user1Cookie)
      .set('x-workspace-id', workspace1)
      .send({ name: 'Workspace 1 Client' });

    await request(app)
      .post('/api/clients')
      .set('Cookie', user2Cookie)
      .set('x-workspace-id', workspace2)
      .send({ name: 'Workspace 2 Client' });

    // User 1 should only see their clients
    const response1 = await request(app)
      .get('/api/clients')
      .set('Cookie', user1Cookie)
      .set('x-workspace-id', workspace1);

    expect(response1.body).toHaveLength(1);
    expect(response1.body[0].name).toBe('Workspace 1 Client');

    // User 2 should only see their clients
    const response2 = await request(app)
      .get('/api/clients')
      .set('Cookie', user2Cookie)
      .set('x-workspace-id', workspace2);

    expect(response2.body).toHaveLength(1);
    expect(response2.body[0].name).toBe('Workspace 2 Client');
  });

  it('should prevent cross-workspace access', async () => {
    // User 1 tries to access workspace 2
    const response = await request(app)
      .get('/api/clients')
      .set('Cookie', user1Cookie)
      .set('x-workspace-id', workspace2);

    expect(response.status).toBe(403);
  });
});
```

## End-to-End Testing

### Playwright Test Examples

```typescript
import { test, expect } from '@playwright/test';

test.describe('User Registration and Payment', () => {
  test('should complete paid plan registration flow', async ({ page }) => {
    await page.goto('/login');

    // Switch to signup tab
    await page.getByTestId('tab-signup').click();

    // Fill registration form
    await page.getByTestId('input-signup-company').fill('Test Company');
    await page.getByTestId('input-signup-firstname').fill('John');
    await page.getByTestId('input-signup-lastname').fill('Doe');
    await page.getByTestId('input-signup-email').fill('john@test.com');
    await page.getByTestId('input-signup-password').fill('password123');

    // Select paid plan
    await page.getByTestId('radio-plan-paid').click();

    // Submit registration
    await page.getByTestId('button-signup').click();

    // Should redirect to payment page
    await expect(page).toHaveURL(/.*payment.*/);
    await expect(page.getByText('Paid Plan - $15')).toBeVisible();

    // Fill payment details (test mode)
    await page.frameLocator('iframe[name*="stripe"]')
      .getByPlaceholder('Card number')
      .fill('4242424242424242');
    
    await page.frameLocator('iframe[name*="stripe"]')
      .getByPlaceholder('MM / YY')
      .fill('12/25');
    
    await page.frameLocator('iframe[name*="stripe"]')
      .getByPlaceholder('CVC')
      .fill('123');

    // Complete payment
    await page.getByTestId('button-complete-payment').click();

    // Should redirect to app
    await expect(page).toHaveURL(/.*tracker.*/);
  });

  test('should complete free plan registration', async ({ page }) => {
    await page.goto('/login');
    await page.getByTestId('tab-signup').click();

    // Fill form with free plan
    await fillRegistrationForm(page);
    await page.getByTestId('radio-plan-free').click();
    await page.getByTestId('button-signup').click();

    // Should skip payment and go to app
    await expect(page).toHaveURL(/.*tracker.*/);
  });
});

test.describe('Settings Access Control', () => {
  test('should block free users from settings', async ({ page }) => {
    await loginAsUser(page, { plan: 'free' });

    // Try to navigate to settings
    await page.goto('/settings');

    // Should redirect to tracker
    await expect(page).toHaveURL(/.*tracker.*/);
  });

  test('should allow paid users to access settings', async ({ page }) => {
    await loginAsUser(page, { plan: 'paid' });

    // Navigate to settings
    await page.goto('/settings');

    // Should stay on settings page
    await expect(page).toHaveURL(/.*settings.*/);
    await expect(page.getByText('My Account')).toBeVisible();
  });

  test('should hide settings link for free users', async ({ page }) => {
    await loginAsUser(page, { plan: 'free' });

    // Open user menu
    await page.getByTestId('button-user-menu').click();

    // Settings link should not be visible
    const settingsLink = page.getByTestId('menu-settings');
    await expect(settingsLink).not.toBeVisible();
  });
});
```

## Security Testing

### Authentication Security Tests

```typescript
describe('Security: Authentication', () => {
  it('should prevent SQL injection in login', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: "admin'--",
        password: "anything",
      });

    expect(response.status).toBe(401);
  });

  it('should prevent timing attacks on password comparison', async () => {
    const validUser = await createUser({
      email: 'valid@example.com',
      password: 'correctpassword',
    });

    const times = [];

    // Measure response time for invalid user
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid@example.com',
          password: 'wrongpassword',
        });
      times.push(Date.now() - start);
    }

    const avgInvalid = times.reduce((a, b) => a + b) / times.length;

    // Measure response time for valid user, wrong password
    times.length = 0;
    for (let i = 0; i < 10; i++) {
      const start = Date.now();
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'valid@example.com',
          password: 'wrongpassword',
        });
      times.push(Date.now() - start);
    }

    const avgValidWrong = times.reduce((a, b) => a + b) / times.length;

    // Response times should be similar (bcrypt is constant-time)
    const difference = Math.abs(avgInvalid - avgValidWrong);
    expect(difference).toBeLessThan(50); // Less than 50ms difference
  });
});
```

### Authorization Security Tests

```typescript
describe('Security: Authorization', () => {
  it('should prevent workspace enumeration', async () => {
    const user1 = await createUserWithWorkspace();
    const user2 = await createUserWithWorkspace();

    // User 1 tries to access User 2's workspace
    const response = await request(app)
      .get(`/api/workspaces/${user2.workspaceId}`)
      .set('Cookie', user1.cookie);

    // Should return 403, not 404 (prevents enumeration)
    expect(response.status).toBe(403);
  });

  it('should validate payment intent metadata', async () => {
    const user = await createUserWithTenant();
    const attacker = await createUserWithTenant();

    // Attacker creates payment intent
    const piResponse = await request(app)
      .post('/api/create-payment-intent')
      .set('Cookie', attacker.cookie)
      .send({ tenantId: user.tenantId });

    // Try to confirm payment for victim's tenant
    const confirmResponse = await request(app)
      .post('/api/confirm-payment')
      .set('Cookie', user.cookie)
      .send({
        paymentIntentId: piResponse.body.paymentIntentId,
        tenantId: user.tenantId,
      });

    // Should reject due to metadata mismatch
    expect(confirmResponse.status).toBe(403);
  });
});
```

## Performance Testing

### Load Testing Example

```typescript
import autocannon from 'autocannon';

describe('Performance: API Load', () => {
  it('should handle 100 concurrent requests', async () => {
    const result = await autocannon({
      url: 'http://localhost:5000/api/auth/user',
      connections: 100,
      duration: 10,
      headers: {
        cookie: await getAuthCookie(),
      },
    });

    expect(result.errors).toBe(0);
    expect(result.timeouts).toBe(0);
    expect(result.latency.p99).toBeLessThan(500); // 99th percentile under 500ms
  });
});
```

## Test Data Helpers

```typescript
// test/helpers/fixtures.ts

export async function createUser(data?: Partial<InsertUser>) {
  const password = await bcrypt.hash(data?.password || 'password123', 10);
  
  return await storage.createUser({
    email: data?.email || `test${Date.now()}@example.com`,
    password,
    firstName: data?.firstName || 'Test',
    lastName: data?.lastName || 'User',
    name: `${data?.firstName || 'Test'} ${data?.lastName || 'User'}`,
    role: data?.role || 'admin',
  });
}

export async function createTenantWithUser(plan = 'free') {
  const user = await createUser();
  const tenant = await storage.createTenant({
    name: 'Test Company',
    slug: `test-${Date.now()}`,
    plan,
  });
  
  const workspace = await storage.createWorkspace({
    tenantId: tenant.id,
    name: 'Main Workspace',
    slug: 'main',
  });

  await storage.createWorkspaceMembership({
    workspaceId: workspace.id,
    userId: user.id,
    role: 'admin',
  });

  return { user, tenant, workspace };
}

export async function getAuthCookie(user?: User) {
  if (!user) {
    user = await createUser();
  }

  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: user.email,
      password: 'password123',
    });

  return response.headers['set-cookie'];
}
```

## Running Tests

```bash
# Run all tests
npm test

# Run unit tests only
npm run test:unit

# Run integration tests
npm run test:integration

# Run e2e tests
npm run test:e2e

# Run with coverage
npm run test:coverage

# Watch mode
npm run test:watch
```

## Test Coverage Goals

- **Unit Tests**: > 80% coverage
- **Integration Tests**: All API endpoints
- **E2E Tests**: Critical user journeys
- **Security Tests**: All auth and authorization paths
