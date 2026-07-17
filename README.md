# NewTransmissionTool

Transmission Dashboard with Hono backend and React frontend.

## 项目结构

- `backend/` - Hono 后端服务
- `frontend/` - Vite + React 前端应用

## 快速启动

### 1. 安装依赖

```bash
npm install
npm install --prefix backend
npm install --prefix frontend
```

### 2. 开发模式

```bash
npm run dev
```

这会同时启动前端和后端：
- 后端：`npm run dev --prefix backend`
- 前端：`npm run dev --prefix frontend`

如果你收到类似 `EADDRINUSE: address already in use :::3000` 的错误，说明后端默认端口 `3000` 已被占用。
你可以使用专门的替代开发脚本，在端口 `3001` 启动前后端：

```bash
npm run dev:alt
```

你也可以手动设置 `PORT` 和 `BACKEND_PORT` 环境变量：

- macOS / Linux:
  ```bash
  PORT=3001 BACKEND_PORT=3001 npm run dev
  ```

- Windows PowerShell:
  ```powershell
  $env:PORT=3001; $env:BACKEND_PORT=3001; npm run dev
  ```

### 3. 单独启动

- 启动后端：
  ```bash
  npm run dev --prefix backend
  ```

- 启动前端：
  ```bash
  npm run dev --prefix frontend
  ```

## 构建

- 构建后端：
  ```bash
  npm run build --prefix backend
  ```

- 构建前端：
  ```bash
  npm run build --prefix frontend
  ```

- 构建整个项目：
  ```bash
  npm run build:all
  ```

## Docker 部署

使用 Docker 将应用部署到 NAS 或其他服务器。

### 快速启动

```bash
# 1. 配置环境变量
cp .env.example .env
# 编辑 .env，配置 Transmission 参数

# 2. 构建镜像
docker-compose build

# 3. 启动服务
docker-compose up -d

# 4. 访问应用
# 浏览器打开：http://localhost
```

### 使用辅助脚本

**Windows**：
```cmd
deploy.bat build
deploy.bat up
```

**Linux/Mac**：
```bash
chmod +x deploy.sh
./deploy.sh build
./deploy.sh up
```

更多 Docker 部署信息，参考：
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - 5 分钟快速指南
- [DOCKER_PORT_GUIDE.md](./DOCKER_PORT_GUIDE.md) - 端口配置指南
- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - 详细部署文档

## 环境变量

后端可通过 `.env` 文件配置：

```env
PORT=3000
TRANSMISSION_URL=http://your-transmission-host:9091/transmission/rpc
TRANSMISSION_USERNAME=your-username
TRANSMISSION_PASSWORD=your-password
```

## 测试

- 后端测试：
  ```bash
  npm test --prefix backend
  ```

- 前端测试：
  ```bash
  npm test --prefix frontend
  ```

## 备注

- 前端 dev-server 默认代理 `/api` 到后端 `http://localhost:3000`
- 当前后端使用 `Hono`，前端使用 `React + Vite`
- `frontend/README.md` 中可能已有前端相关内容，可根据需要补充
