import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { TimeEntry, Project } from "@shared/schema";

export function ProjectHoursChart() {
  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const { data: projects = [] } = useQuery<Project[]>({
    queryKey: ['/api/projects'],
  });

  const projectHours = projects.map(project => {
    const projectEntries = entries.filter(e => e.projectId === project.id);
    const totalMinutes = projectEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      project: project.name.length > 15 ? project.name.substring(0, 15) + '...' : project.name,
      hours,
    };
  }).filter(p => p.hours > 0)
    .sort((a, b) => b.hours - a.hours)
    .slice(0, 5);

  if (projectHours.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Hours by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No project hours yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hours by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={projectHours}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="project"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-lg p-2 shadow-md">
                      <p className="text-sm font-medium">{payload[0].payload.project}</p>
                      <p className="text-sm text-muted-foreground font-mono">{payload[0].value}h</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="hours" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
