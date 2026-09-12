import { useEffect, useState } from 'react';
import { Search, UserRound, X } from 'lucide-react';
import { toast } from 'sonner';
import { addRoleMembers, clearRoleMembers, searchMembers } from '@client/src/api/roleManager';
import type { ForceRoleDTO, UserSimpleDTO } from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@client/src/components/ui/dialog';

interface EditMembersDialogProps { role: ForceRoleDTO | null; open: boolean; onOpenChange: (open: boolean) => void; onSuccess: () => void; }

export function EditMembersDialog({ role, open, onOpenChange, onSuccess }: EditMembersDialogProps) {
  const [selected, setSelected] = useState<UserSimpleDTO[]>([]);
  const [results, setResults] = useState<UserSimpleDTO[]>([]);
  const [query, setQuery] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open || !role) return;
    setSelected((role.roleMembers?.userList ?? []).filter((user) => Boolean(user.userID)));
    setResults([]); setQuery(''); setSaving(false);
  }, [open, role]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => {
      void searchMembers({ query, page: 1, pageSize: 20 }).then((response) => setResults(((response as unknown as { users?: UserSimpleDTO[] }).users ?? []))).catch(() => setResults([]));
    }, 250);
    return () => window.clearTimeout(timer);
  }, [open, query]);

  const add = (user: UserSimpleDTO) => {
    const id = user.userID;
    if (id && !selected.some((item) => item.userID === id)) setSelected([...selected, user]);
    setQuery('');
  };
  const remove = (id: string) => setSelected(selected.filter((user) => user.userID !== id));
  const save = async () => {
    if (!role?.bizID) return;
    setSaving(true);
    try {
      await clearRoleMembers(role.bizID);
      const userList = selected.map((user) => ({ userID: user.userID })).filter((user): user is { userID: string } => Boolean(user.userID));
      if (userList.length) await addRoleMembers(role.bizID, { members: { userList } });
      toast.success('角色成员已更新'); onOpenChange(false); onSuccess();
    } catch (error) { toast.error(error instanceof Error ? error.message : '保存角色成员失败'); }
    finally { setSaving(false); }
  };

  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent><DialogHeader><DialogTitle>编辑成员 - {role?.name}</DialogTitle><DialogDescription>角色成员仅支持本地账号，不再关联飞书部门或群聊。</DialogDescription></DialogHeader><div className="space-y-4"><div className="relative"><div className="flex items-center gap-2"><Search className="size-4 text-muted-foreground" /><Input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索姓名、邮箱或用户 ID" /></div>{query && results.length > 0 && <div className="absolute z-10 mt-1 w-full rounded-md border bg-popover p-1 shadow-md">{results.map((user) => { const id = user.userID ?? ''; return <button key={id} type="button" className="flex w-full items-center gap-2 rounded px-2 py-2 text-left text-sm hover:bg-muted" onClick={() => add(user)}><UserRound className="size-4 text-muted-foreground" /><span>{user.name?.zh_cn ?? user.name?.en_us ?? id}</span><span className="ml-auto text-xs text-muted-foreground">{user.email ?? ''}</span></button>; })}</div>}</div><div className="space-y-2"><div className="text-sm font-medium">已选成员（{selected.length}）</div>{selected.map((user) => { const id = user.userID ?? ''; return <div key={id} className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm"><UserRound className="size-4 text-primary" /><span>{user.name?.zh_cn ?? user.name?.en_us ?? id}</span><span className="text-xs text-muted-foreground">{user.email ?? ''}</span><Button variant="ghost" size="icon" className="ml-auto size-7" title="移除成员" onClick={() => remove(id)}><X className="size-4" /></Button></div>; })}{selected.length === 0 && <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">暂未选择成员</p>}</div></div><DialogFooter><Button variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>取消</Button><Button disabled={saving} onClick={() => void save()}>{saving ? '保存中…' : '保存'}</Button></DialogFooter></DialogContent></Dialog>;
}
