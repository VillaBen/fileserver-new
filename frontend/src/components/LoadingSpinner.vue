<template>
  <div class="loading-spinner" :class="{ 'loading-spinner-overlay': overlay }">
    <div class="loading-spinner-content">
      <svg
        class="spinner-svg"
        :width="size"
        :height="size"
        viewBox="0 0 50 50"
      >
        <circle
          class="spinner-track"
          cx="25"
          cy="25"
          r="20"
          :stroke="trackColor"
          stroke-width="4"
          fill="none"
        />
        <circle
          class="spinner-progress"
          cx="25"
          cy="25"
          r="20"
          :stroke="progressColor"
          stroke-width="4"
          fill="none"
          stroke-linecap="round"
          stroke-dasharray="80 200"
        />
      </svg>
      <p v-if="text" class="loading-spinner-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  size: {
    type: Number,
    default: 48
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

const colorMap = {
  primary: '#409eff',
  success: '#67c23a',
  warning: '#e6a23c',
  danger: '#f56c6c',
  info: '#909399'
};

const progressColor = computed(() => colorMap[props.color] || colorMap.primary);
const trackColor = computed(() => {
  const hex = colorMap[props.color] || colorMap.primary;
  return hex + '20';
});
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

.spinner-svg {
  animation: spinner-rotate 1s linear infinite;
  transform-origin: center;
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
