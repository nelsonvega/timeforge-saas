import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables for tests
// Use the same database as development but we'll truncate tables in tests
// This allows tests to use the existing database without authentication issues
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://ff_user:4Ffuser123$@localhost:5432/FocusFlow';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-key-for-testing-only';
process.env.VITE_STRIPE_PUBLIC_KEY = process.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.REPL_ID = process.env.REPL_ID || 'test-repl-id';
process.env.ISSUER_URL = process.env.ISSUER_URL || 'https://replit.com/oidc';
