import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { useQuery } from "@tanstack/react-query";
import { startOfWeek, endOfWeek, eachDayOfInterval, format, isSameDay } from "date-fns";
import type { TimeEntry } from "@shared/schema";

export function WeeklyTrendChart() {
  const { data: entries = [] } = useQuery<TimeEntry[]>({
    queryKey: ['/api/time-entries'],
  });

  const now = new Date();
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);
  const daysOfWeek = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const data = daysOfWeek.map(day => {
    const dayEntries = entries.filter(entry => 
      isSameDay(new Date(entry.startTime), day)
    );
    
    const totalMinutes = dayEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const hours = Math.round((totalMinutes / 60) * 10) / 10;

    return {
      day: format(day, 'EEE'),
      hours,
    };
  });

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
