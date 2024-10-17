import { 
  init, IInitOption, connect, disconnect,
  Events, ConversationType, SubscribeType,
  ISubscribeUserStatusInfo, IUserProfileInfo,
  addEventListener, getCurrentUserId, getUserProfiles,
  ErrorCode, getMyUserProfile,
  updateMyUserProfile, getFriends, QueryFriendsDirectionType,
  IFriendInfo, IGroupOperationInfo, IGroupInfoChanged, IGroupMemberInfoChanged,
  IGroupApplicationInfo, IGroupRemarkChangedSync, IGroupFollowsChangedSync,
  getGroupsInfo, IGroupInfo, createGroup, updateGroupInfo,
  IConversationOption, GroupMemberRole, dismissGroup, GroupOperation, quitGroup,
  inviteUsersToGroup, getGroupMembersByRole, IGroupMemberInfo, getFriendApplications,
  IFriendApplicationInfo, DirectionType, addFriend, acceptFriendApplication, deleteFriends,
  checkFriends, FriendRelationType, getJoinedGroupsByRole, kickGroupMembers, getFriendsInfo
} from '@rongcloud/imlib-next';
// todo: 后续重新导出接口定义
import {
  IFriendAdd, IFriendDelete, IFriendApplicationStatusChange,
  IFriendInfoChangedSync
} from '@rongcloud/engine'
import { IUserProfile, imkit, CoreEvent } from '@rongcloud/imkit';
import { 
  kitUpdateUserProfile, kitUpdateConversationProfile, kitSelectConversation,
  kitRemoveConversation,
} from './imkit';
import { delay, getDefaultProfileUri } from '../utils/helper';
import { validateParam } from '../utils/validator';
import { 
  currentUserInfo, isModalOpen2Group,
  isShowLoading, loadingMessage, currentGroupInfo,
  getGroupMembers,
  _friendManager, _groupManager,
  _userManager
} from './context';

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

/** 处理群组被移除 */
async function handleRemoveGroup(groupId: string) {
  // 移除会话
  kitRemoveConversation({
    conversationType: ConversationType.GROUP,
    targetId: groupId
  });
  // 移除本地该群组缓存信息
  _groupManager.deleteGroup(groupId);
};

