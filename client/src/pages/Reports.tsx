import { FileText, Download, Calendar, DollarSign, Users, Briefcase, Eye } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const reports = [
  {
    id: "1",
    title: "Time Summary Report",
    description: "Overview of total hours logged by project, client, and user",
    icon: Calendar,
    category: "Time Tracking",
  },
  {
    id: "2",
    title: "Billable vs Non-Billable",
    description: "Breakdown of billable and non-billable hours across all projects",
    icon: DollarSign,
    category: "Financial",
  },
  {
    id: "3",
    title: "Project Hours Report",
    description: "Detailed hours breakdown per project with budget comparison",
    icon: FileText,
    category: "Projects",
  },
  {
    id: "4",
    title: "Team Utilization Report",
    description: "Individual team member utilization rates and productivity metrics",
    icon: Users,
    category: "Team",
  },
  {
    id: "5",
    title: "Client Activity Report",
    description: "Hours logged and project activity per client",
    icon: Briefcase,
    category: "Clients",
  },
  {
    id: "6",
    title: "Weekly Timesheet",
    description: "Week-by-week breakdown of hours by user and project",
    icon: Calendar,
    category: "Time Tracking",
  },
];

export default function Reports() {
  return (
    <div className="p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Reports</h1>
        <p className="text-sm text-muted-foreground">
          Generate and export detailed reports for your time tracking data
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {reports.map((report) => {
          const Icon = report.icon;
          return (
            <Card key={report.id} data-testid={`card-report-${report.id}`} className="hover-elevate">
              <CardHeader>
                <div className="flex items-start justify-between gap-2">
                  <div className="h-10 w-10 rounded-md bg-primary/10 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="text-xs text-muted-foreground">{report.category}</span>
                </div>
                <CardTitle className="text-base">{report.title}</CardTitle>
                <CardDescription className="text-sm">{report.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex gap-2">
                <Link href={report.id === "1" ? "/reports/time-summary" : `/reports/${report.id}`} className="flex-1">
                  <Button
                    variant="outline"
                    className="w-full"
                    data-testid={`button-view-report-${report.id}`}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View
                  </Button>
                </Link>
                <Link href={report.id === "1" ? "/reports/time-summary" : `/reports/${report.id}`} className="flex-1">
                  <Button
                    className="w-full"
                    data-testid={`button-generate-report-${report.id}`}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                </Link>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
