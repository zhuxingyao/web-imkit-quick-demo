import { ref } from 'vue';
import { 
  IInitOption, ErrorCode, getConnectionStatus, RCConnectionStatus,
  IReceivedConversation, LogL, IConversationOption,
  IGroupInfo, GroupMemberRole
} from '@rongcloud/imlib-next';
import { IUserProfile, Languages, imkit, CoreEvent } from '@rongcloud/imkit';
import { 
  initImLib, libDisConnect, libConnect,
  registerListener, libGetAllFriends, libGetFriendApplications,
  libGetJoinedGroupsByRole
} from '../core/imlib';
import { initIMKit } from '../core/imkit';
import { FriendManager } from './FriendManager';
import { GroupManager } from './GroupManager';
import { UserManager } from './UserManager';

export const _userManager = new UserManager();
export const _friendManager = new FriendManager(_userManager);
export const _groupManager = new GroupManager(_userManager);

export const currentUserInfo = ref<IUserProfile>({
  id: '',
  name: '',
  displayName: '',
  portraitUri: '',
});

export const isShowLoading = ref<boolean>(false);
export const loadingMessage = ref<string>('');

// 初始化配置
export const initOption = ref<IInitOption>({
  appkey: 'c9kqb3rdkbb8j',
  logOutputLevel: LogL.ERROR,
});

// 登录 token
export const token = ref<string>('HRicV3z8FasYMHBjVVpWsP817NEgrSGo@mwga.rongcloud.net');

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

export const isModalOpen2Group = ref<boolean>(false);
/** 当前选中的会话 */
export const currentConversation = ref<IConversationOption>();
/** 当前右键自定义菜单选中的会话 */
export const selectConversation2Rigte = ref<IReceivedConversation>();
/** 当前群信息 */
export const currentGroupInfo = ref<IGroupInfo>({
  groupId: '',
  groupName: '',
  portraitUri: '',
  introduction: '',
})
export const getCurrentGroupInfo = (conv: IConversationOption) => {
  const group = _groupManager.getGroup(conv.targetId);
  if (!group) return
  currentGroupInfo.value = { ...group };
  return group
}

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
  registerListener();

  isInit.value = true;
};

/** 连接 */
export const appLogin = async () => {
  if ( getConnectionStatus() == RCConnectionStatus.CONNECTED ) return { code: ErrorCode.SUCCESS };
  isShowLoading.value = true;
  loadingMessage.value = '正在更新列表详情';
  const { code } = await libConnect(token.value);
  if (code === ErrorCode.SUCCESS) {
    imkit.emit(CoreEvent.CONVERSATION, true);

    const friendsResult = await libGetAllFriends();
    _friendManager.addOrUpdateFriend(friendsResult);

    const friendApplicationsResult = await libGetFriendApplications();
    _friendManager.addOrUpdateFriendApplication(friendApplicationsResult);

    const groupsResult = await await libGetJoinedGroupsByRole(GroupMemberRole.UNDEF);
    _groupManager.addOrUpdateGroup(groupsResult);
    // imkit.emit(CoreEvent.CONVERSATION, true);
  }
  isShowLoading.value = false;
  return { code };
};

export const appDestroy = async () => {
  await libDisConnect();
};

/**
 * 好友列表
 */
export const friendsMap = _friendManager.friendsMap;
/**
 * 好友申请列表
 */
export const friendApplicationsMap = _friendManager.friendApplicationsMap;
/**
 * 群列表
 */
export const groupInfoMap = _groupManager.groupInfoMap;
/**
 * 群成员列表
 */
export const groupMemberMap = _groupManager.groupMemberMap;

/** 获取群成员 */
export const getGroupMembers = (groupId: string) => {
  return _groupManager.getGroupMembers(groupId);
};

export const getUser = (userId: string) => {
  return _userManager.getUser(userId);
}

export const getGroup = (groupId: string) => {
  return _groupManager.getGroup(groupId);
}