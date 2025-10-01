import { Request, Response, NextFunction } from "express";
import { storage } from "../storage";

export async function requireWorkspace(req: any, res: Response, next: NextFunction) {
  try {
    const workspaceId = req.query.workspaceId as string || req.headers['x-workspace-id'] as string;
    
    if (!workspaceId) {
      return res.status(400).json({ error: "Workspace ID is required" });
    }

    if (!req.user) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const membership = await storage.getWorkspaceMembership(workspaceId, req.user.id);
    
    if (!membership) {
      return res.status(403).json({ error: "Not a member of this workspace" });
    }

    req.workspaceId = workspaceId;
    req.workspaceMembership = membership;
    req.userRole = membership.role;
    
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
