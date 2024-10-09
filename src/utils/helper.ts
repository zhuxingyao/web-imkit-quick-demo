import { IConversationOption, GroupMemberRole, GroupOperationPermission } from '@rongcloud/imlib-next';

/** 通用的分批处理函数，带有限速，防止调用接口过快导致超频 */
export const batchProcessWithRateLimit = async <T>(
  items: any[], 
  batchSize: number, 
  processFunc: (data: any[]) => Promise<T>, 
  maxCallsPerSecond: number,
):Promise<T[]> => {
  const batchedItems = [];
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);

    // 限速控制，确保每秒最多 maxCallsPerSecond 次调用
    if (i > 0 && i % (maxCallsPerSecond * batchSize) === 0) {
      console.log('Rate limit reached, waiting 1 second...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // 等待1秒
    }

    batchedItems.push(processFunc(batch));
  }
  return Promise.all(batchedItems);
};

/**
 * 判断两个会话是否相同
 * @param a 
 * @param b 
 * @returns 
 */
export const isSameConversation = (a: IConversationOption, b: IConversationOption): boolean => a.targetId === b.targetId && a.conversationType === b.conversationType && a.channelId === b.channelId;

/** 群操作权限检查 */
export const hasGroupOperationPermission = (role?: GroupMemberRole, permission?: GroupOperationPermission): boolean => {
  if (!role) return false;
  if (!permission) return role === GroupMemberRole.OWNER;
  
  switch (permission) {
    case GroupOperationPermission.OWNER_OR_MANAGER:
      return role === GroupMemberRole.OWNER || role === GroupMemberRole.MANAGER;
    case GroupOperationPermission.EVERYONE:
      return role === GroupMemberRole.OWNER || role === GroupMemberRole.MANAGER || role === GroupMemberRole.NORMAL || role ===GroupMemberRole.UNDEF;
    default:
      return false;
  }
};

/** 延时 */
export const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));