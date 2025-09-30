import { Filter } from "lucide-react";
import { useState } from "react";
import { TrackerTable } from "@/components/TrackerTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function Tracker() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tracker</h1>
          <p className="text-sm text-muted-foreground">
            Track time and manage your time entries
          </p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <Input
          placeholder="Search entries..."
          className="max-w-sm"
          data-testid="input-search-entries"
        />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]" data-testid="select-status-filter">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <TrackerTable />
    </div>
  );
}
