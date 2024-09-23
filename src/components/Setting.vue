<script setup lang="ts">
import { useRouter } from 'vue-router';
import { ref, onMounted, computed } from 'vue';
import { IUserProfile, Languages, imkit } from '@rongcloud/imkit';
import { currentUserInfo, language, languageList } from '../core/context';
import { kitUpdateUserProfile, kitSetLanguage } from '../core/imkit';

const router = useRouter();

const userInfo = ref<IUserProfile>({
  id: '',
  name: '',
  portraitUri: '',
  displayName: '',
});

const disabled2UserInfo = computed(() => {
  return (
    userInfo.value.name === currentUserInfo.value.name &&
    userInfo.value.portraitUri === currentUserInfo.value.portraitUri &&
    userInfo.value.displayName === currentUserInfo.value.displayName
  );
});


const _language = ref<Languages>(Languages.ZH_CN);
const disabled2Language = computed(() => _language.value === language.value);

onMounted(() => {
  language.value = imkit.lang as Languages;
  userInfo.value = JSON.parse(JSON.stringify(currentUserInfo.value));
  _language.value = language.value;
});

</script>

<template>
  <div class="setting">
    <div class="setting-header">
      <div class="setting-header-title">设置</div>
      <div class="setting-header-close">
        <button @click="router.back()">关闭</button>
      </div>
    </div>
    <div class="setting-content">
      <div class="setting-content-item">
        <div class="account">
          <div class="title">用户信息</div>
          <div class="item">
            <div class="content">
              <div class="label">名称:</div>
              <input type="text" v-model="userInfo.name">
            </div>
            <div class="content" style="margin-left: 50px;">
              <div class="label">别名:</div>
              <input type="text" v-model="userInfo.displayName">
            </div>
          </div>
          <div class="item">
            <div class="content">
              <div class="label">头像:</div>
              <input type="text" v-model="userInfo.portraitUri">
            </div>
          </div>
          <div class="item">
            <button :disabled="disabled2UserInfo" :class="{ 'rong-btn-disable': disabled2UserInfo }" @click="kitUpdateUserProfile(userInfo)">修改</button>
          </div>
        </div>
      </div>
      <div class="setting-content-item">
        <div class="title">选择语言</div>
        <div class="item">
          <select style="width: 200px;" v-model="_language">
            <option v-for="item in languageList" :value="item.value" :key="item.value">{{ item.name }}</option>
          </select>
        </div>
        <div class="item">
          <button 
            :disabled="disabled2Language" 
            :class="{ 'rong-btn-disable': disabled2Language }"
            @click="kitSetLanguage(_language)"
            >修改</button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
@import '../assets/style/variables.scss';

.setting {
  flex: 1;
  display: flex;
  flex-direction: column;
  font-size: 12px;

  .setting-header {
    width: 100%;
    height: 60px;
    border-bottom: 1px solid $base-border-color;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 20px;
    box-sizing: border-box;
    
    .setting-header-title {
      font-size: 16px;
      font-weight: bold;
    }
  }
  .setting-content {
    padding: 10px 20px;
    flex: 1;
    overflow-y: auto;

    .setting-content-item {
      border-bottom: 1px solid $base-border-color;

      .account {
        .item {
          display: flex;
          .content {
            flex: 1;
            display: flex;
            align-items: center;
          }
          .label {
            width: 50px;
          }
        }
      }
      .title {
        margin: 10px auto 15px 0;
        font-size: 18px;
        font-weight: 500;
        line-height: 26px;
      }

      .item {
        margin-bottom: 15px;
      }
    }
  }
}
</style>