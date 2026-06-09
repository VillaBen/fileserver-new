<template>
  <el-dialog
    v-model="dialogVisible"
    :title="title"
    width="700px"
    :close-on-click-modal="false"
  >
    <div v-if="conflicts.length > 0" class="conflict-list">
      <el-alert
        v-for="(conflict, index) in conflicts"
        :key="index"
        :title="conflict.fileName"
        type="warning"
        :closable="false"
        show-icon
        class="conflict-item"
      >
        <template #default>
          <div class="conflict-info">
            <p><strong>{{ conflict.reason }}</strong></p>
            
            <!-- 比对信息视图 -->
            <div v-if="showCompareView" class="file-compare-full">
              <div class="compare-grid">
                <div class="compare-column">
                  <h4>
                    <el-icon><Document /></el-icon>
                    {{ i18nStore.t('existingFile') || 'Existing' }}
                  </h4>
                  <div class="file-details">
                    <p><strong>{{ i18nStore.t('name') || 'Name' }}:</strong> {{ conflict.existingFile?.name || '-' }}</p>
                    <p><strong>{{ i18nStore.t('size') || 'Size' }}:</strong> {{ formatFileSize(conflict.existingFile?.size) }}</p>
                    <p><strong>{{ i18nStore.t('createdAt') || 'Created' }}:</strong> {{ formatDate(conflict.existingFile?.createdAt) }}</p>
                    <p><strong>{{ i18nStore.t('modifiedAt') || 'Modified' }}:</strong> {{ formatDate(conflict.existingFile?.updatedAt || conflict.existingFile?.createdAt) }}</p>
                    <p><strong>{{ i18nStore.t('type') || 'Type' }}:</strong> {{ getFileTypeDisplay(conflict.existingFile) }}</p>
                  </div>
                </div>
                
                <div class="compare-divider">
                  <el-icon color="#409eff"><ArrowRight /></el-icon>
                </div>
                
                <div class="compare-column new">
                  <h4>
                    <el-icon><Upload /></el-icon>
                    {{ i18nStore.t('newFile') || 'New' }}
                  </h4>
                  <div class="file-details">
                    <p><strong>{{ i18nStore.t('name') || 'Name' }}:</strong> {{ conflict.newFile?.name || conflict.fileName || '-' }}</p>
                    <p><strong>{{ i18nStore.t('size') || 'Size' }}:</strong> {{ formatFileSize(conflict.newFile?.size) }}</p>
                    <p><strong>{{ i18nStore.t('type') || 'Type' }}:</strong> {{ getFileTypeDisplay(conflict.newFile) }}</p>
                    <p><strong>{{ i18nStore.t('uploadTime') || 'Upload Time' }}:</strong> {{ formatDate(new Date()) }}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- 简略视图 -->
            <div v-else-if="conflict.existingFile" class="file-compare">
              <div class="compare-section">
                <h4>{{ i18nStore.t('existingFile') || 'Existing' }}</h4>
                <p>{{ i18nStore.t('name') || 'Name' }}: {{ conflict.existingFile.name }}</p>
                <p>{{ i18nStore.t('size') || 'Size' }}: {{ formatFileSize(conflict.existingFile.size) }}</p>
                <p>{{ i18nStore.t('createdAt') || 'Created' }}: {{ formatDate(conflict.existingFile.createdAt) }}</p>
              </div>
            </div>
          </div>
        </template>
      </el-alert>
    </div>

    <div v-if="!isProcessing" class="action-options">
      <h3>{{ i18nStore.t('selectAction') || 'Please select an action:' }}</h3>
      <el-radio-group v-model="selectedAction" class="action-radio-group">
        <el-radio v-if="isFileConflict" value="keepBoth" class="action-option">
          <div class="action-content">
            <div class="action-icon">
              <el-icon><Files /></el-icon>
            </div>
            <div class="action-text">
              <strong>{{ i18nStore.t('keepBoth') || 'Keep Both' }}</strong>
              <p>{{ i18nStore.t('keepBothDesc') || 'Keep both files with different names' }}</p>
            </div>
          </div>
        </el-radio>
        <el-radio value="replace" class="action-option">
          <div class="action-content">
            <div class="action-icon">
              <el-icon><RefreshLeft /></el-icon>
            </div>
            <div class="action-text">
              <strong>{{ isFolderConflict ? (i18nStore.t('merge') || 'Merge') : (i18nStore.t('replace') || 'Replace') }}</strong>
              <p>{{ isFolderConflict ? (i18nStore.t('mergeDesc') || 'Merge contents into existing folder') : (i18nStore.t('replaceDesc') || 'Replace existing file with new one') }}</p>
            </div>
          </div>
        </el-radio>
        <el-radio value="compare" class="action-option">
          <div class="action-content">
            <div class="action-icon">
              <el-icon><Guide /></el-icon>
            </div>
            <div class="action-text">
              <strong>{{ i18nStore.t('compare') || 'Compare Info' }}</strong>
              <p>{{ i18nStore.t('compareDesc') || 'Show detailed comparison of both' }}</p>
            </div>
          </div>
        </el-radio>
        <el-radio value="skip" class="action-option">
          <div class="action-content">
            <div class="action-icon">
              <el-icon><Close /></el-icon>
            </div>
            <div class="action-text">
              <strong>{{ i18nStore.t('skip') || 'Skip' }}</strong>
              <p>{{ i18nStore.t('skipDesc') || 'Skip this and continue' }}</p>
            </div>
          </div>
        </el-radio>
      </el-radio-group>
    </div>

    <div v-if="isProcessing" class="processing">
      <el-icon :size="24" class="processing-spinning-icon"><Loading /></el-icon>
      <span>{{ i18nStore.t('processing') || 'Processing...' }}</span>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button v-if="showCompareView" @click="hideCompareView">
          <el-icon><Back /></el-icon>
          {{ i18nStore.t('back') || 'Back' }}
        </el-button>
        <el-button @click="handleCancel">{{ i18nStore.t('cancel') || 'Cancel' }}</el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm" 
          :disabled="isProcessing || selectedAction === 'compare'"
        >
          {{ i18nStore.t('confirm') || 'Confirm' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, watch, computed } from 'vue';
import { ElMessage } from 'element-plus';
import { 
  Loading, 
  Document, 
  Upload, 
  ArrowRight, 
  Files, 
  RefreshLeft, 
  Guide, 
  Close,
  Back
} from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';

const i18nStore = useI18nStore();

const dialogVisible = ref(false);
const conflicts = ref([]);
const selectedAction = ref('keepBoth');
const isProcessing = ref(false);
const title = ref('');
const resolvePromise = ref(null);
const showCompareView = ref(false);

// 检测是否是文件夹冲突
const isFolderConflict = computed(() => {
  if (!conflicts.value.length) return false;
  const conflict = conflicts.value[0];
  return (conflict.existingFile?.type === 'folder' || 
          conflict.existingFile?.isFolder || 
          conflict.newFile?.type === 'folder' || 
          conflict.newFile?.isFolder);
});

// 检测是否是文件冲突
const isFileConflict = computed(() => !isFolderConflict.value);

// 监听 selectedAction 变化
watch(selectedAction, (newValue) => {
  if (newValue === 'compare') {
    showCompareView.value = true;
  }
});

const hideCompareView = () => {
  showCompareView.value = false;
  // 根据冲突类型重置默认选项
  selectedAction.value = isFolderConflict.value ? 'merge' : 'keepBoth';
};

const showDialog = (conflictList, dialogTitle) => {
  return new Promise((resolve) => {
    conflicts.value = conflictList || [];
    title.value = dialogTitle || i18nStore.t('fileConflict') || 'File Conflict';
    // 根据冲突类型设置默认选项
    const hasFolderConflict = conflictList?.some(c => 
      c.existingFile?.type === 'folder' || 
      c.existingFile?.isFolder || 
      c.newFile?.type === 'folder' || 
      c.newFile?.isFolder
    );
    selectedAction.value = hasFolderConflict ? 'merge' : 'keepBoth';
    showCompareView.value = false;
    dialogVisible.value = true;
    resolvePromise.value = resolve;
  });
};

const handleConfirm = () => {
  if (resolvePromise.value && selectedAction.value !== 'compare') {
    resolvePromise.value(selectedAction.value);
    dialogVisible.value = false;
  }
};

const handleCancel = () => {
  if (resolvePromise.value) {
    resolvePromise.value('cancel');
  }
  dialogVisible.value = false;
  showCompareView.value = false;
};

const formatFileSize = (bytes) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const formatDate = (date) => {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleString();
};

// 获取文件类型描述
const getFileTypeDisplay = (file) => {
  if (!file) return '-';
  
  // 如果是文件夹
  if (file.isFolder || file.type === 'folder') {
    return 'folder';
  }
  
  // 如果有type字段且不是'file'
  if (file.type && file.type !== 'file') {
    // 如果type是mime类型，尝试提取主要部分
    if (file.type.includes('/')) {
      const [category, subtype] = file.type.split('/');
      const subtypeDisplay = subtype.split(';')[0]; // 去除参数
      return `${category}/${subtypeDisplay}`;
    }
    return file.type;
  }
  
  // 如果没有type，尝试从文件名提取扩展名
  const fileName = file.name || file.fileName;
  if (fileName && fileName.includes('.')) {
    const ext = fileName.split('.').pop().toLowerCase();
    return `.${ext}`;
  }
  
  // 默认返回文件
  return 'file';
};

defineExpose({
  showDialog
});
</script>

<style scoped>
.conflict-list {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 20px;
}

.conflict-item {
  margin-bottom: 10px;
}

.conflict-info p {
  margin: 5px 0;
  color: #666;
}

.file-compare {
  margin-top: 10px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

.compare-section h4 {
  margin: 0 0 5px 0;
  color: #333;
}

/* 详细比对视图样式 */
.file-compare-full {
  margin-top: 15px;
  padding-top: 15px;
  border-top: 1px solid #eee;
}

.compare-grid {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 15px;
  align-items: start;
}

.compare-column {
  background: #f5f7fa;
  padding: 15px;
  border-radius: 8px;
  border: 1px solid #e4e7ed;
}

.compare-column.new {
  background: #ecf5ff;
  border-color: #b3d8ff;
}

.compare-column h4 {
  margin: 0 0 12px 0;
  color: #333;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
}

.file-details p {
  margin: 8px 0;
  color: #606266;
  font-size: 13px;
  line-height: 1.5;
}

.file-details strong {
  color: #303133;
  font-weight: 500;
}

.compare-divider {
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 40px;
}

.compare-divider .el-icon {
  font-size: 24px;
}

.action-options {
  padding: 10px 0;
}

.action-options h3 {
  margin-bottom: 15px;
  font-size: 16px;
  color: #333;
}

.action-radio-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.action-option {
  padding: 12px 15px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  margin: 0;
  width: 100%;
  height: auto;
  transition: all 0.2s ease;
}

.action-option:hover {
  border-color: #409eff;
  background-color: #f5f7fa;
  transform: translateY(-1px);
}

.action-option:deep(.el-radio__label) {
  width: 100%;
}

.action-content {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-left: 8px;
}

.action-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 8px;
  color: white;
  flex-shrink: 0;
}

.action-icon .el-icon {
  font-size: 18px;
}

.action-text {
  flex: 1;
}

.action-text strong {
  color: #333;
  display: block;
  font-size: 14px;
  margin-bottom: 2px;
}

.action-text p {
  margin: 0;
  color: #909399;
  font-size: 12px;
}

.processing {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 20px;
  color: #666;
}

.processing-spinning-icon {
  display: inline-flex;
  animation: processing-spin 1s linear infinite;
}

@keyframes processing-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

@media (max-width: 768px) {
  .compare-grid {
    grid-template-columns: 1fr;
  }
  
  .compare-divider {
    display: none;
  }
}
</style>