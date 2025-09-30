import type { Request, Response, NextFunction } from "express";
import type { User, UserRole } from "@shared/schema";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as User | undefined;

    if (!user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (!allowedRoles.includes(user.role as UserRole)) {
      return res.status(403).json({ 
        message: "Access denied. Insufficient permissions." 
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
