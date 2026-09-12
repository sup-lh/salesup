import { CalendarClock, CheckCircle2, Circle } from 'lucide-react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { TodayTaskItem } from '@shared/api.interface';

interface TodayTasksCardProps {
  tasks: TodayTaskItem[];
}

/** 今日任务卡：只读展示任务列表与完成状态 */
const TodayTasksCard = ({ tasks }: TodayTasksCardProps) => {
  const doneCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;
  const doneRatio =
    totalCount > 0 ? Math.round((doneCount / totalCount) * 100) : 0;

  return (
    <Card className="rounded-xl border-border bg-card shadow-sm">
      <CardHeader className="gap-3 pb-4">
        <CardTitle className="flex flex-wrap items-center justify-between gap-2 text-base font-semibold text-foreground">
          <span className="flex items-center gap-2">
            <CalendarClock className="size-4 text-primary" />
            今日任务
          </span>
          {totalCount > 0 && (
            <span className="flex items-center gap-2 text-sm">
              <span className="font-display font-semibold text-primary">
                {doneCount}/{totalCount}
              </span>
              {doneCount > 0 && (
                <span className="rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-medium text-success">
                  已完成 {doneCount} 项
                </span>
              )}
            </span>
          )}
        </CardTitle>
        {totalCount > 0 && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-accent transition-all duration-300 ease-out"
              style={{ width: `${doneRatio}%` }}
            />
          </div>
        )}
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
            <CheckCircle2 className="size-4 text-success" />
            今天没有待办任务
          </div>
        ) : (
          <ul className="space-y-2.5">
            {tasks.map((task: TodayTaskItem) => {
              const isChecked = task.completed;
              const isOverdue = task.dueDay <= 0;
              return (
                <li
                  key={task.recordId}
                  className={cn(
                    'flex items-start gap-3 rounded-lg border border-border/70 px-4 py-3 transition-all duration-200 ease-out',
                    !isChecked && '',
                    isChecked && 'border-success/40 bg-success/5',
                  )}
                >
                  {isChecked ? (
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-accent" />
                  ) : (
                    <Circle className="mt-0.5 size-4 shrink-0 text-muted-foreground/40" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        'text-sm font-medium text-foreground transition-colors duration-200',
                        isChecked && 'text-muted-foreground line-through',
                      )}
                    >
                      {task.title}
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      达标：{task.standard}
                    </div>
                    <div className="mt-1.5">
                      <Badge
                        variant="secondary"
                        className={cn(
                          'px-2 py-0 text-xs font-normal',
                          isOverdue
                            ? 'bg-destructive/10 text-destructive'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {isOverdue ? '已到截止' : `第${task.dueDay}天截止`}
                      </Badge>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default TodayTasksCard;