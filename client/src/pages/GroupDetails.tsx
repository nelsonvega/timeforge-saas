import { useState } from "react";
import { ArrowLeft, Users, Trash2, UserPlus } from "lucide-react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type Group = {
  id: string;
  name: string;
  description: string | null;
  color: string | null;
  status: "active" | "inactive";
};

type GroupMember = {
  id: string;
  groupId: string;
  userId: string;
  workspaceId: string;
};

type User = {
  id: string;
  name: string | null;
  email: string;
  role: string;
};

export default function GroupDetails() {
  const { id } = useParams<{ id: string }>();
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  const { data: group, isLoading: groupLoading } = useQuery<Group>({
    queryKey: [`/api/groups/${id}`, selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id && !!id,
  });

  const { data: groupMembers = [] } = useQuery<GroupMember[]>({
    queryKey: [`/api/groups/${id}/members`, selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id && !!id,
  });

  const { data: allUsers = [] } = useQuery<User[]>({
    queryKey: ["/api/users", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest(
        "POST",
        `/api/groups/${id}/members`,
        { userId },
        selectedWorkspace?.id
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${id}/members`, selectedWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedWorkspace?.id] });
      toast({
        title: "Success",
        description: "Member added to group",
      });
      setSelectedUserId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: async (userId: string) => {
      const res = await apiRequest(
        "DELETE",
        `/api/groups/${id}/members/${userId}`,
        undefined,
        selectedWorkspace?.id
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/groups/${id}/members`, selectedWorkspace?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedWorkspace?.id] });
      toast({
        title: "Success",
        description: "Member removed from group",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const memberUserIds = groupMembers.map((m) => m.userId);
  const members = allUsers.filter((u) => memberUserIds.includes(u.id));
  const availableUsers = allUsers.filter((u) => !memberUserIds.includes(u.id));

  if (groupLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading group...</p>
        </div>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-semibold">Group not found</h2>
          <Link href="/team">
            <Button className="mt-4">Back to Team</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-5xl mx-auto px-8 py-6">
          <div className="flex items-center gap-4">
            <Link href="/team">
              <Button variant="ghost" size="icon" data-testid="button-back-to-team">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                {group.color && (
                  <div
                    className="h-8 w-8 rounded-full"
                    style={{ backgroundColor: group.color }}
                  />
                )}
                <div>
                  <h1 className="text-3xl font-semibold">{group.name}</h1>
                  {group.description && (
                    <p className="text-muted-foreground mt-1">{group.description}</p>
                  )}
                </div>
              </div>
            </div>
            <Badge
              variant={group.status === "active" ? "default" : "secondary"}
              data-testid="badge-group-status"
            >
              {group.status}
            </Badge>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-8 py-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Group Members ({members.length})
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {availableUsers.length > 0 && (
              <div className="flex gap-2">
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="flex-1" data-testid="select-add-member">
                    <SelectValue placeholder="Select a member to add" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name || user.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => selectedUserId && addMemberMutation.mutate(selectedUserId)}
                  disabled={!selectedUserId || addMemberMutation.isPending}
                  data-testid="button-add-member"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            )}

            {members.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No members in this group yet
              </div>
            ) : (
              <div className="space-y-2">
                {members.map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover-elevate"
                    data-testid={`member-${member.id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(member.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">{member.name || "Unnamed User"}</p>
                        <p className="text-sm text-muted-foreground">{member.email}</p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMemberMutation.mutate(member.id)}
                      disabled={removeMemberMutation.isPending}
                      data-testid={`button-remove-${member.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
