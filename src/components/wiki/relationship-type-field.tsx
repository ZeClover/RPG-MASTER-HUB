import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RELATIONSHIP_TYPE_SUGGESTIONS } from "@/modules/creation/relationships/config";

export function RelationshipTypeField() {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="relationship-type">Tipo de relação</Label>
      <Input
        id="relationship-type"
        name="type"
        list="relationship-type-suggestions"
        placeholder="Ex: pertence a, odeia, mora em…"
        required
      />
      <datalist id="relationship-type-suggestions">
        {RELATIONSHIP_TYPE_SUGGESTIONS.map((suggestion) => (
          <option key={suggestion} value={suggestion} />
        ))}
      </datalist>
    </div>
  );
}
