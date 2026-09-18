import type { NotificationInterceptor, NotificationOptions } from './types'

/**
 * 内置拦截器集合
 * 提供常用的拦截器实现
 */

/**
 * 频率限制拦截器 - 防止同一标题通知在短时间内过度发送
 */
export class RateLimitInterceptor implements NotificationInterceptor {
  name = 'rateLimitInterceptor'
  order = 1

  private titleMap: Map<string, number> = new Map()
  private maxPerMinute: number

  constructor(maxPerMinute: number = 10) {
    this.maxPerMinute = maxPerMinute
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const key = options.title
    const now = Date.now()
    const last = this.titleMap.get(key) || 0

    if (now - last < 60000) {
      const count = Array.from(this.titleMap.values()).filter(
        t => now - t < 60000
      ).length

      if (count >= this.maxPerMinute) {
        console.warn(`[${this.name}] 通知频率超限，被丢弃:`, options.title)
        return null
      }
    }

    this.titleMap.set(key, now)
    return options
  }
}

/**
 * 关键字过滤拦截器 - 过滤包含某些关键字的通知
 */
export class KeywordFilterInterceptor implements NotificationInterceptor {
  name = 'keywordFilterInterceptor'
  order = 2

  private blacklist: Set<string>
  private whitelist: Set<string> | null = null

  constructor(keywords: string[], isBlacklist: boolean = true) {
    if (isBlacklist) {
      this.blacklist = new Set(keywords)
    } else {
      this.whitelist = new Set(keywords)
      this.blacklist = new Set()
    }
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const text = `${options.title} ${options.body}`.toLowerCase()

    if (this.whitelist) {
      const hasKeyword = Array.from(this.whitelist).some(kw =>
        text.includes(kw.toLowerCase())
      )
      if (!hasKeyword) return null
    } else {
      const hasKeyword = Array.from(this.blacklist).some(kw =>
        text.includes(kw.toLowerCase())
      )
      if (hasKeyword) return null
    }

    return options
  }
}

/**
 * 去重拦截器 - 防止相同内容的通知重复发送
 */
export class DeduplicationInterceptor implements NotificationInterceptor {
  name = 'deduplicationInterceptor'
  order = 3

  private recentHashes: Map<string, number> = new Map()
  private hashTimeout: number

  constructor(timeoutMs: number = 5000) {
    this.hashTimeout = timeoutMs
  }

  private hashOptions(options: NotificationOptions): string {
    return `${options.title}|${options.body}`
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const hash = this.hashOptions(options)
    const now = Date.now()
    const last = this.recentHashes.get(hash)

    if (last && now - last < this.hashTimeout) {
      console.warn(`[${this.name}] 通知已去重，被丢弃`)
      return null
    }

    this.recentHashes.set(hash, now)

    // 清理过期记录
    for (const [key, value] of this.recentHashes.entries()) {
      if (now - value > this.hashTimeout * 2) {
        this.recentHashes.delete(key)
      }
    }

    return options
  }
}

/**
 * 时间段拦截器 - 仅在指定时间段发送通知
 */
export class TimeWindowInterceptor implements NotificationInterceptor {
  name = 'timeWindowInterceptor'
  order = 4

  private startHour: number
  private endHour: number
  private ignorePriority: string[]

  constructor(
    startHour: number = 9,
    endHour: number = 22,
    ignorePriority: string[] = ['high', 'max']
  ) {
    this.startHour = startHour
    this.endHour = endHour
    this.ignorePriority = ignorePriority
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const hour = new Date().getHours()
    const inWindow = hour >= this.startHour && hour < this.endHour

    if (!inWindow && !this.ignorePriority.includes(options.priority || '')) {
      console.warn(`[${this.name}] 超出时间窗口，通知被推迟`)
      return null
    }

    return options
  }
}

/**
 * 内容增强拦截器 - 自动添加时间戳等信息
 */
export class EnhancementInterceptor implements NotificationInterceptor {
  name = 'enhancementInterceptor'
  order = 0 // 最先执行

  private addTimestamp: boolean
  private addTag: string | null

  constructor(addTimestamp: boolean = true, addTag: string | null = null) {
    this.addTimestamp = addTimestamp
    this.addTag = addTag
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const enhanced = { ...options }

    if (this.addTimestamp) {
      const time = new Date().toLocaleTimeString('zh-CN')
      enhanced.smallText = `[${time}] ${options.smallText || ''}`
    }

    if (this.addTag) {
      enhanced.body = `${enhanced.body} #${this.addTag}`
    }

    return enhanced
  }
}

