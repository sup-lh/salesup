import { useEffect, useState } from 'react';
import { UserRound } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { listUsersByIds } from '@client/src/components/business-ui/api/users/service';

interface UserDisplayProps { userId?: string; user_id?: string; size?: 'small' | 'medium' | 'large'; className?: string }

export function UserDisplay({ userId, user_id, size = 'medium', className }: UserDisplayProps) {
  const id = userId ?? user_id;
  const [user, setUser] = useState<{ name: string; avatar?: string } | null>(null);
  useEffect(() => {
    if (!id) return;
    let active = true;
    void listUsersByIds([id]).then((response) => {
      const item = response.data.userInfoMap[id];
      if (active) setUser(item ? { name: item.name.zh_cn, avatar: item.avatar?.image.large } : null);
    });
    return () => { active = false; };
  }, [id]);
  if (!id) return null;
  const avatarSize = size === 'small' ? 'size-5' : size === 'large' ? 'size-8' : 'size-6';
  return <span className={`inline-flex items-center gap-2 ${className ?? ''}`}><Avatar className={avatarSize}><AvatarImage src={user?.avatar} alt="" /><AvatarFallback><UserRound className="size-3" /></AvatarFallback></Avatar><span>{user?.name ?? '未知用户'}</span></span>;
}
