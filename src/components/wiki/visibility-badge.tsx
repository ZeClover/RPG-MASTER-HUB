import { Eye, EyeOff, Users, type LucideIcon } from "lucide-react";

import type { Visibility } from "@/generated/prisma/client";
import { Badge } from "@/components/ui/badge";
import { VISIBILITY_LABELS } from "@/components/wiki/status-config";

const VISIBILITY_ICONS: Record<Visibility, LucideIcon> = {
  GM_ONLY: EyeOff,
  PLAYERS: Users,
  PUBLIC: Eye,
};

export function VisibilityBadge({ visibility }: { visibility: Visibility }) {
  const Icon = VISIBILITY_ICONS[visibility];
  return (
    <Badge variant="outline" className="gap-1">
      <Icon className="size-3" /> {VISIBILITY_LABELS[visibility]}
    </Badge>
  );
}
