import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { z } from 'zod';
import { logger } from '@/lib/logger';
import { course as courseApi } from '@client/src/api';
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
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';

const QUIZ_OPTION_COUNT = 4;

const quizFormSchema = z.object({
  courseId: z.string().min(1, '请选择课程模块'),
  question: z.string().min(1, '题干不能为空').max(500, '题干不能超过 500 字'),
  options: z
    .array(z.string().min(1, '选项不能为空'))
    .length(QUIZ_OPTION_COUNT, '需填写全部选项'),
  correctIndex: z.coerce
    .number()
    .int()
    .min(0, '请选择正确答案')
    .max(QUIZ_OPTION_COUNT - 1),
});

type QuizFormData = z.infer<typeof quizFormSchema>;

const OPTION_LABELS = ['A', 'B', 'C', 'D'];

interface QuizFormProps {
  courses: Array<{ id: string; title: string }>;
  onCreated: () => void;
}

const QuizForm = ({ courses, onCreated }: QuizFormProps) => {
  const form = useForm<QuizFormData>({
    resolver: zodResolver(quizFormSchema),
    defaultValues: {
      courseId: courses[0]?.id ?? '',
      question: '',
      options: ['', '', '', ''],
      correctIndex: 0,
    },
  });

  const submitting = form.formState.isSubmitting;

  const handleSubmit = form.handleSubmit(async (data) => {
    try {
      await courseApi.createQuiz({
        courseId: data.courseId,
        question: data.question,
        options: data.options,
        answer: data.options[data.correctIndex],
      });
      toast.success('考题已录入');
      form.reset({
        courseId: data.courseId,
        question: '',
        options: ['', '', '', ''],
        correctIndex: 0,
      });
      onCreated();
    } catch (e) {
      logger.error('录入考题失败', e);
      toast.error('考题录入失败，请稍后重试');
    }
  });

  if (courses.length === 0) {
    return (
      <p className="py-4 text-center text-sm text-muted-foreground">
        暂无课程模块，请先在课程中心维护模块
      </p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          control={form.control}
          name="courseId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                课程模块 <span className="text-destructive">*</span>
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择模块" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {courses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
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
          name="question"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                题干 <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <Input placeholder="请输入题目内容" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="correctIndex"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                选项（勾选正确答案） <span className="text-destructive">*</span>
              </FormLabel>
              <FormControl>
                <RadioGroup
                  value={String(field.value)}
                  onValueChange={field.onChange}
                  className="gap-0"
                >
                  {OPTION_LABELS.map((label, index) => (
                    <div
                      key={label}
                      className="flex items-center gap-3 border-b border-border py-2 last:border-b-0"
                    >
                      <RadioGroupItem value={String(index)} />
                      <span className="w-4 shrink-0 text-sm font-medium text-muted-foreground">
                        {label}
                      </span>
                      <FormField
                        control={form.control}
                        name={`options.${index}` as const}
                        render={({ field: optField }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input
                                placeholder={`选项 ${label} 内容`}
                                {...optField}
                                value={optField.value ?? ''}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  ))}
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" disabled={submitting}>
          {submitting ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          {submitting ? '提交中…' : '录入考题'}
        </Button>
      </form>
    </Form>
  );
};

export default QuizForm;
