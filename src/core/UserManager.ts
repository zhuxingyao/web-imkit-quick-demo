import { getDefaultProfileUri } from '../utils/helper';
// 公共用户信息模型
interface IUserCacheInfo {
  userId: string;
  name?: string;
  portraitUri?: string;
}

/**
 * 用户管理器
 * 管理所有用户公共信息的唯一数据源, 用户的详细信息统一更新和读取
 */
export class UserManager {
  private userMap: Map<string, IUserCacheInfo>;

  constructor() {
    this.userMap = new Map();
  }

  // 添加或更新用户公共信息
  addOrUpdateUser(user: IUserCacheInfo): void {
    const { userId, name, portraitUri } = user;
    this.userMap.set(user.userId, { userId, name: name || userId, portraitUri: portraitUri || getDefaultProfileUri(userId) });
  }

  // 获取用户公共信息
  getUser(userId: string): IUserCacheInfo {
    let user = this.userMap.get(userId);
    if (!user)  {
      user = { userId, name: userId, portraitUri: getDefaultProfileUri(userId) };
    }
    return user
  }

} 