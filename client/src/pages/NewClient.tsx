import { useState } from "react";
import { ArrowLeft, Building2, Mail, Phone, MapPin, FolderOpen, CheckCircle2 } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Client, Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function NewClient() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const [clientName, setClientName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [projectMode, setProjectMode] = useState<"existing" | "new" | "none">("none");
  const [selectedProject, setSelectedProject] = useState("");
  const [newProjectName, setNewProjectName] = useState("");

  const { data: existingProjects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/clients", data, selectedWorkspace?.id);
      return await res.json();
    },
    onSuccess: async (newClient: Client) => {
      if (projectMode === "new" && newProjectName) {
        await apiRequest("POST", "/api/projects", {
          name: newProjectName,
          clientId: newClient.id,
          status: "active",
        }, selectedWorkspace?.id);
      } else if (projectMode === "existing" && selectedProject) {
        await apiRequest("PATCH", `/api/projects/${selectedProject}`, {
          clientId: newClient.id,
        }, selectedWorkspace?.id);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/clients", selectedWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/projects", selectedWorkspace?.id] });
      
      toast({
        title: "Client created",
        description: `${clientName} has been added successfully.`,
      });
      
      setLocation("/clients");
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create client",
        variant: "destructive",
      });
    },
  });

  const handleCreateClient = () => {
    createClientMutation.mutate({
      name: clientName,
      email: email || null,
      phone: phone || null,
      address: address || null,
      notes: notes || null,
      status: "active",
    });
  };

  const isValid = clientName;

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-4xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/clients">
              <Button variant="ghost" size="icon" data-testid="button-back-to-clients">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold">Create New Client</h1>
              <p className="text-muted-foreground mt-1">
                Add a new client to your workspace
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
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1 space-y-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Label htmlFor="client-name" className="text-base font-semibold">
                        Client Name
                      </Label>
                      <Badge variant="destructive" className="text-xs">Required</Badge>
                    </div>
                    <Input
                      id="client-name"
                      placeholder="e.g., Acme Corporation, TechStart Inc"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      data-testid="input-client-name"
                      className="text-base"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Enter the official name of the client or organization
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6 space-y-4">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <Label htmlFor="email" className="text-base font-semibold">
                      Contact Information
                    </Label>
                    <Badge variant="secondary" className="text-xs">Optional</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add contact details for this client
                  </p>
                </div>
              </div>

              <div className="ml-14 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    Email Address
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="contact@acme.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    data-testid="input-client-email"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    Phone Number
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    data-testid="input-client-phone"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address" className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    placeholder="123 Main St, San Francisco, CA 94105"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    data-testid="input-client-address"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Any additional information about this client..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    data-testid="input-client-notes"
                    rows={3}
                  />
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
                      <Label className="text-base font-semibold">Project Association</Label>
                      <Badge variant="secondary" className="text-xs">Optional</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      Associate this client with a project
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <button
                      onClick={() => setProjectMode("none")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "none"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-no-project-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "none" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">No Project</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Add later
                      </p>
                    </button>

                    <button
                      onClick={() => setProjectMode("existing")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "existing"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-existing-project-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "existing" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">Existing</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Link to project
                      </p>
                    </button>

                    <button
                      onClick={() => setProjectMode("new")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "new"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-new-project-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "new" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">New Project</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Create one
                      </p>
                    </button>
                  </div>

                  {projectMode === "existing" && (
                    <div className="space-y-2">
                      <Label htmlFor="existing-project">Select Project</Label>
                      <Select value={selectedProject} onValueChange={setSelectedProject}>
                        <SelectTrigger id="existing-project" data-testid="select-existing-project">
                          <SelectValue placeholder="Choose a project" />
                        </SelectTrigger>
                        <SelectContent>
                          {existingProjects.map((project) => (
                            <SelectItem key={project.id} value={project.id}>
                              {project.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {projectMode === "new" && (
                    <div className="space-y-2">
                      <Label htmlFor="new-project">New Project Name</Label>
                      <Input
                        id="new-project"
                        placeholder="Enter project name"
                        value={newProjectName}
                        onChange={(e) => setNewProjectName(e.target.value)}
                        data-testid="input-new-project-name"
                      />
                      <p className="text-xs text-muted-foreground">
                        A new project will be created and linked to this client
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex items-center gap-3 pt-4">
            <Link href="/clients">
              <Button variant="outline" size="lg" data-testid="button-cancel-client">
                Cancel
              </Button>
            </Link>
            <Button
              size="lg"
              onClick={handleCreateClient}
              disabled={!isValid || createClientMutation.isPending}
              data-testid="button-create-client"
              className="px-8"
            >
              {createClientMutation.isPending ? "Creating..." : "Create Client"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
