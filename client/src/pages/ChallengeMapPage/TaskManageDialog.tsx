import { useCallback, useEffect, useState } from 'react';
import { Pencil, RefreshCw } from 'lucide-react';
import { logger } from '@/lib/logger';
import type {
  ChallengeTaskTemplate,
  UpdateChallengeTaskRequest,
} from '@shared/api.interface';
import { getTaskTemplates } from '@client/src/api/challenge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import TaskEditForm from './TaskEditForm';

const STAGE_LABELS: Record<string, string> = {
  onboarding: '融入期',
  practice: '实战期',
  independent: '独立期',
  consolidation: '巩固期',
};

const STAGE_ORDER = ['onboarding', 'practice', 'independent', 'consolidation'];

interface TaskManageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}

const TaskManageDialog = ({
  open,
  onOpenChange,
  onSaved,
}: TaskManageDialogProps) => {
  const [tasks, setTasks] = useState<ChallengeTaskTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadTasks = useCallback(async (): Promise<ChallengeTaskTemplate[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await getTaskTemplates();
      setTasks(data.items);
      return data.items;
    } catch (e) {
      logger.error('加载闯关任务失败', JSON.stringify(e));
      setError('任务加载失败，请稍后重试');
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (open) {
      setEditingId(null);
      void loadTasks();
    }
  }, [open, loadTasks]);

  const handleSaved = useCallback(
    (taskId: string, updated: UpdateChallengeTaskRequest) => {
      setTasks((prev: ChallengeTaskTemplate[]) =>
        prev.map((task: ChallengeTaskTemplate) =>
          task.id === taskId ? { ...task, ...updated } : task,
        ),
      );
      setEditingId(null);
      onSaved();
    },
    [onSaved],
  );

  const editingTask = tasks.find(
    (task: ChallengeTaskTemplate) => task.id === editingId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>编辑闯关任务</DialogTitle>
          <DialogDescription>
            修改任务内容后立即对所有新人的闯关地图生效
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="space-y-3">
            {[0, 1, 2, 3].map((index: number) => (
              <div key={index} className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <Skeleton className="size-5 rounded" />
                <div className="flex-1 space-y-1.5">
                  <Skeleton className="h-4 w-3/4 rounded-md" />
                  <Skeleton className="h-3 w-1/2 rounded-md" />
                </div>
                <Skeleton className="h-6 w-16 rounded-md" />
              </div>
            ))}
          </div>
        )}

        {error && (
          <div className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4">
            <p className="text-sm text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => void loadTasks()}>
              <RefreshCw className="size-4" />
              重新加载
            </Button>
          </div>
        )}

        {!loading && !error && (
          <div className="space-y-5">
            {STAGE_ORDER.map((stageKey) => {
              const stageTasks = tasks.filter(
                (task: ChallengeTaskTemplate) => task.stage === stageKey,
              );
              if (stageTasks.length === 0) return null;
              return (
                <div key={stageKey} className="space-y-2">
                  <h4 className="text-sm font-semibold text-foreground">
                    {STAGE_LABELS[stageKey] ?? stageKey}
                    <span className="ml-2 text-xs font-normal text-muted-foreground">
                      {stageTasks.length} 项任务
                    </span>
                  </h4>
                  <div className="flex flex-col gap-2">
                    {stageTasks.map((task: ChallengeTaskTemplate) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border bg-card p-3"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="break-words text-sm font-medium text-foreground">
                              {task.title}
                            </p>
                            <div className="mt-1 flex flex-wrap items-center gap-2">
                              <Badge variant="secondary">{task.category}</Badge>
                              <span className="text-xs text-muted-foreground">
                                截止 第{task.dueDay}天
                              </span>
                              <span className="truncate text-xs text-muted-foreground">
                                {task.standard}
                              </span>
                            </div>
                          </div>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                            onClick={() =>
                              setEditingId(
                                editingId === task.id ? null : task.id,
                              )
                            }
                          >
                            <Pencil className="size-4" />
                          </Button>
                        </div>
                        {editingId === task.id && editingTask && (
                          <div className="mt-3 border-t border-border">
                            <TaskEditForm
                              key={task.id}
                              task={editingTask}
                              onSaved={(
                                updated: UpdateChallengeTaskRequest,
                              ) => handleSaved(task.id, updated)}
                              onCancel={() => setEditingId(null)}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            {tasks.length === 0 && (
              <p className="py-6 text-center text-sm text-muted-foreground">
                暂无闯关任务
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default TaskManageDialog;
