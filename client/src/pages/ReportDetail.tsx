import { useState } from "react";
import { ArrowLeft, Download, Calendar as CalendarIcon, Filter, TrendingUp, Clock, DollarSign, Users } from "lucide-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";

const reportData: Record<string, any> = {
  "1": {
    title: "Time Summary Report",
    data: [
      { project: "Website Redesign", client: "Acme Corp", user: "Sarah Johnson", hours: 45.5, status: "Active" },
      { project: "Mobile App", client: "TechStart Inc", user: "Mike Chen", hours: 38.0, status: "Active" },
      { project: "Brand Identity", client: "DataFlow Ltd", user: "Emma Wilson", hours: 22.5, status: "Completed" },
      { project: "Marketing Campaign", client: "Brand Co", user: "Alex Turner", hours: 15.0, status: "Active" },
    ],
    columns: ["Project", "Client", "User", "Hours", "Status"],
    summary: {
      totalHours: "121.0",
      averageHours: "30.3",
      activeProjects: "3",
      completedProjects: "1",
    },
  },
  "2": {
    title: "Billable vs Non-Billable",
    data: [
      { project: "Website Redesign", billable: 40.5, nonBillable: 5.0, total: 45.5, percentage: "89%" },
      { project: "Mobile App", billable: 35.0, nonBillable: 3.0, total: 38.0, percentage: "92%" },
      { project: "Brand Identity", billable: 22.5, nonBillable: 0, total: 22.5, percentage: "100%" },
      { project: "Marketing Campaign", billable: 12.0, nonBillable: 3.0, total: 15.0, percentage: "80%" },
    ],
    columns: ["Project", "Billable Hours", "Non-Billable Hours", "Total Hours", "Billable %"],
    summary: {
      totalBillable: "110.0",
      totalNonBillable: "11.0",
      billableRate: "91%",
      revenue: "$11,000",
    },
  },
  "3": {
    title: "Project Hours Report",
    data: [
      { project: "Website Redesign", hours: 45.5, budget: 80, spent: "$4,550", remaining: 34.5 },
      { project: "Mobile App", hours: 38.0, budget: 60, spent: "$3,800", remaining: 22.0 },
      { project: "Brand Identity", hours: 22.5, budget: 30, spent: "$2,250", remaining: 7.5 },
      { project: "Marketing Campaign", hours: 15.0, budget: 20, spent: "$1,500", remaining: 5.0 },
    ],
    columns: ["Project", "Hours Logged", "Budget (hrs)", "Spent", "Remaining (hrs)"],
    summary: {
      totalHours: "121.0",
      totalBudget: "190 hrs",
      totalSpent: "$12,100",
      budgetRemaining: "69 hrs",
    },
  },
  "4": {
    title: "Team Utilization Report",
    data: [
      { member: "Sarah Johnson", role: "Developer", hours: 45.5, capacity: 40, utilization: "114%" },
      { member: "Mike Chen", role: "Designer", hours: 38.0, capacity: 40, utilization: "95%" },
      { member: "Emma Wilson", role: "PM", hours: 22.5, capacity: 40, utilization: "56%" },
      { member: "Alex Turner", role: "Developer", hours: 35.0, capacity: 40, utilization: "88%" },
    ],
    columns: ["Team Member", "Role", "Hours Logged", "Capacity (hrs)", "Utilization"],
    summary: {
      teamSize: "4",
      avgUtilization: "88%",
      totalCapacity: "160 hrs",
      totalLogged: "141.0 hrs",
    },
  },
  "5": {
    title: "Client Activity Report",
    data: [
      { client: "Acme Corp", projects: 2, hours: 65.5, lastActivity: "2 hours ago", status: "Active" },
      { client: "TechStart Inc", projects: 1, hours: 38.0, lastActivity: "1 day ago", status: "Active" },
      { client: "DataFlow Ltd", projects: 1, hours: 22.5, lastActivity: "3 days ago", status: "Completed" },
      { client: "Brand Co", projects: 1, hours: 15.0, lastActivity: "5 hours ago", status: "Active" },
    ],
    columns: ["Client", "Projects", "Total Hours", "Last Activity", "Status"],
    summary: {
      totalClients: "4",
      activeClients: "3",
      totalProjects: "5",
      totalHours: "141.0",
    },
  },
  "6": {
    title: "Weekly Timesheet",
    data: [
      { user: "Sarah Johnson", project: "Website Redesign", mon: 8, tue: 7.5, wed: 8, thu: 8, fri: 6.5, total: 38 },
      { user: "Mike Chen", project: "Mobile App", mon: 8, tue: 8, wed: 7, thu: 8, fri: 7.5, total: 38.5 },
      { user: "Emma Wilson", project: "Brand Identity", mon: 4, tue: 5, wed: 4.5, thu: 5, fri: 4, total: 22.5 },
      { user: "Alex Turner", project: "Marketing Campaign", mon: 7, tue: 6, wed: 7, thu: 8, fri: 7, total: 35 },
    ],
    columns: ["User", "Project", "Mon", "Tue", "Wed", "Thu", "Fri", "Total"],
    summary: {
      totalHours: "134.0",
      avgDaily: "26.8",
      peakDay: "Thursday",
      lowestDay: "Friday",
    },
  },
};

