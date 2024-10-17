import { IConversationOption, GroupMemberRole } from '@rongcloud/imlib-next';
import { IService, IConversationProfile, IGroupMember } from '@rongcloud/imkit';
import { 
  libGetUserProfile, libGetGroupsInfo,
  libGetGroupMembersByRole, libGetFriendsInfo
} from './imlib';
import { 
 getUser, getGroup
} from './context';
import { getDefaultProfileUri} from '../utils/helper';


const service: IService = {
  /** 当前用户信息回调 */
  getUserProfile: async (userId: string) => {
    const res = await libGetUserProfile(userId)
    return res
  },  
  /** 会话列表回调 */
  getConversationProfile: async (conversations: IConversationOption[]) => {
    const renderConverdationList: IConversationProfile[] = [];
    return new Promise<IConversationProfile[]>(async resolve => {
      const userIds = conversations.filter(item => item.conversationType === 1).map(item => item.targetId);
      const groupIds = conversations.filter(item => item.conversationType === 3).map(item => item.targetId);
      const otherConversations = conversations.filter(item => item.conversationType !== 1 && item.conversationType !== 3);
      // 处理单聊
      if (userIds.length > 0) {
        await libGetFriendsInfo(userIds);
        userIds.forEach(userId => {
          renderConverdationList.push({
            conversationType: 1,
            targetId: userId,
            name: getUser(userId).name!,
            portraitUri:  getUser(userId).portraitUri,
            displayName: getUser(userId).name!,
            id: userId,
          })
        })
      }

      // 处理群聊
      if (groupIds.length > 0) {
        await libGetGroupsInfo(groupIds);
        groupIds.forEach(groupId => {
          renderConverdationList.push({
            conversationType: 3,
            targetId: groupId,
            name: getGroup(groupId)?.groupName || groupId,
            portraitUri: getGroup(groupId)?.portraitUri || getDefaultProfileUri(groupId),
            displayName: getGroup(groupId)?.groupName || groupId,
            id: groupId,
          })
        })
      }

      // 处理其他类型会话
      if (otherConversations.length > 0) {
        otherConversations.forEach(conversation => {
          renderConverdationList.push({
            ...conversation,
            name: conversation.targetId,
            portraitUri: getDefaultProfileUri(conversation.targetId),
            displayName: conversation.targetId,
            id: conversation.targetId
          })
        })
      }
      resolve(renderConverdationList);
    })
    
  },
  getGroupMembers: async (conversation: IConversationOption) => {
    return new Promise<IGroupMember[]>(async resolve => {
      const result = await libGetGroupMembersByRole(conversation.targetId, GroupMemberRole.UNDEF);
      const renderGroupMembers = result.map(item => ({
        id: item.userId,
        name: item.name,
        portraitUri: item.portraitUri,
        groupNickname: item.nickname || item.name
      }))
      resolve(renderGroupMembers);
    })
  }
}

export default service