# 05 账户系统方案（待定）

- 文档定位：账户与鉴权体系的技术选型、数据模型与接口契约
- 前置阅读：`01-refactor-structure.md`、`02-fusion-architecture.md`
- 状态：**待定**。本文档给出可供决策的完整依据，但方案未冻结
- 约束：本轮只产出文档，不改动代码

---

## 1. 需求边界

在讨论技术选型前，必须先明确账户系统要解决什么问题。

### 1.1 核心诉求

| 编号 | 诉求 | 说明 |
| --- | --- | --- |
| N1 | 跨设备同步 | 工具配置、偏好设置在多设备间一致 |
| N2 | 数据备份 | 本地数据丢失后可恢复 |
| N3 | 个人身份 | 个人中心展示、未来可能的分享功能 |

### 1.2 明确的非诉求

| 编号 | 非诉求 | 说明 |
| --- | --- | --- |
| X1 | 社交关系 | 无好友、关注、动态 |
| X2 | 内容分发 | 无 UGC 审核需求 |
| X3 | 支付交易 | 无付费、无虚拟资产 |
| X4 | 强制登录 | **工具必须保持未登录可用** |

X4 是本项目最重要的产品决策。这是一个个人工具集合，用户打开即用；若强制登录，等于用账户系统摧毁了工具的价值。账户是**增量能力**，不是准入门槛。

### 1.3 由此推导的架构原则

```
未登录  →  全部本地能力可用（localStorage / IndexedDB）
           │
登录后  →  本地能力不变 + 增加云端同步
           │
           └─ 冲突策略：以本地为准，云端保存历史版本
```

---

## 2. 选型对比

### 2.1 四条路线

| 路线 | 技术构成 | 优势 | 劣势 |
| --- | --- | --- | --- |
| **A. 自建后端** | Spring Boot + PostgreSQL + Redis | 完全可控；数据结构可随工具演进自由调整；无第三方依赖；可同时服务 Web 与 App | 需要服务器与运维；需要自行处理安全；开发周期最长 |
| **B. BaaS** | Supabase / LeanCloud / MongoDB Atlas | 开箱即用的鉴权与数据库；开发极快 | 国内访问稳定性存疑；数据在第三方；免费额度与容量受限；Java 技术栈无从发挥 |
| **C. 纯本地优先** | IndexedDB + 可选文件导出导入 | 零后端成本；零隐私风险；离线天然可用 | 无法跨设备同步（N1 不满足）；换设备需手动导出导入 |
| **D. 平台原生** | Capacitor 插件 + 系统账户（Google/Apple） | 无密码；体验最顺 | Web 端不可用；仅解决「登录」不解决「同步」 |

### 2.2 对比矩阵

| 维度 | A 自建 | B BaaS | C 本地 | D 原生 |
| --- | --- | --- | --- | --- |
| 满足 N1 跨设备 | 是 | 是 | 否 | 部分 |
| 满足 N2 备份 | 是 | 是 | 部分 | 否 |
| 满足 N3 身份 | 是 | 是 | 否 | 是 |
| 与 Java 技术栈契合 | 高 | 无 | 无 | 无 |
| 国内网络可用性 | 取决于部署 | 存疑 | 不涉及 | 取决于服务 |
| 长期成本 | 服务器费用 | 订阅费用 | 零 | 零 |
| 数据自主权 | 完全 | 受限 | 完全 | 受限 |
| 开发工作量 | 高 | 低 | 极低 | 低 |

### 2.3 建议路线

**推荐：A（自建 Java 后端）为主，C（本地优先）为基线**

理由：

1. 你的技术偏好明确指向 Java 实现，A 路线是唯一能发挥该栈价值的选项
2. 本项目最终要打包为 Android 应用，服务端能力可被 Web 与 App 复用
3. 数据结构（工具配置）会随工具演进频繁变化，自建后端调整成本最低
4. C 路线作为**降级基线**保留——即使后端不可用，工具依然完整可用

