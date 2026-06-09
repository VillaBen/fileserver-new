<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <Breadcrumb 
        :items="breadcrumbItems" 
        @navigate="handleBreadcrumbNavigate" 
      />
      <div class="dashboard-actions">
        <el-button type="primary" @click="showUploadDialog = true" class="upload-btn">
          <el-icon><Upload /></el-icon>
          {{ i18n.t('uploadFiles') }}
        </el-button>
        <el-button @click="showCreateFolderDialog = true">
          <el-icon><FolderAdd /></el-icon>
          {{ i18n.t('createFolder') }}
        </el-button>
        <el-button 
          v-if="selectedFiles.length > 0" 
          @click="handleMoveSelected"
          type="warning"
        >
          <el-icon><Sort /></el-icon>
          {{ i18n.t('move') }}
        </el-button>
        <el-input
            v-model="searchQuery"
            :placeholder="i18n.t('searchFiles')"
            prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearchInput"
          />
        <div class="sort-options">
          <el-select 
            v-model="sortBy" 
            size="small"
            style="width: 140px;"
            @change="handleSortChange"
          >
            <el-option label="name" :value="'name'">
              <span>{{ i18n.t('sortByName') || 'Name' }}</span>
            </el-option>
            <el-option label="size" :value="'size'">
              <span>{{ i18n.t('sortBySize') || 'Size' }}</span>
            </el-option>
            <el-option label="date" :value="'date'">
              <span>{{ i18n.t('sortByDate') || 'Date' }}</span>
            </el-option>
          </el-select>
          <el-button
            size="small"
            circle
            @click="toggleSortOrder"
          >
            <el-icon v-if="sortOrder === 'asc'"><ArrowUp /></el-icon>
            <el-icon v-else><ArrowDown /></el-icon>
          </el-button>
        </div>
        <div class="view-toggle">
          <el-tooltip :content="i18n.t('gridView') || 'Grid View'">
            <el-button
              :type="viewMode === 'grid' ? 'primary' : 'default'"
              circle
              @click="viewMode = 'grid'"
            >
              <el-icon><Grid /></el-icon>
            </el-button>
          </el-tooltip>
          <el-tooltip :content="i18n.t('listView') || 'List View'">
            <el-button
              :type="viewMode === 'list' ? 'primary' : 'default'"
              circle
              @click="viewMode = 'list'"
            >
              <el-icon><List /></el-icon>
            </el-button>
          </el-tooltip>
        </div>
      </div>
      
      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">
            <el-icon :size="40"><Folder /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.files }}</div>
            <div class="stat-label">{{ i18n.t('totalFiles') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #67c23a 0%, #5daf34 100%);">
            <el-icon :size="40"><TrendCharts /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.folders }}</div>
            <div class="stat-label">{{ i18n.t('folders') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #909399 0%, #82848a 100%);">
            <el-icon :size="40"><Download /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.usedSpace }}</div>
            <div class="stat-label">{{ i18n.t('usedSpace') }}</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon" style="background: linear-gradient(135deg, #e6a23c 0%, #d4922a 100%);">
            <el-icon :size="40"><Share /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ stats.shared }}</div>
            <div class="stat-label">{{ i18n.t('sharedFiles') }}</div>
          </div>
        </div>
        <!-- Admin Portal Entry -->
        <div v-if="isAdmin" class="stat-card admin-card" @click="goToAdmin">
          <div class="stat-icon" style="background: linear-gradient(135deg, #f56c6c 0%, #e04040 100%);">
            <el-icon :size="40"><Setting /></el-icon>
          </div>
          <div class="stat-content">
            <div class="stat-value">{{ i18n.t('adminPortal') || 'Admin' }}</div>
            <div class="stat-label">{{ i18n.t('adminPortalDesc') || 'Management Center' }}</div>
          </div>
        </div>
      </div>
      
      <!-- Upload Progress -->
      <div v-if="filesStore.isUploading || filesStore.completedUploads.length > 0 || filesStore.failedUploads.length > 0" class="upload-progress-section">
        <UploadProgress />
      </div>

      <!-- File Section -->
      <div class="file-section">
        <div v-if="loading" class="loading-wrapper">
          <LoadingSpinner :text="i18n.t('loadingFiles') || 'Loading files...'" />
        </div>
        <EmptyState
          v-else-if="filteredFiles.length === 0 && searchQuery"
          type="search"
          :title="i18n.t('noResults') || 'No results found'"
          :description="i18n.t('tryDifferentKeywords') || 'Try different keywords'"
        />
        <EmptyState
          v-else-if="filteredFiles.length === 0"
          type="files"
          :title="i18n.t('noFiles') || 'No files yet'"
          :description="i18n.t('uploadFilesDescription') || 'Upload files to get started'"
        >
          <template #actions>
            <el-button type="primary" @click="showUploadDialog = true">
              <el-icon><Upload /></el-icon>
              {{ i18n.t('uploadFiles') }}
            </el-button>
          </template>
        </EmptyState>
        <div v-else-if="viewMode === 'grid'" class="grid-view">
          <FileCard
            v-for="file in filteredFiles"
            :key="file.id"
            :file="file"
            :selected="selectedFiles.includes(file.id)"
            @click="handleFileClick(file, $event)"
            @dblclick="handleFileDoubleClick(file)"
          />
        </div>
        <div v-else class="list-view">
          <el-table :data="filteredFiles" style="width: 100%" @row-click="handleFileClick">
            <el-table-column prop="name" :label="i18n.t('name')" min-width="300">
              <template #default="{ row }">
                <div class="list-item-name">
                  <el-icon v-if="row.type === 'folder'" class="list-item-icon"><Folder /></el-icon>
                  <el-icon v-else class="list-item-icon"><Document /></el-icon>
                  {{ row.name || 'Unnamed file' }}
                </div>
              </template>
            </el-table-column>
            <el-table-column prop="size" :label="i18n.t('size')" width="150">
              <template #default="{ row }">
                {{ row.type === 'folder' ? '-' : formatFileSize(row.size) }}
              </template>
            </el-table-column>
            <el-table-column prop="updated_at" :label="i18n.t('modified')" width="180">
              <template #default="{ row }">
                {{ formatDate(row.updated_at || row.created_at) }}
              </template>
            </el-table-column>
            <el-table-column label="安全状态" width="120">
              <template #default="{ row }">
                <div 
                  v-if="row.type === 'file'" 
                  class="security-status-wrapper"
                  @click.stop="showScanResult(row)"
                >
                  <el-tooltip :content="getSecurityStatusText(row)" placement="top">
                    <el-icon :size="18" class="security-status-icon" :class="row.securityStatus">
                      <CircleCheck v-if="row.securityStatus === 'safe'" />
                      <Warning v-else-if="row.securityStatus === 'warning'" />
                      <CircleClose v-else-if="row.securityStatus === 'dangerous'" />
                      <QuestionFilled v-else class="unknown" />
                    </el-icon>
                  </el-tooltip>
                </div>
                <span v-else class="security-status-muted">-</span>
              </template>
            </el-table-column>
            <el-table-column :label="i18n.t('actions')" width="350" fixed="right">
              <template #default="{ row }">
                <el-button 
                  v-if="row.type === 'file'" 
                  link type="primary" size="small" 
                  @click.stop="handlePreview(row)"
                >
                  <el-icon><Document /></el-icon>
                </el-button>
                <el-button 
                  v-if="row.type === 'file'" 
                  link type="success" size="small" 
                  @click.stop="handleDownload(row)"
                >
                  <el-icon><Download /></el-icon>
                </el-button>
                <el-button 
                  v-if="row.type === 'file'" 
                  link type="info" size="small" 
                  @click.stop="handleShare(row)"
                >
                  <el-icon><Share /></el-icon>
                </el-button>
                <el-button link type="info" size="small" @click.stop="handleMove(row)">
                  <el-icon><Sort /></el-icon>
                </el-button>
                <el-button link type="warning" size="small" @click.stop="handleRename(row)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button link type="danger" size="small" @click.stop="handleDelete(row)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <el-dialog v-model="showUploadDialog" :title="i18n.t('uploadFiles')" width="500px">
      <el-upload
        drag
        action="#"
        :auto-upload="false"
        v-model:file-list="uploadFiles"
        multiple
        :show-file-list="false"
        :accept="allowedFileTypes"
        @change="handleFileChange"
        :before-upload="beforeUpload"
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">{{ i18n.t('dropFilesHere') }}<em>{{ i18n.t('clickToUpload') }}</em></div>
        <template #tip>
          <div class="el-upload__tip">{{ i18n.t('uploadTip') }}</div>
        </template>
      </el-upload>
      
      <!-- Custom file list with security status and delete icon -->
      <div v-if="uploadFiles.length > 0" class="upload-file-list">
        <div v-for="(file, index) in uploadFiles" :key="index" class="upload-file-item">
          <div class="file-icon">
            <Document />
          </div>
          <div class="file-info">
            <div class="file-name">{{ file.name }}</div>
            <div class="file-size">{{ formatFileSize(file.size) }}</div>
          </div>
          <div class="file-security-status">
            <el-tooltip :content="file.securityStatusText || 'Scanning...'" placement="top">
              <el-icon :size="18">
                <Loading v-if="file.scanning" class="spinning" />
                <CircleCheck v-else-if="file.securityStatus === 'safe'" class="safe" />
                <Warning v-else-if="file.securityStatus === 'warning'" class="warning" />
                <CircleClose v-else-if="file.securityStatus === 'dangerous'" class="danger" />
                <QuestionFilled v-else class="unknown" />
              </el-icon>
            </el-tooltip>
          </div>
          <div class="file-actions">
            <el-button 
              link 
              @click="removeUploadFile(index)" 
              class="delete-btn"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseUploadDialog">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading" :disabled="uploadFiles.length === 0 || isScanningFiles || hasDangerousFiles">
          {{ i18n.t('confirm') }}
        </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Create Folder Dialog -->
    <el-dialog v-model="showCreateFolderDialog" :title="i18n.t('createFolder')" width="400px" @close="handleCloseCreateFolderDialog">
      <el-form :model="newFolder" label-position="top">
        <el-form-item :label="i18n.t('folderName')">
          <el-input 
            v-model="newFolder.name" 
            :placeholder="i18n.t('enterFolderName')" 
            @input="handleFolderNameInput"
            @keyup.enter="handleCreateFolder" 
          />
        </el-form-item>
        
        <transition name="fade">
          <div v-if="showFilterWarning" class="filter-warning">
            <el-icon class="warning-icon"><Warning /></el-icon>
            <span>{{ i18n.t('invalidCharactersRemoved') || '部分字符不支持，已自动过滤' }}</span>
          </div>
        </transition>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseCreateFolderDialog">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="handleCreateFolder">{{ i18n.t('confirm') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Rename Dialog -->
    <el-dialog v-model="showRenameDialog" :title="i18n.t('rename')" width="400px">
      <el-form :model="renameForm" label-position="top">
        <el-form-item :label="i18n.t('newName')">
          <el-input 
            v-model="renameForm.name" 
            :placeholder="i18n.t('enterNewName')" 
            @input="handleRenameInput"
            @keyup.enter="handleConfirmRename" 
          />
        </el-form-item>
        
        <transition name="fade">
          <div v-if="showRenameFilterWarning" class="filter-warning">
            <el-icon class="warning-icon"><Warning /></el-icon>
            <span>{{ i18n.t('invalidCharactersRemoved') || '部分字符不支持，已自动过滤' }}</span>
          </div>
        </transition>
      </el-form>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showRenameDialog = false">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="handleConfirmRename" :loading="renaming">
            {{ i18n.t('confirm') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="i18n.t('deleteFile')"
      :message="i18n.t('deleteConfirmMessage')"
      :description="i18n.t('deleteConfirmDescription')"
      type="danger"
      :confirm-text="i18n.t('delete')"
      :cancel-text="i18n.t('cancel')"
      confirm-type="danger"
      :confirm-loading="deleting"
      @confirm="handleConfirmDelete"
    />

    <!-- Move Dialog -->
    <MoveDialog
      :visible="showMoveDialog"
      :file-ids="filesToMove"
      @close="showMoveDialog = false"
      @moved="handleMoveComplete"
    />

    <!-- Preview Dialog -->
    <el-dialog 
      v-model="showPreviewDialog" 
      :title="previewFile?.name"
      width="80%"
      top="5vh"
      class="preview-dialog"
    >
      <div v-if="previewLoading" class="preview-loading">
        <LoadingSpinner :text="i18n.t('loadingPreview') || 'Loading preview...'" />
      </div>
      <div v-else-if="previewUrl" class="preview-content">
        <img 
          v-if="isImageFile(previewFile)"
          :src="previewUrl"
          :alt="previewFile?.name"
          class="preview-image"
        />
        <div v-else-if="isPDFFile(previewFile)" class="pdf-container">
          <iframe :src="previewUrl" class="pdf-preview" />
        </div>
        <video 
          v-else-if="isVideoFile(previewFile)"
          :src="previewUrl"
          controls
          class="preview-video"
        />
        <audio 
          v-else-if="isAudioFile(previewFile)"
          :src="previewUrl"
          controls
          class="preview-audio"
        />
        <div 
          v-else-if="isTextFile(previewFile)"
          class="text-container"
          ref="textContainerRef"
        >
          <pre class="text-preview">{{ textContent }}</pre>
        </div>
        <div v-else class="unsupported-preview">
          <el-icon :size="80" class="unsupported-icon"><Document /></el-icon>
          <p>{{ i18n.t('previewNotSupported') || 'Preview not supported for this file type' }}</p>
          <el-button type="primary" @click="downloadPreviewFile">
            <el-icon><Download /></el-icon>
            {{ i18n.t('download') }}
          </el-button>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showPreviewDialog = false">{{ i18n.t('close') }}</el-button>
          <el-button type="primary" @click="downloadPreviewFile" v-if="previewFile">
            <el-icon><Download /></el-icon>
            {{ i18n.t('download') }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Share Dialog -->
    <el-dialog 
      v-model="showShareDialog" 
      :title="i18n.t('shareFile') || 'Share File'"
      width="500px"
    >
      <el-form :model="shareForm" label-position="top">
        <el-form-item :label="i18n.t('expirationDate') || 'Expiration Date'">
          <el-date-picker
            v-model="shareForm.expiresAt"
            type="datetime"
            :placeholder="i18n.t('selectDate') || 'Select date'"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        
        <el-form-item :label="i18n.t('maxDownloads') || 'Max Downloads'">
          <el-input-number 
            v-model="shareForm.maxDownloads" 
            :min="1" 
            :max="1000"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item :label="i18n.t('password') || 'Password'">
          <el-input 
            v-model="shareForm.password" 
            type="password"
            show-password
            :placeholder="i18n.t('enterPassword') || 'Enter password (optional)'"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showShareDialog = false">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="handleShareConfirm" :loading="shareLoading">
            {{ i18n.t('share') || 'Share' }}
          </el-button>
        </div>
      </template>
    </el-dialog>

    <!-- Scan Result Detail Dialog -->
    <el-dialog
      v-model="showScanResultDialog"
      :title="'扫描详情 - ' + (currentScanFile?.name || '')"
      width="560px"
    >
      <div v-if="loadingScanResult" class="scan-result-loading">
        <el-icon class="is-loading"><Loading /></el-icon>
        <span>加载中...</span>
      </div>
      <div v-else-if="scanResult" class="scan-result-content">
        <div class="scan-status-row" :class="scanResult.securityStatus">
          <el-icon :size="28">
            <CircleCheck v-if="scanResult.securityStatus === 'safe'" />
            <Warning v-else-if="scanResult.securityStatus === 'warning'" />
            <CircleClose v-else-if="scanResult.securityStatus === 'dangerous'" />
            <QuestionFilled v-else />
          </el-icon>
          <span class="status-label">
            {{ getSecurityStatusText(scanResult) }}
          </span>
        </div>

        <!-- 扫描步骤展示 -->
        <div class="scan-steps">
          <div class="scan-steps-title">扫描步骤</div>
          <div class="scan-steps-list">
            <div
              v-for="(step, idx) in getScanSteps(scanResult)"
              :key="idx"
              class="scan-step-item"
              :class="step.status"
            >
              <div class="scan-step-icon">
                <CircleCheck v-if="step.status === 'passed'" :size="16" />
                <Warning v-else-if="step.status === 'warning'" :size="16" />
                <CircleClose v-else-if="step.status === 'failed'" :size="16" />
                <QuestionFilled v-else :size="16" />
              </div>
              <div class="scan-step-info">
                <div class="scan-step-name">{{ step.name }}</div>
                <div class="scan-step-desc">{{ step.description }}</div>
              </div>
            </div>
          </div>
        </div>

        <el-descriptions :column="1" border class="scan-descriptions">
          <el-descriptions-item label="扫描模式">
            {{ getScanModeDisplay(scanResult.scanMode) }}
          </el-descriptions-item>
          <el-descriptions-item label="扫描时间">
            {{ formatDate(scanResult.scanAt) }}
          </el-descriptions-item>
          <el-descriptions-item label="扫描详情">
            {{ scanResult.details || '无' }}
          </el-descriptions-item>
          <el-descriptions-item v-if="scanResult.warnings && scanResult.warnings.length > 0" label="警告">
            <ul class="warning-list">
              <li v-for="(warning, idx) in scanResult.warnings" :key="idx">
                <el-icon><Warning /></el-icon>
                <span>{{ warning }}</span>
              </li>
            </ul>
          </el-descriptions-item>
          <el-descriptions-item v-if="scanResult.error" label="扫描错误">
            <span class="error-text">{{ scanResult.error }}</span>
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="showScanResultDialog = false">{{ i18n.t('close') }}</el-button>
      </template>
    </el-dialog>

    <!-- Share Dialog -->
    <el-dialog 
      v-model="showShareResultDialog" 
      :title="i18n.t('shareLink') || 'Share Link'"
      width="500px"
    >
      <div class="share-result">
        <p class="share-success">{{ i18n.t('shareSuccess') || 'Share created successfully!' }}</p>
        <el-input 
          :value="shareResultUrl" 
          readonly
        >
          <template #append>
            <el-button @click="copyShareLink">
              <el-icon><CopyDocument /></el-icon>
            </el-button>
          </template>
        </el-input>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showShareResultDialog = false">{{ i18n.t('close') }}</el-button>
        </div>
      </template>
    </el-dialog>

    <!-- File Conflict Dialog -->
    <FileConflictDialog ref="conflictDialog" />
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { Upload, FolderAdd, Search, Grid, List, Folder, TrendCharts, Download, Share, UploadFilled, Document, Edit, Delete, ArrowUp, ArrowDown, Sort, CopyDocument, Setting, CircleCheck, Warning, CircleClose, QuestionFilled, Loading } from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';
import { useFilesStore } from '@/stores/files';
import { useAuthStore } from '@/stores/auth';
import { filesAPI } from '@/api';
import { toast } from '@/utils/toast';
import { formatFileSize, formatDate } from '@/utils/format';
import { filterSearch, filterFolderName } from '@/utils/inputFilter';
import FileCard from '@/components/FileCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import MoveDialog from '@/components/MoveDialog.vue';
import FileConflictDialog from '@/components/FileConflictDialog.vue';
import UploadProgress from '@/components/UploadProgress.vue';

const i18n = useI18nStore();
const filesStore = useFilesStore();
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();

const viewMode = ref('grid');
const searchQuery = ref('');
const sortBy = ref('name');
const sortOrder = ref('asc');
const showUploadDialog = ref(false);
const showCreateFolderDialog = ref(false);
const showRenameDialog = ref(false);
const showDeleteDialog = ref(false);
const showMoveDialog = ref(false);
const showPreviewDialog = ref(false);
const showShareDialog = ref(false);
const showShareResultDialog = ref(false);
const uploadFiles = ref([]);
const newFolder = ref({ name: '' });
const renameForm = ref({ name: '', id: null });
const fileToRename = ref(null);
const fileToDelete = ref(null);
const fileToMove = ref(null);
const fileToShare = ref(null);
const filesToMove = ref([]);
const uploading = ref(false);
const renaming = ref(false);
const deleting = ref(false);
const previewLoading = ref(false);
const previewFile = ref(null);
const previewUrl = ref(null);
const textContent = ref('');
const textContainerRef = ref(null);
const shareLoading = ref(false);
const shareForm = ref({
  expiresAt: null,
  maxDownloads: 10,
  password: ''
});
const shareResultUrl = ref('');
const conflictDialog = ref(null);

// 扫描详情相关
const showScanResultDialog = ref(false);
const currentScanFile = ref(null);
const scanResult = ref(null);
const loadingScanResult = ref(false);

// 获取安全状态文本
const getSecurityStatusText = (file) => {
  if (!file || !file.securityStatus) return '未知';
  switch (file.securityStatus) {
    case 'safe': return '安全';
    case 'warning': return '警告';
    case 'dangerous': return '危险';
    default: return '未知';
  }
};

// 获取扫描模式的友好显示
const getScanModeDisplay = (mode) => {
  if (!mode) return '未扫描';
  const modeMap = {
    'clamav': 'ClamAV 杀毒引擎',
    'file-header': '文件头检测',
    'hybrid': '混合模式检测 (文件头 + ClamAV)',
    'virustotal': 'VirusTotal 云端检测',
    'multi-scan': '多引擎扫描 (文件头 + ClamAV + VirusTotal)',
    'disabled': '扫描已禁用'
  };
  return modeMap[mode] || mode;
};

// 根据扫描结果生成扫描步骤
const getScanSteps = (result) => {
  const mode = result.scanMode;
  const isSafe = result.securityStatus === 'safe';
  const isWarning = result.securityStatus === 'warning';
  const isDangerous = result.securityStatus === 'dangerous';
  const hasWarnings = result.warnings && result.warnings.length > 0;
  const steps = [];

  // 基础步骤：所有文件都经过文件头检测
  steps.push({
    name: '文件扩展名与类型检测',
    status: hasWarnings ? 'warning' : (isDangerous && result.details?.includes('扩展名') ? 'failed' : 'passed'),
    description: '检查文件扩展名和 MIME 类型是否匹配，防止伪装文件'
  });

  steps.push({
    name: '文件签名校验',
    status: hasWarnings ? 'warning' : (isDangerous && result.details?.includes('签名') ? 'failed' : 'passed'),
    description: '通过文件头部 magic bytes 校验真实文件类型'
  });

  // ClamAV 相关步骤
  if (mode === 'clamav' || mode === 'hybrid' || mode === 'multi-scan') {
    steps.push({
      name: 'ClamAV 特征码扫描',
      status: isDangerous ? 'failed' : (result.error ? 'warning' : 'passed'),
      description: result.error
        ? `特征码库扫描 (${result.error})`
        : '使用数百万条病毒特征码进行深度扫描'
    });
    steps.push({
      name: '启发式分析',
      status: isDangerous ? 'failed' : 'passed',
      description: '检测未知病毒与新型恶意代码的行为模式'
    });
  }

  // VirusTotal 相关步骤
  if (mode === 'virustotal' || mode === 'multi-scan') {
    steps.push({
      name: 'VirusTotal 多引擎分析',
      status: isDangerous ? 'failed' : (result.error ? 'warning' : 'passed'),
      description: result.error
        ? `云端多引擎扫描 (${result.error})`
        : '70+ 个国际杀毒引擎云端联合分析'
    });
  }

  // 最终判定
  steps.push({
    name: '综合安全判定',
    status: isDangerous ? 'failed' : (isWarning ? 'warning' : 'passed'),
    description: isDangerous
      ? '检测到恶意内容，文件已被拒绝'
      : (isWarning
        ? '检测到可疑特征，建议进一步检查'
        : '所有安全检查通过')
  });

  return steps;
};

// 显示扫描详情
const showScanResult = async (file) => {
  currentScanFile.value = file;
  showScanResultDialog.value = true;
  scanResult.value = null;
  
  // 如果已经有 scanResult 信息（前端已加载），直接显示
  if (file.scanMode || file.scanResult) {
    let parsed = null;
    try {
      parsed = typeof file.scanResult === 'string' ? JSON.parse(file.scanResult) : file.scanResult;
    } catch (e) {
      parsed = null;
    }
    scanResult.value = {
      fileName: file.name || file.originalName,
      securityStatus: file.securityStatus,
      scanMode: file.scanMode,
      warnings: parsed?.warnings || [],
      details: parsed?.details || null,
      error: parsed?.error || null,
      scanAt: file.scanAt
    };
    return;
  }
  
  // 否则从后端请求
  if (!file.id) return;
  loadingScanResult.value = true;
  try {
    const response = await filesAPI.getScanResult(file.id);
    if (response && response.success) {
      scanResult.value = response.data;
    }
  } catch (error) {
    console.error('获取扫描详情失败:', error);
  } finally {
    loadingScanResult.value = false;
  }
};

const selectedFiles = computed(() => filesStore.selectedItems);
const loading = computed(() => filesStore.isLoading);
const isAdmin = computed(() => authStore.isAdmin);

const allFiles = computed(() => {
  const folders = filesStore.folders.map(folder => ({
    ...folder,
    type: 'folder',
    name: folder.name || folder.originalName || 'Unnamed folder'
  }));
  const files = filesStore.files.map(file => ({
    ...file,
    type: 'file',
    name: file.name || file.originalName || 'Unnamed file'
  }));
  return [...folders, ...files];
});

// 计算是否有文件正在扫描
const isScanningFiles = computed(() => {
  return uploadFiles.value.some(f => f.scanning);
});

// 计算是否有危险文件
const hasDangerousFiles = computed(() => {
  return uploadFiles.value.some(f => f.securityStatus === 'dangerous');
});

const stats = computed(() => {
  return {
    files: filesStore.stats.fileCount,
    folders: filesStore.stats.folderCount,
    usedSpace: formatFileSize(filesStore.stats.totalSize),
    shared: filesStore.stats.sharedCount
  };
});

const breadcrumbItems = computed(() => {
  const items = [];
  
  // 添加根目录
  items.push({
    id: null,
    path: '',
    label: i18n.t('root') || 'Root',
    labelKey: 'root'
  });
  
  // 添加当前路径
  filesStore.breadcrumbs.forEach((crumb, index) => {
    if (crumb.id !== null) { // 跳过根目录（已经添加了）
      items.push({
        id: crumb.id,
        path: crumb.id,
        label: crumb.name,
        labelKey: crumb.name
      });
    }
  });
  
  return items;
});

const filteredFiles = computed(() => {
  let result = [...allFiles.value];
  
  // Filter out items with invalid names
  result = result.filter(file => file.name && typeof file.name === 'string');
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    result = result.filter(file => 
      (file.name || '').toLowerCase().includes(query)
    );
  }
  
  result.sort((a, b) => {
    let comparison = 0;
    
    if (a.type === 'folder' && b.type === 'file') {
      return -1;
    }
    if (a.type === 'file' && b.type === 'folder') {
      return 1;
    }
    
    switch (sortBy.value) {
      case 'name':
        const nameA = a.name || '';
        const nameB = b.name || '';
        comparison = nameA.localeCompare(nameB);
        break;
      case 'size':
        const sizeA = a.size || 0;
        const sizeB = b.size || 0;
        comparison = sizeA - sizeB;
        break;
      case 'date':
        const dateA = new Date(a.updated_at || a.created_at || 0);
        const dateB = new Date(b.updated_at || b.created_at || 0);
        comparison = dateA - dateB;
        break;
    }
    
    return sortOrder.value === 'asc' ? comparison : -comparison;
  });
  
  return result;
});

onMounted(async () => {
  await loadFiles();
  if (route.query.search) {
    searchQuery.value = route.query.search;
  }
});

watch(() => route.query, (newQuery) => {
  if (newQuery.search) {
    searchQuery.value = newQuery.search;
  }
});

const loadFiles = async () => {
  await filesStore.loadFiles(null);
};

const handleSearch = () => {
  if (searchQuery.value && searchQuery.value.length > 0) {
  }
};

const handleSortChange = () => {
  toast.info(i18n.t('sortChanged') || 'Sorting changed');
};

const toggleSortOrder = () => {
  sortOrder.value = sortOrder.value === 'asc' ? 'desc' : 'asc';
  toast.info(i18n.t('sortOrderChanged') || 'Sort order changed');
};

const handleFileClick = (file, event) => {
  if (event && (event.ctrlKey || event.metaKey)) {
    filesStore.toggleSelectItem(file.id);
  } else {
    filesStore.toggleSelectItem(file.id);
  }
};

const handleFileDoubleClick = (file) => {
  if (file.type === 'folder') {
    filesStore.navigateToFolder(file.id, file.name);
  } else {
    handlePreview(file);
  }
};

const handleUpload = async () => {
    if (uploadFiles.value.length === 0) {
      toast.warning(i18n.t('pleaseSelectFiles') || 'Please select files');
      return;
    }
    
    // 检查是否有文件还在扫描
    if (isScanningFiles.value) {
      toast.warning(i18n.t('waitScanComplete') || '请等待文件扫描完成');
      return;
    }
    
    // 检查是否有危险文件
    if (hasDangerousFiles.value) {
      toast.error(i18n.t('hasDangerousFiles') || '检测到危险文件，请移除后重试');
      return;
    }
    
    // 检查文件名冲突
    const conflicts = [];
    const filesWithConflict = new Set();
    for (const uploadFile of uploadFiles.value) {
      const fileObj = uploadFile.raw || uploadFile;
      const fileName = fileObj.name;
      if (fileName) {
        try {
          const response = await filesAPI.checkConflict({
            fileName: fileName,
            folderId: filesStore.currentFolderId,
            action: 'upload'
          });
          
          if (response.success && response.data?.hasConflict) {
            filesWithConflict.add(fileName);
            conflicts.push({
              fileName: fileName,
              reason: i18n.t('fileExists') || 'File already exists',
              existingFile: response.data.existingFile,
              newFile: {
                name: fileName,
                size: fileObj.size,
                type: fileObj.type || (fileName.split('.').pop().toLowerCase())
              }
            });
          }
        } catch (error) {
          console.error('Check conflict error:', error);
        }
      }
    }
    
    let conflictAction = 'keepBoth';
    
    // 如果有冲突，显示对话框
    if (conflicts.length > 0 && conflictDialog.value) {
      conflictAction = await conflictDialog.value.showDialog(
        conflicts,
        i18n.t('fileConflict') || 'File Conflict'
      );
      
      if (conflictAction === 'cancel') {
        return;
      }
    }
    
    // 根据冲突处理方式筛选文件
    let filesToUpload = uploadFiles.value;
    if (conflictAction === 'skip' && conflicts.length > 0) {
      // 跳过模式：只上传没有冲突的文件
      filesToUpload = uploadFiles.value.filter(uploadFile => {
        const fileName = (uploadFile.raw || uploadFile).name;
        return !filesWithConflict.has(fileName);
      });
      
      if (filesToUpload.length === 0) {
        toast.info(i18n.t('allFilesSkipped') || 'All files were skipped');
        return;
      }
    }
    
    const nativeFiles = filesToUpload.map(f => f.raw);
    
    // 立即关闭上传对话框
    showUploadDialog.value = false;
    uploadFiles.value = [];
    
    // 初始化上传队列并开始上传
    filesStore.initUploadQueue(nativeFiles, filesStore.currentFolderId, conflictAction);
    filesStore.startUploads(filesStore.currentFolderId, conflictAction);
  };

// 允许的文件扩展名白名单（与后端保持一致）
const allowedExtensions = [
  'jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'ico', 'tiff', 'tif',
  'pdf',
  'docx', 'xlsx', 'pptx',
  'txt', 'md', 'json', 'xml', 'csv', 'log',
  'mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma',
  'mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'
];

// 禁止的文件扩展名黑名单（与后端保持一致）
const blockedExtensions = [
  'svg', 'exe', 'bat', 'cmd', 'com', 'scr', 'pif', 'msi', 'msp', 'mst',
  'dll', 'sys', 'ocx', 'cpl', 'drv', 'so',
  'php', 'php3', 'php4', 'php5', 'php6', 'phps', 'phtml',
  'asp', 'aspx', 'jsp', 'jspx', 'jhtml',
  'cgi', 'pl', 'py', 'pyc', 'pyd',
  'rb', 'rbw', 'rhtml', 'erb',
  'sh', 'bash', 'zsh', 'csh', 'tcsh',
  'ps1', 'psm1', 'psd1', 'vbs', 'vbe', 'jse', 'wsf', 'wsc',
  'html', 'htm', 'shtml', 'xhtml', 'htaccess',
  'js', 'mjs', 'jsx', 'tsx', 'vue',
  'ts', 'cts', 'mts',
  'css', 'scss', 'sass', 'less',
  'py', 'pyw',
  'java', 'jav', 'class', 'jar', 'war', 'ear',
  'c', 'cpp', 'h', 'hpp', 'cc', 'cxx',
  'cs', 'csx',
  'go', 'rs', 'rscript',
  'rb', 'rake', 'gem',
  'swift', 'kt', 'kts', 'scala', 'groovy',
  'dart', 'lua', 'perl', 'plx',
  'r', 'R', 'rmd',
  'php', 'phtml', 'module', 'theme',
  'coffee', 'litcoffee',
  'ini', 'cfg', 'conf', 'config', 'reg', 'inf',
  'properties', 'prop', 'settings',
  'env', 'environment',
  'yaml', 'yml', 'toml', 'json5',
  'xml', 'xaml', 'resx',
  'sql', 'db', 'sqlite', 'sqlite3', 'mdb', 'accdb',
  'dbf', 'cdb', 'fdb',
  'pem', 'key', 'cer', 'crt', 'der', 'p12', 'pfx', 'p8', 'jks',
  'p7b', 'p7r', 'p7s',
  'gpg', 'pgp', 'asc',
  'doc', 'docm', 'dot', 'dotm',
  'xls', 'xlsm', 'xlt', 'xltm', 'xlam',
  'ppt', 'pptm', 'pot', 'potm', 'ppam', 'ppsm',
  'iso', 'img', 'bin', 'cue', 'mdf', 'mds',
  'vmdk', 'vhd', 'vhdx', 'hdd', 'qcow', 'qcow2',
  'dmg', 'cdr', 'sparseimage',
  'zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'lz',
  'cab', 'arj', 'lzh', 'ace', 'tgz', 'tbz2',
  'lnk', 'url', 'desktop', 'shortcut',
  'webloc', 'website', 'pcast',
  'eml', 'msg', 'vcf', 'vcard', 'ics',
  'mbox', 'mail',
  'psd', 'psb', 'ai', 'eps', 'indd',
  'skp', 'skm', 'blend',
  'fbx', 'obj', '3ds', 'dae', 'stl',
  'chm', 'hlp', 'hlpx',
  'hta', 'adget', 'shb',
  'swf', 'fla', 'as', 'vcproj', 'sln',
  'aaf', 'mxf', 'prproj',
  'apk', 'ipa', 'xap', 'appx', 'appxbundle',
  'aab', 'nex',
  'torrent', 'magnet', 'metalink',
  'par', 'par2',
  'bat', 'btm', 'command', 'workflow',
  'exe1', 'exe2', 'pif', 'application',
  'gadget', 'msc', 'diagcab',
  'jar', 'jnlp', 'webstart'
];

// 检查是否是移动端设备
const isMobile = computed(() => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
});

// 生成文件选择器的 accept 属性（移动端不限制类型以支持文件管理器）
const allowedFileTypes = computed(() => {
  // 移动端使用空的 accept 属性，允许选择所有文件类型
  // 这样可以唤起完整的文件管理器而不是只显示相册
  if (isMobile.value) {
    return '';
  }
  
  // 桌面端使用详细的 MIME 类型限制
  const typeMap = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'bmp': 'image/bmp',
    'ico': 'image/x-icon',
    'tiff': 'image/tiff',
    'tif': 'image/tiff',
    'pdf': 'application/pdf',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'txt': 'text/plain',
    'md': 'text/markdown',
    'json': 'application/json',
    'xml': 'application/xml',
    'csv': 'text/csv',
    'log': 'text/plain',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'flac': 'audio/flac',
    'aac': 'audio/aac',
    'm4a': 'audio/mp4',
    'wma': 'audio/x-ms-wma',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'mov': 'video/quicktime',
    'avi': 'video/x-msvideo',
    'mkv': 'video/x-matroska',
    'flv': 'video/x-flv'
  };
  return allowedExtensions.map(ext => typeMap[ext] || `.${ext}`).join(',');
});

