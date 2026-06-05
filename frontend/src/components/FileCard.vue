<template>
  <div
    class="file-card"
    :class="{
      'file-card-selected': selected,
      'file-card-folder': isFolder
    }"
    @click="handleClick"
    @contextmenu.prevent="$emit('contextmenu', $event, file)"
  >
    <div class="file-card-icon">
      <el-icon :size="40" v-if="!isFolder">
        <Document v-if="file.file_type === 'document'" />
        <Picture v-else-if="file.file_type === 'image'" />
        <VideoCamera v-else-if="file.file_type === 'video'" />
        <Headset v-else-if="file.file_type === 'audio'" />
        <Files v-else />
      </el-icon>
      <el-icon :size="40" v-else>
        <Folder class="folder-icon" />
      </el-icon>
    </div>
    <div class="file-card-content">
      <div class="file-card-name" :title="file.name">
        {{ file.name }}
      </div>
      <div class="file-card-meta" v-if="!isFolder">
        <span class="file-card-size">{{ formatFileSize(file.size) }}</span>
        <span class="file-card-divider">·</span>
        <span class="file-card-date">{{ formatDate(file.updated_at) }}</span>
      </div>
      <div class="file-card-meta" v-else>
        <span class="file-card-count">
          {{ file.item_count || 0 }} {{ i18n.t('items') || 'items' }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { Document, Picture, VideoCamera, Headset, Files, Folder } from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';
import { formatFileSize, formatDate } from '@/utils/format';

const props = defineProps({
  file: {
    type: Object,
    required: true
  },
  selected: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['click', 'contextmenu', 'dblclick']);

const i18n = useI18nStore();

const isFolder = computed(() => props.file.type === 'folder');

const handleClick = (event) => {
  if (event.detail === 2) {
    emit('dblclick', props.file);
  } else {
    emit('click', props.file, event);
  }
};
</script>

<style scoped>
.file-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  border-radius: 16px;
  background: var(--el-bg-color);
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s ease;
  user-select: none;
  position: relative;
}

.file-card:hover {
  background: var(--el-fill-color-light);
  border-color: var(--el-color-primary-light-7);
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow-light);
}

.file-card-selected {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.file-card-folder .file-card-icon {
  color: var(--el-color-primary);
}

.file-card-folder .file-card-icon .folder-icon {
  color: #409eff;
}

.file-card-icon {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-info);
}

.file-card-content {
  width: 100%;
  text-align: center;
}

.file-card-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.file-card-meta {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.file-card-divider {
  opacity: 0.5;
}

@media (max-width: 768px) {
  .file-card {
    padding: 20px 12px;
  }

  .file-card-icon {
    margin-bottom: 12px;
  }
}
</style>
