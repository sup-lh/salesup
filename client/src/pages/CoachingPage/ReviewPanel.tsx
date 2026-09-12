import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Target, TrendingUp, Trophy, User } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@client/src/components/ui/form';
import { Input } from '@client/src/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  createReviewRecord,
  listReviewRecords,
  type ReviewRecordItem,
} from '@client/src/api/coaching-review';
import type { RecordMaterial } from '@shared/api.interface';
import { cn } from '@/lib/utils';
import MaterialsInput, { MaterialLinks } from './MaterialsInput';
import {
  DatePickerPopover,
  FilterBar,
  ListEmpty,
  ListError,
  ListLoading,
  splitFirstSentence,
  type NewcomerOption,
} from './shared';

const REVIEW_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: '赢单复盘', label: '赢单复盘' },
  { value: '输单复盘', label: '输单复盘' },
  { value: '案例分享', label: '案例分享' },
];

const REVIEW_TYPE_META: Record<string, { bar: string; badge: string }> = {
  赢单复盘: { bar: 'bg-gold', badge: 'bg-gold text-gold-foreground' },
  输单复盘: {
    bar: 'bg-muted',
    badge: 'bg-muted text-muted-foreground',
  },
  案例分享: {
    bar: 'bg-accent',
    badge: 'bg-accent text-accent-foreground',
  },
};

const reviewFormSchema = z.object({
  newcomerId: z.string().min(1, '请选择关联新人'),
  type: z.enum(['赢单复盘', '输单复盘', '案例分享']),
  opportunity: z.string().min(1, '请填写关联客户/商机'),
  summary: z.string(),
  lessons: z.string().min(1, '请填写经验教训'),
  recordDate: z.string().min(1, '请选择日期'),
});

type ReviewFormData = z.infer<typeof reviewFormSchema>;

const REVIEW_FORM_DEFAULTS: ReviewFormData = {
  newcomerId: '',
  type: '赢单复盘',
  opportunity: '',
  summary: '',
  lessons: '',
  recordDate: '',
};

interface ReviewPanelProps {
  newcomerOptions: NewcomerOption[];
}

export function ReviewPanel({ newcomerOptions }: ReviewPanelProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<ReviewRecordItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<RecordMaterial[]>([]);

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewFormSchema),
    defaultValues: REVIEW_FORM_DEFAULTS,
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listReviewRecords({
        type: typeFilter === 'all' ? undefined : typeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        offset: 0,
        pageSize: 50,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError('复盘记录加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, startDate, endDate]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleCreate = async (data: ReviewFormData) => {
    setSubmitting(true);
    try {
      await createReviewRecord({
        newcomerId: data.newcomerId,
        type: data.type,
        opportunity: data.opportunity,
        summary: data.summary,
        lessons: data.lessons,
        recordDate: data.recordDate,
        materials: materials.length > 0 ? materials : undefined,
      });
      toast.success('复盘记录已保存');
      setDialogOpen(false);
      form.reset(REVIEW_FORM_DEFAULTS);
      setMaterials([]);
      await loadRecords();
    } catch {
      toast.error('保存失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setTypeFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // 首条赢单复盘金色高亮并置顶展示
  const sortedItems = [...items].sort(
    (a, b) => Number(b.isFirstWin ?? false) - Number(a.isFirstWin ?? false),
  );

  return (
    <section className="flex flex-col gap-4" data-ai-section-type="card-list">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
          <TrendingUp className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">复盘分享</h2>
          <p className="text-xs text-muted-foreground">
            赢单/输单复盘与案例分享沉淀
          </p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          共 {total} 条
        </span>
      </div>

      <FilterBar
        typeValue={typeFilter}
        typeOptions={REVIEW_TYPE_OPTIONS}
        onTypeChange={setTypeFilter}
        startDate={startDate}
        endDate={endDate}
        onStartDateChange={setStartDate}
        onEndDateChange={setEndDate}
        onReset={handleReset}
        onAdd={() => setDialogOpen(true)}
      />

      {loading ? (
        <ListLoading />
      ) : error ? (
        <ListError message={error} onRetry={() => void loadRecords()} />
      ) : sortedItems.length === 0 ? (
        <ListEmpty message="暂无复盘记录，点击右上角「新增记录」开始沉淀经验" />
      ) : (
        <div className="flex flex-col gap-4">
          {sortedItems.map((record) => {
            const meta = REVIEW_TYPE_META[record.type] ?? {
              bar: 'bg-muted',
              badge: 'bg-muted text-muted-foreground',
            };
            const [keySentence, rest] = splitFirstSentence(record.lessons);
            return (
              <Card
                key={record.id}
                className={cn(
                  'relative overflow-hidden rounded-xl shadow-sm',
                  record.isFirstWin && 'border-2 border-gold',
                )}
              >
                <div
                  className={cn('absolute inset-y-0 left-0 w-1', meta.bar)}
                />
                <div className="flex flex-col gap-3 p-6 pl-7">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge className={cn('rounded-full', meta.badge)}>
                      {record.type}
                    </Badge>
                    {record.isFirstWin && (
                      <Badge className="rounded-full bg-gold text-gold-foreground">
                        <Trophy className="size-3" />
                        首单复盘
                      </Badge>
                    )}
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      {record.sharerName}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      {record.recordDate}
                    </span>
                  </div>
                  <p className="flex items-center gap-1.5 text-sm font-medium break-words">
                    <Target className="size-4 shrink-0 text-accent" />
                    {record.opportunity}
                  </p>
                  {record.summary && (
                    <p className="text-xs leading-relaxed break-words text-muted-foreground">
                      背景回顾：{record.summary}
                    </p>
                  )}
                  <p className="text-sm leading-relaxed break-words">
                    <span className="font-medium text-primary">
                      {keySentence}
                    </span>
                    {rest}
                  </p>
                  <MaterialLinks materials={record.materials} />
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>新增复盘记录</DialogTitle>
            <DialogDescription>
              沉淀赢单/输单复盘或案例分享的经验教训
            </DialogDescription>
          </DialogHeader>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleCreate)}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="newcomerId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        关联新人{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择新人" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {newcomerOptions.map((option) => (
                            <SelectItem key={option.id} value={option.id}>
                              {option.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {newcomerOptions.length === 0 && (
                        <p className="text-xs text-muted-foreground">
                          暂无可关联的新人，请先在「新人管理」中录入
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        复盘类型 <span className="text-destructive">*</span>
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="请选择类型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="赢单复盘">赢单复盘</SelectItem>
                          <SelectItem value="输单复盘">输单复盘</SelectItem>
                          <SelectItem value="案例分享">案例分享</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="opportunity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      关联客户/商机{' '}
                      <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="如：某某公司数字化平台项目" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="summary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>背景回顾</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="成单/丢单的背景与过程（选填）"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lessons"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      经验教训 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="可复用的经验、踩过的坑与关键动作"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="recordDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      日期 <span className="text-destructive">*</span>
                    </FormLabel>
                    <DatePickerPopover
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <FormLabel className="mb-2 block text-sm">关联材料</FormLabel>
                <MaterialsInput value={materials} onChange={setMaterials} />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
                >
                  取消
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? '保存中...' : '保存'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </section>
  );
}
