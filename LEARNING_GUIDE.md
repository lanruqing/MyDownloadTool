# NewTransmissionTool 完整学习教程

**目录**
- [项目概述](#项目概述)
- [架构设计](#架构设计)
- [前端深入学习](#前端深入学习)
- [后端深入学习](#后端深入学习)
- [从零开始开发](#从零开始开发)
- [实战练习](#实战练习)

---

## 项目概述

### 这是什么？

NewTransmissionTool 是一个**全栈 Web 应用**，用于远程管理和监控 Transmission（一个 BT 下载器）。

- 前端：React + TypeScript + Vite
- 后端：Hono + TypeScript
- 连接：RESTful API

### 功能模块

1. **种子管理** - 列表、添加、开始、停止、删除种子
2. **会话管理** - 查看和修改全局下载目录
3. **统计信息** - 实时显示下载速度、上传速度、磁盘空间
4. **自动刷新** - 定时轮询数据，支持调整刷新间隔
5. **过滤和排序** - 按状态、分类过滤；按任意字段排序

---

## 架构设计

### 整体结构

```
frontend/                          后端 React 应用
├── src/
│   ├── components/               UI 组件
│   │   ├── AddTorrentModal.tsx   添加种子弹窗
│   │   ├── TorrentList.tsx       种子列表
│   │   ├── ControlBar.tsx        控制条（刷新、过滤）
│   │   └── ...其他组件
│   ├── hooks/
│   │   └── useTransmissionDashboard.ts  核心 Hook：状态管理 + 业务逻辑
│   ├── api.ts                    API 调用层
│   ├── types.ts                  类型定义
│   └── App.tsx                   主应用入口
└── ...

backend/                           后端 Node.js 应用
├── src/
│   ├── controllers/              控制器层（处理请求）
│   │   ├── torrentController.ts
│   │   ├── sessionController.ts
│   │   └── healthController.ts
│   ├── routes/                   路由层（注册 URL 映射）
│   │   ├── torrents.ts
│   │   ├── session.ts
│   │   └── health.ts
│   ├── services/                 业务逻辑层
│   │   └── transmission.ts
│   ├── repositories/             数据访问层（RPC 调用）
│   │   └── transmissionRepository.ts
│   ├── config/                   配置模块
│   ├── types/                    类型定义
│   └── index.ts                  应用入口
└── ...
```

### 数据流向

```
用户交互
   ↓
前端 Component
   ↓
useTransmissionDashboard Hook (状态管理)
   ↓
api.ts (构建 HTTP 请求)
   ↓
后端 routes/index.ts (路由匹配)
   ↓
controllers/* (请求处理 + 参数验证)
   ↓
services/transmission.ts (业务逻辑)
   ↓
repositories/transmissionRepository.ts (Transmission RPC 调用)
   ↓
Transmission 守护进程
   ↓
响应数据返回
   ↓
前端更新 UI
```

---

## 前端深入学习

### 1. 核心 Hook：useTransmissionDashboard

这是前端最重要的文件，集中了所有状态管理和业务逻辑。

#### 位置
`frontend/src/hooks/useTransmissionDashboard.ts`

#### 职责

- **状态管理** - 种子列表、会话信息、加载状态、错误信息等
- **数据获取** - 定时从后端拉取数据
- **业务逻辑** - 过滤、排序、分类等
- **用户操作处理** - 添加种子、启动/停止/删除种子

#### 关键状态

```typescript
// 数据
const [torrents, setTorrents] = useState<Torrent[]>([]);
const [session, setSession] = useState<SessionInfo | null>(null);
const [stats, setStats] = useState<SessionStats | null>(null);

// UI 状态
const [loading, setLoading] = useState<boolean>(true);
const [errorMsg, setErrorMsg] = useState<string | null>(null);
const [successMsg, setSuccessMsg] = useState<string | null>(null);

// 用户偏好
const [filterStatus, setFilterStatus] = useState<string>('all');
const [sortField, setSortField] = useState<keyof Torrent>('name');
const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
const [refreshInterval, setRefreshInterval] = useState<number>(3000);
```

#### 关键函数

**1. 数据获取**

```typescript
const fetchSessionInfo = async () => {
  try {
    const { session, stats, freeSpace } = await getSessionDetails();
    setSession(session);
    setStats(stats);
    setFreeSpace(freeSpace);
    setErrorMsg(null);
  } catch (error: unknown) {
    setErrorMsg((error as Error).message);
  }
};

const fetchTorrentList = async (showLoading = false) => {
  if (showLoading) setLoading(true);
  try {
    const data = await getTorrents();
    setTorrents(data);
    setErrorMsg(null);
  } catch (error: unknown) {
    setErrorMsg((error as Error).message);
  } finally {
    if (showLoading) setLoading(false);
  }
};
```

**2. 自动刷新逻辑**

```typescript
useEffect(() => {
  refreshAll(); // 初始加载

  const poll = async () => {
    if (!autoRefreshRef.current) return; // 停止轮询
    
    await Promise.all([fetchTorrentList(), fetchSessionInfo()]);
    timerRef.current = window.setTimeout(poll, refreshIntervalRef.current);
  };

  timerRef.current = window.setTimeout(poll, refreshIntervalRef.current);
  
  return () => {
    if (timerRef.current) clearTimeout(timerRef.current);
  };
}, []);
```

注意：使用 `useRef` 保存 `autoRefresh` 和 `refreshInterval`，避免 closure stale 问题。

**3. 过滤和排序**

```typescript
// 先过滤
const filteredTorrents = torrents.filter((torrent) => {
  // 按状态过滤
  let statusMatch = true;
  if (filterStatus === 'downloading') 
    statusMatch = torrent.status === 3 || torrent.status === 4;
  // ... 其他状态
  
  // 按分类过滤
  let categoryMatch = true;
  if (filterCategory !== 'all') {
    const category = getTorrentCategory(torrent.downloadDir);
    categoryMatch = category === filterCategory;
  }
  
  return statusMatch && categoryMatch;
});

// 再排序
const sortedTorrents = [...filteredTorrents].sort((a, b) => {
  let valA = a[sortField];
  let valB = b[sortField];
  
  if (typeof valA === 'string' && typeof valB === 'string') {
    return sortOrder === 'asc' 
      ? valA.localeCompare(valB) 
      : valB.localeCompare(valA);
  }
  
  const numA = typeof valA === 'number' ? valA : 0;
  const numB = typeof valB === 'number' ? valB : 0;
  return sortOrder === 'asc' ? numA - numB : numB - numA;
});
```

**4. 操作函数**

```typescript
// 添加种子
const handleAddTorrent = async (payload) => {
  try {
    const response = await addTorrent(payload);
    setSuccessMsg(response.isDuplicate 
      ? 'Torrent already exists' 
      : 'Torrent added successfully');
    setTimeout(() => setSuccessMsg(null), 4000);
    setShowAddModal(false);
    await refreshAll();
  } catch (error) {
    setErrorMsg((error as Error).message);
  }
};

// 开始/停止/删除种子
const handleTorrentAction = async (id: number, action, deleteLocalData = false) => {
  try {
    await performTorrentAction(id, action, deleteLocalData);
    setSuccessMsg('Action completed');
    await Promise.all([fetchTorrentList(), fetchSessionInfo()]);
  } catch (error) {
    setErrorMsg((error as Error).message);
  }
};
```

#### 学习要点

- **状态分离** - 数据状态、UI 状态、用户偏好要分开管理
- **useRef 用途** - 保存最新值，防止 closure 问题
- **异步流程** - 错误处理、loading 状态、成功提示
- **过滤排序** - 链式操作，先过滤后排序

---

### 2. API 层：frontend/src/api.ts

负责与后端通信。

```typescript
export async function addTorrent(payload: {
  file: File | null;
  url: string;
  downloadDir: string;
  paused: boolean;
}): Promise<ApiResponse> {
  const formData = new FormData();
  formData.append('downloadDir', payload.downloadDir);
  formData.append('paused', payload.paused.toString());

  if (payload.file) {
    formData.append('file', payload.file);
  } else {
    formData.append('url', payload.url);
  }

  const response = await fetch('/api/torrents', {
    method: 'POST',
    body: formData,  // 不要手动设置 Content-Type，浏览器会自动设置 multipart/form-data
  });

  return parseResponse(response);
}
```

#### 学习要点

- **FormData** - 用于发送文件和表单数据
- **不设置 Content-Type** - 让浏览器自动设置 boundary
- **错误处理** - 统一的 `parseResponse` 函数

---

### 3. 组件层

#### AddTorrentModal.tsx

```typescript
export const AddTorrentModal: React.FC<AddTorrentModalProps> = ({
  open,
  onClose,
  onSubmit,
  defaultDir,
  quickPaths,
}) => {
  const [torrentUrl, setTorrentUrl] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [customDownloadDir, setCustomDownloadDir] = useState<string>(defaultDir);
  const [addPaused, setAddPaused] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // 验证：必须有文件或 URL
    if (!selectedFile && !torrentUrl.trim()) {
      alert('请选择文件或粘贴链接');
      return;
    }
    
    // 调用父组件的 onSubmit
    onSubmit({
      file: selectedFile,
      url: torrentUrl.trim(),
      downloadDir: customDownloadDir.trim(),
      paused: addPaused,
    });
    
    // 重置表单
    setTorrentUrl('');
    setSelectedFile(null);
  };
  
  // 渲染...
};
```

#### 学习要点

- **受控组件** - `value` + `onChange`
- **隐藏文件输入** - 自定义按钮触发 `fileInputRef.current?.click()`
- **互斥选择** - 文件或 URL 只能选一个

---

### 4. 前端类型定义

```typescript
// frontend/src/types.ts

export interface Torrent {
  id: number;
  name: string;
  status: number;  // 0=paused, 3=downloading, 4=seeding, 5=checking, 6=queued
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  totalSize: number;
  downloadDir: string;
  isFinished: boolean;
  // ...
}

export interface SessionInfo {
  'download-dir': string;
  version: string;
}

export interface SessionStats {
  activeTorrentCount: number;
  downloadSpeed: number;
  uploadSpeed: number;
  pausedTorrentCount: number;
  torrentCount: number;
}
```

---

## 后端深入学习

### 1. 架构四层

#### 层次 1：路由层 (Router)

文件：`backend/src/routes/*.ts`

职责：将 HTTP 请求映射到控制器方法

```typescript
// routes/torrents.ts
import type { Hono } from 'hono';
import type { TorrentController } from '../controllers/torrentController.js';

export function registerTorrentRoutes(app: Hono, controller: TorrentController) {
  app.get('/api/torrents', (c) => controller.list(c));
  app.post('/api/torrents', (c) => controller.add(c));
  app.post('/api/torrents/:id/start', (c) => controller.start(c));
  app.post('/api/torrents/:id/stop', (c) => controller.stop(c));
  app.delete('/api/torrents/:id', (c) => controller.remove(c));
}
```

---

#### 层次 2：控制器层 (Controller)

文件：`backend/src/controllers/*.ts`

职责：处理请求、验证参数、调用业务逻辑、返回响应

```typescript
// controllers/torrentController.ts
export class TorrentController {
  constructor(private readonly service: TransmissionService) {}

  async list(c: Context) {
    try {
      const data = await this.service.getTorrents();
      return c.json<APIResponse>({ 
        success: true, 
        torrents: data.torrents 
      });
    } catch (error: unknown) {
      return c.json<APIResponse>({ 
        success: false, 
        error: (error as Error).message 
      }, 500);
    }
  }

  async add(c: Context) {
    try {
      // 1. 解析请求
      const body = await c.req.parseBody();
      const file = body['file'];
      const url = (body['url'] as string | undefined)?.trim();
      const downloadDir = (body['downloadDir'] as string | undefined)?.trim();
      const paused = body['paused'] === 'true';

      // 2. 构建参数对象
      const rpcArgs: TorrentAddArgs = { paused };
      if (downloadDir) rpcArgs['download-dir'] = downloadDir;

      // 3. 处理文件或 URL
      if (file && file instanceof File) {
        const buffer = await file.arrayBuffer();
        rpcArgs.metainfo = Buffer.from(buffer).toString('base64');
      } else if (url) {
        rpcArgs.filename = url;
      } else {
        return c.json<APIResponse>({
          success: false,
          error: 'Please provide either a file or URL',
        }, 400);
      }

      // 4. 调用 Service
      const data = await this.service.addTorrent(rpcArgs);
      
      // 5. 返回响应
      return c.json<APIResponse>({
        success: true,
        ...data,
        isDuplicate: Boolean(data['torrent-duplicate']),
      });
    } catch (error: unknown) {
      return c.json<APIResponse>({ 
        success: false, 
        error: (error as Error).message 
      }, 500);
    }
  }
}
```

#### 学习要点

- **异步处理** - 所有操作都用 `async/await`
- **错误处理** - 统一的 try/catch + 返回错误响应
- **参数解析** - 文件上传用 `parseBody()`，JSON 用 `req.json()`
- **响应格式** - 统一的 API 响应格式

---

#### 层次 3：业务逻辑层 (Service)

文件：`backend/src/services/transmission.ts`

职责：编写业务逻辑，不处理 HTTP 细节

```typescript
// services/transmission.ts
export class TransmissionService {
  constructor(private readonly repository: TransmissionRepository) {}

  async getTorrents(): Promise<TorrentGetResponse> {
    const fields = [
      'id', 'name', 'status', 'percentDone', 'rateDownload', 
      'rateUpload', 'totalSize', 'downloadDir', // ... 更多字段
    ];
    
    // 调用仓储层
    return this.repository.callRPC<TorrentGetResponse>('torrent-get', { fields });
  }

  async addTorrent(args: TorrentAddArgs): Promise<TorrentAddResponse> {
    // 可以添加业务逻辑，如验证、日志、缓存等
    return this.repository.callRPC<TorrentAddResponse>('torrent-add', args);
  }

  async startTorrent(id: number): Promise<void> {
    // 验证 ID
    if (!Number.isInteger(id) || id <= 0) {
      throw new Error('Invalid torrent ID');
    }
    return this.repository.callRPC('torrent-start', { ids: [id] });
  }
}
```

#### 学习要点

- **单一职责** - 只写业务逻辑，不处理 HTTP
- **可测试性** - Service 依赖注入 Repository，便于单元测试
- **可复用性** - 同一 Service 可被多个 Controller 调用

---

#### 层次 4：数据访问层 (Repository)

文件：`backend/src/repositories/transmissionRepository.ts`

职责：与外部系统（Transmission RPC）交互

```typescript
// repositories/transmissionRepository.ts
export class TransmissionRepositoryImpl implements TransmissionRepository {
  private sessionId = '';
  private failedAuthAttempts = 0;

  async callRPC<T = unknown>(
    method: string, 
    args: Record<string, unknown> = {}
  ): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // 1. 添加 Session-Id
    if (this.sessionId) {
      headers['X-Transmission-Session-Id'] = this.sessionId;
    }

    // 2. 添加认证
    if (this.config.transmissionUsername) {
      const creds = Buffer.from(
        `${this.config.transmissionUsername}:${this.config.transmissionPassword}`
      ).toString('base64');
      headers['Authorization'] = `Basic ${creds}`;
    }

    const makeRequest = async (): Promise<Response> => {
      return fetch(this.config.transmissionUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method, arguments: args }),
      });
    };

    let response = await makeRequest();

    // 3. 处理 409 Session-Id 协商
    if (response.status === 409) {
      const newSessionId = response.headers.get('X-Transmission-Session-Id');
      if (!newSessionId) {
        throw new Error('Missing Session-Id in 409 response');
      }
      this.sessionId = newSessionId;
      headers['X-Transmission-Session-Id'] = this.sessionId;
      response = await makeRequest();
    }

    // 4. 处理其他错误
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // 认证失败处理
        this.failedAuthAttempts++;
        throw new Error('Authentication failed');
      }
      const text = await response.text();
      throw new Error(`RPC error (${response.status}): ${text}`);
    }

    // 5. 解析响应
    const data = await response.json();
    if (data.result !== 'success') {
      throw new Error(`RPC error: ${data.result}`);
    }

    return data.arguments as T;
  }
}
```

#### 学习要点

- **Transmission RPC 协议**
  - 先发送请求，服务器返回 409 + Session-Id
  - 再用 Session-Id 重新发送请求
- **认证处理** - Basic Auth 编码
- **错误处理** - 区分不同的 HTTP 状态码
- **接口抽象** - 使用 `TransmissionRepository` 接口，便于更换实现

---

### 2. 依赖注入流程

应用入口文件：`backend/src/index.ts`

```typescript
const config = loadConfig();
const app = new Hono();

// 1. 创建 Repository（最底层）
const transmissionRepository = new TransmissionRepositoryImpl(config);

// 2. 创建 Service，注入 Repository
const transmissionService = new TransmissionService(transmissionRepository);

// 3. 创建 Controller，注入 Service
const torrentController = new TorrentController(transmissionService);

// 4. 注册路由
app.post('/api/torrents', (c) => torrentController.add(c));

// 5. 启动服务器
serve({ fetch: app.fetch, port: config.port });
```

这就是**依赖注入**的体现：
- Repository ← Service ← Controller ← Routes

---

### 3. 后端类型定义

```typescript
// backend/src/types/index.ts

export interface TorrentFields {
  id: number;
  name: string;
  status: number;
  percentDone: number;
  rateDownload: number;
  rateUpload: number;
  totalSize: number;
  leftUntilDone: number;
  eta: number;
  downloadDir: string;
  isFinished: boolean;
  // ... 更多字段
}

export interface TorrentGetResponse {
  torrents: TorrentFields[];
}

export interface TorrentAddArgs {
  paused?: boolean;
  'download-dir'?: string;
  metainfo?: string;  // base64 编码的 .torrent 文件
  filename?: string;  // magnet 链接或 torrent URL
}

export interface TorrentAddResponse {
  'torrent-added'?: { id: number; name: string; hashString: string };
  'torrent-duplicate'?: { id: number; name: string; hashString: string };
}

export interface APIResponse<T = unknown> {
  success: boolean;
  error?: string;
  [key: string]: unknown;
}
```

---

## 从零开始开发

### 开发环境配置

#### 1. 克隆或初始化项目

```bash
# 已有项目，直接进入
cd h:\my works\NewTransmissionTool
```

#### 2. 后端配置

```bash
cd backend

# 安装依赖
npm install

# 配置环境变量
# 创建 .env 文件（或设置环境变量）
TRANSMISSION_URL=http://192.168.50.109:49092/transmission/rpc
TRANSMISSION_USERNAME=qnap
TRANSMISSION_PASSWORD=qnap
PORT=3000

# 启动后端服务
npm run dev
# 输出：Hono backend starting on port 3000
```

#### 3. 前端配置

```bash
cd frontend

# 安装依赖
npm install

# 启动开发服务器
npm run dev
# 输出：VITE v... ready in ... ms
#      ➜  Local:   http://localhost:5173/
```

#### 4. 访问应用

打开浏览器，访问 `http://localhost:5173`

---

### 开发流程示例

**需求：** 添加一个"显示更多信息"的功能

#### 步骤 1：更新后端类型

```typescript
// backend/src/types/index.ts
export interface TorrentFields {
  // ... 已有字段
  tracker?: string;
  uploadedEver?: number;
  downloadedEver?: number;
}
```

#### 步骤 2：更新 Repository

```typescript
// repositories/transmissionRepository.ts
async getTorrents(): Promise<TorrentGetResponse> {
  const fields = [
    // ... 已有字段
    'tracker',
    'uploadedEver',
    'downloadedEver',
  ];
  return this.repository.callRPC('torrent-get', { fields });
}
```

#### 步骤 3：前端类型同步

```typescript
// frontend/src/types.ts
export interface Torrent {
  // ... 已有字段
  tracker?: string;
  uploadedEver?: number;
  downloadedEver?: number;
}
```

#### 步骤 4：更新 UI

```typescript
// frontend/src/components/TorrentRow.tsx
export const TorrentRow = ({ torrent }) => {
  return (
    <div>
      <h3>{torrent.name}</h3>
      <p>上传总量：{formatBytes(torrent.uploadedEver)}</p>
      <p>下载总量：{formatBytes(torrent.downloadedEver)}</p>
      <p>Tracker：{torrent.tracker}</p>
    </div>
  );
};
```

---

## 实战练习

### 练习 1：调试添加种子功能

**目标：** 确认添加种子是否成功

**步骤：**

1. 打开浏览器开发者工具（F12）
2. 切到 Network 标签
3. 点击"ADD TORRENT"按钮
4. 输入 magnet 链接或选择 .torrent 文件
5. 点击"START DOWNLOAD"
6. 在 Network 里查看 `POST /api/torrents` 请求
   - 检查 Request Headers
   - 检查 Request Body
   - 检查 Response Status（200 表示成功）
   - 检查 Response Body（应该包含 `"success": true`）

---

### 练习 2：添加日志

**目标：** 在后端添加日志，便于调试

```typescript
// controllers/torrentController.ts
async add(c: Context) {
  try {
    console.log('[ADD TORRENT] 请求开始');
    const body = await c.req.parseBody();
    
    const file = body['file'];
    const url = (body['url'] as string | undefined)?.trim();
    const downloadDir = (body['downloadDir'] as string | undefined)?.trim();
    
    console.log(`[ADD TORRENT] 参数：url=${url}, file=${file?.name}, dir=${downloadDir}`);
    
    const rpcArgs: TorrentAddArgs = { paused };
    if (file && file instanceof File) {
      const buffer = await file.arrayBuffer();
      rpcArgs.metainfo = Buffer.from(buffer).toString('base64');
      console.log(`[ADD TORRENT] 文件大小：${buffer.byteLength} 字节`);
    }
    
    console.log('[ADD TORRENT] 调用 Service...');
    const data = await this.service.addTorrent(rpcArgs);
    
    console.log('[ADD TORRENT] 添加成功', data);
    return c.json<APIResponse>({
      success: true,
      ...data,
      isDuplicate: Boolean(data['torrent-duplicate']),
    });
  } catch (error: unknown) {
    console.error('[ADD TORRENT] 错误', error);
    return c.json<APIResponse>({ 
      success: false, 
      error: (error as Error).message 
    }, 500);
  }
}
```

然后在后端终端查看日志输出。

---

### 常见错误 - Service 层中 `this.callRPC is not a function`

**症状：** 后端报错 `"this.callRPC is not a function"`

**原因：** Service 层重构为使用 Repository 模式后，所有 RPC 调用应该通过注入的 Repository 实例，而不是直接调用 `this.callRPC()`

**错误代码：**

```typescript
// ❌ 错误 - Service 中不存在 callRPC 方法
export class TransmissionService {
  constructor(private readonly config: AppConfig) {}

  async getTorrents(): Promise<TorrentGetResponse> {
    return this.callRPC<TorrentGetResponse>('torrent-get', { fields });
    //     ^^^^^^^^^^^^ 方法不存在！
  }
}
```

**正确代码：**

```typescript
// ✅ 正确 - 委托给 Repository
export class TransmissionService {
  constructor(private readonly repository: TransmissionRepository) {}

  async getTorrents(): Promise<TorrentGetResponse> {
    return this.repository.callRPC<TorrentGetResponse>('torrent-get', { fields });
    //     ^^^^^^^^^^^^^^^^^^^ 调用注入的实例
  }
}
```

**修复步骤：**

1. 检查 `backend/src/services/transmission.ts`
2. 找出所有 `this.callRPC` 调用
3. 改为 `this.repository.callRPC`
4. 确认 constructor 中有 `private readonly repository: TransmissionRepository` 参数

**学习要点：** 这是依赖注入模式的体现 - Service 不拥有 RPC 逻辑，而是依赖外部注入的 Repository 实例来完成工作。

---

### 练习 3：扩展功能 - 添加暂停所有按钮

**前端：**

```typescript
// hooks/useTransmissionDashboard.ts
const handlePauseAll = async () => {
  try {
    // 对所有活跃种子调用 stop
    for (const torrent of torrents) {
      if (torrent.status !== 0) { // 非暂停状态
        await performTorrentAction(torrent.id, 'stop');
      }
    }
    setSuccessMsg('All torrents paused');
    await refreshAll();
  } catch (error) {
    setErrorMsg((error as Error).message);
  }
};

// 返回中添加
return {
  // ... 其他
  handlePauseAll,
};
```

**UI：**

```typescript
// components/ControlBar.tsx
<wired-button onClick={onPauseAll}>
  PAUSE ALL
</wired-button>
```

---

### 练习 4：自定义过滤条件

在 `useTransmissionDashboard.ts` 中添加新的过滤维度：

```typescript
const [filterSize, setFilterSize] = useState<'all' | 'small' | 'large'>('all');

const filteredTorrents = torrents.filter((torrent) => {
  // ... 已有的状态和分类过滤

  // 新增：按大小过滤
  let sizeMatch = true;
  if (filterSize === 'small') {
    sizeMatch = torrent.totalSize < 1e9; // 小于 1GB
  } else if (filterSize === 'large') {
    sizeMatch = torrent.totalSize >= 1e9;
  }

  return statusMatch && categoryMatch && sizeMatch;
});
```

---

### 练习 5：添加单元测试（后端）

```typescript
// backend/src/__tests__/transmission.test.ts
import { describe, it, expect, vi } from 'vitest';
import { TransmissionService } from '../services/transmission.js';
import type { TransmissionRepository } from '../repositories/transmissionRepository.js';

describe('TransmissionService', () => {
  it('should get torrents from repository', async () => {
    // Mock Repository
    const mockRepository: TransmissionRepository = {
      callRPC: vi.fn().mockResolvedValue({
        torrents: [
          { id: 1, name: 'test.torrent', status: 3, totalSize: 1e9 },
        ],
      }),
    };

    const service = new TransmissionService(mockRepository);
    const result = await service.getTorrents();

    expect(result.torrents).toHaveLength(1);
    expect(result.torrents[0].name).toBe('test.torrent');
  });
});
```

运行测试：

```bash
npm run test
```

---

## 总结

### 前端关键概念

1. **自定义 Hook** - `useTransmissionDashboard` 集中管理所有状态和逻辑
2. **状态管理** - 区分数据状态、UI 状态、用户偏好
3. **异步操作** - async/await + 错误处理
4. **过滤排序** - 函数式编程风格

### 后端关键概念

1. **四层架构** - Router → Controller → Service → Repository
2. **依赖注入** - 逆向控制，便于测试和维护
3. **错误处理** - 统一的响应格式和错误处理
4. **协议理解** - Transmission RPC 的 Session-Id 协商

### 最佳实践

- **前端** - 使用 Hook 管理复杂逻辑，组件只负责渲染
- **后端** - 使用分层架构，每层职责单一
- **通信** - 定义清晰的 API 协议，类型定义保持同步
- **测试** - 单元测试、集成测试相结合

---

**祝学习愉快！** 🚀
