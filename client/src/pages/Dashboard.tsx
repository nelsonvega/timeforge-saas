import { Clock, DollarSign, FolderOpen, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { MetricCard } from "@/components/MetricCard";
import { TimerWidget } from "@/components/TimerWidget";
import { TimeEntriesTable } from "@/components/TimeEntriesTable";
import { TimeDistributionChart } from "@/components/TimeDistributionChart";
import { WeeklyTrendChart } from "@/components/WeeklyTrendChart";
import { ProjectHoursChart } from "@/components/ProjectHoursChart";
import { TeamUtilizationChart } from "@/components/TeamUtilizationChart";

interface DashboardMetrics {
  totalHours: number;
  billablePercentage: number;
  activeProjects: number;
  utilizationRate: number;
}

export default function Dashboard() {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/dashboard/metrics'],
  });

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
        <MetricCard
          title="Total Hours"
          value={isLoading ? "..." : metrics?.totalHours.toString() || "0"}
          icon={Clock}
          testId="metric-total-hours"
        />
        <MetricCard
          title="Billable Percentage"
          value={isLoading ? "..." : `${metrics?.billablePercentage || 0}%`}
          icon={DollarSign}
          testId="metric-billable"
        />
        <MetricCard
          title="Active Projects"
          value={isLoading ? "..." : metrics?.activeProjects.toString() || "0"}
          icon={FolderOpen}
          testId="metric-active-projects"
        />
        <MetricCard
          title="Utilization Rate"
          value={isLoading ? "..." : `${metrics?.utilizationRate || 0}%`}
          icon={TrendingUp}
          testId="metric-utilization"
        />
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
