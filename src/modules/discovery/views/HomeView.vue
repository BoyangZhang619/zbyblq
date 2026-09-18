<template>
  <div class="home-view">
    <div class="container">
      <h1 class="title">通知系统演示</h1>
      <p class="subtitle">点击下面的按钮测试各种通知功能</p>

      <!-- 基础通知 -->
      <section class="section">
        <h2 class="section-title">基础功能</h2>
        <div class="button-grid">
          <button class="btn btn-primary" @click="sendSimpleNotification">
            简单通知
          </button>
          <button class="btn btn-success" @click="showSuccess">
            成功提示
          </button>
          <button class="btn btn-error" @click="showError">
            错误提示
          </button>
          <button class="btn btn-warning" @click="showWarning">
            警告提示
          </button>
        </div>
      </section>

      <!-- 模板相关 -->
      <section class="section">
        <h2 class="section-title">模板功能</h2>
        <div class="button-grid">
          <button class="btn btn-info" @click="useTemplates">
            注册所有模板
          </button>
          <button class="btn btn-info" @click="sendTaskComplete">
            任务完成通知
          </button>
          <button class="btn btn-info" @click="sendMessage">
            消息提醒
          </button>
          <button class="btn btn-info" @click="sendReminder">
            定时提醒
          </button>
        </div>
      </section>

      <!-- 高级功能 -->
      <section class="section">
        <h2 class="section-title">高级功能</h2>
        <div class="button-grid">
          <button class="btn btn-accent" @click="useBuilder">
            构建器 (Flow API)
          </button>
          <button class="btn btn-accent" @click="scheduleNotifications">
            定时通知
          </button>
          <button class="btn btn-accent" @click="batchSend">
            批量发送
          </button>
          <button class="btn btn-accent" @click="useQueueing">
            队列系统
          </button>
        </div>
      </section>

      <!-- 拦截器和群组 -->
      <section class="section">
        <h2 class="section-title">拦截器 & 群组</h2>
        <div class="button-grid">
          <button class="btn btn-secondary" @click="customInterceptors">
            自定义拦截器
          </button>
          <button class="btn btn-secondary" @click="notificationGroups">
            通知群组
          </button>
          <button class="btn btn-secondary" @click="testRateLimit">
            测试频率限制
          </button>
          <button class="btn btn-secondary" @click="testDeduplication">
            测试去重
          </button>
        </div>
      </section>

      <!-- 加载和统计 -->
      <section class="section">
        <h2 class="section-title">加载状态 & 统计</h2>
        <div class="button-grid">
          <button class="btn btn-secondary" @click="showLoadingFlow">
            加载流程演示
          </button>
          <button class="btn btn-secondary" @click="viewHistoryAndStats">
            查看统计信息
          </button>
          <button class="btn btn-secondary" @click="clearHistory">
            清除历史记录
          </button>
          <button class="btn btn-secondary" @click="advancedFlow">
            完整流程演示
          </button>
        </div>
      </section>

      <!-- 统计面板 -->
      <section class="section">
        <h2 class="section-title">实时统计</h2>
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalSent }}</div>
            <div class="stat-label">已发送</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalFailed }}</div>
            <div class="stat-label">失败</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalClicked }}</div>
            <div class="stat-label">已点击</div>
          </div>
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalDismissed }}</div>
            <div class="stat-label">已关闭</div>
          </div>
        </div>
      </section>

      <!-- 历史记录 -->
      <section class="section" v-if="history.length > 0">
        <h2 class="section-title">最近通知历史</h2>
        <div class="history-list">
          <div class="history-item" v-for="item in history.slice(-5)" :key="item.id">
            <div class="history-header">
              <span class="history-title">{{ item.title }}</span>
              <span class="history-status" :class="`status-${item.status}`">
                {{ item.status }}
              </span>
            </div>
            <div class="history-body">{{ item.body }}</div>
            <div class="history-time">{{ formatTime(item.timestamp) }}</div>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, reactive } from 'vue'
import {
  getNotificationManager,
  QuickNotifications,
  NotificationBuilder,
  NotificationUtils,
  NotificationTemplates,
  InterceptorFactory,
  type NotificationStats,
  type NotificationHistory,
} from '@/shared/utils/notifications'

// 初始化通知管理器
const notificationManager = getNotificationManager({
  enableHistory: true,
  enableStats: true,
  defaultPriority: 'default',
  interceptors: InterceptorFactory.createProductionInterceptors(),
})

// 状态
const stats = reactive<NotificationStats>({
  totalSent: 0,
  totalFailed: 0,
  totalDismissed: 0,
  totalClicked: 0,
  channels: {},
  templates: {},
})

