# Docker 架构与网络说明

## 系统架构

```
┌─────────────────────────────────────────────────────────────┐
│                        Docker Compose                       │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────┐              ┌────────────────────┐  │
│  │   Frontend       │              │   Backend          │  │
│  │  (nginx + SPA)   │◄────────────►│  (Hono + Node.js)  │  │
│  │                  │              │                    │  │
│  │  Port: 80        │              │  Port: 3000        │  │
│  │  - React App     │  /api/  →    │  - API Routes      │  │
│  │  - nginx proxy ◄─┼──────────────┤  - Transmission    │  │
│  │  - SPA routing   │    proxy     │    RPC Client      │  │
│  └──────────────────┘              └────────────────────┘  │
│                                            ▲                 │
│                                            │                 │
│                    Transmission RPC        │                 │
│                (via env vars)              │                 │
│                                            ▼                 │
│                                    NAS Transmission Daemon   │
│                                  (192.168.50.109:49092)      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## 网络流程

### 用户访问

```
用户浏览器 → http://nas-ip → 
  nginx (Port 80) → 
    静态资源 /ui/*, /assets/* → index.html (SPA)
    API 请求 /api/* → http://backend:3000
```

### 容器间通信

```
Frontend (nginx)
  ├─ 监听: 0.0.0.0:80
  ├─ 内部: transmission-network (Docker bridge)
  └─ 访问后端: http://backend:3000

Backend (Node.js)
  ├─ 监听: 0.0.0.0:3000  
  ├─ 内部: transmission-network (Docker bridge)
  └─ 访问 Transmission: env.TRANSMISSION_URL
```

## Docker Compose 配置说明

| 组件 | 角色 | 技术栈 | 端口映射 |
|------|------|--------|---------|
| frontend | Web 服务器 + API 代理 | nginx:alpine | 80:80 |
| backend | API 服务器 | Node.js 20 + Hono | 3000:3000 |

## 构建过程

### Frontend 多阶段构建

```
Stage 1: Builder (node:20-alpine)
  ├─ npm install
  ├─ npm run build (tsc + vite build)
  └─ 输出: dist/*

Stage 2: Runtime (nginx:alpine)
  ├─ 复制 dist/* → /usr/share/nginx/html
  ├─ 加载 nginx.conf 配置
  └─ 启动 nginx 服务
```

### Backend 单阶段构建

```
Stage: Runtime (node:20-alpine)
  ├─ npm install --omit=dev (仅生产依赖)
  ├─ npm run build (tsc)
  ├─ 复制 dist/* 和 .env
  └─ npm start (node dist/index.js)
```

## 环境变量流动

```
.env (项目根目录)
  ↓
docker-compose.yml (environment 部分)
  ↓
backend 容器内部 (env vars 可见)
  ↓
Node.js 进程 (dotenv 加载)
  ↓
TransmissionService (使用配置)
```

## API 调用链路

```
1. 前端发送请求
   fetch('/api/torrents')
   
2. nginx 拦截 /api/*
   location /api/
   
3. nginx 转发到后端
   proxy_pass http://backend:3000/api/torrents
   
4. 后端处理请求
   app.get('/api/torrents')
   → TransmissionService.getTorrents()
   
5. 转换响应
   { torrents: [...], success: true }
   
6. nginx 转发响应回前端
   
7. 前端解析并更新 UI
```

## 存储和日志

### 日志配置

```yaml
logging:
  driver: "json-file"
  options:
    max-size: "10m"      # 单文件最大 10MB
    max-file: "3"        # 保留 3 个历史文件
```

### 查看日志

```bash
# 实时日志
docker logs -f transmission-backend
docker logs -f transmission-frontend

# 历史日志位置
/var/lib/docker/containers/<container-id>/
```

## 容器生命周期

### 启动顺序

```
docker-compose up -d
  ├─ 创建 transmission-network (bridge)
  ├─ 启动 backend 容器
  │   ├─ 加载环境变量
  │   ├─ 启动 Node.js
  │   └─ 监听 0.0.0.0:3000
  │
  └─ 启动 frontend 容器 (depends_on: backend)
      ├─ nginx 启动
      ├─ 加载 nginx.conf
      └─ 监听 0.0.0.0:80 → 代理到 backend:3000
```

### 重启策略

```yaml
restart: unless-stopped
```

含义：
- 正常停止 (docker stop) → 不自动重启
- 异常崩溃 → 自动重启
- NAS 重启 → Docker 守护进程启动时自动重启

## 网络隔离

```
+---------+         Network         +---------+
| backend |◄────────────────────►  |frontend |
+---------+    transmission-network +---------+
    ▲                                    ▲
    │ 可以访问                          │ 可以访问
    │ ├─ env TRANSMISSION_URL           ├─ backend:3000
    │ └─ 外部网络 (NAS)                 └─ 外部网络 (用户)
    │
  Port 3000 (容器内)                Port 80 (容器内)
    │                                  │
    └─ 0.0.0.0:3000◄────────────────►  └─ 0.0.0.0:80
       (主机上)                           (主机上)
```

## 持久数据

当前配置**无持久数据卷**。容器重启后：
- 配置：重新加载 .env 文件 ✓
- 应用代码：重新使用 docker 镜像中的代码 ✓
- 日志：保留（日志方案已配置）✓

> 注意：Transmission 数据存储在 Transmission 守护进程本身（NAS），不在此容器中。

## 故障排查

### 后端无法启动

```bash
# 检查日志
docker logs transmission-backend

# 常见原因：
# 1. 端口 3000 被占用
# 2. 环境变量缺失
# 3. Transmission 服务不可达
```

### 前端无法连接后端

```bash
# 检查 nginx 日志
docker logs transmission-frontend

# 验证网络连接
docker exec transmission-frontend ping backend

# 检查 nginx 配置
docker exec transmission-frontend nginx -t
```

### 手动测试 API

```bash
# 在后端容器中测试
docker exec transmission-backend curl http://localhost:3000/api/health

# 在前端容器中测试
docker exec transmission-frontend curl http://backend:3000/api/health
```

