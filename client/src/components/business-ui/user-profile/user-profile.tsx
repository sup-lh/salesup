import { useEffect, useState } from 'react';
import { Mail, UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { fetchUserProfile, type UserProfileData } from '@client/src/components/business-ui/api/user-profiles/service';
import type { UserInput } from '@client/src/components/business-ui/types/user';

interface UserProfileProps {
  value?: string | UserInput;
  userId?: string;
  user_id?: string;
  accountType?: string;
}

export function UserProfile({ value, userId, user_id }: UserProfileProps) {
  const valueObject = typeof value === 'object' && value ? value as { user_id?: string; userId?: string } : undefined;
  const resolvedId = (typeof value === 'string' ? value : valueObject?.user_id ?? valueObject?.userId) ?? user_id ?? userId;
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!resolvedId) { setLoading(false); return; }
    let active = true;
    setLoading(true);
    void fetchUserProfile(resolvedId).then((result) => {
      if (active) setProfile(result.userProfileInfo);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [resolvedId]);

  if (loading) return <div className="space-y-3 p-4"><Skeleton className="h-10 w-10 rounded-full" /><Skeleton className="h-4 w-32" /></div>;
  if (!profile?.name) return <p className="p-4 text-sm text-muted-foreground">未找到用户信息</p>;

  return (
    <div className="flex items-start gap-3 p-4">
      <Avatar className="size-10"><AvatarImage src={profile.avatar} alt={profile.name} /><AvatarFallback><UserRound className="size-4" /></AvatarFallback></Avatar>
      <div className="min-w-0"><p className="font-medium">{profile.name}</p>{profile.email ? <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground"><Mail className="size-3" />{profile.email}</p> : null}</div>
    </div>
  );
}
