import { Lightbulb } from "lucide-react";

import { ENTITY_TYPE_ICONS, ENTITY_TYPE_LABELS } from "@/modules/creation/relationships/config";
import type { SearchResultType } from "@/modules/core/search/queries";

export const SEARCH_RESULT_ICONS = { ...ENTITY_TYPE_ICONS, IDEA: Lightbulb } satisfies Record<
  SearchResultType,
  typeof Lightbulb
>;

export const SEARCH_RESULT_LABELS = { ...ENTITY_TYPE_LABELS, IDEA: "Ideia" } satisfies Record<SearchResultType, string>;