**分阶段落地**：

```
Phase 0  纯本地（现状）        —— 无账户，工具可用
Phase 1  本地 + 登录可选       —— 后端上线，登录后开通同步
Phase 2  完整同步              —— 冲突解决、历史版本、多端一致
```

Phase 1 即可交付价值，Phase 2 视使用反馈决定是否推进。

---

## 3. 技术选型

若采纳路线 A，建议的技术构成：

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 语言 | Java 17 或 21（LTS） | 建议 21，虚拟线程对 IO 密集场景友好 |
| 框架 | Spring Boot 3.x | 与 Spring Security 6 配套 |
| 安全 | Spring Security 6 | 认证授权框架 |
| 令牌 | JWT（Nimbus JOSE + JWT） | 访问令牌签发与校验 |
| 数据库 | PostgreSQL 15+ | 使用 `JSONB` 存储工具配置的弹性载荷 |
| 缓存 | Redis 7 | 令牌黑名单、验证码、限流计数 |
| 迁移 | Flyway | 数据库版本管理 |
| 密码哈希 | BCrypt（cost 10 至 12） | Spring Security 内置支持 |
| 构建 | Maven 或 Gradle | 按个人习惯 |

**不建议引入的**：微服务拆分、消息队列、服务网格。这是一个个人项目，单体应用足够，任何分布式组件都是负担。

---

## 4. 数据模型

### 4.1 表结构

```sql
-- ============================================
-- 用户主表
-- ============================================
CREATE TABLE users (
    id            BIGSERIAL PRIMARY KEY,
    username      VARCHAR(32)  NOT NULL UNIQUE,   -- 登录名
    email         VARCHAR(255) UNIQUE,            -- 可空
    password_hash VARCHAR(100) NOT NULL,          -- BCrypt 输出
    nickname      VARCHAR(32),                    -- 展示名
    avatar_icon   VARCHAR(64),                    -- 图标名，非 URL，见说明
    status        SMALLINT     NOT NULL DEFAULT 0,-- 0 正常 / 1 禁用 / 2 注销中
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT now(),
    last_login_at TIMESTAMPTZ
);

-- ============================================
-- 第三方登录绑定（Phase 2 再启用）
-- ============================================
CREATE TABLE user_identities (
    id           BIGSERIAL PRIMARY KEY,
    user_id      BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     VARCHAR(20)  NOT NULL,   -- wechat / github / apple
    provider_uid VARCHAR(128) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now(),
    UNIQUE (provider, provider_uid)
);

-- ============================================
-- 刷新令牌
-- ============================================
CREATE TABLE refresh_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT       NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash  VARCHAR(64)  NOT NULL UNIQUE,  -- SHA-256，不存明文
    device_info VARCHAR(255),
    expires_at  TIMESTAMPTZ  NOT NULL,
    revoked_at  TIMESTAMPTZ,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);
CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);

-- ============================================
-- 用户偏好
-- ============================================
CREATE TABLE user_preferences (
    user_id    BIGINT      PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    theme_mode VARCHAR(10) NOT NULL DEFAULT 'auto',  -- light / dark / auto
    accent     VARCHAR(20) NOT NULL DEFAULT 'mint',  -- 马卡龙色板名
    locale     VARCHAR(10) NOT NULL DEFAULT 'zh-CN',
    payload    JSONB       NOT NULL DEFAULT '{}',    -- 其余偏好，结构自由
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 工具数据
-- ============================================
CREATE TABLE user_tool_data (
    id         BIGSERIAL PRIMARY KEY,
    user_id    BIGINT      NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tool_id    VARCHAR(64) NOT NULL,   -- 对应 ToolManifest.id
    payload    JSONB       NOT NULL DEFAULT '{}',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, tool_id)
);
```

### 4.2 设计说明

**`avatar_icon` 存图标名而非 URL**：呼应 `04-icon-system.md` 的自制 SVG 体系，头像使用预设图标 + 主题色组合，而非上传图片。好处是零存储成本、零审核风险、与主题色板天然联动。若将来需要上传头像，再新增 `avatar_url` 字段。

