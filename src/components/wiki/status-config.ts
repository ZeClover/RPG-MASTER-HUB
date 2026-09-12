import type {
  CanonStatus,
  ConsequenceStatus,
  IdeaState,
  MysteryStatus,
  PlotThreadStatus,
  QuestStatus,
  SceneStatus,
  SessionPlanStatus,
  Visibility,
} from "@/generated/prisma/client";
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

export const QUEST_STATUS_LABELS: Record<QuestStatus, string> = {
  NOT_STARTED: "Não iniciada",
  ACTIVE: "Ativa",
  COMPLETED: "Concluída",
  FAILED: "Falhou",
  ABANDONED: "Abandonada",
};

export const QUEST_STATUS_BADGE_VARIANT: Record<QuestStatus, NonNullable<BadgeProps["variant"]>> = {
  NOT_STARTED: "outline",
  ACTIVE: "warning",
  COMPLETED: "success",
  FAILED: "destructive",
  ABANDONED: "outline",
};

export const QUEST_STATUS_OPTIONS = Object.entries(QUEST_STATUS_LABELS) as [QuestStatus, string][];

export const PLOT_THREAD_STATUS_LABELS: Record<PlotThreadStatus, string> = {
  ACTIVE: "Ativa",
  DORMANT: "Dormente",
  RESOLVED: "Resolvida",
  ABANDONED: "Abandonada",
};

export const PLOT_THREAD_STATUS_BADGE_VARIANT: Record<PlotThreadStatus, NonNullable<BadgeProps["variant"]>> = {
  ACTIVE: "warning",
  DORMANT: "outline",
  RESOLVED: "success",
  ABANDONED: "outline",
};

export const PLOT_THREAD_STATUS_OPTIONS = Object.entries(PLOT_THREAD_STATUS_LABELS) as [PlotThreadStatus, string][];

export const CONSEQUENCE_STATUS_LABELS: Record<ConsequenceStatus, string> = {
  PENDING: "Pendente",
  TRIGGERED: "Disparada",
  RESOLVED: "Resolvida",
};

export const CONSEQUENCE_STATUS_BADGE_VARIANT: Record<ConsequenceStatus, NonNullable<BadgeProps["variant"]>> = {
  PENDING: "outline",
  TRIGGERED: "warning",
  RESOLVED: "success",
};

export const CONSEQUENCE_STATUS_OPTIONS = Object.entries(CONSEQUENCE_STATUS_LABELS) as [ConsequenceStatus, string][];

export const SESSION_PLAN_STATUS_LABELS: Record<SessionPlanStatus, string> = {
  PLANNING: "Planejando",
  READY: "Pronta",
  DONE: "Concluída",
  CANCELLED: "Cancelada",
};

export const SESSION_PLAN_STATUS_BADGE_VARIANT: Record<SessionPlanStatus, NonNullable<BadgeProps["variant"]>> = {
  PLANNING: "outline",
  READY: "warning",
  DONE: "success",
  CANCELLED: "outline",
};

export const SESSION_PLAN_STATUS_OPTIONS = Object.entries(SESSION_PLAN_STATUS_LABELS) as [SessionPlanStatus, string][];

export const SCENE_STATUS_LABELS: Record<SceneStatus, string> = {
  PLANNED: "Planejada",
  PLAYED: "Jogada",
  CUT: "Cortada",
};

export const SCENE_STATUS_BADGE_VARIANT: Record<SceneStatus, NonNullable<BadgeProps["variant"]>> = {
  PLANNED: "outline",
  PLAYED: "success",
  CUT: "outline",
};

export const SCENE_STATUS_OPTIONS = Object.entries(SCENE_STATUS_LABELS) as [SceneStatus, string][];

export const MYSTERY_STATUS_LABELS: Record<MysteryStatus, string> = {
  OPEN: "Aberto",
  RESOLVED: "Resolvido",
};

export const MYSTERY_STATUS_BADGE_VARIANT: Record<MysteryStatus, NonNullable<BadgeProps["variant"]>> = {
  OPEN: "warning",
  RESOLVED: "success",
};

export const MYSTERY_STATUS_OPTIONS = Object.entries(MYSTERY_STATUS_LABELS) as [MysteryStatus, string][];
