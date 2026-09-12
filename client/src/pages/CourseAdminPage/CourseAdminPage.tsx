import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ClipboardList,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import type { AdminCourseSummary } from '@shared/api.interface';
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
import { Skeleton } from '@client/src/components/ui/skeleton';
import CourseCreateDialog from './CourseCreateDialog';
import CourseEditDialog from './CourseEditDialog';

const CourseAdminPage = () => {
  const [courses, setCourses] = useState<AdminCourseSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<AdminCourseSummary | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<AdminCourseSummary | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const loadCourses = useCallback(async (): Promise<AdminCourseSummary[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await courseApi.fetchAdminCourses();
      setCourses(data.items);
      return data.items;
    } catch (e) {
      logger.error('加载课程列表失败', JSON.stringify(e));
      setError('课程列表加载失败，请稍后重试');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCourses();
  }, [loadCourses]);

  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await courseApi.deleteAdminCourse(deleteTarget.id);
      toast.success(`已删除课程「${deleteTarget.title}」`);
      setDeleteTarget(null);
      await loadCourses();
    } catch (e) {
      toast.error(getApiErrorMessage(e, '课程删除失败，请稍后重试'));
    } finally {
      setDeleting(false);
    }
  };

  const renderStats = (course: AdminCourseSummary) => (
    <div className="flex flex-wrap gap-2">
      <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary">
        小节 {course.items.length}
      </span>
       <span className="rounded-full bg-warning/10 px-2.5 py-1 text-xs font-medium text-warning-foreground">
         题目 {course.quizCount}
       </span>
      <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground">
        资料 {course.materialCount}
      </span>
    </div>
  );

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 px-4 py-6 md:px-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <BookOpen className="h-7 w-7 text-primary" />
            课程管理
          </h1>
          <p className="text-sm text-muted-foreground">
            维护课程模块、学习要点与小节结构，变更保存后新人端课程中心自动生效
          </p>
        </div>
        <Button type="button" onClick={() => setCreateOpen(true)}>
          <Plus className="mr-1 h-4 w-4" />
          新建课程
        </Button>
      </header>

      {error && (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm text-destructive">{error}</p>
          <Button
            size="sm"
            variant="outline"
            onClick={() => void loadCourses()}
          >
            重新加载
          </Button>
        </div>
      )}

      {loading && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <Skeleton className="size-12 rounded-xl" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-full rounded-md" />
                <Skeleton className="h-3 w-5/6 rounded-md" />
                <Skeleton className="h-3 w-4/6 rounded-md" />
              </div>
              <div className="mt-4 flex items-center justify-between">
                <Skeleton className="h-6 w-20 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && !error && courses.length === 0 && (
        <div className="rounded-xl bg-card p-12 text-center shadow-sm">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            暂无课程模块，点击右上角「新建课程」开始配置
          </p>
        </div>
      )}

      {!loading && !error && courses.length > 0 && (
        <div className="grid grid-cols-1 items-start gap-6 md:grid-cols-2 xl:grid-cols-3">
          {courses.map((course) => (
            <article
              key={course.id}
              className="flex h-full flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 space-y-1">
                  <h2 className="text-base font-semibold text-foreground line-clamp-1">
                    {course.title}
                  </h2>
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                    <span className="size-1.5 rounded-full bg-primary" />
                    排序 {course.sort}
                  </span>
                </div>
                <div className="flex shrink-0 gap-1">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setEditingCourse(course)}
                  >
                    <Pencil className="h-4 w-4 text-muted-foreground" />
                  </Button>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    onClick={() => setDeleteTarget(course)}
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    学习要点
                  </p>
                  <p className="break-words text-foreground">
                    {course.keyPoints}
                  </p>
                </div>
                <div>
                  <p className="mb-0.5 text-xs font-medium text-muted-foreground">
                    通关要求
                  </p>
                  <p className="break-words text-foreground">
                    {course.requirement}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3">
                {renderStats(course)}
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  className="w-full"
                  onClick={() => setEditingCourse(course)}
                >
                  编辑课程与小节
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <CourseCreateDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onCreated={() => void loadCourses()}
      />

      {editingCourse && (
        <CourseEditDialog
          key={editingCourse.id}
          course={editingCourse}
          open={editingCourse !== null}
          onOpenChange={(open) => {
            if (!open) setEditingCourse(null);
          }}
          onChanged={() => void loadCourses()}
        />
      )}

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TriangleAlert className="h-5 w-5 text-destructive" />
              删除课程
            </DialogTitle>
            <DialogDescription>
              确认删除「{deleteTarget?.title}」？该课程的小节、培训资料、考题，以及新人的学习记录与考试记录都会一并删除，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteTarget(null)}
            >
              取消
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleConfirmDelete()}
            >
              {deleting && <Loader2 className="mr-1 h-4 w-4 animate-spin" />}
              确认删除
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseAdminPage;
