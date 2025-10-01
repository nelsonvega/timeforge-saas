# Implementation Details

## Architecture Overview

### Multi-Tenant Data Model

The application uses a hierarchical multi-tenant architecture:

```
Tenant (Organization)
  └─> Workspace (Team/Department)
       └─> Membership (User-Workspace relationship with role)
            └─> Business Data (Clients, Projects, Time Entries)
```

**Key Principles:**
- Complete data isolation at the workspace level
- All business entities scoped to workspaces
- Users can belong to multiple workspaces with different roles
- Cascading deletes maintain referential integrity

### Database Schema

#### Core Tables

**users**
- `id`: UUID primary key
- `email`: Unique email address
- `password`: Bcrypt hashed (for local auth)
- `firstName`, `lastName`, `name`: User identity
- `profileImageUrl`: OAuth profile picture
- `role`: Default role (deprecated, use workspace membership)

**tenants**
- `id`: UUID primary key
- `name`: Organization name
- `slug`: Unique URL-safe identifier
- `plan`: "free" or "paid"
- `stripeCustomerId`: Stripe customer reference
- `stripeSubscriptionId`: Stripe subscription reference
- `status`: "active" or "inactive"

**workspaces**
- `id`: UUID primary key
- `tenantId`: Foreign key to tenants
- `name`: Workspace name
- `slug`: Workspace identifier
- `timezone`: Default timezone
- `status`: "active" or "inactive"

**workspace_memberships**
- `id`: UUID primary key
- `workspaceId`: Foreign key to workspaces
- `userId`: Foreign key to users
- `role`: "admin", "manager", or "member"
- `title`: User's job title in workspace
- `invitedBy`: Foreign key to inviting user
- `joinedAt`: Timestamp of membership creation

#### Business Tables

All business tables include `workspaceId` for data isolation:

**clients**
- Workspace-scoped client records
- Contact information and address
- Active/archived status

**projects**
- Workspace-scoped projects
- Client association
- Budget and rate configuration
- Status tracking

**time_entries**
- Workspace-scoped time tracking
- Project and user assignment
- Billable/non-billable flag
- Approval workflow support

**project_assignments**
- User-project relationships within workspace
- Assignment tracking

### Authentication Implementation

#### Local Authentication (Passport Local Strategy)

**Registration Flow:**
```typescript
1. User submits registration form with:
   - Email, password, firstName, lastName
   - Company name (tenantName)
   - Plan selection (free/paid)

2. Backend validates and creates:
   - User with hashed password (bcrypt, 10 rounds)
   - Tenant with selected plan="free" initially
   - Default workspace
   - Admin membership for user

3. User is logged in automatically

4. If paid plan selected:
   - Returns tenant ID for payment flow
   - Frontend shows Stripe Elements
   - After payment, tenant upgraded to "paid"
```

**Login Flow:**
```typescript
1. User submits email and password
2. Passport Local Strategy:
   - Fetches user by email
   - Compares password with bcrypt
   - Creates session if valid
3. Session user object includes role and basic info
4. Returns sanitized user data
```

#### OAuth Authentication (Replit Auth)

**OAuth Flow:**
```typescript
1. User clicks "Continue with Google"
2. Redirects to /api/login
3. Passport initiates OIDC flow with Replit Auth
4. User authenticates with Google
5. Callback to /api/callback
6. Claims extracted from ID token
7. User upserted in database:
   - Creates if new (based on sub/id)
   - Updates profile if existing
8. Session established with access and refresh tokens
9. Automatic token refresh on expiration
```

**Token Refresh:**
```typescript
// Middleware checks token expiration
if (now > sessionUser.expires_at) {
  const refreshToken = sessionUser.refresh_token;
  const tokenResponse = await client.refreshTokenGrant(config, refreshToken);
  updateUserSession(sessionUser, tokenResponse);
}
```

### Payment Integration

#### Stripe Payment Flow

**Payment Intent Creation:**
```typescript
// POST /api/create-payment-intent
1. Requires authentication
2. Validates user is admin of tenant
3. Creates Stripe PaymentIntent:
   - Amount: $15.00 (1500 cents)
   - Currency: USD
   - Metadata: tenantId, userId
4. Returns clientSecret for frontend
```

**Payment Confirmation:**
```typescript
// POST /api/confirm-payment
1. Requires authentication
2. Frontend confirms payment with Stripe Elements
3. Backend retrieves PaymentIntent from Stripe
4. Validates:
   - Payment status is "succeeded"
   - Metadata matches tenant and user
   - User is admin of tenant
5. Creates/retrieves Stripe customer
6. Updates tenant:
   - plan = "paid"
   - stripeCustomerId
   - stripeSubscriptionId (if applicable)
```

