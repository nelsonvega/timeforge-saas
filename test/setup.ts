import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test
afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

// Mock environment variables for tests
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test';
process.env.SESSION_SECRET = process.env.SESSION_SECRET || 'test-secret-key-for-testing-only';
process.env.VITE_STRIPE_PUBLIC_KEY = process.env.VITE_STRIPE_PUBLIC_KEY || 'pk_test_mock';
process.env.STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY || 'sk_test_mock';
process.env.REPL_ID = process.env.REPL_ID || 'test-repl-id';
process.env.ISSUER_URL = process.env.ISSUER_URL || 'https://replit.com/oidc';
