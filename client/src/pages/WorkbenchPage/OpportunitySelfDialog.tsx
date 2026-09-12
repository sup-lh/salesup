import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Briefcase } from 'lucide-react';
import { z } from 'zod';
import { toast } from 'sonner';
import { Button } from '@client/src/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@client/src/components/ui/card';
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
  createOpportunitySelf,
  getOpportunitySelfSummary,
} from '@client/src/api/opportunity';
import type { RecordMaterial } from '@shared/api.interface';
import MaterialsInput from '../CoachingPage/MaterialsInput';
import { DatePickerPopover } from '../CoachingPage/shared';

export const OPPORTUNITY_STAGES: string[] = [
  '初步接触',
  '需求确认',
  '方案报价',
  '商务谈判',
  '赢单',
  '输单',
];

const opportunityFormSchema = z.object({
  name: z.string().min(1, '请填写商机名称'),
  customer: z.string().min(1, '请填写客户名称'),
  amount: z.coerce.number().min(0, '金额不能为负数'),
  stage: z.enum([
    '初步接触',
    '需求确认',
    '方案报价',
    '商务谈判',
    '赢单',
    '输单',
  ]),
  recordDate: z.string().min(1, '请选择记录日期'),
  expectedDate: z.string(),
  remark: z.string(),
});

type OpportunityFormData = z.infer<typeof opportunityFormSchema>;

const OPPORTUNITY_FORM_DEFAULTS: OpportunityFormData = {
  name: '',
  customer: '',
  amount: 0,
  stage: '初步接触',
  recordDate: '',
  expectedDate: '',
  remark: '',
};

interface OpportunitySelfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: () => void;
}

export function OpportunitySelfDialog({
  open,
  onOpenChange,
  onUploaded,
}: OpportunitySelfDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<RecordMaterial[]>([]);

  const form = useForm<OpportunityFormData>({
    resolver: zodResolver(opportunityFormSchema),
    defaultValues: OPPORTUNITY_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(OPPORTUNITY_FORM_DEFAULTS);
      setMaterials([]);
    }
  }, [open, form]);

  const handleSubmit = async (data: OpportunityFormData) => {
    setSubmitting(true);
    try {
      await createOpportunitySelf({
        name: data.name,
        customer: data.customer,
        amount: data.amount,
        stage: data.stage,
        recordDate: data.recordDate,
        expectedDate: data.expectedDate || undefined,
        remark: data.remark || undefined,
        materials: materials.length > 0 ? materials : undefined,
      });
      toast.success('商机已上传，数据看板统计已同步');
      onOpenChange(false);
      onUploaded();
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传商机</DialogTitle>
          <DialogDescription>
            录入商机进展，上传后会同步计入数据看板的关键动作统计
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      商机名称 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="如：XX公司数字化采购项目" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="customer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      客户名称 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="请输入客户名称" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      预计金额（元） <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="1000"
                        placeholder="如 50000"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="stage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      销售阶段 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="请选择阶段" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {OPPORTUNITY_STAGES.map((stage: string) => (
                          <SelectItem key={stage} value={stage}>
                            {stage}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                      记录日期 <span className="text-destructive">*</span>
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
                name="expectedDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>预计成交日期</FormLabel>
                    <DatePickerPopover
                      value={field.value}
                      onChange={field.onChange}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="remark"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>备注</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="补充说明（选填）"
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
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? '上传中...' : '上传'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default OpportunitySelfDialog;

/** 工作台右侧的商机上传入口卡片 */
export function OpportunitySelfCard({
  onUpload,
  refreshKey,
}: {
  onUpload: () => void;
  refreshKey: number;
}) {
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    getOpportunitySelfSummary()
      .then((summary) => {
        if (!cancelled) setCount(summary.count);
      })
      .catch(() => {
        if (!cancelled) setCount(null);
      });
    return () => {
      cancelled = true;
    };
  }, [refreshKey]);

  return (
    <Card className="rounded-xl border-border bg-card shadow-sm" data-ai-section-type="card-list">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Briefcase className="size-4 text-primary" />
          商机上传
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          {count === null
            ? '及时录入商机进展，看板会同步统计商机录入量'
            : `已累计录入 ${count} 条商机，看板关键动作统计已同步`}
        </p>
        <Button className="w-full" onClick={onUpload}>
          上传商机
        </Button>
      </CardContent>
    </Card>
  );
}