**`payload` 用 `JSONB`**：工具配置的结构随工具演进频繁变化（如钢琴的曲谱、画布的笔刷参数）。用 `JSONB` 存储弹性数据，避免每加一个工具就改一次表结构。代价是失去部分约束能力——需在应用层做校验。

**`token_hash` 存哈希**：数据库泄露时明文令牌不可被直接利用。这是必须遵守的实践。

**`tool_id` 与 manifest 对齐**：`ToolManifest.id` 是工具的唯一标识，账户系统的工具数据以它为主键维度。**这意味着工具改名会导致数据「失联」**——需在改名时提供数据迁移映射。

### 4.3 未采用的字段及原因

| 字段 | 未采用原因 |
| --- | --- |
| 手机号 | 需短信服务与实名合规，个人项目不必承担 |
| 密码提示问题 | 属于不安全的找回方式，已被行业淘汰 |
| 最后登录 IP | 涉及个人信息收集，无实际用途 |
| 角色 / 权限 | 无管理员与普通用户之分，单体个人项目不需要 |

---

## 5. 鉴权流程

### 5.1 双令牌设计

| 令牌 | 形态 | 有效期 | 存储位置 | 用途 |
| --- | --- | --- | --- | --- |
| 访问令牌 | JWT | 15 分钟 | 内存（不持久化） | 每次请求携带 |
| 刷新令牌 | 不透明随机串 | 30 天 | 见 §5.4 | 换取新访问令牌 |

**为什么访问令牌要短**：JWT 是无状态的，签发后服务端无法主动失效。缩短有效期是控制风险的主要手段。

**为什么刷新令牌要不透明**：刷新令牌需要可撤销（登出、改密、异常检测），必须能在数据库中查到并作废，因此不适合用 JWT。

### 5.2 注册

```
客户端                          服务端
  │                              │
  ├─ POST /auth/register ───────>│
  │   { username, password }     │
  │                              ├─ 校验用户名格式与唯一性
  │                              ├─ 校验密码强度
  │                              ├─ BCrypt 哈希
  │                              ├─ 写入 users
  │                              ├─ 初始化 user_preferences
  │                              ├─ 签发 access + refresh
  │<─── { accessToken, user } ───┤
  │                              └─ Set-Cookie: refresh_token (见 §5.4)
```

**注册即登录**：注册成功后直接签发令牌，避免用户再登录一次。

### 5.3 登录

```
客户端                          服务端
  │                              │
  ├─ POST /auth/login ──────────>│
  │   { username, password }     │
  │                              ├─ 查询用户
  │                              ├─ BCrypt 校验
  │                              ├─ 失败：返回统一错误（不区分「用户不存在」与「密码错误」）
  │                              ├─ 成功：记录 last_login_at
  │                              ├─ 签发 access + refresh
  │<─── { accessToken, user } ───┤
```

**错误信息必须统一**：区分「用户不存在」与「密码错误」会泄露用户名是否存在，属于常见安全缺陷。统一返回「用户名或密码错误」。

**失败限流**：同一用户名连续失败 5 次后锁定 15 分钟（用 Redis 计数）。

### 5.4 令牌存储（需你决策的关键点）

这是本方案中**唯一需要根据部署形态做取舍**的地方：

| 客户端形态 | 推荐方案 | 说明 |
| --- | --- | --- |
| Web 浏览器 | 刷新令牌放 `HttpOnly` + `Secure` + `SameSite=Lax` Cookie | 防止 XSS 窃取 |
| Capacitor App | 刷新令牌存原生安全存储 | 见下方说明 |

**Capacitor 场景的问题**：App 内的 WebView 源为 `https://localhost`，而 API 部署在远端域名，属于跨源。跨源 Cookie 需要 `SameSite=None; Secure`，这在部分 WebView 版本上行为不稳定。

