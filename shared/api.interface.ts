/* 前后端共享的类型入口：按领域拆分，统一从此文件导出 */
export * from './common';
export * from './newcomer';
export * from './challenge';
export * from './course';
export * from './coaching-review';
export * from './dashboard';
export * from './opportunity';
export * from './roleManager';
export * from './knowledge-base';
export * from './stage';
export type { DefensePrerequisiteStatus, DefenseApplicationItem, DefenseApplicationStatus } from './newcomer';
