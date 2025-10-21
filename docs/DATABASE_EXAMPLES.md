---
noteId: "8d84f020aaa911f08d91090a55325676"
tags: []

---

# Database Configuration Examples

Quick reference for common PostgreSQL connection scenarios.

## Local Development

### Standard Local Setup
```env
DATABASE_URL=postgresql://ff_user:mypassword@localhost:5432/FocusFlow
```

### Local with Docker
```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/timetrack
```

### Custom Port
```env
DATABASE_URL=postgresql://ff_user:mypassword@localhost:5433/FocusFlow
```

## Network Connections

### LAN Database (No SSL)
```env
DATABASE_URL=postgresql://timetrack_user:SecurePass123@192.168.1.100:5432/timetrack_db
```

### Remote Database with SSL
```env
DATABASE_URL=postgresql://admin:password@db.company.com:5432/production?sslmode=require
DB_SSL=true
```

### Self-Signed Certificate
```env
DATABASE_URL=postgresql://admin:password@db.internal.local:5432/timetrack
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### VPN Connection
```env
DATABASE_URL=postgresql://remote_user:VpnPass456@10.8.0.5:5432/timetrack_prod?sslmode=require
DB_SSL=true
```

## Cloud Providers

### Neon
```env
DATABASE_URL=postgresql://username:password@ep-cool-darkness-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### AWS RDS
```env
DATABASE_URL=postgresql://admin:password@mydb.abc123.us-east-1.rds.amazonaws.com:5432/timetrack?sslmode=require
DB_SSL=true
```

### Digital Ocean
```env
DATABASE_URL=postgresql://doadmin:password@mydb-do-user-123456-0.db.ondigitalocean.com:25060/defaultdb?sslmode=require
DB_SSL=true
```

### Heroku
```env
DATABASE_URL=postgresql://user:password@ec2-123-456-789.compute-1.amazonaws.com:5432/d1a2b3c4d5e6f7?sslmode=require
DB_SSL=true
```

### Supabase
```env
DATABASE_URL=postgresql://postgres:password@db.xxxxxxxxxxxx.supabase.co:5432/postgres?sslmode=require
DB_SSL=true
```

## Docker Compose

### Development Stack
```yaml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://timetrack:devpass@postgres:5432/timetrack_dev
      NODE_ENV: development
    depends_on:
      - postgres

  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: timetrack
      POSTGRES_PASSWORD: devpass
      POSTGRES_DB: timetrack_dev
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data

volumes:
  postgres-data:
```

**.env for this setup:**
```env
DATABASE_URL=postgresql://timetrack:devpass@localhost:5432/timetrack_dev
```

## Testing Configurations

### Test Database
```env
# .env.test
DATABASE_URL=postgresql://test_user:testpass@localhost:5432/timetrack_test
```

### CI/CD
```env
# GitHub Actions / GitLab CI
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/test_db
```

## Connection String Formats

### Basic Format
```
postgresql://username:password@host:port/database
```

### With SSL
```
postgresql://username:password@host:port/database?sslmode=require
```

### Multiple Parameters
```
postgresql://user:pass@host:port/db?sslmode=require&connect_timeout=10&application_name=timetrack
```

### Using Environment Variables
You can also use individual PostgreSQL environment variables (though DATABASE_URL is preferred):

```env
PGHOST=localhost
PGPORT=5432
PGUSER=ff_user
PGPASSWORD=mypassword
PGDATABASE=FocusFlow
PGSSLMODE=disable
```

## Common Issues

### Special Characters in Password
If your password contains special characters, URL-encode them:

| Character | Encoded |
|-----------|---------|
| @ | %40 |
| : | %3A |
| / | %2F |
| # | %23 |
| ? | %3F |
| & | %26 |
| = | %3D |
| $ | %24 |

**Example:**
```env
# Password: My$ecure@Pass
DATABASE_URL=postgresql://user:My%24ecure%40Pass@localhost:5432/db
```

### IPv6 Addresses
Wrap IPv6 addresses in brackets:
```env
DATABASE_URL=postgresql://user:pass@[2001:db8::1]:5432/database
```

## Testing Your Configuration

After setting up your `.env` file, test the connection:

```bash
npm run db:test
```

This will:
- ✅ Verify DATABASE_URL is set
- ✅ Display connection details (password hidden)
- ✅ Test database connectivity
- ✅ Show PostgreSQL version
- ✅ List existing tables
- ❌ Provide helpful error messages if something fails

## Quick Setup Scripts

### Create Local Database
```bash
# PostgreSQL must be running
createdb -U postgres FocusFlow
psql -U postgres -c "CREATE USER ff_user WITH PASSWORD 'your_password';"
psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE FocusFlow TO ff_user;"
```

### Docker PostgreSQL Quick Start
```bash
docker run -d \
  --name timetrack-postgres \
  -e POSTGRES_USER=ff_user \
  -e POSTGRES_PASSWORD=secure_pass_123 \
  -e POSTGRES_DB=FocusFlow \
  -p 5432:5432 \
  postgres:15-alpine

# Then use:
# DATABASE_URL=postgresql://ff_user:secure_pass_123@localhost:5432/FocusFlow
```

### Check Connection from Command Line
```bash
# Test connection
psql "postgresql://ff_user:password@localhost:5432/FocusFlow" -c "SELECT 1;"

# Or using individual parameters
psql -h localhost -p 5432 -U ff_user -d FocusFlow -c "SELECT version();"
```

## Environment-Specific Configurations

### Development (.env.development)
```env
DATABASE_URL=postgresql://dev_user:devpass@localhost:5432/timetrack_dev
NODE_ENV=development
```

### Staging (.env.staging)
```env
DATABASE_URL=postgresql://staging_user:stagingpass@staging-db.internal:5432/timetrack_staging?sslmode=require
NODE_ENV=staging
DB_SSL=true
```

### Production (.env.production)
```env
DATABASE_URL=postgresql://prod_user:prod_pass@prod-db.company.com:5432/timetrack_prod?sslmode=require
NODE_ENV=production
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=true
```

## Performance Tuning

For high-traffic production environments, you can tune the connection pool in `server/db.ts`:

```typescript
const poolConfig: pg.PoolConfig = {
  connectionString: databaseUrl,
  max: 50,                      // Increase for high traffic
  min: 10,                      // Maintain minimum connections
  idleTimeoutMillis: 30000,     // Keep connections alive longer
  connectionTimeoutMillis: 5000, // Faster timeout
};
```

## Security Best Practices

1. **Never commit `.env` files** to version control
2. **Use strong passwords** for production databases
3. **Enable SSL** for all network connections
4. **Use read replicas** for reporting queries (requires code changes)
5. **Rotate credentials** regularly
6. **Use environment-specific databases** (dev/staging/prod)
7. **Limit database user permissions** to only what's needed
8. **Monitor connection pools** for leaks

## Need More Help?

- 📖 [Full Database Setup Guide](DATABASE_SETUP.md)
- 🐛 [Troubleshooting Guide](DATABASE_SETUP.md#troubleshooting)
- 🔍 Test connection: `npm run db:test`
