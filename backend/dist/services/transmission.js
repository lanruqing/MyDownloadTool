/** Transmission RPC 服务 - 封装与 Transmission 守护进程的通信 */
export class TransmissionService {
    config;
    sessionId = '';
    failedAuthAttempts = 0;
    lastAuthFailureTime = 0;
    MAX_AUTH_FAILURES = 3;
    AUTH_FAILURE_RESET_MS = 60000; // 1 分钟后重置计数
    constructor(config) {
        this.config = config;
    }
    /**
     * 调用 Transmission RPC 方法
     */
    async callRPC(method, args = {}) {
        const headers = {
            'Content-Type': 'application/json',
        };
        if (this.sessionId) {
            headers['X-Transmission-Session-Id'] = this.sessionId;
        }
        if (this.config.transmissionUsername || this.config.transmissionPassword) {
            const creds = Buffer.from(`${this.config.transmissionUsername}:${this.config.transmissionPassword}`).toString('base64');
            headers['Authorization'] = `Basic ${creds}`;
        }
        const makeRequest = async () => {
            return await fetch(this.config.transmissionUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ method, arguments: args }),
            });
        };
        let response = await makeRequest();
        // 处理 Session-Id 协商
        if (response.status === 409) {
            const newSessionId = response.headers.get('X-Transmission-Session-Id');
            if (newSessionId) {
                this.sessionId = newSessionId;
                headers['X-Transmission-Session-Id'] = this.sessionId;
                response = await makeRequest();
            }
            else {
                throw new Error('Transmission RPC 409 response was missing X-Transmission-Session-Id header');
            }
        }
        if (!response.ok) {
            // 处理认证失败 (401/403)
            if (response.status === 401 || response.status === 403) {
                const now = Date.now();
                // 如果超过重置时间，清除失败计数
                if (now - this.lastAuthFailureTime > this.AUTH_FAILURE_RESET_MS) {
                    this.failedAuthAttempts = 0;
                }
                this.failedAuthAttempts++;
                this.lastAuthFailureTime = now;
                if (this.failedAuthAttempts >= this.MAX_AUTH_FAILURES) {
                    throw new Error(`[认证失败] 已连续失败 ${this.MAX_AUTH_FAILURES} 次，请检查：\n` +
                        `1. TRANSMISSION_USERNAME 和 TRANSMISSION_PASSWORD 是否正确\n` +
                        `2. Transmission 守护进程是否正常运行\n` +
                        `3. 如果已重启 Transmission，请重启后端服务以清除计数`);
                }
                throw new Error(`[认证失败 ${response.status}] 第 ${this.failedAuthAttempts}/${this.MAX_AUTH_FAILURES} 次失败\n` +
                    `请检查用户名/密码或重启 Transmission 守护进程`);
            }
            const text = await response.text();
            throw new Error(`Transmission RPC error (${response.status}): ${text}`);
        }
        const data = await response.json();
        if (data.result !== 'success') {
            throw new Error(`Transmission RPC error: ${data.result}`);
        }
        return data.arguments;
    }
    /** 获取种子列表 */
    async getTorrents() {
        const fields = [
            'id', 'name', 'status', 'percentDone', 'rateDownload', 'rateUpload',
            'totalSize', 'leftUntilDone', 'eta', 'downloadDir', 'error', 'errorString',
            'addedDate', 'doneDate', 'peersGettingFromUs', 'peersSendingToUs',
            'isFinished', 'queuePosition', 'metadataPercentComplete',
        ];
        return this.callRPC('torrent-get', { fields });
    }
    /** 添加种子 */
    async addTorrent(args) {
        return this.callRPC('torrent-add', args);
    }
    /** 启动种子 */
    async startTorrent(id) {
        await this.callRPC('torrent-start', { ids: [id] });
    }
    /** 停止种子 */
    async stopTorrent(id) {
        await this.callRPC('torrent-stop', { ids: [id] });
    }
    /** 删除种子 */
    async removeTorrent(id, deleteLocalData) {
        await this.callRPC('torrent-remove', {
            ids: [id],
            'delete-local-data': deleteLocalData,
        });
    }
    /** 获取会话设置 */
    async getSession() {
        return this.callRPC('session-get');
    }
    /** 获取会话统计 */
    async getSessionStats() {
        return this.callRPC('session-stats');
    }
    /** 获取空闲空间 */
    async getFreeSpace(path) {
        return this.callRPC('free-space', { path });
    }
    /** 更新会话设置 */
    async setSession(args) {
        await this.callRPC('session-set', args);
    }
}
