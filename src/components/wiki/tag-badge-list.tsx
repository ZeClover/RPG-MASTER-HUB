import Link from "next/link";

import { Badge } from "@/components/ui/badge";

interface TagBadgeListProps {
  tags: { id: string; name: string; slug: string; color: string | null }[];
  campaignId: string;
  linkBasePath?: string;
}

/** Mostra as tags de uma entidade; cada uma linka para a lista filtrada por essa tag. */
export function TagBadgeList({ tags, campaignId, linkBasePath }: TagBadgeListProps) {
  if (tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <Link key={tag.id} href={linkBasePath ? `${linkBasePath}?tag=${tag.slug}` : `/campaigns/${campaignId}/tags`}>
          <Badge
            variant="secondary"
            style={tag.color ? { borderColor: tag.color, color: tag.color } : undefined}
            className="border hover:opacity-80"
          >
            {tag.name}
          </Badge>
        </Link>
      ))}
    </div>
  );
}
