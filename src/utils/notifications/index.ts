/**
 * 通知系统导出入口
 */

export { NotificationManager, createNotificationManager, getNotificationManager } from './NotificationManager'
export type {
  NotificationPriority,
  NotificationAction,
  NotificationPayload,
  NotificationStyle,
  NotificationSchedule,
  NotificationOptions,
  NotificationChannel,
  NotificationInterceptor,
  NotificationListener,
  NotificationGroup,
  NotificationTemplate,
  NotificationHistory,
  NotificationStats,
  NotificationHooks,
  NotificationSystemConfig,
} from './types'

export {
  RateLimitInterceptor,
  KeywordFilterInterceptor,
  DeduplicationInterceptor,
  TimeWindowInterceptor,
  EnhancementInterceptor,
  LoggingInterceptor,
  PriorityElevationInterceptor,
  BatchMergeInterceptor,
  InterceptorFactory,
} from './Interceptors'

export {
  NotificationTemplates,
  QuickNotifications,
  NotificationBuilder,
  NotificationUtils,
} from './helpers'
