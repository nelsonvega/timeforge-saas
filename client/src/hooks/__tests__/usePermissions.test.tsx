import { describe, it, expect, vi } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePermissions } from '../usePermissions';

// Mock useAuth hook
vi.mock('../useAuth', () => ({
  useAuth: vi.fn(),
}));

// Mock WorkspaceContext
vi.mock('../../contexts/WorkspaceContext', () => ({
  useWorkspace: vi.fn(),
}));

import { useAuth } from '../useAuth';
import { useWorkspace } from '../../contexts/WorkspaceContext';

describe('usePermissions', () => {
  const createWrapper = () => {
    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };

  it('should grant settings access for paid plans', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'admin', name: 'Test User' } as any,
      isLoading: false,
      isAuthenticated: true,
    });

    vi.mocked(useWorkspace).mockReturnValue({
      selectedWorkspace: { id: 'ws1', name: 'Workspace 1', slug: 'ws1' } as any,
      workspaces: [],
      setSelectedWorkspace: vi.fn(),
      isLoading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ws1',
        name: 'Workspace 1',
        tenant: {
          id: 't1',
          name: 'Tenant 1',
          plan: 'paid',
        },
      }),
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccessSettings).toBe(true);
  });

  it('should deny settings access for free plans', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'admin', name: 'Test User' } as any,
      isLoading: false,
      isAuthenticated: true,
    });

    vi.mocked(useWorkspace).mockReturnValue({
      selectedWorkspace: { id: 'ws1', name: 'Workspace 1', slug: 'ws1' } as any,
      workspaces: [],
      setSelectedWorkspace: vi.fn(),
      isLoading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ws1',
        name: 'Workspace 1',
        tenant: {
          id: 't1',
          name: 'Tenant 1',
          plan: 'free',
        },
      }),
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccessSettings).toBe(false);
  });

  it('should grant dashboard access for admin and manager', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'admin', name: 'Test User' } as any,
      isLoading: false,
      isAuthenticated: true,
    });

    vi.mocked(useWorkspace).mockReturnValue({
      selectedWorkspace: { id: 'ws1', name: 'Workspace 1', slug: 'ws1' } as any,
      workspaces: [],
      setSelectedWorkspace: vi.fn(),
      isLoading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ws1',
        name: 'Workspace 1',
        tenant: { id: 't1', name: 'Tenant 1', plan: 'paid' },
      }),
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccessDashboard).toBe(true);
    expect(result.current.canAccessProjects).toBe(true);
    expect(result.current.canAccessClients).toBe(true);
  });

  it('should deny dashboard access for member', async () => {
    vi.mocked(useAuth).mockReturnValue({
      user: { id: '1', email: 'test@example.com', role: 'member', name: 'Test User' } as any,
      isLoading: false,
      isAuthenticated: true,
    });

    vi.mocked(useWorkspace).mockReturnValue({
      selectedWorkspace: { id: 'ws1', name: 'Workspace 1', slug: 'ws1' } as any,
      workspaces: [],
      setSelectedWorkspace: vi.fn(),
      isLoading: false,
    });

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        id: 'ws1',
        name: 'Workspace 1',
        tenant: { id: 't1', name: 'Tenant 1', plan: 'free' },
      }),
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.canAccessDashboard).toBe(false);
    expect(result.current.canAccessProjects).toBe(false);
    expect(result.current.canAccessClients).toBe(false);
  });

  it('should handle loading states correctly', () => {
    vi.mocked(useAuth).mockReturnValue({
      user: undefined,
      isLoading: true,
      isAuthenticated: false,
    });

    vi.mocked(useWorkspace).mockReturnValue({
      selectedWorkspace: null as any,
      workspaces: [],
      setSelectedWorkspace: vi.fn(),
      isLoading: true,
    });

    const { result } = renderHook(() => usePermissions(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
  });
});
