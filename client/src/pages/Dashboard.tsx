import { Clock, DollarSign, FolderOpen, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { TimerWidget } from "@/components/TimerWidget";
import { TimeEntriesTable } from "@/components/TimeEntriesTable";
import { TimeDistributionChart } from "@/components/TimeDistributionChart";
import { WeeklyTrendChart } from "@/components/WeeklyTrendChart";
import { ProjectHoursChart } from "@/components/ProjectHoursChart";
import { TeamUtilizationChart } from "@/components/TeamUtilizationChart";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface DashboardMetrics {
  totalHours: number;
  billablePercentage: number;
  activeProjects: number;
  utilizationRate: number;
}

export default function Dashboard() {
  const { selectedWorkspace } = useWorkspace();
  
  const { data: metrics, isLoading, isError } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics', selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const getMetricValue = (value: number | undefined, fallback: string = "0") => {
    if (isError) return "Error";
    return value !== undefined ? String(value) : fallback;
  };

  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Overview of your time tracking activity
        </p>
      </div>

      <TimerWidget />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <>
            {[...Array(4)].map((_, i) => (
              <Card key={i}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-4 rounded" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-8 w-16 mb-2" />
                  <Skeleton className="h-3 w-32" />
                </CardContent>
              </Card>
            ))}
          </>
        ) : (
          <>
            <MetricCard
              title="Total Hours"
              value={getMetricValue(metrics?.totalHours)}
              icon={Clock}
              testId="metric-total-hours"
            />
            <MetricCard
              title="Billable Percentage"
              value={isError ? "Error" : `${metrics?.billablePercentage ?? 0}%`}
              icon={DollarSign}
              testId="metric-billable"
            />
            <MetricCard
              title="Active Projects"
              value={getMetricValue(metrics?.activeProjects)}
              icon={FolderOpen}
              testId="metric-active-projects"
            />
            <MetricCard
              title="Utilization Rate"
              value={isError ? "Error" : `${metrics?.utilizationRate ?? 0}%`}
              icon={TrendingUp}
              testId="metric-utilization"
            />
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <TimeDistributionChart />
        <WeeklyTrendChart />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <ProjectHoursChart />
        <TeamUtilizationChart />
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Recent Time Entries</h2>
          <p className="text-sm text-muted-foreground">Pending approval</p>
        </div>
        <TimeEntriesTable />
      </div>
    </div>
  );
}
