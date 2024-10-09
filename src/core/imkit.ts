import { 
  defineCustomElements, imkit, IUserProfile,
  Languages, CoreEvent, IGroupMember,
} from '@rongcloud/imkit';
import { 
  IInitOption, ConversationType, IReceivedConversation,
  IConversationOption, IGroupMemberInfo,
} from '@rongcloud/imlib-next';
import service from './service';
import { validateParam } from '../utils/validator';
import { 
  currentUserInfo, messageListRef, language,
  conversationListRef, getCurrentGroupInfo,
  selectConversation2Rigte, currentConversation,
  currentGroupInfo
} from './context';

/**
 * 初始化 IMKit
 * @param appkey 
 * @param libOption 
 */
export const initIMKit = async (appkey: string, libOption: IInitOption) => {
  defineCustomElements();
  await imkit.init({
    appkey,
    service,
    libOption,
    customIntercept: {
      interceptConversation: conversation => {
        if (!conversation) return true;
        //  匹配过滤 - 系统会话
        if (conversation.conversationType === ConversationType.SYSTEM) {
          return true; // 返回 true 为不展示该会话
        }
        // 正常会话 - 不过滤
        return false;// 返回 false 正常展示
      },
      interceptMessage: messages => {
        return false;
      },
    }
  });
};

/** 更新当前用户信息 */
export const kitUpdateUserProfile = async (profile: IUserProfile) => {
  imkit.updateUserProfile(profile);
  currentUserInfo.value = { ...currentUserInfo.value, ...profile }
}

/** 设置语言 */
export const kitSetLanguage = (lang: Languages) => {
  imkit.changeLanguage({
    lang,
  });
  language.value = lang;
}
 
/** 设置撤回消息时间间隔 */
export const kitSetRecallDuration = (num: number) => {
  const { isValid, message } = validateParam(num, { type: 'number', minValue: 0, maxValue: 120 }, true)
  if (!isValid ) {
    console.error(`kitSetRecallDuration params error, ${message}`);
    return
  }
  messageListRef.value.maxRecallDuration = num;
}

/** 设置是否隐藏未读消息数 */
export const kitSetHideNotificUnreadCount = (hide: boolean) => {
  conversationListRef.value.hideNotificUnreadCount = !!hide;
}

/** 自定义会话菜单 - 修改会话信息 */
export const kitCustomConversationMenu = (isCustom: boolean) => {
  const conversationCustomMenu = [{
    name: (conversation: IReceivedConversation) => {
      return '自定义会话菜单'
    },
    callback: (conversation: IReceivedConversation) => {
      selectConversation2Rigte.value = conversation;
      console.log('点击了自定义会话菜单', conversation)
    }
  }]
  conversationListRef.value.customMenu = isCustom ? conversationCustomMenu : []
}

/** 更新会话信息 */
export const kitUpdateConversationProfile = (
  info: { name: string, portraitUri: string, memberCount?: number },
  conversation: IConversationOption,
) => {
  imkit.updateConversationProfile(conversation, {
    ...conversation,
    ...info
  });
  imkit.emit(CoreEvent.CONVERSATION, true);
}

/** 选中会话 */
export const kitSelectConversation = (conv: IConversationOption) => {
  if (
    !validateParam(conv.targetId, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(conv.conversationType, { type: 'number' }, true).isValid
  ) {
    console.error('kitSelectConversation 参数错误');
    return;
  }
  currentConversation.value = conv;
  if (conv.conversationType === ConversationType.GROUP) {
    getCurrentGroupInfo(conv);
  }
  imkit.selectConversation(conv);
}

/** 移除会话 */
export const kitRemoveConversation = (conv: IConversationOption) => {
  console.log('移除会话', conv);
  if (
    !validateParam(conv.targetId, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(conv.conversationType, { type: 'number' }, true).isValid
  ) {
    console.error('kitRemoveConversation 参数错误');
    return;
  }
  if (
    conv.targetId == currentConversation.value?.targetId 
    && conv.conversationType == currentConversation.value?.conversationType
  ) {
    currentConversation.value = undefined;
  }

  imkit.removeConversation(conv);
}

/** 更新群成员信息 & 同时更新会话 memberCount 信息 */
export const kitUpdateGroupMembers = (
  groupId: string, 
  members: IGroupMemberInfo[]
) => {
  const conversation = {
    conversationType: ConversationType.GROUP,
    targetId: groupId,
  }
  const info: IGroupMember[] = members.map(item => ({
    id: item.userId,
    name: item.name,
    portraitUri: item.portraitUri,
    groupNickname: item.nickname || item.name,
  }))

  imkit.updateGroupMembers(conversation, info);

  kitUpdateConversationProfile({
    name: currentGroupInfo.value?.groupName || groupId,
    portraitUri: currentGroupInfo.value?.portraitUri || '',
    memberCount: info.length
  }, conversation)
}