**可选方案**：

| 方案 | 优点 | 缺点 |
| --- | --- | --- |
| 跨源 Cookie（`SameSite=None`） | Web 与 App 统一 | WebView 兼容性风险 |
| 原生安全存储（Capacitor 插件） | 不依赖 Cookie 机制 | 需引入插件；Web 端仍需 Cookie，形成两套逻辑 |
| 令牌存 `localStorage` | 实现最简单 | **不推荐**：任何 XSS 都可读取，且 Capacitor 打包后 WebView 本地存储无隔离 |

**建议**：Web 端用 Cookie，App 端用原生安全存储，在 API 层做适配（登录响应中同时返回令牌，由客户端决定是否使用；App 端传入标识头，服务端据此决定是否下发 Cookie）。这是两套逻辑，但每套都正确。

**无论采用哪种，访问令牌一律只存内存**，页面刷新后通过刷新令牌重新获取。

### 5.5 刷新

```
  ├─ POST /auth/refresh ────────>│
  │                              ├─ 校验刷新令牌（哈希比对 + 过期检查 + 撤销检查）
  │                              ├─ 令牌旋转：作废旧令牌，签发新刷新令牌
  │<─── { accessToken } ─────────┤
```

**令牌旋转（rotation）**：每次刷新都换发新的刷新令牌并作废旧的。这样即使刷新令牌被窃取，攻击者与真实用户会互相「踢下线」，异常可被察觉。

**重用检测**：若一个已被作废的刷新令牌再次被使用，说明发生了泄露，立即作废该用户的**全部**刷新令牌（强制重新登录）。

### 5.6 登出

```
  ├─ POST /auth/logout ─────────>│
  │                              ├─ 作废当前刷新令牌
  │                              ├─ 清除 Cookie
  │<─── 204 ─────────────────────┤
```

登出**仅作废当前设备**的令牌。若需全部设备登出，另设接口。

---

## 6. 接口契约

### 6.1 通用约定

**基础路径**：`/api/v1`

**统一响应信封**：

```json
{
  "code": 0,
  "message": "ok",
  "data": { }
}
```

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `code` | number | 0 表示成功，非 0 为业务错误码 |
| `message` | string | 人类可读的提示，可直接展示 |
| `data` | object / null | 业务数据 |

**HTTP 状态码约定**：传输层用状态码（200/400/401/403/404/429/500），业务层用 `code`。二者不混用。

### 6.2 认证接口

#### `POST /auth/register`

```jsonc
// 请求
{
  "username": "zhangby",     // 4-32 字符，字母数字下划线
  "password": "********",    // 8-64 字符
  "nickname": "ZB"           // 可选
}

// 响应 200
{
  "code": 0,
  "message": "ok",
  "data": {
    "accessToken": "eyJhbGci...",
    "expiresIn": 900,
    "user": {
      "id": 1,
      "username": "zhangby",
      "nickname": "ZB",
      "avatarIcon": "avatar-leaf"
    }
  }
}
```

#### `POST /auth/login`

```jsonc
// 请求
{ "username": "zhangby", "password": "********" }

// 响应 200：同 register
// 响应 401
{ "code": 1001, "message": "用户名或密码错误", "data": null }
// 响应 429
{ "code": 1002, "message": "尝试过于频繁，请稍后再试", "data": null }
```

#### `POST /auth/refresh`

```jsonc
// 请求：空体（令牌从 Cookie 或请求头读取）
// 响应 200
{ "code": 0, "message": "ok", "data": { "accessToken": "...", "expiresIn": 900 } }
// 响应 401
{ "code": 1003, "message": "登录已过期，请重新登录", "data": null }
```

#### `POST /auth/logout`

```jsonc
// 响应 204：无响应体
```

### 6.3 用户接口