// 获取文件扩展名（与后端一致，取最后一个点之后的部分）
const getFileExtension = (fileName) => {
  if (!fileName || typeof fileName !== 'string') {
    return '';
  }
  const lastDotIndex = fileName.lastIndexOf('.');
  if (lastDotIndex === -1) {
    return '';
  }
  return fileName.substring(lastDotIndex + 1).toLowerCase();
};

// 检查文件扩展名是否在黑名单中
const isExtensionBlocked = (fileName) => {
  const ext = getFileExtension(fileName);
  return blockedExtensions.includes(ext);
};

// 检查文件扩展名是否在白名单中
const isExtensionAllowed = (fileName) => {
  const ext = getFileExtension(fileName);
  return allowedExtensions.includes(ext);
};

// 检查文件是否允许上传
const isFileAllowed = (fileName) => {
  if (!fileName) return false;
  // 先检查黑名单（优先级更高）
  if (isExtensionBlocked(fileName)) {
    return false;
  }
  // 再检查白名单
  return isExtensionAllowed(fileName);
};

// 上传前的检查
const beforeUpload = (file) => {
  const fileName = file.name;
  
  if (!isFileAllowed(fileName)) {
    const ext = getFileExtension(fileName);
    if (isExtensionBlocked(fileName)) {
      toast.warning(`${i18n.t('fileTypeBlocked') || 'File type blocked'}: .${ext}`);
    } else {
      toast.warning(`${i18n.t('unsupportedFileType') || 'Unsupported file type'}: .${ext}`);
    }
    return false;
  }
  
  return true;
};

