import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Edit3, Plus, Save, Sparkles, Trash2, X } from 'lucide-react';
import { Table, type TableColumnsType } from '@client/src/components/ui/data-table';
import {
  getTaskTemplates,
  updateTaskTemplate,
  createTaskTemplate,
  deleteTaskTemplate,
} from '@client/src/api/challenge';
import type {
  ChallengeTaskTemplate,
  UpdateChallengeTaskRequest,
} from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Switch } from '@client/src/components/ui/switch';
import { Textarea } from '@client/src/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@client/src/components/ui/select';

/** 阶段英文 key 与中文展示映射 */
const STAGE_LABELS: Record<string, string> = {
  onboarding: '融入期',
  practice: '实战期',
  independent: '独立期',
  consolidation: '巩固期',
};

const STAGE_OPTIONS: Array<{ value: string; label: string }> = (
  Object.keys(STAGE_LABELS) as string[]
).map((key: string) => ({ value: key, label: STAGE_LABELS[key] }));

/** 编辑弹窗表单值 */
interface TaskFormState {
  stage: string;
  title: string;
  category: string;
  standard: string;
  dueDay: string;
  unlockNextStage: boolean;
}

const toFormState = (task: ChallengeTaskTemplate): TaskFormState => ({
  stage: task.stage,
  title: task.title,
  category: task.category,
  standard: task.standard,
  dueDay: String(task.dueDay),
  unlockNextStage: task.unlockNextStage,
});

const StageBadge = ({ stage }: { stage: string }) => (
  <Badge variant="secondary" className="font-normal">
    {STAGE_LABELS[stage] ?? stage}
  </Badge>
);

