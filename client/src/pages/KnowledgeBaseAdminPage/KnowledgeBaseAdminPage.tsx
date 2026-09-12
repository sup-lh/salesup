import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { ExternalLink, LibraryBig, Plus, Trash2 } from 'lucide-react';
import { Table, type TableColumnsType } from '@client/src/components/ui/data-table';
import { createKbItem, deleteKbItem, listKbItems } from '@client/src/api/knowledgeBase';
import {
  KB_SOURCE_LABELS,
  type CreateKbItemRequest,
  type KbItem,
} from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Skeleton } from '@client/src/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import KbItemFormDialog from './KbItemFormDialog';

const KnowledgeBaseAdminPage: React.FC = () => {
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<KbItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadItems = useCallback(async (isInitial = false): Promise<void> => {
    if (isInitial) setLoading(true);
    try {
      const data = await listKbItems();
      setItems(data.items);
      setLoadError(null);
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : '加载知识库失败');
      if (isInitial) toast.error('加载知识库失败，请稍后重试');
    } finally {
      if (isInitial) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(true);
  }, [loadItems]);

  const handleCreate = async (payload: CreateKbItemRequest): Promise<void> => {
    setSaving(true);
    try {
      await createKbItem(payload);
      toast.success('知识库内容已新增，新人工作台立即可见');
      void loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '新增知识库内容失败');
      throw error;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await deleteKbItem(deleteTarget.id);
      toast.success('知识库内容已删除');
      setDeleteTarget(null);
      void loadItems();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : '删除知识库内容失败');
    } finally {
      setDeleting(false);
    }
  };

  const columns: TableColumnsType<KbItem> = [
    {
      title: '标题',
      dataIndex: 'title',
      width: 240,
      render: (text: string | undefined) => (
        <span className="font-medium">{text || '--'}</span>
      ),
    },
    {
      title: '分类',
      dataIndex: 'category',
      width: 120,
      render: (text: string | undefined) => (
        <Badge variant="outline" className="font-normal">
          {text || '--'}
        </Badge>
      ),
    },
    {
      title: '内容类型',
      dataIndex: 'sourceType',
      width: 110,
      render: (value: string | undefined) =>
        value ? (
          <Badge variant="secondary" className="font-normal">
            {KB_SOURCE_LABELS[value as keyof typeof KB_SOURCE_LABELS] ?? value}
          </Badge>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      title: '内容简介',
      dataIndex: 'description',
      ellipsis: true,
      render: (text: string | null | undefined) => (
        <span className="text-muted-foreground">{text || '--'}</span>
      ),
    },
    {
      title: '链接',
      dataIndex: 'url',
      width: 130,
      render: (url: string | undefined) =>
        url ? (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 break-all text-primary hover:underline"
          >
            <ExternalLink className="size-3.5 shrink-0" />
            打开
          </a>
        ) : (
          <span className="text-muted-foreground">--</span>
        ),
    },
    {
      title: '操作',
      key: 'action',
      width: 90,
      fixed: 'right',
      render: (_: unknown, record: KbItem) => (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2 text-destructive hover:text-destructive"
          onClick={() => setDeleteTarget(record)}
        >
          <Trash2 className="size-4" />
          删除
        </Button>
      ),
    },
  ];

  return (
    <div className="mx-auto w-full max-w-[1400px] space-y-6 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="flex items-center gap-2 text-2xl font-bold text-foreground">
            <LibraryBig className="size-7 text-primary" />
            知识库管理
          </h1>
          <p className="text-sm text-muted-foreground">
            添加外部资料链接到销售知识库，新人工作台即时可见。
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus className="size-4" />
          新增内容
        </Button>
      </div>

      <Card
        data-ai-section-type="card-list"
        className="overflow-hidden rounded-xl border bg-card shadow-sm"
      >
        <div className="border-b border-border bg-muted/30 px-6 py-3">
          <p className="text-xs font-medium text-muted-foreground">
            {loading ? '正在加载…' : items.length > 0 ? `共 ${items.length} 条知识库内容` : ''}
          </p>
        </div>
        <div className="p-6">
        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_: number, i: number) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-8 flex-1 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-6 w-16 rounded-md" />
                <Skeleton className="h-8 w-20 rounded-md" />
              </div>
            ))}
          </div>
        ) : loadError ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="text-sm text-muted-foreground">{loadError}</p>
            <Button variant="outline" onClick={() => void loadItems(true)}>
              重试
            </Button>
          </div>
        ) : items.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            暂无知识库内容，点击右上角「新增内容」上传第一条
          </p>
        ) : (
          <Table
            columns={columns}
            dataSource={items}
            rowKey="id"
            bordered
            pagination={{
              showSizeChanger: true,
              showTotal: (total: number) => `共 ${total} 条`,
              pageSizeOptions: [5, 10, 20],
            }}
            scroll={{ x: 1000 }}
          />
        )}
        </div>
      </Card>

      <KbItemFormDialog
        open={createOpen}
        saving={saving}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
      />

      <Dialog
        open={deleteTarget !== null}
        onOpenChange={(next: boolean) => {
          if (!next) setDeleteTarget(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除知识库内容</DialogTitle>
            <DialogDescription>
              确定删除「{deleteTarget?.title}」吗？删除后新人工作台将不再展示该内容，不可恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              disabled={deleting}
              onClick={() => setDeleteTarget(null)}
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

export default KnowledgeBaseAdminPage;
