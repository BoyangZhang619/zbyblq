/**
 * 通知系统完整使用示例
 * 
 * 本文件展示了如何使用强大的通知管理系统
 */

import {
  getNotificationManager,
  InterceptorFactory,
  NotificationTemplates,
  QuickNotifications,
  NotificationBuilder,
  NotificationUtils,
  RateLimitInterceptor,
  DeduplicationInterceptor,
  EnhancementInterceptor,
} from '@/shared/utils/notifications'

/**
 * ========== 基础使用 ==========
 */

// 1. 初始化通知管理器
const notificationManager = getNotificationManager({
  enableHistory: true,
  enableStats: true,
  defaultPriority: 'default',
  defaultChannel: {
    id: 'default',
    name: '默认通知',
    importance: 'default',
  },
  // 应用预定义的生产环境拦截器
  interceptors: InterceptorFactory.createProductionInterceptors(),
})

// 2. 注册全局事件监听
notificationManager.on('click', (data) => {
  console.log('用户点击了通知:', data)
})

notificationManager.on('dismiss', (id) => {
  console.log('用户关闭了通知:', id)
})

notificationManager.on('error', (error) => {
  console.error('通知发送出错:', error)
})

/**
 * ========== 简单通知 ==========
 */

// 3. 直接发送简单通知
async function sendSimpleNotification() {
  try {
    const notificationId = await notificationManager.send({
      title: '简单通知',
      body: '这是一条简单的通知',
      priority: 'default',
      autoCancel: true,
    })
    console.log('通知已发送，ID:', notificationId)
  } catch (error) {
    console.error('发送通知失败:', error)
  }
}

/**
 * ========== 使用模板 ==========
 */

// 4. 注册并使用模板
async function useTemplates() {
  // 注册预定义的模板
  Object.values(NotificationTemplates).forEach(template => {
    notificationManager.createTemplate(template)
  })

  // 使用模板快速发送通知
  await notificationManager.sendWithTemplate('template-success', {
    message: '操作已成功完成！',
  })

  // 或使用快捷函数
  await QuickNotifications.success(notificationManager, '注册成功')
  await QuickNotifications.error(notificationManager, '网络连接失败')
  await QuickNotifications.info(notificationManager, '有新的消息')
}

/**
 * ========== 使用构建器 ==========
 */

// 5. 使用流式构建器创建复杂通知
async function useBuilder() {
  // 创建基础通知
  const notification = new NotificationBuilder()
    .setTitle('欢迎')
    .setBody('这是一条使用构建器构建的通知')
    .setPriority('high')
    .setSmallText('重要消息')
    .addData('userId', '123')
    .addData('action', 'navigate')
    .setColor('#3b82f6')
    .addAction('accept', '接受', true)
    .addAction('reject', '拒绝', false)
    .build()

  const id = await notificationManager.send(notification)
  console.log('使用构建器发送的通知ID:', id)

  // 或直接发送和队列
  await new NotificationBuilder()
    .setTitle('队列通知')
    .setBody('这条通知会被加入队列')
    .send(notificationManager)

  // 队列发送（支持批处理）
  await new NotificationBuilder()
    .setTitle('批处理')
    .setBody('多条通知会被批处理发送')
    .queue(notificationManager, 500)
}

/**
 * ========== 定时通知 ==========
 */

// 6. 定时发送通知
async function scheduleNotifications() {
  // 在特定时间发送
  const tomorrowAt9AM = new Date()
  tomorrowAt9AM.setDate(tomorrowAt9AM.getDate() + 1)
  tomorrowAt9AM.setHours(9, 0, 0, 0)

  await notificationManager.schedule({
    title: '每日提醒',
    body: '这是一条定时通知',
    schedule: { at: tomorrowAt9AM },
  })

  // 每天重复发送
  await notificationManager.schedule({
    title: '每日任务',
    body: '记得完成今天的任务',
    schedule: { every: 'day', count: 30 }, // 重复30天
  })

  // 每周一次
  await notificationManager.schedule({
    title: '周报',
    body: '周报已准备好，请查看',
    schedule: { every: 'week' },
  })
}

/**
 * ========== 批量发送 ==========
 */

// 7. 批量发送通知
async function batchSend() {
  const notifications = [
    { title: '通知1', body: '第一条通知' },
    { title: '通知2', body: '第二条通知' },
    { title: '通知3', body: '第三条通知' },
  ]

  // 并发发送
  const ids = await notificationManager.sendBatch(notifications)
  console.log('批量发送的通知ID:', ids)

  // 使用辅助函数：带延迟的批量发送
  await NotificationUtils.sendBatchWithDelay(
    notificationManager,
    notifications,
    1000
  )
}

/**
 * ========== 队列管理 ==========
 */

// 8. 使用队列系统（自动批处理）
async function useQueueing() {
  // 添加到队列（会自动批处理）
  await notificationManager.queueSend(
    { title: '队列1', body: '内容1' },
    100
  )
  await notificationManager.queueSend(
    { title: '队列2', body: '内容2' },
    100
  )

  // 手动刷新队列
  const ids = await notificationManager.flushQueue()
  console.log('队列中发送的通知:', ids)
}

