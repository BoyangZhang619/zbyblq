# 通知系统使用指南

## 📋 概述

这是一个功能强大、高度可扩展的 Capacitor 本地通知系统，支持：

- ✅ 简单通知和复杂通知
- ✅ 模板系统（预定义和自定义）
- ✅ 流式构建器 API
- ✅ 定时和重复通知
- ✅ 通知队列和批处理
- ✅ 拦截器中间件系统
- ✅ 通知群组管理
- ✅ 历史记录和统计
- ✅ 事件监听系统
- ✅ 频率限制、去重、内容增强等

## 🚀 快速开始

### 1. 基础使用

```typescript
import { getNotificationManager } from '@/utils/notifications'

const manager = getNotificationManager()

// 发送简单通知
await manager.send({
  title: '标题',
  body: '内容',
})
```

### 2. 使用模板

```typescript
import { getNotificationManager, QuickNotifications } from '@/utils/notifications'

const manager = getNotificationManager()

// 快速发送
await QuickNotifications.success(manager, '操作成功')
await QuickNotifications.error(manager, '操作失败')
await QuickNotifications.info(manager, '信息提示')
await QuickNotifications.warning(manager, '警告信息')
```

### 3. 使用构建器（Flow API）

```typescript
import { NotificationBuilder } from '@/utils/notifications'

const notification = new NotificationBuilder()
  .setTitle('标题')
  .setBody('内容')
  .setPriority('high')
  .addData('key', 'value')
  .addAction('accept', '接受', true)
  .build()

await manager.send(notification)
```

### 4. 定时通知

```typescript
// 在特定时间发送
const tomorrow = new Date()
tomorrow.setDate(tomorrow.getDate() + 1)

await manager.schedule({
  title: '明天提醒',
  body: '这是明天的提醒',
  schedule: { at: tomorrow },
})

// 每天重复
await manager.schedule({
  title: '每日提醒',
  body: '每天都会发送',
  schedule: { every: 'day' },
})
```

## 🔧 核心功能

### NotificationManager 类

#### 发送通知

```typescript
// 单条发送
const id = await manager.send(options)

// 批量发送
const ids = await manager.sendBatch([...options])

// 队列发送（自动批处理）
await manager.queueSend(options, delayMs)
await manager.flushQueue()

// 定时发送
await manager.schedule(options)
```

#### 取消通知

```typescript
// 取消单条
await manager.cancel(notificationId)

// 取消全部
await manager.cancelAll()
```

#### 事件监听

```typescript
// 点击事件
manager.on('click', (data) => {
  console.log('用户点击了通知', data)
})

// 关闭事件
manager.on('dismiss', (id) => {
  console.log('用户关闭了通知', id)
})

// 错误事件
manager.on('error', (error) => {
  console.error('通知出错', error)
})

// 一次性监听
manager.once('click', (data) => {
  console.log('只监听一次')
})

// 取消监听
manager.off('click', callback)
```

## 📦 拦截器系统

### 内置拦截器

```typescript
import {
  RateLimitInterceptor,          // 频率限制
  DeduplicationInterceptor,      // 去重
  EnhancementInterceptor,        // 内容增强
  TimeWindowInterceptor,         // 时间窗口
  KeywordFilterInterceptor,      // 关键字过滤
  PriorityElevationInterceptor,  // 优先级升级
  BatchMergeInterceptor,         // 批量合并
  LoggingInterceptor,            // 日志记录
} from '@/utils/notifications'

const manager = getNotificationManager()

// 添加拦截器
manager.addInterceptor(new RateLimitInterceptor(10)) // 每分钟最多10条
manager.addInterceptor(new DeduplicationInterceptor(3000)) // 3秒内去重
manager.addInterceptor(new TimeWindowInterceptor(9, 22)) // 仅在9-22点发送
```

### 自定义拦截器

