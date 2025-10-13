import { useState, useEffect } from "react";
import { ArrowLeft, FolderOpen, CheckCircle2, ChevronsUpDown, X } from "lucide-react";
import { Link, useLocation, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
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
import type { User, Project, ProjectAssignment } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";

export default function AssignProjects() {
  const { id } = useParams<{ id: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);
  const [projectsPopoverOpen, setProjectsPopoverOpen] = useState(false);

  const { data: member, isLoading: memberLoading } = useQuery<User>({
    queryKey: ["/api/users", id],
    enabled: !!id,
  });

  const { data: allProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: assignments = [] } = useQuery<ProjectAssignment[]>({
    queryKey: ["/api/project-assignments", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  useEffect(() => {
    if (assignments && id) {
      const userAssignments = assignments
        .filter((a) => a.userId === id)
        .map((a) => a.projectId);
      setSelectedProjects(userAssignments);
    }
  }, [assignments, id]);

  const updateAssignmentsMutation = useMutation({
    mutationFn: async () => {
      const currentAssignments = assignments
        .filter((a) => a.userId === id)
        .map((a) => a.projectId);

      const toAdd = selectedProjects.filter((p) => !currentAssignments.includes(p));
      const toRemove = currentAssignments.filter((p) => !selectedProjects.includes(p));

      const promises = [];

      for (const projectId of toAdd) {
        promises.push(
          apiRequest("POST", "/api/project-assignments", {
            userId: id,
            projectId,
          }, selectedWorkspace?.id)
        );
      }

      for (const projectId of toRemove) {
        const assignment = assignments.find(
          (a) => a.userId === id && a.projectId === projectId
        );
        if (assignment) {
          promises.push(
            apiRequest("DELETE", `/api/project-assignments/${assignment.id}`, undefined, selectedWorkspace?.id)
          );
        }
      }

      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/project-assignments", selectedWorkspace?.id] });
      
      toast({
        title: "Projects updated",
        description: `Project assignments for ${member?.name} have been updated.`,
      });
      
      setLocation("/team");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update project assignments",
        variant: "destructive",
      });
    },
  });

  const toggleProject = (projectId: string) => {
    setSelectedProjects((prev) =>
      prev.includes(projectId)
        ? prev.filter((id) => id !== projectId)
        : [...prev, projectId]
    );
  };

  if (memberLoading) {
    return (
      <div className="min-h-screen bg-background p-8 space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
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
              <h1 className="text-3xl font-semibold">Assign Projects</h1>
              <p className="text-muted-foreground mt-1">
                Manage project assignments for {member?.name || "team member"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <FolderOpen className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <Label className="text-base font-semibold">Project Assignment</Label>
                    <p className="text-sm text-muted-foreground mt-2 mb-4">
                      Select which projects this team member should have access to
                    </p>
                  </div>

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
                                const project = allProjects.find((p) => p.id === projectId);
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
                              {allProjects.map((project) => (
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
              onClick={() => updateAssignmentsMutation.mutate()}
              disabled={updateAssignmentsMutation.isPending}
              data-testid="button-save-assignments"
              className="px-8"
            >
              {updateAssignmentsMutation.isPending ? "Saving..." : "Save Assignments"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
