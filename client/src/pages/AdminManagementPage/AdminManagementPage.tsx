import { useEffect, useState } from 'react';
import { KeyRound, Pencil, Plus, Search, Shield, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { listAdminUsers, createAdminUser, updateAdminUser, resetAdminUserPassword, type AdminUser } from '@client/src/api/adminUsers';
import { addRoleMembers, clearRoleMembers, getRoles, listRoleMembers } from '@client/src/api/roleManager';
import type { ForceRoleDTO } from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@client/src/components/ui/input-group';
import { Label } from '@client/src/components/ui/label';
import { PasswordInput } from '@client/src/components/ui/password-input';
import { Badge } from '@client/src/components/ui/badge';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Checkbox } from '@client/src/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@client/src/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@client/src/components/ui/table';

type DialogMode = 'create' | 'edit' | 'reset' | null;
const emptyForm = { username: '', displayName: '', email: '', password: '' };

function dateLabel(value: string | null) {
  return value ? new Date(value).toLocaleString('zh-CN', { dateStyle: 'medium', timeStyle: 'short' }) : '从未登录';
}

export default function AdminManagementPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [roles, setRoles] = useState<ForceRoleDTO[]>([]);
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<DialogMode>(null);
  const [target, setTarget] = useState<AdminUser | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const [userRows, roleRows] = await Promise.all([listAdminUsers(query), getRoles()]);
      setUsers(userRows);
      setRoles(roleRows);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '加载账号列表失败');
    } finally { setLoading(false); }
  };
  useEffect(() => { void load(); }, [query]);
  const hasRole = (userId: string, role: ForceRoleDTO) => Boolean(role.roleMembers?.userList?.some((member) => member.userID === userId));
  const close = () => { if (!saving) setMode(null); };
  const openCreate = () => { setTarget(null); setForm(emptyForm); setMode('create'); };
  const openEdit = (user: AdminUser) => { setTarget(user); setForm({ username: user.username, displayName: user.displayName, email: user.email ?? '', password: '' }); setMode('edit'); };
  const openReset = (user: AdminUser) => { setTarget(user); setForm(emptyForm); setMode('reset'); };

  const submit = async () => {
    setSaving(true);
    try {
      if (mode === 'create') {
        if (!form.username.trim() || !form.displayName.trim() || !form.password) throw new Error('请填写用户名、显示名称和初始密码');
        await createAdminUser({ username: form.username, displayName: form.displayName, email: form.email || undefined, password: form.password, roleKeys: ['newcomer'] });
        toast.success('账号已创建');
      } else if (mode === 'edit' && target) {
        await updateAdminUser(target.id, { displayName: form.displayName, email: form.email });
        toast.success('账号信息已更新');
      } else if (mode === 'reset' && target) {
        if (!form.password) throw new Error('请输入新密码');
        await resetAdminUserPassword(target.id, form.password);
        toast.success('密码已重置');
      }
      setMode(null); await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : '保存失败'); }
    finally { setSaving(false); }
  };

  const toggleStatus = async (user: AdminUser) => {
    try { await updateAdminUser(user.id, { status: user.status === 'active' ? 'disabled' : 'active' }); toast.success(user.status === 'active' ? '账号已停用' : '账号已启用'); await load(); }
    catch (error) { toast.error(error instanceof Error ? error.message : '更新账号状态失败'); }
  };

  const toggleRole = async (user: AdminUser, role: ForceRoleDTO, checked: boolean) => {
    try {
      const current = await listRoleMembers(role.bizID, { page: 1, pageSize: 1000 });
      const ids = (current.members.userList ?? []).map((member) => member.userID).filter((id): id is string => Boolean(id));
      const next = checked ? [...new Set([...ids, user.id])] : ids.filter((id) => id !== user.id);
      await clearRoleMembers(role.bizID);
      if (next.length) await addRoleMembers(role.bizID, { members: { userList: next.map((userID) => ({ userID })) } });
      await load();
    } catch (error) { toast.error(error instanceof Error ? error.message : '更新角色失败'); }
  };

  return <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
    <div className="flex flex-wrap items-start justify-between gap-4"><div><div className="flex items-center gap-2"><Shield className="size-6 text-primary" /><h1 className="text-2xl font-semibold">本地账号管理</h1></div><p className="mt-1 text-sm text-muted-foreground">管理员创建账号并分配角色，数据保存在本地 PostgreSQL。</p></div><Button onClick={openCreate}><Plus className="size-4" />创建账号</Button></div>
    <InputGroup className="max-w-md">
      <InputGroupAddon aria-hidden="true"><Search /></InputGroupAddon>
      <InputGroupInput value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索用户名、姓名或邮箱" className="px-1" />
    </InputGroup>
    <div className="rounded-xl border bg-card p-4 shadow-sm">{loading ? <div className="space-y-3 p-2">{Array.from({ length: 5 }).map((_, index) => <Skeleton key={index} className="h-12 w-full" />)}</div> : <Table><TableHeader><TableRow><TableHead>用户</TableHead><TableHead>状态</TableHead><TableHead>最近登录</TableHead><TableHead className="text-right">操作</TableHead></TableRow></TableHeader><TableBody>{users.map((user) => <TableRow key={user.id}><TableCell><div className="font-medium">{user.displayName}</div><div className="text-xs text-muted-foreground">{user.username}{user.email ? ` · ${user.email}` : ''}</div></TableCell><TableCell><Badge variant={user.status === 'active' ? 'secondary' : 'outline'}>{user.status === 'active' ? '启用' : '停用'}</Badge>{user.mustChangePassword && <Badge className="ml-1" variant="outline">待改密</Badge>}</TableCell><TableCell className="text-sm text-muted-foreground">{dateLabel(user.lastLoginAt)}</TableCell><TableCell><div className="flex justify-end gap-1"><Button variant="ghost" size="icon" title="编辑账号" onClick={() => openEdit(user)}><Pencil className="size-4" /></Button><Button variant="ghost" size="icon" title="重置密码" onClick={() => openReset(user)}><KeyRound className="size-4" /></Button><Button variant="ghost" size="icon" title={user.status === 'active' ? '停用账号' : '启用账号'} onClick={() => void toggleStatus(user)}>{user.status === 'active' ? <UserX className="size-4 text-destructive" /> : <UserCheck className="size-4 text-success" />}</Button></div></TableCell></TableRow>)}{users.length === 0 && <TableRow><TableCell colSpan={4} className="h-24 text-center text-muted-foreground">暂无账号</TableCell></TableRow>}</TableBody></Table>}</div>
    <div className="rounded-xl border bg-card p-4 shadow-sm"><h2 className="mb-1 text-base font-semibold">角色分配</h2><p className="mb-4 text-sm text-muted-foreground">勾选后角色权限立即生效。</p>{users.map((user) => <div key={user.id} className="flex flex-wrap items-center gap-4 border-t py-3 first:border-t-0"><div className="w-40 text-sm font-medium">{user.displayName}<div className="text-xs text-muted-foreground">{user.username}</div></div>{roles.map((role) => <label key={role.bizID} className="flex items-center gap-2 text-sm"><Checkbox checked={hasRole(user.id, role)} onCheckedChange={(value) => void toggleRole(user, role, Boolean(value))} />{role.name}</label>)}</div>)}</div>
    <Dialog open={mode !== null} onOpenChange={(open) => !open && close()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{mode === 'create' ? '创建账号' : mode === 'edit' ? '编辑账号' : '重置密码'}</DialogTitle>
          <DialogDescription>
            {mode === 'create' ? '创建本地登录账号，新账号首次登录时需修改初始密码。' : mode === 'reset' ? `为 ${target?.displayName ?? ''} 设置新的初始密码。` : '更新账号的显示名称与联系邮箱。'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={(event) => { event.preventDefault(); void submit(); }} className="space-y-5">
          {mode === 'create' ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="account-username">用户名 <span className="text-destructive">*</span></Label>
                <Input id="account-username" autoComplete="off" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value })} placeholder="如 demo-zhang-yue" autoFocus />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="account-name">显示名称 <span className="text-destructive">*</span></Label>
                <Input id="account-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} placeholder="如 张悦" />
              </div>
              <div className="space-y-2.5 sm:col-span-2">
                <Label htmlFor="account-email">邮箱</Label>
                <Input id="account-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@company.com" />
              </div>
            </div>
          ) : null}
          {mode === 'edit' ? (
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5">
                <Label htmlFor="account-name">显示名称 <span className="text-destructive">*</span></Label>
                <Input id="account-name" value={form.displayName} onChange={(event) => setForm({ ...form, displayName: event.target.value })} autoFocus />
              </div>
              <div className="space-y-2.5">
                <Label htmlFor="account-email">邮箱</Label>
                <Input id="account-email" type="email" autoComplete="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="name@company.com" />
              </div>
            </div>
          ) : null}
          {mode === 'create' || mode === 'reset' ? (
            <div className="space-y-2.5">
              <Label htmlFor="account-password">{mode === 'create' ? '初始密码' : '新密码'} <span className="text-destructive">*</span></Label>
              <PasswordInput id="account-password" autoComplete="new-password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="至少 10 位，含字母和数字" autoFocus={mode === 'reset'} />
              <p className="text-xs leading-5 text-muted-foreground">用户下次登录后将被要求设置个人密码。</p>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={close}>取消</Button>
            <Button type="submit" disabled={saving}>{saving ? '保存中…' : '确认保存'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  </div>;
}
