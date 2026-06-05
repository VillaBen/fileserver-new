<template>
  <div class="trash-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">{{ i18n.t('trash') }}</h1>
        <p class="page-subtitle">{{ i18n.t('recoverOrDelete') }}</p>
      </div>
      <div class="page-header-right">
        <el-button 
          type="danger" 
          @click="showEmptyDialog = true"
          :disabled="allTrashedItems.length === 0"
        >
          <el-icon><Delete /></el-icon>
          {{ i18n.t('emptyTrash') }}
        </el-button>
      </div>
    </div>
    
    <div class="trash-container">
      <div v-if="loading" class="loading-wrapper">
        <LoadingSpinner :text="i18n.t('loadingFiles')" />
      </div>
      
      <EmptyState
        v-else-if="allTrashedItems.length === 0"
        type="trash"
        :title="i18n.t('trashEmpty')"
        :description="i18n.t('deletedFilesHere')"
      />
      
      <div v-else class="trash-list">
        <div class="trash-grid">
          <div 
            v-for="file in allTrashedItems" 
            :key="file.id" 
            class="trash-card"
            @click="viewFile(file)"
          >
            <div class="trash-card-header">
              <div class="trash-icon">
                <el-icon :size="32">
                  <Folder v-if="file.type === 'folder' || file.is_folder" />
                  <Document v-else />
                </el-icon>
              </div>
              <el-dropdown trigger="click" @command="(cmd) => handleFileCommand(cmd, file)">
                <el-button link>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="restore">
                      <el-icon><RefreshRight /></el-icon>
                      {{ i18n.t('restore') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      {{ i18n.t('permanentlyDelete') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="trash-card-body">
              <h3 class="trash-name">{{ file.name }}</h3>
              <div class="trash-meta">
                <span class="trash-size" v-if="file.type !== 'folder' && !file.is_folder">
                  {{ formatFileSize(file.size) }}
                </span>
                <span class="trash-size" v-else>
                  {{ file.item_count || file.itemCount || 0 }} {{ i18n.t('items') }}
                </span>
                <span class="trash-date">
                  <el-icon><Clock /></el-icon>
                  {{ i18n.t('deletedOn') }} {{ formatDate(file.deletedAt || file.deleted_at) }}
                </span>
                <span class="trash-expires">
                  <el-icon><Timer /></el-icon>
                  {{ i18n.t('expiresIn') }} {{ formatExpiry(file.expiresAt || file.expires_at) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="i18n.t('permanentlyDelete')"
      :message="i18n.t('deleteConfirmMessage')"
      :description="i18n.t('deleteConfirmDescription')"
      type="danger"
      :confirm-text="i18n.t('permanentlyDelete')"
      :cancel-text="i18n.t('cancel')"
      confirm-type="danger"
      :confirm-loading="deleting"
      @confirm="confirmDelete"
    />

    <!-- Empty Trash Dialog -->
    <ConfirmDialog
      v-model="showEmptyDialog"
      :title="i18n.t('emptyTrash')"
      :message="i18n.t('emptyTrashConfirm')"
      :description="i18n.t('emptyTrashDescription')"
      type="danger"
      :confirm-text="i18n.t('emptyTrash')"
      :cancel-text="i18n.t('cancel')"
      confirm-type="danger"
      :confirm-loading="emptying"
      @confirm="confirmEmptyTrash"
    />

    <!-- File Conflict Dialog -->
    <FileConflictDialog ref="conflictDialog" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Folder, Document, Delete, MoreFilled, RefreshRight, Clock, Timer } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { useTrashStore } from '../stores/trash';
import { filesAPI } from '../api';
import { toast } from '../utils/toast';
import { formatDate, formatFileSize } from '../utils/format';
import EmptyState from '../components/EmptyState.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';
import FileConflictDialog from '../components/FileConflictDialog.vue';

const i18n = useI18nStore();
const trashStore = useTrashStore();

const loading = computed(() => trashStore.isLoading);
const showDeleteDialog = ref(false);
const showEmptyDialog = ref(false);
const deleting = ref(false);
const emptying = ref(false);
const currentFile = ref(null);
const conflictDialog = ref(null);

const trashedFiles = computed(() => trashStore.trashedFiles);
const trashedFolders = computed(() => trashStore.trashedFolders);

const allTrashedItems = computed(() => {
  const folders = trashedFolders.value.map(folder => ({
    ...folder,
    type: 'folder',
    is_folder: true
  }));
  const files = trashedFiles.value.map(file => ({
    ...file,
    type: 'file',
    is_folder: false
  }));
  return [...folders, ...files];
});

onMounted(async () => {
  await loadTrash();
});

const loadTrash = async () => {
  await trashStore.loadTrash();
};

const viewFile = (file) => {
  toast.info(i18n.t('viewFile') || 'Viewing file details...');
};

const handleFileCommand = (command, file) => {
  currentFile.value = file;
  
  switch (command) {
    case 'restore':
      restoreFile(file);
      break;
    case 'delete':
      showDeleteDialog.value = true;
      break;
  }
};

const restoreFile = async (file) => {
  try {
    // 检查冲突
    let conflictAction = 'keepBoth';
    const conflictResponse = await filesAPI.checkConflict({
      fileName: file.name || file.original_name,
      folderId: file.folder_id,
      action: 'upload'
    });
    
    if (conflictResponse.success && conflictResponse.data?.hasConflict) {
      const conflicts = [{
        fileName: file.name || file.original_name,
        reason: i18n.t('fileExists') || 'File already exists',
        existingFile: conflictResponse.data.existingFile,
        newFile: {
          name: file.name || file.original_name,
          size: file.size,
          type: file.type
        }
      }];
      
      if (conflictDialog.value) {
        conflictAction = await conflictDialog.value.showDialog(
          conflicts,
          i18n.t('fileConflict') || 'File Conflict'
        );
        
        if (conflictAction === 'cancel') {
          return;
        }
      }
    }
    
    await trashStore.restoreFile(file.id, conflictAction);
  } catch (error) {
    toast.error(error.error || i18n.t('restoreFailed') || 'Failed to restore file');
  }
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await trashStore.deletePermanently(currentFile.value.id);
    showDeleteDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('deleteFailed') || 'Failed to delete file');
  } finally {
    deleting.value = false;
  }
};

const confirmEmptyTrash = async () => {
  emptying.value = true;
  try {
    await trashStore.emptyTrash();
    showEmptyDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('emptyTrashFailed') || 'Failed to empty trash');
  } finally {
    emptying.value = false;
  }
};

const formatExpiry = (date) => {
  if (!date) return i18n.t('notAutoDelete') || '不会自动删除';
  const diff = new Date(date) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return i18n.t('today') || 'Today';
  if (days === 1) return i18n.t('tomorrow') || 'Tomorrow';
  if (days < 0) return `${Math.abs(days)} ${i18n.t('daysAgo') || 'days ago'}`;
  return `${days} ${i18n.t('days') || 'days'}`;
};
</script>

<style scoped>
.trash-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.page-header-right {
  flex-shrink: 0;
}

.trash-container {
  min-height: 400px;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.trash-list {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
}

.trash-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 20px;
}

.trash-card {
  background: white;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  cursor: pointer;
}

.trash-card:hover {
  border-color: var(--el-color-danger-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.trash-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.trash-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--el-color-danger) 0%, var(--el-color-danger-light-3) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.trash-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.trash-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.trash-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.trash-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .trash-grid {
    grid-template-columns: 1fr;
  }
}
</style>
