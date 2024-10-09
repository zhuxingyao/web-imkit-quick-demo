<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { 
  ErrorCode, GroupMemberRole
} from '@rongcloud/imlib-next';
import { 
  appLogin, messageListRef, conversationListRef, messageEditorRef,
  playAudio, downloadFile,
  currentConversation, isModalOpen2Group,
  getCurrentGroupInfo, currentGroupInfo,
  getGroupMembers, currentUserInfo,
} from '../core/context';
import { 
  kitSetRecallDuration, kitSetHideNotificUnreadCount,
  kitCustomConversationMenu
} from '../core/imkit';

import { 
  libCreateOrUpdateGroup,
  libDismissGroup, libQuitGroup,
  libInviteUsersToGroup, libDeleteFriends,
  libKickGroupMembers,
} from '../core/imlib';
import { hasGroupOperationPermission } from '../utils/helper';

import Drawer from './ui_components/Drawer.vue';
import Modal from './ui_components/Modal.vue';

const router = useRouter();

/** 抽屉是否展开 */
const isDrawerOpen2Setting = ref<boolean>(false);
const isModalOpen2TabMessage = ref<boolean>(false);
/** 设置撤回消息有效期 */
const recallDuration = ref(120);
/** 设置未读数显示 */
const hideNotificUnreadCount = ref(false);
/** 设置自定义按钮 */
const isCostomConversationMenu = ref(false);
const isDrawerOpen2GroupMembers = ref<boolean>(false);


const inviteUsers = ref<string>('');
enum ModalGroupType {
  // 群组信息
  GroupInfo = 'GroupInfo',
  InviteUsers = 'Privates',
}
const modal2GroupType = ref<ModalGroupType>(ModalGroupType.GroupInfo);

const handeleOpenModal2Group = (type: ModalGroupType) => {
  isModalOpen2Group.value = true;
  modal2GroupType.value = type;
}

const tapMessageDetail = ref<{
  type: string,
  uid: string,
  url: string,
}>();
/** 消息（图片、文件、小视频、富文本、高质量语音）点击事件 */
const handeleTapMessage = (e: any) => {
  console.log('消息点击事件', e);
  tapMessageDetail.value = e.detail;
  if (e.detail.type === 'image' || e.detail.type === 'sight') {
    isModalOpen2TabMessage.value = true;
  }
  if (e.detail.type === 'hqvoice') {
    playAudio(e.detail.url)
  }
  if (e.detail.type === 'file') {
    downloadFile(e.detail.url, e.detail.name);
  }
}

/**
 * 会话点击事件
 */
const handleTapConversation = (e: any) => {
  console.log('会话点击事件', e);
  // 获取会话信息
  currentConversation.value = e.detail;
  if (e.detail.conversationType === 3) {
    getCurrentGroupInfo(e.detail);
  }
}

const handleDeleteConversation = (e: any) => {
  console.log('会话删除', e);
}

onMounted(async () => {
  const { code } = await appLogin();
  if (code !== ErrorCode.SUCCESS) {
    router.push({name: 'login'});
  }
  messageListRef.value.addEventListener('tapMessage', handeleTapMessage);
  conversationListRef.value.addEventListener('selectConversation', handleTapConversation);
  conversationListRef.value.addEventListener('deleteConversation', handleDeleteConversation);
})

onBeforeUnmount(() => {
  messageListRef.value.removeEventListener('tapMessage', handeleTapMessage);
  conversationListRef.value.removeEventListener('selectConversation', handleTapConversation);
  conversationListRef.value.addEventListener('deleteConversation', handleDeleteConversation);
})

</script>

