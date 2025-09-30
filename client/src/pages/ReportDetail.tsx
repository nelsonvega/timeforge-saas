import { useState } from "react";
import { ArrowLeft, Download, Calendar, Filter } from "lucide-react";
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
  },
};

export default function ReportDetail() {
  const params = useParams();
  const reportId = params.id || "1";
  const report = reportData[reportId];
  const [dateRange, setDateRange] = useState("7days");

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
                Generated on {new Date().toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={downloadCSV} data-testid="button-download-csv">
                <Download className="h-4 w-4 mr-2" />
                Download CSV
              </Button>
              <Button onClick={downloadPDF} data-testid="button-download-pdf">
                <Download className="h-4 w-4 mr-2" />
                Download PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <Select value={dateRange} onValueChange={setDateRange}>
                    <SelectTrigger className="w-[180px]" data-testid="select-date-range">
                      <SelectValue placeholder="Select date range" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7days">Last 7 days</SelectItem>
                      <SelectItem value="30days">Last 30 days</SelectItem>
                      <SelectItem value="90days">Last 90 days</SelectItem>
                      <SelectItem value="year">This year</SelectItem>
                      <SelectItem value="all">All time</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Badge variant="secondary" className="ml-auto">
                  {report.data.length} records
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    {report.columns.map((column: string) => (
                      <TableHead key={column}>{column}</TableHead>
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
