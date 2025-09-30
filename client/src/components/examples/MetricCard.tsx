import { Clock } from "lucide-react";
import { MetricCard } from "../MetricCard";

export default function MetricCardExample() {
  return (
    <MetricCard
      title="Total Hours"
      value="248.5"
      icon={Clock}
      trend={{ value: 12, isPositive: true }}
    />
  );
}
