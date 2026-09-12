import { useState } from 'react';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import type { AdminCourseItem } from '@shared/api.interface';
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
import { Input } from '@client/src/components/ui/input';

interface CourseItemEditorProps {
  courseId: string;
  items: AdminCourseItem[];
  onChanged: () => void;
}

const CourseItemEditor = ({
  courseId,
  items,
  onChanged,
}: CourseItemEditorProps) => {
  const [newItemTitle, setNewItemTitle] = useState('');
  const [adding, setAdding] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AdminCourseItem | null>(
    null,
  );
  const [deleting, setDeleting] = useState(false);

  const handleAddItem = async () => {
    const title = newItemTitle.trim();
    if (!title) {
      toast.error('请输入小节标题');
      return;
    }
    setAdding(true);
    try {
      await courseApi.createAdminCourseItem(courseId, { title });
      toast.success(`已添加小节「${title}」`);
      setNewItemTitle('');
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, '新增小节失败，请稍后重试'));
    } finally {
      setAdding(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingItem) return;
    setDeleting(true);
    try {
      await courseApi.deleteAdminCourseItem(deletingItem.id);
      toast.success(`已删除小节「${deletingItem.title}」`);
      setDeletingItem(null);
      onChanged();
    } catch (e) {
      toast.error(getApiErrorMessage(e, '删除小节失败，请稍后重试'));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">
        课程小节（{items.length}）
      </h3>

      <div className="flex flex-col gap-1.5">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5 pl-3"
          >
            <span className="w-6 shrink-0 text-sm font-medium text-muted-foreground">
              {index + 1}.
            </span>
            <span className="min-w-0 flex-1 break-words text-sm text-foreground">
              {item.title}
            </span>
            <span className="shrink-0 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              sort {item.sort}
            </span>
            <Button
              type="button"
              size="icon"
              variant="ghost"
              onClick={() => setDeletingItem(item)}
            >
              <Trash2 className="h-4 w-4 text-muted-foreground" />
            </Button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-3 text-center text-sm text-muted-foreground">
            暂无小节，请在下方添加
          </p>
        )}
      </div>

      <div className="flex gap-2">
        <Input
          value={newItemTitle}
          onChange={(event) => setNewItemTitle(event.target.value)}
          placeholder="新小节标题"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              void handleAddItem();
            }
          }}
        />
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={adding || !newItemTitle.trim()}
          onClick={() => void handleAddItem()}
        >
          {adding ? (
            <Loader2 className="mr-1 h-4 w-4 animate-spin" />
          ) : (
            <Plus className="mr-1 h-4 w-4" />
          )}
          添加小节
        </Button>
      </div>

      <Dialog
        open={deletingItem !== null}
        onOpenChange={(open) => {
          if (!open) setDeletingItem(null);
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>删除小节</DialogTitle>
            <DialogDescription>
              确认删除「{deletingItem?.title}」？该小节的新人学习记录会一并删除，且无法恢复。
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeletingItem(null)}
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

export default CourseItemEditor;
