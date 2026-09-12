"use client";

import { useState } from "react";

import { archiveCampaignAction } from "@/modules/core/campaigns/actions";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ArchiveCampaignButton({ campaignId, campaignName }: { campaignId: string; campaignName: string }) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive">Arquivar campanha</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Arquivar &ldquo;{campaignName}&rdquo;?</DialogTitle>
          <DialogDescription>
            A campanha sai da sua lista principal, mas nada é apagado — você pode desarquivá-la quando
            quiser.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <form action={archiveCampaignAction.bind(null, campaignId)}>
            <Button type="submit" variant="destructive" className="w-full">
              Arquivar
            </Button>
          </form>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
