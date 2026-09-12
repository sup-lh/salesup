import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type {
  ChallengeTaskTemplate,
  UpdateChallengeTaskRequest,
} from '@shared/api.interface';
import { updateTaskTemplate } from '@client/src/api/challenge';
import { Button } from '@client/src/components/ui/button';
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

const STAGE_OPTIONS = [
  { value: 'onboarding', label: '融入期' },
  { value: 'practice', label: '实战期' },
  { value: 'independent', label: '独立期' },
  { value: 'consolidation', label: '巩固期' },
];

const taskFormSchema = z.object({
  stage: z.string().min(1, '请选择阶段'),
  title: z.string().min(1, '任务标题不能为空').max(255, '不能超过 255 字'),
  category: z.string().min(1, '任务类别不能为空').max(100, '不能超过 100 字'),
  standard: z.string().min(1, '达标标准不能为空').max(255, '不能超过 255 字'),
  dueDay: z.coerce
    .number()
    .int('截止天数需为整数')
    .min(1, '截止天数需为 1-90')
    .max(90, '截止天数需为 1-90'),
});

type TaskFormData = z.infer<typeof taskFormSchema>;

interface TaskEditFormResult {
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: number;
}

interface TaskEditFormProps {
  task: ChallengeTaskTemplate;
  onSaved: (updated: UpdateChallengeTaskRequest) => void;
  onCancel: () => void;
}

const TaskEditForm = ({ task, onSaved, onCancel }: TaskEditFormProps) => {
  const form = useForm<TaskFormData>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      stage: task.stage,
      title: task.title,
      category: task.category,
      standard: task.standard,
      dueDay: task.dueDay,
    },
  });

  const handleSubmit = form.handleSubmit(async (data: TaskFormData) => {
    const payload: TaskEditFormResult = {
      stage: data.stage ?? '',
      title: data.title ?? '',
      category: data.category ?? '',
      standard: data.standard ?? '',
      dueDay: data.dueDay ?? 0,
    };
    try {
      await updateTaskTemplate(task.id, payload);
      toast.success('任务已更新');
      onSaved(payload);
    } catch {
      toast.error('任务更新失败，请稍后重试');
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={void handleSubmit} className="space-y-3 pt-1">
        <div className="flex flex-wrap gap-3">
          <FormField
            control={form.control}
            name="stage"
            render={({ field }) => (
              <FormItem className="w-32">
                <FormLabel>阶段</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="选择阶段" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {STAGE_OPTIONS.map((option) => (
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
            name="dueDay"
            render={({ field }) => (
              <FormItem className="w-28">
                <FormLabel>截止天数</FormLabel>
                <FormControl>
                  <Input type="number" min={1} max={90} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem className="min-w-40 flex-1">
                <FormLabel>任务类别</FormLabel>
                <FormControl>
                  <Input placeholder="如：客户触达" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>任务标题</FormLabel>
              <FormControl>
                <Input placeholder="请输入任务标题" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="standard"
          render={({ field }) => (
            <FormItem>
              <FormLabel>达标标准</FormLabel>
              <FormControl>
                <Input placeholder="请输入达标标准" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="outline" onClick={onCancel}>
            取消
          </Button>
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? (
              <Loader2 className="mr-1 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-1 h-4 w-4" />
            )}
            保存
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default TaskEditForm;
