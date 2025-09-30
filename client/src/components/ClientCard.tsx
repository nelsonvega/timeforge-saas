import { MoreHorizontal, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

interface ClientCardProps {
  id: string;
  name: string;
  email?: string | null;
  address?: string | null;
  projectCount?: number;
  totalHours?: number;
  status: string;
}

export function ClientCard({ id, name, email, address, projectCount = 0, totalHours = 0, status }: ClientCardProps) {
  return (
    <Card data-testid={`card-client-${id}`} className="hover-elevate">
      <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
            <span className="text-lg font-semibold text-primary">{name[0]}</span>
          </div>
          <div>
            <h3 className="font-semibold">{name}</h3>
            <Badge variant={status === "active" ? "default" : "secondary"} className="text-xs">
              {status}
            </Badge>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid={`button-client-menu-${id}`}>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem data-testid={`menu-edit-client-${id}`}>Edit</DropdownMenuItem>
            <DropdownMenuItem data-testid={`menu-archive-client-${id}`}>Archive</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardHeader>
      <CardContent className="space-y-2">
        {email && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail className="h-3 w-3" />
            <span>{email}</span>
          </div>
        )}
        {address && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-3 w-3" />
            <span>{address}</span>
          </div>
        )}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Projects:</span>
            <span className="ml-1 font-semibold">{projectCount}</span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">Hours:</span>
            <span className="ml-1 font-semibold font-mono">{totalHours}h</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