```typescript
class CustomInterceptor {
  name = 'customInterceptor'
  order = 10 // 执行顺序

  async beforeSend(options) {
    // 发送前处理
    return options // 返回null可阻止发送
  }

  async afterSend(options, id) {
    // 发送后处理
  }

  async onClick(options) {
    // 点击事件处理
    return true
  }

  async onDismiss(id) {
    // 关闭事件处理
  }

  async onError(error, options) {
    // 错误处理
  }
}

manager.addInterceptor(new CustomInterceptor())
manager.removeInterceptor('customInterceptor')
```

### 预设拦截器组合

```typescript
import { InterceptorFactory } from '@/utils/notifications'

// 生产环境配置
const manager = getNotificationManager({
  interceptors: InterceptorFactory.createProductionInterceptors()
})

// 开发环境配置
InterceptorFactory.createDevelopmentInterceptors()

// 安全配置
InterceptorFactory.createSafeInterceptors()

// 最小化配置
InterceptorFactory.createMinimalInterceptors()
```

## 📝 模板系统

### 内置模板

```typescript
import { NotificationTemplates } from '@/utils/notifications'

// 可用模板：
// - template-success      成功提示
// - template-error        错误提示
// - template-warning      警告提示
// - template-info         信息提示
// - template-task-complete 任务完成
// - template-data-sync    数据同步
// - template-message      消息提醒
// - template-reminder     定时提醒
// - template-update       更新提示

await manager.sendWithTemplate('template-success', {
  message: '操作成功'
})
```

### 创建自定义模板

```typescript
manager.createTemplate({
  id: 'my-template',
  name: '我的模板',
  description: '自定义模板描述',
  options: {
    title: '标题 - {title}',
    body: '内容 - {content}',
    priority: 'high',
  },
  variables: ['title', 'content'],
})

await manager.sendWithTemplate('my-template', {
  title: '示例',
  content: '这是一条自定义通知',
})
```

## 👥 通知群组

```typescript
// 创建群组
manager.createGroup({
  id: 'order-group',
  title: '订单通知',
  options: {
    priority: 'high',
    style: { color: '#f59e0b' },
  },
  interceptors: [
    new RateLimitInterceptor(5), // 群组内频率限制
  ],
})

// 在群组内发送
await manager.sendGroupNotification('order-group', {
  title: '订单已确认',
  body: '订单号：#12345',
})
```

## 📊 历史和统计

```typescript
// 获取历史记录
const history = manager.getHistory({
  limit: 10,
  status: 'sent', // 'sent' | 'failed' | 'pending'
})

// 获取统计信息
const stats = manager.getStats()
console.log(stats.totalSent)      // 总发送数
console.log(stats.totalFailed)    // 失败数
console.log(stats.totalClicked)   // 已点击
console.log(stats.totalDismissed) // 已关闭
console.log(stats.channels)       // 按通道统计
console.log(stats.templates)      // 按模板统计

// 清除历史
manager.clearHistory()

// 重置统计
manager.resetStats()
```

## 🎨 高级用法

### 加载状态流程

```typescript
import { NotificationUtils } from '@/utils/notifications'

// 显示加载中
const loadingId = await NotificationUtils.showLoading(
  manager,
  '处理中',
  '请稍候...'
)

// 执行异步操作
await doSomeAsyncWork()

// 更新为完成状态
await NotificationUtils.completeLoading(
  manager,
  loadingId,
  '完成',
  '操作已完成'
)
```

### 延迟发送

```typescript
// 延迟发送
await NotificationUtils.sendDelayed(
  manager,
  options,
  2000 // 延迟2秒
)

// 带延迟的批量发送
await NotificationUtils.sendBatchWithDelay(
  manager,
  [options1, options2, options3],
  500 // 每条间隔500ms
)
```

### 生命周期钩子

