import { z } from "zod";

/**
 * Perspectiva relativa ao NPC a partir de quem o formulário é aberto — mais
 * amigável para o mestre do que escolher `npcA`/`npcB` diretamente. A action
 * traduz isto para (`npcAId`, `npcBId`, `relationType`) antes de gravar.
 */
export const familyRelationFormSchema = z.object({
  perspective: z.enum(["PARENT_OF_FORWARD", "PARENT_OF_BACKWARD", "SPOUSE_OF", "SIBLING_OF"], {
    error: "Escolha o tipo de parentesco.",
  }),
  otherNpcId: z.string().min(1, { error: "Selecione o outro NPC." }),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export type FamilyRelationFormInput = z.infer<typeof familyRelationFormSchema>;
