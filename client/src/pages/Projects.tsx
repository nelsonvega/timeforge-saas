import { ProjectCard } from "@/components/ProjectCard";
import { Input } from "@/components/ui/input";
import { NewProjectDialog } from "@/components/NewProjectDialog";

const mockProjects = [
  {
    id: "1",
    name: "Website Redesign",
    client: "Acme Corporation",
    status: "active" as const,
    budget: 50000,
    budgetUsed: 32500,
    assignedUsers: 4,
    totalHours: 120,
  },
  {
    id: "2",
    name: "Mobile App Development",
    client: "TechStart Inc",
    status: "active" as const,
    budget: 80000,
    budgetUsed: 45000,
    assignedUsers: 6,
    totalHours: 180,
  },
  {
    id: "3",
    name: "API Integration",
    client: "DataFlow Ltd",
    status: "completed" as const,
    budget: 30000,
    budgetUsed: 28500,
    assignedUsers: 3,
    totalHours: 95,
  },
  {
    id: "4",
    name: "Marketing Campaign",
    client: "Brand Co",
    status: "on-hold" as const,
    budget: 25000,
    budgetUsed: 8000,
    assignedUsers: 2,
    totalHours: 32,
  },
];

export default function Projects() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Projects</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client projects and track progress
          </p>
        </div>
        <NewProjectDialog />
      </div>

      <Input
        placeholder="Search projects..."
        className="max-w-sm"
        data-testid="input-search-projects"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockProjects.map((project) => (
          <ProjectCard key={project.id} {...project} />
        ))}
      </div>
    </div>
  );
}
