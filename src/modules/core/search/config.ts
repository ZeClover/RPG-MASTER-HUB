import { Boxes, CalendarCheck, FileText, Lightbulb, UserCircle } from "lucide-react";

import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import type { SearchResultType } from "@/modules/core/search/queries";

// TIMELINE_EVENT/MYSTERY já vêm de `ENTITY_TYPE_ICONS`/`ENTITY_TYPE_LABELS` (fazem parte de
// `RelatableEntityType`) — só os 5 tipos de resultado que não são "entidade relacionável" (Idea,
// Character, Handout, CustomCategoryEntry, SessionPlan) precisam de entrada própria aqui.
export const SEARCH_RESULT_ICONS = {
  ...ENTITY_TYPE_ICONS,
  IDEA: Lightbulb,
  CHARACTER: UserCircle,
  HANDOUT: FileText,
  CUSTOM_CATEGORY_ENTRY: Boxes,
  SESSION_PLAN: CalendarCheck,
} satisfies Record<SearchResultType, typeof Lightbulb>;

export const SEARCH_RESULT_LABELS = {
  ...ENTITY_TYPE_LABELS,
  IDEA: "Ideia",
  CHARACTER: "Personagem",
  HANDOUT: "Handout",
  CUSTOM_CATEGORY_ENTRY: "Categoria",
  SESSION_PLAN: "Sessão",
} satisfies Record<SearchResultType, string>;
