<template>
  <!-- 遮罩层 -->
  <transition name="fade">
    <div v-if="modelValue" class="backdrop" @click="closeDrawer"></div>
  </transition>

  <!-- 抽屉 -->
  <transition
    name="drawer"
    @before-enter="beforeEnter"
    @enter="enter"
    @before-leave="beforeLeave"
    @leave="leave"
  >
    <div v-if="modelValue" class="drawer" @click.stop>
      <div class="drawer-header">
        <button class="rong-danger-btn" @click="closeDrawer">Close Drawer</button>
      </div>
      <!-- Slot 用于接收外部传入的内容 -->
      <slot></slot>
      
    </div>
  </transition>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

// 通过 props 接收 v-model 绑定的值
const props = defineProps({
  modelValue: {
    type: Boolean,
    required: true
  }
});

// 发出事件来更新父组件中的 v-model 绑定值
const emit = defineEmits(['update:modelValue']);

// 关闭抽屉时触发父组件的更新
const closeDrawer = () => {
  emit('update:modelValue', false);
};

const beforeEnter = (el) => {
  el.style.transform = 'translateX(100%)';
};

const enter = (el, done) => {
  el.offsetHeight; // 触发重绘
  el.style.transition = 'transform 0.3s ease';
  el.style.transform = 'translateX(0)';
  el.addEventListener('transitionend', done);
};

const beforeLeave = (el) => {
  el.style.transform = 'translateX(0)';
};

const leave = (el, done) => {
  el.offsetHeight; // 触发重绘
  el.style.transition = 'transform 0.3s ease';
  el.style.transform = 'translateX(100%)';
  el.addEventListener('transitionend', done);
};
</script>

<style scoped>
.drawer {
  position: fixed;
  top: 0;
  right: 0;
  width: 300px;
  height: 100%;
  background-color: #fff;
  box-shadow: -2px 0 5px rgba(0, 0, 0, 0.1);
  padding: 20px;
  z-index: 999;

  .drawer-header {
    display: flex;
    justify-content: right;
    align-items: center;
    margin-bottom: 20px;
  }
}
.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  z-index: 50;
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
