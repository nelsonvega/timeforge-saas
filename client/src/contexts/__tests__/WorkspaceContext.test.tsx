import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WorkspaceProvider, useWorkspace } from '../WorkspaceContext';
import type { Workspace } from '@shared/schema';

// Mock localStorage
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('WorkspaceContext', () => {
  let queryClient: QueryClient;

  const mockWorkspaces: Workspace[] = [
    {
      id: 'ws1',
      tenantId: 't1',
      name: 'Workspace 1',
      slug: 'workspace-1',
      timezone: 'UTC',
      status: 'active',
      createdAt: new Date('2024-01-01'),
      updatedAt: new Date('2024-01-01'),
    },
    {
      id: 'ws2',
      tenantId: 't1',
      name: 'Workspace 2',
      slug: 'workspace-2',
      timezone: 'America/New_York',
      status: 'active',
      createdAt: new Date('2024-01-02'),
      updatedAt: new Date('2024-01-02'),
    },
    {
      id: 'ws3',
      tenantId: 't1',
      name: 'Workspace 3',
      slug: 'workspace-3',
      timezone: 'UTC',
      status: 'active',
      createdAt: new Date('2024-01-03'),
      updatedAt: new Date('2024-01-03'),
    },
  ];

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          gcTime: 0,
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
    localStorageMock.clear();
  });

  afterEach(() => {
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  const createWrapper = () => {
    return ({ children }: { children: React.ReactNode }) => (
      <QueryClientProvider client={queryClient}>
        <WorkspaceProvider>{children}</WorkspaceProvider>
      </QueryClientProvider>
    );
  };

  describe('useWorkspace hook', () => {
    it('should throw an error when used outside WorkspaceProvider', () => {
      // Suppress console.error for this test
      const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

      expect(() => {
        renderHook(() => useWorkspace());
      }).toThrow('useWorkspace must be used within a WorkspaceProvider');

      consoleError.mockRestore();
    });

    it('should return context when used within WorkspaceProvider', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('workspaces');
      expect(result.current).toHaveProperty('selectedWorkspace');
      expect(result.current).toHaveProperty('setSelectedWorkspace');
      expect(result.current).toHaveProperty('isLoading');
    });
  });

  describe('Workspace list fetching', () => {
    it('should fetch and display workspaces', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.workspaces).toEqual(mockWorkspaces);
      expect(result.current.workspaces.length).toBe(3);
    });

    it('should handle empty workspace list', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.workspaces).toEqual([]);
      expect(result.current.selectedWorkspace).toBeNull();
    });

    it('should handle fetch errors gracefully', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.workspaces).toEqual([]);
    });
  });

  describe('Auto-select first workspace', () => {
    it('should auto-select the first workspace when no localStorage value exists', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      expect(result.current.selectedWorkspace).toEqual(mockWorkspaces[0]);
    });
  });

  describe('Auto-select from localStorage', () => {
    it('should auto-select workspace from localStorage if it exists', async () => {
      localStorageMock.setItem('selectedWorkspaceId', 'ws2');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      expect(result.current.selectedWorkspace).toEqual(mockWorkspaces[1]);
      expect(result.current.selectedWorkspace?.id).toBe('ws2');
    });

    it('should not select workspace if localStorage workspace not found', async () => {
      // Note: Current implementation doesn't fallback to first workspace
      // if the saved workspace ID is not found in the workspaces array.
      // This may be a bug, but we're testing current behavior.
      localStorageMock.setItem('selectedWorkspaceId', 'ws-non-existent');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Current behavior: selectedWorkspace stays null if saved ID not found
      expect(result.current.selectedWorkspace).toBeNull();
      expect(result.current.workspaces).toEqual(mockWorkspaces);
    });
  });

  describe('Workspace selection', () => {
    it('should allow selecting a workspace', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      // Initially should be first workspace
      expect(result.current.selectedWorkspace?.id).toBe('ws1');

      // Select different workspace
      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[2]);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws3');
      });
    });
  });

  describe('Workspace switching', () => {
    it('should switch workspaces and update localStorage', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      // Switch to workspace 2
      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[1]);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws2');
      });

      expect(localStorageMock.getItem('selectedWorkspaceId')).toBe('ws2');

      // Switch to workspace 3
      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[2]);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws3');
      });

      expect(localStorageMock.getItem('selectedWorkspaceId')).toBe('ws3');
    });
  });

  describe('LocalStorage persistence', () => {
    it('should persist selected workspace to localStorage', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[1]);
      });

      await waitFor(() => {
        expect(localStorageMock.getItem('selectedWorkspaceId')).toBe('ws2');
      });
    });

    it('should load persisted workspace on mount', async () => {
      localStorageMock.setItem('selectedWorkspaceId', 'ws3');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws3');
      });
    });
  });

  describe('Loading state management', () => {
    it('should show loading state while fetching workspaces', async () => {
      let resolvePromise: (value: any) => void;
      const promise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      global.fetch = vi.fn().mockReturnValue(promise);

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      expect(result.current.isLoading).toBe(true);
      expect(result.current.workspaces).toEqual([]);
      expect(result.current.selectedWorkspace).toBeNull();

      resolvePromise!({
        ok: true,
        json: async () => mockWorkspaces,
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.workspaces).toEqual(mockWorkspaces);
    });

    it('should set isLoading to false after successful fetch', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('should set isLoading to false after failed fetch', async () => {
      global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Context provider values', () => {
    it('should provide all required context values', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      expect(result.current).toHaveProperty('workspaces');
      expect(result.current).toHaveProperty('selectedWorkspace');
      expect(result.current).toHaveProperty('setSelectedWorkspace');
      expect(result.current).toHaveProperty('isLoading');

      expect(Array.isArray(result.current.workspaces)).toBe(true);
      expect(typeof result.current.isLoading).toBe('boolean');
      expect(typeof result.current.setSelectedWorkspace).toBe('function');
    });

    it('should provide correct initial values', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      // Initial state should show loading
      expect(result.current.isLoading).toBe(true);
      expect(result.current.workspaces).toEqual([]);
      expect(result.current.selectedWorkspace).toBeNull();

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Workspace not found scenario', () => {
    it('should handle workspace not found in list', async () => {
      // Note: Testing current behavior where workspace stays null
      // if the saved ID is not found in the workspaces array
      localStorageMock.setItem('selectedWorkspaceId', 'ws-deleted');

      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      // Current behavior: workspace stays null if saved ID not found
      expect(result.current.selectedWorkspace).toBeNull();
      expect(result.current.workspaces).toEqual(mockWorkspaces);
    });

    it('should handle selecting a workspace that does not exist', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      const nonExistentWorkspace: Workspace = {
        id: 'ws-invalid',
        tenantId: 't1',
        name: 'Invalid Workspace',
        slug: 'invalid',
        timezone: 'UTC',
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Attempt to select non-existent workspace
      act(() => {
        result.current.setSelectedWorkspace(nonExistentWorkspace);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws-invalid');
      });

      // Should still set it (no validation in the context)
      expect(localStorageMock.getItem('selectedWorkspaceId')).toBe('ws-invalid');
    });
  });

  describe('Provider rendering', () => {
    it('should render children correctly', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      render(
        <QueryClientProvider client={queryClient}>
          <WorkspaceProvider>
            <div data-testid="child">Child Component</div>
          </WorkspaceProvider>
        </QueryClientProvider>
      );

      expect(screen.getByTestId('child')).toBeInTheDocument();
      expect(screen.getByText('Child Component')).toBeInTheDocument();
    });
  });

  describe('Multiple workspace switches', () => {
    it('should handle multiple rapid workspace switches', async () => {
      global.fetch = vi.fn().mockResolvedValue({
        ok: true,
        json: async () => mockWorkspaces,
      });

      const { result } = renderHook(() => useWorkspace(), {
        wrapper: createWrapper(),
      });

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace).not.toBeNull();
      });

      // Rapidly switch workspaces
      act(() => {
        result.current.setSelectedWorkspace(mockWorkspaces[0]);
        result.current.setSelectedWorkspace(mockWorkspaces[1]);
        result.current.setSelectedWorkspace(mockWorkspaces[2]);
      });

      await waitFor(() => {
        expect(result.current.selectedWorkspace?.id).toBe('ws3');
      });

      expect(localStorageMock.getItem('selectedWorkspaceId')).toBe('ws3');
    });
  });
});
