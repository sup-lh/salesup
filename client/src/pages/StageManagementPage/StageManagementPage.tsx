import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Edit3, Layers, Plus, Save, Trash2, X } from 'lucide-react';
import { Table, type TableColumnsType } from '@client/src/components/ui/data-table';
import { fetchStages, createStage, updateStage, deleteStage } from '@client/src/api/stage';
import type { CreateStageRequest, UpdateStageRequest } from '@client/src/api/stage';
import type { StageCatalogItem } from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
import { Skeleton } from '@client/src/components/ui/skeleton';
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

/** 编辑弹窗表单值 */
interface StageFormState {
  code: string;
  name: string;
  startDay: string;
  endDay: string;
  standard: string;
  hasDefense: boolean;
}

const toFormState = (stage: StageCatalogItem): StageFormState => ({
  code: stage.code,
  name: stage.name,
  startDay: String(stage.startDay),
  endDay: String(stage.endDay),
  standard: stage.standard,
  hasDefense: stage.hasDefense,
});

/** 天数区间展示 */
const DEFENSE_STAGE_OPTIONS = [
  { value: 'no', label: '不参与' },
  { value: 'yes', label: '参与转正考核' },
] as const;

const DayRangeDisplay = ({ startDay, endDay }: { startDay: number; endDay: number }) => (
  <span className="tabular-nums text-muted-foreground">
    第 {startDay} 天 → 第 {endDay} 天
  </span>
);

