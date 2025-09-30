import { MoreHorizontal, Users, DollarSign } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface ProjectCardProps {
  id: string;
  name: string;
  client: string;
  status: string;
  budget?: string | null;
  budgetUsed?: number;
  assignedUsers?: number;
  totalHours?: number;
}

export function ProjectCard({
  id,
  name,
  client,
  status,
  budget,
  budgetUsed = 0,
  assignedUsers = 0,
  totalHours = 0,
}: ProjectCardProps) {
  const budgetNum = budget ? parseFloat(budget) : 0;
  const budgetPercentage = budgetNum > 0 ? (budgetUsed / budgetNum) * 100 : 0;
  
  const statusColors: Record<string, "default" | "secondary" | "outline"> = {
    active: "default",
    completed: "secondary",
    "on-hold": "outline",
  };

  return (
    <Card data-testid={`card-project-${id}`} className="hover-elevate">
      <CardHeader className="flex flex-row items-start justify-between gap-2 space-y-0 pb-3">
        <div className="flex-1">
          <h3 className="font-semibold">{name}</h3>
          <p className="text-sm text-muted-foreground">{client}</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={statusColors[status] || "default"}>{status}</Badge>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" data-testid={`button-project-menu-${id}`}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem data-testid={`menu-edit-project-${id}`}>Edit</DropdownMenuItem>
              <DropdownMenuItem data-testid={`menu-assign-users-${id}`}>Assign Users</DropdownMenuItem>
              <DropdownMenuItem data-testid={`menu-archive-project-${id}`}>Archive</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {budgetNum > 0 && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Budget</span>
              <span className="font-mono font-semibold">
                ${budgetUsed.toLocaleString()} / ${budgetNum.toLocaleString()}
              </span>
            </div>
            <Progress value={budgetPercentage} />
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{assignedUsers} assigned</span>
          </div>
          <div className="flex items-center gap-1 text-sm">
            <span className="text-muted-foreground">Hours:</span>
            <span className="font-semibold font-mono">{totalHours}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
