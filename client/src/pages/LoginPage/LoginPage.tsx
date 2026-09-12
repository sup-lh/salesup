import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, CircleAlert, UserRound } from 'lucide-react';

import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';
import { Label } from '@/components/ui/label';
import { PasswordInput } from '@/components/ui/password-input';
import { getApiErrorMessage } from '@/utils/api-error';

export default function LoginPage() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (user) return <Navigate to="/" replace />;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(username, password);
      const from = (location.state as { from?: string } | null)?.from ?? '/';
      navigate(from, { replace: true });
    } catch (loginError) {
      setError(getApiErrorMessage(loginError, '登录失败，请检查用户名和密码'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[minmax(360px,0.88fr)_minmax(500px,1.12fr)]">
      <section className="relative hidden overflow-hidden bg-[hsl(220_25%_12%)] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-primary via-primary to-accent" />
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-lg bg-primary text-lg font-bold shadow-lg shadow-primary/20">S</div>
          <div>
            <p className="font-display font-semibold">SalesUp</p>
            <p className="text-sm text-white/55">新人成长系统</p>
          </div>
        </div>
        <div className="max-w-md">
          <p className="mb-4 text-sm font-medium text-orange-300">成长从清晰的每一步开始</p>
          <h1 className="font-display text-4xl font-semibold leading-tight">让新人培养有节奏，<br />让每次进步被看见。</h1>
          <div className="mt-8 h-1 w-20 rounded-full bg-orange-400" />
        </div>
        <p className="text-xs text-white/40">独立部署版</p>
      </section>
      <section className="flex items-center justify-center px-6 py-10 sm:px-10">
        <form
          onSubmit={submit}
          className="w-full max-w-sm space-y-7"
          aria-label="账号登录"
          aria-busy={submitting}
        >
          <div className="mb-10 lg:hidden">
            <span className="font-display text-xl font-semibold">SalesUp</span>
            <p className="text-sm text-muted-foreground">新人成长系统</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-medium text-primary">欢迎回来</p>
            <h2 className="font-display text-3xl font-semibold text-foreground">登录工作台</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">使用系统管理员分配的账号继续</p>
          </div>
          <div className="space-y-5">
            <div className="space-y-2.5">
              <Label htmlFor="username">用户名</Label>
              <InputGroup>
                <InputGroupAddon aria-hidden="true"><UserRound /></InputGroupAddon>
                <InputGroupInput
                  id="username"
                  autoComplete="username"
                  value={username}
                  onChange={(event) => setUsername(event.target.value)}
                  className="px-1"
                  placeholder="请输入用户名"
                  required
                  autoFocus
                />
              </InputGroup>
            </div>
            <div className="space-y-2.5">
              <Label htmlFor="password">密码</Label>
              <PasswordInput
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="请输入密码"
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
          <Button type="submit" size="lg" className="w-full" disabled={submitting}>
            {submitting ? '正在登录...' : '进入工作台'}
            {!submitting && <ArrowRight />}
          </Button>
        </form>
      </section>
    </main>
  );
}
