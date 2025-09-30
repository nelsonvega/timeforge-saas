import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { project: "Website", hours: 120 },
  { project: "Mobile App", hours: 180 },
  { project: "API", hours: 95 },
  { project: "Marketing", hours: 32 },
];

export function ProjectHoursChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Hours by Project</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={data}>
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
