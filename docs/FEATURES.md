# Feature List

## Authentication & User Management

### Dual Authentication System
- **Email/Password Authentication**
  - User registration with email, password, and company information
  - Secure password hashing using bcrypt (10 rounds)
  - Password validation (minimum 8 characters)
  - Login with email and password credentials
  
- **Google OAuth Authentication**
  - Sign in with Google via Replit Auth
  - OIDC (OpenID Connect) integration
  - Automatic user profile creation/update
  - Session refresh with OAuth tokens
  - Support for multiple OAuth providers (Google, GitHub, Apple, X)

### Session Management
- PostgreSQL-backed session storage (connect-pg-simple)
- 7-day session expiration
- Secure, httpOnly cookies
- Automatic session refresh for OAuth users
- Session invalidation on logout

### User Profile
- Email address
- First name and last name
- Profile image (from OAuth)
- Role assignment per workspace
- Password change functionality (for local auth users)

## Multi-Tenant Architecture

### Tenant Management
- Tenant creation during registration
- Tenant name and slug
- Plan management (free/paid)
- Stripe customer integration
- Active/inactive status

### Workspace Management
- Multiple workspaces per tenant
- Workspace name and slug
- Timezone configuration
- Status management
- Workspace-scoped data isolation

### Workspace Membership
- User-workspace relationships
- Per-workspace role assignment (admin, manager, member)
- Join date tracking
- Invitation system (invitedBy field)
- User title/position per workspace

## Plan Management & Billing

### Plan Types
- **Free Plan**
  - Access to time tracker only
  - Limited to basic time tracking features
  - No settings access
  
- **Paid Plan ($15 one-time)**
  - Full access to time tracker
  - Settings page access
  - Account management features
  - Organization configuration
  - Billing settings

### Payment Integration
- Stripe payment processing
- One-time payment model
- Secure payment with Stripe Elements
- Payment Intent API
- Customer creation and tracking
- Subscription ID storage
- Payment confirmation workflow

### Plan Enforcement
- Client-side route protection
- Server-side API validation
- Sidebar menu filtering by plan
- Feature gating based on tenant plan
- Automatic redirect for unauthorized access

## Role-Based Access Control (RBAC)

### Admin Role
- Full access to all features
- Dashboard with metrics
- Project management
- Client management
- Team management
- Reports and analytics
- Settings configuration
- Time tracking

### Manager Role
- Dashboard access
- Project management
- Client management
- Team viewing
- Reports and analytics
- Settings access (paid plans)
- Time tracking

### Member Role
- Time tracker access
- Settings access (paid plans only)
- Limited to assigned projects
- View own time entries

## Time Tracking

### Time Entry Management
- Create time entries
- Edit existing entries
- Delete time entries
- Start/stop timer
- Manual time entry
- Date and duration tracking
- Project assignment
- Task description
- Billable/non-billable flag
- Status tracking (draft, submitted, approved)

### Project Management
- Create and manage projects
- Project name and description
- Client assignment
- Hourly rate configuration
- Budget tracking
- Status management (active, completed, archived)
- Color coding
- Project archival

### Client Management
- Add new clients
- Client contact information
- Email and phone
- Address details
- Active/inactive status
- Associate clients with projects
- Client archival

### Project Assignments
- Assign users to projects
- Role-based project access
- Assignment tracking
- Remove user assignments
- View project team members

## Dashboard & Analytics

### Dashboard Metrics
- Total hours tracked
- Billable percentage
- Active projects count
- Utilization rate
- Recent time entries
- Project summaries

### Reporting
- Time entry reports
- Project-based reports
- Client-based reports
- User productivity reports
- Billable hours analysis
- Date range filtering

## Settings & Configuration

### Account Settings (My Account)
- Email address management
- Name (first and last)
- Password change
  - Current password verification
  - New password with confirmation
  - Password strength requirements

### Organization Settings
- Organization name
- Timezone selection (PST, EST, UTC, etc.)
- Currency configuration (USD, EUR, GBP)
- Default settings for new projects

### Billing Settings
- Default hourly rate
- Rate configuration
- Billing preferences

## User Interface Features

### Navigation
- Collapsible sidebar
- Workspace selector
- User profile dropdown
- Logout functionality
- Settings link in user menu
- Role-based menu items

### Theme Support
- Light mode
- Dark mode
- Theme persistence
- System preference detection

### Responsive Design
- Mobile-friendly interface
- Tablet optimization
- Desktop-first design
- Adaptive layouts

### Components
- Professional UI with Shadcn/ui
- Accessible components (Radix UI)
- Toast notifications
- Loading states
- Error handling
- Form validation
- Modal dialogs
- Dropdown menus
- Data tables

## Security Features

### Authentication Security
- Bcrypt password hashing (10 rounds)
- Session-based authentication
- Secure cookie configuration
- CSRF protection
- Session expiration

### Authorization
- Route-level protection
- API endpoint guards
- Workspace membership validation
- Role-based access checks
- Plan-based feature gates

### Data Security
- Complete tenant isolation
- Workspace-scoped queries
- Membership verification on all data access
- Cross-tenant data leak prevention
- Payment metadata verification

## API Features

### RESTful API
- `/api/auth/*` - Authentication endpoints
- `/api/workspaces/*` - Workspace management
- `/api/clients/*` - Client management
- `/api/projects/*` - Project management
- `/api/time-entries/*` - Time tracking
- `/api/users/*` - User management
- `/api/dashboard/*` - Analytics
- `/api/create-payment-intent` - Payment initiation
- `/api/confirm-payment` - Payment verification

### API Security
- Authentication required for all endpoints
- Workspace context validation
- Role-based endpoint protection
- Request body validation with Zod
- Error handling and appropriate status codes

## Development Features

### Type Safety
- TypeScript throughout
- Shared schema definitions
- Zod validation
- Type inference from database schema
- Drizzle ORM type safety

### Developer Experience
- Hot Module Replacement (HMR)
- Fast refresh
- TypeScript error checking
- ESLint configuration
- Automatic restarts on changes

### Database
- PostgreSQL with Drizzle ORM
- Migration system
- UUID primary keys
- Indexed queries
- Cascading deletes
- Timestamp tracking

## Testing Capabilities

### Data Test IDs
- All interactive elements tagged
- Form inputs identified
- Buttons labeled
- Links marked
- Dynamic content tagged
- Consistent naming convention

### Error Handling
- User-friendly error messages
- Toast notifications
- Form validation errors
- API error responses
- Loading states
- Network error handling