// 处理文件选择变化
const handleFileChange = async (file, fileList) => {
  const existingUids = new Set(uploadFiles.value.map(f => f.uid));
  const newUploadFiles = [];
  const newFilesToScan = [];
  
  fileList.forEach((f) => {
    const isNewFile = !existingUids.has(f.uid);
    
    if (isNewFile) {
      const fileName = f.raw?.name || f.name;
      
      // 检查文件类型是否允许（先黑名单，再白名单）
      if (!isFileAllowed(fileName)) {
        const ext = getFileExtension(fileName);
        if (isExtensionBlocked(fileName)) {
          toast.warning(`${i18n.t('fileTypeBlocked') || 'File type blocked'}: .${ext}`);
        } else {
          toast.warning(`${i18n.t('unsupportedFileType') || 'Unsupported file type'}: .${ext}`);
        }
        return;
      }
      
      newUploadFiles.push({
        ...f,
        scanning: true,
        securityStatus: 'pending',
        securityStatusText: i18n.t('scanning') || 'Scanning...'
      });
      newFilesToScan.push(f);
    } else {
      const existingFile = uploadFiles.value.find(existing => existing.uid === f.uid);
      if (existingFile) {
        newUploadFiles.push({
          ...f,
          scanning: existingFile.scanning,
          securityStatus: existingFile.securityStatus,
          securityStatusText: existingFile.securityStatusText,
          scanResult: existingFile.scanResult
        });
      } else {
        newUploadFiles.push({
          ...f,
          scanning: false,
          securityStatus: 'pending',
          securityStatusText: i18n.t('pending') || 'Pending'
        });
      }
    }
  });
  
  uploadFiles.value = newUploadFiles;
  
  if (newFilesToScan.length > 0) {
    const formData = new FormData();
    newFilesToScan.forEach((file) => {
      if (file.raw) {
        formData.append('files', file.raw);
      }
    });
    
    try {
      console.log('开始扫描文件:', newFilesToScan.length, '个文件');
      
      const response = await filesAPI.previewScan(formData);
      
      console.log('扫描响应:', response);
      
      if (!response || !response.success) {
        console.error('扫描响应异常:', response);
        throw new Error(response?.message || '扫描响应失败');
      }
      
      if (!response.data || !Array.isArray(response.data)) {
        console.error('扫描结果格式错误:', response.data);
        throw new Error('扫描结果格式错误');
      }
      
      console.log('扫描结果数据:', response.data);
      
      // 使用响应式方式更新文件状态
      const updatedFiles = [...uploadFiles.value];
      
      response.data.forEach((scanResult, scanIdx) => {
        const newFile = newFilesToScan[scanIdx];
        if (!newFile) return;
        
        const uploadIdx = updatedFiles.findIndex(f => f.uid === newFile.uid);
        if (uploadIdx === -1) return;
        
        const status = scanResult.securityStatus || 'unknown';
        let statusText;
        switch (status) {
          case 'safe':
            statusText = i18n.t('scanResultSafe') || 'Safe';
            break;
          case 'warning':
            statusText = i18n.t('scanResultWarning') || 'Warning';
            break;
          case 'dangerous':
            statusText = i18n.t('scanResultDangerous') || 'Dangerous';
            break;
          default:
            statusText = i18n.t('unknown') || 'Unknown';
        }
        
        updatedFiles[uploadIdx] = {
          ...updatedFiles[uploadIdx],
          scanning: false,
          securityStatus: status,
          securityStatusText: statusText,
          scanResult: scanResult
        };
      });
      
      // 确保所有新文件都被标记为扫描完成
      newFilesToScan.forEach(newFile => {
        const uploadIdx = updatedFiles.findIndex(f => f.uid === newFile.uid);
        if (uploadIdx !== -1 && updatedFiles[uploadIdx].scanning) {
          updatedFiles[uploadIdx] = {
            ...updatedFiles[uploadIdx],
            scanning: false,
            securityStatus: 'unknown',
            securityStatusText: i18n.t('scanTimeout') || 'Scan timeout'
          };
        }
      });
      
      // 重新赋值触发响应式更新
      uploadFiles.value = updatedFiles;
    } catch (error) {
      console.error('扫描失败:', error);
      // 使用响应式方式更新文件状态
      const updatedFiles = [...uploadFiles.value];
      newFilesToScan.forEach(newFile => {
        const uploadIdx = updatedFiles.findIndex(f => f.uid === newFile.uid);
        if (uploadIdx !== -1) {
          updatedFiles[uploadIdx] = {
            ...updatedFiles[uploadIdx],
            scanning: false,
            securityStatus: 'warning',
            securityStatusText: i18n.t('scanFailed') || 'Scan Failed'
          };
        }
      });
      uploadFiles.value = updatedFiles;
      toast.error(i18n.t('scanFailed') || '扫描失败');
    }
  }
};


