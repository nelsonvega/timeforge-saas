import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TeamTable } from "@/components/TeamTable";
import { Input } from "@/components/ui/input";

export default function Team() {
  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team Members</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team and assign projects
          </p>
        </div>
        <Link href="/team/new">
          <Button data-testid="button-invite-member">
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search team members..."
        className="max-w-sm"
        data-testid="input-search-team"
      />

      <TeamTable />
    </div>
  );
}
