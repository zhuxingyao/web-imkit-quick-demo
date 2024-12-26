# web imkit quick demo

方便 Vue 开发者，快速集成 IMKit, 只需要专注实现自己的业务信息接口即可。

### 工程命令

```bash
# 安装
npm install

# 开发
npm run dev

# 生产
npm run build
```

### 集成步骤

#### 准备 AppKey 和 用户 Token
便于前端开发人员快速集成开发，暂时不需要客户服务器向融云服务器发起请求。
您可通过 [融云控制台 > 北极星 > IM > Server Api 调试](https://console.rongcloud.cn/agile/formwork/imServerApi/index) 获取开发测试数据、消息联调等。

### 业务集成

因为融云不保存客户的敏感信息，好友关系，群组关系，等这些客户重要业务消息。IMKit 界面需要展示这些信息时，框架自动调用这些预留的扩展接口。所以客户需要实现这些预留的接口，用于界面展示。

#### 用户资料/群组资料接口

```typescript
`src/core/service.ts`

// 获取用户资料
getUserProfile: (userId: string) => {
  // 根据 userId，获取用户资料，异步处理 Promise
  // ...
  // 返回数据格式
  const userInfo = {
    id: userId,
    name: userId,
    portraitUri: R.image("60x60"),
    displayName: userId,
  }
  currentUserInfo.value = userInfo
  return Promise.resolve(userInfo)
}

getConversationProfile: (conversations: IConversationOption[]) => {
  // 根据 targetId / conversationType 获取会话资料，异步处理 Promise
  // ...
  // 返回数据格式
  return Promise.resolve(conversations.map(item => ({
    ...item,
    id: item.targetId,
    name: item.targetId,
    portraitUri: R.image("60x60"),
    displayName: item.targetId
  })))
}

getGroupMembers: (conversation: IConversationOption) => {
  // 根据 targetId 获取群成员资料，异步处理 Promise
  // ...
  // 返回数据格式
  return Promise.resolve([{
    id: `group_${conversation.targetId}`,
    name: `name_${conversation.targetId}`,
    portraitUri: R.image("60x60"),
    groupNickname: `groupNickname_${conversation.targetId}`
  }])
}
```