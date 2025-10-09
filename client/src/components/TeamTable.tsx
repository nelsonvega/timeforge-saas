import { MoreHorizontal, Mail } from "lucide-react";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@shared/schema";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export function TeamTable() {
  const { selectedWorkspace } = useWorkspace();
  
  const { data: team = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const roleColors: Record<string, "default" | "secondary" | "outline"> = {
    admin: "default",
    member: "secondary",
    viewer: "outline",
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading team members...</div>;
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No team members yet. Add your first team member!
              </TableCell>
            </TableRow>
          ) : (
            team.map((member) => (
              <TableRow key={member.id} data-testid={`row-team-member-${member.id}`}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-primary/10 text-primary text-xs">
                        {getInitials(member.name)}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Mail className="h-3 w-3" />
                    <span>{member.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant={roleColors[member.role] || "secondary"}>{member.role}</Badge>
                </TableCell>
                <TableCell className="font-mono">
                  {member.hourlyRate ? `$${member.hourlyRate}/hr` : "Not set"}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" data-testid={`button-member-menu-${member.id}`}>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem data-testid={`menu-edit-member-${member.id}`}>Edit</DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-assign-projects-${member.id}`}>Assign Projects</DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-deactivate-member-${member.id}`}>Deactivate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
