import type { Metadata } from "next";
import { Brain } from "lucide-react";
import { notFound } from "next/navigation";

import { requireUser } from "@/modules/core/auth/session";
import { requireCampaignAccess, CampaignAccessError } from "@/modules/core/permissions";
import { getCanonStatusBreakdown, listUnifiedRecentActivity } from "@/modules/intelligence/brain/queries";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UnifiedActivityList } from "@/components/intelligence/unified-activity-list";
import { CanonBreakdownTable } from "@/components/intelligence/canon-breakdown-table";

export const metadata: Metadata = { title: "Campaign Brain" };

interface CampaignBrainPageProps {
  params: Promise<{ campaignId: string }>;
}

export default async function CampaignBrainPage({ params }: CampaignBrainPageProps) {
  const { campaignId } = await params;
  const user = await requireUser();

  try {
    await requireCampaignAccess(user.id, campaignId);
  } catch (error) {
    if (error instanceof CampaignAccessError) notFound();
    throw error;
  }

  const [activity, canonBreakdown] = await Promise.all([
    listUnifiedRecentActivity(campaignId, 25),
    getCanonStatusBreakdown(campaignId),
  ]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-4 sm:p-8">
      <div className="flex items-center gap-2">
        <Brain className="size-5 text-primary" />
        <div>
          <h1 className="text-xl font-semibold">Campaign Brain</h1>
          <p className="text-sm text-muted-foreground">
            O que já existe na campanha, cruzado num só lugar — sem IA, só os dados que você já cadastrou.
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Canônico vs. rascunho</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <CanonBreakdownTable rows={canonBreakdown} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>O que mudou</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <UnifiedActivityList items={activity} />
        </CardContent>
      </Card>
    </div>
  );
}
