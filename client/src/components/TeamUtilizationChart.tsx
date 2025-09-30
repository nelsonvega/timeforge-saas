import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { TimeEntry, User } from "@shared/schema";

export function TeamUtilizationChart() {
  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['/api/users'],
  });

  const userUtilization = users.map(user => {
    const userEntries = entries.filter(e => e.userId === user.id);
    const totalMinutes = userEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const totalHours = totalMinutes / 60;
    const utilization = Math.min(100, Math.round((totalHours / 40) * 100));

    const displayName = user.name || user.email || 'Unknown';
    const shortName = displayName.length > 15 
      ? displayName.substring(0, 15) + '...' 
      : displayName;

    return {
      name: shortName,
      utilization,
    };
  }).filter(u => u.utilization > 0)
    .sort((a, b) => b.utilization - a.utilization)
    .slice(0, 5);

  if (userUtilization.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Team Utilization</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No team data yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Team Utilization</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={userUtilization} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              domain={[0, 100]}
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fill: "hsl(var(--muted-foreground))" }}
              width={80}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-lg p-2 shadow-md">
                      <p className="text-sm font-medium">{payload[0].payload.name}</p>
                      <p className="text-sm text-muted-foreground">{payload[0].value}%</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Bar dataKey="utilization" fill="hsl(var(--chart-3))" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
