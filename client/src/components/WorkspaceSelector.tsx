import { useWorkspace } from "@/contexts/WorkspaceContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function WorkspaceSelector() {
  const { workspaces, selectedWorkspace, setSelectedWorkspace, isLoading } = useWorkspace();

  if (isLoading || workspaces.length === 0) {
    return null;
  }

  return (
    <Select
      value={selectedWorkspace?.id || ""}
      onValueChange={(value) => {
        const workspace = workspaces.find((w) => w.id === value);
        if (workspace) {
          setSelectedWorkspace(workspace);
        }
      }}
    >
      <SelectTrigger className="w-[200px]" data-testid="select-workspace">
        <SelectValue placeholder="Select workspace" />
      </SelectTrigger>
      <SelectContent>
        {workspaces.map((workspace) => (
          <SelectItem key={workspace.id} value={workspace.id} data-testid={`workspace-${workspace.id}`}>
            {workspace.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