// 移除上传文件
const removeUploadFile = (index) => {
  uploadFiles.value.splice(index, 1);
};

// 关闭上传对话框
const handleCloseUploadDialog = () => {
  showUploadDialog.value = false;
  uploadFiles.value = []; // 清空文件列表
};

// 关闭创建文件夹对话框
const handleCloseCreateFolderDialog = () => {
  showCreateFolderDialog.value = false;
  newFolder.value = { name: '' }; // 清空输入内容
};

// 处理创建文件夹
const handleCreateFolder = async () => {
  if (!newFolder.value.name.trim()) {
    toast.warning(i18n.t('pleaseEnterFolderName') || 'Please enter folder name');
    return;
  }
  
  // 检查文件夹冲突
  let conflictAction = 'merge'; // 默认合并
  try {
    const response = await filesAPI.checkConflict({
      fileName: newFolder.value.name,
      folderId: filesStore.currentFolderId,
      action: 'createFolder'
    });
    
    if (response.success && response.data?.hasConflict) {
      const conflicts = [{
        fileName: newFolder.value.name,
        reason: i18n.t('folderExists') || 'Folder already exists',
        existingFile: response.data.existingFile,
        newFile: {
          name: newFolder.value.name,
          size: 0,
          type: 'folder'
        }
      }];
      
      if (conflictDialog.value) {
        conflictAction = await conflictDialog.value.showDialog(
          conflicts,
          i18n.t('folderConflict') || 'Folder Conflict'
        );
        
        if (conflictAction === 'cancel') {
          return;
        }
      }
    }
    
    await filesStore.createFolder(newFolder.value.name, filesStore.currentFolderId, conflictAction);
    showCreateFolderDialog.value = false;
    newFolder.value = { name: '' };
  } catch (error) {
    // 不再输出控制台错误，因为已经有toast提示
  }
};

