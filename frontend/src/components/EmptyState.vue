<template>
  <div class="empty-state">
    <div class="empty-state-icon" :class="iconClass">
      <el-icon :size="64"><component :is="iconComponent" /></el-icon>
    </div>
    <h3 class="empty-state-title">{{ title }}</h3>
    <p class="empty-state-description" v-if="description">{{ description }}</p>
    <slot name="actions" v-if="$slots.actions"></slot>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Folder, Document, Share, Delete } from '@element-plus/icons-vue';

const props = defineProps({
  type: {
    type: String,
    default: 'files',
    validator: (value) => ['files', 'folders', 'shares', 'trash', 'search'].includes(value)
  },
  title: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  }
});

const iconMap = {
  files: Document,
  folders: Folder,
  shares: Share,
  trash: Delete,
  search: Document
};

const iconComponent = computed(() => iconMap[props.type] || Document);
const iconClass = computed(() => `empty-state-icon-${props.type}`);
</script>

<style scoped>
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 40px;
  text-align: center;
}

.empty-state-icon {
  margin-bottom: 24px;
  opacity: 0.5;
}

.empty-state-icon-files {
  color: var(--el-color-primary);
}

.empty-state-icon-folders {
  color: var(--el-color-success);
}

.empty-state-icon-shares {
  color: var(--el-color-warning);
}

.empty-state-icon-trash {
  color: var(--el-color-danger);
}

.empty-state-icon-search {
  color: var(--el-color-info);
}

.empty-state-title {
  font-size: 24px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 12px 0;
}

.empty-state-description {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  margin: 0 0 24px 0;
}
</style>
