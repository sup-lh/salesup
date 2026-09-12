import { useEffect, useState } from 'react';
import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import { NotebookPen } from 'lucide-react';
import type { NewcomerSummary } from '@shared/api.interface';
import { CoachingPanel } from './CoachingPanel';
import { ReviewPanel } from './ReviewPanel';
import type { NewcomerOption } from './shared';

const CoachingPage = () => {
  const [newcomerOptions, setNewcomerOptions] = useState<NewcomerOption[]>([]);

  useEffect(() => {
    let cancelled = false;
    const loadNewcomers = async () => {
      try {
        const response = await axiosForBackend.get('/api/newcomers', {
          params: { offset: 0, pageSize: 100 },
        });
        const items: NewcomerSummary[] = response.data?.items ?? [];
        if (!cancelled) {
          setNewcomerOptions(
            items.map((item: NewcomerSummary) => ({
              id: item.id,
              name: item.name,
            })),
          );
        }
      } catch (error) {
        logger.error('获取新人列表失败', error);
      }
    };
    void loadNewcomers();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="mx-auto max-w-[1400px] p-6">
      <header className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
          <NotebookPen className="size-5" />
        </span>
        <div>
          <h1 className="text-xl font-semibold">带教与复盘</h1>
          <p className="text-sm text-muted-foreground">
            陪访辅导与赢单/输单复盘记录沉淀，助力新人成长
          </p>
        </div>
      </header>
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <CoachingPanel newcomerOptions={newcomerOptions} />
        <ReviewPanel newcomerOptions={newcomerOptions} />
      </div>
    </div>
  );
};

export default CoachingPage;
