/** 配置模块 - 集中管理所有环境变量和应用配置 */

export interface AppConfig {
  port: number;
  transmissionUrl: string;
  transmissionUsername: string;
  transmissionPassword: string;
}

export function loadConfig(): AppConfig {
  return {
    port: process.env.PORT ? parseInt(process.env.PORT, 10) : 3000,
    transmissionUrl:
      process.env.TRANSMISSION_URL ||
      'http://192.168.50.109:49092/transmission/rpc',
    transmissionUsername: process.env.TRANSMISSION_USERNAME || 'qnap',
    transmissionPassword: process.env.TRANSMISSION_PASSWORD || 'qnap',
  };
}