const history = ref<NotificationHistory[]>([])

// 生命周期
onMounted(() => {
  // 注册所有模板
  Object.values(NotificationTemplates).forEach(template => {
    notificationManager.createTemplate(template)
  })

  // 注册事件监听
  notificationManager.on('click', () => {
    stats.totalClicked++
    updateStats()
  })

  notificationManager.on('dismiss', () => {
    stats.totalDismissed++
    updateStats()
  })

  notificationManager.on('error', (error) => {
    console.error('通知错误:', error)
  })

  // 定时更新统计
  setInterval(updateStats, 1000)
})

// 工具方法
function updateStats() {
  const currentStats = notificationManager.getStats()
  stats.totalSent = currentStats.totalSent
  stats.totalFailed = currentStats.totalFailed
  stats.totalDismissed = currentStats.totalDismissed
  stats.totalClicked = currentStats.totalClicked
  stats.channels = currentStats.channels
  stats.templates = currentStats.templates

  history.value = notificationManager.getHistory({ limit: 20 })
}

function formatTime(date: Date): string {
  return new Date(date).toLocaleTimeString('zh-CN')
}

// ========== 基础功能 ==========

async function sendSimpleNotification() {
  try {
    await notificationManager.send({
      title: '简单通知',
      body: '这是一条简单的通知测试',
      priority: 'default',
      autoCancel: true,
    })
    updateStats()
  } catch (error) {
    console.error('发送失败:', error)
  }
}

async function showSuccess() {
  await QuickNotifications.success(notificationManager, '操作成功完成！')
  updateStats()
}

async function showError() {
  await QuickNotifications.error(notificationManager, '操作失败，请重试')
  updateStats()
}

async function showWarning() {
  await QuickNotifications.warning(notificationManager, '这是一条警告信息')
  updateStats()
}

// ========== 模板功能 ==========

async function useTemplates() {
  await notificationManager.sendWithTemplate('template-info', {
    message: '所有模板已注册，现在可以使用了！',
  })
  updateStats()
}

async function sendTaskComplete() {
  await notificationManager.sendWithTemplate('template-task-complete', {
    taskName: '数据同步',
    description: '已完成3000条数据的处理',
  })
  updateStats()
}

async function sendMessage() {
  await notificationManager.sendWithTemplate('template-message', {
    senderName: '系统管理员',
    content: '你有一条新的系统通知',
  })
  updateStats()
}

async function sendReminder() {
  await notificationManager.sendWithTemplate('template-reminder', {
    reminderText: '别忘了完成今天的任务清单',
  })
  updateStats()
}

// ========== 高级功能 ==========

async function useBuilder() {
  const notification = new NotificationBuilder()
    .setTitle('构建器演示')
    .setBody('这是使用 Flow API 构建的通知')
    .setPriority('high')
    .setSmallText('高优先级')
    .addData('demo', 'true')
    .setColor('#3b82f6')
    .addAction('action1', '确认', true)
    .build()

  await notificationManager.send(notification)
  updateStats()
}

async function scheduleNotifications() {
  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(9, 0, 0, 0)

  await notificationManager.schedule({
    title: '明天的提醒',
    body: '这是明天上午9点的定时通知',
    schedule: { at: tomorrow },
  })
  
  await QuickNotifications.success(notificationManager, '定时通知已设置')
  updateStats()
}

async function batchSend() {
  const notifications = [
    { title: '批量1', body: '第一条批处理通知' },
    { title: '批量2', body: '第二条批处理通知' },
    { title: '批量3', body: '第三条批处理通知' },
  ]

  await notificationManager.sendBatch(notifications)
  updateStats()
}

async function useQueueing() {
  await notificationManager.queueSend(
    { title: '队列1', body: '加入队列的第一条通知' },
    100
  )
  await notificationManager.queueSend(
    { title: '队列2', body: '加入队列的第二条通知' },
    100
  )
  await notificationManager.flushQueue()
  updateStats()
}

// ========== 拦截器和群组 ==========

async function customInterceptors() {
  await QuickNotifications.info(
    notificationManager,
    '已添加频率限制、去重和内容增强拦截器'
  )
  updateStats()
}

async function notificationGroups() {
  notificationManager.createGroup({
    id: 'test-group',
    title: '演示群组',
    options: {
      priority: 'high',
      style: { color: '#f59e0b' },
    },
  })

  await notificationManager.sendGroupNotification('test-group', {
    title: '群组通知 #1',
    body: '这是来自演示群组的第一条通知',
  })

  updateStats()
}

