import { useEffect } from 'react';
import dayjs from 'dayjs';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { newcomer as newcomerApi } from '@/api';
import type { CreateAssessmentRequest, NewcomerSummary } from '@shared/api.interface';
import {
  ASSESSMENT_NODE_OPTIONS,
  ASSESSMENT_RESULT_OPTIONS,
} from './newcomer-options';
import { NewcomerDatePicker } from './NewcomerDatePicker';

const assessmentSchema = z.object({
  node: z.string().min(1, '请选择考核节点'),
  result: z.string().min(1, '请选择评估结论'),
  recordDate: z.string().min(1, '请选择考核日期'),
  comment: z.string(),
});

type AssessmentFormData = z.infer<typeof assessmentSchema>;

interface AssessmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  newcomer: NewcomerSummary | null;
  onSubmitted: () => void;
}

/** 「节点考核」提交弹窗 */
export function AssessmentDialog({
  open,
  onOpenChange,
  newcomer,
  onSubmitted,
}: AssessmentDialogProps) {
  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentSchema),
    defaultValues: {
      node: '',
      result: '',
      recordDate: dayjs().format('YYYY-MM-DD'),
      comment: '',
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        node: '',
        result: '',
        recordDate: dayjs().format('YYYY-MM-DD'),
        comment: '',
      });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    if (!newcomer) return;
    const nodeOption = ASSESSMENT_NODE_OPTIONS.find((o) => o.value === data.node);
    const resultOption = ASSESSMENT_RESULT_OPTIONS.find((o) => o.value === data.result);
    if (!nodeOption || !resultOption) return;

    const request: CreateAssessmentRequest = {
      newcomerId: newcomer.id,
      node: nodeOption.value,
      result: resultOption.value,
      comment: data.comment.trim(),
      recordDate: data.recordDate,
    };
    try {
      await newcomerApi.createAssessment(request);
      logger.info('节点考核提交成功', request);
      toast.success(`已提交「${newcomer.name}」${nodeOption.value}考核记录`);
      onSubmitted();
      onOpenChange(false);
    } catch {
      toast.error('考核提交失败，请稍后重试');
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>节点考核</DialogTitle>
          <DialogDescription>
            {newcomer
              ? `${newcomer.name} · ${newcomer.position} · 入职 ${newcomer.hireDate}`
              : '为新人录入节点考核结论'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="flex flex-wrap gap-4">
              <FormField
                control={form.control}
                name="node"
                render={({ field }) => (
                  <FormItem className="flex-1 basis-40">
                    <FormLabel>
                      考核节点 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择节点" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSESSMENT_NODE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
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
                name="result"
                render={({ field }) => (
                  <FormItem className="flex-1 basis-40">
                    <FormLabel>
                      评估结论 <span className="text-destructive">*</span>
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="请选择结论" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ASSESSMENT_RESULT_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="recordDate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    考核日期 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <NewcomerDatePicker
                      value={field.value}
                      onChange={field.onChange}
                      placeholder="请选择考核日期"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="comment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>评语</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="记录本期考核观察、优势与改进建议"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                提交考核
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default AssessmentDialog;
