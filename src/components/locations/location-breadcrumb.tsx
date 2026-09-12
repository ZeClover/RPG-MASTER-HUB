import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function LocationBreadcrumb({
  campaignId,
  chain,
}: {
  campaignId: string;
  chain: { id: string; name: string }[];
}) {
  if (chain.length <= 1) return null;

  return (
    <nav aria-label="Hierarquia do local" className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
      {chain.map((location, index) => (
        <span key={location.id} className="flex items-center gap-1">
          {index > 0 && <ChevronRight className="size-3.5" />}
          {index === chain.length - 1 ? (
            <span className="font-medium text-foreground">{location.name}</span>
          ) : (
            <Link href={`/campaigns/${campaignId}/locations/${location.id}`} className="hover:underline">
              {location.name}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
