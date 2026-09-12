import { Award, CheckCircle2, Clock, Lock } from 'lucide-react';
import dayjs from 'dayjs';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';
import type {
  ChallengeStageGroup,
  ChallengeTaskItem,
} from '@shared/api.interface';

interface StageManageCardProps {
  group: ChallengeStageGroup;
  dayRangeLabel: string;
  dayCount: number;
  checkingRecordId: string | null;
  onCheckin: (recordId: string) => void;
  onCancelCheckin: (recordId: string) => void;
}

interface TaskManageRowProps {
  task: ChallengeTaskItem;
  dayCount: number;
  checking: boolean;
  stageUnlocked: boolean;
  onCheckin: (recordId: string) => void;
  onCancelCheckin: (recordId: string) => void;
}

/** 单条任务行：标题/分类/标准/应完成天数/状态徽章 + 标记完成/取消完成 */
const TaskManageRow = ({
  task,
  dayCount,
  checking,
  stageUnlocked,
  onCheckin,
  onCancelCheckin,
}: TaskManageRowProps) => {
  const overdue: boolean = !task.completed && dayCount > task.dueDay;
  return (
    <div
      className={cn(
        'flex flex-wrap items-center justify-between gap-3 rounded-lg px-4 py-3 transition-colors duration-200',
        task.completed && 'bg-success/5',
        overdue && !task.completed && 'bg-destructive/5',
        !task.completed && !overdue && 'bg-muted/30 hover:bg-muted/60',
      )}
    >
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={cn(
              'text-sm font-semibold text-foreground',
              task.completed && 'text-muted-foreground',
            )}
          >
            {task.title}
          </span>
          <Badge variant="secondary">{task.category}</Badge>
          {task.completed ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-success/10 px-2.5 py-0.5 text-xs font-semibold text-success">
              <CheckCircle2 className="size-3.5" />
              已完成
            </span>
          ) : overdue ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 px-2.5 py-0.5 text-xs font-semibold text-destructive">
              逾期
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              未完成
            </span>
          )}
        </div>
        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span>达标标准：{task.standard}</span>
          <span className="inline-flex items-center gap-1">
            <Clock className="size-3.5" />
            应完成：第{task.dueDay}天
          </span>
          {task.completed && task.completedAt && (
            <span className="text-success">
              完成于 {dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')}
            </span>
          )}
        </div>
      </div>
      {task.completed ? (
        <Button
          variant="outline"
          size="sm"
          disabled={checking}
          className="text-muted-foreground"
          onClick={() => onCancelCheckin(task.recordId)}
        >
          {checking ? <Spinner className="size-4" /> : null}
          取消完成
        </Button>
      ) : (
        <Button
          size="sm"
          disabled={checking || !stageUnlocked}
          title={stageUnlocked ? undefined : '阶段未解锁，暂不能标记'}
          className="bg-accent text-white hover:bg-accent/90"
          onClick={() => onCheckin(task.recordId)}
        >
          {checking ? <Spinner className="size-4" /> : null}
          标记完成
        </Button>
      )}
    </div>
  );
};

/** 阶段分组卡片：阶段名/达标标准/进度条 + 任务列表（未解锁灰度+锁定标识） */
const StageManageCard = ({
  group,
  dayRangeLabel,
  dayCount,
  checkingRecordId,
  onCheckin,
  onCancelCheckin,
}: StageManageCardProps) => {
  const { stage, standard, progress, unlocked, unlockCondition, tasks } = group;
  const allCompleted = unlocked && tasks.length > 0 && progress >= 100;
  const completedCount = tasks.filter(
    (task: ChallengeTaskItem) => task.completed,
  ).length;

  return (
    <Card
      className={cn(
        'rounded-xl border-border shadow-sm transition-opacity duration-200',
        !unlocked && 'opacity-60 grayscale-[30%]',
      )}
    >
      <CardContent className="space-y-4 p-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold',
                unlocked
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {unlocked ? stage.slice(0, 2) : <Lock className="size-4" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-bold text-foreground font-display">{stage}</h2>
                <span className="text-xs text-muted-foreground">
                  {dayRangeLabel}
                </span>
                {allCompleted && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 text-xs font-semibold text-gold-foreground">
                    <Award className="size-3.5" />
                    阶段通关
                  </span>
                )}
                {!unlocked && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
                    <Lock className="size-3.5" />
                    未解锁
                  </span>
                )}
              </div>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                通关标准：{standard}
              </p>
              {!unlocked && (
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  解锁条件：{unlockCondition}
                </p>
              )}
            </div>
          </div>
          <div className="flex w-full items-center gap-3 sm:w-64">
            <Progress value={progress} className="h-2 flex-1 bg-primary/10" />
            <span className="shrink-0 text-xs font-semibold text-primary">
              {completedCount}/{tasks.length} · {progress}%
            </span>
          </div>
        </header>
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task: ChallengeTaskItem) => (
              <TaskManageRow
                key={task.recordId}
                task={task}
                dayCount={dayCount}
                checking={checkingRecordId === task.recordId}
                stageUnlocked={unlocked}
                onCheckin={onCheckin}
                onCancelCheckin={onCancelCheckin}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
            {unlocked ? '本阶段暂无相关任务' : '阶段未解锁，任务待开放'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StageManageCard;
