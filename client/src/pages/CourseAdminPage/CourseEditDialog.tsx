import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import type { AdminCourseSummary, UpdateCourseRequest } from '@shared/api.interface';
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
import CourseItemEditor from './CourseItemEditor';

const courseEditSchema = z.object({
  title: z.string().min(1, '课程标题不能为空').max(100, '标题不能超过 100 字'),
  keyPoints: z
    .string()
    .min(1, '学习要点不能为空')
    .max(500, '学习要点不能超过 500 字'),
  requirement: z
    .string()
    .min(1, '通关要求不能为空')
    .max(500, '通关要求不能超过 500 字'),
});

type CourseEditFormData = z.infer<typeof courseEditSchema>;

interface CourseEditDialogProps {
  course: AdminCourseSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const CourseEditDialog = ({
  course,
  open,
  onOpenChange,
  onChanged,
}: CourseEditDialogProps) => {
  const form = useForm<CourseEditFormData>({
    resolver: zodResolver(courseEditSchema),
    defaultValues: {
      title: course.title,
      keyPoints: course.keyPoints,
      requirement: course.requirement,
    },
  });

  const submitting = form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (data) => {
    const patch: UpdateCourseRequest = {};
    if (data.title !== course.title) patch.title = data.title;
    if (data.keyPoints !== course.keyPoints) patch.keyPoints = data.keyPoints;
    if (data.requirement !== course.requirement) {
      patch.requirement = data.requirement;
    }
    if (Object.keys(patch).length === 0) {
      toast.info('基础信息没有变更');
      onOpenChange(false);
      return;
    }
    try {
      await courseApi.updateAdminCourse(course.id, patch);
      toast.success('课程信息已更新');
      onOpenChange(false);
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, '课程更新失败，请稍后重试'));
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>编辑课程</DialogTitle>
          <DialogDescription>
            修改基础信息仅提交有变更的字段；小节增删即时生效于新人端
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Form {...form}>
            <form
              id="course-edit-form"
              onSubmit={void handleSubmit}
              className="space-y-4"
            >
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      课程标题 <span className="text-destructive">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="课程标题" {...field} />
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
                      <Textarea rows={3} placeholder="学习要点" {...field} />
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
                      <Textarea rows={2} placeholder="通关要求" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
                    <Save className="mr-1 h-4 w-4" />
                  )}
                  {submitting ? '保存中…' : '保存变更'}
                </Button>
              </DialogFooter>
            </form>
          </Form>

          <div className="border-t border-border pt-4">
            <CourseItemEditor
              courseId={course.id}
              items={course.items}
              onChanged={onChanged}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CourseEditDialog;
