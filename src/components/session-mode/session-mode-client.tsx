"use client";

import { useRouter } from "next/navigation";
import type { CombatEncounter, Combatant, SessionLogEntry } from "@/generated/prisma/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SessionLogPanel } from "@/components/session-mode/session-log-panel";
import { CombatTrackerPanel } from "@/components/session-mode/combat-tracker-panel";
import { QuickNpcDialog } from "@/components/session-mode/quick-npc-dialog";
import { PanicButton } from "@/components/session-mode/panic-button";

interface SessionModeClientProps {
  campaignId: string;
  sessionPlanId?: string;
  sessionPlans: { id: string; title: string; sessionNumber: number | null }[];
  initialLogEntries: SessionLogEntry[];
  initialEncounter: (CombatEncounter & { combatants: Combatant[] }) | null;
}

export function SessionModeClient({
  campaignId,
  sessionPlanId,
  sessionPlans,
  initialLogEntries,
  initialEncounter,
}: SessionModeClientProps) {
  const router = useRouter();

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold">Modo Sessão</h1>
          <p className="text-sm text-muted-foreground">
            Dados, registro e combate — continua funcionando mesmo se a conexão cair.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <QuickNpcDialog
            campaignId={campaignId}
            onCreated={(npc) => {
              window.dispatchEvent(new CustomEvent("session-mode:npc-created", { detail: npc }));
            }}
          />
          <PanicButton />
        </div>
      </div>

      {sessionPlans.length > 0 && (
        <Select
          value={sessionPlanId ?? "__none__"}
          onValueChange={(value) => {
            const params = new URLSearchParams();
            if (value !== "__none__") params.set("plan", value);
            router.push(`/campaigns/${campaignId}/session${params.toString() ? `?${params}` : ""}`);
          }}
        >
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Sessão livre (sem plano vinculado)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none__">Sessão livre (sem plano vinculado)</SelectItem>
            {sessionPlans.map((plan) => (
              <SelectItem key={plan.id} value={plan.id}>
                {plan.sessionNumber ? `Sessão ${plan.sessionNumber} — ${plan.title}` : plan.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <CombatTrackerPanel campaignId={campaignId} sessionPlanId={sessionPlanId} initialEncounter={initialEncounter} />
      <SessionLogPanel campaignId={campaignId} sessionPlanId={sessionPlanId} initialEntries={initialLogEntries} />
    </div>
  );
}
