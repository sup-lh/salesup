import { CheckCircle2 } from 'lucide-react';
import dayjs from 'dayjs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type { ChallengeTaskItem } from '@shared/api.interface';

interface TaskCardProps {
  task: ChallengeTaskItem;
  stageUnlocked: boolean;
  checking: boolean;
  onCheckin: (recordId: string) => void;
}

/** 闯关任务卡：四态（待办/已完成/打卡中/锁定） */
const TaskCard = ({
  task,
  stageUnlocked,
  checking,
  onCheckin,
}: TaskCardProps) => {
  return (
    <Card
      className={cn(
        'rounded-xl border-border shadow-sm transition-colors duration-200',
        task.completed && 'border-success/30',
      )}
    >
      <CardContent className="flex h-full flex-col gap-3 p-6">
        <div className="flex items-start justify-between gap-3">
          <div
            className={cn(
              'text-sm font-semibold leading-snug text-foreground',
              task.completed && 'text-muted-foreground',
            )}
          >
            {task.title}
          </div>
          {task.completed && (
            <CheckCircle2 className="size-5 shrink-0 text-success" />
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{task.category}</Badge>
          {task.unlockNextStage && (
            <Badge className="border-accent/40 bg-accent/10 font-display text-xs font-semibold text-accent">
              解锁任务
            </Badge>
          )}
          <span className="text-xs text-muted-foreground">
            截止 第{task.dueDay}天
          </span>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          达标标准：{task.standard}
        </p>
        <div className="mt-auto pt-2">
          {task.completed ? (
            <span className="text-xs text-success">
              {task.completedAt
                ? `完成于 ${dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')}`
                : '已完成'}
            </span>
          ) : stageUnlocked ? (
            <Button
              size="sm"
              className="bg-accent text-white hover:bg-accent/90"
              disabled={checking}
              onClick={() => onCheckin(task.recordId)}
            >
              {checking ? <Spinner className="size-4" /> : null}
              完成打卡
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
};

export default TaskCard;
