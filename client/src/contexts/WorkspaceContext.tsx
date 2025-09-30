import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import type { Workspace } from "@shared/schema";

interface WorkspaceContextType {
  workspaces: Workspace[];
  selectedWorkspace: Workspace | null;
  setSelectedWorkspace: (workspace: Workspace) => void;
  isLoading: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [selectedWorkspace, setSelectedWorkspaceState] = useState<Workspace | null>(null);

  const { data: workspaces = [], isLoading } = useQuery<Workspace[]>({
    queryKey: ["/api/workspaces"],
    enabled: true,
  });

  useEffect(() => {
    if (workspaces.length > 0 && !selectedWorkspace) {
      const savedWorkspaceId = localStorage.getItem("selectedWorkspaceId");
      const workspace = savedWorkspaceId
        ? workspaces.find(w => w.id === savedWorkspaceId)
        : workspaces[0];
      if (workspace) {
        setSelectedWorkspaceState(workspace);
      }
    }
  }, [workspaces, selectedWorkspace]);

  const setSelectedWorkspace = (workspace: Workspace) => {
    setSelectedWorkspaceState(workspace);
    localStorage.setItem("selectedWorkspaceId", workspace.id);
  };

  return (
    <WorkspaceContext.Provider
      value={{
        workspaces,
        selectedWorkspace,
        setSelectedWorkspace,
        isLoading,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider");
  }
  return context;
}