<template>
  <div class="chat-wrapper">
    <!-- 左侧会话列表 -->
    <div class="chat-wrapper-left">
      <conversation-list ref="conversationListRef" base-size="10px" />
    </div>
    <div class="chat-wrapper-right">
      <div class="chat-wrapper-right-main">
        <!-- 消息列表 -->
        <div class="chat-wrapper-right-conten">
          <message-list ref="messageListRef" base-size="10px"></message-list>
        </div>
        <!-- 消息编辑器 -->
        <div class="chat-wrapper-right-footer">
          <message-editor ref="messageEditorRef" base-size="10px"></message-editor>
        </div>
      </div>
    </div>
    <!-- 右侧菜单 -->
    <div class="chat-wrapper-right-menu">
      <button class="chat-wrapper-right-menu-item" @click="isDrawerOpen2Setting = true">IMKit 自定义</button>
      <div v-if="currentConversation" class="chat-wrapper-right-menu-group">
        <button 
          class="chat-wrapper-right-menu-item" 
          v-if="currentConversation.conversationType == 1" 
          @click="handeleOpenModal2Group(ModalGroupType.GroupInfo)"
          >创建群组</button>
        <button 
          class="chat-wrapper-right-menu-item" 
          v-if="currentConversation.conversationType == 1" 
          @click="libDeleteFriends(currentConversation.targetId)"
          >解除好友关系</button>
        <button 
          class="chat-wrapper-right-menu-item" 
          v-if="currentConversation.conversationType == 3 
            && currentGroupInfo 
            && currentGroupInfo.role === GroupMemberRole.OWNER" 
          @click="handeleOpenModal2Group(ModalGroupType.GroupInfo)"
          >更新群组</button>
        <button class="chat-wrapper-right-menu-item"
          v-if="currentGroupInfo && hasGroupOperationPermission(currentGroupInfo.role, currentGroupInfo.groupInfoEditPermission)"
          @click="libDismissGroup(currentGroupInfo)"
          >解散群组</button>
        <button class="chat-wrapper-right-menu-item"
          v-if="currentGroupInfo && currentGroupInfo.role !== GroupMemberRole.OWNER"
          @click="libQuitGroup(currentGroupInfo)"
          >退出群组</button>
        <button class="chat-wrapper-right-menu-item"
          v-if="currentConversation.conversationType == 3 
            && currentGroupInfo" 
          @click="isDrawerOpen2GroupMembers = true"
          >群成员</button>
      </div>
    </div>
  </div>
  <!-- 抽屉 drawer-->
  <Drawer v-model="isDrawerOpen2Setting">
    <!-- slot 插槽传递的内容，可以是任意组件 -->
    <div class="setting">
      <div class="setting-content">
        <div class="setting-content-item">
          <div class="title">设置撤回消息有效期</div>
          <div class="item">
            <input type="number" v-model="recallDuration" placeholder="单位为秒, 最大值是 120s">
          </div>
          <div class="item">
            <button @click="kitSetRecallDuration(recallDuration)">更新</button>
          </div>
        </div>
        <div class="setting-content-item">
          <div class="title">隐藏免打扰会话未读数</div>
          <div class="item">
            <select style="width: 200px;" v-model="hideNotificUnreadCount" @change="kitSetHideNotificUnreadCount(hideNotificUnreadCount)">
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
          </div>
        </div>
        <div class="setting-content-item">
          <div class="title">添加会话右键自定义菜单</div>
          <div class="item">
            <select style="width: 200px;" v-model="isCostomConversationMenu" @change="kitCustomConversationMenu(isCostomConversationMenu)">
              <option :value="true">true</option>
              <option :value="false">false</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  </Drawer>
  <!-- 弹框 - 播放媒体文件 -->
  <Modal v-model="isModalOpen2TabMessage">
    <div class="modal-content">
      <div v-if="tapMessageDetail?.type == 'image'" class="modal-content-title">图片详情</div>
      <div v-if="tapMessageDetail?.type == 'sight'" class="modal-content-title">短视频详情</div>
      <div class="modal-content-body">
        <img v-if="tapMessageDetail?.type == 'image'" width="100%" :src="tapMessageDetail?.url">
        <video v-if="tapMessageDetail?.type == 'sight'" width="100%" controls>
            <source :src="tapMessageDetail?.url" type="video/mp4">
            您的浏览器不支持 video 标签。
        </video>
      </div>
    </div>
  </Modal>
  <!-- 弹框 - 创建群组 & 修改群组信息 -->
  <Modal v-model="isModalOpen2Group">
    <!-- 弹框内容 - GroupInfo -->
    <div class="modal-content" v-if="modal2GroupType === ModalGroupType.GroupInfo">
      <div class="modal-content-title">
        {{ currentConversation?.conversationType == 1 ? '创建群组' : '修改群组信息' }}
      </div>
      <div class="modal-content-body">
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">ID:</div>
          <div class="modal-content-body-item-content">
            <input 
              type="text" 
              v-model="currentGroupInfo.groupId" 
              :disabled="!!currentGroupInfo?.groupId && currentConversation?.conversationType !== 1"
              :class="{
                'rong-input-disable':!!currentGroupInfo?.groupId && currentConversation?.conversationType !== 1
              }"
              placeholder="请输入群ID">
          </div>
        </div>
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">名称:</div>
          <div class="modal-content-body-item-content">
            <input type="text" v-model="currentGroupInfo.groupName" placeholder="请输入群名称">
          </div>
        </div>
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">头像:</div>
          <div class="modal-content-body-item-content">
            <input type="text" v-model="currentGroupInfo.portraitUri" placeholder="请输入群头像">
          </div>
        </div>
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">简介:</div>
          <div class="modal-content-body-item-content">
            <input type="text" v-model="currentGroupInfo.introduction" placeholder="请输入群简介">
          </div>
        </div>
        <div class="modal-content-body-item">
          <button @click="libCreateOrUpdateGroup(currentGroupInfo, currentConversation)">
            {{ currentConversation?.conversationType == 1 ? '创建' : '更新' }}
          </button>
        </div>
      </div>
    </div>
    <!-- 弹框内容 - InviteUsers -->
    <div class="modal-content" v-if="modal2GroupType === ModalGroupType.InviteUsers">
      <div class="modal-content-title">邀请用户入群</div>
      <div class="modal-content-body">
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">用户Id:</div>
          <div class="modal-content-body-item-content">
            <input 
              type="text" 
              v-model="inviteUsers"
              placeholder="请输入用户id, 多用户请用逗号隔开">
          </div>
        </div>
        <div class="modal-content-body-item">
          <button 
            v-if="currentGroupInfo" 
            @click="libInviteUsersToGroup(currentGroupInfo, inviteUsers.split(','))">邀请</button>
        </div>
      </div>
    </div>
  </Modal>
  <Drawer v-model="isDrawerOpen2GroupMembers">
    <div class="drawer-content">
      <div class="drawer-content-title">群成员列表</div>
      <div class="drawer-content-body">
        <div class="drawer-content-body-item" v-for="(item, index) in getGroupMembers(currentGroupInfo.groupId)" :key="index">
          <div class="item-avatar">
            <img :src="item.portraitUri" alt="">
          </div>
          <div class="item-info">
            <div class="item-info-name">{{ item.name }}</div>
            <div class="item-info-role" v-if="item.role === 1">{{item.userId === currentUserInfo.id ? '自己 - 群成员':'群成员'}}</div>
            <div class="item-info-role" v-if="item.role === 2">{{item.userId === currentUserInfo.id ? '自己 - 管理员':'管理员'}}</div>
            <div class="item-info-role" v-if="item.role === 3">{{item.userId === currentUserInfo.id ? '自己 - 群主':'群主'}}</div>
          </div>
          <div class="item-action">
            <button 
              v-if="currentGroupInfo.role === 3 && currentGroupInfo.ownerId !== item.userId"
              @click="libKickGroupMembers(currentGroupInfo.groupId, [item.userId])"
              >移除</button>
          </div>
        </div>
      </div>
      <div class="drawer-footer">
        <button
          v-if="currentGroupInfo && hasGroupOperationPermission(currentGroupInfo.role, currentGroupInfo.groupInfoEditPermission)"
          @click="handeleOpenModal2Group(ModalGroupType.InviteUsers)"
          >邀请入群</button>
      </div>
    </div>
  </Drawer>
