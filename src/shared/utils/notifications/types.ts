/**
 * 通知系统类型定义
 * 提供完整的TypeScript类型支持
 */

/**
 * 通知优先级
 */
export type NotificationPriority = 'min' | 'low' | 'default' | 'high' | 'max'

/**
 * 通知操作按钮
 */
export interface NotificationAction {
  id: string
  title: string
  foreground?: boolean
  authenticationRequired?: boolean
}

/**
 * 通知自定义数据
 */
export interface NotificationPayload {
  [key: string]: any
}

/**
 * 通知样式配置
 */
export interface NotificationStyle {
  // Android 特定
  ledARGB?: number
  ledOnMs?: number
  ledOffMs?: number
  vibrate?: number[]
  smallIcon?: string
  largeIcon?: string
  color?: string
  channelId?: string
  channelName?: string
  channelDescription?: string
  androidSoundUrl?: string
  
  // iOS 特定
  badge?: number
  iosSound?: boolean
  iosAlert?: boolean
  
  // 通用样式
  groupSummary?: boolean
  group?: string
  tag?: string
  sticky?: boolean
}

/**
 * 通知定时配置
 */
export interface NotificationSchedule {
  at?: Date                    // 指定时间
  every?: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute' // 重复间隔
  count?: number              // 重复次数
  interval?: number           // 自定义间隔（秒）
  allowWhileIdle?: boolean    // 是否允许在空闲时发送
}

/**
 * 通知完整配置
 */
export interface NotificationOptions {
  // 基础信息
  id?: number
  title: string
  body: string
  smallText?: string
  
  // 外观
  largeBody?: string
  bigText?: string
  inboxStyle?: string[]
  
  // 交互
  actions?: NotificationAction[]
  autoCancel?: boolean
  ongoing?: boolean
  
  // 优先级和渠道
  priority?: NotificationPriority
  level?: number
  
  // 定时
  schedule?: NotificationSchedule
  
  // 样式和主题
  style?: NotificationStyle
  
  // 自定义数据
  data?: NotificationPayload
  
  // 其他选项
  threadId?: string
  groupSummary?: boolean
  silent?: boolean
}

/**
 * 通知通道配置（Android 8.0+）
 */
export interface NotificationChannel {
  id: string
  name: string
  description?: string
  importance?: 'min' | 'low' | 'default' | 'high' | 'max'
  enableVibration?: boolean
  soundName?: string
  lights?: boolean
  lightColor?: string
  bypassDnd?: boolean
}

/**
 * 通知拦截器
 */
export interface NotificationInterceptor {
  name: string
  order?: number
  
  // 发送前拦截
  beforeSend?: (options: NotificationOptions) => Promise<NotificationOptions | null>
  
  // 发送后处理
  afterSend?: (options: NotificationOptions, id: number) => Promise<void>
  
  // 点击时拦截
  onClick?: (options: NotificationOptions) => Promise<boolean>
  
  // 关闭时拦截
  onDismiss?: (id: number) => Promise<void>
  
  // 错误处理
  onError?: (error: Error, options: NotificationOptions) => Promise<void>
}

/**
 * 通知事件监听器
 */
export interface NotificationListener {
  type: 'click' | 'dismiss' | 'action' | 'error'
  callback: (data: any) => void | Promise<void>
  once?: boolean
}

/**
 * 通知群组配置
 */
export interface NotificationGroup {
  id: string
  title: string
  options?: Partial<NotificationOptions>
  interceptors?: NotificationInterceptor[]
}

/**
 * 通知模板
 */
export interface NotificationTemplate {
  id: string
  name: string
  description?: string
  options: NotificationOptions
  variables?: string[]
}

/**
 * 通知历史记录
 */
export interface NotificationHistory {
  id: number
  title: string
  body: string
  timestamp: Date
  status: 'sent' | 'pending' | 'failed'
  error?: string
  metadata?: Record<string, any>
}

/**
 * 通知统计
 */
export interface NotificationStats {
  totalSent: number
  totalFailed: number
  totalDismissed: number
  totalClicked: number
  channels: Record<string, number>
  templates: Record<string, number>
}

/**
 * 通知生命周期钩子
 */
export interface NotificationHooks {
  onBeforeCreate?: (options: NotificationOptions) => void | Promise<void>
  onAfterCreate?: (id: number, options: NotificationOptions) => void | Promise<void>
  onBeforeSend?: (options: NotificationOptions) => void | Promise<void>
  onAfterSend?: (id: number, options: NotificationOptions) => void | Promise<void>
  onBeforeSchedule?: (options: NotificationOptions & { schedule: NotificationSchedule }) => void | Promise<void>
  onAfterSchedule?: (id: number, options: NotificationOptions & { schedule: NotificationSchedule }) => void | Promise<void>
  onError?: (error: Error, context: string) => void | Promise<void>
}

/**
 * 通知系统配置
 */
export interface NotificationSystemConfig {
  // 默认选项
  defaultOptions?: Partial<NotificationOptions>
  
  // 默认通道
  defaultChannel?: NotificationChannel
  
  // 默认优先级
  defaultPriority?: NotificationPriority
  
  // 是否启用历史记录
  enableHistory?: boolean
  
  // 历史记录最大条数
  maxHistorySize?: number
  
  // 是否启用统计
  enableStats?: boolean
  
  // 自动清理已发送通知（秒）
  autoClearTimeout?: number
  
  // 生命周期钩子
  hooks?: NotificationHooks
  
  // 全局拦截器
  interceptors?: NotificationInterceptor[]
}
