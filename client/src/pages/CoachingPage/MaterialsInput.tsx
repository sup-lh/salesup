import { useRef, useState } from 'react';
import {
  FileText,
  Link2,
  Loader2,
  Paperclip,
  Plus,
  Trash2,
  Upload,
} from 'lucide-react';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { axiosForBackend } from '@/lib/http';
import { Button } from '@client/src/components/ui/button';
import { Input } from '@client/src/components/ui/input';
import type { RecordMaterial } from '@shared/api.interface';

const SOURCE_META: Record<
  RecordMaterial['source'],
  { label: string; icon: typeof FileText }
> = {
  upload: { label: '文件', icon: Paperclip },
  external_link: { label: '外部链接', icon: Link2 },
};

const SOURCE_ORDER: RecordMaterial['source'][] = ['upload', 'external_link'];

const detectSource = (): RecordMaterial['source'] => 'external_link';

interface MaterialsInputProps {
  value: RecordMaterial[];
  onChange: (value: RecordMaterial[]) => void;
}

const MaterialsInput = ({ value, onChange }: MaterialsInputProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkName, setLinkName] = useState('');

  const handleFileSelected = async (file: File | undefined) => {
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const { data } = await axiosForBackend.post<{ key: string; url: string }>('/api/storage/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      onChange([
        ...value,
        { name: file.name, url: data.url, source: 'upload' },
      ]);
    } catch (e) {
      logger.error('上传材料失败', JSON.stringify(e));
      toast.error('文件上传失败，请稍后重试');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleAddLink = () => {
    const url = linkUrl.trim();
    if (!/^https?:\/\//.test(url)) {
      toast.error('请粘贴以 http(s):// 开头的链接');
      return;
    }
    const source = detectSource();
    const fallbackName = '外部链接';
    onChange([
      ...value,
      { name: linkName.trim() || `${fallbackName} ${value.length + 1}`, url, source },
    ]);
    setLinkUrl('');
    setLinkName('');
  };

  const handleRemove = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={(event) => {
          void handleFileSelected(event.target.files?.[0]);
        }}
      />
      <div className="flex flex-wrap gap-2">
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
          {uploading ? '上传中…' : '上传文件'}
        </Button>
        <span className="flex items-center text-xs text-muted-foreground">
          或粘贴外部资料链接
        </span>
      </div>
      <div className="flex flex-wrap gap-2">
        <Input
          value={linkName}
          onChange={(event) => setLinkName(event.target.value)}
          placeholder="名称（可选）"
          className="w-32"
        />
        <Input
          value={linkUrl}
          onChange={(event) => setLinkUrl(event.target.value)}
          placeholder="https://example.com/material"
          className="min-w-52 flex-1"
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              handleAddLink();
            }
          }}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleAddLink}
          disabled={!linkUrl.trim()}
        >
          <Plus className="mr-1 h-4 w-4" />
          添加
        </Button>
      </div>
      {value.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {value.map((material, index) => {
            const meta = SOURCE_META[material.source] ?? SOURCE_META.external_link;
            const Icon = meta.icon;
            return (
              <span
                key={`${material.url}-${index}`}
                className="flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 py-1 pl-2.5 pr-1 text-sm"
              >
                <Icon className="size-3.5 shrink-0 text-primary" />
                <a
                  href={material.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="max-w-56 truncate break-all text-foreground hover:text-primary hover:underline"
                >
                  {material.name}
                </a>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {meta.label}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="size-6 shrink-0 text-muted-foreground hover:text-destructive"
                  onClick={() => handleRemove(index)}
                >
                  <Trash2 className="size-3" />
                </Button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
};

/** 材料展示列表（记录卡片用） */
export function MaterialLinks({ materials }: { materials: RecordMaterial[] }) {
  if (!materials || materials.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-2">
      {materials.map((material, index) => {
        const meta =
          SOURCE_ORDER.includes(material.source) && material.source in SOURCE_META
            ? SOURCE_META[material.source]
            : SOURCE_META.external_link;
        const Icon = meta.icon;
        return (
          <a
            key={`${material.url}-${index}`}
            href={material.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex max-w-full items-center gap-1.5 rounded-full border border-border bg-muted/50 px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary/40 hover:text-primary"
          >
            <Icon className="size-3.5 shrink-0 text-primary" />
            <span className="max-w-56 truncate break-all">{material.name}</span>
            <span className="shrink-0 text-muted-foreground">{meta.label}</span>
          </a>
        );
      })}
    </div>
  );
}

export default MaterialsInput;
