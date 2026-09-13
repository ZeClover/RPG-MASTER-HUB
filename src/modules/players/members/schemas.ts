import { z } from "zod";

// OWNER nunca é um valor válido aqui — a campanha sempre tem exatamente um
// OWNER (o criador dela), e este formulário só adiciona/reclassifica
// Co-Mestres e Jogadores (ver ARCHITECTURE.md, seção 21.1).
export const addMemberFormSchema = z.object({
  email: z.email({ error: "Informe um e-mail válido." }),
  role: z.enum(["CO_GM", "PLAYER"], { error: "Escolha um papel." }),
});

export type AddMemberFormInput = z.infer<typeof addMemberFormSchema>;

export const memberRoleSchema = z.enum(["CO_GM", "PLAYER"]);
