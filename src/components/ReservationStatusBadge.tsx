import { Badge } from "@/components/ui/badge";
import type { ReservationStatus } from "@/lib/mock/mockStore";

const statusMap: Record<
  ReservationStatus,
  { label: string; variant: "success" | "warning" | "destructive" }
> = {
  reservado: { label: "Reservado", variant: "success" },
  pendente: { label: "Pendente", variant: "warning" },
  cancelado: { label: "Cancelado", variant: "destructive" },
};

export function ReservationStatusBadge({
  status,
}: {
  status: ReservationStatus;
}) {
  const config = statusMap[status];

  return <Badge variant={config.variant}>{config.label}</Badge>;
}
