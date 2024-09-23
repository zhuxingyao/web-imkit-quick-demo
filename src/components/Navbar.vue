<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import Modal from './ui_components/Modal.vue';
import { libDisConnect } from '../core/imlib';
import { currentUserInfo } from '../core/context';

const router = useRouter();
const route = useRoute();

/** 菜单切换 */
const active = computed(() => route.name);

const showModal = ref<boolean>(false);

const navList = [
  { name: 'chat'},
  { name: 'contacts'},
]

/** 头像点击 */
const handleAvatarClick = () => {
  showModal.value = true;
}

/** 退出登入 */
const handleLogout = async () => {
  showModal.value = false;
  await libDisConnect();
  router.push({ name: 'login' });
}

/** 设置 */
const handleSetting = () => {
  showModal.value = false;
  router.push({ name: 'setting' });
}

const handleNavClick = (item: { name: string }) => {
  router.push({ name: item.name });
}

</script>

<template>
<div class="app-navbar">
  <div class="app-navbar-avatar">
    <div class="app-navbar-avatar-inside" @click="handleAvatarClick">
      <img class="app-navbar-avatar-inside-img" :src="currentUserInfo.portraitUri" alt="">
    </div>
  </div>

  <section class="navi-items">
    <section class="navbar-menu" :class="{ 'active': active === item.name }" 
      v-for="item in navList"
      @click="handleNavClick(item)"
    >
      <div class="navbar-menu-image" :class="item.name"></div>
    </section>
  </section>
</div>
<Modal v-model="showModal" :overlay="false" :top="'35px'" :left="'65px'" transform="translate(0, 0)">
  <div class="user-card">
    <div class="user-card-header">
      <div class="user-card-avatar">
        <img :src="currentUserInfo.portraitUri" alt="">
      </div>
      <div class="user-card-name-wrapper">
        <span class="user-card-name">{{ currentUserInfo.name }}</span>
        <span class="user-card-other">{{ currentUserInfo.displayName }}</span>
      </div>
    </div>
    <div class="user-card-links">
      <div class="user-card-link" @click="handleSetting">设置</div>
    </div>
    <div class="user-card-links">
      <div class="user-card-link" @click="handleLogout">退出登入</div>
    </div>
  </div>
</Modal>
</template>

<style lang="scss">
@import '../assets/style/variables.scss';
.app-navbar {
  width: 60px;
  user-select: none;
  background-color: #465069;
  display: flex;
  flex-direction: column;
  
  .app-navbar-avatar {
    margin: 30px 0 24px;
    display: flex;
    justify-content: center;

    .app-navbar-avatar-inside {
      border-radius: 50%;
      width: 40px;
      height: 40px;
      background-color: #fff;
      display: flex;
      justify-content: center;
      align-items: center;

      .app-navbar-avatar-inside-img {
        width: 36px;
        height: 36px;
        display: block;
        border-radius: 50%;
      }
    }
  }

  .navi-items {
    width: 100%;
    .navbar-menu {
      height: 45px;
      line-height: 52px;
      text-align: center;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;

      .navbar-menu-image {
        width: 25px;
        height: 25px;
        &.chat {
          background-image: url('../assets/images/icon-chat.svg');
          background-size: cover;
        }
        &.contacts {
          background-image: url('../assets/images/icon-contacts.svg');
          background-size: cover;
        }
      }
      &.active {
        background-color: $primary-color;
      }
      &:hover,&.active {
        .navbar-menu-image {
          &.chat {
            background-image: url('../assets/images/icon-chat-active.svg');
          }
          &.contacts {
            background-image: url('../assets/images/icon-contacts-active.svg');
          }
        }
      }
    }
  }
}

.user-card {
  .user-card-header {
    display: flex;
    height: 135px;
    align-items: center;
    background-color: $primary-color;
    padding: 0 20px;

    .user-card-avatar {
      width: 60px;
      height: 60px;
      padding: 2px;
      border-radius: 50%;
      background-color: #fff;

      img {
        width: 100%;
        height: 100%;
        display: block;
        border-radius: 50%;
      }
    }

    .user-card-name-wrapper {
      display: flex;
      flex-direction: column;
      margin-left: 10px;
      color: #fff;

      .user-card-name {
        font-size: 24px;
        font-weight: bold;
        line-height: 36px;
      }

      .user-card-other {
        font-size: 12px;
      }
    }
  }

  .user-card-links {
    padding: 10px 0;
    border-top: 1px solid $base-border-color;
    
    .user-card-link {
      padding: 0 10px;
      line-height: 40px;
      cursor: pointer;
      &:hover {
        background-color: rgba(222,224,227,.9);
      }
    }
  }
}
</style>