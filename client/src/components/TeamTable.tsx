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

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user" | "viewer";
  hourlyRate: number;
  projectsCount: number;
  totalHours: number;
}

const mockTeam: TeamMember[] = [
  {
    id: "1",
    name: "John Doe",
    email: "john@example.com",
    role: "admin",
    hourlyRate: 150,
    projectsCount: 5,
    totalHours: 120,
  },
  {
    id: "2",
    name: "Jane Smith",
    email: "jane@example.com",
    role: "user",
    hourlyRate: 120,
    projectsCount: 3,
    totalHours: 85,
  },
  {
    id: "3",
    name: "Mike Johnson",
    email: "mike@example.com",
    role: "user",
    hourlyRate: 100,
    projectsCount: 4,
    totalHours: 96,
  },
];

export function TeamTable() {
  const roleColors = {
    admin: "default" as const,
    user: "secondary" as const,
    viewer: "outline" as const,
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Member</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Hourly Rate</TableHead>
            <TableHead>Projects</TableHead>
            <TableHead>Total Hours</TableHead>
            <TableHead className="w-[70px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockTeam.map((member) => (
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
                <Badge variant={roleColors[member.role]}>{member.role}</Badge>
              </TableCell>
              <TableCell className="font-mono">${member.hourlyRate}/hr</TableCell>
              <TableCell>{member.projectsCount}</TableCell>
              <TableCell className="font-mono">{member.totalHours}h</TableCell>
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
