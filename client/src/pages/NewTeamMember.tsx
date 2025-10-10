import { useState } from "react";
import { ArrowLeft, User, Mail, Briefcase, DollarSign, FolderOpen, CheckCircle2, ChevronsUpDown, X } from "lucide-react";
import { Link, useLocation } from "wouter";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { User as UserType, Project } from "@shared/schema";
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

export default function NewTeamMember() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [projectMode, setProjectMode] = useState<"none" | "assign">("none");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);

  const { data: existingProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const createTeamMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/users", {
        name,
        email,
        username,
        password,
        role,
        hourlyRate: hourlyRate || null,
      }, selectedWorkspace?.id);
      const newUser: UserType = await res.json();
      
      if (projectMode === "assign" && selectedProjects.length > 0) {
        await Promise.all(
          selectedProjects.map(projectId =>
            apiRequest("POST", "/api/project-assignments", {
              userId: newUser.id,
              projectId,
            }, selectedWorkspace?.id)
          )
        );
      }
      
      return newUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users", selectedWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", selectedWorkspace?.id] });
      
      toast({
        title: "Team member added",
        description: `${name} has been added successfully.`,
      });
      
      setLocation("/team");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add team member",
        variant: "destructive",
      });
    },
  });

  const handleCreateTeamMember = () => {
    createTeamMemberMutation.mutate({});
  };

  const isValid = name && email && username && password && role;

  const toggleProject = (projectId: string) => {
    setSelectedProjects(prev => 
      prev.includes(projectId) 
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

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
              <h1 className="text-3xl font-semibold">Add Team Member</h1>
              <p className="text-muted-foreground mt-1">
                Invite a new member to your workspace
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
                    Enter the team member's core details
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

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    placeholder="sarahj"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    data-testid="input-member-username"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    data-testid="input-member-password"
                  />
                  <p className="text-xs text-muted-foreground">
                    Create a password for this account
                  </p>
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
                    Define their position in the organization
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

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-base font-semibold">Project Assignment</Label>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Assign this team member to projects
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setProjectMode("none")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "none"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-no-project-assignment"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "none" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">No Projects</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Assign later
                      </p>
                    </button>

                    <button
                      onClick={() => setProjectMode("assign")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "assign"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-assign-projects"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "assign" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">Assign Projects</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select projects
                      </p>
                    </button>
                  </div>

                  {projectMode === "assign" && (
                    <div className="space-y-3">
                      <Label>Select Projects</Label>
                      <Popover open={projectsPopoverOpen} onOpenChange={setProjectsPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            role="combobox"
                            aria-expanded={projectsPopoverOpen}
                            className="w-full justify-between h-auto min-h-10"
                            data-testid="button-select-projects"
                          >
                            <div className="flex flex-wrap gap-1 flex-1">
                              {selectedProjects.length === 0 ? (
                                <span className="text-muted-foreground">Select projects...</span>
                              ) : (
                                selectedProjects.map((projectId) => {
                                  const project = existingProjects.find(p => p.id === projectId);
                                  return project ? (
                                    <Badge
                                      key={projectId}
                                      variant="secondary"
                                      className="gap-1"
                                      data-testid={`badge-project-${projectId}`}
                                    >
                                      {project.name}
                                      <span
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          toggleProject(projectId);
                                        }}
                                        className="ml-1 hover:bg-muted-foreground/20 rounded-sm cursor-pointer inline-flex"
                                      >
                                        <X className="h-3 w-3" />
                                      </span>
                                    </Badge>
                                  ) : null;
                                })
                              )}
                            </div>
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-full p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Search projects..." />
                            <CommandList>
                              <CommandEmpty>No projects found.</CommandEmpty>
                              <CommandGroup>
                                {existingProjects.map((project) => (
                                  <CommandItem
                                    key={project.id}
                                    value={project.name}
                                    onSelect={() => {
                                      toggleProject(project.id);
                                    }}
                                    data-testid={`option-project-${project.id}`}
                                  >
                                    <div className="flex items-center gap-2 flex-1">
                                      <Checkbox
                                        checked={selectedProjects.includes(project.id)}
                                        onCheckedChange={() => toggleProject(project.id)}
                                      />
                                      <span>{project.name}</span>
                                    </div>
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                      {selectedProjects.length > 0 && (
                        <p className="text-sm text-muted-foreground">
                          {selectedProjects.length} project{selectedProjects.length === 1 ? '' : 's'} selected
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/team">
              <Button variant="outline" size="lg" data-testid="button-cancel-member">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleCreateTeamMember}
              disabled={!isValid || createTeamMemberMutation.isPending}
              data-testid="button-create-member"
              className="px-8"
            >
              {createTeamMemberMutation.isPending ? "Adding..." : "Add Team Member"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
