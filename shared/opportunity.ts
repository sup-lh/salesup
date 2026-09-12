import type { RecordMaterial } from './coaching-review';

/** 新人自助上传商机请求（newcomerId 由服务端按当前用户解析） */
export interface CreateOpportunitySelfRequest {
  name: string;
  customer: string;
  amount: number;
  stage: string;
  recordDate: string;
  expectedDate?: string;
  remark?: string;
  materials?: RecordMaterial[];
}

/** 商机条目（工作台摘要展示用） */
export interface OpportunityItem {
  id: string;
  name: string;
  customer: string;
  amount: number;
  stage: string;
  recordDate: string;
  expectedDate: string | null;
  remark: string;
}

/** 新人商机自助摘要响应 */
export interface OpportunitySelfSummaryResponse {
  count: number;
  items: OpportunityItem[];
}
