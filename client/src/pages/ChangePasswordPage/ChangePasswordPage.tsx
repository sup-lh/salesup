import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LockKeyhole, ArrowRight, CircleAlert, ShieldCheck } from 'lucide-react';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { getApiErrorMessage } from '@/utils/api-error';

export default function ChangePasswordPage() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  if (!user) return null;
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (newPassword !== confirmPassword) { setError('两次输入的新密码不一致'); return; }
    setSaving(true); setError('');
    try { await changePassword(currentPassword || undefined, newPassword); navigate('/', { replace: true }); }
    catch (err) { setError(getApiErrorMessage(err, '修改密码失败')); }
    finally { setSaving(false); }
  };
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <form
        onSubmit={submit}
        className="w-full max-w-md space-y-7 rounded-xl border bg-card p-6 shadow-sm sm:p-8"
        aria-label="修改密码"
        aria-busy={saving}
      >
        <div>
          <div className="mb-5 flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
              <LockKeyhole className="size-5" />
            </div>
            <div className="flex items-center gap-1.5 text-xs font-medium text-success">
              <ShieldCheck className="size-4" />
              账号安全验证
            </div>
          </div>
          <h1 className="font-display text-2xl font-semibold">首次登录，请修改密码</h1>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">为保护账号安全，请设置仅你本人知晓的新密码。</p>
        </div>
        <div className="space-y-5">
          <div className="space-y-2.5">
            <Label htmlFor="current-password">当前密码</Label>
            <PasswordInput
              id="current-password"
              autoComplete="current-password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              placeholder="请输入当前密码"
              required
              autoFocus
            />
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="new-password">新密码</Label>
            <PasswordInput
              id="new-password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              placeholder="请输入新密码"
              minLength={10}
              required
            />
            <p className="text-xs leading-5 text-muted-foreground">至少 10 位，同时包含字母和数字</p>
          </div>
          <div className="space-y-2.5">
            <Label htmlFor="confirm-password">确认新密码</Label>
            <PasswordInput
              id="confirm-password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="再次输入新密码"
              minLength={10}
              required
            />
          </div>
        </div>
        {error ? (
          <Alert variant="destructive">
            <CircleAlert />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? '保存中...' : '保存并进入系统'}
          {!saving && <ArrowRight />}
        </Button>
      </form>
    </main>
  );
}
