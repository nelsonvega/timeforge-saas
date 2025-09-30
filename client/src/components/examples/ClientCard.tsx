import { ClientCard } from "../ClientCard";

export default function ClientCardExample() {
  return (
    <ClientCard
      id="1"
      name="Acme Corporation"
      email="contact@acme.com"
      location="San Francisco, CA"
      projectCount={5}
      totalHours={248}
      status="active"
    />
  );
}