/** 模板配置面板（嵌入任务管理页） */
const TemplateManagePanel: React.FC = () => {
  const [templates, setTemplates] = useState<ChallengeTaskTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<ChallengeTaskTemplate | null>(null);
  const [form, setForm] = useState<TaskFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadTemplates = useCallback(async (isInitial = false): Promise<void> => {
    if (isInitial) setLoading(true);
    try {
      const data = await getTaskTemplates();
      setTemplates(data.items);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载任务模板失败');
      if (isInitial) toast.error('加载任务模板失败，请稍后重试');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates(true);
  }, [loadTemplates]);

  const openEdit = (task: ChallengeTaskTemplate): void => {
    setEditTarget(task);
    setForm(toFormState(task));
    setEditOpen(true);
  };

  const openCreate = (stage: string): void => {
    setEditTarget(null);
    setForm({
      stage,
      title: '',
      category: '',
      standard: '',
      dueDay: '',
      unlockNextStage: false,
    });
    setEditOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!form) return;
    if (!form.title.trim()) {
      toast.error('请填写任务标题');
      return;
    }
    const dueDay = Number(form.dueDay);
    if (!Number.isFinite(dueDay) || dueDay <= 0) {
      toast.error('应完成天数需为正整数');
      return;
    }
    const payload: UpdateChallengeTaskRequest = {
      stage: form.stage,
      title: form.title.trim(),
      category: form.category.trim(),
      standard: form.standard.trim(),
      dueDay: Math.round(dueDay),
      unlockNextStage: form.unlockNextStage,
    };
    setSaving(true);
    try {
      if (editTarget) {
        await updateTaskTemplate(editTarget.id, payload);
        toast.success('任务模板已更新');
      } else {
        await createTaskTemplate(payload);
        toast.success('任务模板已新增，存量新人的闯关地图已同步');
      }
      setEditOpen(false);
      setEditTarget(null);
      setForm(null);
      void loadTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '更新任务模板失败');
    } finally {
      setSaving(false);
    }
  };

  const closeEditDialog = (): void => {
    setEditOpen(false);
    setEditTarget(null);
    setForm(null);
  };

  const handleDelete = async (): Promise<void> => {
    if (!editTarget) return;
    setDeleting(true);
    try {
      await deleteTaskTemplate(editTarget.id);
      toast.success('任务模板已删除');
      setConfirmDeleteOpen(false);
      closeEditDialog();
      void loadTemplates();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除任务模板失败');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumnsType<ChallengeTaskTemplate> = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      render: (value: number | undefined) => (
        <span className="text-muted-foreground">{value ?? '--'}</span>
      ),
    },
    {
      title: '阶段',
      dataIndex: 'stage',
      width: 110,
      render: (value: string | undefined) =>
        value ? <StageBadge stage={value} /> : <span className="text-muted-foreground">--</span>,
    },
    {
      title: '任务标题',
      dataIndex: 'title',
      width: 220,
      render: (text: string | undefined) => (
        <span className="font-medium">{text || '--'}</span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 130,
      render: (text: string | undefined) => (
        <Badge variant="outline" className="font-normal">{text || '--'}</Badge>
      ),
    },
    {
      title: '达标标准',
      dataIndex: 'standard',
      ellipsis: true,
      render: (text: string | undefined) => (
        <span className="text-muted-foreground">{text || '--'}</span>
      ),
    },
    {
      title: '应完成天数',
      dataIndex: 'dueDay',
      width: 110,
      render: (value: number | undefined) => (
        <span className="tabular-nums">第 {value ?? '--'} 天</span>
      ),
    },
    {
      title: '解锁任务',
      dataIndex: 'unlockNextStage',
      width: 110,
      render: (value: boolean | undefined) =>
        value ? (
          <Badge className="border-accent/40 bg-accent/10 font-normal text-accent">
            <Sparkles className="mr-1 size-3" />
            解锁任务
          </Badge>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: ChallengeTaskTemplate) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-primary"
          onClick={() => openEdit(record)}
        >
          <Edit3 className="size-4" />
          编辑
        </Button>
      ),
    },
  ];

  /** 按阶段分组 */
  const groupedTemplates: Array<{ stage: string; label: string; tasks: ChallengeTaskTemplate[] }> =
    STAGE_OPTIONS.map((opt) => ({
      stage: opt.value,
      label: opt.label,
      tasks: templates.filter((t) => t.stage === opt.value),
    }));

  return (
    <div className="space-y-6">
      {/* 按阶段分组展示 */}
      {loading ? (
        <div className="space-y-6">
          {[0, 1, 2, 3].map((i: number) => (
            <div key={i} className="rounded-xl border bg-card p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-5 w-24 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-md" />
              </div>
              <div className="space-y-3">
                {[0, 1].map((j: number) => (
                  <div key={j} className="flex items-center gap-3">
                    <Skeleton className="h-5 w-12 rounded-md" />
                    <Skeleton className="h-5 flex-1 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : loadError ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-muted-foreground">{loadError}</p>
          <Button variant="outline" onClick={() => void loadTemplates(true)}>
            重试
          </Button>
        </div>
      ) : (
        groupedTemplates.map((group) => (
          <div key={group.stage} className="rounded-xl bg-card p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="flex items-center gap-2 text-base font-semibold">
                <StageBadge stage={group.stage} />
                <span className="text-sm font-normal text-muted-foreground">
                  {group.tasks.length} 个任务
                </span>
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => openCreate(group.stage)}
              >
                <Plus className="size-4" />
                新增任务
              </Button>
            </div>
            {group.tasks.length === 0 ? (
              <p className="py-6 text-center text-sm text-muted-foreground">
                该阶段暂无任务模板，点击上方按钮新增
              </p>
            ) : (
              <Table
                columns={columns}
                dataSource={group.tasks}
                rowKey="id"
                bordered
                pagination={false}
                scroll={{ x: 900 }}
              />
            )}
          </div>
        ))
      )}

      {/* 编辑/新增弹窗 */}
      <Dialog
        open={editOpen}
        onOpenChange={(next: boolean) => {
          setEditOpen(next);
          if (!next) { setEditTarget(null); setForm(null); }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? '编辑任务模板' : '新增任务模板'}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `修改「${editTarget.title}」的任务配置，保存后立即生效。`
                : '新增一条闯关任务模板，保存后存量新人的闯关地图会同步出现该任务。'}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label>阶段</Label>
                <Select
                  value={form.stage}
                  onValueChange={(value: string) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, stage: value } : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择阶段" />
                  </SelectTrigger>
                  <SelectContent>
                    {STAGE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>任务标题</Label>
                <Input
                  value={form.title}
                  placeholder="请输入任务标题"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, title: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>分类</Label>
                <Input
                  value={form.category}
                  placeholder="请输入任务分类"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, category: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>达标标准</Label>
                <Textarea
                  value={form.standard}
                  placeholder="请输入达标标准"
                  rows={3}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, standard: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>应完成天数</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.dueDay}
                  placeholder="如 30"
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, dueDay: e.target.value } : prev,
                    )
                  }
                />
                <p className="text-xs text-muted-foreground">
                  新人入职后第 N 天前应完成该任务。
                </p>
              </div>
              <div className="flex items-start justify-between gap-4 rounded-lg bg-muted/40 p-3">
                <div className="space-y-1">
                  <Label>解锁任务</Label>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    开启后，新人完成本阶段全部解锁任务，即可提前解锁下一阶段，无需等到规定天数。
                  </p>
                </div>
                <Switch
                  checked={form.unlockNextStage}
                  onCheckedChange={(checked: boolean) =>
                    setForm((prev: TaskFormState | null) =>
                      prev ? { ...prev, unlockNextStage: checked } : prev,
                    )
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            {editTarget && (
              <Button
                variant="outline"
                disabled={saving || deleting}
                className="mr-auto border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
                onClick={() => setConfirmDeleteOpen(true)}
              >
                <Trash2 className="size-4" />
                删除
              </Button>
            )}
            <Button variant="outline" disabled={saving} onClick={closeEditDialog}>
              <X className="size-4" />
              取消
            </Button>
            <Button disabled={saving} onClick={() => void handleSave()}>
              <Save className="size-4" />
              {saving ? '保存中…' : '保存'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 删除确认弹窗 */}
      <Dialog
        open={confirmDeleteOpen}
        onOpenChange={(next: boolean) => { setConfirmDeleteOpen(next); }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除任务模板</DialogTitle>
            <DialogDescription>
              确定删除「{editTarget?.title}」吗？该任务及其所有新人的打卡记录将被一并删除，不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" disabled={deleting} onClick={() => setConfirmDeleteOpen(false)}>
              取消
            </Button>
            <Button variant="destructive" disabled={deleting} onClick={() => void handleDelete()}>
              <Trash2 className="size-4" />
              {deleting ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TemplateManagePanel;
