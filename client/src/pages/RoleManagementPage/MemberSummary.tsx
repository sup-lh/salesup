import { UserRound } from 'lucide-react';
import { Badge } from '@client/src/components/ui/badge';
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@client/src/components/ui/hover-card';
import type { ForceRoleDTO, UserSimpleDTO } from '@shared/api.interface';

const MAX_DISPLAY = 3;

function MemberBadge({ user }: { user: UserSimpleDTO }) {
  return <Badge variant="secondary" className="gap-1 font-normal"><UserRound className="size-3" />{user.name?.zh_cn ?? user.email ?? user.userID ?? '未知用户'}</Badge>;
}

export function MemberSummary({ role }: { role: ForceRoleDTO }) {
  const members = role.roleMembers?.userList ?? [];
  if (members.length === 0) return <span className="text-muted-foreground">--</span>;
  const visible = members.slice(0, MAX_DISPLAY);
  const overflow = members.slice(MAX_DISPLAY);
  return (
    <div className="flex flex-wrap gap-1">
      {visible.map((user) => <MemberBadge key={user.userID} user={user} />)}
      {overflow.length > 0 ? (
        <HoverCard openDelay={200} closeDelay={100}>
          <HoverCardTrigger asChild><Badge variant="outline" className="cursor-pointer">+{overflow.length}</Badge></HoverCardTrigger>
          <HoverCardContent className="flex w-auto max-w-[360px] flex-wrap gap-1 p-2">{overflow.map((user) => <MemberBadge key={user.userID} user={user} />)}</HoverCardContent>
        </HoverCard>
      ) : null}
    </div>
  );
}
