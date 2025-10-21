import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '../useAuth';
import type { User } from '@shared/schema';

describe('useAuth', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          // Use a custom queryFn that uses global.fetch
          queryFn: async ({ queryKey }) => {
            const url = queryKey[0] as string;
            const res = await fetch(url, {
              credentials: 'include',
            });

            if (!res.ok) {
              const text = (await res.text()) || res.statusText;
              throw new Error(`${res.status}: ${text}`);
            }

            return await res.json();
          },
        },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('should return user when authenticated', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      username: 'testuser',
      password: null,
      name: 'Test User',
      role: 'admin',
      hourlyRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);

    // Wait for the query to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should have user data
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);

    // Verify fetch was called with correct parameters
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/user',
      expect.objectContaining({
        credentials: 'include',
      })
    );
  });

  it('should return null when not authenticated (401)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      text: async () => 'Unauthorized',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to complete with error
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not have user data
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle loading state during fetch', () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise(() => {
          // Never resolves, keeps it in loading state
        })
    );

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Should be loading
    expect(result.current.isLoading).toBe(true);
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should handle error on fetch failure', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      text: async () => 'Internal Server Error',
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not have user data on error
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should use correct query key structure', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      username: 'testuser',
      password: null,
      name: 'Test User',
      role: 'admin',
      hourlyRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify the query key is correct by checking the fetch URL
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/auth/user',
      expect.any(Object)
    );
  });

  it('should not retry on failure', async () => {
    let callCount = 0;
    global.fetch = vi.fn().mockImplementation(() => {
      callCount++;
      return Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        text: async () => 'Internal Server Error',
      });
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should only be called once (no retry)
    expect(callCount).toBe(1);
  });

  it('should handle network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    // Initially should be loading
    expect(result.current.isLoading).toBe(true);

    // Wait for the query to fail
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should not have user data on network error
    expect(result.current.user).toBeUndefined();
    expect(result.current.isAuthenticated).toBe(false);
  });

  it('should correctly compute isAuthenticated based on user presence', async () => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
      username: 'testuser',
      password: null,
      name: 'Test User',
      role: 'member',
      hourlyRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // isAuthenticated should be true when user exists
    expect(result.current.isAuthenticated).toBe(true);
    expect(!!result.current.user).toBe(result.current.isAuthenticated);
  });

  it('should handle user with all optional fields as null', async () => {
    const mockUser: User = {
      id: '2',
      email: 'minimal@example.com',
      firstName: null,
      lastName: null,
      profileImageUrl: null,
      username: null,
      password: null,
      name: 'Minimal User',
      role: 'member',
      hourlyRate: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockUser,
    });

    const { result } = renderHook(() => useAuth(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Should still authenticate with minimal user data
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should handle different user roles', async () => {
    const roles: Array<'owner' | 'admin' | 'manager' | 'member'> = [
      'owner',
      'admin',
      'manager',
      'member',
    ];

    for (const role of roles) {
      const mockUser: User = {
        id: '1',
        email: 'test@example.com',
        firstName: 'Test',
        lastName: 'User',
        profileImageUrl: null,
        username: 'testuser',
        password: null,
        name: 'Test User',
        role,
        hourlyRate: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => mockUser,
      });

      const { result } = renderHook(() => useAuth(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.user?.role).toBe(role);
      expect(result.current.isAuthenticated).toBe(true);
    }
  });
});