| 方法 | 路径 | 说明 | 鉴权 |
| --- | --- | --- | --- |
| `GET` | `/users/me` | 获取当前用户 | 必需 |
| `PATCH` | `/users/me` | 更新昵称、头像图标 | 必需 |
| `PUT` | `/users/me/password` | 修改密码 | 必需 |
| `GET` | `/users/me/preferences` | 读取偏好 | 必需 |
| `PUT` | `/users/me/preferences` | 写入偏好 | 必需 |

```jsonc
// GET /users/me 响应
{
  "code": 0, "message": "ok",
  "data": {
    "id": 1,
    "username": "zhangby",
    "nickname": "ZB",
    "avatarIcon": "avatar-leaf",
    "createdAt": "2026-09-18T12:00:00Z"
  }
}

// PUT /users/me/preferences 请求
{
  "themeMode": "dark",       // light / dark / auto
  "accent": "mint",          // 马卡龙色板名
  "locale": "zh-CN",
  "payload": { }             // 其余偏好
}
```

### 6.4 工具数据接口

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| `GET` | `/tools/{toolId}/data` | 读取该工具的用户数据 |
| `PUT` | `/tools/{toolId}/data` | 写入（全量覆盖） |
| `DELETE` | `/tools/{toolId}/data` | 清除 |

```jsonc
// PUT /tools/piano/data 请求
{
  "payload": { "lastScore": "canon", "speed": 0.85 },
  "clientUpdatedAt": "2026-09-18T12:30:00Z"   // 用于冲突判断
}

// GET /tools/piano/data 响应
{
  "code": 0, "message": "ok",
  "data": {
    "toolId": "piano",
    "payload": { },
    "updatedAt": "2026-09-18T12:30:00Z"
  }
}
```

**冲突策略**：Phase 1 采用「后写覆盖」（`clientUpdatedAt` 较新者胜）。Phase 2 再引入版本号与历史版本。

### 6.5 错误码表

| `code` | HTTP | 含义 |
| --- | --- | --- |
| 0 | 200 | 成功 |
| 1000 | 400 | 参数校验失败 |
| 1001 | 401 | 用户名或密码错误 |
| 1002 | 429 | 登录尝试过于频繁 |
| 1003 | 401 | 登录已过期 |
| 1004 | 409 | 用户名已被占用 |
| 1005 | 403 | 账户已被禁用 |
| 1006 | 401 | 刷新令牌无效或被重用 |
| 2000 | 403 | 无权访问该资源 |
| 9000 | 500 | 服务端内部错误 |

**安全提示**：`1001` 不区分「用户不存在」与「密码错误」，这是刻意设计。

---

## 7. 前端集成

### 7.1 模块位置

按 `01-refactor-structure.md` 的分层，账户模块落在：

```
src/modules/account/
├── api/
│   ├── client.ts          # fetch 封装：注入令牌、统一错误、自动刷新
│   ├── auth.ts            # 认证接口
│   ├── user.ts            # 用户接口
│   └── types.ts           # 接口类型定义
├── stores/
│   └── auth.ts            # Pinia store
├── views/
│   ├── LoginView.vue
│   ├── RegisterView.vue
│   └── ProfileView.vue
├── composables/
│   └── useAuthGuard.ts
└── index.ts
```

### 7.2 Pinia Store

```typescript
// src/modules/account/stores/auth.ts
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '../api/types'
import * as authApi from '../api/auth'

export const useAuthStore = defineStore('auth', () => {
  // 状态：访问令牌仅存内存，页面刷新后丢失，靠刷新令牌恢复
  const accessToken = ref<string | null>(null)
  const user = ref<User | null>(null)
  const status = ref<'idle' | 'loading' | 'ready'>('idle')

  const isAuthenticated = computed(() => !!accessToken.value && !!user.value)

  /** 应用启动时调用：尝试用刷新令牌恢复会话 */
  async function restore(): Promise<void> {
    status.value = 'loading'
    try {
      const res = await authApi.refresh()
      accessToken.value = res.accessToken
      user.value = await authApi.me()
    } catch {
      // 恢复失败属正常情况（首次访问、令牌过期），静默处理
      accessToken.value = null
      user.value = null
    } finally {
      status.value = 'ready'
    }
  }

  async function login(username: string, password: string): Promise<void> {
    const res = await authApi.login(username, password)
    accessToken.value = res.accessToken
    user.value = res.user
  }

  async function logout(): Promise<void> {
    try { await authApi.logout() } finally {
      accessToken.value = null
      user.value = null
    }
  }

  return { accessToken, user, status, isAuthenticated, restore, login, logout }
})
```

