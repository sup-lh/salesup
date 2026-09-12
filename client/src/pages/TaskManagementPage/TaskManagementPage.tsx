import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  LayoutTemplate,
  Lock,
  RefreshCw,
  TriangleAlert,
  UserRound,
} from 'lucide-react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import StageManageCard from './StageManageCard';
import TemplateManagePanel from './TemplateManagePanel';
import {
  getChallengeRecords,
  cancelCheckin,
  checkinTask,
} from '@client/src/api/challenge';
import { fetchNewcomers } from '@client/src/api/newcomer';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import { STAGE_DAY_RANGES } from '@shared/common';
import type { GrowthStage } from '@shared/common';
import type {
  ChallengeRecordsResponse,
  ChallengeStageGroup,
  ChallengeTaskItem,
  NewcomerSummary,
  PagedResult,
} from '@shared/api.interface';

const NOT_FOUND_MESSAGE = '该新人暂无闯关任务档案，请先在新人管理中录入';

type ActiveTab = 'progress' | 'templates';

const dayRangeLabel = (stage: GrowthStage): string => {
  const range = STAGE_DAY_RANGES.find((item) => item.stage === stage);
  if (!range) return '';
  return range.endDay > 90
    ? `第${range.startDay}天起`
    : `第${range.startDay}-${range.endDay}天`;
};

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
}

const computeStats = (
  stages: ChallengeStageGroup[],
  dayCount: number,
): TaskStats => {
  const tasks: ChallengeTaskItem[] = stages.flatMap(
    (stage: ChallengeStageGroup) => stage.tasks,
  );
  const completed = tasks.filter(
    (task: ChallengeTaskItem) => task.completed,
  ).length;
  const overdue = tasks.filter(
    (task: ChallengeTaskItem) => !task.completed && dayCount > task.dueDay,
  ).length;
  return { total: tasks.length, completed, pending: tasks.length - completed, overdue };
};

