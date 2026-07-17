# useTransmissionDashboard Hook 文档

## 1. 作用概述

`useTransmissionDashboard` 是一个自定义 React Hook，用于封装 Transmission 仪表盘页面的全部业务逻辑。它负责：

- 从后端获取 torrent 列表和会话信息
- 管理加载状态、错误提示、成功提示
- 提供过滤、排序和统计计算
- 支持自动刷新和手动刷新
- 处理添加种子、启动/停止/删除种子、更新全局下载目录
- 管理“添加种子”和“设置”弹窗状态
- 管理快速下载路径并存储到 `localStorage`

## 2. 主要状态

Hook 内部定义了这些状态变量：

- `torrents`：当前种子列表
- `session`：Transmission 会话信息
- `stats`：会话统计数据
- `freeSpace`：可用磁盘空间
- `loading`：是否正在加载列表
- `errorMsg` / `successMsg`：操作提示信息
- `filterStatus`：状态过滤条件
- `filterCategory`：分类过滤条件
- `sortField` / `sortOrder`：排序字段与顺序
- `autoRefresh`：是否启用自动刷新
- `refreshInterval`：自动刷新间隔（毫秒）
- `showAddModal` / `showSettingsModal`：弹窗显示状态
- `quickPaths`：快速路径列表

## 3. 核心数据获取函数

- `fetchSessionInfo()`
  - 调用 `getSessionDetails()`
  - 更新 `session`、`stats`、`freeSpace`
  - 清空错误信息或显示异常

- `fetchTorrentList(showLoading = false)`
  - 调用 `getTorrents()`
  - 更新 `torrents`
  - 可选显示加载状态

- `refreshAll()`
  - 同时刷新会话和种子列表

## 4. 自动刷新逻辑

Hook 使用 `useEffect`：

- 首次挂载时执行 `refreshAll()`
- 按 `refreshInterval` 定时刷新
- 通过 `autoRefreshRef` 与 `refreshIntervalRef` 保存最新值，避免 stale closure 问题
- 卸载时清理定时器

## 5. 操作函数

- `handleSortChange(field)`
  - 切换排序字段
  - 如果重复选择同一字段则切换升序和降序

- `handleTorrentAction(id, action, deleteLocalData)`
  - 调用 `performTorrentAction()` 执行种子操作
  - 成功后刷新列表和会话信息

- `handleUpdateGlobalDir(dir)`
  - 调用 `updateSessionDirectory()` 更新全局下载目录
  - 隐藏设置弹窗并刷新会话信息

- `handleAddTorrent(payload)`
  - 调用 `addTorrent()` 添加新种子
  - 根据后端返回显示重复或添加成功提示
  - 关闭添加弹窗并刷新所有数据

- `handleAddQuickPath(path)` / `handleRemoveQuickPath(path)`
  - 管理快速路径列表
  - 并将其保存到 `localStorage`

## 6. 过滤与排序

Hook 会生成两个衍生值：

- `filteredTorrents`
  - 根据 `filterStatus` 过滤“下载中 / 做种 / 暂停 / 已完成”
  - 根据 `filterCategory` 按下载目录分类为 `series` / `movies` / `others`

- `sortedTorrents`
  - 基于当前 `sortField` 和 `sortOrder` 对过滤结果排序

## 7. 统计信息

Hook 还计算了一些仪表盘统计值：

- `totalDownloadSpeed`
- `totalUploadSpeed`
- `downloadingCount`
- `seedingCount`
- `pausedCount`

这些值可以直接用于页面统计展示。

## 8. 返回值

Hook 最终返回一个对象，包含：

- 数据状态：`torrents`、`session`、`stats`、`freeSpace`、`loading`、`errorMsg`、`successMsg`
- 过滤与排序状态：`filterStatus`、`filterCategory`、`sortField`、`sortOrder`、`autoRefresh`、`refreshInterval`
- 弹窗状态：`showAddModal`、`showSettingsModal`
- 快速路径：`quickPaths`
- 统计值：`totalDownloadSpeed`、`totalUploadSpeed`、`downloadingCount`、`seedingCount`、`pausedCount`
- 操作函数：`setAutoRefresh`、`setRefreshInterval`、`setShowAddModal`、`setShowSettingsModal`、`setFilterStatus`、`setFilterCategory`、`refreshAll`、`handleSortChange`、`handleTorrentAction`、`handleUpdateGlobalDir`、`handleAddTorrent`、`handleAddQuickPath`、`handleRemoveQuickPath`

## 9. 典型使用方式

```tsx
import { useTransmissionDashboard } from '../hooks/useTransmissionDashboard';

export function Dashboard() {
  const {
    torrents,
    loading,
    errorMsg,
    successMsg,
    autoRefresh,
    setAutoRefresh,
    refreshAll,
    handleTorrentAction,
  } = useTransmissionDashboard();

  return (
    <div>
      <button onClick={refreshAll}>刷新</button>
      <button onClick={() => setAutoRefresh(!autoRefresh)}>
        {autoRefresh ? '停止自动刷新' : '开启自动刷新'}
      </button>
      {loading && <p>加载中...</p>}
      {errorMsg && <p style={{ color: 'red' }}>{errorMsg}</p>}
      {successMsg && <p style={{ color: 'green' }}>{successMsg}</p>}
      <ul>
        {torrents.map((torrent) => (
          <li key={torrent.id}>
            {torrent.name}
            <button onClick={() => handleTorrentAction(torrent.id, 'start')}>
              开始
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
```

## 10. 为什么这是一个好例子

- 把复杂逻辑从组件中抽离出来
- 让组件只负责渲染和交互
- 方便复用、维护和测试
- 演示了自定义 Hook 的标准写法：以 `use` 开头、混合状态与副作用、返回值对象
