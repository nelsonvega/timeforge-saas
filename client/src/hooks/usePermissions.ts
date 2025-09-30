import { useAuth } from "./useAuth";

export function usePermissions() {
  const { user, isLoading, isAuthenticated } = useAuth();

  const userRole = user?.role || "member";

  const canAccessDashboard = userRole === "admin" || userRole === "manager";
  const canAccessProjects = userRole === "admin" || userRole === "manager";
  const canAccessClients = userRole === "admin" || userRole === "manager";
  const canAccessTeam = userRole === "admin" || userRole === "manager";
  const canAccessReports = userRole === "admin" || userRole === "manager";
  const canAccessTracker = true;
  const canAccessSettings = true;

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
    isAdmin: userRole === "admin",
    isManager: userRole === "manager",
    isMember: userRole === "member",
  };
}
