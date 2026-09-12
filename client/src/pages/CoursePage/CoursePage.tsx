import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  Factory,
  UserCheck,
  Wrench,
  Swords,
  Trophy,
  Award,
  AlertTriangle,
} from 'lucide-react';
import { logger } from '@/lib/logger';
import type { CourseModule } from '@shared/api.interface';
import { course } from '@client/src/api';
import { Progress } from '@client/src/components/ui/progress';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Button } from '@client/src/components/ui/button';
import CourseQuizView from './CourseQuizView';

const MODULE_ICONS = [BookOpen, Factory, UserCheck, Wrench, Swords];

function formatDate(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const CoursePage = () => {
  const [modules, setModules] = useState<CourseModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [quizModule, setQuizModule] = useState<CourseModule | null>(null);
  const [quizOpen, setQuizOpen] = useState(false);

  const loadCourses = useCallback(async (): Promise<CourseModule[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await course.getCourses();
      setModules(data.items);
      return data.items;
    } catch (e) {
      logger.error('加载考核中心失败', JSON.stringify(e));
      setError('考核数据加载失败，请稍后重试');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleExamFinished = useCallback((moduleId: string, passed: boolean) => {
    if (!passed) return;
    const now = new Date().toISOString();
    setModules((prev) =>
      prev.map((m) =>
        m.id === moduleId && !m.passed
          ? { ...m, passed: true, passedAt: now }
          : m,
      ),
    );
  }, []);

  const openQuiz = (mod: CourseModule) => {
    setQuizModule(mod);
    setQuizOpen(true);
  };

  const allPassed = modules.length > 0 && modules.every((m) => m.passed);
  const productModule = modules.find((m) => m.title.includes('产品'));
  const scriptModule = modules.find((m) => m.title.includes('话术'));
  const gateCleared =
    (productModule?.passed ?? false) && (scriptModule?.passed ?? false);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 px-4 py-6 md:px-6">
      <header className="space-y-1">
        <h1 className="font-display text-2xl font-bold text-foreground">考核中心</h1>
        <p className="text-sm text-muted-foreground">
          完成五大模块学习与通关考核，逐步解锁独立客户触达资格
        </p>
      </header>

      {allPassed && (
        <div className="flex items-center gap-3 rounded-xl bg-gold p-4 text-gold-foreground shadow-sm">
          <Trophy className="h-8 w-8 shrink-0" />
          <div>
            <p className="font-display text-base font-bold">通关达成：获得独立客户触达资格</p>
            <p className="text-sm text-gold-foreground/80">全部模块考核通过，开启实战新阶段</p>
          </div>
        </div>
      )}

      {!allPassed && !gateCleared && (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-destructive">
          <AlertTriangle className="h-5 w-5 shrink-0" />
          <p className="text-sm font-semibold">
            先通关、后实战，未通过不进入独立客户触达
          </p>
        </div>
      )}

      {error && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/10 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button size="sm" variant="outline" onClick={() => void loadCourses()}>
            重新加载
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex flex-col gap-4 rounded-xl bg-[hsl(220_25%_12%)] p-6">
              <Skeleton className="size-12 rounded-xl" />
              <Skeleton className="h-5 w-3/4 rounded-md" />
              <div className="space-y-1.5">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-4/5 rounded-md" />
              </div>
              <Skeleton className="mt-auto h-2 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}

      {!loading && !error && (
        <div
          className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3"
          data-ai-section-type="card-list"
        >
          {modules.map((mod, index) => {
            const Icon = MODULE_ICONS[index % MODULE_ICONS.length];
            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => openQuiz(mod)}
                className="group relative flex flex-col gap-4 overflow-hidden rounded-xl bg-sidebar p-6 text-left shadow-sm transition-shadow hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                {mod.passed ? (
                  <div className="absolute right-4 top-4 flex flex-col items-center gap-1">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-sm">
                        <Award className="h-6 w-6" />
                      </span>
                      <span className="text-[10px] font-medium text-gold/80">
                      {formatDate(mod.passedAt)}
                    </span>
                  </div>
                ) : (
                  <span className="absolute right-4 top-4 rounded-full bg-accent px-2.5 py-1 font-display text-[10px] font-semibold text-accent-foreground">
                    待通关
                  </span>
                )}

                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 text-white">
                  <Icon className="h-6 w-6" />
                </span>

                <div className="space-y-2">
                    <h3 className="font-display text-lg font-semibold text-white">{mod.title}</h3>
                  <p className="break-words text-sm leading-relaxed text-white/80">
                    {mod.keyPoints}
                  </p>
                  <p className="break-words text-xs text-white/60">
                    通关要求：{mod.requirement}
                  </p>
                </div>

                <div className="mt-auto space-y-1.5">
                  <div className="flex items-center justify-between text-xs text-white/70">
                    <span>学习进度</span>
                    <span className="font-semibold text-white">{mod.progress}%</span>
                  </div>
                  <Progress
                    value={mod.progress}
                    className="h-2 bg-white/20 [&_[data-slot=progress-indicator]]:bg-accent"
                  />
                </div>
              </button>
            );
          })}
        </div>
      )}

      <CourseQuizView
        module={quizModule}
        open={quizOpen}
        onOpenChange={(open) => {
          setQuizOpen(open);
          if (!open) setQuizModule(null);
        }}
        onExamFinished={handleExamFinished}
      />
    </div>
  );
};

export default CoursePage;