async function testRateLimit() {
  // 快速发送多条通知测试频率限制
  for (let i = 0; i < 5; i++) {
    await notificationManager.send({
      title: `速率限制测试 ${i + 1}`,
      body: `这是第 ${i + 1} 条通知`,
    })
  }
  updateStats()
}

async function testDeduplication() {
  // 发送相同内容的通知测试去重
  for (let i = 0; i < 3; i++) {
    await notificationManager.send({
      title: '去重测试',
      body: '这条消息会被去重',
    })
  }
  updateStats()
}

// ========== 加载和统计 ==========

async function showLoadingFlow() {
  const loadingId = await NotificationUtils.showLoading(
    notificationManager,
    '演示加载中',
    '正在处理数据...'
  )

  await new Promise(resolve => setTimeout(resolve, 2000))

  await NotificationUtils.completeLoading(
    notificationManager,
    loadingId,
    '处理完成',
    '演示流程已完成'
  )

  updateStats()
}

function viewHistoryAndStats() {
  updateStats()
  const currentStats = notificationManager.getStats()
  console.log('=== 统计信息 ===')
  console.log('总发送数:', currentStats.totalSent)
  console.log('失败数:', currentStats.totalFailed)
  console.log('已点击:', currentStats.totalClicked)
  console.log('已关闭:', currentStats.totalDismissed)
  console.log('=== 历史记录 ===')
  console.log(notificationManager.getHistory({ limit: 10 }))
}

function clearHistory() {
  notificationManager.clearHistory()
  notificationManager.resetStats()
  updateStats()
  history.value = []
  QuickNotifications.success(notificationManager, '历史记录和统计已清除')
}

async function advancedFlow() {
  try {
    const loadingId = await NotificationUtils.showLoading(
      notificationManager,
      '完整流程演示',
      '正在获取数据...'
    )

    // 模拟异步操作
    await new Promise(resolve => setTimeout(resolve, 2000))
    await notificationManager.cancel(loadingId)

    await QuickNotifications.success(
      notificationManager,
      '完整流程演示已完成！'
    )
    updateStats()
  } catch (error) {
    await QuickNotifications.error(notificationManager, '流程出错')
  }
}
</script>

<style scoped>
.home-view {
  min-height: 100vh;
  background: var(--color-background);
  padding: 20px;
  padding-bottom: 100px;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
}

.title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-primary);
  margin: 0 0 8px 0;
  text-align: center;
}

.subtitle {
  font-size: 16px;
  color: var(--color-secondary);
  text-align: center;
  margin: 0 0 30px 0;
}

.section {
  margin-bottom: 30px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0 0 15px 0;
  padding-bottom: 10px;
  border-bottom: 2px solid var(--color-border);
}

.button-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 10px;
}

.btn {
  padding: 12px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.btn:active {
  transform: translateY(0);
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover {
  background: #1a1a1a;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover {
  background: #059669;
}

.btn-error {
  background: #ef4444;
  color: white;
}

.btn-error:hover {
  background: #dc2626;
}

.btn-warning {
  background: #f59e0b;
  color: white;
}

.btn-warning:hover {
  background: #d97706;
}

.btn-info {
  background: #3b82f6;
  color: white;
}

.btn-info:hover {
  background: #2563eb;
}

.btn-accent {
  background: var(--color-primary);
  color: white;
  border: 2px solid var(--color-secondary);
}

.btn-accent:hover {
  background: var(--color-secondary);
  color: var(--color-primary);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-secondary:hover {
  background: #666;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 15px;
}

.stat-card {
  background: var(--color-secondary);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  color: white;
}

.stat-value {
  font-size: 28px;
  font-weight: 700;
  margin-bottom: 8px;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.history-item {
  background: var(--color-secondary);
  border-radius: 6px;
  padding: 12px;
  color: white;
}

.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.history-title {
  font-weight: 600;
}

.history-status {
  font-size: 12px;
  padding: 2px 8px;
  border-radius: 3px;
  background: rgba(255, 255, 255, 0.2);
}

.status-sent {
  background: #10b981 !important;
}

.status-failed {
  background: #ef4444 !important;
}

.status-pending {
  background: #f59e0b !important;
}

.history-body {
  font-size: 14px;
  margin-bottom: 6px;
  opacity: 0.9;
}

.history-time {
  font-size: 12px;
  opacity: 0.7;
}

@media (prefers-color-scheme: dark) {
  .home-view {
    background: #0a0a0a;
  }

  .section-title {
    border-bottom-color: rgba(255, 255, 255, 0.1);
  }
}
</style>
