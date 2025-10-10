import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { TeamTable } from "@/components/TeamTable";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GroupsTable } from "@/components/GroupsTable";
import { useState } from "react";

export default function Team() {
  const [activeTab, setActiveTab] = useState("members");

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Team Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage your team members and groups
          </p>
        </div>
        {activeTab === "members" ? (
          <Link href="/team/new">
            <Button data-testid="button-invite-member">
              <Plus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </Link>
        ) : (
          <Button data-testid="button-create-group">
            <Plus className="h-4 w-4 mr-2" />
            Create Group
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList data-testid="tabs-team-management">
          <TabsTrigger value="members" data-testid="tab-team-members">
            Team Members
          </TabsTrigger>
          <TabsTrigger value="groups" data-testid="tab-groups">
            Groups
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4 mt-6">
          <Input
            placeholder="Search team members..."
            className="max-w-sm"
            data-testid="input-search-team"
          />
          <TeamTable />
        </TabsContent>

        <TabsContent value="groups" className="space-y-4 mt-6">
          <Input
            placeholder="Search groups..."
            className="max-w-sm"
            data-testid="input-search-groups"
          />
          <GroupsTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