**要点**：`accessToken` 用 `ref` 而非持久化——这是 §5.4 的直接体现。

### 7.3 API 客户端与自动刷新

```typescript
// src/modules/account/api/client.ts（核心逻辑示意）

let refreshing: Promise<string> | null = null   // 防止并发刷新

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const auth = useAuthStore()

  const doFetch = (token: string | null) =>
    fetch(`${BASE_URL}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...init.headers,
      },
      credentials: 'include',   // Web 端携带刷新令牌 Cookie
    })

  let res = await doFetch(auth.accessToken)

  // 401 时尝试刷新一次
  if (res.status === 401 && auth.accessToken) {
    refreshing ??= authApi.refresh()
      .then(r => { auth.accessToken = r.accessToken; return r.accessToken })
      .finally(() => { refreshing = null })

    try {
      res = await doFetch(await refreshing)
    } catch {
      await auth.logout()
      throw new ApiError(1003, '登录已过期')
    }
  }

  const body = await res.json()
  if (body.code !== 0) throw new ApiError(body.code, body.message)
  return body.data as T
}
```

**并发刷新控制是必需的**：页面初始化时可能有多个请求同时收到 401，若不加锁会触发多次刷新，而刷新令牌的旋转机制会让后续刷新全部失败。用共享 Promise 保证只刷新一次。

### 7.4 路由守卫

```typescript
// src/app/router/guards/auth.ts
import type { Router } from 'vue-router'
import { useAuthStore } from '@/modules/account'

export function installAuthGuard(router: Router): void {
  router.beforeEach(async (to) => {
    // 未标记需鉴权的路由直接放行
    if (!to.meta.requiresAuth) return true

    const auth = useAuthStore()

    // 首次进入需等待会话恢复完成
    if (auth.status === 'idle') {
      await auth.restore()
    }

    if (auth.isAuthenticated) return true

    // 重定向到登录页，记录来路以便登录后跳回
    return {
      name: 'login',
      query: { redirect: to.fullPath },
    }
  })
}
```

**路由元信息**：

```typescript
// 需要登录的路由
{ path: '/profile', name: 'profile', component: ProfileView, meta: { requiresAuth: true } }

