import { init, IInitOption, connect, disconnect } from '@rongcloud/imlib-next';

/**
 * 初始化 IMlib
 * @param initOption IMlib 配置
 */
export const initImLib = async (initOption: IInitOption) => {
  init(initOption);
};

/** 连接 */
export const libConnect = async (token: string) => {
  return await connect(token);
};

/** 断开连接 */
export const libDisConnect = async () => disconnect();