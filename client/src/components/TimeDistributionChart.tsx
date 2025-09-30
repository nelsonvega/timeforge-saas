import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { useQuery } from "@tanstack/react-query";
import type { TimeEntry } from "@shared/schema";

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-5))"];

export function TimeDistributionChart() {
  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const billableMinutes = entries
    .filter(e => e.isBillable && e.duration)
    .reduce((sum, e) => sum + (e.duration || 0), 0);
  
  const nonBillableMinutes = entries
    .filter(e => !e.isBillable && e.duration)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const billableHours = Math.round((billableMinutes / 60) * 10) / 10;
  const nonBillableHours = Math.round((nonBillableMinutes / 60) * 10) / 10;

  const data = [
    { name: "Billable", value: billableHours, hours: `${billableHours}h` },
    { name: "Non-billable", value: nonBillableHours, hours: `${nonBillableHours}h` },
  ].filter(item => item.value > 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Time Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[250px] flex items-center justify-center text-muted-foreground text-sm">
            No time entries yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Time Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  return (
                    <div className="bg-popover border border-popover-border rounded-lg p-2 shadow-md">
                      <p className="text-sm font-medium">{payload[0].name}</p>
                      <p className="text-sm text-muted-foreground">{payload[0].payload.hours}</p>
                    </div>
                  );
                }
                return null;
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
