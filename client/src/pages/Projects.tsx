import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { Project, Client } from "@shared/schema";
import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function Projects() {
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedWorkspace } = useWorkspace();
  
  const { data: projects = [], isLoading } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getClientName = (clientId: string) => {
    return clients.find(c => c.id === clientId)?.name || "Unknown Client";
  };

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client projects and track progress
          </p>
        </div>
        <Link href="/projects/new">
          <Button data-testid="button-add-project">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search projects..."
        className="max-w-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="input-search-projects"
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-8 w-8 rounded" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-4 w-full mb-3" />
                <div className="flex justify-between items-center">
                  <Skeleton className="h-6 w-20 rounded-full" />
                  <Skeleton className="h-8 w-16" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredProjects.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No projects found matching your search." : "No projects yet. Create your first project!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProjects.map((project) => (
            <ProjectCard 
              key={project.id} 
              {...project} 
              client={getClientName(project.clientId)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
