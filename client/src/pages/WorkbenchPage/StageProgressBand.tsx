import { Fragment } from 'react';
import { Check, Lock, Sparkles } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { GrowthStage } from '@shared/common';

interface StageProgressBandProps {
  stageProgress: Array<{
    stage: GrowthStage;
    status: '已完成' | '进行中' | '未解锁';
    standard: string;
    progress: number;
  }>;
  dayCount: number;
  currentStage: GrowthStage;
}

/** 顶部四阶段横向进度带：圆形节点 + 连接线，当前阶段高亮脉冲 */
const StageProgressBand = ({
  stageProgress,
  dayCount,
  currentStage,
}: StageProgressBandProps) => {
  return (
    <Card className="rounded-xl border-border bg-card shadow-sm">
      <CardHeader className="flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Sparkles className="size-4 text-accent" />
          90天成长阶段
        </CardTitle>
        <span className="font-display text-sm font-semibold text-primary">
          第 {dayCount}
          <span className="font-normal text-muted-foreground"> / 90 天</span>
        </span>
      </CardHeader>
      <CardContent className="pb-6 pt-4">
        <div className="flex items-start">
          {stageProgress.map((item, index) => {
            const isCurrent = item.stage === currentStage;
            const isDone = item.status === '已完成';
            const isLocked = item.status === '未解锁';
            const reached = isDone || isCurrent;
            return (
              <Fragment key={item.stage}>
                {index > 0 && (
                  <div className="mt-5 h-1 min-w-3 flex-1 rounded-full bg-border">
                    <div
                      className={cn(
                        'h-full rounded-full transition-all duration-300',
                        reached ? 'w-full bg-primary/60' : 'w-0',
                      )}
                    />
                  </div>
                )}
                <div className="flex w-20 shrink-0 flex-col items-center gap-2 sm:w-24">
                  <div
                    className={cn(
                      'relative flex size-10 items-center justify-center rounded-full transition-all duration-200',
                      isCurrent &&
                        'bg-primary text-primary-foreground ring-4 ring-primary/15',
                      isDone && 'bg-success text-white',
                      isLocked && 'bg-muted text-muted-foreground/60',
                      !isCurrent && !isDone && !isLocked && 'bg-primary/15 text-primary',
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute inset-0 animate-ping rounded-full bg-primary/20" />
                    )}
                    {isDone ? (
                      <Check className="size-5" strokeWidth={3} />
                    ) : isCurrent ? (
                      <Sparkles className="relative size-4.5" />
                    ) : isLocked ? (
                      <Lock className="size-4" />
                    ) : null}
                  </div>
                  <div className="text-center">
                    <div
                      className={cn(
                        'font-display text-sm leading-tight',
                        isCurrent
                          ? 'font-bold text-primary'
                          : isDone
                            ? 'font-semibold text-foreground'
                            : 'font-medium text-muted-foreground',
                      )}
                    >
                      {item.stage}
                    </div>
                    <div className="mt-1 text-xs leading-tight text-muted-foreground">
                      {isCurrent
                        ? `第${dayCount}天 · ${item.progress}%`
                        : isDone
                          ? '已完成'
                          : isLocked
                            ? '未解锁'
                            : `${item.progress}%`}
                    </div>
                  </div>
                </div>
              </Fragment>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default StageProgressBand;
