# Docker 端口配置指南

## 当前配置（推荐）

```yaml
# docker-compose.yml
frontend:
  ports:
    - "80:80"      # 外部访问: http://nas-ip

backend:
  # 不暴露端口（仅容器内通信）
```

**特点**：
- 用户访问：`http://nas-ip` （无需端口号）
- 后端 API：仅在 Docker 网络内部访问（更安全）
- 前端 nginx 通过 Docker 网络代理到后端：`http://backend:3000`

---

## 其他配置选项

### 选项 1：暴露后端测试调试端口

适用于需要直接访问后端 API 的开发场景。

编辑 `docker-compose.yml`：

```yaml
backend:
  ports:
    - "3000:3000"   # 添加这行
  environment:
    - PORT=3000
```

然后可以：
- 访问前端：`http://nas-ip`
- 直接调用 API：`http://nas-ip:3000/api/health`
- 调试：`http://nas-ip:3000/api/torrents`

### 选项 2：前端使用非标准端口

适用于 NAS 上 80 端口已被占用的情况。

编辑 `docker-compose.yml`：

```yaml
frontend:
  ports:
    - "8080:80"    # 改为 8080（或其他端口）
```

访问方式改为：`http://nas-ip:8080`

### 选项 3：两个服务都使用自定义端口

```yaml
frontend:
  ports:
    - "8080:80"    # 前端: 8080

backend:
  ports:
    - "8081:3000"  # 后端: 8081
```

访问方式：
- 前端：`http://nas-ip:8080`
- 后端 API：`http://nas-ip:8081/api/...`

---

## 🔒 安全性考虑

| 配置方案 | 安全性 | 灵活性 | 推荐场景 |
|---------|--------|--------|---------|
| 仅暴露前端（当前） | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ **生产环境 / 家用 NAS** |
| 前端 + 后端都暴露 | ⭐⭐ | ⭐⭐⭐⭐ | 开发和测试 |
| 非标准端口 | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | NAS 多应用共存 |

---

## 如何修改配置

### 步骤 1：编辑 docker-compose.yml

```bash
# Windows
notepad docker-compose.yml

# NAS (Linux)
vi docker-compose.yml
nano docker-compose.yml
```

### 步骤 2：修改 ports 部分

当前默认配置（仅前端暴露）：
```yaml
services:
  backend:
    # ❌ 无 ports 部分（仅容器内访问）
    
  frontend:
    ports:
      - "80:80"
```

如果要暴露后端，改为：
```yaml
services:
  backend:
    ports:
      - "3000:3000"  # ✅ 添加这行
    
  frontend:
    ports:
      - "80:80"
```

### 步骤 3：重新部署

```bash
# 停止旧容器
docker-compose down

# 重新构建并启动
docker-compose build
docker-compose up -d

# 验证
docker-compose ps
```

---

## 端口冲突排查

### 查看占用的端口

**Windows**：
```powershell
netstat -ano | findstr :80
netstat -ano | findstr :3000
```

**NAS (Linux)**：
```bash
netstat -tulpn | grep :80
netstat -tulpn | grep :3000

# 或使用 ss
ss -tulpn | grep :80
```

### 解决端口被占用

1. 停止占用端口的服务
2. 或在 `docker-compose.yml` 中改为其他端口
3. 重启 Docker 服务

---

## nginx 反向代理工作原理

前端 nginx 的配置文件 `frontend/nginx.conf` 已设置：

```nginx
location /api/ {
    proxy_pass http://backend:3000;  # 代理到后端容器
    proxy_set_header Host $host;
    # ... 其他代理配置
}
```

**含义**：
- 用户请求 `/api/torrents` → nginx 转发到 `http://backend:3000/api/torrents`
- `backend` 是 Docker DNS 名称，自动解析为后端容器 IP
- 这个通信完全在 Docker 内部网络，不经过外网

因此：
- ✅ 无需暴露后端端口到外网
- ✅ 更安全（后端无法从外部直接访问）
- ✅ 简化部署（只需暴露前端）

---

## 常见问题

### Q: 为什么前端能访问后端如果没有暴露 3000 端口？
A: 因为两个容器在同一 Docker 网络（`transmission-network`）上。Docker 内部 DNS 可以通过容器名解析网络地址，所以 nginx 可以访问 `http://backend:3000`，但外部不能。

### Q: 可以从手机访问吗？
A: 可以，访问 NAS 的 IP 地址即可：
- `http://192.168.50.109`
- 或者 DNS 名称（如果 NAS 有）：`http://nas.local`

### Q: 暴露 3000 端口有什么风险？
A: 
- 后端 API 直接暴露到网络
- 可能被扫描或攻击
- 不必要的安全漏洞

### Q: 生产环境推荐？
A: 使用当前配置（仅暴露前端），加上：
- HTTPS/SSL 证书
- 反向代理（Nginx/Traefik）
- 防火墙限制访问
- 定期更新镜像

---

## 快速命令参考

```bash
# 查看当前暴露的端口
docker-compose ps

# 查看 Docker 网络信息
docker network inspect transmission-network

# 测试容器间通信
docker exec transmission-frontend curl http://backend:3000/api/health

# 查看 nginx 配置
docker exec transmission-frontend cat /etc/nginx/nginx.conf
```

