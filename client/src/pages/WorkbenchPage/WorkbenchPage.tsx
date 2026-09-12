import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarDays,
  CheckCircle2,
  Clock,
  Compass,
  RefreshCw,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import dayjs from 'dayjs';
import 'dayjs/locale/zh-cn';
import { logger } from '@/lib/logger';
import { useCan } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import StageProgressBand from './StageProgressBand';
import TodayTasksCard from './TodayTasksCard';
import PassStatusCard from './PassStatusCard';
import MentorCard from './MentorCard';
import { getWorkbench } from '@client/src/api/challenge';
import {
  fetchMyNewcomerApplication,
  fetchNewcomers,
} from '@client/src/api/newcomer';
import { getApiErrorMessage, isNotFoundApiError } from '@client/src/utils/api-error';
import NewcomerCreateDialog from '../NewcomersPage/NewcomerCreateDialog';
import CoachingRecordSelfDialog, {
  CoachingSelfCard,
} from '../CoachingPage/CoachingRecordSelfDialog';
import OpportunitySelfDialog, {
  OpportunitySelfCard,
} from './OpportunitySelfDialog';
import WorkbenchNewcomerSwitcher, {
  SELF_VIEW_VALUE,
} from './WorkbenchNewcomerSwitcher';
import type {
  NewcomerApplicationItem,
  NewcomerSummary,
  PagedResult,
  WorkbenchResponse,
} from '@shared/api.interface';