const handleDownload = async (file) => {
  if (file.type === 'folder') {
    toast.info(i18n.t('folderCannotDownload') || 'Folders cannot be downloaded');
    return;
  }
  try {
    const blob = await filesStore.downloadFile(file.id);
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.name || 'download';
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  } catch (error) {
    toast.error(error.error || i18n.t('downloadFailed') || 'Download failed');
  }
};

const handlePreview = async (file) => {
    if (file.type === 'folder') return;
    
    previewFile.value = file;
    previewLoading.value = true;
    showPreviewDialog.value = true;
    previewUrl.value = null;
    textContent.value = '';

    try {
      const blob = await filesStore.previewFile(file.id);
      if (blob) {
        // 如果是文本文件，读取文本内容
        if (isTextFile(file)) {
          const text = await blob.text();
          textContent.value = text;
        } else {
          // 其他文件类型使用 URL
          previewUrl.value = URL.createObjectURL(blob);
        }
      }
    } catch (error) {
      console.error('Preview failed:', error);
      toast.error(error.error || i18n.t('previewFailed') || 'Preview failed');
    } finally {
      previewLoading.value = false;
    }
  };

const isImageFile = (file) => {
    if (!file?.name) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg', 'ico', 'tiff', 'tif'].includes(ext);
  };

  const isPDFFile = (file) => {
    if (!file?.name) return false;
    return file.name.toLowerCase().endsWith('.pdf');
  };

  const isOfficeFile = (file) => {
    if (!file?.name) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['docx', 'xlsx', 'pptx'].includes(ext);
  };

  const isVideoFile = (file) => {
    if (!file?.name) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv'].includes(ext);
  };

  const isAudioFile = (file) => {
    if (!file?.name) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext);
  };

  const isTextFile = (file) => {
    if (!file?.name) return false;
    const ext = file.name.toLowerCase().split('.').pop();
    return ['txt', 'md', 'json', 'xml', 'csv', 'log'].includes(ext);
  };

