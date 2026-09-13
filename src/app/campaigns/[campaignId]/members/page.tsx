import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Users } from "lucide-react";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { listCampaignMembers } from "@/modules/players/members/queries";
import { AddMemberForm } from "@/components/players/add-member-form";
import { MemberList } from "@/components/players/member-list";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = { title: "Membros" };

interface MembersPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function MembersPage({ params }: MembersPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  let role;
  try {
    ({ role } = await requireCampaignAccess(user.id, campaignId, "CO_GM"));
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const members = await listCampaignMembers(campaignId);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Users className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Membros</h1>
          <p className="text-sm text-muted-foreground">
            Quem tem acesso a esta campanha e com qual papel — OWNER &gt; CO_GM &gt; PLAYER.
          </p>
        </div>
      </div>

      {role === "OWNER" && (
        <Card>
          <CardHeader>
            <CardTitle>Adicionar membro</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <AddMemberForm campaignId={campaignId} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>{members.length} {members.length === 1 ? "membro" : "membros"}</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {role === "OWNER" ? (
            <MemberList members={members} campaignId={campaignId} currentUserId={user.id} />
          ) : (
            <ul className="flex flex-col gap-2">
              {members.map((member) => (
                <li key={member.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
                  <span className="truncate">{member.user.name ?? member.user.email}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {member.role === "OWNER" ? "Mestre (dona)" : member.role === "CO_GM" ? "Co-Mestre" : "Jogador"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {role !== "OWNER" && (
        <p className="text-xs text-muted-foreground">
          Só a Mestre (dona) da campanha pode adicionar, promover ou remover membros.
        </p>
      )}
    </div>
  );
}
