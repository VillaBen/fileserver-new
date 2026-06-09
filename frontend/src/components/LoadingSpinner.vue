<template>
  <div class="loading-spinner-wrapper" :class="{ 'loading-spinner-overlay': overlay }">
    <div class="loading-spinner-content">
      <el-icon :size="size" class="spinner-icon">
        <Loading />
      </el-icon>
      <p v-if="text" class="loading-spinner-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
import { Loading } from '@element-plus/icons-vue';

const props = defineProps({
  size: {
    type: Number,
    default: 32
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
</script>

<style scoped>
.loading-spinner-wrapper {
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
  animation: spinner-rotate 1s linear infinite;
  color: #409eff;
}

@keyframes spinner-rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.loading-spinner-text {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}
</style>