```typescript
const manager = getNotificationManager({
  hooks: {
    onBeforeSend: async (options) => {
      console.log('即将发送:', options)
    },
    onAfterSend: async (id, options) => {
      console.log('已发送，ID:', id)
    },
    onBeforeSchedule: async (options) => {
      console.log('即将定时发送:', options)
    },
    onAfterSchedule: async (id, options) => {
      console.log('已定时，ID:', id)
    },
    onError: async (error, context) => {
      console.error('出错:', error, context)
    },
  },
})
```

## 🏠 Home 页面测试

访问应用的主页面（`/home`）可以看到完整的通知系统演示面板，包含：

- ✅ 基础功能测试按钮
- ✅ 模板功能测试
- ✅ 高级功能（构建器、定时、批量等）
- ✅ 拦截器和群组测试
- ✅ 加载状态和统计展示
- ✅ 实时统计信息面板
- ✅ 通知历史记录展示

### 实时统计面板

显示以下数据：
- 已发送的通知总数
- 失败的通知数
- 用户点击的次数
- 用户关闭的通知数

### 历史记录

显示最近的5条通知，包括：
- 通知标题
- 通知内容
- 发送状态（已发送/失败/待发送）
- 发送时间

## 📁 项目结构

```
src/utils/notifications/
├── index.ts                 # 导出入口
├── types.ts                # 类型定义
├── NotificationManager.ts  # 核心管理类
├── Interceptors.ts         # 拦截器实现
├── helpers.ts              # 模板、构建器、工具函数
└── EXAMPLES.ts            # 使用示例
```

## ⚙️ 配置示例

```typescript
import { createNotificationManager, InterceptorFactory } from '@/utils/notifications'

const manager = createNotificationManager({
  // 默认选项
  defaultOptions: {
    priority: 'default',
    autoCancel: true,
  },

  // 默认通道
  defaultChannel: {
    id: 'default',
    name: '默认通知',
    importance: 'default',
  },

  // 功能配置
  enableHistory: true,        // 启用历史记录
  maxHistorySize: 1000,       // 最大历史条数
  enableStats: true,          // 启用统计
  autoClearTimeout: 3600,     // 自动清理超时（秒）

  // 全局拦截器
  interceptors: InterceptorFactory.createProductionInterceptors(),

  // 生命周期钩子
  hooks: {
    onBeforeSend: async (options) => {
      console.log('发送通知:', options.title)
    },
    onError: async (error, context) => {
      console.error('错误:', error.message)
    },
  },
})
```

## 🔗 单例模式

系统使用单例模式管理全局通知管理器：

```typescript
// 首次调用会创建实例
const manager1 = getNotificationManager()

// 后续调用返回同一实例
const manager2 = getNotificationManager()

console.log(manager1 === manager2) // true

// 或创建新实例
const manager3 = createNotificationManager()
console.log(manager3 === manager1) // false
```

## 💡 最佳实践

1. **使用单例模式** - 在应用启动时初始化一次
2. **合理配置拦截器** - 使用预设组合而不是手动配置
3. **利用模板系统** - 预定义常用通知，保持一致性
4. **监听事件** - 处理用户交互反馈
5. **查看统计** - 定期分析通知发送情况
6. **适当清理** - 定期清除历史记录释放内存

## 🐛 常见问题

### Q: 通知没有显示？
A: 检查权限配置和通道设置，确保通道ID正确。

### Q: 如何禁用特定通知？
A: 使用拦截器的 `beforeSend` 钩子返回 `null` 来阻止发送。

### Q: 如何处理大量通知？
A: 使用队列系统和批处理，配合频率限制拦截器。

### Q: 如何自定义通知样式？
A: 使用 `NotificationStyle` 接口配置，或创建模板预设。

## 📚 相关文档

- [Capacitor 本地通知文档](https://capacitorjs.com/docs/apis/local-notifications)
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [TypeScript 类型系统](https://www.typescriptlang.org/docs/handbook/2/types-from-types.html)

---

**版本**: 1.0.0  
**最后更新**: 2026-04-30  
**维护者**: Your Team
