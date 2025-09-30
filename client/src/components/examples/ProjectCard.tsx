import { ProjectCard } from "../ProjectCard";

export default function ProjectCardExample() {
  return (
    <ProjectCard
      id="1"
      name="Website Redesign"
      client="Acme Corporation"
      status="active"
      budget={50000}
      budgetUsed={32500}
      assignedUsers={4}
      totalHours={120}
    />
  );
}
