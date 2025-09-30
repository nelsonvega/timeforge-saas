import type { Request, Response, NextFunction } from "express";
import type { User, UserRole, WorkspaceMembership } from "@shared/schema";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: any, res: Response, next: NextFunction) => {
    const user = req.user as User | undefined;
    const membership = req.workspaceMembership as WorkspaceMembership | undefined;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // Check workspace-specific role if membership exists
    const roleToCheck = membership ? membership.role : user.role;

    if (!allowedRoles.includes(roleToCheck as UserRole)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions for this workspace." 
      });
    }

    next();
  };
}

export function canAccessResource(userRole: string): {
  canAccessDashboard: boolean;
  canAccessProjects: boolean;
  canAccessClients: boolean;
  canAccessTeam: boolean;
  canAccessReports: boolean;
  canAccessTracker: boolean;
  canAccessSettings: boolean;
} {
  const isAdmin = userRole === "admin";
  const isManager = userRole === "manager";
  const isMember = userRole === "member";

  return {
    canAccessDashboard: isAdmin || isManager,
    canAccessProjects: isAdmin || isManager,
    canAccessClients: isAdmin || isManager,
    canAccessTeam: isAdmin || isManager,
    canAccessReports: isAdmin || isManager,
    canAccessTracker: true,
    canAccessSettings: true,
  };
}