</template>

<style scoped lang="scss">
@import "../assets/style/variables.scss";

.chat-wrapper {
  display: flex;
  flex: 1;
  overflow: hidden;
  .chat-wrapper-left {
    width: 25%;
  }
  .chat-wrapper-right {
    flex: 1;
    display: flex;
    .chat-wrapper-right-main {
      display: flex;
      flex-direction: column;
      flex: 1;
      .chat-wrapper-right-conten {
        height: 65%;
      }
      .chat-wrapper-right-footer {
        height: 35%;
      }
    }
  }
  .chat-wrapper-right-menu {
    // width: 60px;
    background-color: #f5f6f7;
    padding: 5px;
    display: flex;
    flex-direction: column;
    .chat-wrapper-right-menu-group {
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .chat-wrapper-right-menu-item {
      font-size: 12px;
      margin-bottom: 10px;
    }
  }
}

.setting {
  display: flex;
  flex-direction: column;
  .setting-content {
    flex: 1;
    overflow-y: auto;
    .setting-content-item {
      padding: 5px 0;
      border-bottom: 1px solid $base-border-color;
      .title {
        margin: 0 auto 5px 0;
        font-size: 14px;
        font-weight: 500;
        line-height: 26px;
      }
      .item {
        margin-bottom: 10px;
      }
    }
  }
}

.modal-content {
  padding: 10px 20px;
  font-size: 14px;
  .modal-content-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 26px;
  }
  .modal-content-body {
    margin: 10px 0;
    display: flex;
    flex-direction: column;
    .modal-content-body-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      .modal-content-body-item-title {
        width: 50px;
      }
      .modal-content-body-item-content {
        flex: 1;
      }
    }
  }
}

.drawer-content {
  font-size: 14px;
  flex: 1;
  display: flex;
  flex-direction: column;
  .drawer-content-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 26px;
    padding: 0 5px;
  }
  .drawer-content-body {
    margin: 10px 0;
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    .drawer-content-body-item {
      display: flex;
      align-items: center;
      margin-bottom: 10px;
      padding: 5px;
      cursor: pointer;
      &:hover {
        background-color: $hover-background;
        .item-action button {
          display: block;
        }
      }
      .item-avatar {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        overflow: hidden;
        margin-right: 10px;
        img {
          width: 100%;
          height: 100%;
        }
      }
      .item-info {
        flex: 1;
        .item-info-name {
          line-height: 26px;
        }
        .item-info-role {
          font-size: 12px;
          color: #909399;
        }
      }
      .item-action {
        width: 60px;
        button {
          display: none;
          width: 100%;
        }
      }
    }
  }
  .drawer-footer {
    padding: 10px 5px;
    display: flex;
    justify-content: flex-end;

  }
}
</style>