const StageManagementPage: React.FC = () => {
  const [stages, setStages] = useState<StageCatalogItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<StageCatalogItem | null>(null);
  const [form, setForm] = useState<StageFormState | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadStages = useCallback(async (isInitial = false): Promise<void> => {
    if (isInitial) setLoading(true);
    try {
      const data: StageCatalogItem[] = await fetchStages();
      setStages(data);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载阶段配置失败');
      if (isInitial) toast.error('加载阶段配置失败，请稍后重试');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadStages(true);
  }, [loadStages]);

  const openEdit = (stage: StageCatalogItem): void => {
    setEditTarget(stage);
    setForm(toFormState(stage));
    setEditOpen(true);
  };

  const openCreate = (): void => {
    setEditTarget(null);
    setForm({ code: '', name: '', startDay: '', endDay: '', standard: '', hasDefense: false });
    setEditOpen(true);
  };

  const handleSave = async (): Promise<void> => {
    if (!form) return;
    if (!form.code.trim()) {
      toast.error('请填写阶段编码');
      return;
    }
    if (!form.name.trim()) {
      toast.error('请填写阶段名称');
      return;
    }
    const startDay: number = Number(form.startDay);
    const endDay: number = Number(form.endDay);
    if (!Number.isFinite(startDay) || startDay < 0) {
      toast.error('起始天数需为非负整数');
      return;
    }
    if (!Number.isFinite(endDay) || endDay <= startDay) {
      toast.error('结束天数需大于起始天数');
      return;
    }
    const payload: CreateStageRequest = {
      code: form.code.trim(),
      name: form.name.trim(),
      startDay: Math.round(startDay),
      endDay: Math.round(endDay),
      standard: form.standard.trim() || undefined,
      hasDefense: form.hasDefense,
    };
    setSaving(true);
    try {
      if (editTarget) {
        const patch: UpdateStageRequest = {};
        if (payload.code !== editTarget.code) patch.code = payload.code;
        if (payload.name !== editTarget.name) patch.name = payload.name;
        if (payload.startDay !== editTarget.startDay) patch.startDay = payload.startDay;
        if (payload.endDay !== editTarget.endDay) patch.endDay = payload.endDay;
        if (payload.standard !== editTarget.standard) patch.standard = payload.standard;
        if (payload.hasDefense !== editTarget.hasDefense) patch.hasDefense = payload.hasDefense;
        await updateStage(editTarget.id, patch);
        toast.success('阶段配置已更新');
      } else {
        await createStage(payload);
        toast.success('阶段配置已新增');
      }
      setEditOpen(false);
      setEditTarget(null);
      setForm(null);
      void loadStages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '保存阶段配置失败');
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
      await deleteStage(editTarget.id);
      toast.success('阶段配置已删除');
      setConfirmDeleteOpen(false);
      closeEditDialog();
      void loadStages();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除阶段配置失败');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumnsType<StageCatalogItem> = [
    {
      title: '排序',
      dataIndex: 'sort',
      width: 80,
      render: (value: number | undefined) => (
        <span className="text-muted-foreground">{value ?? '--'}</span>
      ),
    },
    {
      title: '阶段编码',
      dataIndex: 'code',
      width: 140,
      render: (text: string | undefined) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{text || '--'}</code>
      ),
    },
    {
      title: '阶段名称',
      dataIndex: 'name',
      width: 160,
      render: (text: string | undefined) => (
        <span className="font-medium">{text || '--'}</span>
      ),
    },
    {
      title: '起始天数',
      dataIndex: 'startDay',
      width: 100,
      render: (value: number | undefined) => (
        <span className="tabular-nums text-muted-foreground">
          {value !== undefined ? `第 ${value} 天` : '--'}
        </span>
      ),
    },
    {
      title: '结束天数',
      dataIndex: 'endDay',
      width: 100,
      render: (value: number | undefined) => (
        <span className="tabular-nums text-muted-foreground">
          {value !== undefined ? `第 ${value} 天` : '--'}
        </span>
      ),
    },
    {
      title: '天数区间',
      key: 'dayRange',
      width: 180,
      render: (_: unknown, record: StageCatalogItem) => (
        <DayRangeDisplay startDay={record.startDay} endDay={record.endDay} />
      ),
    },
    {
      title: '通关标准',
      dataIndex: 'standard',
      ellipsis: true,
      render: (text: string | undefined) => (
        <span className="text-muted-foreground">{text || '--'}</span>
      ),
    },
    {
      title: '转正考核',
      dataIndex: 'hasDefense',
      width: 120,
      render: (value: boolean | undefined) => (
        <Badge
          variant={value ? 'default' : 'secondary'}
          className={value ? 'bg-accent text-accent-foreground' : ''}
        >
          {value ? '参与' : '不参与'}
        </Badge>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 160,
      fixed: 'right',
      render: (_: unknown, record: StageCatalogItem) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-primary"
            onClick={() => openEdit(record)}
          >
            <Edit3 className="size-4" />
            编辑
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-destructive"
            onClick={() => {
              setEditTarget(record);
              setConfirmDeleteOpen(true);
            }}
          >
            <Trash2 className="size-4" />
            删除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      {/* 页头 + 新增按钮 */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="size-6 text-primary" />
            <h1 className="text-2xl font-semibold">阶段配置</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            配置新人成长各阶段的名称、天数和通关标准。
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="size-4" />
          新增阶段
        </Button>
      </div>

      {/* 阶段配置表格 */}
      <div
        data-ai-section-type="card-list"
        className="rounded-xl border bg-card p-6 shadow-sm"
      >
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_: unknown, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-5 w-8 rounded-md" />
                <Skeleton className="h-5 w-20 rounded-md" />
                <Skeleton className="h-5 w-28 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 w-16 rounded-md" />
                <Skeleton className="h-5 flex-1 rounded-md" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => void loadStages(true)}>
              重试
            </Button>
          </div>
        ) : stages.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">暂无阶段配置</p>
        ) : (
          <Table
            columns={columns}
            dataSource={stages}
            rowKey="id"
            bordered
            pagination={{
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
              pageSizeOptions: [5, 10, 20],
            }}
            scroll={{ x: 1250 }}
          />
        )}
      </div>

      {/* 编辑阶段弹窗 */}
      <Dialog
        open={editOpen}
        onOpenChange={(next: boolean) => {
          setEditOpen(next);
          if (!next) {
            setEditTarget(null);
            setForm(null);
          }
        }}
      >
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editTarget ? '编辑阶段' : '新增阶段'}</DialogTitle>
            <DialogDescription>
              {editTarget
                ? `修改「${editTarget.name}」的配置，保存后立即生效。`
                : '新增一个成长阶段，配置基本信息和天数跨度。'}
            </DialogDescription>
          </DialogHeader>
          {form && (
            <div className="grid gap-4 py-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>阶段编码</Label>
                  <Input
                    value={form.code}
                    placeholder="如 onboarding"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev: StageFormState | null) =>
                        prev ? { ...prev, code: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>阶段名称</Label>
                  <Input
                    value={form.name}
                    placeholder="如 融入期"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev: StageFormState | null) =>
                        prev ? { ...prev, name: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>起始天数</Label>
                  <Input
                    type="number"
                    min={0}
                    value={form.startDay}
                    placeholder="如 1"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev: StageFormState | null) =>
                        prev ? { ...prev, startDay: e.target.value } : prev,
                      )
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label>结束天数</Label>
                  <Input
                    type="number"
                    min={1}
                    value={form.endDay}
                    placeholder="如 30"
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setForm((prev: StageFormState | null) =>
                        prev ? { ...prev, endDay: e.target.value } : prev,
                      )
                    }
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>通关标准</Label>
                <Textarea
                  value={form.standard}
                  placeholder="描述该阶段的通关标准，选填"
                  rows={3}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                    setForm((prev: StageFormState | null) =>
                      prev ? { ...prev, standard: e.target.value } : prev,
                    )
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>转正考核</Label>
                <Select
                  value={form.hasDefense ? 'yes' : 'no'}
                  onValueChange={(val: string) =>
                    setForm((prev: StageFormState | null) =>
                      prev ? { ...prev, hasDefense: val === 'yes' } : prev,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="是否参与转正考核" />
                  </SelectTrigger>
                  <SelectContent>
                    {DEFENSE_STAGE_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
        onOpenChange={(next: boolean) => {
          setConfirmDeleteOpen(next);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除阶段</DialogTitle>
            <DialogDescription>
              确定删除阶段「{editTarget?.name ?? ''}」吗？与该阶段关联的任务模板将被一并清理，不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setConfirmDeleteOpen(false)}
            >
              取消
            </Button>
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={() => void handleDelete()}
            >
              <Trash2 className="size-4" />
              {deleting ? '删除中…' : '确认删除'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StageManagementPage;
