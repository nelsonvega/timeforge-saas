import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/ClientCard";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import type { Client } from "@shared/schema";
import { useState } from "react";
import { useWorkspace } from "@/contexts/WorkspaceContext";

export default function Clients() {
  const [searchTerm, setSearchTerm] = useState("");
  const { selectedWorkspace } = useWorkspace();
  
  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients", selectedWorkspace?.id],
    enabled: !!selectedWorkspace?.id,
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Clients</h1>
          <p className="text-sm text-muted-foreground">
            Manage your client relationships and contacts
          </p>
        </div>
        <Link href="/clients/new">
          <Button data-testid="button-add-client">
            <Plus className="h-4 w-4 mr-2" />
            New Client
          </Button>
        </Link>
      </div>

      <Input
        placeholder="Search clients..."
        className="max-w-sm"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        data-testid="input-search-clients"
      />

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading clients...</div>
      ) : filteredClients.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          {searchTerm ? "No clients found matching your search." : "No clients yet. Create your first client!"}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClients.map((client) => (
            <ClientCard key={client.id} {...client} />
          ))}
        </div>
      )}
    </div>
  );
}
