/* 阶段配置类型 */

/** 阶段配置项 */
export interface StageCatalogItem {
  id: string;
  code: string;
  name: string;
  sort: number;
  startDay: number;
  endDay: number;
  standard: string;
  hasDefense: boolean;
}