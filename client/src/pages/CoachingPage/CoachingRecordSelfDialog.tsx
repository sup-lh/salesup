import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Video } from 'lucide-react';
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
import { createCoachingSelfRecord } from '@client/src/api/coaching-review';
import type { RecordMaterial } from '@shared/api.interface';
import MaterialsInput from './MaterialsInput';
import { DatePickerPopover } from './shared';

const coachingSelfFormSchema = z.object({
  type: z.enum(['拜访', '带教陪访']),
  recordDate: z.string().min(1, '请选择日期'),
  durationHours: z.coerce.number().min(0, '时长不能为负数'),
  content: z.string().min(1, '请填写拜访要点'),
  improvement: z.string(),
});

type CoachingSelfFormData = z.infer<typeof coachingSelfFormSchema>;

const COACHING_SELF_FORM_DEFAULTS: CoachingSelfFormData = {
  type: '拜访',
  recordDate: '',
  durationHours: 1,
  content: '',
  improvement: '',
};

interface CoachingRecordSelfDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CoachingRecordSelfDialog({
  open,
  onOpenChange,
}: CoachingRecordSelfDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const [materials, setMaterials] = useState<RecordMaterial[]>([]);

  const form = useForm<CoachingSelfFormData>({
    resolver: zodResolver(coachingSelfFormSchema),
    defaultValues: COACHING_SELF_FORM_DEFAULTS,
  });

  useEffect(() => {
    if (open) {
      form.reset(COACHING_SELF_FORM_DEFAULTS);
      setMaterials([]);
    }
  }, [open, form]);

  const handleSubmit = async (data: CoachingSelfFormData) => {
    setSubmitting(true);
    try {
      await createCoachingSelfRecord({
        type: data.type,
        recordDate: data.recordDate,
        durationHours: data.durationHours,
        content: data.content,
        improvement: data.improvement || undefined,
        materials: materials.length > 0 ? materials : undefined,
      });
      toast.success('拜访记录已上传');
      onOpenChange(false);
    } catch {
      toast.error('上传失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>上传拜访记录</DialogTitle>
          <DialogDescription>
            记录本次拜访或带教陪访的要点与改进动作
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
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      类型 <span className="text-destructive">*</span>
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
                        <SelectItem value="拜访">拜访</SelectItem>
                        <SelectItem value="带教陪访">带教陪访</SelectItem>
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
            </div>
            <FormField
              control={form.control}
              name="durationHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    时长（小时） <span className="text-destructive">*</span>
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
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    拜访要点 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={4}
                      placeholder="本次拜访/带教观察到的要点、亮点与问题"
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

export default CoachingRecordSelfDialog;

/** 工作台右侧的拜访记录入口卡片 */
export function CoachingSelfCard({
  onUpload,
}: {
  onUpload: () => void;
}) {
  return (
    <Card className="rounded-xl border-border border-l-4 border-l-primary bg-card shadow-sm" data-ai-section-type="card-list">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <Video className="size-4 text-primary" />
          拜访记录
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm leading-relaxed text-muted-foreground">
          完成拜访后及时上传记录，沉淀要点与改进动作
        </p>
        <Button className="w-full" onClick={onUpload}>
          上传拜访记录
        </Button>
      </CardContent>
    </Card>
  );
}
