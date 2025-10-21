---
noteId: "54ea46c0aaa911f08d91090a55325676"
tags: []

---

# Database Setup Guide

This guide covers how to configure PostgreSQL for your TimeTrack application, supporting local, network, and cloud database connections.

## Quick Start

The application supports three types of PostgreSQL connections:

1. **Local PostgreSQL** - Development on your machine
2. **Network PostgreSQL** - Remote PostgreSQL server on your network
3. **Neon Serverless** - Cloud PostgreSQL with WebSocket support

## Configuration

All database configuration is done via the `.env` file. The application uses the `DATABASE_URL` environment variable.

### Local PostgreSQL

For development on your local machine:

```env
DATABASE_URL=postgresql://username:password@localhost:5432/database_name
```

**Example:**
```env
DATABASE_URL=postgresql://ff_user:mypassword@localhost:5432/FocusFlow
```

### Network PostgreSQL (LAN/VPN)

For connecting to a PostgreSQL server on your network:

```env
# Without SSL
DATABASE_URL=postgresql://username:password@192.168.1.100:5432/database_name

# With SSL
DATABASE_URL=postgresql://username:password@db.example.com:5432/database_name?sslmode=require
DB_SSL=true
```

**For self-signed certificates:**
```env
DATABASE_URL=postgresql://username:password@db.example.com:5432/database_name
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
```

### Neon Serverless (Cloud)

For Neon PostgreSQL:

```env
DATABASE_URL=postgresql://user:password@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

## SSL Configuration

The application automatically configures SSL based on your connection:

- **Local connections** (localhost/127.0.0.1): SSL disabled by default
- **Network connections with `sslmode=require`**: SSL enabled automatically
- **Manual SSL control**: Use `DB_SSL=true` environment variable

### SSL Options

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_SSL` | `false` | Enable SSL for database connections |
| `DB_SSL_REJECT_UNAUTHORIZED` | `true` | Reject self-signed certificates |

## Connection Pool Settings

The application uses connection pooling with these defaults:

- **Max connections**: 20
- **Idle timeout**: 30 seconds
- **Connection timeout**: 10 seconds

These are optimized for production use and work well for most scenarios.

## Setting Up PostgreSQL

### Option 1: Local PostgreSQL Installation

#### Windows (WSL)
```bash
# Install PostgreSQL
sudo apt update
sudo apt install postgresql postgresql-contrib

# Start PostgreSQL service
sudo service postgresql start

# Create user and database
sudo -u postgres psql
postgres=# CREATE USER ff_user WITH PASSWORD 'your_password';
postgres=# CREATE DATABASE FocusFlow OWNER ff_user;
postgres=# \q
```

#### macOS
```bash
# Install via Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb FocusFlow
```

#### Linux
```bash
# Install PostgreSQL
sudo apt install postgresql postgresql-contrib

# Start service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create user and database
sudo -u postgres psql
postgres=# CREATE USER ff_user WITH PASSWORD 'your_password';
postgres=# CREATE DATABASE FocusFlow OWNER ff_user;
postgres=# GRANT ALL PRIVILEGES ON DATABASE FocusFlow TO ff_user;
postgres=# \q
```

### Option 2: Docker PostgreSQL

```bash
# Run PostgreSQL in Docker
docker run -d \
  --name timetrack-db \
  -e POSTGRES_USER=ff_user \
  -e POSTGRES_PASSWORD=your_password \
  -e POSTGRES_DB=FocusFlow \
  -p 5432:5432 \
  -v timetrack-data:/var/lib/postgresql/data \
  postgres:15

# Check logs
docker logs timetrack-db
```

**Using Docker Compose:**

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_USER: ff_user
      POSTGRES_PASSWORD: your_password
      POSTGRES_DB: FocusFlow
    ports:
      - "5432:5432"
    volumes:
      - postgres-data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ff_user"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres-data:
```

Start with:
```bash
docker-compose up -d
```

### Option 3: Network PostgreSQL

#### Configure PostgreSQL for Network Access

Edit `postgresql.conf`:
```conf
listen_addresses = '*'  # or specific IP
port = 5432
```

Edit `pg_hba.conf`:
```conf
# Allow connections from your network
host    all    all    192.168.1.0/24    md5
# Or for specific IP
host    all    all    192.168.1.100/32  md5
```

Restart PostgreSQL:
```bash
sudo systemctl restart postgresql
```

#### Firewall Configuration

```bash
# Ubuntu/Debian
sudo ufw allow 5432/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=5432/tcp
sudo firewall-cmd --reload
```

### Option 4: Neon Serverless

1. Sign up at [neon.tech](https://neon.tech)
2. Create a new project
3. Copy the connection string
4. Update `.env`:
   ```env
   DATABASE_URL=postgresql://user:pass@ep-xxx.neon.tech/neondb?sslmode=require
   ```

## Database Migrations

After configuring your database connection:

```bash
# Push schema to database (creates all tables)
npm run db:push

# Start development server (auto-runs migrations)
npm run dev
```

## Troubleshooting

### Connection Refused

**Problem:** `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solutions:**
1. PostgreSQL is not running: `sudo service postgresql start`
2. Wrong host/port in DATABASE_URL
3. Firewall blocking port 5432

### Authentication Failed

**Problem:** `password authentication failed for user "xxx"`

**Solutions:**
1. Check username and password in DATABASE_URL
2. User doesn't exist: Create the user in PostgreSQL
3. Check `pg_hba.conf` authentication method

### SSL Connection Failed

**Problem:** `SSL connection failed`

**Solutions:**
1. Remove `sslmode=require` from DATABASE_URL for local connections
2. For self-signed certificates, set `DB_SSL_REJECT_UNAUTHORIZED=false`
3. Check if PostgreSQL has SSL enabled: `SHOW ssl;` in psql

### Database Does Not Exist

**Problem:** `database "xxx" does not exist`

**Solution:**
```bash
# Create the database
createdb -U ff_user FocusFlow

# Or via psql
sudo -u postgres psql
postgres=# CREATE DATABASE FocusFlow OWNER ff_user;
```

### Network Connection Timeout

**Problem:** Connection times out when connecting to network database

**Solutions:**
1. Check firewall allows port 5432
2. Verify PostgreSQL is configured to accept network connections
3. Check `postgresql.conf`: `listen_addresses = '*'`
4. Verify `pg_hba.conf` allows your IP address
5. Test connectivity: `telnet db-host 5432`

## Testing Your Connection

```bash
# Test local connection
psql -U ff_user -d FocusFlow -h localhost

# Test network connection
psql -U ff_user -d FocusFlow -h 192.168.1.100

# Test SSL connection
psql "postgresql://user:pass@host:5432/db?sslmode=require"
```

## Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `DATABASE_URL` | Yes | - | Full PostgreSQL connection string |
| `DB_SSL` | No | `false` | Enable SSL connections |
| `DB_SSL_REJECT_UNAUTHORIZED` | No | `true` | Reject self-signed certificates |

## Production Recommendations

For production deployments:

1. **Use SSL** for all network connections
2. **Use connection pooling** (enabled by default)
3. **Set strong passwords** in DATABASE_URL
4. **Enable PostgreSQL logging** for debugging
5. **Regular backups** via `pg_dump`
6. **Monitor connections** with `pg_stat_activity`

## Support

For issues with:
- PostgreSQL installation: See [PostgreSQL documentation](https://www.postgresql.org/docs/)
- Network configuration: Check your network admin
- Application-specific issues: Check the main README.md
