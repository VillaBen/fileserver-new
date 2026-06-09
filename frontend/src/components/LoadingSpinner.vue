<template>
  <div class="loading-spinner" :class="{ 'loading-spinner-overlay': overlay }">
    <div class="loading-spinner-content">
      <el-icon :size="size" :class="[spinnerClass, 'spinner-icon']">
        <Loading />
      </el-icon>
      <p v-if="text" class="loading-spinner-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Loading } from '@element-plus/icons-vue';

const props = defineProps({
  size: {
    type: Number,
    default: 32
  },
  color: {
    type: String,
    default: 'primary'
  },
  overlay: {
    type: Boolean,
    default: false
  },
  text: {
    type: String,
    default: ''
  }
});

const spinnerClass = computed(() => `loading-spinner-icon-${props.color}`);
</script>

<style scoped>
.loading-spinner {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.loading-spinner-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.8);
  z-index: 100;
}

.loading-spinner-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.spinner-icon {
  display: inline-flex !important;
  animation: spinner-rotate 1s linear infinite !important;
  transform-origin: center center !important;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner-icon-primary {
  color: var(--el-color-primary);
}

.loading-spinner-icon-success {
  color: var(--el-color-success);
}

.loading-spinner-icon-warning {
  color: var(--el-color-warning);
}

.loading-spinner-icon-danger {
  color: var(--el-color-danger);
}

.loading-spinner-icon-info {
  color: var(--el-color-info);
}

.loading-spinner-text {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