const downloadPreviewFile = async () => {
  if (!previewFile.value) return;
  try {
    const blob = await filesStore.downloadFile(previewFile.value.id);
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = previewFile.value.name || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Download failed:', error);
  }
};

const handleRename = (file) => {
  fileToRename.value = file;
  renameForm.value = { name: file.name || '', id: file.id };
  showRenameDialog.value = true;
};

const handleConfirmRename = async () => {
  if (!renameForm.value.name.trim()) {
    toast.warning(i18n.t('pleaseEnterName') || 'Please enter a name');
    return;
  }
  
  renaming.value = true;
  try {
    await filesStore.renameFile(fileToRename.value.id, renameForm.value.name);
    showRenameDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('renameFailed') || 'Rename failed');
  } finally {
    renaming.value = false;
  }
};

const handleDelete = (file) => {
  fileToDelete.value = file;
  showDeleteDialog.value = true;
};

const handleConfirmDelete = async () => {
  deleting.value = true;
  try {
    await filesStore.deleteFile(fileToDelete.value.id);
    showDeleteDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('deleteFailed') || 'Delete failed');
  } finally {
    deleting.value = false;
  }
};

const handleMove = (file) => {
  fileToMove.value = file;
  filesToMove.value = [file.id];
  showMoveDialog.value = true;
};

