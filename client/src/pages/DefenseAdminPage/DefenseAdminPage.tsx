import { useCallback, useEffect, useState } from 'react';
import { Award, CheckCircle2, Clock, Search, Users as UsersIcon } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { fetchDefenseApplications, fetchDefenseOverview, reviewDefenseApplication, updateNewcomer } from '@client/src/api/newcomer';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import type { DefenseApplicationItem, DefenseOverviewItem, DefenseOverviewResponse } from '@shared/api.interface';

const statusLabel: Record<string, string> = {
  pending: '待安排',
  scheduled: '已安排',
  approved: '已通过',
  rejected: '已拒绝',
};

const statusVariant: Record<string, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  pending: 'secondary',
  scheduled: 'default',
  approved: 'secondary',
  rejected: 'destructive',
};

const STAGE_ORDER: Record<string, number> = {
  '融入期': 1,
  '实战期': 2,
  '独立期': 3,
  '巩固期': 4,
};

const DefenseAdminPage: React.FC = () => {
  const [data, setData] = useState<DefenseOverviewResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [convertTarget, setConvertTarget] = useState<DefenseOverviewItem | null>(null);
  const [converting, setConverting] = useState(false);
  const [applications, setApplications] = useState<DefenseApplicationItem[]>([]);
  const [rejectTarget, setRejectTarget] = useState<DefenseApplicationItem | null>(null);
  const [rejectComment, setRejectComment] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchDefenseOverview();
      setData(result);
    } catch (err) {
      setError(getApiErrorMessage(err, '转正答辩数据加载失败'));
      logger.error('获取转正答辩概览失败', err);
    }
    try {
      const apps = await fetchDefenseApplications();
      setApplications(apps);
    } catch (err) {
      logger.error('获取转正面试申请列表失败', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleConvert = useCallback(async () => {
    if (!convertTarget) return;
    setConverting(true);
    try {
      await updateNewcomer(convertTarget.id, { status: '已转正' });
      toast.success(`${convertTarget.name} 已标记为转正`);
      setConvertTarget(null);
      await loadData();
    } catch (err) {
      toast.error(getApiErrorMessage(err, '标记转正失败'));
    } finally {
      setConverting(false);
    }
  }, [convertTarget, loadData]);

  const handleRejectConfirm = useCallback(async () => {
    if (!rejectTarget) return;
    try {
      await reviewDefenseApplication(rejectTarget.id, 'rejected', rejectComment || undefined);
      toast.success('已拒绝面试申请');
      setRejectTarget(null);
      setRejectComment('');
      const apps = await fetchDefenseApplications();
      setApplications(apps);
    } catch (err) {
      toast.error(getApiErrorMessage(err, '操作失败'));
    }
  }, [rejectTarget, rejectComment]);

  const handleSchedule = useCallback(async (id: string) => {
    try {
      await reviewDefenseApplication(id, 'scheduled');
      toast.success('已安排面试');
      const apps = await fetchDefenseApplications();
      setApplications(apps);
    } catch (err) {
      toast.error(getApiErrorMessage(err, '操作失败'));
    }
  }, []);

  const filteredItems = (data?.items ?? []).filter((item) => {
    if (!search.trim()) return true;
    const keyword = search.trim().toLowerCase();
    return (
      item.name.toLowerCase().includes(keyword)
    );
  });

  const sortedItems = [...filteredItems].sort((a, b) => {
    if (a.defenseReady !== b.defenseReady) return a.defenseReady ? -1 : 1;
    return (STAGE_ORDER[a.stage] ?? 99) - (STAGE_ORDER[b.stage] ?? 99);
  });

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
        <div className="space-y-1">
          <Skeleton className="h-8 w-40 rounded-md" />
          <Skeleton className="h-4 w-64 rounded-md" />
        </div>
        <div className="grid grid-cols-3 gap-4">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-64 rounded-xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto w-full max-w-[1400px] p-6">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex flex-col items-start gap-4 p-6">
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="outline" onClick={() => void loadData()}>重新加载</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = data?.stats ?? { total: 0, readyCount: 0, convertedCount: 0 };

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
      {/* 页面标题 */}
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <Award className="h-7 w-7 text-primary" />
          转正答辩管理
        </h1>
        <p className="text-sm text-muted-foreground">
          查看所有新人的答辩准备进度，标记已就绪新人完成转正
        </p>
      </header>

      {/* 统计卡带 */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
              <UsersIcon className="size-5 text-primary" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">在培总人数</p>
              <p className="font-display text-2xl font-bold text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-success/10">
              <CheckCircle2 className="size-5 text-success" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">答辩就绪</p>
              <p className="font-display text-2xl font-bold text-success">{stats.readyCount}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border shadow-sm">
          <CardContent className="flex items-center gap-4 p-5">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent/10">
              <Award className="size-5 text-accent" />
            </div>
            <div>
              <p className="text-xs font-medium text-muted-foreground">已转正</p>
              <p className="font-display text-2xl font-bold text-foreground">{stats.convertedCount}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索 */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="按姓名搜索..."
          value={search}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* 新人列表 */}
      <div className="space-y-3">
        {sortedItems.length === 0 && (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="flex flex-col items-center gap-2 py-12 text-center">
              <UsersIcon className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">
                {search.trim() ? '未找到匹配的新人' : '暂无新人数据'}
              </p>
            </CardContent>
          </Card>
        )}
        {sortedItems.map((item) => (
          <Card key={item.id} className="rounded-xl border-border shadow-sm transition-shadow hover:shadow-md">
            <CardContent className="flex flex-wrap items-center gap-4 p-5">
              {/* 基本信息 */}
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                  <span className="text-sm font-semibold text-primary">{item.name.slice(-2)}</span>
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="truncate text-sm font-semibold text-foreground">{item.name}</span>
                    {item.defenseReady && item.status === '在培' && (
                      <Badge variant="secondary" className="bg-success/10 text-success text-[11px] font-medium border-0">
                        可转正
                      </Badge>
                    )}
                    {item.status === '已转正' && (
                      <Badge variant="secondary" className="bg-accent/10 text-accent text-[11px] font-medium border-0">
                        已转正
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{item.position}</span>
                    <span>·</span>
                    <span>入职 {item.dayCount} 天</span>
                    <span>·</span>
                    <span className="font-medium text-foreground/70">{item.stage}</span>
                  </div>
                </div>
              </div>

              {/* 进度信息 */}
              <div className="flex items-center gap-6 text-xs">
                <div className="text-center">
                  <p className="font-display text-sm font-semibold text-foreground">{item.totalPassItems}/3</p>
                  <p className="text-muted-foreground">通关项</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-sm font-semibold text-foreground">{item.completedAssessments}/3</p>
                  <p className="text-muted-foreground">节点考核</p>
                </div>
              </div>

              {/* 导师 */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <UsersIcon className="size-3.5" />
                <span>{item.mentorName}</span>
              </div>

              {/* 操作 */}
              {item.defenseReady && item.status === '在培' && (
                <Button
                  size="sm"
                  className="shrink-0"
                  onClick={() => setConvertTarget(item)}
                >
                  <Award className="mr-1 size-3.5" />
                  标记转正
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 转正面试申请 */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-lg font-bold text-foreground">
          <Clock className="size-5 text-primary" />
          转正面试申请
        </h2>
        {applications.length === 0 ? (
          <Card className="rounded-xl border-border shadow-sm">
            <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
              <Clock className="size-8 text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">暂无面试申请</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {applications.map((app) => (
              <Card key={app.id} className="rounded-xl border-border shadow-sm">
                <CardContent className="flex flex-wrap items-center gap-4 p-5">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-sm font-semibold text-primary">
                        {app.newcomerName?.slice(-2) ?? '--'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="text-sm font-semibold text-foreground">{app.newcomerName}</span>
                      <Badge
                        variant={statusVariant[app.status] ?? 'secondary'}
                        className="ml-2 text-[11px] font-medium border-0"
                      >
                        {statusLabel[app.status] ?? app.status}
                      </Badge>
                    </div>
                    </div>
                  <div className="flex items-center gap-2">
                    {/* 通知状态 */}
                    {app.notifiedAt ? (
                      app.notifyFailed ? (
                        <span className="inline-flex items-center gap-1 text-xs text-destructive">
                          <span className="inline-block size-1.5 rounded-full bg-destructive" />
                          通知失败
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-success">
                          <span className="inline-block size-1.5 rounded-full bg-success" />
                          已通知张羽驰
                        </span>
                      )
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                        <span className="inline-block size-1.5 rounded-full bg-muted-foreground/40" />
                        待通知
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {app.createdAt ? new Date(app.createdAt).toLocaleDateString('zh-CN') : '--'}
                  </div>
                  <div className="flex items-center gap-2">
                    {app.status === 'pending' && (
                      <>
                        <Button size="sm" onClick={() => void handleSchedule(app.id)}>
                          安排面试
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-destructive border-destructive/30 hover:bg-destructive/10"
                          onClick={() => setRejectTarget(app)}
                        >
                          拒绝
                        </Button>
                      </>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* 拒绝面试申请弹窗 */}
      <Dialog open={rejectTarget != null} onOpenChange={(open) => { if (!open) { setRejectTarget(null); setRejectComment(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>拒绝面试申请</DialogTitle>
            <DialogDescription>
              确定拒绝 <span className="font-semibold text-foreground">{rejectTarget?.newcomerName}</span> 的转正面试申请？请填写拒绝原因。
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="填写拒绝原因（可选）"
            value={rejectComment}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setRejectComment(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setRejectTarget(null); setRejectComment(''); }}>取消</Button>
            <Button variant="destructive" onClick={() => void handleRejectConfirm()}>确认拒绝</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 标记转正确认弹窗 */}
      <Dialog open={convertTarget != null} onOpenChange={(open) => { if (!open) setConvertTarget(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>确认转正</DialogTitle>
            <DialogDescription>
              确定将 <span className="font-semibold text-foreground">{convertTarget?.name}</span> 标记为已转正？此操作可在人员清单中撤回。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConvertTarget(null)}>取消</Button>
            <Button onClick={() => void handleConvert()} disabled={converting}>
              {converting ? '处理中...' : '确认转正'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DefenseAdminPage;