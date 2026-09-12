import type { CanonStatus } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { CANON_STATUS_BADGE_VARIANT, CANON_STATUS_LABELS } from "@/components/wiki/status-config";

export function CanonStatusBadge({ status }: { status: CanonStatus }) {
  return <Badge variant={CANON_STATUS_BADGE_VARIANT[status]}>{CANON_STATUS_LABELS[status]}</Badge>;
}
