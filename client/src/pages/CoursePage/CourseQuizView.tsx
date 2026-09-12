import { useCallback, useEffect, useRef, useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  ChevronLeft,
  ChevronRight,
  RotateCcw,
  Loader2,
} from 'lucide-react';
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
import { cn } from '@client/src/lib/utils';

interface CourseQuizViewProps {
  module: CourseModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onExamFinished: (moduleId: string, passed: boolean, score: number) => void;
}

/** 单题答题弹窗：一题答完自动切换下一题，可手动回退 */
const CourseQuizView = ({
  module,
  open,
  onOpenChange,
  onExamFinished,
}: CourseQuizViewProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ passed: boolean; score: number } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (open) {
      setCurrentIndex(0);
      setAnswers({});
      setResult(null);
      setError(null);
      setSubmitting(false);
    }
  }, [open, module?.id]);

  const clearAutoTimer = useCallback(() => {
    if (autoAdvanceTimer.current !== null) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
  }, []);

  useEffect(() => {
    return clearAutoTimer;
  }, [clearAutoTimer]);

  if (!module) return null;

  const quizzes = module.quizzes;
  const total = quizzes.length;
  const currentQuiz = quizzes[currentIndex];
  const isLastQuestion = currentIndex === total - 1;
  const currentAnswered = answers[currentQuiz?.id] !== undefined;

  const handleOptionSelect = (value: string) => {
    if (result || submitting) return;
    clearAutoTimer();

    setAnswers((prev) => ({ ...prev, [currentQuiz.id]: value }));

    // If not the last question, auto-advance after 800ms
    if (!isLastQuestion) {
      autoAdvanceTimer.current = setTimeout(() => {
        setCurrentIndex((prev) => prev + 1);
        autoAdvanceTimer.current = null;
      }, 800);
    }
  };

  const goNext = () => {
    if (currentIndex < total - 1) {
      clearAutoTimer();
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const goPrev = () => {
    if (currentIndex > 0) {
      clearAutoTimer();
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;

    // Check if all questions answered
    const unanswered = quizzes.filter((q) => !answers[q.id]);
    if (unanswered.length > 0) {
      setError(`还有 ${unanswered.length} 题未作答`);
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const payload = {
        courseId: module.id,
        answers: quizzes.map((q) => ({
          quizId: q.id,
          option: answers[q.id],
        })),
      };
      const res = await course.submitExam(payload);
      setResult(res);
      onExamFinished(module.id, res.passed, res.score);
    } catch (e) {
      logger.error('提交考核失败', JSON.stringify(e));
      setError('提交失败，请稍后重试');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setCurrentIndex(0);
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
            共 {total} 道单选题，得分 80 分及以上通关
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
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
            >
              关闭
            </Button>
          </div>
        ) : (
          <>
            {/* 进度指示 */}
            <div className="mb-4 flex items-center justify-between gap-3">
              <span className="text-xs text-muted-foreground">
                第 {currentIndex + 1}/{total} 题
              </span>
              <div className="flex flex-1 gap-1">
                {quizzes.map((q, i) => (
                  <div
                    key={q.id}
                    className={cn(
                      'h-1.5 flex-1 rounded-full transition-colors duration-200',
                      i === currentIndex
                        ? 'bg-primary'
                        : answers[q.id]
                          ? 'bg-primary/40'
                          : 'bg-border',
                    )}
                  />
                ))}
              </div>
            </div>

            {/* 当前题目 */}
            <div className="space-y-4">
              <p className="text-sm font-medium text-foreground">
                {currentIndex + 1}. {currentQuiz.question}
              </p>
              <RadioGroup
                value={answers[currentQuiz.id] ?? ''}
                onValueChange={handleOptionSelect}
                className="gap-2"
              >
                {currentQuiz.options.map((option) => {
                  const optionId = `${currentQuiz.id}-${option}`;
                  return (
                    <div
                      key={optionId}
                      className={cn(
                        'flex items-center gap-2 rounded-lg border border-border p-3 transition-colors hover:bg-muted',
                        answers[currentQuiz.id] === option && 'border-primary bg-primary/5',
                      )}
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

            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}

            {/* 导航栏 */}
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={currentIndex === 0}
                onClick={goPrev}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                上一题
              </Button>

              {isLastQuestion && currentAnswered ? (
                <Button
                  type="button"
                  size="sm"
                  disabled={submitting}
                  onClick={() => void handleSubmit()}
                  className="min-w-[100px]"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                      判分中…
                    </>
                  ) : (
                    '提交'
                  )}
                </Button>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  disabled={!currentAnswered || isLastQuestion}
                  onClick={goNext}
                >
                  下一题
                  <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CourseQuizView;