<script setup lang="ts">
// import { ref } from 'vue';
import { useRouter } from 'vue-router';
// import { ErrorCode } from '@rongcloud/imlib-next';
import { initOption, token, appInit } from '../core/context';
// import { libConnect } from '../core/imlib';

const router = useRouter();

/** 登入 */
const login = async () => {
  if (!initOption.value.appkey || !token) {
    return;
  }
  await appInit();
  // await appLogin();
  router.push({ name: 'chat' });
}

</script>

<template>
  <div class="app-login-container">
    <div class="app-login-left">
      <div class="app-login-main">
        <h4 class="app-login-title">Rongcloud Web IMKit Quick Demo</h4>
        <!-- appkey & token -->
        <div class="app-login-input">
          <div class="app-login-input-title">appkey:</div>
          <input type="text" v-model="initOption.appkey">
        </div>
        <div class="app-login-input">
          <div class="app-login-input-title">Token:</div>
          <input type="text" v-model="token">
        </div>
        <!-- 按钮 -->
        <div class="app-login-btn">
          <button @click="login">登入</button>
        </div>
      </div>
    </div>
    <!-- 右侧 - 背景图片 -->
    <div class="app-login-right">
       <div class="app-login-img-empty">
        <img src="../assets/images/signBg.png"></img>
       </div>
       <h4 class="app-login-right-title">Rongcloud Web IMKit Quick Demo</h4>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import "../assets/style/variables.scss";
.app-login-container {
  width: 100%;
  height: 100%;
  display: flex;
  .app-login-left {
    width: 60%;
    display: flex;
    justify-content: center;
    align-items: center;
    .app-login-main {
      width: 444px;
      border: 1px solid $base-border-color;
      border-radius: 10px;

      .app-login-title {
        font-size: 18px;
        font-weight: bold;
        padding: 25px;
      }

      .app-login-input {
        padding: 0 25px;

        .app-login-input-title {
          line-height: 32px;
        }
      }

      .app-login-btn {
        padding: 25px;
      }
    }
  }
  .app-login-right {
    flex: 1;
    background-color: $primary-color;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
    .app-login-img-empty {
      border-radius: 50%;
      background-color:  $primary-color;

      img {
        width: 400px;
        height: 400px;
        display: block;
        border-radius: 50%;
        background-color: $primary-color;
        font-size: 0;
      }
    }

    .app-login-right-title {
      font-size: 25px;
      font-weight: bold;
      color: #fff;
      padding: 10px;
    }
  }
}
</style>