import { IConversationOption, IUserProfileInfo, GroupMemberRole } from '@rongcloud/imlib-next';
import { IService, IConversationProfile, IGroupMember } from '@rongcloud/imkit';
import { Random as R } from "mockjs";
import { 
  libGetUserProfile, libSubscribeUserStatus, libGetGroupsInfo,
  libGetGroupMembersByRole
} from './imlib';
import { 
  localConversationList, localCacheGroupInfos, localCacheUserInfos,
  isShowLoading, 
} from './context';
import { isSameConversation } from '../utils/helper';


const service: IService = {
  /** 当前用户信息回调 */
  getUserProfile: async (userId: string) => {
    const res = await libGetUserProfile(userId)
    return res
  },  
  /** 会话列表回调 */
  getConversationProfile: async (conversations: IConversationOption[]) => {
    const renderConverdationList: IConversationProfile[] = [];
    const privateTargetIds: string[] = [];
    const groupTargetIds: string[] = [];
    return new Promise<IConversationProfile[]>(async resolve => {
      // 先检查缓存数据是否有用户或者群组信息，如果有直接使用缓存的数据，没有则请求远端
      conversations.forEach(conversation => {
        switch (conversation.conversationType){
          case 1:
            const index2User = localCacheUserInfos.value.findIndex(
              item2 => isSameConversation(conversation, { 
                conversationType: 1, 
                targetId: item2.userId!,
                channelId: '',
              })
            );
            if (index2User < 0) {
              // 没有缓存数据，将用户 id 加入待请求列表
              privateTargetIds.push(conversation.targetId);
              return
            }
            renderConverdationList.push({
              ...conversation,
              name: localCacheUserInfos.value[index2User]?.name || conversation.targetId,
              portraitUri: localCacheUserInfos.value[index2User]?.portraitUri || R.image("60x60"),
              displayName: localCacheUserInfos.value[index2User]?.name || conversation.targetId,
              id: conversation.targetId
            })
            break;
          case 3:
            const index2Group = localCacheGroupInfos.value.findIndex(
              item2 => isSameConversation(conversation, { 
                conversationType: 3, 
                targetId: item2.groupId!,
                channelId: '',
              })
            );
            if (index2Group < 0) {
              // 没有缓存数据，将群组 id 加入待请求列表
              groupTargetIds.push(conversation.targetId);
              return
            }
            renderConverdationList.push({
              ...conversation,
              name: localCacheGroupInfos.value[index2Group]?.groupName || conversation.targetId,
              portraitUri: localCacheGroupInfos.value[index2Group]?.portraitUri || R.image("60x60"),
              displayName: localCacheGroupInfos.value[index2Group]?.groupName || conversation.targetId,
              memberCount: localCacheGroupInfos.value[index2Group]?.membersCount || 0,
              id: conversation.targetId
            })
            break;
          default:
            renderConverdationList.push({
              ...conversation,
              name: conversation.targetId,
              portraitUri: R.image("60x60"),
              displayName: conversation.targetId,
              id: conversation.targetId
            })
            break;
        }
      })
      // 没有待请求数据，直接返回
      if (privateTargetIds.length === 0 && groupTargetIds.length === 0) {
        resolve(renderConverdationList);
      }

      // 请求用户&群组信息
      const result2User = await libSubscribeUserStatus(privateTargetIds);
      const result2Group = await libGetGroupsInfo(groupTargetIds);
      
      // 填充用户信息
      privateTargetIds.forEach(targetId => {
        const index2User = result2User.findIndex(item => item.userId === targetId);
        renderConverdationList.push({
          conversationType: 1,
          targetId,
          name: result2User[index2User]?.name || targetId,
          portraitUri: result2User[index2User]?.portraitUri || R.image("60x60"),
          displayName:result2User[index2User]?.name || targetId,
          id: targetId,
        })
      })
      // 填充群组信息
      groupTargetIds.forEach(targetId => {
        const index2Group = result2Group.findIndex(item => item.groupId === targetId);
        renderConverdationList.push({
          conversationType: 3,
          targetId,
          name: result2Group[index2Group]?.groupName || targetId,
          portraitUri: result2Group[index2Group]?.portraitUri || R.image("60x60"),
          displayName: result2Group[index2Group]?.groupName || targetId,
          memberCount: result2Group[index2Group]?.membersCount || 0,
          id: targetId,
        })
      })
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