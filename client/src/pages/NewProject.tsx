import { useState } from "react";
import { ArrowLeft, Building2, FolderOpen, DollarSign, CheckCircle2 } from "lucide-react";
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
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

export default function NewProject() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [projectName, setProjectName] = useState("");
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [selectedClient, setSelectedClient] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [budget, setBudget] = useState("");

  const { data: existingClients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createProjectMutation = useMutation({
    mutationFn: async (data: any) => {
      let clientId = selectedClient;
      
      if (clientMode === "new" && newClientName) {
        const clientRes = await apiRequest("POST", "/api/clients", {
          name: newClientName,
          status: "active",
        });
        const newClient: Client = await clientRes.json();
        clientId = newClient.id;
      }
      
      const res = await apiRequest("POST", "/api/projects", {
        name: projectName,
        clientId,
        budget: budget ? budget : null,
        status: "active",
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      
      toast({
        title: "Project created",
        description: `${projectName} has been added successfully.`,
      });
      
      setLocation("/projects");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleCreateProject = () => {
    createProjectMutation.mutate({});
  };

  const isValid = projectName && (
    (clientMode === "existing" && selectedClient) || 
    (clientMode === "new" && newClientName)
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/projects">
              <Button variant="ghost" size="icon" data-testid="button-back-to-projects">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold">Create New Project</h1>
              <p className="text-muted-foreground mt-1">
                Set up a new project and get started tracking time
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
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="project-name" className="text-base font-semibold">
                        Project Name
                      </Label>
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </div>
                    <Input
                      id="project-name"
                      placeholder="e.g., Website Redesign, Mobile App Development"
                      value={projectName}
                      onChange={(e) => setProjectName(e.target.value)}
                      data-testid="input-project-name"
                      className="text-base"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Choose a descriptive name that clearly identifies this project
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Label className="text-base font-semibold">Client Association</Label>
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Associate this project with a client
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                      onClick={() => setClientMode("existing")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        clientMode === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-existing-client-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          clientMode === "existing" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">Existing Client</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select from your clients
                      </p>
                    </button>

                    <button
                      onClick={() => setClientMode("new")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        clientMode === "new"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-new-client-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          clientMode === "new" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">New Client</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create a new client
                      </p>
                    </button>
                  </div>

                  {clientMode === "existing" ? (
                    <div className="space-y-2">
                      <Label htmlFor="existing-client">Select Client</Label>
                      <Select value={selectedClient} onValueChange={setSelectedClient}>
                        <SelectTrigger id="existing-client" data-testid="select-existing-client">
                          <SelectValue placeholder="Choose a client" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingClients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Label htmlFor="new-client">New Client Name</Label>
                      <Input
                        id="new-client"
                        placeholder="Enter client name"
                        value={newClientName}
                        onChange={(e) => setNewClientName(e.target.value)}
                        data-testid="input-new-client-name"
                      />
                      <p className="text-xs text-muted-foreground">
                        A new client will be created and linked to this project
                      </p>
                    </div>
                  )}
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
                      <Label htmlFor="budget" className="text-base font-semibold">
                        Budget
                      </Label>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                        $
                      </span>
                      <Input
                        id="budget"
                        type="number"
                        placeholder="0.00"
                        value={budget}
                        onChange={(e) => setBudget(e.target.value)}
                        data-testid="input-project-budget"
                        className="pl-7"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Set a budget limit for this project (optional)
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/projects">
              <Button variant="outline" size="lg" data-testid="button-cancel-project">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleCreateProject}
              disabled={!isValid || createProjectMutation.isPending}
              data-testid="button-create-project"
              className="px-8"
            >
              {createProjectMutation.isPending ? "Creating..." : "Create Project"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
