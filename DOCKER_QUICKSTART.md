# Docker 快速启动指南

## 5 分钟快速上手

### 1. 准备 .env 文件

复制 `.env.example` 为 `.env`，并修改配置：

```bash
cp .env.example .env
```

编辑 `.env`，确保 Transmission 参数正确：

```
TRANSMISSION_URL=http://192.168.50.109:49092/transmission/rpc
TRANSMISSION_USERNAME=qnap
TRANSMISSION_PASSWORD=qnap
```

### 2. 构建与启动

**Windows 用户**：
```cmd
deploy.bat build
deploy.bat up
```

**Linux/Mac 用户**：
```bash
chmod +x deploy.sh
./deploy.sh build
./deploy.sh up
```

**或直接使用 docker-compose**：
```bash
docker-compose build
docker-compose up -d
```

### 3. 打开应用

浏览器访问：
```
http://localhost      （本地）
http://nas-ip         （NAS 上）
```

## 常见场景

### 场景 1：查看日志排查问题

```bash
# Windows
deploy.bat logs

# Linux/Mac
./deploy.sh logs
```

### 场景 2：修改代码后重新部署

```bash
# 1. 修改代码
# 2. 重新构建
deploy.bat build

# 3. 重启服务
deploy.bat restart
```

### 场景 3：停止服务

```bash
# Windows
deploy.bat down

# Linux/Mac
./deploy.sh down
```

### 场景 4：完全清理（删除旧镜像）

```bash
# Windows
deploy.bat clean

# Linux/Mac
./deploy.sh clean
```

## 验证安装

启动后，运行以下命令检查：

```bash
docker-compose ps
```

输出示例：
```
NAME                           IMAGE                              STATUS
transmission-backend          newttransmissiontool-backend       Up 2 minutes
transmission-frontend         newtransmissiontool-frontend       Up 2 minutes (healthy)
```

## 端口说明

- **前端**：80 (HTTP) - 直接访问 `http://nas-ip`
- **后端**：3000 (仅容器内部通信) - 通过 nginx 反向代理访问
  - 用户不需要直接访问 3000 端口
  - nginx 自动转发 `/api/*` 请求到后端

需要自定义端口？详见：[DOCKER_PORT_GUIDE.md](./DOCKER_PORT_GUIDE.md)

## 更多信息

详细文档请参考：
- [DOCKER_PORT_GUIDE.md](./DOCKER_PORT_GUIDE.md) - 端口配置指南（如需自定义端口）
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - 详细部署文档
- [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md) - 系统架构说明

