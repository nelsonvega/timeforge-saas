import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const data = [
  { day: "Mon", hours: 6.5 },
  { day: "Tue", hours: 8.2 },
  { day: "Wed", hours: 7.8 },
  { day: "Thu", hours: 9.1 },
  { day: "Fri", hours: 7.5 },
  { day: "Sat", hours: 2.0 },
  { day: "Sun", hours: 0.5 },
];

export function WeeklyTrendChart() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Weekly Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
            <XAxis
              dataKey="day"
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
                      <p className="text-sm font-medium">{payload[0].payload.day}</p>
                      <p className="text-sm text-muted-foreground font-mono">{payload[0].value}h</p>
                    </div>
                  );
                }
                return null;
              }}
            />
            <Line
              type="monotone"
              dataKey="hours"
              stroke="hsl(var(--chart-1))"
              strokeWidth={2}
              dot={{ fill: "hsl(var(--chart-1))", r: 4 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
