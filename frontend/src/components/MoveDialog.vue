<template>
  <div v-if="visible" class="move-dialog-overlay" @click.self="close">
    <div class="move-dialog">
      <div class="move-dialog-header">
        <h3>{{ i18n.t('moveTo') || '移动到' }}</h3>
        <button @click="close" class="close-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="move-dialog-body">
        <div class="folder-tree">
          <div
            class="folder-item"
            :class="{ active: selectedFolderId === null }"
            @click="selectFolder(null)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{{ i18n.t('rootFolder') || '根目录' }}</span>
          </div>
          <div
            v-for="folder in availableFolders"
            :key="folder.id"
            class="folder-item"
            :class="{ active: selectedFolderId === folder.id }"
            @click="selectFolder(folder.id)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
            </svg>
            <span>{{ folder.name }}</span>
          </div>
        </div>
      </div>
      <div class="move-dialog-footer">
        <button @click="close" class="btn-cancel">{{ i18n.t('cancel') || '取消' }}</button>
        <button @click="confirmMove" class="btn-primary" :disabled="isMoving">
          {{ isMoving ? (i18n.t('moving') || '移动中...') : (i18n.t('confirmMove') || '确认移动') }}
        </button>
      </div>
    </div>
    
    <!-- 文件冲突对话框 -->
    <FileConflictDialog ref="conflictDialog" />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';
import { useFilesStore } from '../stores/files';
import { useI18nStore } from '../stores/i18n';
import { filesAPI } from '../api';
import { toast } from '../utils/toast';
import FileConflictDialog from './FileConflictDialog.vue';

const props = defineProps({
  visible: { type: Boolean, default: false },
  fileIds: { type: Array, default: () => [] },
});

const emit = defineEmits(['close', 'moved']);

const filesStore = useFilesStore();
const i18n = useI18nStore();

const selectedFolderId = ref(null);
const isMoving = ref(false);
const conflictDialog = ref(null);

const availableFolders = computed(() => {
  return filesStore.folders.filter(folder => !props.fileIds.includes(folder.id));
});

function selectFolder(folderId) {
  selectedFolderId.value = folderId;
}

async function confirmMove() {
  if (props.fileIds.length === 0) {
    close();
    return;
  }

  // 收集要移动的所有文件/文件夹信息
  const itemsToMove = [];
  for (const fileId of props.fileIds) {
    const file = filesStore.files.find(f => f.id === fileId);
    const folder = filesStore.folders.find(f => f.id === fileId);
    if (file) {
      itemsToMove.push({ ...file, type: 'file' });
    } else if (folder) {
      itemsToMove.push({ ...folder, type: 'folder', isFolder: true });
    }
  }

  isMoving.value = true;
  let conflictAction = 'skip';
  let conflictsResolved = false;
  
  try {
    // 检查冲突
    const conflicts = [];
    for (const item of itemsToMove) {
      const response = await filesAPI.checkConflict({
        fileName: item.name,
        folderId: selectedFolderId.value,
        action: 'move'
      });
      
      if (response.success && response.data?.hasConflict) {
        conflicts.push({
          fileName: item.name,
          reason: i18n.t('itemExists') || 'Item already exists',
          existingFile: response.data.existingFile,
          newFile: {
            name: item.name,
            size: item.size || 0,
            type: item.type,
            isFolder: item.isFolder || item.type === 'folder'
          }
        });
      }
    }
    
    // 如果有冲突，显示对话框
    if (conflicts.length > 0 && conflictDialog.value) {
      conflictAction = await conflictDialog.value.showDialog(
        conflicts,
        i18n.t('moveConflict') || 'Move Conflict'
      );
      
      if (conflictAction === 'cancel') {
        isMoving.value = false;
        return;
      }
      
      conflictsResolved = true;
    } else {
      // 没有冲突，使用默认操作
      conflictAction = 'replace'; // 对于移动，默认替换/合并
    }
    
    await filesStore.moveFile(props.fileIds, selectedFolderId.value, conflictAction);
    emit('moved');
    close();
  } catch (error) {
    console.error('Move failed:', error);
  } finally {
    isMoving.value = false;
  }
}

function close() {
  selectedFolderId.value = null;
  emit('close');
}
</script>

<style scoped>
.move-dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.move-dialog {
  background: white;
  border-radius: 12px;
  width: 90%;
  max-width: 500px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.move-dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid #eee;
}

.move-dialog-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
}

.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.move-dialog-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

.folder-tree {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.folder-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
  color: #333;
}

.folder-item:hover {
  background: #f5f5f5;
}

.folder-item.active {
  background: #e6f2ff;
  color: #1976d2;
}

.folder-item svg {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.folder-item span {
  font-size: 14px;
}

.move-dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: flex-end;
  padding: 16px 24px;
  border-top: 1px solid #eee;
}

.btn-cancel {
  padding: 10px 24px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background: white;
  color: #666;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f5f5f5;
  border-color: #ccc;
}

.btn-primary {
  padding: 10px 24px;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #1976d2, #42a5f5);
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: linear-gradient(135deg, #1565c0, #1e88e5);
  transform: translateY(-1px);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}
</style>
