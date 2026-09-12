import { Award, CircleAlert } from 'lucide-react';
import dayjs from 'dayjs';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { PassStatusItem } from '@shared/api.interface';

interface PassStatusCardProps {
  passStatus: PassStatusItem[];
}

/** 通关状态卡：圆形徽章点亮 + 通过日期 */
const PassStatusCard = ({ passStatus }: PassStatusCardProps) => {
  const hasBlocked = passStatus.some((item: PassStatusItem) => !item.passed);
  const passedCount = passStatus.filter(
    (item: PassStatusItem) => item.passed,
  ).length;

  return (
    <Card className="rounded-xl border-border bg-card shadow-sm">
      <CardHeader className="flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Award className="size-4 text-gold" />
          通关状态
        </CardTitle>
        <span className="text-xs font-medium text-muted-foreground">
          {passedCount}/{passStatus.length} 已点亮
        </span>
      </CardHeader>
      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {passStatus.map((item: PassStatusItem) => (
            <li
              key={item.key}
              className={cn(
                'flex items-center gap-3 rounded-lg px-2 py-2 transition-colors duration-200',
                item.passed ? 'bg-gold/[0.06]' : 'bg-muted/40',
              )}
            >
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full transition-all duration-200 ease-out',
                  item.passed
                    ? 'bg-gold/15 text-gold ring-1 ring-gold/30'
                    : 'bg-muted text-muted-foreground/50',
                )}
              >
                <Award className="size-4" />
              </span>
              <span
                className={cn(
                  'flex-1 text-sm',
                  item.passed
                    ? 'font-medium text-foreground'
                    : 'text-muted-foreground',
                )}
              >
                {item.label}
              </span>
              {item.passed ? (
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  {item.passedAt
                    ? `${dayjs(item.passedAt).format('MM-DD')} 通过`
                    : '已通过'}
                </span>
              ) : (
                <span className="text-xs text-muted-foreground">未通过</span>
              )}
            </li>
          ))}
        </ul>
        {hasBlocked && (
          <div className="flex items-start gap-2 rounded-lg bg-destructive/5 px-3 py-2 text-xs leading-relaxed text-destructive">
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" />
            先通关、后实战，未通过不进入独立客户触达
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PassStatusCard;
