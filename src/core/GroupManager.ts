import { IGroupInfo, IGroupMemberInfo } from '@rongcloud/imlib-next';
import { UserManager } from './UserManager';
import { kitUpdateGroupMembers } from './imkit';
import { ref } from 'vue';

/**
 * 用于管理群列表
 */
export class GroupManager {
  public groupInfoMap = ref(new Map<string, IGroupInfo>());

  public groupMemberMap = ref(new Map<string, IGroupMemberInfo[]>());

  constructor(private userManager: UserManager) {

  }

  addOrUpdateGroup(groups: IGroupInfo[]): void {
    groups.forEach(group => {
      this.groupInfoMap.value.set(group.groupId, group);
    });
  }

  getGroup(groupId: string): IGroupInfo | undefined {
    return this.groupInfoMap.value.get(groupId);
  }

  deleteGroup(groupId: string): void {
    this.groupInfoMap.value.delete(groupId);
    if (this.groupMemberMap.value.has(groupId)) {
      this.groupMemberMap.value.delete(groupId);
    }
    console.log(`已删除群组 ${groupId} 及其成员数据`);
  }

  addOrUpdateGroupMember(groupId:string, members: IGroupMemberInfo[]): void {
    // 获取当前群组的成员
    const currentMembers = this.groupMemberMap.value.get(groupId) || [];

    // 创建一个 Map 以 userId 作为 key，先将 currentMembers 放入 Map 中
    const memberMap = new Map(currentMembers.map((member: any) => [member.userId, member]));

    // 遍历新 members，将其添加到 Map 中（如果 userId 存在，则更新，否则添加）
    members.forEach((member) => {
      memberMap.set(member.userId, member);

      // 更新 UserManager 中的用户信息
      this.userManager.addOrUpdateUser({
        userId: member.userId,
        name: member.name,
        portraitUri: member.portraitUri,
      });
    });

    // 根据加入时间进行排序
    const data = Array.from(memberMap.values()).sort((a, b) => b.joinedTime - a.joinedTime);
    // 将更新后的成员列表存入缓存
    this.groupMemberMap.value.set(groupId, data);
    kitUpdateGroupMembers(groupId, data)
  }

  getGroupMembers(groupId: string) : IGroupMemberInfo[] {
    return this.groupMemberMap.value.get(groupId) || [];
  }

  deleteGroupMember(groupId: string, userId: string) {
    const members = this.groupMemberMap.value.get(groupId);
  if (members) {
    const updatedMembers = members.filter(member => member.userId !== userId);
    this.groupMemberMap.value.set(groupId, updatedMembers);
    kitUpdateGroupMembers(groupId, updatedMembers)
  }
  }
}
