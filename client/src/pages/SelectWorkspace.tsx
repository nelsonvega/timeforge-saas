import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Clock, Building2, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface Workspace {
  id: string;
  name: string;
  slug: string;
}

export default function SelectWorkspace() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);

  useEffect(() => {
    fetchWorkspaces();
  }, []);

  const fetchWorkspaces = async () => {
    try {
      setIsLoading(true);
      const data: any = await apiRequest("GET", "/api/workspaces");
      setWorkspaces(data);

      // If only one workspace, auto-select and redirect
      if (data.length === 1) {
        localStorage.setItem('selectedWorkspaceId', data[0].id);
        setLocation("/");
        return;
      }

      // Check if user has a previously selected workspace
      const lastSelected = localStorage.getItem('selectedWorkspaceId');
      if (lastSelected && data.some((w: Workspace) => w.id === lastSelected)) {
        setSelectedWorkspace(lastSelected);
      }
    } catch (error: any) {
      toast({
        title: "Error loading workspaces",
        description: error.message || "Failed to load workspaces",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectWorkspace = (workspaceId: string) => {
    localStorage.setItem('selectedWorkspaceId', workspaceId);
    setLocation("/");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <Clock className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading workspaces...</p>
        </div>
      </div>
    );
  }

  if (workspaces.length === 0) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-md mx-auto">
          <CardHeader>
            <CardTitle>No Workspaces Found</CardTitle>
            <CardDescription>
              You don't have access to any workspaces. Please contact your administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setLocation("/login")} variant="outline" className="w-full">
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="mx-auto h-16 w-16 rounded-xl bg-primary flex items-center justify-center mb-4 shadow-lg">
            <Clock className="h-9 w-9 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold">Select Workspace</h1>
          <p className="text-muted-foreground mt-2">
            Choose a workspace to continue
          </p>
        </div>

        <Card className="w-full">
          <CardHeader>
            <CardTitle>Your Workspaces</CardTitle>
            <CardDescription>
              You have access to {workspaces.length} workspace{workspaces.length > 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {workspaces.map((workspace) => (
              <button
                key={workspace.id}
                onClick={() => handleSelectWorkspace(workspace.id)}
                className={`w-full p-4 rounded-lg border-2 transition-all hover:border-primary hover:bg-accent flex items-center justify-between group ${
                  selectedWorkspace === workspace.id ? 'border-primary bg-accent' : 'border-border'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold text-foreground">{workspace.name}</div>
                    <div className="text-sm text-muted-foreground">{workspace.slug}</div>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
              </button>
            ))}
          </CardContent>
        </Card>

        <div className="mt-6 text-center">
          <Button
            onClick={() => {
              localStorage.removeItem('selectedWorkspaceId');
              setLocation("/login");
            }}
            variant="ghost"
            size="sm"
          >
            Sign out
          </Button>
        </div>
      </div>
    </div>
  );
}
