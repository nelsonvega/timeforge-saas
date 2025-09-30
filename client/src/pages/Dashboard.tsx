import { Clock, DollarSign, FolderOpen, TrendingUp } from "lucide-react";
import { MetricCard } from "@/components/MetricCard";
import { TimerWidget } from "@/components/TimerWidget";
import { TimeEntriesTable } from "@/components/TimeEntriesTable";
import { TimeDistributionChart } from "@/components/TimeDistributionChart";
import { WeeklyTrendChart } from "@/components/WeeklyTrendChart";
import { ProjectHoursChart } from "@/components/ProjectHoursChart";
import { TeamUtilizationChart } from "@/components/TeamUtilizationChart";

export default function Dashboard() {
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
          value="248.5"
          icon={Clock}
          trend={{ value: 12, isPositive: true }}
          testId="metric-total-hours"
        />
        <MetricCard
          title="Billable Percentage"
          value="78%"
          icon={DollarSign}
          trend={{ value: 5, isPositive: true }}
          testId="metric-billable"
        />
        <MetricCard
          title="Active Projects"
          value="12"
          icon={FolderOpen}
          testId="metric-active-projects"
        />
        <MetricCard
          title="Utilization Rate"
          value="85%"
          icon={TrendingUp}
          trend={{ value: 3, isPositive: false }}
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
