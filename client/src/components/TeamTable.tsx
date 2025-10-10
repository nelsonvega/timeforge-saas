import { MoreHorizontal, Mail, FolderOpen, Users } from "lucide-react";
import { useLocation } from "wouter";
import { useState } from "react";
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
import type { User, Project, Client, ProjectAssignment } from "@shared/schema";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { AddToGroupDialog } from "./AddToGroupDialog";

export function TeamTable() {
  const { selectedWorkspace } = useWorkspace();
  const [, setLocation] = useLocation();
  const [selectedMember, setSelectedMember] = useState<User | null>(null);
  
  const { data: team = [], isLoading } = useQuery<User[]>({
    queryKey: ["/api/users", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: assignments = [] } = useQuery<ProjectAssignment[]>({
    queryKey: ["/api/project-assignments", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const roleColors: Record<string, "default" | "secondary" | "outline"> = {
    admin: "default",
    member: "secondary",
    viewer: "outline",
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getMemberProjects = (userId: string) => {
    const userAssignments = assignments.filter(a => a.userId === userId);
    return userAssignments
      .map(a => projects.find(p => p.id === a.projectId))
      .filter(Boolean) as Project[];
  };

  const getMemberClients = (userId: string) => {
    const memberProjects = getMemberProjects(userId);
    const clientIds = Array.from(new Set(memberProjects.map(p => p.clientId)));
    return clientIds
      .map(cId => clients.find(c => c.id === cId))
      .filter(Boolean) as Client[];
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
            <TableHead>Assigned Projects</TableHead>
            <TableHead>Assigned Clients</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {team.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted-foreground">
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
                    <span className="font-medium">{member.name || 'Unnamed User'}</span>
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
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getMemberProjects(member.id).length > 0 ? (
                      getMemberProjects(member.id).map((project) => (
                        <Badge 
                          key={project.id} 
                          variant="outline" 
                          className="gap-1"
                          data-testid={`badge-project-${project.id}`}
                        >
                          <FolderOpen className="h-3 w-3" />
                          {project.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No projects</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {getMemberClients(member.id).length > 0 ? (
                      getMemberClients(member.id).map((client) => (
                        <Badge 
                          key={client.id} 
                          variant="secondary"
                          className="gap-1"
                          data-testid={`badge-client-${client.id}`}
                        >
                          <Users className="h-3 w-3" />
                          {client.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-sm text-muted-foreground">No clients</span>
                    )}
                  </div>
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
                      <DropdownMenuItem 
                        onClick={() => setLocation(`/team/edit/${member.id}`)}
                        data-testid={`menu-edit-member-${member.id}`}
                      >
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setLocation(`/team/assign-projects/${member.id}`)}
                        data-testid={`menu-assign-projects-${member.id}`}
                      >
                        Assign Projects
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => setSelectedMember(member)}
                        data-testid={`menu-add-to-group-${member.id}`}
                      >
                        <Users className="h-4 w-4 mr-2" />
                        Add to Group
                      </DropdownMenuItem>
                      <DropdownMenuItem data-testid={`menu-deactivate-member-${member.id}`}>Deactivate</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      
      <AddToGroupDialog 
        member={selectedMember}
        open={!!selectedMember}
        onOpenChange={(open) => !open && setSelectedMember(null)}
      />
    </div>
  );
}
