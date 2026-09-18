import type { NotificationOptions, NotificationTemplate } from './types'

/**
 * 通知模板工厂
 * 预定义常用的通知模板
 */
export const NotificationTemplates = {
  /**
   * 成功提示模板
   */
  success: {
    id: 'template-success',
    name: '成功提示',
    description: '用于成功操作的通知',
    options: {
      title: '操作成功',
      body: '{message}',
      priority: 'default',
      style: {
        color: '#10b981',
      },
    },
    variables: ['message'],
  } as NotificationTemplate,

  /**
   * 错误提示模板
   */
  error: {
    id: 'template-error',
    name: '错误提示',
    description: '用于错误操作的通知',
    options: {
      title: '操作失败',
      body: '{message}',
      priority: 'high',
      style: {
        color: '#ef4444',
      },
    },
    variables: ['message'],
  } as NotificationTemplate,

  /**
   * 警告提示模板
   */
  warning: {
    id: 'template-warning',
    name: '警告提示',
    description: '用于警告信息的通知',
    options: {
      title: '警告',
      body: '{message}',
      priority: 'high',
      style: {
        color: '#f59e0b',
      },
    },
    variables: ['message'],
  } as NotificationTemplate,

  /**
   * 信息提示模板
   */
  info: {
    id: 'template-info',
    name: '信息提示',
    description: '用于一般信息的通知',
    options: {
      title: '提示',
      body: '{message}',
      priority: 'low',
      style: {
        color: '#3b82f6',
      },
    },
    variables: ['message'],
  } as NotificationTemplate,

  /**
   * 任务完成模板
   */
  taskComplete: {
    id: 'template-task-complete',
    name: '任务完成',
    description: '用于通知任务完成',
    options: {
      title: '任务已完成',
      body: '{taskName} - {description}',
      priority: 'default',
      smallText: '点击查看详情',
      autoCancel: true,
    },
    variables: ['taskName', 'description'],
  } as NotificationTemplate,

  /**
   * 数据同步模板
   */
  dataSync: {
    id: 'template-data-sync',
    name: '数据同步',
    description: '用于通知数据同步状态',
    options: {
      title: '数据同步中',
      body: '正在同步 {itemCount} 条数据...',
      priority: 'default',
      ongoing: true,
    },
    variables: ['itemCount'],
  } as NotificationTemplate,

  /**
   * 消息提醒模板
   */
  message: {
    id: 'template-message',
    name: '消息提醒',
    description: '用于新消息提醒',
    options: {
      title: '{senderName} 发来了一条消息',
      body: '{content}',
      priority: 'high',
      smallText: '新消息',
      autoCancel: true,
    },
    variables: ['senderName', 'content'],
  } as NotificationTemplate,

  /**
   * 定时提醒模板
   */
  reminder: {
    id: 'template-reminder',
    name: '定时提醒',
    description: '用于定时提醒',
    options: {
      title: '提醒',
      body: '{reminderText}',
      priority: 'default',
      smallText: '不要忘记了',
      autoCancel: true,
    },
    variables: ['reminderText'],
  } as NotificationTemplate,

  /**
   * 更新提示模板
   */
  update: {
    id: 'template-update',
    name: '更新提示',
    description: '用于系统/应用更新提示',
    options: {
      title: '发现新版本',
      body: '新版本 {version} 现已推出：{description}',
      priority: 'high',
      smallText: '立即更新',
      autoCancel: false,
      ongoing: true,
    },
    variables: ['version', 'description'],
  } as NotificationTemplate,
}

/**
 * 便捷通知函数集合
 */
export const QuickNotifications = {
  /**
   * 发送成功通知
   */
  success(manager: any, message: string): Promise<number> {
    return manager.sendWithTemplate('template-success', { message })
  },

  /**
   * 发送错误通知
   */
  error(manager: any, message: string): Promise<number> {
    return manager.sendWithTemplate('template-error', { message })
  },

  /**
   * 发送警告通知
   */
  warning(manager: any, message: string): Promise<number> {
    return manager.sendWithTemplate('template-warning', { message })
  },

  /**
   * 发送信息通知
   */
  info(manager: any, message: string): Promise<number> {
    return manager.sendWithTemplate('template-info', { message })
  },

  /**
   * 发送任务完成通知
   */
  taskComplete(
    manager: any,
    taskName: string,
    description: string = '任务已完成'
  ): Promise<number> {
    return manager.sendWithTemplate('template-task-complete', {
      taskName,
      description,
    })
  },

  /**
   * 发送数据同步通知
   */
  dataSync(manager: any, itemCount: number): Promise<number> {
    return manager.sendWithTemplate('template-data-sync', { itemCount })
  },

  /**
   * 发送消息提醒
   */
  message(manager: any, senderName: string, content: string): Promise<number> {
    return manager.sendWithTemplate('template-message', {
      senderName,
      content,
    })
  },

  /**
   * 发送定时提醒
   */
  reminder(manager: any, reminderText: string): Promise<number> {
    return manager.sendWithTemplate('template-reminder', { reminderText })
  },

  /**
   * 发送更新提示
   */
  update(
    manager: any,
    version: string,
    description: string = '有重要更新'
  ): Promise<number> {
    return manager.sendWithTemplate('template-update', {
      version,
      description,
    })
  },
}

