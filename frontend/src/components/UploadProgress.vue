<template>
  <div class="upload-progress-container">
    <!-- 总体上传进度 -->
    <div class="overall-progress" v-if="hasActiveOrPending">
      <div class="progress-header">
        <h3>{{ i18n.t('uploadingFiles') || '正在上传' }}</h3>
        <span class="progress-percentage">{{ overallProgress }}%</span>
      </div>
      <el-progress :percentage="overallProgress" :stroke-width="8" :show-text="false" />
    </div>

    <!-- 上传列表 -->
    <div class="upload-list">
      <!-- 正在上传 -->
      <div v-for="upload in activeUploads" :key="upload.id" class="upload-item uploading">
        <div class="upload-item-header">
          <div class="file-info">
            <el-icon class="file-icon"><Document /></el-icon>
            <span class="file-name">{{ upload.name }}</span>
            <span class="file-size">{{ formatFileSize(upload.size) }}</span>
          </div>
          <div class="upload-controls">
            <el-button link size="small" @click="pauseUpload(upload.id)">
              <el-icon><VideoPause /></el-icon>
            </el-button>
            <el-button link type="danger" size="small" @click="confirmCancel(upload.id)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <el-progress 
          :percentage="upload.progress" 
          :stroke-width="6" 
          :status="upload.progress === 100 ? 'success' : ''"
        />
        <span class="status-text">{{ getStatusText(upload.status) }}</span>
      </div>

      <!-- 队列中 -->
      <div v-for="upload in uploadQueue" :key="upload.id" class="upload-item pending">
        <div class="upload-item-header">
          <div class="file-info">
            <el-icon class="file-icon"><Clock /></el-icon>
            <span class="file-name">{{ upload.name }}</span>
            <span class="file-size">{{ formatFileSize(upload.size) }}</span>
          </div>
          <div class="upload-controls">
            <el-button 
              v-if="upload.status === 'paused'" 
              link 
              type="primary" 
              size="small" 
              @click="resumeUpload(upload.id)"
            >
              <el-icon><VideoPlay /></el-icon>
            </el-button>
            <el-button link type="danger" size="small" @click="confirmCancel(upload.id)">
              <el-icon><Close /></el-icon>
            </el-button>
          </div>
        </div>
        <span class="status-text">{{ getStatusText(upload.status) }}</span>
      </div>

      <!-- 已完成 -->
      <div v-for="upload in completedUploads" :key="upload.id" class="upload-item completed">
        <div class="upload-item-header">
          <div class="file-info">
            <el-icon class="file-icon success"><CircleCheck /></el-icon>
            <span class="file-name">{{ upload.name }}</span>
            <span class="file-size">{{ formatFileSize(upload.size) }}</span>
          </div>
        </div>
        <span class="status-text success">{{ i18n.t('uploadComplete') || '上传完成' }}</span>
      </div>

      <!-- 失败的 -->
      <div v-for="upload in failedUploads" :key="upload.id" class="upload-item failed">
        <div class="upload-item-header">
          <div class="file-info">
            <el-icon class="file-icon danger"><CircleClose /></el-icon>
            <span class="file-name">{{ upload.name }}</span>
            <span class="file-size">{{ formatFileSize(upload.size) }}</span>
          </div>
          <div class="upload-controls">
            <el-button link type="primary" size="small" @click="retryUpload(upload.id)">
              <el-icon><Refresh /></el-icon>
            </el-button>
          </div>
        </div>
        <span class="status-text danger">{{ i18n.t('uploadFailed') || '上传失败' }}</span>
      </div>
    </div>

    <!-- 底部操作 -->
    <div class="upload-footer" v-if="hasAnyUploads">
      <el-button link size="small" @click="clearAllUploads">
        {{ i18n.t('clearAll') || '清空全部' }}
      </el-button>
      <el-button v-if="hasFailedUploads" type="primary" size="small" @click="retryAllFailed">
        <el-icon><Refresh /></el-icon>
        {{ i18n.t('retryAll') || '重新上传失败项' }}
      </el-button>
    </div>
  </div>
</template>

<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue';
import { Document, Clock, CircleCheck, CircleClose, VideoPause, VideoPlay, Close, Refresh } from '@element-plus/icons-vue';
import { ElMessageBox } from 'element-plus';
import { useI18nStore } from '../stores/i18n';
import { useFilesStore } from '../stores/files';
import { formatFileSize } from '../utils/format';

const i18n = useI18nStore();
const filesStore = useFilesStore();

