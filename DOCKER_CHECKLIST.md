# Docker 部署检查清单

## 📋 部署前检查

### 环境要求

- [ ] Docker 已安装 (`docker --version`)
- [ ] Docker Compose 已安装 (`docker-compose --version`)
- [ ] 项目 Node.js 依赖已安装 (`npm install && npm install --prefix backend && npm install --prefix frontend`)
- [ ] `.env` 文件已配置并放在项目根目录

### 配置检查

- [ ] `.env` 中 TRANSMISSION_URL 正确指向 NAS Transmission RPC
- [ ] TRANSMISSION_USERNAME 和 TRANSMISSION_PASSWORD 正确
- [ ] PORT 设置为 3000（或你要使用的后端端口）

### 代码检查

- [ ] 后端代码已构建通过 (`npm run build --prefix backend`)
- [ ] 前端代码已构建通过 (`npm run build --prefix frontend`)
- [ ] 无 TypeScript 编译错误
- [ ] 无 linting 错误

---

## 🚀 部署步骤

### 第一次部署

#### Windows 用户

```powershell
# 1. 进入项目目录
cd path\to\NewTransmissionTool

# 2. 复制环境配置
copy .env.example .env

# 3. 编辑 .env（打开文件修改 Transmission 参数）
notepad .env

# 4. 构建镜像
deploy.bat build

# 5. 启动服务
deploy.bat up

# 6. 检查状态
deploy.bat status

# 7. 查看日志
deploy.bat logs
```

#### Linux/Mac 用户

```bash
# 1. 进入项目目录
cd path/to/NewTransmissionTool

# 2. 复制环境配置
cp .env.example .env

# 3. 编辑 .env
nano .env  # 或 vi .env

# 4. 添加执行权限
chmod +x deploy.sh

# 5. 构建镜像
./deploy.sh build

# 6. 启动服务
./deploy.sh up

# 7. 检查状态
./deploy.sh status

# 8. 查看日志
./deploy.sh logs
```

### 部署验证

- [ ] `docker-compose ps` 显示两个容器都在运行
- [ ] 后端容器正常启动（无错误日志）
- [ ] 前端容器正常启动（nginx 运行）
- [ ] 可以通过 `http://localhost` 或 `http://nas-ip` 访问前端
- [ ] 可以接收 Transmission 数据（torrents 列表已加载）

---

## 📊 后续操作

### 日常管理

| 操作 | 命令 |
|------|------|
| 查看运行状态 | `deploy.bat status` 或 `./deploy.sh status` |
| 查看日志 | `deploy.bat logs` 或 `./deploy.sh logs` |
| 停止服务 | `deploy.bat down` 或 `./deploy.sh down` |
| 重启服务 | `deploy.bat restart` 或 `./deploy.sh restart` |

### 代码更新后重新部署

```bash
# 1. 修改代码
# 2. 重新构建镜像
deploy.bat build  # Windows
./deploy.sh build # Linux/Mac

# 3. 重启容器
deploy.bat restart  # Windows
./deploy.sh restart # Linux/Mac
```

### 更新环境变量后重新部署

```bash
# 1. 编辑 .env
# 2. 重启后端容器
docker restart transmission-backend
```

---

## 🐛 问题排查

### 容器无法启动

```bash
# 查看详细错误
docker logs transmission-backend
docker logs transmission-frontend

# 检查 Docker 是否正常运行
docker ps
```

### 无法连接 Transmission

```
错误信息: "Failed to connect to Transmission RPC"

解决步骤:
1. 验证 TRANSMISSION_URL 是否正确
2. 在 NAS 上检查 Transmission 服务是否运行
3. 检查防火墙是否阻止了连接
4. 尝试从命令行 ping Transmission 地址
   docker exec transmission-backend curl http://192.168.50.109:49092/transmission/rpc
```

### 前端无法加载

```
症状: 浏览器显示 404 或空白页

解决步骤:
1. 检查 nginx 是否运行: docker logs transmission-frontend
2. 检查前端是否正确构建: docker exec transmission-frontend ls -la /usr/share/nginx/html
3. 检查 nginx.conf 配置: docker exec transmission-frontend nginx -t
```

### 前后端无法通信

```
症状: 浏览器控制台显示 API 错误

解决步骤:
1. 验证容器在同一网络: docker network inspect transmission-network
2. 测试连接: docker exec transmission-frontend curl http://backend:3000/api/health
3. 检查 nginx 代理配置
4. 检查后端 CORS 配置
```

---

## 📁 文件结构

```
NewTransmissionTool/
├── docker-compose.yml           ← 关键：编排配置
├── .dockerignore                ← Docker 构建优化
├── .env.example                 ← 环境变量模板
├── .env                          ← 实际环境变量（需要手动创建）
├── deploy.bat                   ← Windows 辅助脚本
├── deploy.sh                    ← Linux/Mac 辅助脚本
│
├── backend/
│   ├── Dockerfile               ← 后端容器配置
│   ├── package.json
│   ├── tsconfig.json
│   └── src/
│
├── frontend/
│   ├── Dockerfile               ← 前端容器配置
│   ├── nginx.conf               ← nginx 配置（关键！）
│   ├── package.json
│   ├── vite.config.ts
│   └── src/
│
├── DOCKER_DEPLOYMENT.md         ← 详细部署文档
├── DOCKER_QUICKSTART.md         ← 快速启动指南
└── DOCKER_ARCHITECTURE.md       ← 架构说明
```

---

## 🔒 安全建议（生产环境）

- [ ] 更改 Transmission 默认密码
- [ ] 启用 HTTPS（配置 SSL 证书）
- [ ] 限制容器资源使用
- [ ] 定期更新基础镜像（node:20-alpine, nginx:alpine）
- [ ] 配置日志收集和监控
- [ ] 备份 `.env` 文件

---

## 📞 常见问题 (FAQ)

**Q: Docker 构建需要多长时间？**
A: 第一次构建 3-5 分钟（取决于网络），后续构建 1-2 分钟（使用缓存）。

**Q: 如何在 NAS 上持久运行？**
A: 配置 `restart: unless-stopped`，NAS 重启后 Docker 会自动启动容器。

**Q: 容器日志会占用多少空间？**
A: 配置了日志轮转，单个日志文件最大 10MB，保留 3 个文件，最多 30MB。

**Q: 如何更新代码？**
A: 修改代码后 → 重新构建镜像 (`docker-compose build`) → 重启容器 (`docker-compose restart`)。

**Q: 能否在多个 NAS 上运行？**
A: 可以，只需在每个 NAS 上独立部署。每个部署是独立的 Docker 实例。

**Q: 如何备份数据？**
A: 当前架构无持久数据存储在容器中。Transmission 数据存在 NAS 上，配置存在 `.env` 文件中。

---

## 📚 更多资源

- [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md) - 详细部署指南
- [DOCKER_QUICKSTART.md](./DOCKER_QUICKSTART.md) - 5 分钟快速开始
- [DOCKER_ARCHITECTURE.md](./DOCKER_ARCHITECTURE.md) - 系统架构说明
- [README.md](./README.md) - 项目总览