/**
 * ========== 自定义拦截器 ==========
 */

// 9. 添加自定义拦截器
async function customInterceptors() {
  // 添加频率限制器
  notificationManager.addInterceptor(
    new RateLimitInterceptor(10) // 每分钟最多10条
  )

  // 添加去重拦截器
  notificationManager.addInterceptor(
    new DeduplicationInterceptor(3000) // 3秒内去重
  )

  // 添加内容增强拦截器
  notificationManager.addInterceptor(
    new EnhancementInterceptor(true, 'APP')
  )

  // 创建自定义拦截器
  class CustomInterceptor {
    name = 'customInterceptor'
    order = 10

    async beforeSend(options: any) {
      // 业务逻辑：不在工作时间外发送低优先级通知
      const hour = new Date().getHours()
      const isWorkingHours = hour >= 9 && hour < 18
      
      if (!isWorkingHours && options.priority === 'low') {
        console.log('低优先级通知在非工作时间被延迟')
        return null
      }
      return options
    }

    async afterSend(options: any, id: number) {
      console.log(`通知 ${id} 已发送:`, options.title)
    }
  }

  notificationManager.addInterceptor(new CustomInterceptor())
}

/**
 * ========== 通知群组 ==========
 */

// 10. 使用通知群组
async function notificationGroups() {
  // 创建一个群组
  notificationManager.createGroup({
    id: 'order-group',
    title: '订单通知',
    options: {
      priority: 'high',
      style: {
        color: '#f59e0b',
      },
    },
    interceptors: [
      new RateLimitInterceptor(5), // 群组内频率限制
    ],
  })

  // 在群组内发送通知
  await notificationManager.sendGroupNotification('order-group', {
    title: '订单已确认',
    body: '订单号：#12345',
  })

  await notificationManager.sendGroupNotification('order-group', {
    title: '订单已发货',
    body: '快递单号：SF123456789',
  })
}

/**
 * ========== 历史和统计 ==========
 */

// 11. 查看历史记录和统计信息
function viewHistoryAndStats() {
  // 获取历史记录
  const history = notificationManager.getHistory({
    limit: 10,
    status: 'sent',
  })
  console.log('最近10条已发送的通知:', history)

  // 获取统计信息
  const stats = notificationManager.getStats()
  console.log('通知统计:', {
    总发送数: stats.totalSent,
    失败数: stats.totalFailed,
    已关闭: stats.totalDismissed,
    已点击: stats.totalClicked,
    按通道统计: stats.channels,
    按模板统计: stats.templates,
  })

  // 清除历史
  notificationManager.clearHistory()

  // 重置统计
  notificationManager.resetStats()
}

/**
 * ========== 加载中状态 ==========
 */

// 12. 显示加载中通知
async function showLoadingFlow() {
  // 显示加载中
  const loadingId = await NotificationUtils.showLoading(
    notificationManager,
    '正在处理',
    '请稍候...'
  )

  // 模拟异步操作
  await new Promise(resolve => setTimeout(resolve, 2000))

  // 更新为完成状态
  await NotificationUtils.completeLoading(
    notificationManager,
    loadingId,
    '处理完成',
    '操作已成功完成'
  )
}

/**
 * ========== 高级：通知流程 ==========
 */

// 13. 构建完整的通知流程
async function advancedFlow() {
  try {
    // 1. 显示加载
    const loadingId = await NotificationUtils.showLoading(
      notificationManager,
      '同步数据中',
      '正在从服务器获取数据...'
    )

    // 2. 模拟数据获取
    const data = await fetchDataFromServer()

    // 3. 处理数据
    const result = processData(data)

    // 4. 取消加载通知
    await notificationManager.cancel(loadingId)

    // 5. 发送成功通知
    if (result.success) {
      await QuickNotifications.success(
        notificationManager,
        `成功处理 ${result.count} 条数据`
      )
    } else {
      await QuickNotifications.error(
        notificationManager,
        '处理失败，请稍后重试'
      )
    }

    // 6. 记录统计
    const stats = notificationManager.getStats()
    console.log('本次操作统计:', stats)
  } catch (error) {
    console.error('流程出错:', error)
    await QuickNotifications.error(
      notificationManager,
      '操作出错，请稍后重试'
    )
  }
}

/**
 * 辅助函数（模拟）
 */
function fetchDataFromServer() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve({ items: [1, 2, 3, 4, 5] })
    }, 1500)
  })
}

function processData(data: any) {
  return {
    success: true,
    count: (data as any)?.items?.length || 0,
  }
}

/**
 * ========== 调用示例 ==========
 */

// 取消注释以运行示例
// sendSimpleNotification()
// useTemplates()
// useBuilder()
// scheduleNotifications()
// batchSend()
// useQueueing()
// customInterceptors()
// notificationGroups()
// viewHistoryAndStats()
// showLoadingFlow()
// advancedFlow()

export {
  notificationManager,
  sendSimpleNotification,
  useTemplates,
  useBuilder,
  scheduleNotifications,
  batchSend,
  useQueueing,
  customInterceptors,
  notificationGroups,
  viewHistoryAndStats,
  showLoadingFlow,
  advancedFlow,
}
