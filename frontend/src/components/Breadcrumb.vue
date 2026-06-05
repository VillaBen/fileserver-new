<template>
  <div class="breadcrumb">
    <el-breadcrumb separator="/">
      <el-breadcrumb-item v-for="(item, index) in breadcrumbItems" :key="item.path">
        <template v-if="index < breadcrumbItems.length - 1">
          <el-link type="primary" @click="handleClick(item)">
            {{ item.label }}
          </el-link>
        </template>
        <span v-else class="breadcrumb-current">{{ item.label }}</span>
      </el-breadcrumb-item>
    </el-breadcrumb>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18nStore } from '../stores/i18n';

const props = defineProps({
  items: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['navigate']);
const i18n = useI18nStore();

const breadcrumbItems = computed(() => {
  return props.items.map(item => ({
    ...item,
    label: item.label || i18n.t(item.labelKey) || item.path
  }));
});

const handleClick = (item) => {
  emit('navigate', item);
};
</script>

<style scoped>
.breadcrumb {
  padding: 8px 0;
  margin-bottom: 16px;
}

.breadcrumb :deep(.el-breadcrumb__inner) {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.breadcrumb :deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner) {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.breadcrumb-current {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}
</style>