/**
 * 日志拦截器 - 记录所有通知事件
 */
export class LoggingInterceptor implements NotificationInterceptor {
  name = 'loggingInterceptor'
  order = 100 // 最后执行

  private logs: Array<{ type: string; data: any; timestamp: Date }> = []
  private maxLogs: number

  constructor(maxLogs: number = 100) {
    this.maxLogs = maxLogs
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    this.addLog('beforeSend', options)
    return options
  }

  async afterSend(options: NotificationOptions, id: number): Promise<void> {
    this.addLog('afterSend', { options, id })
  }

  async onClick(options: NotificationOptions): Promise<boolean> {
    this.addLog('onClick', options)
    return true
  }

  async onDismiss(id: number): Promise<void> {
    this.addLog('onDismiss', { id })
  }

  async onError(error: Error, options: NotificationOptions): Promise<void> {
    this.addLog('onError', { error: error.message, options })
  }

  private addLog(type: string, data: any): void {
    this.logs.push({ type, data, timestamp: new Date() })
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }
  }

  getLogs(): Array<{ type: string; data: any; timestamp: Date }> {
    return [...this.logs]
  }

  clearLogs(): void {
    this.logs = []
  }
}

/**
 * 优先级升级拦截器 - 根据规则自动升级通知优先级
 */
export class PriorityElevationInterceptor implements NotificationInterceptor {
  name = 'priorityElevationInterceptor'
  order = 5

  private rules: Array<{
    pattern: RegExp | string
    priority: string
  }> = []

  addRule(pattern: RegExp | string, priority: string): void {
    this.rules.push({ pattern, priority })
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const text = `${options.title} ${options.body}`

    for (const rule of this.rules) {
      const match = typeof rule.pattern === 'string'
        ? text.includes(rule.pattern)
        : rule.pattern.test(text)

      if (match) {
        options.priority = rule.priority as any
        break
      }
    }

    return options
  }
}

/**
 * 批量合并拦截器 - 将相似通知合并
 */
export class BatchMergeInterceptor implements NotificationInterceptor {
  name = 'batchMergeInterceptor'
  order = 6

  private pendingNotifications: Map<string, NotificationOptions> = new Map()
  private mergeTimeout: number

  constructor(timeoutMs: number = 1000) {
    this.mergeTimeout = timeoutMs
  }

  async beforeSend(options: NotificationOptions): Promise<NotificationOptions | null> {
    const key = options.title

    // 检查是否有相同标题的待处理通知
    if (this.pendingNotifications.has(key)) {
      const pending = this.pendingNotifications.get(key)!
      // 合并内容
      pending.body = `${pending.body}\n${options.body}`
      return null // 不发送当前通知
    }

    // 添加到待处理队列
    this.pendingNotifications.set(key, options)

    // 设置超时后真正发送
    setTimeout(() => {
      this.pendingNotifications.delete(key)
    }, this.mergeTimeout)

    return options
  }
}

/**
 * 预定义拦截器工厂
 */
export const InterceptorFactory = {
  /**
   * 创建标准安全配置的拦截器集合
   */
  createSafeInterceptors() {
    return [
      new EnhancementInterceptor(true),
      new RateLimitInterceptor(20),
      new DeduplicationInterceptor(3000),
      new LoggingInterceptor(),
    ]
  },

  /**
   * 创建生产环境配置
   */
  createProductionInterceptors() {
    return [
      new EnhancementInterceptor(true, 'PROD'),
      new RateLimitInterceptor(100),
      new DeduplicationInterceptor(5000),
      new TimeWindowInterceptor(8, 22, ['high', 'max']),
      new KeywordFilterInterceptor(['debug', 'test'], true),
      new LoggingInterceptor(1000),
    ]
  },

  /**
   * 创建开发环境配置
   */
  createDevelopmentInterceptors() {
    return [
      new EnhancementInterceptor(true, 'DEV'),
      new LoggingInterceptor(500),
    ]
  },

  /**
   * 创建最小化配置
   */
  createMinimalInterceptors() {
    return [
      new DeduplicationInterceptor(2000),
    ]
  },
}