// 计算属性
const uploadQueue = computed(() => filesStore.uploadQueue);
const activeUploads = computed(() => filesStore.activeUploads);
const completedUploads = computed(() => filesStore.completedUploads);
const failedUploads = computed(() => filesStore.failedUploads);
const overallProgress = computed(() => filesStore.uploadProgress);

const hasActiveOrPending = computed(() =>
  uploadQueue.value.length > 0 || activeUploads.value.length > 0
);

const hasAnyUploads = computed(() =>
  uploadQueue.value.length > 0 || activeUploads.value.length > 0 ||
  completedUploads.value.length > 0 || failedUploads.value.length > 0
);

const hasFailedUploads = computed(() => failedUploads.value.length > 0);

// 自动清理：所有上传都完成且没有失败时，3秒后自动清理
let autoClearTimer = null;

watch([activeUploads, uploadQueue], ([newActive, newQueue]) => {
  if (newActive.length === 0 && newQueue.length === 0 && hasAnyUploads.value) {
    // 检查是否只有完成的上传（没有失败的）
    if (failedUploads.value.length === 0 && completedUploads.value.length > 0) {
      // 清理旧的定时器
      if (autoClearTimer) {
        clearTimeout(autoClearTimer);
      }
      // 3秒后自动清理
      autoClearTimer = setTimeout(() => {
        filesStore.clearUploads();
      }, 3000);
    }
  } else {
    // 有新的上传开始，取消自动清理
    if (autoClearTimer) {
      clearTimeout(autoClearTimer);
      autoClearTimer = null;
    }
  }
}, { deep: true });

onUnmounted(() => {
  if (autoClearTimer) {
    clearTimeout(autoClearTimer);
  }
});

// 方法
function getStatusText(status) {
  const statusMap = {
    'pending': i18n.t('pending') || '等待中',
    'uploading': i18n.t('uploading') || '上传中',
    'processing': i18n.t('processing') || '处理中',
    'completed': i18n.t('completed') || '已完成',
    'failed': i18n.t('failed') || '失败',
    'paused': i18n.t('paused') || '已暂停',
  };
  return statusMap[status] || status;
}

function pauseUpload(uploadId) {
  filesStore.pauseUpload(uploadId);
}

function resumeUpload(uploadId) {
  filesStore.resumeUpload(uploadId);
  filesStore.startUploads();
}

async function confirmCancel(uploadId) {
  try {
    await ElMessageBox.confirm(
      i18n.t('confirmCancelUpload') || '确定要取消该文件的上传吗？',
      i18n.t('confirm') || '确认',
      {
        confirmButtonText: i18n.t('confirm') || '确定',
        cancelButtonText: i18n.t('cancel') || '取消',
        type: 'warning',
      }
    );
    filesStore.cancelUpload(uploadId);
  } catch {
    // 用户取消
  }
}

function retryUpload(uploadId) {
  // 通过 filesStore 重试上传，而不是直接修改 computed 返回的对象
  filesStore.retryUpload(uploadId);
}

function retryAllFailed() {
  filesStore.retryFailedUploads();
}

function clearAllUploads() {
  filesStore.clearUploads();
}
</script>

<style scoped>
.upload-progress-container {
  max-height: 400px;
  overflow-y: auto;
}

.overall-progress {
  padding: 16px;
  background: var(--el-fill-color-lighter);
  border-radius: 8px;
  margin-bottom: 16px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.progress-header h3 {
  margin: 0;
  font-size: 16px;
}

.progress-percentage {
  font-weight: bold;
  color: var(--el-color-primary);
}

.upload-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.upload-item {
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lightest);
}

.upload-item.uploading {
  border: 1px solid var(--el-color-primary-light-7);
}

.upload-item.completed {
  border: 1px solid var(--el-color-success-light-7);
}

.upload-item.failed {
  border: 1px solid var(--el-color-danger-light-7);
}

.upload-item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.file-icon {
  font-size: 20px;
  color: var(--el-color-primary);
  flex-shrink: 0;
}

.file-icon.success {
  color: var(--el-color-success);
}

.file-icon.danger {
  color: var(--el-color-danger);
}

.file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 300px;
}

.file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  flex-shrink: 0;
}

.upload-controls {
  display: flex;
  gap: 4px;
  flex-shrink: 0;
}

.status-text {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.status-text.success {
  color: var(--el-color-success);
}

.status-text.danger {
  color: var(--el-color-danger);
}

.upload-footer {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}
</style>
