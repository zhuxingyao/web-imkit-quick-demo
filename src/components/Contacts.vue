<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
// import { Random as R } from "mockjs";
import { kitSelectConversation } from '../core/imkit';
import { ConversationType } from '@rongcloud/imlib-next';
import { libAddFriend, libAcceptFriend } from '../core/imlib';
import { localFriends, localFriendApplications, localCacheGroupInfos } from '../core/context';

import Modal from './ui_components/Modal.vue';

const router = useRouter();

const selected = ref('contacts');

const isModalOpen = ref(false);

const cardList = ref([
  { name: 'contacts', title: '联系人' },
  { name: 'new-contacts', title: '新的联系人' },
  { name: 'groups', title: '我的群组' }
]);

function handleContactClick(targetId: string) {
  if (selected.value === 'new-contacts') return
  const conversationType = selected.value === 'contacts' ? ConversationType.PRIVATE : ConversationType.GROUP;
  kitSelectConversation({
    targetId,
    conversationType,
  })
  router.push({ name: 'chat'});
}

function handleChangeNav(item: { name: string, title: string }) {
  selected.value = item.name;
}

const formData = ref({
  userId: '',
  extra: ''
})

async function handleAddFriend() {
  const code = await libAddFriend(formData.value.userId, formData.value.extra);
  if (!code) return;
  isModalOpen.value = false;
}

// async function handleAcceptFriend() {
//   const code = await libAcceptFriend(formData.value.userId);
//   if (!code) return;
//   isModalOpen.value = false;
// }

onMounted(() => {
  // libGetFriendApplications
})

</script>

<template>
  <div class="contacts">
    <div class="contacts-nav">
      <div class="contacts-nav-search">
        <input type="text" placeholder="搜索">
      </div>
      <div class="contacts-nav-item" v-for="item in cardList" :key="item.name" @click="handleChangeNav(item)">
        <div class="name" :class="{'active': item.name == selected}">{{ item.title }}</div>
      </div>
    </div>
    <div class="contacts-content">
      <div class="contacts-content-header">
        <div class="contacts-content-header-title">
          <span v-if="selected === 'contacts'">联系人</span>
          <span v-if="selected === 'new-contacts'">新的联系人</span>
          <span v-if="selected === 'groups'">我的群组</span>
        </div>
        <div class="contacts-content-header-extra">
          <button 
            v-if="selected === 'contacts' || selected === 'new-contacts'"
            @click="isModalOpen = true"
            >添加联系人</button>
        </div>
      </div>
      <div class="contacts-content-body">
        <div class="list-items" v-if="selected === 'contacts'">
          <div class="list-item" v-for="item in localFriends" :key="item.userId" @click="handleContactClick(item.userId)">
            <div class="list-item-avatar">
              <img :src="item.portraitUri" alt="">
            </div>
            <div class="list-item-content">
              <div class="list-item-content-title">
                <div class="name">{{ item.name }}</div>
              </div>
            </div>
          </div>
        </div>
        <div class="list-items" v-if="selected === 'new-contacts'">
          <div class="list-item" v-for="item in localFriendApplications" :key="item.userId">
            <div class="list-item-avatar">
              <img :src="item.portraitUri" alt="">
            </div>
            <div class="list-item-content">
              <div class="list-item-content-title">
                <div class="name">{{ item.name }}</div>
                <button
                  v-if="item.applicationType === 2 && item.applicationStatus === 0"
                  @click="libAcceptFriend(item.userId)"
                  >添加到联系人</button>
                <span v-if="item.applicationType === 1 && item.applicationStatus === 0">已发送好友请求</span>
                <span v-if="item.applicationStatus === 1">已同意</span>
                <span v-if="item.applicationStatus === 2">已拒绝</span>
                <span v-if="item.applicationStatus === 3">已过期</span>
              </div>
            </div>
          </div>
        </div>
        <div class="list-items" v-if="selected === 'groups'">
          <div class="list-item" v-for="item in localCacheGroupInfos" :key="item.groupId" @click="handleContactClick(item.groupId)">
            <div class="list-item-avatar">
              <img :src="item.portraitUri" alt="">
            </div>
            <div class="list-item-content">
              <div class="list-item-content-title">
                <div class="name">{{ item.groupName }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
  <!-- 弹框 - 播放媒体文件 -->
  <Modal v-model="isModalOpen">
    <div class="modal-content">
      <div class="modal-content-title">
        添加联系人
      </div>
      <div class="modal-content-body">
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">用户 ID:</div>
          <div class="modal-content-body-item-content">
            <input 
              type="text" 
              v-model="formData.userId"
              placeholder="请输入用户 ID">
          </div>
        </div>
        <div class="modal-content-body-item">
          <div class="modal-content-body-item-title">附加信息:</div>
          <div class="modal-content-body-item-content">
            <input type="text" v-model="formData.extra"  placeholder="请输入群名称">
          </div>
        </div>
        <div class="modal-content-body-item">
          <button @click="handleAddFriend">
            确定
          </button>
        </div>
      </div>
    </div>
  </Modal>
</template>

<style scoped lang="scss">
@import "../assets/style/variables.scss";

.contacts {
  display: flex;
  flex: 1;
  
  .contacts-nav {
    width: 260px;
    height: 100%;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid $base-border-color;
    .contacts-nav-search {
      padding: 20px;
    }
    .contacts-nav-item {
      padding: 5px 0;
      border-bottom: 1px solid $base-border-color;
      .name {
        line-height: 26px;
        cursor: pointer;
        padding: 5px 20px;
        &:hover {
          background-color: $hover-background;
          transition: background-color .2s ease-in;
        }
        &.active {
          color: $primary-color;
        }
      }
    }
  }
  .contacts-content {
    display: flex;
    flex-direction: column;
    flex: 1;
    overflow-y: auto;
    .contacts-content-header {
      padding: 0 16px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-bottom: 1px solid $base-border-color;
      .contacts-content-header-title {
        font-size: 16px;
        line-height: 60px;
      }
    }
    .contacts-content-body {
      padding: 10px 10px 10px 0;
      flex: 1;
      overflow: hidden;
      display: flex;
      flex-direction: column;
      .list-items {
        flex: 1;
        overflow-y: auto;
        .list-item {
          display: flex;
          align-items: center;
          padding: 10px;
          cursor: pointer;
          &:hover {
            background-color: $hover-background;
            transition: background-color .2s ease-in;
          }
          .list-item-avatar {
            width: 40px;
            height: 40px;
            border-radius: 50%;
            overflow: hidden;
            margin-right: 15px;
            img {
              width: 100%;
            }
          }
          .list-item-content {
            flex: 1;
            .list-item-content-title {
              display: flex;
              justify-content: space-between;
              align-items: center;
              .name {
                font-size: 14px;
                line-height: 26px;
              }
              .time {
                font-size: 12px;
                color: $secondary-text;
                line-height: 26px;
              }
            }
          }
        }
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
        width: 80px;
      }
      .modal-content-body-item-content {
        flex: 1;
      }
    }
  }
}
</style>