import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { BookOpen, ExternalLink, FileText, Link2, Paperclip } from 'lucide-react';
import { listKbItems } from '@client/src/api/knowledgeBase';
import {
  KB_SOURCE_LABELS,
  type KbItem,
  type KbSourceType,
} from '@shared/api.interface';
import { Badge } from '@client/src/components/ui/badge';
import { Button } from '@client/src/components/ui/button';
import { Card } from '@client/src/components/ui/card';
import { Skeleton } from '@client/src/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@client/src/components/ui/tabs';

const SOURCE_ICONS: Record<KbSourceType, React.ComponentType<{ className?: string }>> = {
  external_link: Link2,
  upload: Paperclip,
  text: FileText,
};

const SOURCE_BADGE_CLASS: Record<KbSourceType, string> = {
  external_link: 'bg-primary/10 text-primary',
  upload: 'bg-accent/10 text-accent',
  text: 'bg-muted text-muted-foreground',
};

const KnowledgeBasePage: React.FC = () => {
  const [items, setItems] = useState<KbItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

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

  const categories = useMemo<string[]>(
    () => Array.from(new Set(items.map((item: KbItem) => item.category))),
    [items],
  );

  const visibleItems = useMemo<KbItem[]>(
    () =>
      categoryFilter === 'all'
        ? items
        : items.filter((item: KbItem) => item.category === categoryFilter),
    [items, categoryFilter],
  );

  if (loading) {
    return (
      <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold">销售知识库</h1>
        </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_: number, i: number) => (
              <div key={i} className="rounded-xl border bg-card p-5 shadow-sm">
                <div className="mb-3 flex items-center gap-2">
                  <Skeleton className="size-4 rounded" />
                  <Skeleton className="h-4 w-24 rounded-md" />
                </div>
                <Skeleton className="mb-2 h-4 w-full rounded-md" />
                <Skeleton className="mb-4 h-3 w-3/4 rounded-md" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            ))}
          </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-3 p-16">
        <p className="text-sm text-muted-foreground">{loadError}</p>
        <Button variant="outline" onClick={() => void loadItems(true)}>
          重试
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <BookOpen className="size-6 text-primary" />
          <h1 className="font-display text-2xl font-semibold">销售知识库</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          数智玄策销售方法论、产品知识与优秀案例，点击卡片即可打开资料。
        </p>
      </div>

      {items.length > 0 && (
        <Tabs
          value={categoryFilter}
          onValueChange={(value: string) => setCategoryFilter(value)}
        >
          <TabsList className="flex-wrap">
            <TabsTrigger value="all">全部</TabsTrigger>
            {categories.map((category: string) => (
              <TabsTrigger key={category} value={category}>
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {visibleItems.length === 0 ? (
        <Card className="rounded-xl border bg-card p-12 text-center shadow-sm">
          <p className="text-sm text-muted-foreground">
            {items.length === 0
              ? '知识库暂无内容，请管理员在「知识库管理」中添加'
              : '该分类下暂无内容'}
          </p>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleItems.map((item: KbItem) => {
            const SourceIcon = SOURCE_ICONS[item.sourceType] ?? Link2;
            return (
              <Card
                key={item.id}
                data-ai-section-type="card-list"
                className="flex flex-col gap-3 rounded-xl border bg-card p-6 shadow-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant="secondary"
                    className={`font-normal ${SOURCE_BADGE_CLASS[item.sourceType] ?? ''}`}
                  >
                    <SourceIcon className="mr-1 size-3" />
                    {KB_SOURCE_LABELS[item.sourceType] ?? item.sourceType}
                  </Badge>
                  <Badge variant="outline" className="font-normal">
                    {item.category}
                  </Badge>
                </div>
                <h2 className="text-base font-semibold leading-snug">
                  {item.title}
                </h2>
                {item.description && (
                  <p className="line-clamp-3 flex-1 text-sm leading-relaxed text-muted-foreground">
                    {item.description}
                  </p>
                )}
                <Button asChild variant="outline" size="sm" className="w-fit">
                  <a
                    href={item.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="break-all"
                  >
                    <ExternalLink className="size-4" />
                    打开内容
                  </a>
                </Button>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default KnowledgeBasePage;
