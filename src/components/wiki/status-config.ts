import type { CanonStatus, IdeaState, Visibility } from "@/generated/prisma/client";
import type { BadgeProps } from "@/components/ui/badge";

export const CANON_STATUS_LABELS: Record<CanonStatus, string> = {
  DRAFT: "Rascunho",
  PROPOSED: "Proposto",
  APPROVED: "Aprovado",
  CANON: "Canônico",
  OBSOLETE: "Obsoleto",
  ARCHIVED: "Arquivado",
};

export const CANON_STATUS_BADGE_VARIANT: Record<CanonStatus, NonNullable<BadgeProps["variant"]>> = {
  DRAFT: "outline",
  PROPOSED: "warning",
  APPROVED: "secondary",
  CANON: "success",
  OBSOLETE: "outline",
  ARCHIVED: "outline",
};

export const CANON_STATUS_OPTIONS = Object.entries(CANON_STATUS_LABELS) as [CanonStatus, string][];

export const VISIBILITY_LABELS: Record<Visibility, string> = {
  GM_ONLY: "Somente Mestre",
  PLAYERS: "Jogadores",
  PUBLIC: "Público",
};

export const VISIBILITY_OPTIONS = Object.entries(VISIBILITY_LABELS) as [Visibility, string][];

export const IDEA_STATE_LABELS: Record<IdeaState, string> = {
  NEW: "Nova",
  INTERESTING: "Interessante",
  DEVELOPING: "Desenvolvendo",
  USED: "Utilizada",
  ARCHIVED: "Arquivada",
  DISCARDED: "Descartada",
};

export const IDEA_STATE_BADGE_VARIANT: Record<IdeaState, NonNullable<BadgeProps["variant"]>> = {
  NEW: "outline",
  INTERESTING: "warning",
  DEVELOPING: "secondary",
  USED: "success",
  ARCHIVED: "outline",
  DISCARDED: "outline",
};

export const IDEA_STATE_OPTIONS = Object.entries(IDEA_STATE_LABELS) as [IdeaState, string][];
