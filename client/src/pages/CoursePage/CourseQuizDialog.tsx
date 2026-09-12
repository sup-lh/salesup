import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle, RotateCcw } from 'lucide-react';
import type { CourseModule } from '@shared/api.interface';
import { course } from '@client/src/api';
import { logger } from '@/lib/logger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@client/src/components/ui/radio-group';
import { Label } from '@client/src/components/ui/label';

interface CourseQuizDialogProps {
  module: CourseModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExamFinished: (passed: boolean, score: number) => void;
}

const CourseQuizDialog = ({
  module,
  open,
  onOpenChange,
  onExamFinished,
}: CourseQuizDialogProps) => {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setAnswers({});
      setResult(null);
      setError(null);
      setSubmitting(false);
    }
  }, [open, module]);

  if (!module) return null;

  const answeredCount = module.quizzes.filter((q) => answers[q.id]).length;
  const allAnswered = answeredCount === module.quizzes.length;

  const handleSubmit = async () => {
    if (!allAnswered || submitting) {
      setError(`还有 ${module.quizzes.length - answeredCount} 题未作答，请完成后再提交`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        courseId: module.id,
        answers: module.quizzes.map((q) => ({
          quizId: q.id,
          option: answers[q.id],
        })),
      };
      const res = await course.submitExam(payload);
      setResult(res);
      onExamFinished(res.passed, res.score);
    } catch (e) {
      logger.error('提交考核失败', JSON.stringify(e));
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setAnswers({});
    setResult(null);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {module.title} · 通关考核
          </DialogTitle>
          <DialogDescription>
            共 {module.quizzes.length} 道单选题，得分 80 分及以上通关
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="flex flex-col items-center gap-4 py-6">
            {result.passed ? (
              <>
                <CheckCircle2 className="h-16 w-16 text-success" />
                <p className="font-display text-lg font-bold text-success">
                  恭喜通关！
                </p>
              </>
            ) : (
              <>
                <XCircle className="h-16 w-16 text-destructive" />
                <p className="font-display text-lg font-bold text-destructive">
                  未通过，继续加油
                </p>
              </>
            )}
            <p className="font-display text-3xl font-bold text-foreground">{result.score} 分</p>
            {!result.passed && (
              <Button type="button" variant="outline" onClick={handleRetry}>
                <RotateCcw className="mr-1 h-4 w-4" />
                重新考核
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-5">
              {module.quizzes.map((quiz, index) => (
                <div key={quiz.id} className="space-y-2">
                  <p className="text-sm font-medium text-foreground">
                    {index + 1}. {quiz.question}
                  </p>
                  <RadioGroup
                    value={answers[quiz.id] ?? ''}
                    onValueChange={(value) =>
                      setAnswers((prev) => ({ ...prev, [quiz.id]: value }))
                    }
                    className="gap-2"
                  >
                    {quiz.options.map((option) => {
                      const optionId = `${quiz.id}-${option}`;
                      return (
                        <div
                          key={optionId}
                          className="flex items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted"
                        >
                          <RadioGroupItem value={option} id={optionId} />
                          <Label
                            htmlFor={optionId}
                            className="cursor-pointer text-sm font-normal text-foreground"
                          >
                            {option}
                          </Label>
                        </div>
                      );
                    })}
                  </RadioGroup>
                </div>
              ))}
            </div>

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            <Button
              type="button"
              className="mt-2 w-full"
              disabled={submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? '判分中…' : '提交考核'}
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseQuizDialog;
