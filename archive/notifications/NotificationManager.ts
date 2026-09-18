import { LocalNotifications } from '@capacitor/local-notifications'
import type {
  NotificationOptions,
  NotificationInterceptor,
  NotificationListener,
  NotificationChannel,
  NotificationGroup,
  NotificationTemplate,
  NotificationSystemConfig,
  NotificationHistory,
  NotificationStats,
} from './types'

/**
 * 通知管理系统
 * 提供强大的通知发送、拦截、监听、模板等功能
 */
export class NotificationManager {
  // 配置
  private config: Required<NotificationSystemConfig>
  
  // 状态管理
  private notificationCounter = 1000
  private listeners: Map<string, NotificationListener[]> = new Map()
  private history: NotificationHistory[] = []
  private stats: NotificationStats = {
    totalSent: 0,
    totalFailed: 0,
    totalDismissed: 0,
    totalClicked: 0,
    channels: {},
    templates: {},
  }
  
  // 拦截器
  private interceptors: NotificationInterceptor[] = []
  
  // 模板和群组
  private templates: Map<string, NotificationTemplate> = new Map()
  private groups: Map<string, NotificationGroup> = new Map()
  private channels: Map<string, NotificationChannel> = new Map()
  
  // 队列系统
  private sendQueue: NotificationOptions[] = []
  private isProcessing = false
  private queueTimeout: number | null = null
  
  // 事件队列去重
  private eventQueue: Set<string> = new Set()

  constructor(config?: NotificationSystemConfig) {
    // 默认配置
    this.config = {
      defaultOptions: config?.defaultOptions || {},
      defaultChannel: config?.defaultChannel || this.createDefaultChannel(),
      defaultPriority: config?.defaultPriority || 'default',
      enableHistory: config?.enableHistory !== false,
      maxHistorySize: config?.maxHistorySize || 1000,
      enableStats: config?.enableStats !== false,
      autoClearTimeout: config?.autoClearTimeout || 3600,
      hooks: config?.hooks || {},
      interceptors: config?.interceptors || [],
    }

    this.interceptors = this.config.interceptors
    
    // 初始化事件监听
    this.setupEventListeners()
    
    // 创建默认通道
    if (this.config.defaultChannel) {
      this.createChannel(this.config.defaultChannel)
    }
  }

  /**
   * 发送通知
   */
  async send(options: NotificationOptions): Promise<number> {
    try {
      // 触发生命周期钩子
      await this.config.hooks?.onBeforeSend?.(options)

      // 合并默认配置
      const mergedOptions = this.mergeDefaultOptions(options)

      // 执行拦截器链
      const interceptedOptions = await this.executeInterceptors(
        'beforeSend',
        mergedOptions
      )

      if (!interceptedOptions) {
        await this.recordHistory(options, 'failed', '被拦截器阻止')
        return -1
      }

      // 生成通知 ID
      const notificationId = this.generateNotificationId()

      // 发送通知
      const notificationPayload: any = {
        notifications: [{
          id: notificationId,
          title: interceptedOptions.title,
          body: interceptedOptions.body,
          smallText: interceptedOptions.smallText,
          largeBody: interceptedOptions.largeBody,
          summary: interceptedOptions.smallText,
          autoCancel: interceptedOptions.autoCancel ?? true,
          channelId: interceptedOptions.style?.channelId || this.config.defaultChannel?.id || 'default',
          actions: interceptedOptions.actions,
          schedule: this.transformSchedule(interceptedOptions.schedule),
          extra: interceptedOptions.data,
          ...this.transformStyle(interceptedOptions.style),
        }]
      }
      
      await LocalNotifications.schedule(notificationPayload)

      // 发送后处理
      await this.executeInterceptors('afterSend', interceptedOptions, notificationId)
      await this.config.hooks?.onAfterSend?.(notificationId, interceptedOptions)

      // 记录统计
      this.recordStats(true, interceptedOptions)
      await this.recordHistory(options, 'sent')

      return notificationId
    } catch (error) {
      await this.config.hooks?.onError?.(error as Error, 'send')
      await this.executeInterceptors('onError', error)
      await this.recordHistory(options, 'failed', (error as Error).message)
      this.stats.totalFailed++
      throw error
    }
  }

  /**
   * 批量发送通知
   */
  async sendBatch(optionsArray: NotificationOptions[]): Promise<number[]> {
    const results = await Promise.allSettled(
      optionsArray.map(options => this.send(options))
    )
    return results
      .map(result => (result.status === 'fulfilled' ? result.value : -1))
  }