/**
 * 通知构建器 - 流式 API 用于构建复杂通知
 */
export class NotificationBuilder {
  private options: NotificationOptions = {
    title: '',
    body: '',
  }

  setTitle(title: string): this {
    this.options.title = title
    return this
  }

  setBody(body: string): this {
    this.options.body = body
    return this
  }

  setSmallText(text: string): this {
    this.options.smallText = text
    return this
  }

  setPriority(priority: 'min' | 'low' | 'default' | 'high' | 'max'): this {
    this.options.priority = priority
    return this
  }

  setAutoCancel(autoCancel: boolean): this {
    this.options.autoCancel = autoCancel
    return this
  }

  setOngoing(ongoing: boolean): this {
    this.options.ongoing = ongoing
    return this
  }

  setData(data: Record<string, any>): this {
    this.options.data = data
    return this
  }

  addData(key: string, value: any): this {
    if (!this.options.data) {
      this.options.data = {}
    }
    this.options.data[key] = value
    return this
  }

  setColor(color: string): this {
    if (!this.options.style) {
      this.options.style = {}
    }
    this.options.style.color = color
    return this
  }

  setChannelId(channelId: string): this {
    if (!this.options.style) {
      this.options.style = {}
    }
    this.options.style.channelId = channelId
    return this
  }

  setVibrate(vibrate: number[]): this {
    if (!this.options.style) {
      this.options.style = {}
    }
    this.options.style.vibrate = vibrate
    return this
  }

  addAction(id: string, title: string, foreground: boolean = true): this {
    if (!this.options.actions) {
      this.options.actions = []
    }
    this.options.actions.push({
      id,
      title,
      foreground,
    })
    return this
  }

  scheduleAt(date: Date): this {
    this.options.schedule = { at: date }
    return this
  }

  scheduleEvery(
    every: 'year' | 'month' | 'week' | 'day' | 'hour' | 'minute',
    count?: number
  ): this {
    this.options.schedule = { every, count }
    return this
  }

  build(): NotificationOptions {
    if (!this.options.title || !this.options.body) {
      throw new Error('标题和正文不能为空')
    }
    return { ...this.options }
  }

  /**
   * 构建并发送通知
   */
  async send(manager: any): Promise<number> {
    return manager.send(this.build())
  }

  /**
   * 构建并推送到队列
   */
  async queue(manager: any, delayMs?: number): Promise<number> {
    return manager.queueSend(this.build(), delayMs)
  }

  /**
   * 清空构建器状态
   */
  reset(): this {
    this.options = {
      title: '',
      body: '',
    }
    return this
  }
}

/**
 * 通知助手函数
 */
export const NotificationUtils = {
  /**
   * 创建新的构建器
   */
  builder(): NotificationBuilder {
    return new NotificationBuilder()
  },

  /**
   * 显示加载中通知
   */
  showLoading(
    manager: any,
    title: string = '加载中',
    body: string = '请稍候...'
  ): Promise<number> {
    return manager.send({
      title,
      body,
      ongoing: true,
      priority: 'default',
    })
  },

  /**
   * 更新现有通知为加载完成状态
   */
  async completeLoading(
    manager: any,
    notificationId: number,
    title: string = '完成',
    body: string = '操作已完成'
  ): Promise<number> {
    await manager.cancel(notificationId)
    return manager.send({
      title,
      body,
      autoCancel: true,
      priority: 'default',
    })
  },

  /**
   * 延迟发送通知
   */
  async sendDelayed(
    manager: any,
    options: NotificationOptions,
    delayMs: number
  ): Promise<number> {
    return new Promise(resolve => {
      setTimeout(() => {
        manager.send(options).then(resolve)
      }, delayMs)
    })
  },

  /**
   * 批量发送通知（带延迟）
   */
  async sendBatchWithDelay(
    manager: any,
    optionsArray: NotificationOptions[],
    delayBetweenMs: number = 500
  ): Promise<number[]> {
    const results: number[] = []
    for (const options of optionsArray) {
      const id = await manager.send(options)
      results.push(id)
      await new Promise(resolve => setTimeout(resolve, delayBetweenMs))
    }
    return results
  },

  /**
   * 获取所有监听类型
   */
  getListenerTypes(): Array<'click' | 'dismiss' | 'action' | 'error'> {
    return ['click', 'dismiss', 'action', 'error']
  },
}
