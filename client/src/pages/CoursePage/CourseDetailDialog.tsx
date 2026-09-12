import { useRef, useState } from 'react';
import {
  CheckCircle2,
  Circle,
  FileText,
  GraduationCap,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { Can } from '@/auth/AuthProvider';
import { logger } from '@/lib/logger';
import { axiosForBackend } from '@/lib/http';
import type { CourseMaterial, CourseModule } from '@shared/api.interface';
import { course as courseApi } from '@client/src/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@client/src/components/ui/dialog';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Progress } from '@client/src/components/ui/progress';

interface CourseDetailDialogProps {
  module: CourseModule | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onToggleLearned: (itemId: string, learned: boolean) => void;
  onStartExam: () => void;
  onMaterialsChanged: () => void;
}

function formatMaterialDate(iso: string): string {
  const d = new Date(iso);
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

const CourseDetailDialog = ({
  module,
  open,
  onOpenChange,
  onToggleLearned,
  onStartExam,
  onMaterialsChanged,
}: CourseDetailDialogProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [linkMode, setLinkMode] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');
  const [linkSaving, setLinkSaving] = useState(false);

  if (!module) return null;

  const learnedCount = module.items.filter((it) => it.learned).length;
  const progress =
    module.items.length > 0
      ? Math.round((learnedCount / module.items.length) * 100)
      : 0;

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axiosForBackend.post<{ url?: string; downloadUrl?: string }>('/api/storage/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      const data = response.data;
      const fileUrl = data.url ?? data.downloadUrl;
      if (!fileUrl) throw new Error('上传接口未返回文件地址');
      await courseApi.createCourseMaterial(module.id, {
        title: file.name,
        fileUrl,
      });
      toast.success(`材料「${file.name}」上传成功`);
      onMaterialsChanged();
    } catch (e) {
      logger.error('上传课程材料失败', JSON.stringify(e));
      toast.error('材料上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDeleteMaterial = async (material: CourseMaterial) => {
    setDeletingId(material.id);
    try {
      await courseApi.deleteCourseMaterial(material.id);
      toast.success(`已删除材料「${material.title}」`);
      onMaterialsChanged();
    } catch (e) {
      logger.error('删除课程材料失败', JSON.stringify(e));
      toast.error('材料删除失败，请稍后重试');
    } finally {
      setDeletingId(null);
    }
  };

  const handleAddLink = async () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      toast.error('请粘贴以 http(s):// 开头的链接');
      return;
    }
    setLinkSaving(true);
    try {
      const lower = url.toLowerCase();
      const isFeishu =
        lower.includes('feishu.cn') ||
        lower.includes('feishu-boe.cn') ||
        lower.includes('larksuite.com') ||
        lower.includes('larkoffice.com');
      const fallbackName = lower.includes('/minutes/')
        ? '妙记'
        : isFeishu
          ? '飞书云文档'
          : '链接';
      await courseApi.createCourseMaterial(module.id, {
        title: linkName.trim() || `${fallbackName} ${module.materials.length + 1}`,
        fileUrl: url,
      });
      toast.success('材料链接已添加');
      setLinkMode(false);
      setLinkUrl('');
      setLinkName('');
      onMaterialsChanged();
    } catch (e) {
      logger.error('添加材料链接失败', JSON.stringify(e));
      toast.error('材料链接添加失败，请稍后重试');
    } finally {
      setLinkSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {module.title}
          </DialogTitle>
          <DialogDescription className="text-left">
            点击资料条目可标记已学 / 取消标记，学习进度实时累计
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              已学 {learnedCount} / {module.items.length} 条资料
            </span>
            <span className="font-semibold text-foreground">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <div className="flex flex-col gap-2">
          {module.items.map((item) => (
            <button
              key={item.id}
              type="button"
              onClick={() => onToggleLearned(item.id, !item.learned)}
              className={`flex items-center gap-3 rounded-lg border p-3 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                item.learned
                  ? 'border-success/30 bg-success/10'
                  : 'border-border bg-card hover:bg-muted'
              }`}
            >
              {item.learned ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-success" />
              ) : (
                <Circle className="h-5 w-5 shrink-0 text-muted-foreground" />
              )}
              <span className="break-words text-foreground">{item.title}</span>
            </button>
          ))}
          {module.items.length === 0 && (
            <p className="py-4 text-center text-sm text-muted-foreground">
              暂无学习资料
            </p>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
              <Paperclip className="h-4 w-4 text-primary" />
              培训材料（{module.materials.length}）
            </span>
            <Can action="manage" subject="Newcomer">
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  void handleFileSelected(event.target.files?.[0]);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-4 w-4" />
                )}
                {uploading ? '上传中…' : '上传材料'}
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setLinkMode((prev) => !prev)}
              >
                <Link2 className="mr-1 h-4 w-4" />
                添加链接
              </Button>
            </Can>
          </div>
          {linkMode && (
            <div className="flex flex-wrap gap-2 rounded-lg border border-border bg-muted/40 p-2">
              <Input
                value={linkName}
                onChange={(event) => setLinkName(event.target.value)}
                placeholder="名称（可选）"
                className="w-36"
              />
              <Input
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
                placeholder="粘贴飞书云文档 / 妙记链接"
                className="min-w-52 flex-1"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && linkUrl.trim()) {
                    event.preventDefault();
                    void handleAddLink();
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                disabled={!linkUrl.trim() || linkSaving}
                onClick={() => void handleAddLink()}
              >
                {linkSaving ? (
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-1 h-4 w-4" />
                )}
                添加
              </Button>
            </div>
          )}
          <div className="flex flex-col gap-1.5">
            {module.materials.map((material) => (
              <div
                key={material.id}
                className="flex items-center gap-3 rounded-lg border border-border bg-card p-3"
              >
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <a
                  href={material.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="min-w-0 flex-1 break-words text-sm text-foreground hover:text-primary hover:underline"
                >
                  {material.title}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatMaterialDate(material.uploadedAt)}
                </span>
                <Can action="manage" subject="Newcomer">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    disabled={deletingId === material.id}
                    onClick={() => void handleDeleteMaterial(material)}
                  >
                    {deletingId === material.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </Can>
              </div>
            ))}
            {module.materials.length === 0 && (
              <p className="py-2 text-center text-xs text-muted-foreground">
                暂无培训材料，可由管理员上传学习文档
              </p>
            )}
          </div>
        </div>

        <div className="rounded-lg bg-muted p-3 text-xs text-muted-foreground">
          通关要求：{module.requirement}（考核 {module.quizzes.length} 题，得分 80
          分及以上通关）
        </div>

        <DialogFooter>
          <Button
            type="button"
            disabled={module.quizzes.length === 0}
            onClick={onStartExam}
          >
            开始通关考核
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CourseDetailDialog;
