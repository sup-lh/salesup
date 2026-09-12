import { useCallback, useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { CalendarIcon, Clock, GraduationCap, User } from 'lucide-react';
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
  createCoachingRecord,
  listCoachingRecords,
} from '@client/src/api/coaching-review';
import type { CoachingRecord, RecordMaterial } from '@shared/api.interface';
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

const COACHING_TYPE_OPTIONS = [
  { value: 'all', label: '全部类型' },
  { value: '陪访', label: '陪访' },
  { value: '一对一辅导', label: '一对一辅导' },
];

const COACHING_TYPE_META: Record<string, { bar: string; badge: string }> = {
  陪访: { bar: 'bg-primary', badge: 'bg-primary text-primary-foreground' },
  一对一辅导: {
    bar: 'bg-success',
    badge: 'bg-success text-success-foreground',
  },
};

const coachingFormSchema = z.object({
  newcomerId: z.string().min(1, '请选择关联新人'),
  type: z.enum(['陪访', '一对一辅导']),
  recordDate: z.string().min(1, '请选择日期'),
  durationHours: z.coerce.number().min(0, '时长不能为负数'),
  content: z.string().min(1, '请填写辅导要点'),
  improvement: z.string(),
});

type CoachingFormData = z.infer<typeof coachingFormSchema>;

const COACHING_FORM_DEFAULTS: CoachingFormData = {
  newcomerId: '',
  type: '陪访',
  recordDate: '',
  durationHours: 1,
  content: '',
  improvement: '',
};

interface CoachingPanelProps {
  newcomerOptions: NewcomerOption[];
}

export function CoachingPanel({ newcomerOptions }: CoachingPanelProps) {
  const [typeFilter, setTypeFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [items, setItems] = useState<CoachingRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<RecordMaterial[]>([]);

  const form = useForm<CoachingFormData>({
    resolver: zodResolver(coachingFormSchema),
    defaultValues: COACHING_FORM_DEFAULTS,
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listCoachingRecords({
        type: typeFilter === 'all' ? undefined : typeFilter,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        offset: 0,
        pageSize: 50,
      });
      setItems(result.items);
      setTotal(result.total);
    } catch {
      setError('带教记录加载失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [typeFilter, startDate, endDate]);

  useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleCreate = async (data: CoachingFormData) => {
    setSubmitting(true);
    try {
      await createCoachingRecord({
        newcomerId: data.newcomerId,
        type: data.type,
        recordDate: data.recordDate,
        durationHours: data.durationHours,
        content: data.content,
        improvement: data.improvement || undefined,
        materials: materials.length > 0 ? materials : undefined,
      });
      toast.success('带教记录已保存');
      setDialogOpen(false);
      form.reset(COACHING_FORM_DEFAULTS);
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

  return (
    <section className="flex flex-col gap-4" data-ai-section-type="card-list">
      <div className="flex flex-wrap items-center gap-2">
        <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <GraduationCap className="size-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold">带教辅导</h2>
          <p className="text-xs text-muted-foreground">陪访与一对一辅导记录</p>
        </div>
        <span className="ml-auto text-sm text-muted-foreground">
          共 {total} 条
        </span>
      </div>

      <FilterBar
        typeValue={typeFilter}
        typeOptions={COACHING_TYPE_OPTIONS}
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
      ) : items.length === 0 ? (
        <ListEmpty message="暂无带教记录，点击右上角「新增记录」开始记录" />
      ) : (
        <div className="flex flex-col gap-4">
          {items.map((record) => {
            const meta = COACHING_TYPE_META[record.type] ?? {
              bar: 'bg-muted',
              badge: 'bg-muted text-muted-foreground',
            };
            const [keySentence, rest] = splitFirstSentence(record.content);
            return (
              <Card
                key={record.id}
                className="relative overflow-hidden rounded-xl shadow-sm"
              >
                <div
                  className={cn('absolute inset-y-0 left-0 w-1', meta.bar)}
                />
                <div className="flex flex-col gap-3 p-6 pl-7">
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <Badge className={cn('rounded-full', meta.badge)}>
                      {record.type}
                    </Badge>
                    <span className="flex items-center gap-1">
                      <User className="size-3.5" />
                      {record.coachName}
                    </span>
                    <span className="flex items-center gap-1">
                      <CalendarIcon className="size-3.5" />
                      {record.recordDate}
                    </span>
                    {record.durationHours > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="size-3.5" />
                        {record.durationHours} 小时
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-relaxed break-words">
                    <span className="font-medium text-primary">
                      {keySentence}
                    </span>
                    {rest}
                  </p>
                  {record.improvement && (
                    <p className="text-xs break-words text-muted-foreground">
                      改进动作：{record.improvement}
                    </p>
                  )}
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
            <DialogTitle>新增带教记录</DialogTitle>
            <DialogDescription>
              记录陪访或一对一辅导的要点与改进动作
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
                        带教类型 <span className="text-destructive">*</span>
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
                          <SelectItem value="陪访">陪访</SelectItem>
                          <SelectItem value="一对一辅导">一对一辅导</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
                <FormField
                  control={form.control}
                  name="durationHours"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        时长（小时）{' '}
                        <span className="text-destructive">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step="0.5"
                          placeholder="如 1.5"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      辅导要点 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        rows={4}
                        placeholder="本次陪访/辅导观察到的要点、亮点与问题"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="improvement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>改进动作</FormLabel>
                    <FormControl>
                      <Textarea
                        rows={2}
                        placeholder="下一步要改进的具体动作（选填）"
                        {...field}
                      />
                    </FormControl>
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
