<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { Random as R } from "mockjs";
import { IUserProfile } from '@rongcloud/imkit';
import { kitSelectConversation } from '../core/imkit';
import { ConversationType } from '@rongcloud/imlib-next';

const router = useRouter();

const selected = ref('contacts');

const cardList = ref([
  { name: 'contacts', title: '联系人' },
  { name: 'new-contacts', title: '新的联系人' },
  { name: 'groups', title: '我的群组' }
]);

const getMockList = (data: string) => {
  const list = [];
  for (let i = 0; i < 20; i++) {
    list.push({
      id: R.id(),
      name: `${data}_${R.name()}`,
      portraitUri: R.image('60x60'),
      displayName: R.name(),
    })
  }
  return list;
}

const mockList = computed(() => {
  switch (selected.value) {
    case 'contacts':
      return getMockList('contact');
    case 'new-contacts':
      return getMockList('new-contacts');
    case 'groups':
      return getMockList('group');
    default:
      return getMockList('othen');
  }
})

function handleContactClick(item: IUserProfile) {
  if (selected.value === 'new-contacts') return
  const conversationType = selected.value === 'contacts' ? ConversationType.PRIVATE : ConversationType.GROUP;
  kitSelectConversation({
    targetId: item.id,
    conversationType,
  })
  router.push({ name: 'chat'});
}

function handleChangeNav(item: { name: string, title: string }) {
  selected.value = item.name;
}

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
          <button v-if="selected === 'contacts' || selected === 'new-contacts'">添加联系人</button>
        </div>
      </div>
      <div class="contacts-content-body">
        <div class="list-items">
          <div class="list-item" v-for="item in mockList" :key="item.id" @click="handleContactClick(item)">
            <div class="list-item-avatar">
              <img :src="item.portraitUri" alt="">
            </div>
            <div class="list-item-content">
              <div class="list-item-content-title">
                <div class="name">{{ item.name }}</div>
                <button v-if="selected === 'new-contacts'">添加到联系人</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
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
</style>