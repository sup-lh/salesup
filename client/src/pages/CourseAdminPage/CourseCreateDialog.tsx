import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFieldArray, useForm } from 'react-hook-form';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { CreateCourseRequest } from '@shared/api.interface';
import { getApiErrorMessage } from '@client/src/utils/api-error';
import { course as courseApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
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
import { Textarea } from '@client/src/components/ui/textarea';

const DEFAULT_ITEM_ROWS = 3;

const courseFormSchema = z.object({
  title: z.string().min(1, '课程标题不能为空').max(100, '标题不能超过 100 字'),
  keyPoints: z
    .string()
    .min(1, '学习要点不能为空')
    .max(500, '学习要点不能超过 500 字'),
  requirement: z
    .string()
    .min(1, '通关要求不能为空')
    .max(500, '通关要求不能超过 500 字'),
  items: z
    .array(z.object({ title: z.string().min(1, '小节标题不能为空') }))
    .min(1, '至少需要一个小节'),
});

type CourseFormData = z.infer<typeof courseFormSchema>;

interface CourseCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
}

const CourseCreateDialog = ({
  open,
  onOpenChange,
  onCreated,
}: CourseCreateDialogProps) => {
  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseFormSchema),
    defaultValues: {
      title: '',
      keyPoints: '',
      requirement: '',
      items: Array.from({ length: DEFAULT_ITEM_ROWS }, () => ({ title: '' })),
    },
  });

  const itemArray = useFieldArray({ control: form.control, name: 'items' });
  const submitting = form.formState.isSubmitting;

  useEffect(() => {
    if (open) {
      form.reset({
        title: '',
        keyPoints: '',
        requirement: '',
        items: Array.from({ length: DEFAULT_ITEM_ROWS }, () => ({ title: '' })),
      });
    }
  }, [open, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      const payload: CreateCourseRequest = {
        title: data.title,
        keyPoints: data.keyPoints,
        requirement: data.requirement,
        items: data.items.map((item) => ({ title: item.title })),
      };
      await courseApi.createAdminCourse(payload);
      toast.success('课程已创建');
      onOpenChange(false);
      onCreated();
    } catch (e) {
      toast.error(getApiErrorMessage(e, '课程创建失败，请稍后重试'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>新建课程</DialogTitle>
          <DialogDescription>
            填写课程基础信息与小节标题，保存后新人端课程中心自动生效
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={void handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    课程标题 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input placeholder="如：销售流程与工具入门" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="keyPoints"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    学习要点 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="该模块需要掌握的核心要点"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requirement"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    通关要求 <span className="text-destructive">*</span>
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      rows={2}
                      placeholder="如：考核得分 80 分及以上"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FormLabel>
                  小节标题 <span className="text-destructive">*</span>
                </FormLabel>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => itemArray.append({ title: '' })}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  加一行
                </Button>
              </div>
              {itemArray.fields.map((item, index) => (
                <FormField
                  key={item.id}
                  control={form.control}
                  name={`items.${index}.title` as const}
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-6 shrink-0 text-sm font-medium text-muted-foreground">
                          {index + 1}.
                        </span>
                        <FormControl>
                          <Input
                            placeholder={`小节 ${index + 1} 标题`}
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          disabled={itemArray.fields.length <= 1}
                          onClick={() => itemArray.remove(index)}
                        >
                          <Trash2 className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                {submitting ? '保存中…' : '创建课程'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default CourseCreateDialog;
