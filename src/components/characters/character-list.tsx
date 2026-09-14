import { CharacterCard } from "@/components/characters/character-card";

interface CharacterListProps {
  campaignId: string;
  currentUserId: string;
  characters: {
    id: string;
    name: string;
    concept: string | null;
    imageUrl: string | null;
    player: { id: string; name: string | null; email: string };
  }[];
}

export function CharacterList({ campaignId, currentUserId, characters }: CharacterListProps) {
  if (characters.length === 0) {
    return <p className="text-sm text-muted-foreground">Nenhuma ficha criada ainda.</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {characters.map((character) => (
        <CharacterCard key={character.id} campaignId={campaignId} character={character} currentUserId={currentUserId} />
      ))}
    </div>
  );
}
