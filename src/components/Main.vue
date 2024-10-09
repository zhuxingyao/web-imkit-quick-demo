<script setup lang="ts">
import Navbar from './Navbar.vue';
import Loading from './ui_components/Loading.vue';

import { isShowLoading, loadingMessage } from '../core/context';

</script>

<template>
  <div class="app-layout">
    <Navbar></Navbar>
    <div class="app-layout-conten">
      <router-view></router-view>
    </div>
    <Loading v-model="isShowLoading" :message="loadingMessage"></Loading>
  </div>
</template>

<style scoped lang="scss">
.app-layout {
  display: flex;
  width: 100%;
  height: 100%;
  .app-layout-conten {
    flex: 1;
    display: flex;
    overflow: hidden;
  }
}
</style>
