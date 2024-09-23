<template>
  <transition name="modal-fade">
    <div v-if="modelValue" class="modal-overlay" :class="{ 'overlay': overlay }" @click="close">
      <div class="modal-content" :style="{'width': width, 'top': top, 'left': left, 'transform': transform }" @click.stop>
        <slot></slot> <!-- 插槽，用于传递不同组件 -->
      </div>
    </div>
  </transition>
</template>

<script>
export default {
  name: 'Modal',
  props: {
    modelValue: {
      type: Boolean,
      default: false
    },
    overlay: {
      type: Boolean,
      default: true
    },
    width: {
      type: String,
      default: '500px'
    },
    top: {
      type: String,
      default: '50%'
    },
    left: {
      type: String,
      default: '50%'
    },
    transform: {
      type: String,
      default: 'translate(-50%, -50%)'
    }
  },
  watch: {
    modelValue(newVal) {
      this.isVisible = newVal; // 当 prop 变化时，更新内部状态
    }
  },
  data() {
    return {
      isVisible: this.modelValue // 初始内部状态
    };
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false); // 通知父组件关闭弹框
    }
  }
};
</script>

<style scoped lang="scss">
/* 样式保持不变 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 999;
  &.overlay {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-content {
    background: white;
    border-radius: 5px;
    max-width: 80%;
    position: relative;
    box-shadow: 0 2px 8px 0 rgba(31, 35, 41, 0.2);
    overflow: auto;
    max-height: 100%;
  }
}

.modal-fade-enter-active, .modal-fade-leave-active {
  transition: opacity 0.3s, transform 0.3s;
}

.modal-fade-enter-from, .modal-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>
