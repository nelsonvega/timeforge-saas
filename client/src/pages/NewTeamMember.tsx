import { useState } from "react";
import { ArrowLeft, User, Mail, Briefcase, DollarSign, FolderOpen, CheckCircle2 } from "lucide-react";
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

const existingProjects = [
  { id: "1", name: "Website Redesign" },
  { id: "2", name: "Mobile App Development" },
  { id: "3", name: "Brand Identity" },
  { id: "4", name: "Marketing Campaign" },
];

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
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [hourlyRate, setHourlyRate] = useState("");
  const [projectMode, setProjectMode] = useState<"none" | "assign">("none");
  const [selectedProjects, setSelectedProjects] = useState<string[]>([]);

  const handleCreateTeamMember = () => {
    const assignedProjects = projectMode === "assign" ? 
      selectedProjects.map(id => existingProjects.find(p => p.id === id)?.name) : 
      [];
    
    console.log('Creating team member:', {
      name,
      email,
      role,
      department,
      hourlyRate: hourlyRate ? parseFloat(hourlyRate) : undefined,
      projects: assignedProjects,
    });
    
    setLocation("/team");
  };

  const isValid = name && email && role;

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
                  <p className="text-xs text-muted-foreground">
                    An invitation will be sent to this email
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
                      Role & Department
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

                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input
                    id="department"
                    placeholder="e.g., Engineering, Design, Sales"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    data-testid="input-member-department"
                  />
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
                      Assign this member to projects
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
                      data-testid="button-no-assignment-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "none" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">No Assignment</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Assign projects later
                      </p>
                    </button>

                    <button
                      onClick={() => setProjectMode("assign")}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        projectMode === "assign"
                          ? "border-primary bg-primary/5"
                          : "border-border hover-elevate"
                      }`}
                      data-testid="button-assign-projects-mode"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle2 className={`h-4 w-4 ${
                          projectMode === "assign" ? "text-primary" : "text-muted-foreground"
                        }`} />
                        <span className="font-medium">Assign to Projects</span>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Select existing projects
                      </p>
                    </button>
                  </div>

                  {projectMode === "assign" && (
                    <div className="space-y-2">
                      <Label>Select Projects</Label>
                      <div className="space-y-2">
                        {existingProjects.map((project) => (
                          <button
                            key={project.id}
                            onClick={() => toggleProject(project.id)}
                            className={`w-full p-3 rounded-lg border-2 transition-all text-left flex items-center gap-3 ${
                              selectedProjects.includes(project.id)
                                ? "border-primary bg-primary/5"
                                : "border-border hover-elevate"
                            }`}
                            data-testid={`button-project-${project.id}`}
                          >
                            <CheckCircle2 className={`h-4 w-4 flex-shrink-0 ${
                              selectedProjects.includes(project.id) ? "text-primary" : "text-muted-foreground"
                            }`} />
                            <span className="font-medium">{project.name}</span>
                          </button>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {selectedProjects.length} project{selectedProjects.length !== 1 ? 's' : ''} selected
                      </p>
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
              disabled={!isValid}
              data-testid="button-create-member"
              className="px-8"
            >
              Add Team Member
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