const WorkbenchPage = () => {
  const { allowed: isAdmin, isLoading: authLoading } = useCan(
    'manage',
    'Newcomer',
  );
  const [data, setData] = useState<WorkbenchResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [notFound, setNotFound] = useState(false);
  const [myApplication, setMyApplication] = useState<NewcomerApplicationItem | null>(
    null,
  );
  const [importOpen, setImportOpen] = useState(false);
  const [selfCoachingOpen, setSelfCoachingOpen] = useState(false);
  const [selfOpportunityOpen, setSelfOpportunityOpen] = useState(false);
  const [opportunityRefreshKey, setOpportunityRefreshKey] = useState(0);

  const [newcomers, setNewcomers] = useState<NewcomerSummary[]>([]);
  const [selectedNewcomerId, setSelectedNewcomerId] = useState('');

  const loadWorkbench = useCallback(async () => {
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const response: WorkbenchResponse = await getWorkbench(
        selectedNewcomerId || undefined,
      );
      setData(response);
      setNotFound(response.newcomer === null || response.newcomer === undefined);

    } catch (err) {
      setError(err);
      setNotFound(isNotFoundApiError(err));
      logger.error('获取工作台数据失败', err);
    } finally {
      setLoading(false);
    }
  }, [selectedNewcomerId]);

  useEffect(() => {
    void loadWorkbench();
  }, [loadWorkbench]);

  const refreshMyApplication = useCallback(async () => {
    try {
      const result = await fetchMyNewcomerApplication();
      setMyApplication(result.item);
    } catch (err) {
      logger.error('获取我的入职申请失败', err);
      toast.error('获取申请状态失败，请刷新重试');
    }
  }, []);

  useEffect(() => {
    if (!notFound || selectedNewcomerId) return;
    void refreshMyApplication();
  }, [notFound, selectedNewcomerId, refreshMyApplication]);

  useEffect(() => {
    if (!isAdmin) return;
    let cancelled = false;
    fetchNewcomers({ offset: 0, pageSize: 100 })
      .then((result: PagedResult<NewcomerSummary>) => {
        if (!cancelled) setNewcomers(result.items);
      })
      .catch((err: unknown) => {
        logger.error('获取新人列表失败', err);
      });
    return () => {
      cancelled = true;
    };
  }, [isAdmin]);

  const viewingName: string | null = selectedNewcomerId
    ? newcomers.find((item: NewcomerSummary) => item.id === selectedNewcomerId)
        ?.name ?? null
    : null;

  const handleSwitchNewcomer = useCallback((value: string) => {
    setSelectedNewcomerId(value === SELF_VIEW_VALUE ? '' : value);
  }, []);

  if (authLoading || loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        {/* 标题骨架 */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-48 rounded-md" />
            <Skeleton className="h-4 w-64 rounded-md" />
          </div>
        </div>
        {/* 进度条骨架 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-32 rounded-md" />
            <Skeleton className="h-5 w-10 rounded-md" />
          </div>
          <Skeleton className="mb-3 h-2 w-full rounded-full" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        </div>
        {/* 卡片网格骨架 */}
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="rounded-xl border bg-card p-6 shadow-sm lg:col-span-2">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-24 rounded-md" />
            </div>
            <div className="space-y-3">
              {[0, 1, 2].map((i: number) => (
                <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/50 p-3">
                  <Skeleton className="size-5 rounded" />
                  <Skeleton className="h-4 flex-1 rounded-md" />
                  <Skeleton className="size-5 rounded-full" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-3 w-3/4 rounded-md" />
              <Skeleton className="h-3 w-1/2 rounded-md" />
              <Skeleton className="h-3 w-5/6 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const renderApplicationCard = () => {
    if (myApplication === null) {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Compass className="size-4 text-primary" />
              新人成长工作台
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {error
                ? getApiErrorMessage(
                    error,
                    '未找到当前用户的新人档案，提交入职申请并经管理员审核后即可开启 90 天成长闯关',
                  )
                : '还未创建你的新人档案，提交入职申请并经管理员审核后即可开启 90 天成长闯关'}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setImportOpen(true)}>提交入职申请</Button>
              <Button asChild variant="outline">
                <Link to="/newcomers">去新人管理</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    if (myApplication.status === 'pending') {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Clock className="size-4 text-primary" />
              入职申请审核中
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
              <span>提交时间：{dayjs(myApplication.createdAt).format('YYYY-MM-DD HH:mm')}</span>
              <span>岗位：{myApplication.position}</span>
              <span>入职日期：{myApplication.hireDate}</span>
            </div>
            <p className="text-sm leading-relaxed text-muted-foreground">
              管理员审核通过后将自动建立你的新人档案，请耐心等待。
            </p>
          </CardContent>
        </Card>
      );
    }
    if (myApplication.status === 'rejected') {
      return (
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <TriangleAlert className="size-4 text-destructive" />
              申请未通过
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {myApplication.reviewComment ? (
              <p className="text-sm leading-relaxed text-destructive">
                拒绝理由：{myApplication.reviewComment}
              </p>
            ) : (
              <p className="text-sm leading-relaxed text-muted-foreground">
                管理员未填写拒绝理由，如有疑问请联系管理员。
              </p>
            )}
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => setImportOpen(true)}>重新申请</Button>
              <Button asChild variant="outline">
                <Link to="/newcomers">去新人管理</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="rounded-xl border-border shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CheckCircle2 className="size-4 text-primary" />
            申请已通过，档案建立中
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm leading-relaxed text-muted-foreground">
            管理员已通过你的入职申请，新人档案正在建立，刷新后即可开启 90 天成长闯关。
          </p>
          <Button
            variant="outline"
            onClick={() => {
              void loadWorkbench();
              toast.info('正在重新加载工作台数据');
            }}
          >
            <RefreshCw className="size-4" />
            刷新工作台
          </Button>
        </CardContent>
      </Card>
    );
  };

  if (error || !data) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <TriangleAlert className="size-4" />
              工作台数据加载失败
            </div>
            <p className="text-sm text-muted-foreground">
              {getApiErrorMessage(error, '请稍后重试或联系管理员')}
            </p>
            <Button
              variant="outline"
              onClick={() => {
                void loadWorkbench();
                toast.info('正在重新加载工作台数据');
              }}
            >
              <RefreshCw className="size-4" />
              重新加载
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        {isAdmin && (
          <WorkbenchNewcomerSwitcher
            newcomers={newcomers}
            value={selectedNewcomerId}
            onChange={handleSwitchNewcomer}
            viewingName={viewingName}
          />
        )}
        {!selectedNewcomerId ? (
          renderApplicationCard()
        ) : (
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <Compass className="size-4 text-primary" />
                新人成长工作台
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-relaxed text-muted-foreground">
                所选新人暂无档案数据，可切换其他新人或回到我的视角
              </p>
            </CardContent>
          </Card>
        )}
        {!selectedNewcomerId && (
          <NewcomerCreateDialog
            open={importOpen}
            onOpenChange={setImportOpen}
            onCreated={() => {
              void refreshMyApplication();
            }}
            applicationMode
          />
        )}
      </div>
  );
  }

  const greeting = (() => {
    const hour: number = new Date().getHours();
    if (hour < 12) return '早上好';
    if (hour < 18) return '下午好';
    return '晚上好';
  })();

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {isAdmin && (
        <WorkbenchNewcomerSwitcher
          newcomers={newcomers}
          value={selectedNewcomerId}
          onChange={handleSwitchNewcomer}
          viewingName={viewingName}
        />
      )}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
            {greeting}，{viewingName ?? data.newcomer.name}
          </h1>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
            <CalendarDays className="size-3.5" />
            {dayjs().locale('zh-cn').format('YYYY年MM月DD日 dddd')}
            <span className="text-border/60">·</span>
            {data.newcomer.position}
          </p>
        </div>
        <span className="rounded-full bg-primary/10 px-4 py-1.5 font-display text-sm font-semibold text-primary">
          成长第 {data.newcomer.dayCount} 天
        </span>
      </div>
      {data.newcomer.dayCount === 1 && (
        <div className="flex items-center gap-4 rounded-xl border border-accent/20 bg-accent/[0.04] px-6 py-5 shadow-sm">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent/12 text-accent">
            <Compass className="size-5" />
          </div>
          <div>
            <div className="text-base font-bold text-foreground">
              欢迎加入数智玄策，开启你的90天闯关之旅
            </div>
            <div className="mt-0.5 text-sm text-muted-foreground">
              今天是你的第一天，先从今日任务开始吧
            </div>
          </div>
        </div>
      )}

      <StageProgressBand
        stageProgress={data.stageProgress}
        dayCount={data.newcomer.dayCount}
        currentStage={data.newcomer.stage}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <TodayTasksCard tasks={data.todayTasks} />
          {!selectedNewcomerId && (
            <div className="grid gap-6 sm:grid-cols-2">
              <CoachingSelfCard onUpload={() => setSelfCoachingOpen(true)} />
              <OpportunitySelfCard
                onUpload={() => setSelfOpportunityOpen(true)}
                refreshKey={opportunityRefreshKey}
              />
            </div>
          )}
        </div>
        <div className="space-y-6">
          <PassStatusCard passStatus={data.passStatus} />
          <MentorCard mentor={data.mentor} />
        </div>
      </div>

      {!selectedNewcomerId && (
        <CoachingRecordSelfDialog
          open={selfCoachingOpen}
          onOpenChange={setSelfCoachingOpen}
        />
      )}
      {!selectedNewcomerId && (
        <OpportunitySelfDialog
          open={selfOpportunityOpen}
          onOpenChange={setSelfOpportunityOpen}
          onUploaded={() =>
            setOpportunityRefreshKey((prev: number) => prev + 1)
          }
        />
      )}
    </div>
  );
};

export default WorkbenchPage;
