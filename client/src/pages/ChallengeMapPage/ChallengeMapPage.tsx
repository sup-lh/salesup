import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Map as MapIcon, RefreshCw, TriangleAlert } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import StageSection from './StageSection';
import {
  getChallengeRecords,
  checkinTask,
} from '@client/src/api/challenge';
import {
  getApiErrorMessage,
  isNotFoundApiError,
} from '@client/src/utils/api-error';
import { STAGE_DAY_RANGES } from '@shared/common';
import type { GrowthStage } from '@shared/common';
import type {
  ChallengeFilter,
  ChallengeRecordsResponse,
  ChallengeStageGroup,
  ChallengeTaskItem,
} from '@shared/api.interface';

const FILTER_OPTIONS: Array<{ value: ChallengeFilter; label: string }> = [
  { value: 'today', label: '今日待办' },
  { value: 'pending', label: '未完成' },
  { value: 'done', label: '已完成' },
];

const NOT_FOUND_MESSAGE =
  '未找到当前用户的新人档案，请联系管理员在新人管理中录入并关联账号';

const dayRangeLabel = (stage: GrowthStage): string => {
  const range = STAGE_DAY_RANGES.find((item) => item.stage === stage);
  if (!range) return '';
  return range.endDay > 90
    ? `第${range.startDay}天起`
    : `第${range.startDay}-${range.endDay}天`;
};

const ChallengeMapPage = () => {
  const [filter, setFilter] = useState<ChallengeFilter | undefined>(undefined);
  const [data, setData] = useState<ChallengeRecordsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [notFound, setNotFound] = useState(false);
  const [checkingRecordId, setCheckingRecordId] = useState<string | null>(
    null,
  );
  const loadChallengeRecords = useCallback(
    async (nextFilter: ChallengeFilter) => {
      setLoading(true);
      setError(null);
      setNotFound(false);
      try {
        const response: ChallengeRecordsResponse =
          await getChallengeRecords(nextFilter);
        setData(response);
        setNotFound(response.hasProfile === false);
      } catch (err) {
        setError(err);
        setNotFound(isNotFoundApiError(err));
        logger.error('获取闯关地图数据失败', err);
      } finally {
        setLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadChallengeRecords(filter);
  }, [filter, loadChallengeRecords]);

  const applyLocalCheckin = useCallback(
    (recordId: string, completedAt: string) => {
      setData((prev: ChallengeRecordsResponse | null) => {
        if (!prev) return prev;
        return {
          ...prev,
          stages: prev.stages.map((stage: ChallengeStageGroup) => ({
            ...stage,
            tasks: stage.tasks.map((task: ChallengeTaskItem) =>
              task.recordId === recordId
                ? { ...task, completed: true, completedAt }
                : task,
            ),
          })),
        };
      });
    },
    [],
  );

  const applyLocalRevert = useCallback((recordId: string) => {
    setData((prev: ChallengeRecordsResponse | null) => {
      if (!prev) return prev;
      return {
        ...prev,
        stages: prev.stages.map((stage: ChallengeStageGroup) => ({
          ...stage,
          tasks: stage.tasks.map((task: ChallengeTaskItem) =>
            task.recordId === recordId
              ? { ...task, completed: false, completedAt: null }
              : task,
          ),
        })),
      };
    });
  }, []);

  /** 用全量数据校正各阶段进度（筛选视图下无法从子集准确重算） */
  const mergeFreshProgress = useCallback(
    (
      prev: ChallengeRecordsResponse | null,
      fresh: ChallengeRecordsResponse,
    ): ChallengeRecordsResponse | null => {
      if (!prev) return prev;
      return {
        ...prev,
        stages: prev.stages.map(
          (stage: ChallengeStageGroup, index: number) => ({
            ...stage,
            progress: fresh.stages[index]?.progress ?? stage.progress,
            unlocked: fresh.stages[index]?.unlocked ?? stage.unlocked,
          })),
      };
    },
    [],
  );

  const handleCheckin = useCallback(
    async (recordId: string) => {
      if (checkingRecordId) return;
      setCheckingRecordId(recordId);
      applyLocalCheckin(recordId, new Date().toISOString());
      try {
        const result = await checkinTask({ recordId });
        applyLocalCheckin(recordId, result.completedAt);
        toast.success('打卡成功，继续保持！');
        try {
          const fresh: ChallengeRecordsResponse = await getChallengeRecords();
          setData((prev: ChallengeRecordsResponse | null) =>
            mergeFreshProgress(prev, fresh),
          );
        } catch (refreshError) {
          logger.error('刷新阶段进度失败', refreshError);
        }
      } catch (err) {
        applyLocalRevert(recordId);
        toast.error(getApiErrorMessage(err, '打卡失败，请稍后重试'));
        logger.error('任务打卡失败', err);
      } finally {
        setCheckingRecordId(null);
      }
    },
    [applyLocalCheckin, applyLocalRevert, checkingRecordId, mergeFreshProgress],
  );

  const renderBody = () => {
    if (loading) {
      return (
        <div className="space-y-6">
          {/* 标题骨架 */}
          <div className="flex items-center gap-3">
            <Skeleton className="size-10 rounded-xl" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-48 rounded-md" />
              <Skeleton className="h-4 w-36 rounded-md" />
            </div>
          </div>
          {/* 进度概要骨架 */}
          <div className="flex items-center gap-6">
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
          {/* 阶段卡片骨架 */}
          {[0, 1, 2, 3].map((index: number) => (
            <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Skeleton className="size-6 rounded-full" />
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-6 w-12 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
              <div className="space-y-2">
                {[0, 1, 2].map((j: number) => (
                  <div key={j} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Skeleton className="size-5 rounded" />
                    <Skeleton className="h-4 flex-1 rounded-md" />
                    <Skeleton className="h-3 w-10 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (notFound) {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <MapIcon className="size-4 text-primary" />
              90天闯关地图
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {getApiErrorMessage(error, NOT_FOUND_MESSAGE)}
            </p>
            <Button asChild>
              <Link to="/newcomers">去新人管理</Link>
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (error || !data) {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <TriangleAlert className="size-4" />
              闯关地图数据加载失败
            </div>
            <p className="text-sm text-muted-foreground">
              {getApiErrorMessage(error, '请稍后重试或联系管理员')}
            </p>
            <Button
              variant="outline"
              onClick={() => void loadChallengeRecords(filter)}
            >
              <RefreshCw className="size-4" />
              重新加载
            </Button>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {data.stages.map((stage: ChallengeStageGroup) => (
          <StageSection
            key={stage.stage}
            group={stage}
            dayRangeLabel={dayRangeLabel(stage.stage)}
            checkingRecordId={checkingRecordId}
            onCheckin={(recordId: string) => void handleCheckin(recordId)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="flex items-center gap-2 font-display text-lg font-bold text-foreground">
          <MapIcon className="size-5 text-primary" />
          90天闯关地图
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 rounded-full bg-muted p-1">
            {FILTER_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setFilter(option.value)}
                className={cn(
                  'rounded-full px-4 py-1.5 text-sm transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                  filter === option.value
                    ? 'bg-card font-semibold text-primary shadow-sm'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                aria-pressed={filter === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      {renderBody()}
    </div>
  );
};

export default ChallengeMapPage;
