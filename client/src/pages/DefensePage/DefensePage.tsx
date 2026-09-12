import { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  User,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useCurrentUserProfile } from '@/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { getWorkbench } from '@client/src/api/challenge';
import { fetchNewcomerDetail, fetchDefenseEligibility, applyForDefense } from '@client/src/api/newcomer';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import { cn } from '@client/src/lib/utils';
import AssessmentRecordsCard from './AssessmentRecordsCard';
import type {
  NewcomerDetail,
  WorkbenchResponse,
  DefensePrerequisiteStatus,
} from '@shared/api.interface';

/** 试用期总天数（90 天闯关） */
const PROBATION_DAYS = 90;

const DefensePage: React.FC = () => {
  const userInfo = useCurrentUserProfile();
  const [workbench, setWorkbench] = useState<WorkbenchResponse | null>(null);
  const [detail, setDetail] = useState<NewcomerDetail | null>(null);
  const [eligibility, setEligibility] = useState<DefensePrerequisiteStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response: WorkbenchResponse = await getWorkbench();
      setWorkbench(response);
      if (response.newcomer) {
        const [newcomerDetail, eligibilityData] = await Promise.all([
          fetchNewcomerDetail(response.newcomer.id),
          fetchDefenseEligibility(response.newcomer.id),
        ]);
        setDetail(newcomerDetail);
        setEligibility(eligibilityData);
      } else {
        setDetail(null);
        setEligibility(null);
      }
    } catch (err) {
      setError(err);
      toast.error(getApiErrorMessage(err, '转正面试数据加载失败，请稍后重试'));
      logger.error('获取转正面试数据失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleApply = useCallback(async () => {
    if (!workbench?.newcomer) return;
    try {
      await applyForDefense(workbench.newcomer.id);
      toast.success('面试申请已提交，已通知管理员安排转正面试');
      // 刷新 eligibility
      const newEligibility = await fetchDefenseEligibility(workbench.newcomer.id);
      setEligibility(newEligibility);
    } catch (error) {
      toast.error(getApiErrorMessage(error, '提交失败，请稍后重试'));
    }
  }, [workbench]);

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        {/* 标题骨架 */}
        <div className="flex items-center gap-3">
          <Skeleton className="size-10 rounded-xl" />
          <div className="space-y-1.5">
            <Skeleton className="h-5 w-40 rounded-md" />
            <Skeleton className="h-4 w-56 rounded-md" />
          </div>
        </div>
        {/* 摘录卡片骨架 */}
        <div className="rounded-xl border bg-card p-6 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <Skeleton className="size-4 rounded" />
            <Skeleton className="h-4 w-28 rounded-md" />
          </div>
          <div className="grid grid-cols-3 gap-4">
            {[0, 1, 2].map((i: number) => (
              <div key={i}>
                <Skeleton className="mb-1 h-3 w-16 rounded-md" />
                <Skeleton className="h-6 w-24 rounded-md" />
              </div>
            ))}
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
              {[0, 1].map((i: number) => (
                <div key={i} className="rounded-lg bg-muted/50 p-4">
                  <Skeleton className="mb-2 h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2">
              <Skeleton className="size-4 rounded" />
              <Skeleton className="h-4 w-20 rounded-md" />
            </div>
            <div className="space-y-3">
              <Skeleton className="h-3 w-full rounded-md" />
              <Skeleton className="h-3 w-4/5 rounded-md" />
              <Skeleton className="h-3 w-3/5 rounded-md" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !workbench) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <div className="flex items-center gap-2 text-sm font-medium text-destructive">
              <AlertCircle className="size-4" />
              转正面试数据加载失败
            </div>
            <Button variant="outline" onClick={() => void loadData()}>
              重新加载
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 新人档案不存在：友好空态
  if (!workbench.newcomer) {
    return (
      <div className="mx-auto w-full max-w-6xl p-6">
        <Card className="rounded-xl border-border shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
              <Award className="size-4 text-primary" />
              转正面试
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-sm leading-relaxed text-muted-foreground">
              还未创建你的新人档案，暂无法查看转正进度与面试准备情况。
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              请联系 HR 或管理员在新人管理中录入并关联你的账号。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const newcomer = workbench.newcomer;
  const dayCount = Math.max(1, newcomer.dayCount);
  const daysLeft = Math.max(0, PROBATION_DAYS - dayCount);
  const probationProgress = Math.min(
    100,
    Math.round((dayCount / PROBATION_DAYS) * 100),
  );
  const assessments = detail?.assessments ?? [];
  const mentor = workbench.mentor;
  const displayName = userInfo?.name || newcomer.name;

  const stageReady = eligibility?.stagesCompleted ?? false;
  const courseReady = eligibility?.coursesPassed ?? false;
  const allConditionsMet = stageReady && courseReady;
  const hasPending = eligibility?.hasPendingApplication ?? false;
  const isPending = eligibility?.applicationStatus === 'pending';
  const isScheduled = eligibility?.applicationStatus === 'scheduled';

  const canApply = allConditionsMet && !hasPending;
  const buttonHint = isScheduled
    ? '面试申请已安排，等待进行转正面试'
    : isPending
      ? '面试申请已提交，等待管理审核'
      : hasPending
        ? '已有待处理的面试申请'
        : !stageReady || !courseReady
          ? '完成所有前置条件后可申请转正面试'
          : '前置条件已满足，点击申请转正面试';

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      {/* 顶部欢迎区：蓝渐变背景 */}
      <div className="rounded-xl bg-primary p-6 text-white shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm opacity-90">
              {displayName}，坚持就是胜利
            </p>
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-display text-4xl font-bold tracking-tight">
                {daysLeft > 0 ? daysLeft : '已满'}
              </span>
              <span className="text-base opacity-90">
                {daysLeft > 0 ? '天' : '试用期'}
              </span>
            </div>
            <p className="mt-1 text-xs opacity-80">
              {daysLeft > 0 ? '距离转正面试' : '可发起转正面试流程'}
            </p>
          </div>
          <Badge className="border-white/30 bg-white/15 font-display text-white">
            当前阶段 · {newcomer.stage}
          </Badge>
        </div>
        <div className="mt-5 space-y-1.5">
          <div className="flex items-center justify-between text-xs opacity-90">
            <span>入职第 {dayCount} 天</span>
            <span>总试用期 {PROBATION_DAYS} 天</span>
          </div>
          <Progress
            value={probationProgress}
            className="h-2 bg-white/25"
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* 转正面试前置条件 */}
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <CheckCircle2 className="size-4 text-primary" />
                转正面试前置条件
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid gap-3 sm:grid-cols-2">
                {/* 条件1：阶段闯关 */}
                <li className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-3',
                  eligibility?.stagesCompleted
                    ? 'border-success/30 bg-success/5'
                    : 'border-border bg-muted/50',
                )}>
                  <div className="flex items-center gap-2">
                    {eligibility?.stagesCompleted
                      ? <CheckCircle2 className="size-4 text-success" />
                      : <Clock className="size-4 text-muted-foreground/60" />
                    }
                    <span className={cn(
                      'text-sm font-medium',
                      eligibility?.stagesCompleted ? 'text-foreground' : 'text-muted-foreground',
                    )}>
                      阶段闯关全部完成
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold',
                    eligibility?.stagesCompleted ? 'text-success' : 'text-muted-foreground',
                  )}>
                    {eligibility?.stagesCompleted ? '已完成' : '未完成'}
                  </span>
                </li>

                {/* 条件2：考核中心 */}
                <li className={cn(
                  'flex items-center justify-between gap-2 rounded-lg border px-3 py-3',
                  eligibility?.coursesPassed
                    ? 'border-success/30 bg-success/5'
                    : 'border-border bg-muted/50',
                )}>
                  <div className="flex items-center gap-2">
                    {eligibility?.coursesPassed
                      ? <CheckCircle2 className="size-4 text-success" />
                      : <Clock className="size-4 text-muted-foreground/60" />
                    }
                    <span className={cn(
                      'text-sm font-medium',
                      eligibility?.coursesPassed ? 'text-foreground' : 'text-muted-foreground',
                    )}>
                      考核中心全部通过
                    </span>
                  </div>
                  <span className={cn(
                    'text-xs font-semibold',
                    eligibility?.coursesPassed ? 'text-success' : 'text-muted-foreground',
                  )}>
                    {eligibility?.coursesPassed ? '已通过' : '未通过'}
                  </span>
                </li>
              </ul>
            </CardContent>
          </Card>

          {/* 节点考核留档 */}
          <AssessmentRecordsCard assessments={assessments} />
        </div>

        {/* 导师信息 */}
        <div className="space-y-6">
          <Card className="rounded-xl border-border shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
                <User className="size-4 text-primary" />
                我的导师
              </CardTitle>
            </CardHeader>
            <CardContent>
              {mentor ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {mentor.name.slice(-2)}
                      </span>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-foreground">
                        {mentor.name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        带教导师
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2 text-sm">
                    <span className="text-muted-foreground">本周陪访</span>
                    <span className="font-semibold text-primary">
                      {mentor.weeklyVisits} 次
                    </span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                  <User className="size-4" />
                  暂未分配导师
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* 申请转正面试 */}
      <Card className="rounded-xl border-border shadow-sm">
        <CardContent className="flex flex-col items-center gap-2 p-6">
          <Button
            size="lg"
            disabled={!canApply}
            className="w-full max-w-sm"
            onClick={handleApply}
          >
            <Award className="size-4" />
            申请转正面试
          </Button>
          <p className="text-xs text-muted-foreground">
            {buttonHint}
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DefensePage;
