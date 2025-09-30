import { useState } from "react";
import { ArrowLeft } from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const existingClients = [
  { id: "1", name: "Acme Corporation" },
  { id: "2", name: "TechStart Inc" },
  { id: "3", name: "DataFlow Ltd" },
  { id: "4", name: "Brand Co" },
];

export default function NewProject() {
  const [, setLocation] = useLocation();
  const [projectName, setProjectName] = useState("");
  const [selectedClient, setSelectedClient] = useState("");
  const [newClientName, setNewClientName] = useState("");
  const [budget, setBudget] = useState("");

  const handleCreateProject = () => {
    const clientName = selectedClient ? 
      existingClients.find(c => c.id === selectedClient)?.name : 
      newClientName;
    
    console.log('Creating project:', {
      projectName,
      client: clientName,
      budget: budget ? parseFloat(budget) : undefined,
    });
    
    setLocation("/projects");
  };

  const isValid = projectName && (selectedClient || newClientName);

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/projects">
          <Button variant="ghost" size="icon" data-testid="button-back-to-projects">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold">Create New Project</h1>
          <p className="text-sm text-muted-foreground">
            Add a new project and assign it to a client
          </p>
        </div>
      </div>

      <div className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="project-name">Project Name</Label>
          <Input
            id="project-name"
            placeholder="Website Redesign, Mobile App..."
            value={projectName}
            onChange={(e) => setProjectName(e.target.value)}
            data-testid="input-project-name"
          />
        </div>

        <div className="space-y-2">
          <Label>Client</Label>
          <Tabs defaultValue="existing" className="w-full">
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="existing" data-testid="tab-existing-client">
                Existing Client
              </TabsTrigger>
              <TabsTrigger value="new" data-testid="tab-new-client">
                New Client
              </TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="mt-3">
              <Select value={selectedClient} onValueChange={setSelectedClient}>
                <SelectTrigger data-testid="select-existing-client" className="max-w-md">
                  <SelectValue placeholder="Select a client" />
                </SelectTrigger>
                <SelectContent>
                  {existingClients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TabsContent>
            <TabsContent value="new" className="mt-3">
              <Input
                placeholder="New client name"
                value={newClientName}
                onChange={(e) => setNewClientName(e.target.value)}
                data-testid="input-new-client-name"
                className="max-w-md"
              />
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-2">
          <Label htmlFor="budget">Budget (optional)</Label>
          <Input
            id="budget"
            type="number"
            placeholder="50000"
            value={budget}
            onChange={(e) => setBudget(e.target.value)}
            data-testid="input-project-budget"
            className="max-w-md"
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Link href="/projects">
            <Button variant="outline" data-testid="button-cancel-project">
              Cancel
            </Button>
          </Link>
          <Button
            onClick={handleCreateProject}
            disabled={!isValid}
            data-testid="button-create-project"
          >
            Create Project
          </Button>
        </div>
      </div>
    </div>
  );
}
