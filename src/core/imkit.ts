import { 
  defineCustomElements, imkit, IUserProfile,
  Languages, CoreEvent, 
} from '@rongcloud/imkit';
import { 
  IInitOption, ConversationType, IReceivedConversation,
  IConversationOption,
} from '@rongcloud/imlib-next';
import service from './service';
import { validateParam } from '../utils/validator';
import { 
  currentUserInfo, messageListRef, language,
  conversationListRef, isModalOpen2conversationMenu,
  currentConversation, 
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
  });
};

/** 更新当前用户信息 */
export const kitUpdateUserProfile = async (profile: IUserProfile) => {
  if (
    !validateParam(profile, { type: 'object' }, true).isValid ||
    !validateParam(profile.name, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(profile.displayName, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(profile.portraitUri, { type: 'string', minLength: 1 }, false).isValid 
  ) {
    console.error('updateUserProfile params error');
    return 
  }

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
  conversationListRef.value.hideNotificUnreadCount = !!hide
}

/** 自定义会话菜单 - 修改会话信息 */
export const kitCustomConversationMenu = (isCustom: boolean) => {
  const conversationCustomMenu = [{
    name: (conversation: IReceivedConversation) => {
      switch (conversation.conversationType) {
        case ConversationType.GROUP:
          return '修改群信息'
        case ConversationType.PRIVATE:
          return '修改用户信息'
        case ConversationType.SYSTEM:
          return '修改系统信息'
        default:
          return '未知'
      }
    },
    callback: (conversation: IReceivedConversation) => {
      currentConversation.value = conversation;
      isModalOpen2conversationMenu.value = true;
    }
  }]
  conversationListRef.value.customMenu = isCustom ? conversationCustomMenu : []
}

/** 更新会话信息 */
export const kitUpdateConversationProfile = (info: { name: string, portraitUri: string }) => {
  if (!currentConversation.value) return
  if (
    !validateParam(info.name, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(info.portraitUri, { type: 'string', minLength: 1 }, true).isValid
  ) return
  const conversation = {
    conversationType: currentConversation.value.conversationType,
    targetId: currentConversation.value.targetId,
  }
  imkit.updateConversationProfile(conversation, {
    ...conversation,
    ...info
  });
  imkit.emit(CoreEvent.CONVERSATION, true);
  isModalOpen2conversationMenu.value = false
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
  imkit.selectConversation(conv);
}