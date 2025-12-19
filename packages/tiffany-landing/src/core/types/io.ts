/**
 * IO 类型定义 - 输入输出数据结构
 */

export interface LandingConfig {
  /** 第一行欢迎语 */
  welcomeLine1: string;
  /** 第二行欢迎语 */
  welcomeLine2: string;
  /** 视频路径 */
  videoSrc: string;
  /** 按钮文字 */
  buttonText: string;
  /** 跳转路径 */
  navigateTo: string;
}

export interface RunProjectInput {
  config?: Partial<LandingConfig>;
}

export interface RunProjectOutput {
  success: boolean;
  config: LandingConfig;
}

/** 默认配置 */
export const DEFAULT_LANDING_CONFIG: LandingConfig = {
  welcomeLine1: "Welcome to Tiffany's AI-Powered",
  welcomeLine2: "KOS Content Assistant",
  videoSrc: "/tiffany2.mp4",
  buttonText: "开始探索",
  navigateTo: "/",
};

