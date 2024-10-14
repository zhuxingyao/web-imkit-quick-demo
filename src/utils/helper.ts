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

/** 生成随机颜色 */
export function getRandomHexColor(): string {
  const randomColor = Math.floor(Math.random() * 0xFFFFFF); // 生成一个随机的数字
  const hexColor = `#${randomColor.toString(16).padStart(6, '0')}`; // 转换为十六进制，且不足六位时补0
  return hexColor;
}

/** 获取默认头像 */
export function getDefaultProfileUri(userId: string) {
  const size = 60;
  const color = getRandomHexColor();
  // 创建一个 canvas 元素
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;

  const context = canvas.getContext('2d');
  if (!context) return '';

  // 绘制背景色
  context.fillStyle = color;
  context.fillRect(0, 0, size, size);

  // 根据 userID 生成的字符，通常使用 userID 的首字母
  const text = userId.charAt(0).toUpperCase();

  // 设置字体大小和样式，适应 canvas 尺寸
  const fontSize = size / 2;
  context.font = `${fontSize}px Arial`;
  context.fillStyle = '#ffffff'; // 字体颜色
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  context.shadowColor = '#000000';
  context.shadowBlur = 2;
  context.shadowOffsetX = 1;
  context.shadowOffsetY = 1;

  // 在 canvas 中心绘制文本
  context.fillText(text, size / 2, size / 2);

  // 返回 base64 格式的图片 URL
  return canvas.toDataURL('image/png');
}