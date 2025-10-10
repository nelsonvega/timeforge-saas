import { useState, useEffect } from "react";
import { ArrowLeft, User, Mail, Briefcase, DollarSign } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

const roles = [
  "Developer",
  "Designer",
  "Project Manager",
  "QA Engineer",
  "Product Manager",
  "Marketing",
  "Sales",
  "Other",
];

export default function EditTeamMember() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");

  const { data: member, isLoading } = useQuery<UserType>({
    queryKey: ["/api/users", id],
    enabled: !!id,
  });

  useEffect(() => {
    if (member) {
      setName(member.name || "");
      setEmail(member.email || "");
      setRole(member.role || "");
      setHourlyRate(member.hourlyRate || "");
    }
  }, [member]);

  const updateTeamMemberMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("PATCH", `/api/users/${id}`, {
        name,
        email,
        role,
        hourlyRate: hourlyRate || null,
      }, selectedWorkspace?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedWorkspace?.id] });
      
      toast({
        title: "Team member updated",
        description: `${name} has been updated successfully.`,
      });
      
      setLocation("/team");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update team member",
        variant: "destructive",
      });
    },
  });

  const handleUpdate = () => {
    updateTeamMemberMutation.mutate();
  };

  const isValid = name && email && role;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/team">
              <Button variant="ghost" size="icon" data-testid="button-back-to-team">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold">Edit Team Member</h1>
              <p className="text-muted-foreground mt-1">
                Update member information
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base font-semibold">
                      Basic Information
                    </Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update the team member's core details
                  </p>
                </div>
              </div>

              <div className="ml-14 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Sarah Johnson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    data-testid="input-member-name"
                    className="text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="sarah@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-member-email"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label className="text-base font-semibold">
                      Role
                    </Label>
                    <Badge variant="destructive" className="text-xs">Required</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Update their position in the organization
                  </p>
                </div>
              </div>

              <div className="ml-14 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select value={role} onValueChange={setRole}>
                    <SelectTrigger id="role" data-testid="select-member-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((r) => (
                        <SelectItem key={r} value={r}>
                          {r}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <DollarSign className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="hourly-rate" className="text-base font-semibold">
                        Hourly Rate
                      </Label>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <Input
                      id="hourly-rate"
                      type="number"
                      placeholder="75.00"
                      value={hourlyRate}
                      onChange={(e) => setHourlyRate(e.target.value)}
                      data-testid="input-member-rate"
                      className="text-base ml-14"
                    />
                    <p className="text-sm text-muted-foreground mt-2 ml-14">
                      Set the billable rate for this team member
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/team">
              <Button variant="outline" size="lg" data-testid="button-cancel">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleUpdate}
              disabled={!isValid || updateTeamMemberMutation.isPending}
              data-testid="button-update-member"
              className="px-8"
            >
              {updateTeamMemberMutation.isPending ? "Updating..." : "Update Team Member"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
