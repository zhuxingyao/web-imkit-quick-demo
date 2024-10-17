import { IFriendInfo, IFriendApplicationInfo } from '@rongcloud/imlib-next';
import { UserManager } from './UserManager';
import { ref } from 'vue';

/**
 * 用于管理好友列表和好友申请列表
 */
export class FriendManager {

  public friendsMap = ref(new Map<string, IFriendInfo>());

  public friendApplicationsMap = ref(new Map<string, IFriendApplicationInfo>());

  constructor(private userManager: UserManager) {
  }

  /**
   * 添加或更新好友列表
   * @param friends 好友列表
   */
  addOrUpdateFriend(friends: IFriendInfo[]): void {
    friends.forEach(friend => {
      this.friendsMap.value.set(friend.userId, friend);

      // 更新 UserManager 中的用户信息
      this.userManager.addOrUpdateUser({
        userId: friend.userId,
        name: friend.name,
        portraitUri: friend.portraitUri,
      });
    });
  }

  /**
   * 获取所有好友列表
   * @returns 
   */
  getAllFriends(): IFriendInfo[] {
    return Array.from(this.friendsMap.value.values());
  }

  /**
   * 获取好友信息
   * @param userId 
   * @returns 
   */
  getFriend(userId: string): IFriendInfo | undefined {
    return this.friendsMap.value.get(userId);
  }

  /**
   * 删除好友
   * @param userId 好友 ID
   */
  deleteFriend(userId: string): void {
    this.friendsMap.value.delete(userId);
  }

  /**
   * 添加或更新好友请求列表
   * @returns 好友列表
   */
  addOrUpdateFriendApplication(friendApplications: IFriendApplicationInfo[]): void {
    friendApplications.forEach(friendApplication => {
      this.friendApplicationsMap.value.set(friendApplication.userId, friendApplication);
      this.userManager.addOrUpdateUser({
        userId: friendApplication.userId,
        name: friendApplication.name,
        portraitUri: friendApplication.portraitUri,
      });
    });
  }

  getFriendApplication(userId: string): IFriendApplicationInfo | undefined {
    return this.friendApplicationsMap.value.get(userId);
  }

  /**
   * 删除好友申请
   * @param userId 用户 ID
   */
  deleteFriendApplication(userId: string): void {
    this.friendApplicationsMap.value.delete(userId);
  }
}
