import { MoreHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import type { TimeEntry, User, Project } from "@shared/schema";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function formatDuration(minutes: number | null): string {
  if (!minutes) return "0:00:00";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}:${mins.toString().padStart(2, '0')}:00`;
}

export function TimeEntriesTable() {
  const { data: entries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.name || user?.email || 'Unknown User';
  };

  const getProjectName = (projectId: string) => {
    const project = projects.find(p => p.id === projectId);
    return project?.name || 'Unknown Project';
  };

  if (isLoading) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        Loading time entries...
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="border rounded-lg p-8 text-center text-muted-foreground">
        No time entries found. Start tracking your time to see entries here.
      </div>
    );
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.slice(0, 10).map((entry) => (
            <TableRow key={entry.id} data-testid={`row-time-entry-${entry.id}`}>
              <TableCell className="font-medium">{getUserName(entry.userId)}</TableCell>
              <TableCell>{getProjectName(entry.projectId)}</TableCell>
              <TableCell className="text-muted-foreground">{entry.description || 'No description'}</TableCell>
              <TableCell>{format(new Date(entry.startTime), 'MMM d, yyyy')}</TableCell>
              <TableCell className="font-mono">{formatDuration(entry.duration)}</TableCell>
              <TableCell>
                <Badge variant={entry.isBillable ? "default" : "secondary"}>
                  {entry.isBillable ? "Billable" : "Non-billable"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" data-testid={`button-entry-menu-${entry.id}`}>
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem data-testid={`menu-edit-entry-${entry.id}`}>Edit</DropdownMenuItem>
                    <DropdownMenuItem data-testid={`menu-delete-entry-${entry.id}`}>Delete</DropdownMenuItem>
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
