import { ref } from 'vue';
import { 
  IInitOption, ErrorCode, getConnectionStatus, RCConnectionStatus,
  IReceivedConversation, LogL
} from '@rongcloud/imlib-next';
import { CoreEvent, imkit, IUserProfile, Languages } from '@rongcloud/imkit';
import { initImLib, libDisConnect, libConnect } from '../core/imlib';
import { initIMKit } from '../core/imkit';

export const currentUserInfo = ref<IUserProfile>({
  id: '',
  name: '',
  displayName: '',
  portraitUri: '',
});

// 初始化配置
export const initOption = ref<IInitOption>({
  appkey: '',
  logOutputLevel: LogL.INFO,
});

// 登录 token
export const token = ref<string>('');

/** imkit 消息组件 */
export const messageListRef = ref<any>();
/** imkit 会话组件 */
export const conversationListRef = ref<any>();
/** imkit 编辑框组件 */
export const messageEditorRef = ref<any>();

/** 支持的语言 */
export const language = ref<Languages>(Languages.ZH_CN);
export const languageList = ref<{ name: string, value: Languages }[]>([
  { name: '中文' , value: Languages.ZH_CN },
  { name: '英文' , value: Languages.EN },
  { name: '台湾' , value: Languages.ZH_TW },
]);

export const isModalOpen2conversationMenu = ref<boolean>(false);
/** 当前右键自定义菜单选中的会话 */
export const currentConversation = ref<IReceivedConversation>();

/** 存储当前播放的音频实例的全局变量 */
let currentAudio: HTMLAudioElement | null = null;
/**
 *  播放音频
 * @param url 音频地址
 */
export function playAudio(url: string): void {
  // 如果音频已经在播放，暂停并重置
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.currentTime = 0;
    currentAudio = null; // Clear the current audio
  }

  // 创建新的 audio 实例
  currentAudio = new Audio(url);

  currentAudio.play().catch((error) => {
    console.error("Error playing audio:", error);
  });
}

/**
 * 文件下载
 * @param url 
 * @param filename 
 */
export async function downloadFile(url: string, filename: string): Promise<void> {
  try {
    // 从远端 url 获取文件
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch file from ${url}: ${response.statusText}`);
    }

    // 获取文件数据作为Blob
    const blob = await response.blob();

    // 创建一个临时下载链接
    const link = document.createElement('a');
    const fileUrl = URL.createObjectURL(blob);
    link.href = fileUrl;
    link.download = filename;

    // 通过模拟点击触发下载
    link.click();

    // 清理对象 URL 以释放内存
    URL.revokeObjectURL(fileUrl);
  } catch (error) {
    console.error("File download failed:", error);
  }
}

/** 是否已经初始化了 */
export const isInit = ref<boolean>(false);

/** 初始化 IMLib & IMKit */
export const appInit = async () => {
  // 防止重复初始化
  if (isInit.value) return;
  await initImLib(initOption.value);
  await initIMKit(initOption.value.appkey, initOption.value);
  isInit.value = true;
};

export const appLogin = async () => {
  if ( getConnectionStatus() == RCConnectionStatus.CONNECTED ) return { code: ErrorCode.SUCCESS };
  const { code } = await libConnect(token.value);
  if (code === ErrorCode.SUCCESS) {
    imkit.emit(CoreEvent.CONVERSATION, true);
  }
  return { code };
};

export const appDestroy = async () => {
  await libDisConnect();
};