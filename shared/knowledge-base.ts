/** 知识库内容来源类型（运行时可用） */
export const KB_SOURCE_TYPES = ['external_link', 'upload', 'text'] as const;

export type KbSourceType = (typeof KB_SOURCE_TYPES)[number];

/** 来源类型中文展示映射 */
export const KB_SOURCE_LABELS: Record<KbSourceType, string> = {
  external_link: '外部链接',
  upload: '上传文件',
  text: '文字内容',
};

/** 销售知识库条目 */
export interface KbItem {
  id: string;
  title: string;
  category: string;
  sourceType: KbSourceType;
  url: string;
  description: string | null;
}

/** 知识库列表响应 */
export interface KbItemListResponse {
  items: KbItem[];
}

/** 新增知识库条目请求 */
export interface CreateKbItemRequest {
  title: string;
  category: string;
  sourceType: KbSourceType;
  url: string;
  description?: string;
}
