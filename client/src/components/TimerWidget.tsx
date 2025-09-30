import { useState, useEffect } from "react";
import { Play, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

export function TimerWidget() {
  const [isRunning, setIsRunning] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [selectedProject, setSelectedProject] = useState<string>("");
  const [taskDescription, setTaskDescription] = useState("");

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isRunning) {
      interval = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRunning]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleToggle = () => {
    if (isRunning) {
      console.log('Timer stopped:', { project: selectedProject, task: taskDescription, duration: seconds });
      setSeconds(0);
      setTaskDescription("");
    } else {
      console.log('Timer started:', { project: selectedProject, task: taskDescription });
    }
    setIsRunning(!isRunning);
  };

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 space-y-3">
            <Input
              placeholder="What are you working on?"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              data-testid="input-task-description"
            />
            <Select value={selectedProject} onValueChange={setSelectedProject}>
              <SelectTrigger data-testid="select-project">
                <SelectValue placeholder="Select project" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="project-1">Website Redesign - Acme Corp</SelectItem>
                <SelectItem value="project-2">Mobile App - TechStart</SelectItem>
                <SelectItem value="project-3">API Integration - DataFlow</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-3xl font-mono font-semibold" data-testid="text-timer">
              {formatTime(seconds)}
            </div>
            <Button
              size="icon"
              variant={isRunning ? "destructive" : "default"}
              onClick={handleToggle}
              data-testid="button-timer-toggle"
              className="h-12 w-12"
            >
              {isRunning ? <Square className="h-5 w-5" /> : <Play className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