const handleMoveSelected = () => {
  if (selectedFiles.value.length === 0) {
    toast.warning(i18n.t('noFilesSelected') || 'No files selected');
    return;
  }
  filesToMove.value = [...selectedFiles.value];
  showMoveDialog.value = true;
};

const handleMoveComplete = () => {
  filesStore.clearSelection();
  showMoveDialog.value = false;
  fileToMove.value = null;
  filesToMove.value = [];
};

const handleBreadcrumbNavigate = (item) => {
  filesStore.goToFolder(item.id);
};

const goToAdmin = () => {
  router.push('/admin');
};

const handleShare = (file) => {
  fileToShare.value = file;
  shareForm.value = {
    expiresAt: null,
    maxDownloads: 10,
    password: ''
  };
  showShareDialog.value = true;
};

const showFilterWarning = ref(false);
const showRenameFilterWarning = ref(false);

// 显示过滤警告提示
const showFolderFilterWarning = () => {
  showFilterWarning.value = true;
  setTimeout(() => {
    showFilterWarning.value = false;
  }, 3000);
};

const showRenameFilterWarningToast = () => {
  showRenameFilterWarning.value = true;
  setTimeout(() => {
    showRenameFilterWarning.value = false;
  }, 3000);
};

// 文件夹名输入处理（使用统一过滤工具）
const handleFolderNameInput = (value) => {
  const sanitized = filterFolderName(value, showFolderFilterWarning);
  newFolder.value.name = sanitized;
};

// 重命名输入处理（使用统一过滤工具）
const handleRenameInput = (value) => {
  const sanitized = filterFolderName(value, showRenameFilterWarningToast);
  renameForm.value.name = sanitized;
};

// 搜索输入处理（使用统一过滤工具）
const handleSearchInput = (value) => {
  const sanitized = filterSearch(value);
  searchQuery.value = sanitized;
};

const handleShareConfirm = async () => {
  if (!fileToShare.value) return;
  shareLoading.value = true;
  try {
    const data = {
      maxDownloads: shareForm.value.maxDownloads
    };
    if (shareForm.value.expiresAt) {
      data.expiresAt = shareForm.value.expiresAt;
    }
    if (shareForm.value.password) {
      data.password = shareForm.value.password;
    }
    
    const result = await filesStore.shareFile(fileToShare.value.id, data);
    showShareDialog.value = false;
    
    // Generate share link
    if (result && result.shareCode) {
      shareResultUrl.value = `${window.location.origin}/share/${result.shareCode}`;
    } else if (result && result.shareUrl) {
      shareResultUrl.value = result.shareUrl;
    } else if (result && result.code) {
      shareResultUrl.value = `${window.location.origin}/share/${result.code}`;
    }
    
    showShareResultDialog.value = true;
  } catch (error) {
    console.error('Share failed:', error);
  } finally {
    shareLoading.value = false;
  }
};