// 工具路由：默认不需要登录
{ path: '/tools/btree', name: 'tool-btree', meta: { requiresAuth: false } }
```

**关键**：`requiresAuth` 默认为 `false`。新增路由时不写该字段即表示公开——这与 §1.2 的 X4（工具必须未登录可用）一致。

### 7.5 工具模块接入同步

融合到 Stage 3 的工具（见 `02-fusion-architecture.md`）可以使用统一的数据同步能力：

```typescript
// src/shared/composables/useToolData.ts
export function useToolData<T>(toolId: string, defaultValue: T) {
  const auth = useAuthStore()
  const local = useLocalStorage(`tool:${toolId}`, defaultValue)

  // 未登录或用旧版架构时，退化为纯本地
  if (!auth.isAuthenticated) {
    return { data: local, syncState: ref('local-only') }
  }

  // 已登录：本地为准，异步推送到云端
  // ...
}
```

**设计要点**：本地存储永远是第一数据源，云端是备份。这样断网、后端故障、未登录三种情况下，工具行为完全一致，无需分支处理。

### 7.6 与现有模块的关系

| 现有模块 | 关系 |
| --- | --- |
| `utils/notifications/` | 登录成功/失败、同步冲突等场景可通过通知系统反馈。**注意**：通知系统当前使用 emoji，需按 `04-icon-system.md` 改造 |
| `BottomNavManager` | 个人中心入口已在导航中，需接上鉴权守卫 |
| `PagesData.ts` / `ToolManifest` | 工具数据接口以 `manifest.id` 为维度，改名需同步迁移数据 |

---

## 8. 安全要点汇总

按重要性排序：

| 编号 | 要点 | 说明 |
| --- | --- | --- |
| S1 | 密码用 BCrypt，cost 不低于 10 | 绝不用 MD5 / SHA-1 / 明文 |
| S2 | 刷新令牌存哈希 | 数据库泄露时明文不可用 |
| S3 | 登录错误信息统一 | 不泄露用户名是否存在 |
| S4 | 登录失败限流 | 防暴力破解 |
| S5 | 访问令牌短有效期 | 15 分钟，降低泄露窗口 |
| S6 | 刷新令牌旋转 + 重用检测 | 泄露可被察觉 |
| S7 | 全站 HTTPS | 令牌传输的前提 |
| S8 | 输入参数校验 | 所有接口的请求体都需服务端校验 |
| S9 | 访问令牌不入持久化存储 | 仅存内存 |
| S10 | 数据库连接凭证不入代码库 | 用环境变量或配置中心 |

**本方案明确不处理的**（超出个人项目范围）：短信验证、实名认证、风控系统、审计日志、等保合规。

---

## 9. 待决策项

以下问题需要你确认后才能进入实施：

| 编号 | 问题 | 选项 |
| --- | --- | --- |
| D1 | 是否确定采用自建 Java 后端 | A 自建 / B BaaS / C 纯本地 |
| D2 | 服务器与域名 | 是否已有可用服务器？部署在境内还是境外？（影响是否需要备案） |
| D3 | 登录标识 | 仅用户名 / 用户名 + 邮箱 |
| D4 | 第三方登录 | 是否需要？若需要，接入哪家（微信 / GitHub / Apple） |
| D5 | 令牌存储方案 | 见 §5.4，Web 与 App 可能采用不同方案 |
| D6 | 同步范围 | 仅偏好设置 / 偏好 + 工具数据 |
| D7 | 是否允许多设备同时在线 | 影响令牌策略 |
| D8 | 数据删除权 | 用户注销后数据保留多久？是否需要立即物理删除？ |

---

## 10. 实施顺序

```
[1] 确定 §9 的待决策项
        │
[2] 服务端：项目骨架 + 数据库迁移 + users 表
        │
[3] 服务端：注册 / 登录 / 刷新 / 登出 四个接口
        │
[4] 前端：account 模块骨架 + authStore + api client
        │
[5] 前端：登录页 / 注册页（套用设计系统，图标用 AppIcon）
        │
[6] 前端：路由守卫接入
        │
[7] 联调：完整走通「注册 -> 登录 -> 刷新 -> 登出」
        │
[8] 服务端：偏好同步接口
        │
[9] 前端：个人中心接入真实数据
        │
[10] 服务端：工具数据接口（需 02 文档的融合进度配合）
```

**步骤 1 是硬前提**。D1 未定则后续全部无法进行；D2 未定则无法评估备案与合规成本。

---

## 11. 验收清单

- [ ] 未登录状态下，全部工具可正常使用（N4 非诉求的验证）
- [ ] 密码在数据库中为 BCrypt 哈希，无明文
- [ ] 刷新令牌在数据库中为哈希，无明文
- [ ] 登录失败信息不区分用户名与密码错误
- [ ] 连续失败触发限流
- [ ] 访问令牌不写入 localStorage / sessionStorage
- [ ] 并发 401 只触发一次刷新
- [ ] 刷新令牌重用可被检测并触发全量作废
- [ ] 路由 `requiresAuth` 默认为 false
- [ ] 后端不可用时，前端工具功能不受影响
- [ ] `code` 与 HTTP 状态码不混用