const projects = ["All Projects", "Website Redesign", "Mobile App", "Brand Identity", "Marketing Campaign"];
const clients = ["All Clients", "Acme Corp", "TechStart Inc", "DataFlow Ltd", "Brand Co"];
const teamMembers = ["All Members", "Sarah Johnson", "Mike Chen", "Emma Wilson", "Alex Turner"];
const statuses = ["All Status", "Active", "Completed", "On Hold"];

export default function ReportDetail() {
  const params = useParams();
  const reportId = params.id || "1";
  const report = reportData[reportId];
  const [dateRange, setDateRange] = useState("Last 30 days");
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [selectedProject, setSelectedProject] = useState("All Projects");
  const [selectedClient, setSelectedClient] = useState("All Clients");
  const [selectedMember, setSelectedMember] = useState("All Members");
  const [selectedStatus, setSelectedStatus] = useState("All Status");

  const quickDateOptions = [
    "Today",
    "Yesterday",
    "Current week",
    "Last 2 weeks",
    "Current Month",
    "Last Month",
    "Last 30 days",
    "Last 90 days",
    "This Quarter",
    "This Year",
  ];

  if (!report) {
    return (
      <div className="p-8">
        <p>Report not found</p>
      </div>
    );
  }

  const downloadCSV = () => {
    const headers = report.columns;
    const rows = report.data.map((row: any) => Object.values(row));
    
    const csvContent = [
      headers.join(","),
      ...rows.map((row: any[]) => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    
    link.setAttribute("href", url);
    link.setAttribute("download", `${report.title.replace(/\s+/g, "_")}_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    const headers = report.columns;
    const rows = report.data;

    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>${report.title}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              padding: 40px;
              color: #333;
            }
            h1 {
              color: #E53E3E;
              margin-bottom: 10px;
            }
            .meta {
              color: #666;
              margin-bottom: 30px;
              font-size: 14px;
            }
            .summary {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 20px;
              margin-bottom: 30px;
            }
            .summary-card {
              padding: 20px;
              background: #f9f9f9;
              border-radius: 8px;
            }
            .summary-card h3 {
              margin: 0 0 5px 0;
              font-size: 12px;
              color: #666;
              text-transform: uppercase;
            }
            .summary-card p {
              margin: 0;
              font-size: 24px;
              font-weight: bold;
              color: #333;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th {
              background-color: #f5f5f5;
              padding: 12px;
              text-align: left;
              border-bottom: 2px solid #ddd;
              font-weight: 600;
            }
            td {
              padding: 12px;
              border-bottom: 1px solid #eee;
            }
            tr:hover {
              background-color: #fafafa;
            }
            .footer {
              margin-top: 40px;
              padding-top: 20px;
              border-top: 1px solid #ddd;
              font-size: 12px;
              color: #666;
            }
          </style>
        </head>
        <body>
          <h1>${report.title}</h1>
          <div class="meta">
            Generated on ${new Date().toLocaleDateString()} at ${new Date().toLocaleTimeString()}
          </div>
          <div class="summary">
            ${Object.entries(report.summary).map(([key, value]) => `
              <div class="summary-card">
                <h3>${key.replace(/([A-Z])/g, ' $1').trim()}</h3>
                <p>${value}</p>
              </div>
            `).join('')}
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map((h: string) => `<th>${h}</th>`).join("")}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row: any) => `
                <tr>
                  ${Object.values(row).map((cell: any) => `<td>${cell}</td>`).join("")}
                </tr>
              `).join("")}
            </tbody>
          </table>
          <div class="footer">
            Report generated by Time Tracking SaaS Platform
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
    };
  };

  const renderCell = (key: string, value: any) => {
    if (key === "status" && typeof value === "string") {
      return (
        <Badge variant={value === "Active" ? "default" : "secondary"}>
          {value}
        </Badge>
      );
    }
    if (key === "utilization" && typeof value === "string") {
      const percent = parseInt(value);
      const variant = percent > 100 ? "destructive" : percent > 80 ? "default" : "secondary";
      return <Badge variant={variant}>{value}</Badge>;
    }
    return value;
  };

  const summaryCards = [
    {
      label: Object.keys(report.summary)[0].replace(/([A-Z])/g, ' $1').trim(),
      value: Object.values(report.summary)[0] as string,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      label: Object.keys(report.summary)[1].replace(/([A-Z])/g, ' $1').trim(),
      value: Object.values(report.summary)[1] as string,
      icon: Clock,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      label: Object.keys(report.summary)[2].replace(/([A-Z])/g, ' $1').trim(),
      value: Object.values(report.summary)[2] as string,
      icon: DollarSign,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
    {
      label: Object.keys(report.summary)[3].replace(/([A-Z])/g, ' $1').trim(),
      value: Object.values(report.summary)[3] as string,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/reports">
              <Button variant="ghost" size="icon" data-testid="button-back-to-reports">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <h1 className="text-3xl font-semibold">{report.title}</h1>
              <p className="text-muted-foreground mt-1">
                Generated on {new Date().toLocaleDateString()} at {new Date().toLocaleTimeString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={downloadCSV} data-testid="button-download-csv">
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button onClick={downloadPDF} data-testid="button-download-pdf">
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {summaryCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index}>
                  <CardContent className="pt-6">
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                          {card.label}
                        </p>
                        <p className="text-3xl font-bold">{card.value}</p>
                      </div>
                      <div className={`h-12 w-12 rounded-lg ${card.bgColor} flex items-center justify-center`}>
                        <Icon className={`h-6 w-6 ${card.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-muted-foreground" />
                <CardTitle>Filters & Parameters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date-range" className="text-xs font-medium text-muted-foreground">
                    Date Range
                  </Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        data-testid="button-date-range"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {dateRange}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 flex" align="start">
                      <div className="border-r">
                        <div className="p-3 space-y-1">
                          {quickDateOptions.map((option) => (
                            <button
                              key={option}
                              onClick={() => setDateRange(option)}
                              className={`w-full text-left px-3 py-2 text-sm rounded-md transition-colors ${
                                dateRange === option
                                  ? "bg-primary text-primary-foreground"
                                  : "hover-elevate"
                              }`}
                              data-testid={`button-quick-date-${option.toLowerCase().replace(/\s+/g, "-")}`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        className="rounded-md"
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="project" className="text-xs font-medium text-muted-foreground">
                    Project
                  </Label>
                  <Select value={selectedProject} onValueChange={setSelectedProject}>
                    <SelectTrigger id="project" data-testid="select-project">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {projects.map((project) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="client" className="text-xs font-medium text-muted-foreground">
                    Client
                  </Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger id="client" data-testid="select-client">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((client) => (
                        <SelectItem key={client} value={client}>
                          {client}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="member" className="text-xs font-medium text-muted-foreground">
                    Team Member
                  </Label>
                  <Select value={selectedMember} onValueChange={setSelectedMember}>
                    <SelectTrigger id="member" data-testid="select-member">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {teamMembers.map((member) => (
                        <SelectItem key={member} value={member}>
                          {member}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="status" className="text-xs font-medium text-muted-foreground">
                    Status
                  </Label>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger id="status" data-testid="select-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t">
                <Badge variant="secondary">
                  {report.data.length} records found
                </Badge>
                <Button variant="ghost" size="sm">
                  Reset Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Report Data</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((column: string) => (
                      <TableHead key={column} className="font-semibold">
                        {column}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {report.data.map((row: any, index: number) => (
                    <TableRow key={index} data-testid={`row-${index}`}>
                      {Object.entries(row).map(([key, value], cellIndex) => (
                        <TableCell key={cellIndex}>
                          {renderCell(key, value)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
