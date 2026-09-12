import { Award, Lock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import TaskCard from './TaskCard';
import type { ChallengeStageGroup } from '@shared/api.interface';

interface StageSectionProps {
  group: ChallengeStageGroup;
  dayRangeLabel: string;
  checkingRecordId: string | null;
  onCheckin: (recordId: string) => void;
}

/** 四阶段纵向分区：阶段头部（名称/天数/标准/进度）+ 任务网格 */
const StageSection = ({
  group,
  dayRangeLabel,
  checkingRecordId,
  onCheckin,
}: StageSectionProps) => {
  const { stage, standard, progress, unlocked, unlockCondition, tasks } = group;
  const allCompleted = unlocked && tasks.length > 0 && progress >= 100;

  return (
    <section
      className={cn(
        'rounded-xl border border-border bg-card p-6 shadow-sm transition-opacity duration-200',
        !unlocked && 'opacity-60',
      )}
    >
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div
              className={cn(
                  'flex size-10 shrink-0 items-center justify-center rounded-xl font-display text-sm font-bold',
                  unlocked
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground',
                )}
          >
            {unlocked ? stage.slice(0, 2) : <Lock className="size-4" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-display text-base font-bold text-foreground">{stage}</h2>
              <span className="text-xs text-muted-foreground">
                {dayRangeLabel}
              </span>
              {allCompleted && (
                <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-0.5 font-display text-xs font-semibold text-gold-foreground">
                  <Award className="size-3.5" />
                  阶段通关
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
        <div className="flex w-full items-center gap-3 sm:w-52">
          <Progress value={progress} className="h-2 flex-1" />
          <span className="w-11 shrink-0 text-right font-display text-xs font-semibold text-primary">
            {progress}%
          </span>
        </div>
      </header>
      {tasks.length > 0 ? (
        <div className="mt-5 grid gap-4 md:grid-cols-2">
          {tasks.map((task) => (
            <TaskCard
              key={task.recordId}
              task={task}
              stageUnlocked={unlocked}
              checking={checkingRecordId === task.recordId}
              onCheckin={onCheckin}
            />
          ))}
        </div>
      ) : (
        <div className="mt-6 rounded-lg bg-muted/50 px-4 py-3 text-xs text-muted-foreground">
          {unlocked ? '本阶段暂无相关任务' : '阶段未解锁，任务待开放'}
        </div>
      )}
    </section>
  );
};

export default StageSection;
