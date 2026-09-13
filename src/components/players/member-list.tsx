import type { CampaignMemberRow } from "@/modules/players/members/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MemberRoleSelect } from "@/components/players/member-role-select";
import { RemoveMemberButton } from "@/components/players/remove-member-button";

const ROLE_LABEL: Record<CampaignMemberRow["role"], string> = {
  OWNER: "Mestre (dona)",
  CO_GM: "Co-Mestre",
  PLAYER: "Jogador",
};

function MemberRow({
  member,
  campaignId,
  currentUserId,
}: {
  member: CampaignMemberRow;
  campaignId: string;
  currentUserId: string;
}) {
  const { user } = member;
  const initials = (user.name ?? user.email).trim().charAt(0).toUpperCase();
  const label = user.name ?? user.email;
  const isSelf = user.id === currentUserId;

  return (
    <li className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
      <Avatar>
        {user.image ? <AvatarImage src={user.image} alt={label} /> : null}
        <AvatarFallback>{initials}</AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {label} {isSelf && <span className="text-muted-foreground">(você)</span>}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user.email}</p>
      </div>

      {member.role === "OWNER" ? (
        <Badge variant="secondary">{ROLE_LABEL.OWNER}</Badge>
      ) : (
        <div className="flex shrink-0 items-center gap-1">
          <MemberRoleSelect campaignId={campaignId} memberId={member.id} role={member.role} />
          <RemoveMemberButton campaignId={campaignId} memberId={member.id} memberLabel={label} />
        </div>
      )}
    </li>
  );
}

export function MemberList({
  members,
  campaignId,
  currentUserId,
}: {
  members: CampaignMemberRow[];
  campaignId: string;
  currentUserId: string;
}) {
  return (
    <ul className="flex flex-col gap-2">
      {members.map((member) => (
        <MemberRow key={member.id} member={member} campaignId={campaignId} currentUserId={currentUserId} />
      ))}
    </ul>
  );
}
