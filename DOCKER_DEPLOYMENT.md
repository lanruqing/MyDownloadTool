# Docker 部署教程

## 前置要求

- Docker 已安装在 NAS 上
- Docker Compose 已安装
- Transmission RPC 服务正常运行

## 快速开始

### 1. 配置环境变量

在项目根目录创建 `.env` 文件（或复制 `.env.example`）：

```bash
# Transmission RPC 配置（根据你的 NAS 环境修改）
TRANSMISSION_URL=http://192.168.50.109:49092/transmission/rpc
TRANSMISSION_USERNAME=qnap
TRANSMISSION_PASSWORD=qnap

# 后端端口
PORT=3000
```

### 2. 构建 Docker 镜像

在项目根目录执行：

```bash
docker-compose build
```

这将构建两个镜像：
- `newttransmissiontool-backend:latest` - 后端服务
- `newtransmissiontool-frontend:latest` - 前端服务

### 3. 启动容器

```bash
docker-compose up -d
```

启动参数说明：
- `-d`: 后台运行

### 4. 验证服务状态

```bash
docker-compose ps
```

应该看到两个容器都在运行：
```
CONTAINER ID   IMAGE                              STATUS      PORTS
xxx            transmission-backend               Up          0.0.0.0:3000->3000/tcp
xxx            transmission-frontend              Up          0.0.0.0:80->80/tcp
```

### 5. 访问应用

打开浏览器访问：
```
http://nas-ip-address
```

例如：`http://192.168.50.109`

## 常用命令

### 查看日志

```bash
# 查看后端日志
docker logs transmission-backend

# 查看前端日志
docker logs transmission-frontend

# 实时监控日志
docker logs -f transmission-backend

# 查看最后 50 行日志
docker logs --tail 50 transmission-backend
```

### 停止服务

```bash
docker-compose stop
```

### 删除容器（保留镜像）

```bash
docker-compose down
```

### 完全清理（删除容器和镜像）

```bash
docker-compose down --rmi all
```

### 重启服务

```bash
docker-compose restart
```

### 重新构建并启动

```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 环境变量说明

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| TRANSMISSION_URL | http://192.168.50.109:49092/transmission/rpc | Transmission RPC 地址 |
| TRANSMISSION_USERNAME | qnap | Transmission 用户名 |
| TRANSMISSION_PASSWORD | qnap | Transmission 密码 |
| PORT | 3000 | 后端服务端口 |

## 网络配置

- **后端服务**：暴露端口 3000，可直接访问 `http://nas-ip:3000`
- **前端服务**：暴露端口 80 (HTTP)，nginx 作为反向代理
  - 静态资源服务于 `/`
  - API 请求代理到后端 `/api/` 路径
  - 支持 SPA 路由（所有未匹配路由重定向到 index.html）

## NAS 特定配置

### DSM 7.x 上的 Docker 应用

1. **打开 Docker 应用**
   - 进入 NAS 控制面板 → 应用程序 → Docker

2. **终端方式部署**
   - SSH 连接到 NAS
   - 进入项目目录
   - 执行上述命令

3. **Docker 桌面（如果可用）**
   - 拷贝整个项目到 NAS
   - 在 Docker 界面中打开 docker-compose.yml
   - 点击启动

### 持久化数据

容器配置为 `restart: unless-stopped`，即使 NAS 重启也会自动重启服务。

## 问题排查

### 1. 容器不能启动

**查看错误日志**：
```bash
docker logs transmission-backend
```

### 2. 连接 Transmission 失败 (403 错误)

**可能原因**：
- Transmission RPC 地址不对
- 凭据错误
- Transmission 守护进程未运行或被锁定

**解决方案**：
1. 验证环境变量中的 TRANSMISSION_URL、用户名和密码
2. 检查 NAS 上 Transmission 是否正常运行
3. 更新 `.env` 后需要重新启动容器：`docker-compose restart`

### 3. 前端无法连接后端

**原因**：nginx 配置中的后端地址需要正确

**检查**：
```bash
docker logs transmission-frontend
```

一般来说，docker-compose 会自动设置网络，`proxy_pass http://backend:3000` 应该正常工作。

### 4. 端口被占用

如果 80 或 3000 端口被占用，编辑 `docker-compose.yml` 修改端口映射：

```yaml
ports:
  - "8080:80"    # 前端改为 8080
  - "3001:3000"  # 后端改为 3001
```

然后更新 nginx.conf 中的后端地址（如果需要）。

## 生产环境建议

### 1. 使用 HTTPS

在 nginx.conf 中添加 SSL 证书配置，使用 Let's Encrypt 或自签证书。

### 2. 资源限制

在 `docker-compose.yml` 中添加资源限制：

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
        reservations:
          cpus: '0.25'
          memory: 256M
```

### 3. 日志管理

配置日志轮转（已在 docker-compose.yml 中设置）：
- 单个日志文件最大 10MB
- 保留最多 3 个日志文件

### 4. 备份策略

定期备份 `.env` 文件和相关配置。

## 与开发模式的区别

| 特性 | 开发环境 | Docker 环境 |
|-----|--------|-----------|
| 运行命令 | `npm run dev` | `docker-compose up` |
| 热重启 | 支持 | 不支持（需要重新构建） |
| Node 调试 | 支持 | 需要额外配置 |
| 代码修改 | 实时反映 | 需要重建镜像 |
| 性能 | 本地运行 | 容器隔离低开销 |