/** 注册用户信息托管监听 */
export const registerListener = () => {
  /**
   * 所订阅的用户的信息变更时会收到此通知。
   * 订阅过期后，融云 SDK不会主动通知您，请您自行关注过期时间。
   * 暂时忽略 ts 验证，防止高版本 ts 对 ISubscribeUserStatusInfo 校验报错
   */
  //@ts-ignore
  addEventListener(Events.SUBSCRIBED_USER_STATUS_CHANGE, async (event: ISubscribeUserStatusInfo[]) => {
    console.log('被订阅者状态变更', event);
    event.forEach((item) => {
      // 更新单聊会话信息
      if (item.subscribeType === SubscribeType.FRIEND_USER_PROFILE && item.userProfile && item.userProfile.userId) {
        const { name, portraitUri, userId } = item.userProfile;
        _userManager.addOrUpdateUser({
          userId,
          name,
          portraitUri
        })
        const conversation = {
          conversationType: ConversationType.PRIVATE,
          targetId: userId
        };
        const info = {
          ...conversation,
          name: name || userId,
          portraitUri: portraitUri || getDefaultProfileUri(userId),
        };
        kitUpdateConversationProfile(info, conversation)
      }
    });
  });
  /**
   * 用户资料变更。
   * 在其他端修改用户资料后会受到此通知，用于执行后续的业务操作。
   */
  addEventListener(Events.OWN_USER_PROFILE_CHANGED, async (event: IUserProfileInfo) => {
    console.log('用户资料变更', event)
    const { name, portraitUri, userId, extraProfile } = event;
    // 如果用户 id 与当前用户 id 相同，则更新当前用户的资料 
    if (userId === getCurrentUserId() && name && portraitUri) {
      _userManager.addOrUpdateUser({ userId, name, portraitUri })
      kitUpdateUserProfile({ id: userId, name, portraitUri, displayName: extraProfile?.displayName || name })
    }
  })

  // 添加好友
  addEventListener(Events.FRIEND_ADDED, async (data: IFriendAdd) => {
    console.info('添加好友回调', data);
    const friend = _friendManager.getFriend(data.userId)
    if (!friend) {
      const friendInfo: IFriendInfo = {
        userId: data.userId,
        portraitUri: data.portraitUri,
        name: data.name,
        remark: '',
        extProfile: {},
        addTime: data.operationTime,
        directionType: data.directionType,
        inBlackList: false
      }
      _friendManager.addOrUpdateFriend([friendInfo])
      const friendApplication = _friendManager.getFriendApplication(data.userId);
      if (!friendApplication) return;
      friendApplication.applicationStatus = 1;
    }
  });
  // 删除好友
  addEventListener(Events.FRIEND_DELETE, (data: IFriendDelete) => {
    console.info('删除好友回调', data);
    data.userIds.forEach(userId => {
      const friend = _friendManager.getFriend(userId)
      if (friend) _friendManager.deleteFriend(userId)
      const friendApplication = _friendManager.getFriendApplication(userId);
      if (friendApplication) _friendManager.deleteFriendApplication(userId);

      kitRemoveConversation({
        conversationType: ConversationType.PRIVATE,
        targetId: userId
      });
    })

  });
  // 服务端清空好友
  addEventListener(Events.FRIEND_CLEARED, (data: number) => {
    console.info('服务端清空好友回调', data);
  });
  // 好友申请
  addEventListener(Events.FRIEND_APPLICATION_STATUS_CHANGED, async (e: IFriendApplicationStatusChange) => {
    console.info('好友申请回调', e);
    // TODO: 好友信息数据没有 name 和 portraitUri，多端情况下如果同步好友请求信息, 该种情况需要再主动获取用户信息
    const { code, data} = await getUserProfiles([e.userId]);
    if (code !== ErrorCode.SUCCESS || !data) return console.log('获取用户信息失败');
    const friendApplications = {
      name: data[0].name || e.userId,
      portraitUri: data[0].portraitUri || '',
      userId: e.userId,
      applicationType: e.applicationType,
      applicationStatus: e.applicationStatus,
      operationTime: e.operationTime,
      extra: e.extra
    }
    _friendManager.addOrUpdateFriendApplication([friendApplications])
  });
  // 【多端同步】好友信息回调
  addEventListener(Events.FRIEND_INFO_CHANGED_SYNC, (data: IFriendInfoChangedSync) => {
    console.info('【多端同步】好友信息回调', data);
  });
  // 群组操作通知
  addEventListener(Events.GROUP_OPERATION, async (data: IGroupOperationInfo) => {
    console.info('群组操作通知', data);
    // 处理群销毁逻辑
    if (data.operation === GroupOperation.DISMISS) {
      handleRemoveGroup(data.groupId)
    }
    // 处理群成员移除和退出
    if (data.operation === GroupOperation.KICK || data.operation === GroupOperation.QUIT) {
      data.memberInfos?.forEach(item => {
        // 如果当前用户被移除或退出群，则移除会话
        if (item.userId === getCurrentUserId()) {
          handleRemoveGroup(data.groupId)
          return
        }
        // 移除该群组的成员
        _groupManager.deleteGroupMember(data.groupId, item.userId)
      })
    }
    // 处理入群 - 将用户信息添加到本地缓存中
    if(data.operation === GroupOperation.JOIN && data.memberInfos) {
      const group = _groupManager.getGroup(data.groupId);
      // 如果没有该群组信息，则先拉取群组信息和群成员信息缓存到本地
      if (!group) {
        await libGetGroupsInfo([data.groupId]);
        await libGetGroupMembersByRole(data.groupId, GroupMemberRole.UNDEF);
        return
      }
      _groupManager.addOrUpdateGroupMember(data.groupId, data.memberInfos);
    }

    if (data.operation === GroupOperation.CREATE && data.groupInfo) {
      currentGroupInfo.value = data.groupInfo;
    }

  });
  // 群组资料变更通知
  addEventListener(Events.GROUP_INFO_CHANGED, (data: IGroupInfoChanged) => {
    console.info('群组资料变更通知', data);
    if (data.groupInfo) {
      // 更新群组信息
      let group = _groupManager.getGroup(data.groupInfo.groupId);
      if (group) group = data.groupInfo;
      const members = getGroupMembers(data.groupInfo.groupId);
      kitUpdateConversationProfile({
        name: data.groupInfo.groupName || data.groupInfo.groupId,
        portraitUri: data.groupInfo.portraitUri || getDefaultProfileUri(data.groupInfo.groupId),
        memberCount: members.length
      }, {
        conversationType: ConversationType.GROUP,
        targetId: data.groupInfo.groupId
      })
    }

  });
  // 群成员资料变更回调
  addEventListener(Events.GROUP_MEMBER_INFO_CHANGED, (data: IGroupMemberInfoChanged) => {
    console.info('群成员资料变更回调', data);
  });
  // 用户申请/邀请事件及结果回调
  addEventListener(Events.GROUP_APPLICATION_EVENT, (data: IGroupApplicationInfo) => {
    console.info('用户申请/邀请事件及结果回调', data);
  });
  // 群名称备注名更新多端同步回调事件
  addEventListener(Events.GROUP_REMARK_CHANGED_SYNC, (data: IGroupRemarkChangedSync) => {
    console.info('群名称备注名更新多端同步回调事件', data);
  });
  // 群成员特别关注变更多端回调事件
  addEventListener(Events.GROUP_FOLLOWS_CHANGED_SYNC, (data: IGroupFollowsChangedSync) => {
    console.info('群成员特别关注变更多端回调事件', data);
  });
}