const copyShareLink = () => {
  navigator.clipboard.writeText(shareResultUrl.value).then(() => {
    toast.success(i18n.t('linkCopied') || 'Link copied to clipboard');
  }).catch(err => {
    console.error('Failed to copy link:', err);
    toast.error(i18n.t('copyFailed') || 'Failed to copy link');
  });
};
</script>

<style scoped>
.dashboard {
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 0;
  margin: 0;
  width: 100%;
  height: 100%;
}

.upload-progress-section {
  padding: 16px;
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: var(--el-box-shadow-light);
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
}

.dashboard-actions {
  display: flex;
  gap: 16px;
  align-items: center;
  flex-wrap: wrap;
}

.dashboard-actions .upload-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  font-size: 16px;
}

.search-input {
  flex: 1;
  max-width: 350px;
}

.view-toggle {
  display: flex;
  gap: 8px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 24px;
  width: 100%;
}

.stat-card {
  background: var(--el-bg-color);
  border-radius: 24px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 20px;
  box-shadow: var(--el-box-shadow-light);
}

.stat-icon {
  width: 72px;
  height: 72px;
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #409eff 0%, #337ecc 100%);
  color: white;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.stat-label {
  font-size: 16px;
  color: var(--el-text-color-secondary);
  font-weight: 500;
}

.admin-card {
  cursor: pointer;
  transition: transform 0.2s, box-shadow 0.2s;
}

.admin-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--el-box-shadow);
}

.file-section {
  flex: 1;
  min-height: 300px;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.grid-view {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.list-view {
  background: var(--el-bg-color);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: var(--el-box-shadow-light);
}

.list-item-name {
  display: flex;
  align-items: center;
  gap: 12px;
}

.list-item-icon {
  color: var(--el-color-primary);
  font-size: 20px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.upload-file-list {
  margin-top: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
  padding-top: 16px;
}

.upload-file-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--el-bg-color-page);
  border-radius: 8px;
  margin-bottom: 8px;
}

.upload-file-item:last-child {
  margin-bottom: 0;
}

.upload-file-item .file-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: var(--el-color-primary-light-9);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--el-color-primary);
}

.upload-file-item .file-info {
  flex: 1;
}

.upload-file-item .file-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
}

.upload-file-item .file-size {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.upload-file-item .file-security-status {
  padding: 4px;
}

.upload-file-item .file-security-status .safe {
  color: var(--el-color-success);
}

.upload-file-item .file-security-status .warning {
  color: var(--el-color-warning);
}

.upload-file-item .file-security-status .danger {
  color: var(--el-color-danger);
}

.upload-file-item .file-security-status .unknown {
  color: var(--el-text-color-placeholder);
}

.upload-file-item .file-security-status .spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.upload-file-item .file-actions {
  padding: 4px;
}

.upload-file-item .file-actions .delete-btn {
  color: var(--el-text-color-placeholder);
}

.upload-file-item .file-actions .delete-btn:hover {
  color: var(--el-color-danger);
}

.preview-dialog :deep(.el-dialog__body) {
  padding: 0;
  max-height: 70vh;
  overflow: auto;
}

.preview-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px;
}

.preview-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 20px;
}

.preview-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.pdf-container {
  width: 100%;
  height: 70vh;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  border: none;
}

.preview-video {
  max-width: 100%;
  max-height: 70vh;
  border-radius: 8px;
}

.preview-audio {
  width: 100%;
  max-width: 600px;
}

.text-container {
  width: 100%;
  max-height: 70vh;
  overflow: auto;
  background: #1e1e1e;
  border-radius: 8px;
  padding: 16px;
}

.text-preview {
  margin: 0;
  color: #d4d4d4;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  word-wrap: break-word;
}

.unsupported-preview {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px;
  text-align: center;
}

.unsupported-icon {
  color: var(--el-color-primary);
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }

  .dashboard-actions {
    flex-direction: column;
    align-items: stretch;
  }

  .search-input {
    max-width: none;
    width: 100%;
  }
}

.filter-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--el-color-warning-light-9);
  border: 1px solid var(--el-color-warning-light-5);
  border-radius: 8px;
  color: var(--el-color-warning);
  font-size: 14px;
  margin-top: 8px;
}

.filter-warning .warning-icon {
  font-size: 16px;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 安全状态图标 */
.security-status-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: background-color 0.2s ease;
}

.security-status-wrapper:hover {
  background-color: var(--el-fill-color-light);
}

.security-status-icon {
  display: inline-flex;
}

.security-status-icon.safe {
  color: var(--el-color-success);
}

.security-status-icon.warning {
  color: var(--el-color-warning);
}

.security-status-icon.dangerous {
  color: var(--el-color-danger);
}

.security-status-icon.unknown {
  color: var(--el-text-color-placeholder);
}

.security-status-muted {
  color: var(--el-text-color-placeholder);
}

/* 扫描结果弹窗 */
.scan-result-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
  gap: 8px;
  color: var(--el-text-color-secondary);
}

.scan-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  border-radius: 12px;
  margin-bottom: 16px;
}

.scan-status-row .status-label {
  font-size: 18px;
  font-weight: 600;
}

.scan-status-row.safe {
  background: rgba(103, 194, 58, 0.12);
  color: var(--el-color-success);
}

.scan-status-row.warning {
  background: rgba(230, 162, 60, 0.12);
  color: var(--el-color-warning);
}

.scan-status-row.dangerous {
  background: rgba(245, 108, 108, 0.12);
  color: var(--el-color-danger);
}

.scan-steps {
  margin-bottom: 16px;
}

.scan-steps-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-regular);
  margin-bottom: 12px;
}

.scan-steps-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.scan-step-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  border-radius: 8px;
  background: var(--el-fill-color-lightest);
  border: 1px solid var(--el-border-color-lighter);
}

.scan-step-item.passed {
  border-color: rgba(103, 194, 58, 0.3);
  background: rgba(103, 194, 58, 0.08);
}

.scan-step-item.warning {
  border-color: rgba(230, 162, 60, 0.3);
  background: rgba(230, 162, 60, 0.08);
}

.scan-step-item.failed {
  border-color: rgba(245, 108, 108, 0.3);
  background: rgba(245, 108, 108, 0.08);
}

.scan-step-icon {
  flex-shrink: 0;
  margin-top: 2px;
}

.scan-step-item.passed .scan-step-icon {
  color: var(--el-color-success);
}

.scan-step-item.warning .scan-step-icon {
  color: var(--el-color-warning);
}

.scan-step-item.failed .scan-step-icon {
  color: var(--el-color-danger);
}

.scan-step-info {
  flex: 1;
}

.scan-step-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.scan-step-desc {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  line-height: 1.5;
}

.scan-descriptions {
  margin-top: 16px;
}

.warning-list {
  margin: 0;
  padding-left: 20px;
  list-style: none;
}

.warning-list li {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 4px;
  color: var(--el-color-warning);
}

.error-text {
  color: var(--el-color-danger);
}
</style>
