# TimeTrack - Multi-Tenant Time Tracking SaaS

A professional time tracking SaaS application designed for agencies, consulting firms, and teams to track billable and non-billable hours across clients and projects with complete tenant isolation.

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- PostgreSQL database (Neon serverless)

### Installation

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Configure your database and required secrets in .env:
# - DATABASE_URL
# - SESSION_SECRET
# - STRIPE_SECRET_KEY
# - VITE_STRIPE_PUBLIC_KEY

# Run database migrations
npm run db:push

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## ✨ Key Features

### Multi-Tenant Architecture
- **Complete Data Isolation**: Tenant → Workspace → Membership model
- **Workspace Management**: Multiple workspaces per tenant with role-based access
- **Cross-Workspace Support**: Users can belong to multiple workspaces with different roles

### Dual Authentication System
- **Email/Password Login**: Secure authentication with bcrypt password hashing (10 rounds)
- **Google OAuth**: Quick sign-in via Replit Auth with OIDC
- **Session Management**: PostgreSQL-backed sessions with 7-day TTL
- **Auto-Refresh**: Automatic token refresh for OAuth sessions

### Plan-Based Access Control
- **Free Plan**: Access to time tracker only
- **Paid Plan ($15)**: Full access to tracker and settings
- **Stripe Integration**: Secure one-time payment processing
- **Plan Enforcement**: Both client and server-side access controls

### Role-Based Permissions
- **Admin**: Full access to all features and management capabilities
- **Manager**: Access to dashboard, projects, clients, team, and reports
- **Member**: Access to time tracker (and settings on paid plans)

### Time Tracking Features
- Track time entries with project and task details
- Billable vs non-billable hours
- Project assignments and user management
- Dashboard with metrics and analytics
- Comprehensive reporting

## 🏗️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast builds and HMR
- **TanStack Query** for server state management
- **Wouter** for lightweight routing
- **Shadcn/ui** + Radix UI for accessible components
- **Tailwind CSS** for styling

### Backend
- **Express.js** with TypeScript
- **Passport.js** for authentication (Local + OAuth)
- **Drizzle ORM** for type-safe database queries
- **Stripe** for payment processing
- **PostgreSQL** (Neon serverless)

### Security
- bcrypt password hashing
- Session-based authentication
- CSRF protection
- Workspace membership validation
- Plan-based feature gating

## 📁 Project Structure

```
├── client/                  # Frontend React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts (Auth, Workspace)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utility functions
│   │   └── pages/          # Route components
├── server/                  # Backend Express application
│   ├── db.ts               # Database connection
│   ├── middleware/         # Express middleware
│   ├── replitAuth.ts       # Authentication setup
│   ├── routes.ts           # API routes
│   └── storage.ts          # Data access layer
├── shared/                  # Shared types and schemas
│   └── schema.ts           # Drizzle schema + Zod validation
├── migrations/             # Database migrations
└── docs/                   # Documentation
```

## 🔐 Authentication Flow

### Local Authentication (Email/Password)
1. User registers with email, password, company name, and plan selection
2. Password is hashed with bcrypt (10 rounds)
3. Creates: User → Tenant → Workspace → Membership
4. If paid plan selected, redirects to Stripe payment
5. After successful payment, tenant upgraded to paid plan

### OAuth Authentication (Google)
1. User clicks "Continue with Google"
2. Redirects to Replit Auth OIDC flow
3. On callback, user is created/updated
4. Session established with refresh token support

## 💳 Payment Flow

1. User selects paid plan during registration
2. Account created with "free" plan initially
3. User authenticates and payment intent created
4. Stripe Elements collects payment information
5. Frontend confirms payment with Stripe
6. Backend verifies payment and upgrades tenant to "paid"
7. User gains access to Settings page

## 🔒 Security Features

- **Password Security**: bcrypt with 10 rounds of salting
- **Session Security**: Secure, httpOnly cookies with 7-day expiration
- **CSRF Protection**: Session-based security
- **Membership Validation**: All workspace data access requires membership verification
- **Plan Enforcement**: Server-side and client-side access controls
- **Payment Verification**: PaymentIntent metadata validation before plan upgrade

## 🧪 Testing

See [docs/TESTING.md](docs/TESTING.md) for comprehensive testing documentation.

## 📚 Documentation

- [Feature List](docs/FEATURES.md) - Complete list of features
- [Implementation Details](docs/IMPLEMENTATION.md) - Technical implementation guide
- [Testing Guide](docs/TESTING.md) - Testing strategy and examples

## 🚢 Deployment

### Environment Variables

Required environment variables:

```env
# Database
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Authentication
SESSION_SECRET=your-secret-key
REPL_ID=your-repl-id
ISSUER_URL=https://replit.com/oidc

# Stripe
STRIPE_SECRET_KEY=sk_...
VITE_STRIPE_PUBLIC_KEY=pk_...

# Replit
REPLIT_DOMAINS=your-domain.replit.dev
```

### Publishing on Replit

The application is configured for Replit deployment:

1. All environment variables are already set up
2. Frontend binds to 0.0.0.0:5000
3. Database migrations run automatically
4. Use the "Publish" button to deploy

## 🤝 Contributing

This is a production application. For feature requests or bug reports, please contact the development team.

## 📄 License

Proprietary - All rights reserved

## 🆘 Support

For support, please contact your system administrator or the development team.

---

Built with ❤️ for modern teams