/** 新人任务管理页（管理者视角）：选新人 → 查看闯关任务 / 配置任务模板 */
const TaskManagementPage = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('progress');

  // 任务进度区状态
  const [newcomers, setNewcomers] = useState<NewcomerSummary[]>([]);
  const [newcomersLoading, setNewcomersLoading] = useState(true);
  const [newcomersError, setNewcomersError] = useState(false);
  const [selectedNewcomerId, setSelectedNewcomerId] = useState('');
  const [data, setData] = useState<ChallengeRecordsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [checkingRecordId, setCheckingRecordId] = useState<string | null>(null);

  const loadNewcomers = useCallback(async () => {
    setNewcomersLoading(true);
    setNewcomersError(false);
    try {
      const result: PagedResult<NewcomerSummary> = await fetchNewcomers({
        offset: 0,
        pageSize: 100,
      });
      setNewcomers(result.items);
      if (result.items.length > 0) {
        setSelectedNewcomerId((prev: string) => prev || result.items[0].id);
      }
    } catch (err) {
      setNewcomersError(true);
      toast.error('获取新人列表失败，请稍后重试');
      logger.error('获取新人列表失败', err);
    } finally {
      setNewcomersLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadNewcomers();
  }, [loadNewcomers]);

  const loadRecords = useCallback(async (newcomerId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response: ChallengeRecordsResponse = await getChallengeRecords(
        undefined,
        newcomerId,
      );
      setData(response);
    } catch (err) {
      setError(err);
      logger.error('获取新人闯关任务失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedNewcomerId) void loadRecords(selectedNewcomerId);
  }, [selectedNewcomerId, loadRecords]);

  const selectedNewcomer: NewcomerSummary | undefined = useMemo(
    () =>
      newcomers.find(
        (item: NewcomerSummary) => item.id === selectedNewcomerId,
      ),
    [newcomers, selectedNewcomerId],
  );

  const stats: TaskStats = useMemo(
    () =>
      data
        ? computeStats(data.stages, selectedNewcomer?.dayCount ?? 1)
        : { total: 0, completed: 0, pending: 0, overdue: 0 },
    [data, selectedNewcomer],
  );

  const handleCheckin = useCallback(
    async (recordId: string) => {
      if (!selectedNewcomerId || checkingRecordId) return;
      setCheckingRecordId(recordId);
      try {
        await checkinTask({ recordId });
        toast.success('已标记该任务为完成');
        await loadRecords(selectedNewcomerId);
      } catch (err) {
        toast.error(getApiErrorMessage(err, '标记完成失败，请稍后重试'));
        logger.error('标记任务完成失败', err);
      } finally {
        setCheckingRecordId(null);
      }
    },
    [checkingRecordId, loadRecords, selectedNewcomerId],
  );

  const handleCancelCheckin = useCallback(
    async (recordId: string) => {
      if (!selectedNewcomerId || checkingRecordId) return;
      setCheckingRecordId(recordId);
      try {
        await cancelCheckin(recordId);
        toast.success('已取消该任务的完成状态');
        await loadRecords(selectedNewcomerId);
      } catch (err) {
        toast.error(getApiErrorMessage(err, '取消完成失败，请稍后重试'));
        logger.error('取消任务完成失败', err);
      } finally {
        setCheckingRecordId(null);
      }
    },
    [checkingRecordId, loadRecords, selectedNewcomerId],
  );

  const renderStats = () => {
    const items: Array<{
      label: string;
      value: number;
      icon: React.ReactNode;
      cardClass: string;
      valueClass: string;
    }> = [
      {
        label: '总任务数',
        value: stats.total,
        icon: <ClipboardList className="size-4 text-primary" />,
        cardClass: 'bg-primary/5',
        valueClass: 'text-foreground',
      },
      {
        label: '已完成',
        value: stats.completed,
        icon: <CheckCircle2 className="size-4 text-success" />,
        cardClass: 'bg-success/5',
        valueClass: 'text-success',
      },
      {
        label: '未完成',
        value: stats.pending,
        icon: <Circle className="size-4 text-primary" />,
        cardClass: 'bg-primary/5',
        valueClass: 'text-primary',
      },
      {
        label: '逾期',
        value: stats.overdue,
        icon: <AlertTriangle className="size-4 text-destructive" />,
        cardClass: 'bg-destructive/5',
        valueClass: 'text-destructive',
      },
    ];
    return (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.label}
            className={cn('rounded-xl p-4 shadow-sm', item.cardClass)}
          >
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              {item.icon}
              {item.label}
            </div>
            <div className={cn('mt-1.5 text-2xl font-bold font-display', item.valueClass)}>
              {item.value}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderStageBand = () => {
    if (!data) return null;
    return (
      <div className="flex items-center gap-2">
        {data.stages.map((stage: ChallengeStageGroup, index: number) => (
          <div key={stage.stage} className="flex min-w-0 flex-1 items-center gap-2">
            {index > 0 && (
              <div
                className={cn(
                  'h-1 w-6 shrink-0 rounded-full',
                  stage.unlocked ? 'bg-primary/40' : 'bg-border',
                )}
              />
            )}
            <div
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-xl px-3 py-2.5 text-center',
                stage.unlocked
                  ? 'bg-primary/5 text-foreground'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              <span className="flex items-center gap-1 text-sm font-semibold">
                {!stage.unlocked && <Lock className="size-3.5" />}
                {stage.stage}
              </span>
              <span className="text-xs opacity-80">
                {stage.unlocked ? `${stage.progress}%` : '未解锁'}
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  const renderProgressBody = () => {
    if (newcomersLoading || loading) {
      return (
      <div className="space-y-6">
        {/* 页头骨架 */}
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Skeleton className="h-6 w-40 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-28 rounded-md" />
            <Skeleton className="h-9 w-28 rounded-md" />
          </div>
        </div>
        {/* 新人选择器骨架 */}
        <div className="flex items-center gap-3">
          <Skeleton className="h-5 w-16 rounded-md" />
          <Skeleton className="h-9 w-48 rounded-md" />
        </div>
        {/* 统计卡片骨架 */}
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i: number) => (
            <div key={i} className="rounded-xl border bg-card p-4 shadow-sm">
              <Skeleton className="mb-2 h-3 w-16 rounded-md" />
              <Skeleton className="h-6 w-10 rounded-md" />
            </div>
          ))}
        </div>
        {/* 阶段卡片骨架 */}
        {[0, 1, 2, 3].map((index: number) => (
          <div key={index} className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
            </div>
            <div className="space-y-3">
              {[0, 1].map((j: number) => (
                <div key={j} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                  <Skeleton className="h-6 w-14 rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      );
    }

    if (!selectedNewcomerId) {
      return (
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-col items-start gap-2 p-6">
              <div className="text-sm font-medium text-foreground">
                暂无可管理的新人
              </div>
              <p className="text-sm text-muted-foreground">
                请先在新人管理中录入新人档案，再回来管理其闯关任务
              </p>
            </CardContent>
          </Card>
      );
    }

    if (error || !data) {
      return (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <TriangleAlert className="size-4" />
              任务数据加载失败
            </div>
            <p className="text-sm text-muted-foreground">
              {getApiErrorMessage(error, '请稍后重试或联系管理员')}
            </p>
            <Button
              variant="outline"
              onClick={() => void loadRecords(selectedNewcomerId)}
            >
              <RefreshCw className="size-4" />
              重新加载
            </Button>
          </CardContent>
        </Card>
      );
    }

    if (data.hasProfile === false) {
      return (
        <Card className="rounded-xl shadow-sm">
          <CardContent className="p-6 text-sm text-muted-foreground">
            {NOT_FOUND_MESSAGE}
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {renderStats()}
        <Card className="rounded-xl shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-semibold text-foreground">
              阶段进度总览
            </CardTitle>
          </CardHeader>
          <CardContent>{renderStageBand()}</CardContent>
        </Card>
        {data.stages.map((stage: ChallengeStageGroup) => (
          <StageManageCard
            key={stage.stage}
            group={stage}
            dayRangeLabel={dayRangeLabel(stage.stage)}
            dayCount={selectedNewcomer?.dayCount ?? 1}
            checkingRecordId={checkingRecordId}
            onCheckin={(recordId: string) => void handleCheckin(recordId)}
            onCancelCheckin={(recordId: string) =>
              void handleCancelCheckin(recordId)
            }
          />
        ))}
      </div>
    );
  };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      {/* 页头 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <ClipboardList className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold font-display">新人任务管理</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            管理新人的闯关任务进度和任务模板配置
          </p>
        </div>
      </div>

      {/* Tab 切换 */}
      <Tabs
        value={activeTab}
        onValueChange={(value: string) => setActiveTab(value as ActiveTab)}
      >
        <TabsList className="bg-muted/60">
          <TabsTrigger value="progress" className="gap-1.5 data-[state=inactive]:text-muted-foreground">
            <ClipboardList className="size-4" />
            任务进度
          </TabsTrigger>
          <TabsTrigger value="templates" className="gap-1.5 data-[state=inactive]:text-muted-foreground">
            <LayoutTemplate className="size-4" />
            模板配置
          </TabsTrigger>
        </TabsList>
      </Tabs>

      {/* 任务进度 Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          <Card className="rounded-xl shadow-sm">
            <CardContent className="flex flex-wrap items-center justify-between gap-3 p-6">
              <div className="flex flex-wrap items-center gap-3">
                <UserRound className="size-4 shrink-0 text-primary" />
                <Select
                  value={selectedNewcomerId}
                  onValueChange={setSelectedNewcomerId}
                >
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="选择要管理的新人" />
                  </SelectTrigger>
                  <SelectContent>
                    {newcomers.map((item: NewcomerSummary) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name} · {item.position}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {newcomersError && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => void loadNewcomers()}
                  >
                    <RefreshCw className="size-4" />
                    重试加载新人
                  </Button>
                )}
              </div>
              {selectedNewcomer && (
                <div className="text-sm text-muted-foreground">
                  入职第 {selectedNewcomer.dayCount} 天 ·{' '}
                  {selectedNewcomer.stage}
                </div>
              )}
            </CardContent>
          </Card>

          {renderProgressBody()}
        </div>
      )}

      {/* 模板配置 Tab */}
      {activeTab === 'templates' && <TemplateManagePanel />}
    </div>
  );
};

export default TaskManagementPage;