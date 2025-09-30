import { useState } from "react";
import { Plus, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TimeEntriesTable } from "@/components/TimeEntriesTable";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function TimeEntries() {
  const [statusFilter, setStatusFilter] = useState<string>("all");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Time Entries</h1>
          <p className="text-sm text-muted-foreground">
            View and manage all time entries
          </p>
        </div>
        <Button data-testid="button-add-entry">
          <Plus className="h-4 w-4 mr-2" />
          Add Manual Entry
        </Button>
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

      <TimeEntriesTable />
    </div>
  );
}