  /**
   * 加入队列发送（支持批处理）
   */
  queueSend(
    options: NotificationOptions,
    delayMs: number = 100
  ): Promise<number> {
    return new Promise(resolve => {
      this.sendQueue.push(options)

      // 清除旧的定时器
      if (this.queueTimeout !== null) {
        clearTimeout(this.queueTimeout)
      }

      // 设置新的定时器
      this.queueTimeout = window.setTimeout(() => {
        this.flushQueue().then(ids => {
          resolve(ids[0] || -1)
        })
      }, delayMs)
    })
  }

  /**
   * 刷新发送队列
   */
  async flushQueue(): Promise<number[]> {
    if (this.isProcessing || this.sendQueue.length === 0) {
      return []
    }

    this.isProcessing = true
    const batch = [...this.sendQueue]
    this.sendQueue = []

    try {
      const results = await this.sendBatch(batch)
      return results
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * 定时发送通知
   */
  async schedule(
    options: NotificationOptions & {
      schedule: NonNullable<NotificationOptions['schedule']>
    }
  ): Promise<number> {
    try {
      await this.config.hooks?.onBeforeSchedule?.(options)

      const notificationId = this.generateNotificationId()

      const payload: any = {
        notifications: [{
          id: notificationId,
          title: options.title,
          body: options.body,
          schedule: this.transformSchedule(options.schedule),
          channelId: options.style?.channelId || this.config.defaultChannel?.id || 'default',
          extra: options.data,
          ...this.transformStyle(options.style),
        }]
      }

      await LocalNotifications.schedule(payload)

      await this.config.hooks?.onAfterSchedule?.(notificationId, options)
      this.recordStats(true, options)

      return notificationId
    } catch (error) {
      await this.config.hooks?.onError?.(error as Error, 'schedule')
      throw error
    }
  }

  /**
   * 取消通知
   */
  async cancel(notificationId: number): Promise<void> {
    await LocalNotifications.cancel({ notifications: [{ id: notificationId }] } as any)
  }

  /**
   * 取消所有通知
   */
  async cancelAll(): Promise<void> {
    const pending = await LocalNotifications.getPending() as any
    const notifications = pending?.notifications || []
    if (notifications.length > 0) {
      await LocalNotifications.cancel({ notifications } as any)
    }
  }

  /**
   * 创建通知通道（Android）
   */
  async createChannel(channel: NotificationChannel): Promise<void> {
    this.channels.set(channel.id, channel)

    try {
      await LocalNotifications.createChannel({
        id: channel.id,
        name: channel.name,
        description: channel.description,
        importance: this.transformImportance(channel.importance || 'default'),
        enableVibration: channel.enableVibration,
        lights: channel.lights,
        lightColor: channel.lightColor,
        bypassDnd: channel.bypassDnd,
        sound: channel.soundName,
      } as any)
    } catch (error) {
      // 某些平台可能不支持通道创建
      console.warn('创建通知通道失败:', error)
    }
  }

  /**
   * 添加拦截器
   */
  addInterceptor(interceptor: NotificationInterceptor): void {
    this.interceptors.push(interceptor)
    // 按 order 排序
    this.interceptors.sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
  }

  /**
   * 移除拦截器
   */
  removeInterceptor(name: string): void {
    this.interceptors = this.interceptors.filter(i => i.name !== name)
  }

  /**
   * 注册事件监听器
   */
  on(type: 'click' | 'dismiss' | 'action' | 'error', callback: (data: any) => void): void {
    const key = type
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key)!.push({ type, callback })
  }

  /**
   * 监听一次事件
   */
  once(type: 'click' | 'dismiss' | 'action' | 'error', callback: (data: any) => void): void {
    const key = type
    if (!this.listeners.has(key)) {
      this.listeners.set(key, [])
    }
    this.listeners.get(key)!.push({ type, callback, once: true })
  }

  /**
   * 取消监听
   */
  off(type: 'click' | 'dismiss' | 'action' | 'error', callback?: (data: any) => void): void {
    const key = type
    if (!this.listeners.has(key)) return

    if (!callback) {
      this.listeners.delete(key)
    } else {
      const listeners = this.listeners.get(key)!
      this.listeners.set(
        key,
        listeners.filter(l => l.callback !== callback)
      )
    }
  }

  /**
   * 创建并保存模板
   */
  createTemplate(template: NotificationTemplate): void {
    this.templates.set(template.id, template)
  }

  /**
   * 获取模板
   */
  getTemplate(templateId: string): NotificationTemplate | undefined {
    return this.templates.get(templateId)
  }

  /**
   * 使用模板发送通知
   */
  async sendWithTemplate(
    templateId: string,
    variables?: Record<string, string>
  ): Promise<number> {
    const template = this.getTemplate(templateId)
    if (!template) {
      throw new Error(`模板不存在: ${templateId}`)
    }

    // 替换变量
    const options = this.replaceVariables(template.options, variables)

    // 更新统计
    this.stats.templates[templateId] = (this.stats.templates[templateId] || 0) + 1

    return this.send(options)
  }

  /**
   * 创建通知群组
   */
  createGroup(group: NotificationGroup): void {
    this.groups.set(group.id, group)
  }

  /**
   * 获取群组
   */
  getGroup(groupId: string): NotificationGroup | undefined {
    return this.groups.get(groupId)
  }

  /**
   * 发送群组内通知
   */
  async sendGroupNotification(
    groupId: string,
    options: Partial<NotificationOptions>
  ): Promise<number> {
    const group = this.getGroup(groupId)
    if (!group) {
      throw new Error(`群组不存在: ${groupId}`)
    }

    const mergedOptions = {
      ...group.options,
      ...options,
    } as NotificationOptions

    // 应用群组拦截器
    if (group.interceptors) {
      const tempInterceptors = this.interceptors
      this.interceptors = [...this.interceptors, ...group.interceptors]

      try {
        return await this.send(mergedOptions)
      } finally {
        this.interceptors = tempInterceptors
      }
    }

    return this.send(mergedOptions)
  }

  /**
   * 获取历史记录
   */
  getHistory(options?: { limit?: number; status?: 'sent' | 'pending' | 'failed' }): NotificationHistory[] {
    let history = [...this.history]

    if (options?.status) {
      history = history.filter(h => h.status === options.status)
    }

    if (options?.limit) {
      history = history.slice(-options.limit)
    }

    return history
  }

  /**
   * 获取统计信息
   */
  getStats(): NotificationStats {
    return { ...this.stats }
  }

  /**
   * 清除历史记录
   */
  clearHistory(): void {
    this.history = []
  }

  /**
   * 重置统计信息
   */
  resetStats(): void {
    this.stats = {
      totalSent: 0,
      totalFailed: 0,
      totalDismissed: 0,
      totalClicked: 0,
      channels: {},
      templates: {},
    }
  }

  /**
   * 获取待发送通知
   */
  async getPending(): Promise<any[]> {
    const result = await LocalNotifications.getPending() as any
    return result?.notifications || []
  }

  /**
   * 获取设置的通知
   */
  async getDelivered(): Promise<any[]> {
    try {
      const result = await (LocalNotifications as any).getDelivered?.() as any
      return result?.notifications || []
    } catch {
      // 某些平台不支持 getDelivered
      return []
    }
  }

  /**
   * ========== 私有方法 ==========
   */

  /**
   * 设置事件监听
   */
  private setupEventListeners(): void {
    LocalNotifications.addListener('localNotificationActionPerformed', event => {
      this.emitEvent('action', event)
    })

    LocalNotifications.addListener('localNotificationReceived', event => {
      this.emitEvent('click', event)
    })
  }

  /**
   * 触发事件
   */
  private emitEvent(type: 'click' | 'dismiss' | 'action' | 'error', data: any): void {
    const eventKey = `${type}:${JSON.stringify(data)}`
    
    // 防止事件重复触发
    if (this.eventQueue.has(eventKey)) {
      return
    }
    this.eventQueue.add(eventKey)

    const listeners = this.listeners.get(type) || []
    const toRemove: number[] = []

    listeners.forEach((listener, index) => {
      Promise.resolve(listener.callback(data)).catch(error => {
        console.error(`监听器执行失败 [${type}]:`, error)
      })

      if (listener.once) {
        toRemove.push(index)
      }
    })

    // 移除一次性监听器
    toRemove.reverse().forEach(index => {
      listeners.splice(index, 1)
    })

    // 清理事件队列（防止内存泄漏）
    setTimeout(() => {
      this.eventQueue.delete(eventKey)
    }, 5000)
  }

  /**
   * 执行拦截器链
   */
  private async executeInterceptors(
    hookName: 'beforeSend' | 'afterSend' | 'onError',
    ...args: any[]
  ): Promise<any> {
    for (const interceptor of this.interceptors) {
      const hook = interceptor[hookName]
      if (!hook) continue

      try {
        const result = await (hook as any)(...args)
        if (hookName === 'beforeSend' && result === null) {
          return null
        }
        if (result !== undefined) {
          return result
        }
      } catch (error) {
        console.error(`拦截器执行失败 [${interceptor.name}]:`, error)
      }
    }

    return args[0]
  }

  /**
   * 合并默认配置
   */
  private mergeDefaultOptions(
    options: NotificationOptions
  ): NotificationOptions {
    return {
      ...this.config.defaultOptions,
      ...options,
      priority: options.priority || this.config.defaultPriority,
    }
  }

  /**
   * 转换样式配置
   */
  private transformStyle(style?: any) {
    if (!style) return {}

    const result: any = {}

    if (style.ledARGB !== undefined) result.ledARGB = style.ledARGB
    if (style.ledOnMs !== undefined) result.ledOnMs = style.ledOnMs
    if (style.ledOffMs !== undefined) result.ledOffMs = style.ledOffMs
    if (style.vibrate !== undefined) result.vibrate = style.vibrate
    if (style.smallIcon !== undefined) result.smallIcon = style.smallIcon
    if (style.largeIcon !== undefined) result.largeIcon = style.largeIcon
    if (style.color !== undefined) result.color = style.color
    if (style.androidSoundUrl !== undefined) result.sound = { path: style.androidSoundUrl }
    if (style.iosSound !== undefined) result.sound = style.iosSound
    if (style.iosAlert !== undefined) result.alert = style.iosAlert
    if (style.badge !== undefined) result.badge = style.badge

    return result
  }

  /**
   * 转换定时配置
   */
  private transformSchedule(schedule?: any) {
    if (!schedule) return undefined

    if (schedule.at) {
      return { at: schedule.at }
    }

    if (schedule.every) {
      return { every: this.getFrequency(schedule.every), count: schedule.count }
    }

    if (schedule.interval) {
      return { every: schedule.interval, count: schedule.count }
    }

    return undefined
  }

  /**
   * 获取频率值
   */
  private getFrequency(freq: string): any {
    const frequencyMap: Record<string, any> = {
      year: 'year',
      month: 'month',
      week: 'week',
      day: 'day',
      hour: 'hour',
      minute: 'minute',
    }
    return frequencyMap[freq] || 'day'
  }

  /**
   * 转换优先级
   */
  private transformImportance(priority: string): number {
    const map: Record<string, number> = {
      min: 1,
      low: 2,
      default: 3,
      high: 4,
      max: 5,
    }
    return map[priority] || 3
  }

  /**
   * 生成通知 ID
   */
  private generateNotificationId(): number {
    return this.notificationCounter++
  }

  /**
   * 替换变量
   */
  private replaceVariables(
    options: NotificationOptions,
    variables?: Record<string, string>
  ): NotificationOptions {
    if (!variables) return options

    const result = { ...options }
    result.title = this.replaceStr(result.title, variables)
    result.body = this.replaceStr(result.body, variables)

    return result
  }

  /**
   * 字符串变量替换
   */
  private replaceStr(str: string, variables: Record<string, string>): string {
    return str.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  /**
   * 记录历史
   */
  private async recordHistory(
    options: NotificationOptions,
    status: 'sent' | 'pending' | 'failed',
    error?: string
  ): Promise<void> {
    if (!this.config.enableHistory) return

    const history: NotificationHistory = {
      id: this.generateNotificationId(),
      title: options.title,
      body: options.body,
      timestamp: new Date(),
      status,
      error,
    }

    this.history.push(history)

    // 限制历史记录大小
    if (this.history.length > this.config.maxHistorySize) {
      this.history = this.history.slice(-this.config.maxHistorySize)
    }
  }

  /**
   * 记录统计
   */
  private recordStats(success: boolean, options: NotificationOptions): void {
    if (!this.config.enableStats) return

    if (success) {
      this.stats.totalSent++
      const channelId = options.style?.channelId || 'default'
      this.stats.channels[channelId] = (this.stats.channels[channelId] || 0) + 1
    } else {
      this.stats.totalFailed++
    }
  }

  /**
   * 创建默认通道
   */
  private createDefaultChannel(): NotificationChannel {
    return {
      id: 'default',
      name: '默认通知',
      description: '默认通知通道',
      importance: 'default',
      enableVibration: true,
      lights: true,
    }
  }
}

/**
 * 创建全局通知管理实例
 */
export function createNotificationManager(
  config?: NotificationSystemConfig
): NotificationManager {
  return new NotificationManager(config)
}

/**
 * 单例模式
 */
let globalNotificationManager: NotificationManager | null = null

export function getNotificationManager(
  config?: NotificationSystemConfig
): NotificationManager {
  if (!globalNotificationManager) {
    globalNotificationManager = new NotificationManager(config)
  }
  return globalNotificationManager
}
