# Transmission Dashboard 项目文档

## 1. 项目概述

Transmission Dashboard 是一个使用 Hono 和 React 构建的全栈应用程序，用于管理 Transmission 下载任务。它提供了一个现代化的 Web 界面来监控和控制 Transmission BT 客户端。

## 2. 项目结构

```
.
├── backend/                 # 后端服务 (Hono + TypeScript)
│   ├── src/
│   │   ├── index.ts         # 后端入口文件
│   │   ├── routes/          # API 路由
│   │   ├── services/        # 业务逻辑 (Transmission API 客户端)
│   │   └── types/          # TypeScript 类型定义
│   └── ...
├── frontend/                # 前端界面 (React + TypeScript)
│   ├── src/
│   │   ├── App.tsx          # 主应用组件
│   │   ├── api.ts           # API 客户端
│   │   ├── components/       # React 组件
│   │   ├── hooks/           # 自定义 React Hooks
│   │   └── utils/          # 工具函数
│   └── ...
├── docker-compose.yml      # Docker 编排配置
└── ...
```

## 3. 后端 Hono API 文档

### 3.1 主要路由

#### 3.1.1 健康检查
- `GET /health` - 检查服务健康状态

#### 3.12.2 会话管理
- `GET /api/session` - 获取会话信息和统计
- `POST /api/session` - 更新下载目录

#### 3.1.3 种子管理
- `GET /api/torrents` - 获取种子列表
- `POST /api/torrents/add` - 添加种子
- `POST /api/torrents/:id/:action` - 控制种子操作 (start, stop, delete)

### 3.2 服务实现

后端使用 Hono 框架实现，通过 `transmission-client` 库与 Transmission RPC 接口通信。

## 4. 前端 React 组件文档

### 4.1 主要组件

#### 4.1.1 控制栏组件 (ControlBar.tsx)
提供添加种子、设置、刷新和过滤功能的控制面板。

#### 4.1.2 种子列表 (TorrentList.tsx)
显示种子列表，支持排序和过滤。

#### 4.1.3 种子行 (TorrentRow.tsx)
单个种子的显示组件，包含名称、进度、状态等信息。

#### 4.1.4 统计信息 (StatsFooter.tsx)
显示会话统计信息。

#### 4.1.5 添加种子模态框 (AddTorrentModal.tsx)
用于添加新种子的表单。

#### 4.1.6 设置模态框 (SettingsModal.tsx)
全局下载目录设置。

### 4.2 自定义 Hook

#### 4.2.1 useTransmissionDashboard
管理整个仪表板的状态，包括：
- 种子列表获取和刷新
- 会话信息管理
- 自动刷新功能
- 错误和成功消息处理

## 5. Docker 部署指南

### 5.1 后端 Docker 配置

```dockerfile:backend/Dockerfile
FROM node:20-alpine

WORKDIR /app/backend
COPY package*.json ./
RUN npm install

COPY src ./src
COPY tsconfig.json ./
COPY .env* ./

RUN npm run build

EXPOSE 3000
CMD ["npm", "start"]
```

### 5.2 前端 Docker 配置

```dockerfile:frontend/Dockerfile
# Multi-stage build
FROM node:20-alpine as builder

WORKDIR /app/frontend
COPY package*.json ./
RUN npm install

COPY tsconfig*.json ./
COPY index.html vite.config.ts ./
COPY src ./src
COPY public ./public

RUN npm run build

# Runtime stage
FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/frontend/dist /usr/share/nginx/html
```

### 5.3 Docker Compose 配置

```yml:docker-compose.yml
version: '3.8'
services:
  backend:
    build: ./backend
    environment:
      - PORT=3300
      - TRANSMISSION_URL=${TRANSMISSION_URL}
      - TRANSMISSION_USERNAME=${TRANSMISSION_USERNAME}
      - TRANSMISSION_PASSWORD=${TRANSMISSION_PASSWORD}
  frontend:
    build: ./frontend
    ports:
      - "80:80"
```

## 6. 配置说明

### 6.1 环境变量

- `TRANSMISSION_URL`: Transmission RPC 地址
- `TRANSMISSION_USERNAME`: 用户名
- `TRANSMISSION_PASSWORD`: 密码

## 7. 开发指南

### 7.1 后端开发

1. 安装依赖：
   ```bash
   cd backend
   npm install
   ```

2. 构建项目：
   ```bash
   npm run build
   ```

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

### 7.2 前端开发

1. 安装依赖：
   ```bash
   cd frontend
   npm install
   ```

2. 构建项目：
   ```bash
   npm run build
   ```

3. 运行开发服务器：
   ```bash
   npm run dev
   ```

## 8. 测试

### 8.1 后端测试

```ts:backend/src/__tests__/transmission.test.ts
import { testAddTorrent, testDeleteTorrent, testGetSession, testGetTorrents, testStartStop } from '../services/transmission';

// 测试 Transmission API 客户端功能
```

## 9. 部署

使用 Docker Compose 一键部署：
```bash
docker-compose up -d
```