import { Plus } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ClientCard } from "@/components/ClientCard";
import { Input } from "@/components/ui/input";

const mockClients = [
  {
    id: "1",
    name: "Acme Corporation",
    email: "contact@acme.com",
    location: "San Francisco, CA",
    projectCount: 5,
    totalHours: 248,
    status: "active" as const,
  },
  {
    id: "2",
    name: "TechStart Inc",
    email: "hello@techstart.io",
    location: "New York, NY",
    projectCount: 3,
    totalHours: 180,
    status: "active" as const,
  },
  {
    id: "3",
    name: "DataFlow Ltd",
    email: "info@dataflow.com",
    location: "Austin, TX",
    projectCount: 2,
    totalHours: 95,
    status: "active" as const,
  },
  {
    id: "4",
    name: "Brand Co",
    email: "team@brandco.com",
    location: "Los Angeles, CA",
    projectCount: 1,
    totalHours: 32,
    status: "inactive" as const,
  },
];

export default function Clients() {
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
        data-testid="input-search-clients"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockClients.map((client) => (
          <ClientCard key={client.id} {...client} />
        ))}
      </div>
    </div>
  );
}
