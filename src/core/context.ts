import { ref } from 'vue';
import { 
  IInitOption, ErrorCode, getConnectionStatus, RCConnectionStatus,
  IReceivedConversation, LogL, IFriendInfo, IConversationOption, IUserProfileInfo,
  IGroupInfo, IGroupMemberInfo, IFriendApplicationInfo, GroupMemberRole
} from '@rongcloud/imlib-next';
import { IUserProfile, Languages, imkit, CoreEvent } from '@rongcloud/imkit';
import { 
  initImLib, libDisConnect, libConnect,
  registerListener, libGetAllFriends, libGetFriendApplications,
  libGetJoinedGroupsByRole
} from '../core/imlib';
import { initIMKit, kitUpdateGroupMembers } from '../core/imkit';

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
  const index2Group = localCacheGroupInfos.value.findIndex((item) => item.groupId === conv.targetId);
  if (index2Group === -1) return
  currentGroupInfo.value = {...localCacheGroupInfos.value[index2Group]};
  return localCacheGroupInfos.value[index2Group]
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
    localFriends.value = await libGetAllFriends();
    localFriendApplications.value = await libGetFriendApplications();
    localCacheGroupInfos.value = await libGetJoinedGroupsByRole(GroupMemberRole.UNDEF);
    // imkit.emit(CoreEvent.CONVERSATION, true);
  }
  isShowLoading.value = false;
  return { code };
};

export const appDestroy = async () => {
  await libDisConnect();
};

export const localFriends = ref<IFriendInfo[]>([]);

export const localFriendApplications = ref<IFriendApplicationInfo[]>([]);

export const localSubscribeUsers = ref<string[]>([]);

export const localConversationList = ref<IConversationOption[]>([]);

export const localCacheUserInfos = ref<IUserProfileInfo[]>([]);

export const localCacheGroupInfos = ref<IGroupInfo[]>([]);

/** 本地缓存的群成员数据 - 定义群的成员映射，键为群组 ID，值为成员数组 */
export const localCacheGroupMembers = ref<Map<string, IGroupMemberInfo[]>>(new Map());

/** 添加或更新群成员 */
export const addOrUpdateGroupMembers = (groupId: string, members: IGroupMemberInfo[]) => {
  // 获取当前群组的成员
  const currentMembers = localCacheGroupMembers.value.get(groupId) || [];

  // 创建一个 Map 以 userId 作为 key，先将 currentMembers 放入 Map 中
  const memberMap = new Map(currentMembers.map((member: any) => [member.userId, member]));

  // 遍历新 members，将其添加到 Map 中（如果 userId 存在，则更新，否则添加）
  members.forEach((member: any) => {
    memberMap.set(member.userId, member);
  });

  // 将更新后的成员列表存入缓存
  localCacheGroupMembers.value.set(groupId, Array.from(memberMap.values()));
  
  console.log('addOrUpdateGroupMembers ===>', Array.from(memberMap.values()));
  kitUpdateGroupMembers(groupId, Array.from(memberMap.values()))
};

/** 获取群成员 */
export const getGroupMembers = (groupId: string) => {
  return localCacheGroupMembers.value.get(groupId) || [];
};

/** 删除群成员 */
export const removeMemberFromGroup = (groupId: string, userId: string): void => {
  const members = localCacheGroupMembers.value.get(groupId);
  if (members) {
    const updatedMembers = members.filter(member => member.userId !== userId);
    localCacheGroupMembers.value.set(groupId, updatedMembers);
    kitUpdateGroupMembers(groupId, updatedMembers)
  }
};

/** 删除指定群组的缓存数据 */
export const removeGroupMembers = (groupId: string) => {
  if (localCacheGroupMembers.value.has(groupId)) {
    localCacheGroupMembers.value.delete(groupId);
    console.log(`已删除群组 ${groupId} 及其成员数据`);
  } else {
    console.log(`群组 ${groupId} 不存在`);
  }
};
