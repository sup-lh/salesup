import { axiosForBackend } from '@/lib/http';
import { logger } from '@/lib/logger';
import { ensureNotForbidden } from '@client/src/utils/api-error';
import type {
  DashboardPeriod,
  DashboardStatisticsResponse,
} from '@shared/api.interface';

/** 成长数据看板统计（period: quarter 近90天 / half_year 近半年 / all 全部） */
export async function fetchDashboardStatistics(
  period: DashboardPeriod,
): Promise<DashboardStatisticsResponse> {
  try {
    const response = await axiosForBackend.get<DashboardStatisticsResponse>(
      '/api/dashboard/statistics',
      { params: { period } },
    );
    ensureNotForbidden(response);
    return response.data;
  } catch (error) {
    logger.error(
      '获取看板统计失败',
      error instanceof Error ? error.message : String(error),
    );
    throw error;
  }
}
