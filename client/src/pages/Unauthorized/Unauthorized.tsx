import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

const Unauthorized = () => {
  return (
    <div className="mx-auto flex w-full max-w-6xl items-center justify-center p-6">
      <Card className="w-full max-w-md rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <ShieldAlert className="size-4 text-primary" />
            暂无访问权限
          </CardTitle>
          <CardDescription>
            当前页面仅对「成长管理员」开放，如需查看请联系管理员在角色面板中为您分配对应角色。
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <Link to="/">返回成长工作台</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Unauthorized;
