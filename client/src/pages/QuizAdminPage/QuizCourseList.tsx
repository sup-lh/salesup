import { CheckCircle2, Circle, Loader2, Trash2 } from 'lucide-react';
import type { AdminCourseQuiz } from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';

const OPTION_LABELS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

interface QuizCourseListProps {
  title: string;
  quizzes: AdminCourseQuiz[];
  deletingId: string | null;
  onDelete: (quizId: string) => void;
}

const QuizCourseList = ({
  title,
  quizzes,
  deletingId,
  onDelete,
}: QuizCourseListProps) => {
  return (
    <div className="rounded-xl bg-card p-6 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">{title}</h3>
        <span className="text-xs text-muted-foreground">
          共 {quizzes.length} 题
        </span>
      </div>
      <div className="flex flex-col gap-3">
        {quizzes.map((quiz) => (
          <div
            key={quiz.id}
            className="rounded-lg border border-border bg-card p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="break-words text-sm font-medium text-foreground">
                {quiz.question}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                disabled={deletingId === quiz.id}
                onClick={() => onDelete(quiz.id)}
              >
                {deletingId === quiz.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
            <div className="mt-3 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
              {quiz.options.map((opt, index) => {
                const isAnswer = opt === quiz.answer;
                return (
                  <div
                    key={`${quiz.id}-${index}`}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 text-sm ${
                      isAnswer
                        ? 'bg-[hsl(152_60%_42%_/_0.08)] text-[hsl(152_60%_30%)]'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {isAnswer ? (
                      <CheckCircle2 className="h-4 w-4 shrink-0" />
                    ) : (
                      <Circle className="h-4 w-4 shrink-0 opacity-40" />
                    )}
                    <span className="min-w-0 break-words">
                      {OPTION_LABELS[index] ?? index + 1}. {opt}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
        {quizzes.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            暂无考题，请在上方表单录入
          </p>
        )}
      </div>
    </div>
  );
};

export default QuizCourseList;