/**
 * 批量获取群信息
 * @param groupIds 
 * @returns 
 */
export const libGetGroupsInfo = async (groupIds: string[]) => {
  if (!groupIds || groupIds.length === 0) return []
  const { code, data } = await getGroupsInfo(groupIds);
  if (code !== ErrorCode.SUCCESS || !data) return []
  _groupManager.addOrUpdateGroup(data);
  return data;
};

/** 处理获取本地用户资料 */
export const libGetUserProfile = async (userId: string) => {
  const { data } = await getMyUserProfile();
  const userInfo = {
    id: data?.userId || userId,
    name: data?.name || userId,
    portraitUri: data?.portraitUri || getDefaultProfileUri(userId),
    displayName: data?.extraProfile?.displayName || data?.name || userId,
  }
  currentUserInfo.value = userInfo;
  // 获取失败, 返回默认值
  return userInfo
}

/** 处理本地用户资料变更事件 */
export const libUpdateMyUserProfile = async (profile: IUserProfile) => {
  if (
    !validateParam(profile, { type: 'object' }, true).isValid ||
    !validateParam(profile.name, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(profile.displayName, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(profile.portraitUri, { type: 'string', minLength: 1 }, false).isValid 
  ) {
    console.error('updateUserProfile params error');
    return 
  }
  // imlib 用户信息更新
  const { code } = await updateMyUserProfile({
    portraitUri: profile.portraitUri,
    name: profile.name,
    // todo: 服务暂时没开通，先不设置
    // extraProfile: {
    //   displayName: profile.displayName,
    // }
  });
  if (code !== ErrorCode.SUCCESS) return alert(`更新用户信息失败, code: ${code}`);
  const kitUserInfo: IUserProfile = {
    id: profile.id,
    name: profile.name,
    displayName: profile.displayName || profile.name,
    portraitUri: profile.portraitUri,
  }
  currentUserInfo.value = kitUserInfo;
  // imkit 用户信息更新
  kitUpdateUserProfile(kitUserInfo);
}

/** 
 * 获取所有好友列表
 * 使用递归方式 - 增加频率限制
 * */
export async function libGetAllFriends() {
  const directionType = QueryFriendsDirectionType.BOTH;
  let allFriendsList: IFriendInfo[] = [];
  let option = {
    count: 100,
    pageToken: '',
    order: false,
  };

  let callCount = 0;
  const maxCallsPerSecond = 50;

  // 定义递归函数来获取好友列表
  async function fetchFriends() {
    if (callCount >= maxCallsPerSecond) {
      await delay(1000); // 如果超过50次调用，等待1秒
      callCount = 0;     // 重置调用次数
    }
    console.log('fetchFriends params ==>', directionType, option);
    const { code, data } = await getFriends(directionType, option);
    if (code !== ErrorCode.SUCCESS || !data) return allFriendsList;

    allFriendsList = allFriendsList.concat(data.data);
    callCount++;

    // 如果返回的 pageToken 存在，则继续递归调用
    if (data.pageToken && data.data.length > 0) {
      option.pageToken = data.pageToken;
      await fetchFriends();
    }
  }

  // 开始递归调用
  await fetchFriends();

  console.log('获取所有好友列表 ==>', allFriendsList);
  return allFriendsList;
}

/** 批量获取好友信息 */
export async function libGetFriendsInfo(userIds: string[]) {
  const { code, data } = await getFriendsInfo(userIds);
  if (code !== ErrorCode.SUCCESS || !data) return [];
  _friendManager.addOrUpdateFriend(data);
  return data;
}

/** 
 * 获取所有好友请求列表
 * 使用递归方式 - 增加频率限制
 * */
export async function libGetFriendApplications() {
  let allFriendApplications: IFriendApplicationInfo[] = [];
  let option = {
    count: 100,
    pageToken: '',
    order: false,
  };

  let callCount = 0;
  const maxCallsPerSecond = 50;

  // 定义递归函数来获取好友列表
  async function fetchFriendApplications() {
    if (callCount >= maxCallsPerSecond) {
      await delay(1000); // 如果超过50次调用，等待1秒
      callCount = 0;     // 重置调用次数
    }
    console.log('fetchFriendApplications params ==>', option);
    const { code, data } = await getFriendApplications(option);
    if (code !== ErrorCode.SUCCESS || !data) return allFriendApplications;

    allFriendApplications = allFriendApplications.concat(data.data);
    callCount++;

    // 如果返回的 pageToken 存在，则继续递归调用
    if (data.pageToken && data.data.length > 0) {
      option.pageToken = data.pageToken;
      await fetchFriendApplications();
    }
  }

  // 开始递归调用
  await fetchFriendApplications();
  console.log('获取好友请求列表结果 ==>', allFriendApplications)
  return allFriendApplications;
}

/** 
 * 创建群组 & 更新群信息 
 * 创建群组成功后需要跳到群组页面
 * 更新群信息后需要刷新群组列表
 * */
export const libCreateOrUpdateGroup = async (groupInfo: IGroupInfo, currentConversation?: IConversationOption) => {
  if (!currentConversation) return
  if (
    !validateParam(groupInfo.groupName, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(groupInfo.portraitUri, { type: 'string', minLength: 1 }, true).isValid ||
    !validateParam(groupInfo.groupId, { type: 'string', minLength: 1 }, true).isValid
  ) return
  isShowLoading.value = true;
  loadingMessage.value = '正在更新群信息';
  if (currentConversation.conversationType === ConversationType.GROUP) {
    const { code } = await updateGroupInfo(groupInfo);
    console.log('updateGroupInfo code ====>', code, groupInfo);
    isShowLoading.value = false;
    if (code !== ErrorCode.SUCCESS) return;
    currentGroupInfo.value = { ...groupInfo }
    // 同时更新 kit
    kitUpdateConversationProfile({
      name: groupInfo.groupName!,
      portraitUri: groupInfo.portraitUri!,
      memberCount: groupInfo.membersCount!
    }, currentConversation)
    imkit.emit(CoreEvent.CONVERSATION, true);
    isModalOpen2Group.value = false;
    return
  }
  const { code, data } = await createGroup(groupInfo, [currentConversation.targetId]);
  isShowLoading.value = false;
  if (code !== ErrorCode.SUCCESS || !data || data.processCode !== ErrorCode.SUCCESS) return alert(`创建群组失败, code: ${code}&${data?.processCode}`);
  currentGroupInfo.value = { ...groupInfo }
  // 更新本地缓存 - 防止触发监听请求远端
  _groupManager.addOrUpdateGroup([{ ...groupInfo, membersCount: 2, role: GroupMemberRole.OWNER }]);
  kitSelectConversation({
    conversationType: ConversationType.GROUP,
    targetId: groupInfo.groupId
  })
  isShowLoading.value = false;
  isModalOpen2Group.value = false;
}

/**
 * 解散群组
 * @param groupInfo 群组信息
 * 操作成功触发群组回调，在回调中处理 UI 变更
 */
export const libDismissGroup = async (groupInfo: IGroupInfo) => {
  if (!groupInfo) return;
  const { code } = await dismissGroup(groupInfo.groupId);
  if (code !== ErrorCode.SUCCESS) return;
}
/** 
 * 退出群组 
 * 操作成功触发群组回调，在回调中处理 UI 变更
 * */
export const libQuitGroup = async (groupInfo: IGroupInfo) => {
  if (!groupInfo) return;
  const { code } = await quitGroup(groupInfo.groupId);
  if (code !== ErrorCode.SUCCESS) return console.log('退出群组失败', code);
  // 由监听回调处理
  // kitRemoveConversation({
  //   conversationType: ConversationType.GROUP,
  //   targetId: groupInfo.groupId
  // });
}

/** 邀请用户加入群组 */
export const libInviteUsersToGroup = async (groupInfo: IGroupInfo, userIds: string[]) => {
  if (!groupInfo || !validateParam(userIds, { type: 'object' , minLength: 1, maxLength: 30 })) return;
  const { code } = await inviteUsersToGroup(groupInfo.groupId, userIds);
  if (code !== ErrorCode.SUCCESS) return console.log('邀请用户加入群组失败', code);
  isModalOpen2Group.value = false;
}

/** 获取已加入的群信息 */
export const libGetJoinedGroupsByRole = async (role: GroupMemberRole) => {
  let callCount = 0;
  const maxCallsPerSecond = 50;
  let option = {
    count: 100,
    pageToken: '',
    order: false,
  };
  let allGroupInfo: IGroupInfo[] = []
  // 定义递归请求群成员信息函数
  async function fetchGetJoinedGroupsByRole() {
    if (callCount >= maxCallsPerSecond) {
      await delay(1000); // 如果超过50次调用，等待1秒
      callCount = 0;     // 重置调用次数
    }

    const { code, data } = await getJoinedGroupsByRole(option, role);
    if (code !== ErrorCode.SUCCESS || !data) return allGroupInfo;

    allGroupInfo = allGroupInfo.concat(data.data);
    callCount++;

    // 如果返回的 pageToken 存在，则继续递归调用
    if (data.pageToken && data.data.length > 0) {
      option.pageToken = data.pageToken;
      await fetchGetJoinedGroupsByRole();
    }
  }

  // 开始递归调用
  await fetchGetJoinedGroupsByRole();
  console.log('getJoinedGroupsByRole ====>', allGroupInfo);
  return allGroupInfo;
}

/** 获取群成员信息 */
export const libGetGroupMembersByRole = async (groupId: string, role: GroupMemberRole) => {
  let callCount = 0;
  const maxCallsPerSecond = 50;
  let option = {
    count: 100,
    pageToken: '',
    order: false,
  };
  let allGroupMemberInfo: IGroupMemberInfo[] = []
  // 定义递归请求群成员信息函数
  async function fetchAllGroupMembersByRole() {
    if (callCount >= maxCallsPerSecond) {
      await delay(1000); // 如果超过50次调用，等待1秒
      callCount = 0;     // 重置调用次数
    }

    const { code, data } = await getGroupMembersByRole(groupId, role, option);
    console.log('fetchAllGroupMembersByRole ====>', code);
    if (code !== ErrorCode.SUCCESS || !data) return allGroupMemberInfo;

    allGroupMemberInfo = allGroupMemberInfo.concat(data.data);
    callCount++;

    // 如果返回的 pageToken 存在，则继续递归调用
    if (data.pageToken && data.data.length > 0) {
      option.pageToken = data.pageToken;
      await fetchAllGroupMembersByRole();
    }
  }

  // 开始递归调用
  await fetchAllGroupMembersByRole();
  _groupManager.addOrUpdateGroupMember(groupId, allGroupMemberInfo);
  return allGroupMemberInfo;
}

/** 踢出群成员 */
export const libKickGroupMembers = async (groupId: string, userIds: string[]) => {
  const { code } = await kickGroupMembers(groupId, userIds);
  if (code !== ErrorCode.SUCCESS) return console.log('踢出群成员失败', code);
}

/** 添加好友 */
export const libAddFriend = async (userId: string, extra: string) => {
  const directionType = DirectionType.BOTH
  const { code, data } =  await addFriend(userId, directionType, extra);
  if (code !== ErrorCode.SUCCESS || !data) return console.log('添加好友失败', code);

  return data.processCode;
}

/** 接受好友请求 */
export const libAcceptFriend = async (userId: string) => {
  const { code} = await acceptFriendApplication(userId);
  if (code !== ErrorCode.SUCCESS) return;
}

/** 删除好友 */
export const libDeleteFriends = async (userId: string) => {
  const directionType = DirectionType.BOTH;
  const { code, data } =  await checkFriends([userId], directionType);
  if (code !== ErrorCode.SUCCESS || !data) return console.log('检查好友信息失败');
  if (data[0].relationType !== FriendRelationType.BOTH_WAY) return alert('只能删除双向好友');
  const { code: deleteCode } = await deleteFriends([userId], directionType);
  if (deleteCode !== ErrorCode.SUCCESS) return console.log('删除好友失败');
}