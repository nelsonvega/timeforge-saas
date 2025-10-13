import { useState, useEffect } from "react";
import { Play, Square, Check, X, MoreHorizontal, Plus, Clock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { TimeEntry, Project } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";

export function TrackerTable() {
  const { toast } = useToast();
  const { selectedWorkspace } = useWorkspace();
  const { user: currentUser } = useAuth();
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newProject, setNewProject] = useState("");
  
  const [manualTask, setManualTask] = useState("");
  const [manualProject, setManualProject] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualStartTime, setManualStartTime] = useState("");
  const [manualEndTime, setManualEndTime] = useState("");
  const [manualBillable, setManualBillable] = useState(true);

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: entries = [], isLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/time-entries", data, selectedWorkspace?.id);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedWorkspace?.id] });
      toast({
        title: "Time entry created",
        description: "Your time entry has been added successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create time entry",
        variant: "destructive",
      });
    },
  });

  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const res = await apiRequest("PATCH", `/api/time-entries/${id}`, data, selectedWorkspace?.id);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedWorkspace?.id] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update time entry",
        variant: "destructive",
      });
    },
  });

  const deleteTimeEntryMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/time-entries/${id}`, undefined, selectedWorkspace?.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries", selectedWorkspace?.id] });
      toast({
        title: "Time entry deleted",
        description: "The time entry has been removed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete time entry",
        variant: "destructive",
      });
    },
  });

  const formatTime = (totalSeconds: number | null) => {
    if (!totalSeconds) return "00:00:00";
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!newTaskDescription || !newProject || !currentUser) return;
    
    createTimeEntryMutation.mutate({
      userId: currentUser.id,
      projectId: newProject,
      description: newTaskDescription,
      startTime: new Date().toISOString(),
      endTime: null,
      duration: null,
      isBillable: true,
    });
    
    setNewTaskDescription("");
    setNewProject("");
  };

  const handleAddManualEntry = () => {
    if (!manualTask || !manualProject || !manualDate || !manualStartTime || !manualEndTime || !currentUser) return;
    
    const [startHour, startMin] = manualStartTime.split(':').map(Number);
    const [endHour, endMin] = manualEndTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const durationMinutes = endMinutes - startMinutes;
    
    if (durationMinutes <= 0) {
      toast({
        title: "Invalid time range",
        description: "End time must be after start time",
        variant: "destructive",
      });
      return;
    }
    
    const totalSeconds = durationMinutes * 60;
    
    const startDateTime = new Date(`${manualDate}T${manualStartTime}:00`).toISOString();
    const endDateTime = new Date(`${manualDate}T${manualEndTime}:00`).toISOString();
    
    createTimeEntryMutation.mutate({
      userId: currentUser.id,
      projectId: manualProject,
      description: manualTask,
      startTime: startDateTime,
      endTime: endDateTime,
      duration: totalSeconds,
      isBillable: manualBillable,
    });
    
    setManualTask("");
    setManualProject("");
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualStartTime("");
    setManualEndTime("");
    setManualBillable(true);
  };

  const handleStopTimer = (entry: TimeEntry) => {
    const now = new Date();
    const startTime = new Date(entry.startTime);
    const durationSeconds = Math.floor((now.getTime() - startTime.getTime()) / 1000);
    
    updateTimeEntryMutation.mutate({
      id: entry.id,
      data: {
        endTime: now.toISOString(),
        duration: durationSeconds,
      },
    });
  };

  const handleResumeTimer = (entry: TimeEntry) => {
    updateTimeEntryMutation.mutate({
      id: entry.id,
      data: {
        startTime: new Date().toISOString(),
        endTime: null,
        duration: null,
      },
    });
  };

  const handleDelete = (id: string) => {
    deleteTimeEntryMutation.mutate(id);
  };

  const runningEntries = entries.filter(e => !e.endTime);
  const [runningDurations, setRunningDurations] = useState<Record<string, number>>({});

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const newDurations: Record<string, number> = {};
      
      runningEntries.forEach(entry => {
        const startTime = new Date(entry.startTime).getTime();
        const elapsedSeconds = Math.floor((now - startTime) / 1000);
        newDurations[entry.id] = elapsedSeconds;
      });
      
      setRunningDurations(newDurations);
    }, 1000);

    return () => clearInterval(interval);
  }, [runningEntries.length]);

  const getProjectName = (projectId: string) => {
    return projects.find(p => p.id === projectId)?.name || "Unknown Project";
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
            <Skeleton className="h-8 w-20" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="border rounded-lg bg-card">
        <Tabs defaultValue="timer" className="w-full">
          <TabsList className="w-full justify-start rounded-none border-b bg-transparent p-0">
            <TabsTrigger 
              value="timer" 
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-testid="tab-timer"
            >
              <Clock className="h-4 w-4 mr-2" />
              Start Timer
            </TabsTrigger>
            <TabsTrigger 
              value="manual"
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent"
              data-testid="tab-manual"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Manual Entry
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="timer" className="p-4 m-0">
            <div className="flex items-center gap-2">
              <Input
                placeholder="What are you working on?"
                value={newTaskDescription}
                onChange={(e) => setNewTaskDescription(e.target.value)}
                data-testid="input-new-task"
                className="flex-1"
              />
              <Select value={newProject} onValueChange={setNewProject}>
                <SelectTrigger className="w-[200px]" data-testid="select-new-project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                onClick={handleStartTimer}
                disabled={!newTaskDescription || !newProject || !currentUser || createTimeEntryMutation.isPending}
                data-testid="button-start-new-timer"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="p-4 m-0">
            <div className="flex items-center gap-2">
              <Input
                placeholder="Task description"
                value={manualTask}
                onChange={(e) => setManualTask(e.target.value)}
                data-testid="input-manual-task"
                className="flex-1"
              />
              <Select value={manualProject} onValueChange={setManualProject}>
                <SelectTrigger className="w-[180px]" data-testid="select-manual-project">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                type="date"
                value={manualDate}
                onChange={(e) => setManualDate(e.target.value)}
                data-testid="input-manual-date"
                className="w-[150px]"
              />
              <Input
                type="time"
                placeholder="Start"
                value={manualStartTime}
                onChange={(e) => setManualStartTime(e.target.value)}
                data-testid="input-manual-start-time"
                className="w-[120px]"
              />
              <span className="text-muted-foreground">to</span>
              <Input
                type="time"
                placeholder="End"
                value={manualEndTime}
                onChange={(e) => setManualEndTime(e.target.value)}
                data-testid="input-manual-end-time"
                className="w-[120px]"
              />
              <div className="flex items-center gap-2">
                <Switch
                  id="manual-billable"
                  checked={manualBillable}
                  onCheckedChange={setManualBillable}
                  data-testid="switch-manual-billable"
                />
                <Label htmlFor="manual-billable" className="text-sm">Billable</Label>
              </div>
              <Button
                onClick={handleAddManualEntry}
                disabled={!manualTask || !manualProject || !manualDate || !manualStartTime || !manualEndTime || !currentUser || createTimeEntryMutation.isPending}
                data-testid="button-add-manual-entry"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Task</TableHead>
              <TableHead>Project</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground">
                  No time entries yet. Start tracking your time!
                </TableCell>
              </TableRow>
            ) : (
              entries.map((entry) => {
                const isRunning = !entry.endTime;
                const displayDuration = isRunning 
                  ? (runningDurations[entry.id] || 0)
                  : (entry.duration || 0);
                
                return (
                  <TableRow key={entry.id} data-testid={`row-tracker-${entry.id}`}>
                    <TableCell className="font-medium">{entry.description || "No description"}</TableCell>
                    <TableCell>{getProjectName(entry.projectId)}</TableCell>
                    <TableCell>{new Date(entry.startTime).toLocaleDateString()}</TableCell>
                    <TableCell className="font-mono">{formatTime(displayDuration)}</TableCell>
                    <TableCell>
                      <Badge variant={entry.isBillable ? "default" : "secondary"}>
                        {entry.isBillable ? "Billable" : "Non-billable"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {isRunning ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleStopTimer(entry)}
                            data-testid={`button-stop-${entry.id}`}
                          >
                            <Square className="h-4 w-4 text-destructive" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleResumeTimer(entry)}
                            data-testid={`button-resume-${entry.id}`}
                          >
                            <Play className="h-4 w-4 text-chart-2" />
                          </Button>
                        )}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" data-testid={`button-entry-menu-${entry.id}`}>
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleDelete(entry.id)}
                              data-testid={`menu-delete-entry-${entry.id}`}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