**Security Measures:**
- userId derived from authenticated session (req.user.id)
- Payment Intent metadata verified before upgrade
- Admin membership required for payment operations
- Lazy-loaded Stripe client (doesn't block free-only deployments)

### Permission System

#### usePermissions Hook

**Permission Calculation:**
```typescript
export function usePermissions() {
  // Get authenticated user
  const { user, isLoading: authLoading } = useAuth();
  
  // Get selected workspace
  const { selectedWorkspace, isLoading: workspaceLoading } = useWorkspace();
  
  // Fetch workspace details including tenant plan
  const { data: workspaceDetails, isFetching } = useQuery({
    queryKey: [`/api/workspaces/${selectedWorkspace?.id}`],
    enabled: !!selectedWorkspace?.id,
  });
  
  // Combined loading state prevents race conditions
  const isLoading = authLoading || workspaceLoading || 
                    !selectedWorkspace?.id || isFetching;
  
  const userRole = user?.role || "member";
  const tenantPlan = workspaceDetails?.tenant?.plan;
  
  // Role-based permissions
  const canAccessDashboard = userRole === "admin" || userRole === "manager";
  const canAccessProjects = userRole === "admin" || userRole === "manager";
  // ... etc
  
  // Plan-based permission
  const canAccessSettings = tenantPlan === "paid";
  
  return { canAccessSettings, canAccessDashboard, ... };
}
```

**Loading State Management:**
- Waits for auth to complete
- Waits for workspace context initialization
- Waits for workspace selection
- Waits for workspace details fetch
- Prevents premature redirects and UI flicker

#### Route Protection

**Settings Page Guard:**
```typescript
export default function Settings() {
  const { canAccessSettings, isLoading } = usePermissions();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading && !canAccessSettings) {
      setLocation("/tracker");
    }
  }, [canAccessSettings, isLoading, setLocation]);

  if (isLoading || !canAccessSettings) {
    return null;
  }

  return <SettingsContent />;
}
```

**Sidebar Menu Filtering:**
```typescript
const menuItems = allMenuItems.filter(item => {
  const permission = item.permission;
  return permissions[permission];
});
```

### API Middleware

#### Authentication Middleware

**isAuthenticated:**
```typescript
export const isAuthenticated: RequestHandler = async (req, res, next) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const sessionUser = req.user;

  // Handle local auth
  if (sessionUser.isLocalAuth) {
    const fullUser = await storage.getUser(sessionUser.id);
    // Attach full user data to session
    sessionUser.role = fullUser.role;
    return next();
  }

  // Handle OAuth with token refresh
  if (now > sessionUser.expires_at) {
    // Refresh token logic
  }

  const fullUser = await storage.getUser(sessionUser.claims.sub);
  // Attach full user data
  return next();
};
```

#### Workspace Middleware

**requireWorkspace:**
```typescript
export function requireWorkspace(req: Request, res: Response, next: NextFunction) {
  const workspaceId = req.headers['x-workspace-id'];
  
  if (!workspaceId) {
    return res.status(400).json({ error: 'Workspace ID is required' });
  }

  // Verify user is member of workspace
  const membership = await storage.getWorkspaceMembership(workspaceId, req.user.id);
  
  if (!membership) {
    return res.status(403).json({ error: 'Not a member of this workspace' });
  }

  req.workspaceId = workspaceId;
  req.userRole = membership.role;
  next();
}
```

#### Role Middleware

**requireRole:**
```typescript
export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!allowedRoles.includes(req.userRole)) {
      return res.status(403).json({ 
        message: 'Access denied. Insufficient permissions.' 
      });
    }
    next();
  };
}
```

### Data Access Layer

#### Storage Interface Pattern

**Purpose:**
- Abstracts database operations
- Enables testing with mock implementations
- Provides type-safe data access
- Centralizes workspace context filtering

**Example Methods:**
```typescript
interface IStorage {
  // Workspace-scoped operations
  getAllClients(workspaceId: string): Promise<Client[]>;
  createClient(client: InsertClient): Promise<Client>;
  
  // Membership validation
  getWorkspaceMembership(workspaceId: string, userId: string): Promise<Membership>;
  
  // Tenant operations
  getTenant(id: string): Promise<Tenant>;
  updateTenantStripeInfo(id: string, customerId: string): Promise<Tenant>;
}
```

**Implementation with Drizzle:**
```typescript
class DbStorage implements IStorage {
  async getAllClients(workspaceId: string): Promise<Client[]> {
    return await db
      .select()
      .from(clients)
      .where(eq(clients.workspaceId, workspaceId))
      .orderBy(desc(clients.createdAt));
  }
}
```

### Frontend State Management

#### React Query Configuration

**Query Client Setup:**
```typescript
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: async ({ queryKey }) => {
        const url = queryKey[0] as string;
        const res = await fetch(url, {
          credentials: 'include',
          headers: {
            'x-workspace-id': getSelectedWorkspaceId(),
          },
        });
        
        if (!res.ok) {
          throw new Error(await res.text());
        }
        
        return res.json();
      },
    },
  },
});
```

**Cache Invalidation Pattern:**
```typescript
const mutation = useMutation({
  mutationFn: async (data) => {
    return apiRequest("POST", "/api/clients", data);
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
  },
});
```

#### Context Providers

**WorkspaceContext:**
```typescript
export function WorkspaceProvider({ children }) {
  const [selectedWorkspace, setSelectedWorkspaceState] = useState(null);

  const { data: workspaces = [] } = useQuery({
    queryKey: ["/api/workspaces"],
  });

  useEffect(() => {
    // Auto-select workspace from localStorage or first workspace
    const saved = localStorage.getItem("selectedWorkspaceId");
    const workspace = saved 
      ? workspaces.find(w => w.id === saved)
      : workspaces[0];
    
    if (workspace) {
      setSelectedWorkspaceState(workspace);
    }
  }, [workspaces]);

  const setSelectedWorkspace = (workspace) => {
    setSelectedWorkspaceState(workspace);
    localStorage.setItem("selectedWorkspaceId", workspace.id);
  };

  return (
    <WorkspaceContext.Provider value={{
      workspaces,
      selectedWorkspace,
      setSelectedWorkspace,
      isLoading: !workspaces.length && !selectedWorkspace,
    }}>
      {children}
    </WorkspaceContext.Provider>
  );
}
```

### Security Implementation

#### Password Security
- **Hashing**: bcrypt with 10 rounds
- **Validation**: Minimum 8 characters required
- **Storage**: Only hash stored, never plaintext
- **Comparison**: Constant-time comparison via bcrypt.compare

#### Session Security
- **Storage**: PostgreSQL with connect-pg-simple
- **Cookies**: httpOnly, secure, 7-day maxAge
- **Expiration**: Automatic cleanup of expired sessions
- **Refresh**: OAuth tokens refreshed automatically

#### Cross-Tenant Security
- **Workspace Validation**: Every data access verifies membership
- **Query Filtering**: All queries scoped to workspaceId
- **Payment Verification**: Metadata validated before plan upgrade
- **403 vs 404**: Returns 403 for unauthorized access (prevents enumeration)

### Performance Optimizations

#### Database Indexes
```typescript
// Workspace lookups
index("idx_workspaces_tenant_id").on(table.tenantId)

// Membership queries
index("idx_workspace_memberships_workspace_id").on(table.workspaceId)
index("idx_workspace_memberships_user_id").on(table.userId)

// Time entry filtering
index("idx_time_entries_workspace_id").on(table.workspaceId)
index("idx_time_entries_project_id").on(table.projectId)
```

#### React Query Caching
- Automatic cache deduplication
- Stale-while-revalidate pattern
- Background refetching
- Optimistic updates for mutations

#### Code Splitting
- Route-based code splitting via Vite
- Lazy component loading
- Dynamic imports for heavy dependencies

### Error Handling

#### API Error Responses
```typescript
try {
  const result = await storage.getClient(workspaceId, id);
  if (!result) {
    return res.status(404).json({ error: "Client not found" });
  }
  res.json(result);
} catch (error) {
  res.status(500).json({ error: error.message });
}
```

#### Frontend Error Handling
```typescript
const { data, error, isLoading } = useQuery({
  queryKey: ['/api/clients'],
});

if (error) {
  toast({
    title: "Error loading clients",
    description: error.message,
    variant: "destructive",
  });
}
```

### Type Safety

#### Shared Schema
```typescript
// shared/schema.ts
export const clients = pgTable("clients", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  workspaceId: varchar("workspace_id").notNull(),
  name: text("name").notNull(),
  // ...
});

// Generate Zod schema from Drizzle
export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// TypeScript types
export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;
```

#### Type Inference
- Database types inferred from Drizzle schema
- Zod schemas auto-generated for validation
- Request/response types derived from schemas
- Full type safety from database to UI
