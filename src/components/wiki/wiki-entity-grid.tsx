import { WikiEntityCard, type WikiEntitySummary } from "@/components/wiki/wiki-entity-card";

export function WikiEntityGrid({ entities }: { entities: WikiEntitySummary[] }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {entities.map((entity) => (
        <WikiEntityCard key={entity.id} entity={entity} />
      ))}
    </div>
  );
}
