import { ArrowLeft, Download, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useQuery } from "@tanstack/react-query";
import type { TimeEntry, Project, Client, User } from "@shared/schema";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function TimeSummaryReport() {
  const { selectedWorkspace } = useWorkspace();
  
  const { data: timeEntries = [], isLoading: isLoadingEntries } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery<Project[]>({
    queryKey: ["/api/projects", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: clients = [], isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const { data: users = [], isLoading: isLoadingUsers } = useQuery<User[]>({
    queryKey: ["/api/users", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const isLoading = isLoadingEntries || isLoadingProjects || isLoadingClients || isLoadingUsers;

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return "0h 0m";
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  // Calculate totals by project
  const projectTotals = projects.map(project => {
    const projectEntries = timeEntries.filter(e => e.projectId === project.id && e.duration);
    const totalSeconds = projectEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableSeconds = projectEntries
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    return {
      projectName: project.name,
      clientName: clients.find(c => c.id === project.clientId)?.name || "Unknown",
      totalHours: totalSeconds / 3600,
      billableHours: billableSeconds / 3600,
      totalSeconds,
      billableSeconds,
    };
  }).filter(p => p.totalSeconds > 0);

  // Calculate totals by user
  const userTotals = users.map(user => {
    const userEntries = timeEntries.filter(e => e.userId === user.id && e.duration);
    const totalSeconds = userEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const billableSeconds = userEntries
      .filter(e => e.isBillable)
      .reduce((sum, e) => sum + (e.duration || 0), 0);
    
    return {
      userName: user.name,
      totalHours: totalSeconds / 3600,
      billableHours: billableSeconds / 3600,
      totalSeconds,
      billableSeconds,
    };
  }).filter(u => u.totalSeconds > 0);

  // Overall totals
  const completedEntries = timeEntries.filter(e => e.duration);
  const totalSeconds = completedEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
  const billableSeconds = completedEntries
    .filter(e => e.isBillable)
    .reduce((sum, e) => sum + (e.duration || 0), 0);

  const escapeCSV = (value: string | number): string => {
    const stringValue = String(value);
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    return stringValue;
  };

  const handleExportCSV = () => {
    if (isLoading) return;

    const csvRows = [
      // Header
      ['Report Type', 'Time Summary Report'],
      ['Generated', new Date().toLocaleDateString()],
      [''],
      // Overall summary
      ['Overall Summary'],
      ['Total Hours', (totalSeconds / 3600).toFixed(2)],
      ['Billable Hours', (billableSeconds / 3600).toFixed(2)],
      ['Non-Billable Hours', ((totalSeconds - billableSeconds) / 3600).toFixed(2)],
      ['Total Entries', completedEntries.length.toString()],
      [''],
      // By project
      ['Hours by Project'],
      ['Project', 'Client', 'Total Hours', 'Billable Hours', 'Non-Billable Hours'],
      ...projectTotals.map(p => [
        p.projectName,
        p.clientName,
        p.totalHours.toFixed(2),
        p.billableHours.toFixed(2),
        (p.totalHours - p.billableHours).toFixed(2),
      ]),
      [''],
      // By user
      ['Hours by Team Member'],
      ['Team Member', 'Total Hours', 'Billable Hours', 'Non-Billable Hours'],
      ...userTotals.map(u => [
        u.userName,
        u.totalHours.toFixed(2),
        u.billableHours.toFixed(2),
        (u.totalHours - u.billableHours).toFixed(2),
      ]),
    ];

    const csvContent = csvRows.map(row => row.map(escapeCSV).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `time-summary-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="text-lg font-semibold mb-2">Loading report data...</div>
          <div className="text-sm text-muted-foreground">Please wait while we generate your report</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/reports">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-semibold">Time Summary Report</h1>
            <p className="text-sm text-muted-foreground">
              Overview of total hours logged by project, client, and user
            </p>
          </div>
        </div>
        <Button onClick={handleExportCSV} data-testid="button-export">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-hours">
              {formatDuration(totalSeconds)}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="metric-total-entries">
              {completedEntries.length} entries
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Billable Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-billable-hours">
              {formatDuration(billableSeconds)}
            </div>
            <p className="text-xs text-muted-foreground" data-testid="metric-billable-percentage">
              {totalSeconds > 0 ? Math.round((billableSeconds / totalSeconds) * 100) : 0}% of total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Projects
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-active-projects">
              {projectTotals.length}
            </div>
            <p className="text-xs text-muted-foreground">
              With logged time
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hours by Project</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Billable Hours</TableHead>
                  <TableHead className="text-right">Non-Billable Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {projectTotals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center text-muted-foreground">
                      No time entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  projectTotals.map((project, index) => (
                    <TableRow key={index} data-testid={`row-project-${index}`}>
                      <TableCell className="font-medium" data-testid={`cell-project-name-${index}`}>
                        {project.projectName}
                      </TableCell>
                      <TableCell data-testid={`cell-client-name-${index}`}>
                        {project.clientName}
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-total-hours-${index}`}>
                        {project.totalHours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-billable-hours-${index}`}>
                        {project.billableHours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-nonbillable-hours-${index}`}>
                        {(project.totalHours - project.billableHours).toFixed(2)}h
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Hours by Team Member</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Member</TableHead>
                  <TableHead className="text-right">Total Hours</TableHead>
                  <TableHead className="text-right">Billable Hours</TableHead>
                  <TableHead className="text-right">Non-Billable Hours</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userTotals.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No time entries found
                    </TableCell>
                  </TableRow>
                ) : (
                  userTotals.map((user, index) => (
                    <TableRow key={index} data-testid={`row-user-${index}`}>
                      <TableCell className="font-medium" data-testid={`cell-user-name-${index}`}>
                        {user.userName}
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-user-total-hours-${index}`}>
                        {user.totalHours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-user-billable-hours-${index}`}>
                        {user.billableHours.toFixed(2)}h
                      </TableCell>
                      <TableCell className="text-right font-mono" data-testid={`cell-user-nonbillable-hours-${index}`}>
                        {(user.totalHours - user.billableHours).toFixed(2)}h
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
