import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Users, FolderOpen, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Group = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: "active" | "inactive";
  workspaceId: string;
};

export function GroupsTable() {
  const { selectedWorkspace } = useWorkspace();

  const { data: groups = [], isLoading } = useQuery<Group[]>({
    queryKey: ["/api/groups", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-sm text-muted-foreground">Loading groups...</p>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg" data-testid="empty-groups">
        <Users className="h-12 w-12 mx-auto text-muted-foreground/50" />
        <h3 className="mt-4 text-lg font-semibold">No groups yet</h3>
        <p className="text-sm text-muted-foreground mt-2">
          Create your first group to organize your team
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-center">
              <Users className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="text-center">
              <Building2 className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="text-center">
              <FolderOpen className="h-4 w-4 mx-auto" />
            </TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {groups.map((group) => (
            <TableRow key={group.id} data-testid={`row-group-${group.id}`}>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  {group.color && (
                    <div
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: group.color }}
                    />
                  )}
                  <span>{group.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-muted-foreground">
                {group.description || "—"}
              </TableCell>
              <TableCell>
                <Badge
                  variant={group.status === "active" ? "default" : "secondary"}
                  data-testid={`badge-status-${group.id}`}
                >
                  {group.status}
                </Badge>
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                —
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                —
              </TableCell>
              <TableCell className="text-center text-muted-foreground">
                —
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      data-testid={`button-actions-${group.id}`}
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem data-testid={`menu-edit-${group.id}`}>
                      <Pencil className="h-4 w-4 mr-2" />
                      Edit Group
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-members-${group.id}`}>
                      <Users className="h-4 w-4 mr-2" />
                      Manage Members
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-clients-${group.id}`}>
                      <Building2 className="h-4 w-4 mr-2" />
                      Assign Clients
                    </DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-projects-${group.id}`}>
                      <FolderOpen className="h-4 w-4 mr-2" />
                      Assign Projects
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      className="text-destructive"
                      data-testid={`menu-delete-${group.id}`}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete Group
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
