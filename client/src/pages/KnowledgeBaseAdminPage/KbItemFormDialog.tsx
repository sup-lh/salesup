import { useState } from 'react';
import { toast } from 'sonner';
import { Save, X } from 'lucide-react';
import {
  KB_SOURCE_LABELS,
  KB_SOURCE_TYPES,
  type CreateKbItemRequest,
  type KbSourceType,
} from '@shared/api.interface';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import { Label } from '@client/src/components/ui/label';
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

interface KbItemFormState {
  title: string;
  category: string;
  sourceType: string;
  url: string;
  description: string;
}

const EMPTY_FORM: KbItemFormState = {
  title: '',
  category: '',
  sourceType: 'external_link',
  url: '',
  description: '',
};

const KbItemFormDialog = ({
  open,
  saving,
  onClose,
  onSubmit,
}: {
  open: boolean;
  saving: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateKbItemRequest) => Promise<void>;
}) => {
  const [form, setForm] = useState<KbItemFormState>(EMPTY_FORM);
  const [formKey, setFormKey] = useState(0);

  const closeDialog = (): void => {
    setForm(EMPTY_FORM);
    setFormKey((key: number) => key + 1);
    onClose();
  };

  const handleSubmit = async (): Promise<void> => {
    if (!form.title.trim()) {
      toast.error('请填写标题');
      return;
    }
    if (!form.category.trim()) {
      toast.error('请填写分类');
      return;
    }
    if (!/^https?:\/\/.+/u.test(form.url.trim())) {
      toast.error('链接需以 http(s):// 开头');
      return;
    }
    await onSubmit({
      title: form.title.trim(),
      category: form.category.trim(),
      sourceType: form.sourceType as KbSourceType,
      url: form.url.trim(),
      description: form.description.trim() || undefined,
    });
    closeDialog();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (!next) closeDialog();
      }}
    >
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>新增知识库内容</DialogTitle>
          <DialogDescription>
            保存外部资料链接或上传文件，保存后新人工作台立即可见。
          </DialogDescription>
        </DialogHeader>
        <div key={formKey} className="grid gap-4 py-2">
          <div className="grid gap-2">
            <Label>标题</Label>
            <Input
              value={form.title}
              placeholder="如：数智玄策销售方法论 v2"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev: KbItemFormState) => ({ ...prev, title: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>分类</Label>
            <Input
              value={form.category}
              placeholder="如：产品知识 / 销售技巧 / 客户案例"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev: KbItemFormState) => ({ ...prev, category: e.target.value }))
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>内容类型</Label>
            <Select
              value={form.sourceType}
              onValueChange={(value: string) =>
                setForm((prev: KbItemFormState) => ({ ...prev, sourceType: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="选择内容类型" />
              </SelectTrigger>
              <SelectContent>
                {KB_SOURCE_TYPES.map((type: KbSourceType) => (
                  <SelectItem key={type} value={type}>
                    {KB_SOURCE_LABELS[type]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>链接</Label>
            <Input
              value={form.url}
              placeholder="粘贴资料链接（https://…）"
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setForm((prev: KbItemFormState) => ({ ...prev, url: e.target.value }))
              }
            />
            <p className="text-xs text-muted-foreground">
              支持公开互联网链接，包括飞书公开分享链接。
            </p>
          </div>
          <div className="grid gap-2">
            <Label>内容简介（可选）</Label>
            <Textarea
              value={form.description}
              placeholder="简要说明该内容的学习价值"
              rows={3}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                setForm((prev: KbItemFormState) => ({ ...prev, description: e.target.value }))
              }
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" disabled={saving} onClick={closeDialog}>
            <X className="size-4" />
            取消
          </Button>
          <Button disabled={saving} onClick={() => void handleSubmit()}>
            <Save className="size-4" />
            {saving ? '保存中…' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default KbItemFormDialog;
