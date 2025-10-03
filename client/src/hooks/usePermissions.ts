import { useAuth } from "./useAuth";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useQuery } from "@tanstack/react-query";

export function usePermissions() {
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const { selectedWorkspace, isLoading: workspaceContextLoading } = useWorkspace();

  // Fetch detailed workspace info including tenant plan
  const { data: workspaceDetails, isFetching: workspaceFetching } = useQuery({
    queryKey: [`/api/workspaces/${selectedWorkspace?.id}`],
    enabled: !!selectedWorkspace?.id && isAuthenticated,
  });

  const userRole = user?.role || "member";
  const tenantPlan = (workspaceDetails as any)?.tenant?.plan;
  
  // For unauthenticated users, stop loading immediately after auth check
  // For authenticated users, wait for workspace data
  const isLoading = authLoading || (isAuthenticated && (workspaceContextLoading || !selectedWorkspace?.id || workspaceFetching));

  const canAccessDashboard = userRole === "admin" || userRole === "manager";
  const canAccessProjects = userRole === "admin" || userRole === "manager";
  const canAccessClients = userRole === "admin" || userRole === "manager";
  const canAccessTeam = userRole === "admin" || userRole === "manager";
  const canAccessReports = userRole === "admin" || userRole === "manager";
  const canAccessTracker = true;
  // Only grant settings access if we have loaded the plan and it's paid
  const canAccessSettings = tenantPlan === "paid";

  return {
    user,
    isLoading,
    isAuthenticated,
    canAccessDashboard,
    canAccessProjects,
    canAccessClients,
    canAccessTeam,
    canAccessReports,
    canAccessTracker,
    canAccessSettings,
    userRole,
    tenantPlan,
    isAdmin: userRole === "admin",
    isManager: userRole === "manager",
    isMember: userRole === "member",
  };
}
