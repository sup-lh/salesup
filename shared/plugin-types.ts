// ---- plugin:probation_interview_application_notification_1 ----
// ============================================================
// 插件 probation_interview_application_notification_1 (转正面试申请通知) 的类型定义
// 由 get_plugin_ai_json 自动生成
// ============================================================

export interface ProbationInterviewApplicationNotificationOneInput {
  /** 新人入职日期 */
  entry_date: string;
  /** 新人当前阶段 */
  current_stage: string;
  /** 转正申请跳转链接 */
  application_url: string;
  /** 新人姓名 */
  newcomer_name: string;
}

/**
 * capabilityClient.load('probation_interview_application_notification_1').call<ProbationInterviewApplicationNotificationOneOutput>('send_feishu_message', input)
 * 直接返回此类型，无 .data 包装，直接解构使用：
 * const { success } = result;
 * 返回值形如：
 *   {"success":false}
 */
export interface ProbationInterviewApplicationNotificationOneOutput {
  /** [object Object] */
  success: boolean;
}
// ---- end:probation_interview_application_notification_1 ----