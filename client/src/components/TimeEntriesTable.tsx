import { useState } from "react";
import { Check, X, MoreHorizontal } from "lucide-react";
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

interface TimeEntry {
  id: string;
  user: string;
  project: string;
  task: string;
  date: string;
  duration: string;
  billable: boolean;
  status: "pending" | "approved" | "rejected";
}

const mockEntries: TimeEntry[] = [
  {
    id: "1",
    user: "John Doe",
    project: "Website Redesign",
    task: "Frontend development",
    date: "2025-09-29",
    duration: "4:30:00",
    billable: true,
    status: "pending",
  },
  {
    id: "2",
    user: "Jane Smith",
    project: "Mobile App",
    task: "UI design review",
    date: "2025-09-29",
    duration: "2:15:00",
    billable: true,
    status: "approved",
  },
  {
    id: "3",
    user: "Mike Johnson",
    project: "API Integration",
    task: "Backend setup",
    date: "2025-09-28",
    duration: "6:00:00",
    billable: false,
    status: "pending",
  },
];

export function TimeEntriesTable() {
  const [entries, setEntries] = useState(mockEntries);

  const handleApprove = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "approved" as const } : entry
      )
    );
    console.log('Approved time entry:', id);
  };

  const handleReject = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "rejected" as const } : entry
      )
    );
    console.log('Rejected time entry:', id);
  };

  const statusColors = {
    pending: "outline" as const,
    approved: "default" as const,
    rejected: "destructive" as const,
  };

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Project</TableHead>
            <TableHead>Task</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[100px]">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {entries.map((entry) => (
            <TableRow key={entry.id} data-testid={`row-time-entry-${entry.id}`}>
              <TableCell className="font-medium">{entry.user}</TableCell>
              <TableCell>{entry.project}</TableCell>
              <TableCell className="text-muted-foreground">{entry.task}</TableCell>
              <TableCell>{entry.date}</TableCell>
              <TableCell className="font-mono">{entry.duration}</TableCell>
              <TableCell>
                <Badge variant={entry.billable ? "default" : "secondary"}>
                  {entry.billable ? "Billable" : "Non-billable"}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
              </TableCell>
              <TableCell>
                {entry.status === "pending" ? (
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleApprove(entry.id)}
                      data-testid={`button-approve-${entry.id}`}
                    >
                      <Check className="h-4 w-4 text-chart-2" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleReject(entry.id)}
                      data-testid={`button-reject-${entry.id}`}
                    >
                      <X className="h-4 w-4 text-chart-4" />
                    </Button>
                  </div>
                ) : (
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
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
