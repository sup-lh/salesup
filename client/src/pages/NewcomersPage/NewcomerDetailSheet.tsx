import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import { BadgeCheck, Circle, Loader2, Save } from 'lucide-react';
import { logger } from '@/lib/logger';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { UserSelect } from '@/components/business-ui/user-select';
import { newcomer as newcomerApi } from '@/api';
import type {
  AssessmentRecord,
  NewcomerDetail,
  NewcomerSummary,
  UpdateNewcomerRequest,
} from '@shared/api.interface';
import { NEWCOMER_STATUS_OPTIONS } from './newcomer-options';
import { NewcomerDatePicker } from './NewcomerDatePicker';

const RESULT_BADGE_CLASS: Record<AssessmentRecord['result'], string> = {
  通过: 'bg-[hsl(152_60%_42%)] text-white',
  待改进: 'bg-[hsl(38_92%_50%)] text-white',
  不通过: 'bg-[hsl(4_80%_58%)] text-white',
};

const STATUS_BADGE_CLASS: Record<NewcomerSummary['status'], string> = {
  在培: 'bg-primary/10 text-primary',
  已转正: 'bg-[hsl(152_60%_42%)] text-white',
  已离职: 'bg-secondary text-muted-foreground',
};

interface NewcomerDetailSheetProps {
  newcomerId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

/** 「档案详情」抽屉：基本信息、可编辑目标契约、考核留档与闯关明细 */
export function NewcomerDetailSheet({
  newcomerId,
  open,
  onOpenChange,
  onChanged,
}: NewcomerDetailSheetProps) {
  const [detail, setDetail] = useState<NewcomerDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [mentorId, setMentorId] = useState<string | null>(null);
  const [goalContract, setGoalContract] = useState('');
  const [status, setStatus] = useState<NewcomerSummary['status']>('在培');
  const [firstDealDate, setFirstDealDate] = useState('');

  const loadDetail = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const result = await newcomerApi.fetchNewcomerDetail(id);
      setDetail(result);
    } catch {
      toast.error('获取新人详情失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open && newcomerId) {
      void loadDetail(newcomerId);
    }
    if (!open) {
      setDetail(null);
    }
  }, [open, newcomerId, loadDetail]);

  useEffect(() => {
    if (detail) {
      setMentorId(detail.mentorId);
      setGoalContract(detail.goalContract);
      setStatus(detail.status);
      setFirstDealDate(detail.firstDealDate ?? '');
    }
  }, [detail]);

  const handleSave = async () => {
    if (!detail) return;
    setSaving(true);
    const payload: UpdateNewcomerRequest = {
      mentorId,
      goalContract,
      status,
      firstDealDate: firstDealDate || null,
    };
    try {
      await newcomerApi.updateNewcomer(detail.id, payload);
      logger.info('档案更新成功', payload);
      toast.success('档案已更新');
      await loadDetail(detail.id);
      onChanged();
    } catch {
      toast.error('档案保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-2xl">
        <SheetHeader className="pb-2">
          <SheetTitle className="flex items-center gap-2">
            {detail ? `${detail.name} · 档案` : '新人档案'}
            {detail ? (
              <span
                className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_BADGE_CLASS[detail.status]}`}
              >
                {detail.status}
              </span>
            ) : null}
          </SheetTitle>
          <SheetDescription>
            {detail
              ? `${detail.position} · 入职 ${detail.hireDate} · ${detail.stage}（第 ${detail.dayCount} 天）`
              : '加载中…'}
          </SheetDescription>
        </SheetHeader>

        {loading || !detail ? (
          <div className="space-y-4 p-4">
            {/* 基本信息骨架 */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <Skeleton className="mb-4 h-4 w-20 rounded-md" />
              <div className="grid grid-cols-2 gap-4">
                {[0, 1, 2, 3].map((i: number) => (
                  <div key={i}>
                    <Skeleton className="mb-1 h-3 w-16 rounded-md" />
                    <Skeleton className="h-5 w-28 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            {/* 成长记录骨架 */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <Skeleton className="mb-4 h-4 w-24 rounded-md" />
              <div className="space-y-3">
                {[0, 1].map((i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Skeleton className="size-5 rounded" />
                    <Skeleton className="h-4 flex-1 rounded-md" />
                    <Skeleton className="h-3 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
            {/* 考核记录骨架 */}
            <div className="rounded-xl border bg-card p-5 shadow-sm">
              <Skeleton className="mb-4 h-4 w-24 rounded-md" />
              <div className="space-y-3">
                {[0, 1, 2].map((i: number) => (
                  <div key={i} className="flex items-center gap-3 rounded-lg bg-muted/30 p-3">
                    <Skeleton className="size-4 rounded-full" />
                    <Skeleton className="h-4 flex-1 rounded-md" />
                    <Skeleton className="h-5 w-14 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6 p-4 pb-10">
            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">基本信息</h3>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                <InfoItem label="岗位" value={detail.position} />
                <InfoItem label="入职日期" value={detail.hireDate} />
                <InfoItem label="当前阶段" value={`${detail.stage} · 第 ${detail.dayCount} 天`} />
                <InfoItem label="带教师傅" value={detail.mentorName} />
                <InfoItem label="首单日期" value={detail.firstDealDate ?? '暂无'} />
                <InfoItem label="闯关进度" value={`${detail.challengeProgress}%`} />
              </div>
              <Separator className="my-4" />
              <div className="flex flex-wrap items-center gap-2">
                {detail.passStatus.map((item) => (
                  <span
                    key={item.key}
                    className={
                      item.passed
                        ? 'inline-flex items-center gap-1 rounded-full bg-[hsl(152_60%_42%)] px-3 py-1 text-xs font-semibold text-white'
                        : 'inline-flex items-center gap-1 rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-muted-foreground'
                    }
                  >
                    {item.passed ? (
                      <BadgeCheck className="h-3.5 w-3.5" />
                    ) : (
                      <Circle className="h-3.5 w-3.5" />
                    )}
                    {item.label}
                    {item.passedAt ? (
                      <span className="opacity-80">
                        {dayjs(item.passedAt).format('MM-DD')}
                      </span>
                    ) : null}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">
                档案维护（目标契约 / 带教 / 状态）
              </h3>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 basis-56 space-y-1.5">
                    <p className="text-xs text-muted-foreground">带教师傅</p>
                    <UserSelect
                      value={mentorId}
                      onChange={(value) => setMentorId(value ?? null)}
                      placeholder="选择或更换带教师傅"
                    />
                  </div>
                  <div className="flex-1 basis-40 space-y-1.5">
                    <p className="text-xs text-muted-foreground">状态</p>
                    <Select
                      value={status}
                      onValueChange={(value) => {
                        const option = NEWCOMER_STATUS_OPTIONS.find((o) => o.value === value);
                        if (option) setStatus(option.value);
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="请选择状态" />
                      </SelectTrigger>
                      <SelectContent>
                        {NEWCOMER_STATUS_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 basis-40 space-y-1.5">
                    <p className="text-xs text-muted-foreground">首单日期</p>
                    <NewcomerDatePicker
                      value={firstDealDate}
                      onChange={setFirstDealDate}
                      placeholder="选择首单成交日期"
                      clearable
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <p className="text-xs text-muted-foreground">目标契约</p>
                  <Textarea
                    value={goalContract}
                    onChange={(event) => setGoalContract(event.target.value)}
                    placeholder="填写培养目标与约定"
                    rows={4}
                  />
                </div>
                <Button onClick={handleSave} disabled={saving}>
                  {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  <Save className="mr-1 h-4 w-4" />
                  保存档案
                </Button>
              </div>
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">考核留档</h3>
              {detail.assessments.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无考核记录</p>
              ) : (
                <ul className="space-y-3">
                  {detail.assessments.map((record) => (
                    <li
                      key={record.id}
                      className="flex flex-wrap items-start gap-3 rounded-lg border p-3"
                    >
                      <Badge
                        className={`rounded-full ${RESULT_BADGE_CLASS[record.result]}`}
                      >
                        {record.node} · {record.result}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="break-words text-sm text-foreground">
                          {record.comment || '（无评语）'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {record.recordDate} · 考核人 {record.assessorName}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="rounded-xl border bg-card p-6 shadow-sm">
              <h3 className="mb-4 text-sm font-semibold text-foreground">闯关任务明细</h3>
              {detail.challengeTasks.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无闯关任务</p>
              ) : (
                <ul className="space-y-2">
                  {detail.challengeTasks.map((task) => (
                    <li
                      key={`${task.stage}-${task.title}`}
                      className="flex flex-wrap items-center gap-2 rounded-lg border p-3"
                    >
                      {task.completed ? (
                        <BadgeCheck className="h-4 w-4 shrink-0 text-[hsl(152_60%_42%)]" />
                      ) : (
                        <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />
                      )}
                      <span className="min-w-0 flex-1 break-words text-sm font-medium text-foreground">
                        {task.title}
                        <span className="ml-2 text-xs font-normal text-muted-foreground">
                          {task.category} · {task.stage} · 第 {task.dueDay} 天前
                        </span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {task.completedAt
                          ? dayjs(task.completedAt).format('YYYY-MM-DD HH:mm')
                          : '未完成'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

export default NewcomerDetailSheet;
