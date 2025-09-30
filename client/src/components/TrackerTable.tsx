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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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

interface TimeEntry {
  id: string;
  user: string;
  project: string;
  task: string;
  date: string;
  duration: number;
  billable: boolean;
  status: "pending" | "approved" | "rejected";
  isRunning?: boolean;
}

const mockEntries: TimeEntry[] = [
  {
    id: "1",
    user: "John Doe",
    project: "Website Redesign",
    task: "Frontend development",
    date: "2025-09-29",
    duration: 16200,
    billable: true,
    status: "pending",
  },
  {
    id: "2",
    user: "Jane Smith",
    project: "Mobile App",
    task: "UI design review",
    date: "2025-09-29",
    duration: 8100,
    billable: true,
    status: "approved",
  },
  {
    id: "3",
    user: "Mike Johnson",
    project: "API Integration",
    task: "Backend setup",
    date: "2025-09-28",
    duration: 21600,
    billable: false,
    status: "pending",
  },
];

export function TrackerTable() {
  const [entries, setEntries] = useState(mockEntries);
  const [newTaskDescription, setNewTaskDescription] = useState("");
  const [newProject, setNewProject] = useState("");
  
  const [manualDialogOpen, setManualDialogOpen] = useState(false);
  const [manualTask, setManualTask] = useState("");
  const [manualProject, setManualProject] = useState("");
  const [manualDate, setManualDate] = useState(new Date().toISOString().split('T')[0]);
  const [manualHours, setManualHours] = useState("");
  const [manualMinutes, setManualMinutes] = useState("");
  const [manualBillable, setManualBillable] = useState(true);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!newTaskDescription || !newProject) return;
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      user: "John Doe",
      project: newProject,
      task: newTaskDescription,
      date: new Date().toISOString().split('T')[0],
      duration: 0,
      billable: true,
      status: "pending",
      isRunning: true,
    };
    
    setEntries([newEntry, ...entries]);
    setNewTaskDescription("");
    setNewProject("");
    console.log('Started new timer:', newEntry);
  };

  const handleAddManualEntry = () => {
    if (!manualTask || !manualProject || !manualDate) return;
    
    const hours = parseInt(manualHours) || 0;
    const minutes = parseInt(manualMinutes) || 0;
    const totalSeconds = (hours * 3600) + (minutes * 60);
    
    const newEntry: TimeEntry = {
      id: Date.now().toString(),
      user: "John Doe",
      project: manualProject,
      task: manualTask,
      date: manualDate,
      duration: totalSeconds,
      billable: manualBillable,
      status: "pending",
      isRunning: false,
    };
    
    setEntries([newEntry, ...entries]);
    setManualTask("");
    setManualProject("");
    setManualDate(new Date().toISOString().split('T')[0]);
    setManualHours("");
    setManualMinutes("");
    setManualBillable(true);
    setManualDialogOpen(false);
    console.log('Added manual entry:', newEntry);
  };

  const handleStopTimer = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, isRunning: false } : entry
      )
    );
    console.log('Stopped timer:', id);
  };

  const handleResumeTimer = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) => ({
        ...entry,
        isRunning: entry.id === id ? true : false,
      }))
    );
    console.log('Resumed timer:', id);
  };

  const handleApprove = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "approved" as const } : entry
      )
    );
    console.log('Approved entry:', id);
  };

  const handleReject = (id: string) => {
    setEntries((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "rejected" as const } : entry
      )
    );
    console.log('Rejected entry:', id);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      setEntries((prev) =>
        prev.map((entry) =>
          entry.isRunning ? { ...entry, duration: entry.duration + 1 } : entry
        )
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const statusColors = {
    pending: "outline" as const,
    approved: "default" as const,
    rejected: "destructive" as const,
  };

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
                  <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                  <SelectItem value="Mobile App">Mobile App</SelectItem>
                  <SelectItem value="API Integration">API Integration</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={handleStartTimer}
                disabled={!newTaskDescription || !newProject}
                data-testid="button-start-new-timer"
              >
                <Play className="h-4 w-4 mr-2" />
                Start
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="manual" className="p-4 m-0">
            <div className="grid gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-task">Task Description</Label>
                  <Input
                    id="manual-task"
                    placeholder="What did you work on?"
                    value={manualTask}
                    onChange={(e) => setManualTask(e.target.value)}
                    data-testid="input-manual-task"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-project">Project</Label>
                  <Select value={manualProject} onValueChange={setManualProject}>
                    <SelectTrigger id="manual-project" data-testid="select-manual-project">
                      <SelectValue placeholder="Select project" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Website Redesign">Website Redesign</SelectItem>
                      <SelectItem value="Mobile App">Mobile App</SelectItem>
                      <SelectItem value="API Integration">API Integration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="manual-date">Date</Label>
                  <Input
                    id="manual-date"
                    type="date"
                    value={manualDate}
                    onChange={(e) => setManualDate(e.target.value)}
                    data-testid="input-manual-date"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-hours">Hours</Label>
                  <Input
                    id="manual-hours"
                    type="number"
                    min="0"
                    placeholder="0"
                    value={manualHours}
                    onChange={(e) => setManualHours(e.target.value)}
                    data-testid="input-manual-hours"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manual-minutes">Minutes</Label>
                  <Input
                    id="manual-minutes"
                    type="number"
                    min="0"
                    max="59"
                    placeholder="0"
                    value={manualMinutes}
                    onChange={(e) => setManualMinutes(e.target.value)}
                    data-testid="input-manual-minutes"
                  />
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    id="manual-billable"
                    checked={manualBillable}
                    onCheckedChange={setManualBillable}
                    data-testid="switch-manual-billable"
                  />
                  <Label htmlFor="manual-billable">Billable</Label>
                </div>
                <Button
                  onClick={handleAddManualEntry}
                  disabled={!manualTask || !manualProject || !manualDate || (!manualHours && !manualMinutes)}
                  data-testid="button-add-manual-entry"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Entry
                </Button>
              </div>
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
              <TableHead>Status</TableHead>
              <TableHead className="w-[150px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {entries.map((entry) => (
              <TableRow key={entry.id} data-testid={`row-tracker-${entry.id}`}>
                <TableCell className="font-medium">{entry.task}</TableCell>
                <TableCell>{entry.project}</TableCell>
                <TableCell>{entry.date}</TableCell>
                <TableCell className="font-mono">{formatTime(entry.duration)}</TableCell>
                <TableCell>
                  <Badge variant={entry.billable ? "default" : "secondary"}>
                    {entry.billable ? "Billable" : "Non-billable"}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusColors[entry.status]}>{entry.status}</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    {entry.isRunning ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleStopTimer(entry.id)}
                        data-testid={`button-stop-${entry.id}`}
                      >
                        <Square className="h-4 w-4 text-destructive" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleResumeTimer(entry.id)}
                        data-testid={`button-resume-${entry.id}`}
                      >
                        <Play className="h-4 w-4 text-chart-2" />
                      </Button>
                    )}
                    {entry.status === "pending" && !entry.isRunning && (
                      <>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleApprove(entry.id)}
                          data-testid={`button-approve-${entry.id}`}
                        >
                          <Check className="h-4 w-4 text-chart-2" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleReject(entry.id)}
                          data-testid={`button-reject-${entry.id}`}
                        >
                          <X className="h-4 w-4 text-chart-4" />
                        </Button>
                      </>
                    )}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" data-testid={`button-entry-menu-${entry.id}`}>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem data-testid={`menu-edit-entry-${entry.id}`}>Edit</DropdownMenuItem>
                        <DropdownMenuItem data-testid={`menu-delete-entry-${entry.id}`}>Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
