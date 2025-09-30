import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

const data = [
  { name: "Billable", value: 194, hours: "194h" },
  { name: "Non-billable", value: 54, hours: "54h" },
];

const COLORS = ["hsl(var(--chart-1))", "hsl(var(--chart-5))"];

export function TimeDistributionChart() {
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
