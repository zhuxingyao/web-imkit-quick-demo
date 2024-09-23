<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { useRouter } from 'vue-router';
import { ErrorCode } from '@rongcloud/imlib-next';
import { 
  appLogin, messageListRef, conversationListRef, messageEditorRef,
  isModalOpen2conversationMenu, playAudio, downloadFile
} from '../core/context';
import { 
  kitSetRecallDuration, kitSetHideNotificUnreadCount,
  kitCustomConversationMenu, kitUpdateConversationProfile
} from '../core/imkit';

import Drawer from './ui_components/Drawer.vue';
import Modal from './ui_components/Modal.vue';

const router = useRouter();

/** 抽屉是否展开 */
const isDrawerOpen = ref<boolean>(false);
const isModalOpen2TabMessage = ref<boolean>(false);
/** 设置撤回消息有效期 */
const recallDuration = ref(120);
/** 设置未读数显示 */
const hideNotificUnreadCount = ref(false);
/** 设置自定义按钮 */
const isCostomConversationMenu = ref(false);
const updateConversationProfile = ref({
  name: '',
  portraitUri: ''
})

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

onMounted(async () => {
  const { code } = await appLogin();
  if (code !== ErrorCode.SUCCESS) {
    router.push({name: 'login'});
  }
  messageListRef.value.addEventListener('tapMessage', handeleTapMessage);
})

onBeforeUnmount(() => {
  messageListRef.value.removeEventListener('tapMessage', handeleTapMessage);
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
      <!-- 右侧菜单 -->
      <div class="chat-wrapper-right-menu">
        <button @click="isDrawerOpen = true">自定义</button>
      </div>
    </div>
  </div>
  <Drawer v-model="isDrawerOpen">
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
  <Modal v-model="isModalOpen2conversationMenu">
    <div class="modal-content">
      <div class="modal-content-title">修改信息</div>
      <div class="modal-content-body">
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">名称:</div>
          <div class="modal-content-body-item-content">
            <input v-model="updateConversationProfile.name" type="text" placeholder="请输入群名称">
          </div>
        </div>
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">头像:</div>
          <div class="modal-content-body-item-content">
            <input v-model="updateConversationProfile.portraitUri" type="text" placeholder="请输入群名称">
          </div>
        </div>
        <div class="modal-content-body-item">
          <button @click="kitUpdateConversationProfile(updateConversationProfile)">更新</button>
        </div>
      </div>
    </div>
  </Modal>

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
    .chat-wrapper-right-menu {
      width: 60px;
      background-color: $page-background;
      padding: 10px;
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
  padding: 10px;
  font-size: 14px;
  .modal-content-title {
    font-size: 16px;
    font-weight: 500;
    line-height: 26px;
  }
  .modal-content-body {
    margin: 10px 0;
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
</style>