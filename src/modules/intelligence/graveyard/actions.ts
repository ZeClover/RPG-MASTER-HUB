"use server";

import type { ContentEntityType } from "@/modules/intelligence/content-types";
import { toggleNpcArchivedAction, deleteNpcAction } from "@/modules/creation/npcs/actions";
import { toggleLocationArchivedAction, deleteLocationAction } from "@/modules/creation/locations/actions";
import { toggleFactionArchivedAction, deleteFactionAction } from "@/modules/creation/factions/actions";
import { toggleLorePageArchivedAction, deleteLorePageAction } from "@/modules/creation/lore/actions";
import { toggleIdeaArchivedAction, deleteIdeaAction } from "@/modules/creation/ideas/actions";
import { toggleQuestArchivedAction, deleteQuestAction } from "@/modules/preparation/quests/actions";
import { togglePlotThreadArchivedAction, deletePlotThreadAction } from "@/modules/preparation/plot-threads/actions";
import { toggleConsequenceArchivedAction, deleteConsequenceAction } from "@/modules/preparation/consequences/actions";
import { toggleTimelineEventArchivedAction, deleteTimelineEventAction } from "@/modules/worldbuilding/timeline/actions";
import { toggleClockArchivedAction, deleteClockAction } from "@/modules/worldbuilding/clocks/actions";
import { toggleMysteryArchivedAction, deleteMysteryAction } from "@/modules/worldbuilding/mysteries/actions";
import { toggleMonsterArchivedAction, deleteMonsterAction } from "@/modules/gametools/monsters/actions";
import { toggleItemArchivedAction, deleteItemAction } from "@/modules/gametools/items/actions";
import { togglePowerArchivedAction, deletePowerAction } from "@/modules/gametools/powers/actions";
import { toggleRollTableArchivedAction, deleteRollTableAction } from "@/modules/gametools/roll-tables/actions";
import { toggleSessionPlanArchivedAction, deleteSessionPlanAction } from "@/modules/preparation/session-plans/actions";

/**
 * Content Graveyard (ver ARCHITECTURE.md, seção 18.4) não tem lógica de
 * arquivar/excluir própria — é um DESPACHANTE fino para a action que já
 * existe em cada módulo de entidade (mesmo `toggle*ArchivedAction`/`delete*Action`
 * usados nas páginas de cada tipo, seção 12.7). Isso evita duplicar a checagem
 * de permissão, a limpeza transacional de Relacionamentos e as regras de
 * exclusão segura (ex.: Local com filhos) — o Graveyard só decide QUAL action
 * chamar a partir do `type`.
 */
export async function restoreArchivedContentAction(campaignId: string, type: ContentEntityType, id: string): Promise<void> {
  switch (type) {
    case "NPC":
      return toggleNpcArchivedAction(campaignId, id);
    case "LOCATION":
      return toggleLocationArchivedAction(campaignId, id);
    case "FACTION":
      return toggleFactionArchivedAction(campaignId, id);
    case "LORE_PAGE":
      return toggleLorePageArchivedAction(campaignId, id);
    case "IDEA":
      return toggleIdeaArchivedAction(campaignId, id);
    case "QUEST":
      return toggleQuestArchivedAction(campaignId, id);
    case "PLOT_THREAD":
      return togglePlotThreadArchivedAction(campaignId, id);
    case "CONSEQUENCE":
      return toggleConsequenceArchivedAction(campaignId, id);
    case "TIMELINE_EVENT":
      return toggleTimelineEventArchivedAction(campaignId, id);
    case "NARRATIVE_CLOCK":
      return toggleClockArchivedAction(campaignId, id);
    case "MYSTERY":
      return toggleMysteryArchivedAction(campaignId, id);
    case "MONSTER":
      return toggleMonsterArchivedAction(campaignId, id);
    case "ITEM":
      return toggleItemArchivedAction(campaignId, id);
    case "POWER":
      return togglePowerArchivedAction(campaignId, id);
    case "ROLL_TABLE_GENERIC":
      return toggleRollTableArchivedAction(campaignId, "GENERIC", id);
    case "ROLL_TABLE_LOOT":
      return toggleRollTableArchivedAction(campaignId, "LOOT", id);
    case "SESSION_PLAN":
      return toggleSessionPlanArchivedAction(campaignId, id);
  }
}

/**
 * Reaproveita as actions de exclusão segura já existentes (seção 12.7) — cada
 * uma decide sozinha o que fazer (limpar Relacionamentos, bloquear Local com
 * filhos, etc.). Consequência assumida: essas actions terminam com
 * `redirect()` para a LISTA daquele tipo (não de volta ao Graveyard) — mesmo
 * comportamento que já têm quando chamadas da própria página de detalhe da
 * entidade; documentado em vez de duplicar uma variante "sem redirect" só
 * para este painel (ver ARCHITECTURE.md, seção 18.4).
 */
export async function deleteArchivedContentPermanentlyAction(
  campaignId: string,
  type: ContentEntityType,
  id: string,
): Promise<{ error?: string } | void> {
  switch (type) {
    case "NPC":
      return deleteNpcAction(campaignId, id);
    case "LOCATION":
      return deleteLocationAction(campaignId, id);
    case "FACTION":
      return deleteFactionAction(campaignId, id);
    case "LORE_PAGE":
      return deleteLorePageAction(campaignId, id);
    case "IDEA":
      return deleteIdeaAction(campaignId, id);
    case "QUEST":
      return deleteQuestAction(campaignId, id);
    case "PLOT_THREAD":
      return deletePlotThreadAction(campaignId, id);
    case "CONSEQUENCE":
      return deleteConsequenceAction(campaignId, id);
    case "TIMELINE_EVENT":
      return deleteTimelineEventAction(campaignId, id);
    case "NARRATIVE_CLOCK":
      return deleteClockAction(campaignId, id);
    case "MYSTERY":
      return deleteMysteryAction(campaignId, id);
    case "MONSTER":
      return deleteMonsterAction(campaignId, id);
    case "ITEM":
      return deleteItemAction(campaignId, id);
    case "POWER":
      return deletePowerAction(campaignId, id);
    case "ROLL_TABLE_GENERIC":
      return deleteRollTableAction(campaignId, "GENERIC", id);
    case "ROLL_TABLE_LOOT":
      return deleteRollTableAction(campaignId, "LOOT", id);
    case "SESSION_PLAN":
      return deleteSessionPlanAction(campaignId, id);
  }
}
