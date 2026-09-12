import { useCallback, useEffect, useState } from 'react';
import { ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { AdminQuizCourse } from '@shared/api.interface';
import { course as courseApi } from '@client/src/api';
import { Button } from '@client/src/components/ui/button';
import { Skeleton } from '@client/src/components/ui/skeleton';
import QuizForm from './QuizForm';
import QuizCourseList from './QuizCourseList';

const QuizAdminPage = () => {
  const [courses, setCourses] = useState<AdminQuizCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadQuizBank = useCallback(async (): Promise<AdminQuizCourse[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseApi.getQuizBank();
      setCourses(data.items);
      return data.items;
    } catch (e) {
      logger.error('加载考题库失败', JSON.stringify(e));
      setError('考题库加载失败，请稍后重试');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadQuizBank();
  }, [loadQuizBank]);

  const handleDeleteQuiz = useCallback(
    async (quizId: string) => {
      setDeletingId(quizId);
      try {
        await courseApi.deleteQuiz(quizId);
        toast.success('考题已删除');
        await loadQuizBank();
      } catch (e) {
        logger.error('删除考题失败', JSON.stringify(e));
        toast.error('考题删除失败，请稍后重试');
      } finally {
        setDeletingId(null);
      }
    },
    [loadQuizBank],
  );

  const courseOptions = courses.map((c) => ({ id: c.id, title: c.title }));

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
      <header className="space-y-1">
        <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
          <ClipboardList className="h-7 w-7 text-primary" />
          考题管理
        </h1>
        <p className="text-sm text-muted-foreground">
          为五大课程模块录入与维护通关考核题目，得分 80 分及以上算通关
        </p>
      </header>

      {error && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-[hsl(4_80%_58%_/_0.4)] bg-[hsl(4_80%_58%_/_0.06)] p-4">
          <p className="text-sm text-[hsl(4_80%_40%)]">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadQuizBank()}
          >
            重新加载
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
          {/* 表单骨架 */}
          <div className="rounded-xl border bg-card p-6 shadow-sm">
            <Skeleton className="mb-6 h-5 w-28 rounded-md" />
            <div className="space-y-4">
              {[0, 1, 2, 3].map((i: number) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-3 w-16 rounded-md" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
              <Skeleton className="h-9 w-24 rounded-md" />
            </div>
          </div>
          {/* 列表骨架 */}
          <div className="space-y-6">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Skeleton className="h-5 w-40 rounded-md" />
                  <Skeleton className="h-5 w-16 rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full rounded-md" />
                  <Skeleton className="h-4 w-5/6 rounded-md" />
                  <Skeleton className="h-4 w-4/6 rounded-md" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!loading && !error && (
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(340px,420px)_1fr]">
          <div className="rounded-xl bg-card p-6 shadow-sm lg:sticky lg:top-6">
            <h2 className="mb-4 text-base font-semibold text-foreground">
              录入新考题
            </h2>
            <QuizForm courses={courseOptions} onCreated={() => void loadQuizBank()} />
          </div>
          <div className="space-y-6">
            {courses.map((c) => (
              <QuizCourseList
                key={c.id}
                title={c.title}
                quizzes={c.quizzes}
                deletingId={deletingId}
                onDelete={(quizId) => void handleDeleteQuiz(quizId)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizAdminPage;
