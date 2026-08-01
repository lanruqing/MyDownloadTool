# Node.js 企业级后端教程与指南

> 基于 `NewTransmissionTool/backend` 真实代码,从零讲解一个企业级 Node.js 后端的架构、分层、模式与实现。
>
> 阅读对象:刚接触 Node.js 后端、想理解"企业级"代码怎么组织的开发者。

---

## 目录

1. [项目总览](#1-项目总览)
2. [技术栈选型](#2-技术栈选型)
3. [目录结构详解](#3-目录结构详解)
4. [分层架构](#4-分层架构)
5. [配置管理](#5-配置管理)
6. [类型系统](#6-类型系统)
7. [Repository 层 — 数据访问](#7-repository-层--数据访问)
8. [Service 层 — 业务逻辑](#8-service-层--业务逻辑)
9. [Controller 层 — HTTP 适配](#9-controller-层--http-适配)
10. [Route 层 — 路由注册](#10-route-层--路由注册)
11. [应用入口 — 组合根](#11-应用入口--组合根)
12. [错误处理与统一响应](#12-错误处理与统一响应)
13. [测试策略](#13-测试策略)
14. [Docker 化部署](#14-docker-化部署)
15. [企业级最佳实践清单](#15-企业级最佳实践清单)

---

## 1. 项目总览

这是一个 **Transmission BT 客户端的后端 API 服务**。它本身不下载种子,而是作为"中间层",把前端请求翻译成 Transmission 守护进程的 RPC 调用,再把结果以统一的 JSON 格式返回给前端。

```
┌──────────┐      HTTP/JSON      ┌──────────────┐     RPC(POST)    ┌──────────────────┐
│  前端 UI  │  ───────────────▶  │  本后端服务   │  ──────────────▶  │ Transmission 守护 │
│ (React)  │  ◀───────────────  │  (Hono+TS)   │  ◀──────────────  │  (NAS 上的进程)   │
└──────────┘   /api/torrents     └──────────────┘   /transmission/rpc└──────────────────┘
```

**核心功能**:
- 列出 / 添加 / 启动 / 停止 / 删除种子
- 读取与修改 Transmission 会话设置
- 健康检查

---

## 2. 技术栈选型

| 层面 | 选型 | 为什么选它 |
|------|------|-----------|
| 运行时 | Node.js 20 | LTS,原生支持 `fetch`、ESM |
| 语言 | TypeScript 5.4 | 类型安全 = 重构信心 + 自文档 |
| Web 框架 | [Hono](https://hono.dev) | 轻量、快速、中间件生态好、跨运行时 |
| 模块系统 | ESM (`"type": "module"`) | 现代标准,支持顶层 await |
| 开发工具 | `tsx` | 免编译直接跑 TS,带 watch |
| 测试 | Vitest | 与 Vite 生态一致,速度快,globals API |
| 配置 | `dotenv` | 环境变量注入,12-Factor App 实践 |
| 容器 | Docker (node:20-alpine) | 可移植、可部署到 NAS |

> 💡 **企业级要点**:技术栈不是越新越好,而是"够用 + 生态成熟 + 团队可维护"。这里每个选择都有明确理由。

---

## 3. 目录结构详解

```
backend/
├── package.json          # 依赖与脚本
├── tsconfig.json         # TypeScript 编译配置
├── vitest.config.ts      # 测试配置
├── Dockerfile            # 容器构建
└── src/
    ├── index.ts          # 应用入口(组合根)
    ├── config/
    │   └── index.ts      # 配置加载
    ├── types/
    │   └── index.ts      # 全局类型定义
    ├── repositories/
    │   └── transmissionRepository.ts   # 数据访问层
    ├── services/
    │   └── transmission.ts             # 业务逻辑层
    ├── controllers/
    │   ├── healthController.ts
    │   ├── sessionController.ts
    │   └── torrentController.ts        # HTTP 适配层
    ├── routes/
    │   ├── index.ts        # 路由总注册
    │   ├── health.ts
    │   ├── session.ts
    │   └── torrents.ts
    └── __tests__/
        └── transmission.test.ts        # 单元测试
```

**命名约定**:
- 文件名小驼峰 `torrentController.ts`
- 类名大驼峰 `TorrentController`
- 接口名不加 `I` 前缀,靠 `Impl` 后缀区分实现:`TransmissionRepository`(接口) vs `TransmissionRepositoryImpl`(实现)

---

## 4. 分层架构

这是整个教程的核心。企业级后端最重要的不是"用什么框架",而是**怎么分层**。

```
┌─────────────────────────────────────────────────┐
│  Route 层   routes/torrents.ts                  │  只负责"哪个 URL 对应哪个方法"
├─────────────────────────────────────────────────┤
│  Controller 层  controllers/torrentController.ts │  解析 HTTP 请求 → 调 Service → 包装响应
├─────────────────────────────────────────────────┤
│  Service 层   services/transmission.ts           │  业务逻辑,不关心 HTTP
├─────────────────────────────────────────────────┤
│  Repository 层  repositories/...Repository.ts    │  与外部系统(Transmission RPC)通信
├─────────────────────────────────────────────────┤
│  外部系统: Transmission 守护进程                  │
└─────────────────────────────────────────────────┘
```

### 为什么要分层?

| 不分层(面条代码) | 分层后 |
|---|---|
| 路由里直接写 `fetch`、解析 body、处理错误 | 每层只做一件事 |
| 换框架 = 全部重写 | 换框架只动 Route/Controller |
| 无法测试(请求对象难造) | Service 可注入 mock repository |
| 业务逻辑散落各处 | 集中在 Service |

**核心原则:依赖方向永远向下,下层不知道上层存在。**

- Repository 不知道有 Service
- Service 不知道有 Controller
- Controller 不知道有 Route

---

## 5. 配置管理

> 文件:`src/config/index.ts`

企业级应用**绝不硬编码**配置。所有可变值都从环境变量读取。

```ts
export interface AppConfig {
  port: number;
  transmissionUrl: string;
  transmissionUsername: string;
  transmissionPassword: string;
}

export function loadConfig(): AppConfig {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    transmissionUrl:
      process.env.TRANSMISSION_URL ||
      'http://192.168.50.109:49092/transmission/rpc',
    transmissionUsername: process.env.TRANSMISSION_USERNAME || 'qnap',
    transmissionPassword: process.env.TRANSMISSION_PASSWORD || 'qnap',
  };
}
```

### 关键设计点

1. **强类型接口 `AppConfig`**:配置项有类型,`port` 是 `number` 而不是 `string`,编译期就能发现错误。
2. **工厂函数 `loadConfig()`**:不导出一个全局 `config` 对象,而是导出一个"造配置的函数"。这样:
   - 测试时可以造不同配置
   - 配置只在需要时才加载(避免副作用)
3. **带默认值**:开发环境开箱即用,生产环境用环境变量覆盖。
4. **`parseInt` 显式转换**:`process.env.PORT` 是字符串,必须转成数字。

> ⚠️ **生产环境改进建议**:默认值里硬编码了真实 NAS 的 IP 和密码,这在开源项目里是**不安全**的。生产应改为:
> ```ts
> transmissionUrl: process.env.TRANSMISSION_URL!,  // 没有就报错,而不是用默认值
> ```
> 或用 [zod](https://zod.dev) 做启动时校验,缺配置直接 fail-fast。

---

## 6. 类型系统

> 文件:`src/types/index.ts`

TypeScript 的类型是"设计文档 + 编译期检查"的双重保障。本项目把所有跨层共享的类型集中在一个文件里。

```ts
export interface TorrentFields {
  id: number;
  name: string;
  status: number;
  percentDone: number;
  rateDownload: number;
  // ...更多字段
}

export interface TorrentGetResponse {
  torrents: TorrentFields[];
}

export interface APIResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}
```

### 设计要点

| 类型 | 作用 | 谁用 |
|------|------|------|
| `TorrentFields` | 描述一个种子的完整字段 | Repository 返回、Service 传递、Controller 输出 |
| `TorrentGetResponse` | RPC 返回的包装结构 | Repository → Service |
| `APIResponse<T>` | 统一的前端响应格式 | 所有 Controller 的返回值 |
| `TransmissionRPCRequest/Response` | 与 Transmission 协议对齐 | Repository 内部 |

**`APIResponse` 的妙处**:用 `[key: string]: unknown` 索引签名,允许 Controller 往里塞任意业务字段(`torrents`、`session`、`stats`...),同时保证 `success` 和 `error` 一定存在。前端只需先判 `success` 就知道请求成败。

---

## 7. Repository 层 — 数据访问

> 文件:`src/repositories/transmissionRepository.ts`

这一层封装了与 Transmission 守护进程的 HTTP RPC 通信。**上层完全不知道** Transmission 用的是什么协议。

### 接口与实现分离

```ts
export interface TransmissionRepository {
  callRPC<T = unknown>(method: string, args?: Record<string, unknown>): Promise<T>;
}

export class TransmissionRepositoryImpl implements TransmissionRepository {
  // ...具体实现
}
```

**为什么要分接口和实现?**

```
Service 依赖的是「接口」TransmissionRepository
              ↓
        接口只有一个方法 callRPC
              ↓
   实现可以是:HTTP 版本 / 内存 mock 版本 / 缓存版本
```

这样 Service 在测试时可以注入一个"假的" Repository,不依赖真实网络。

### 核心实现解析

```ts
export class TransmissionRepositoryImpl implements TransmissionRepository {
  private sessionId = '';                    // Transmission 的会话令牌
  private failedAuthAttempts = 0;            // 认证失败计数
  private lastAuthFailureTime = 0;           // 上次失败时间
  private readonly MAX_AUTH_FAILURES = 3;     // 最大失败次数
  private readonly AUTH_FAILURE_RESET_MS = 60000; // 1分钟重置计数

  constructor(private readonly config: AppConfig) {}
```

#### (1) 认证头构造

```ts
if (this.config.transmissionUsername || this.config.transmissionPassword) {
  const creds = Buffer.from(
    `${this.config.transmissionUsername}:${this.config.transmissionPassword}`,
  ).toString('base64');
  headers['Authorization'] = `Basic ${creds}`;
}
```

Transmission 用 HTTP Basic Auth。这里用 `Buffer.from(...).toString('base64')` 生成标准 Base64 凭证。

#### (2) 409 会话协商(Transmission 协议特色)

```ts
let response = await makeRequest();

if (response.status === 409) {
  const newSessionId = response.headers.get('X-Transmission-Session-Id');
  if (!newSessionId) {
    throw new Error('...missing X-Transmission-Session-Id header');
  }
  this.sessionId = newSessionId;
  headers['X-Transmission-Session-Id'] = this.sessionId;
  response = await makeRequest();   // 用新 token 重试一次
}
```

**Transmission 的 CSRF 机制**:第一次请求不带 session id,服务器返回 409 并在响应头里给出一个 token;客户端带上这个 token 重新请求即可。这段代码把这个细节封装在 Repository 里,**上层完全无感**。

#### (3) 认证失败熔断

```ts
if (response.status === 401 || response.status === 403) {
  const now = Date.now();
  if (now - this.lastAuthFailureTime > this.AUTH_FAILURE_RESET_MS) {
    this.failedAuthAttempts = 0;     // 超过1分钟,计数归零
  }
  this.failedAuthAttempts += 1;
  this.lastAuthFailureTime = now;

  if (this.failedAuthAttempts >= this.MAX_AUTH_FAILURES) {
    throw new Error(`[认证失败] 已连续失败 ${this.MAX_AUTH_FAILURES} 次...`);
  }
  throw new Error(`[认证失败 ${response.status}] 第 ${this.failedAuthAttempts}/${this.MAX_AUTH_FAILURES} 次失败。`);
}
```

这是一个简单的**熔断器(Circuit Breaker)雏形**:连续失败 3 次就给出明确错误,避免无限重试浪费资源。1 分钟窗口后自动恢复。

#### (4) 业务结果校验

```ts
const data = (await response.json()) as TransmissionRPCResponse<T>;
if (data.result !== 'success') {
  throw new Error(`Transmission RPC error: ${data.result}`);
}
return data.arguments as T;
```

Transmission 即使 HTTP 200,`result` 字段也可能是 `"failure"`。这里做了二次校验,只把 `arguments` 部分返回给上层,屏蔽了协议细节。

> 💡 **泛型方法 `callRPC<T>`**:调用方指定返回类型,如 `callRPC<TorrentGetResponse>('torrent-get', ...)`,既类型安全又不用写多个方法。

---

## 8. Service 层 — 业务逻辑

> 文件:`src/services/transmission.ts`

Service 层是"业务动词"的集合。它把 Repository 的通用 `callRPC` 包装成领域语义的方法。

```ts
export class TransmissionService {
  private readonly repository: TransmissionRepository;

  constructor(repositoryOrConfig: TransmissionRepository | AppConfig) {
    if ('callRPC' in repositoryOrConfig) {
      this.repository = repositoryOrConfig;           // 注入接口(推荐)
    } else {
      this.repository = new TransmissionRepositoryImpl(repositoryOrConfig); // 兼容旧用法
    }
  }
```

### 依赖注入

构造函数接收 `TransmissionRepository` **接口**,而不是具体实现。这是**依赖倒置原则(DIP)**的体现:

```
高层模块(Service)不应依赖低层模块(RepositoryImpl),二者都应依赖抽象(接口)。
```

> ⚠️ 这里的"兼容旧用法"分支是为了向后兼容。新代码应**只接受接口**,保持单一构造路径。这是项目演进中的过渡设计。

### 领域方法

```ts
async getTorrents(): Promise<TorrentGetResponse> {
  const fields = ['id', 'name', 'status', ...];
  return this.repository.callRPC<TorrentGetResponse>('torrent-get', { fields });
}

async addTorrent(args: TorrentAddArgs): Promise<TorrentAddResponse> {
  return this.repository.callRPC<TorrentAddResponse>('torrent-add', args);
}

async startTorrent(id: number): Promise<void> {
  await this.repository.callRPC('torrent-start', { ids: [id] });
}
```

**注意**:
- 方法名是业务语言(`getTorrents`),不是协议语言(`torrent-get`)
- 返回类型明确(`Promise<TorrentGetResponse>`),不是 `any`
- `startTorrent` 返回 `Promise<void>`,调用方只关心成功与否

### 为什么 Service 不直接处理 HTTP?

因为 Service 可能被**非 HTTP 场景**复用:定时任务、WebSocket、CLI 工具。如果 Service 里混了 `c.req.json()` 这种 Hono 专属代码,就无法复用了。

---

## 9. Controller 层 — HTTP 适配

> 文件:`src/controllers/torrentController.ts` 等

Controller 是"翻译官":把 Hono 的 `Context` 翻译成 Service 调用,把 Service 结果翻译成 HTTP 响应。

```ts
export class TorrentController {
  constructor(private readonly service: TransmissionService) {}

  async list(c: Context) {
    try {
      const data = await this.service.getTorrents();
      return c.json<APIResponse<TorrentGetResponse>>({
        success: true,
        torrents: data.torrents,
      });
    } catch (error: unknown) {
      return c.json<APIResponse>(
        { success: false, error: (error as Error).message },
        500,
      );
    }
  }
```

### 职责清单

1. **解析请求**:从 `c.req.param()`、`c.req.query()`、`c.req.parseBody()` 取参数
2. **输入校验**:检查必填项(如 `id` 是否存在)
3. **调用 Service**:把参数转成 Service 需要的形状
4. **包装响应**:统一用 `APIResponse` 格式
5. **错误处理**:`try/catch` 捕获异常,返回 500 + 错误信息

### 文件上传处理示例

```ts
async add(c: Context) {
  const body = await c.req.parseBody();        // 支持 multipart/form-data
  const file = body['file'];
  const url = (body['url'] as string | undefined)?.trim();

  if (file && file instanceof File) {
    const buffer = await file.arrayBuffer();
    rpcArgs.metainfo = Buffer.from(buffer).toString('base64');  // .torrent → base64
  } else if (url) {
    rpcArgs.filename = url;                    // 磁力链接 / URL
  } else {
    return c.json<APIResponse>({ success: false, error: '...' }, 400);
  }
```

这里展示了两种添加种子的方式:上传文件 vs 提供 URL,Controller 负责分流并构造不同的 RPC 参数。

### SessionController 的优雅降级

```ts
async get(c: Context) {
  const session = await this.service.getSession();
  const stats = await this.service.getSessionStats();

  let freeSpace = -1;
  if (session['download-dir']) {
    try {
      const freeSpacePayload = await this.service.getFreeSpace(session['download-dir']);
      freeSpace = freeSpacePayload['size-bytes'];
    } catch (error) {
      console.error('Failed to retrieve free space...', error);
      // 不抛错,用 -1 表示"未知",保证主请求仍成功
    }
  }
```

**企业级思维**:获取空闲空间失败不应导致整个会话查询失败。用 `-1` 哨兵值降级,前端据此显示"未知"。

---

## 10. Route 层 — 路由注册

> 文件:`src/routes/torrents.ts` 等

Route 层极薄,只做"URL → Controller 方法"的映射。

```ts
export function registerTorrentRoutes(app: Hono, controller: TorrentController) {
  app.get('/api/torrents', (c) => controller.list(c));
  app.post('/api/torrents', (c) => controller.add(c));
  app.post('/api/torrents/:id/start', (c) => controller.start(c));
  app.post('/api/torrents/:id/stop', (c) => controller.stop(c));
  app.delete('/api/torrents/:id', (c) => controller.remove(c));
}
```

### 为什么用 `registerXxxRoutes` 函数而不是直接写 `app.get`?

1. **可组合**:`routes/index.ts` 统一调用所有注册函数
2. **可测试**:可以传入一个 mock `app` 验证路由是否正确
3. **可移植**:换框架时,只需重写这一层

### 路由总注册

```ts
// routes/index.ts
export function registerApiRoutes(app: Hono, service: TransmissionService, config: AppConfig) {
  const torrentController = new TorrentController(service);
  const sessionController = new SessionController(service);
  const healthController = new HealthController(config);

  registerTorrentRoutes(app, torrentController);
  registerSessionRoutes(app, sessionController);
  registerHealthRoutes(app, healthController);
}
```

这里完成了**对象图的组装**:创建 Controller,注入 Service,再注册路由。这是轻量级的"手动依赖注入容器"。

---

## 11. 应用入口 — 组合根

> 文件:`src/index.ts`

入口文件是整个应用的**组合根(Composition Root)**——唯一一个知道所有具体实现、负责把它们拼装起来的地方。

```ts
import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import * as dotenv from 'dotenv';
import { loadConfig } from './config/index.js';
import { TransmissionRepositoryImpl } from './repositories/transmissionRepository.js';
import { TransmissionService } from './services/transmission.js';
import { registerApiRoutes } from './routes/index.js';

dotenv.config();                                          // 1. 加载 .env

const config = loadConfig();                               // 2. 读配置
const app = new Hono();                                    // 3. 建应用
const transmissionRepository = new TransmissionRepositoryImpl(config);  // 4. 建 Repository
const transmissionService = new TransmissionService(transmissionRepository); // 5. 建 Service

app.use('/*', cors({ origin: '*', ... }));                 // 6. 全局中间件

registerApiRoutes(app, transmissionService, config);       // 7. 注册路由

serve({ fetch: app.fetch, port: config.port });            // 8. 启动
```

### 依赖链的组装顺序

```
config → Repository → Service → Controller → Routes → App
```

**自下而上构建,自上而下使用**。这是依赖注入的标准流程。

### `.js` 扩展名的玄机

```ts
import { loadConfig } from './config/index.js';   // 注意是 .js 不是 .ts
```

因为项目用 ESM(`"module": "NodeNext"`),ESM 规范要求 import 路径必须带完整扩展名。TypeScript 编译时不会自动补 `.js`,所以源码里就要写 `.js`(指向编译后的产物)。

### CORS 中间件

```ts
app.use('/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 600,
}));
```

前后端分离部署时,浏览器会做同源检查。CORS 中间件允许跨域请求。`maxAge: 600` 表示预检请求结果缓存 10 分钟,减少 OPTIONS 请求。

> ⚠️ 生产环境应把 `origin: '*'` 改成具体域名,避免任意网站都能调用你的 API。

---

## 12. 错误处理与统一响应

### 统一响应格式

所有接口都返回 `APIResponse`:

```ts
// 成功
{ "success": true, "torrents": [...] }

// 失败
{ "success": false, "error": "Transmission RPC error: failure" }
```

前端只需:
```ts
if (data.success) { /* 用 data.torrents */ }
else { alert(data.error); }
```

### 错误处理模式

每个 Controller 方法都用 `try/catch`:

```ts
try {
  // 正常逻辑
} catch (error: unknown) {
  return c.json<APIResponse>(
    { success: false, error: (error as Error).message },
    500,
  );
}
```

**为什么 `error` 是 `unknown` 而不是 `Error`?**
TypeScript 4.4+ 默认 catch 子句变量是 `unknown`(更安全),需要显式断言才能访问 `.message`。

### 改进建议:全局错误中间件

当前每个方法都写 try/catch,重复代码多。企业级做法是用 Hono 的 `app.onError`:

```ts
app.onError((err, c) => {
  console.error(err);
  return c.json<APIResponse>({ success: false, error: err.message }, 500);
});
```

这样 Controller 就可以只写正常逻辑,异常自动被全局兜底。

---

## 13. 测试策略

> 文件:`src/__tests__/transmission.test.ts`

### 测试金字塔

```
        /\
       /E2E\        少量,慢,验证整条链路
      /------\
     / 集成测试 \    中等,验证模块组合
    /------------\
   /   单元测试    \  大量,快,验证单个函数/类
  /------------------\
```

本项目目前以**单元测试**为主,聚焦 Service + Repository 的核心逻辑。

### 测试核心:Mock fetch

```ts
beforeEach(() => {
  service = new TransmissionService(new TransmissionRepositoryImpl(config));
  fetchMock = vi.spyOn(globalThis as any, 'fetch');   // 拦截全局 fetch
});

afterEach(() => {
  vi.restoreAllMocks();   // 每个用例后恢复,避免互相污染
});
```

因为 Repository 用的是全局 `fetch`,所以 mock 它就能模拟整个网络层,**不需要真实 Transmission 守护进程**。

### 三个关键测试用例

**1. 认证头构造**
```ts
it('should attach authorization header when credentials are set', async () => {
  const authConfig = { ...config, transmissionUsername: 'user', transmissionPassword: 'pass' };
  const authService = new TransmissionService(new TransmissionRepositoryImpl(authConfig));

  fetchMock.mockResolvedValueOnce({ ok: true, status: 200, json: ... } as Response);

  await authService.callRPC('session-get');

  const request = fetchMock.mock.calls[0]![1] as RequestInit;
  expect(request.headers).toMatchObject({
    Authorization: `Basic ${Buffer.from('user:pass').toString('base64')}`,
  });
});
```
验证:配置了用户名密码 → 请求头带正确的 Basic Auth。

**2. 409 会话协商**
```ts
it('should retry session id negotiation on 409', async () => {
  fetchMock
    .mockResolvedValueOnce({ ok: false, status: 409, headers: { get: () => 'new-session-id' } })
    .mockResolvedValueOnce({ ok: true, status: 200, json: ... });

  const result = await service.callRPC('session-get');
  expect(result).toEqual({ foo: 'bar' });
  expect(fetchMock).toHaveBeenCalledTimes(2);   // 确实重试了一次
});
```
验证:第一次 409 → 取新 token → 重试成功。

**3. 业务失败**
```ts
it('should throw when rpc call returns non-success result', async () => {
  fetchMock.mockResolvedValue({
    ok: true, status: 200,
    json: async () => ({ result: 'failure', arguments: {} }),
  });

  await expect(service.callRPC('session-get'))
    .rejects.toThrow('Transmission RPC error: failure');
});
```
验证:HTTP 200 但 `result !== 'success'` 时抛错。

### 测试配置

```ts
// vitest.config.ts
export default defineConfig({
  test: {
    globals: true,            // 直接用 describe/it/expect,不用 import
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
  },
});
```

`globals: true` 让 `describe`、`it`、`expect` 全局可用,测试代码更简洁。

---

## 14. Docker 化部署

> 文件:`Dockerfile`

```dockerfile
FROM node:20-alpine           # 小体积基础镜像

WORKDIR /app/backend

COPY package.json package-lock.json ./
RUN npm install               # 安装依赖

COPY src ./src
COPY tsconfig.json ./
COPY .env* ./

RUN npm run build             # 编译 TypeScript → dist/

EXPOSE 3000
CMD ["npm", "start"]          # node dist/index.js
```

### 关键点

| 指令 | 作用 | 为什么 |
|------|------|--------|
| `node:20-alpine` | 基础镜像 | Alpine 版本体积小(~50MB vs ~300MB) |
| `COPY package.json` 在前 | 先拷依赖文件 | 利用 Docker 层缓存,代码变了不重装依赖 |
| `RUN npm run build` | 编译 TS | 容器内构建,本地无需装 TS |
| `EXPOSE 3000` | 声明端口 | 文档性质,实际映射在 `docker-compose.yml` |

### 开发 vs 生产

- **开发**:`npm run dev` → `tsx watch src/index.ts`,改代码自动重启
- **生产**:`npm run build` → `npm start`,跑编译后的 JS,性能更好

---

## 15. 企业级最佳实践清单

### ✅ 本项目已做到

- [x] **分层架构**:Route / Controller / Service / Repository 职责清晰
- [x] **依赖倒置**:Service 依赖 Repository 接口,而非实现
- [x] **配置外置**:环境变量 + `dotenv`,不硬编码
- [x] **强类型**:TypeScript strict 模式,共享类型定义
- [x] **统一响应格式**:`APIResponse` 约定,前端处理简单
- [x] **错误处理**:Controller 层 try/catch,异常不裸奔
- [x] **熔断雏形**:认证失败计数 + 重置窗口
- [x] **优雅降级**:非核心信息(空闲空间)失败不影响主请求
- [x] **单元测试**:核心逻辑有覆盖,Mock 隔离外部依赖
- [x] **容器化**:Dockerfile 可复现构建
- [x] **ESM 模块**:现代标准,`"type": "module"`

### 🔧 可进一步改进

- [ ] **输入校验**:用 [zod](https://zod.dev) 或 [valibot](https://valibot.dev) 在 Controller 层校验请求体,而非手动 `as` 断言
- [ ] **全局错误中间件**:用 `app.onError` 替代每个方法的 try/catch
- [ ] **结构化日志**:用 [pino](https://github.com/pinojs/pino) 替代 `console.log`,带 JSON 格式和日志级别
- [ ] **请求日志中间件**:记录每个请求的方法、路径、耗时、状态码
- [ ] **配置校验**:启动时用 zod 校验环境变量,缺关键字段直接 fail-fast
- [ ] **API 文档**:用 [@hono/zod-openapi](https://github.com/honojs/middleware) 自动生成 OpenAPI/Swagger
- [ ] **限流**:用 [hono/rate-limiter](https://hono.dev/docs/helpers/rate-limiter) 防止滥用
- [ ] **健康检查增强**:当前只返回静态 ok,可加 Transmission 连通性探测
- [ ] **优雅关闭**:捕获 SIGTERM,先停止接新请求、等存量请求完成再退出
- [ ] **CI/CD**:GitHub Actions 跑 `npm test` + `npm run build`,通过才允许合并
- [ ] **依赖安全**:`npm audit` / [Dependabot](https://docs.github.com/en/code-security) 定期检查漏洞

---

## 附录:快速运行

```bash
# 开发
cd backend
npm install
npm run dev          # http://localhost:3000

# 测试
npm test

# 生产构建
npm run build
npm start

# Docker
docker build -t newtransmissiontool-backend .
docker run -p 3000:3000 \
  -e TRANSMISSION_URL=http://your-nas:port/transmission/rpc \
  -e TRANSMISSION_USERNAME=xxx \
  -e TRANSMISSION_PASSWORD=xxx \
  newtransmissiontool-backend
```

---

## 学习路径建议

1. **先读懂分层**:看 `index.ts` → `routes/index.ts` → `torrentController.ts` → `transmission.ts` → `transmissionRepository.ts`,顺着依赖链走一遍
2. **跑测试**:`npm test`,改一改 mock 的返回值,看测试如何失败
3. **加一个新功能**:比如"根据 id 获取单个种子详情",按分层写一遍:
   - `types/index.ts` 加类型
   - `transmission.ts` 加 Service 方法
   - `torrentController.ts` 加 Controller 方法
   - `torrents.ts` 加路由
   - 写一个测试
4. **尝试改进**:挑一个"可进一步改进"项实践,比如给 `add` 接口加 zod 校验

> 🎯 **核心心法**:企业级代码不是"写得越多越好",而是"每一层各司其职、改动不扩散"。当你想加功能时,能清楚知道改哪一层、不影响其他层,就说明架构是对的。
