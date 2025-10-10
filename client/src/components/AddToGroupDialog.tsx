import { useMutation, useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/contexts/WorkspaceContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import type { User } from "@shared/schema";

type Group = {
  id: string;
  name: string;
  color: string | null;
};

interface AddToGroupDialogProps {
  member: User | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddToGroupDialog({ member, open, onOpenChange }: AddToGroupDialogProps) {
  const { selectedWorkspace } = useWorkspace();
  const { toast } = useToast();
  const [selectedGroupId, setSelectedGroupId] = useState<string>("");

  const { data: groups = [] } = useQuery<Group[]>({
    queryKey: ["/api/groups", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id && open,
  });

  const addMemberMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const res = await apiRequest(
        "POST",
        `/api/groups/${groupId}/members`,
        { userId: member?.id },
        selectedWorkspace?.id
      );
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/groups", selectedWorkspace?.id] });
      toast({
        title: "Success",
        description: `${member?.name} has been added to the group`,
      });
      setSelectedGroupId("");
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedGroupId) {
      toast({
        title: "Error",
        description: "Please select a group",
        variant: "destructive",
      });
      return;
    }
    addMemberMutation.mutate(selectedGroupId);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent data-testid="dialog-add-to-group">
        <DialogHeader>
          <DialogTitle>Add to Group</DialogTitle>
          <DialogDescription>
            Add {member?.name} to a group
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Group</label>
            <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
              <SelectTrigger data-testid="select-group">
                <SelectValue placeholder="Choose a group" />
              </SelectTrigger>
              <SelectContent>
                {groups.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">
                    No groups available
                  </div>
                ) : (
                  groups.map((group) => (
                    <SelectItem key={group.id} value={group.id}>
                      <div className="flex items-center gap-2">
                        {group.color && (
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: group.color }}
                          />
                        )}
                        {group.name}
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={addMemberMutation.isPending || !selectedGroupId}
            data-testid="button-add-to-group"
          >
            {addMemberMutation.isPending ? "Adding..." : "Add to Group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
