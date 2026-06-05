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
          @input="handleSearch"
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
      >
        <el-icon class="el-icon--upload"><UploadFilled /></el-icon>
        <div class="el-upload__text">{{ i18n.t('dropFilesHere') }}<em>{{ i18n.t('clickToUpload') }}</em></div>
        <template #tip>
          <div class="el-upload__tip">{{ i18n.t('uploadTip') }}</div>
        </template>
      </el-upload>
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="handleCloseUploadDialog">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="handleUpload" :loading="uploading" :disabled="uploadFiles.length === 0">
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
            @keyup.enter="handleCreateFolder" 
          />
        </el-form-item>
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
            @keyup.enter="handleConfirmRename" 
          />
        </el-form-item>
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

    <!-- Share Result Dialog -->
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
import { Upload, FolderAdd, Search, Grid, List, Folder, TrendCharts, Download, Share, UploadFilled, Document, Edit, Delete, ArrowUp, ArrowDown, Sort, CopyDocument, Setting } from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';
import { useFilesStore } from '@/stores/files';
import { useAuthStore } from '@/stores/auth';
import { filesAPI } from '@/api';
import { toast } from '@/utils/toast';
import { formatFileSize, formatDate } from '@/utils/format';
import FileCard from '@/components/FileCard.vue';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import Breadcrumb from '@/components/Breadcrumb.vue';
import MoveDialog from '@/components/MoveDialog.vue';
import FileConflictDialog from '@/components/FileConflictDialog.vue';

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
const shareLoading = ref(false);
const shareForm = ref({
  expiresAt: null,
  maxDownloads: 10,
  password: ''
});
const shareResultUrl = ref('');
const conflictDialog = ref(null);

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
  uploading.value = true;
  try {
    await filesStore.uploadFiles(nativeFiles, filesStore.currentFolderId, conflictAction);
    showUploadDialog.value = false;
    uploadFiles.value = [];
  } catch (error) {
    toast.error(error.error || i18n.t('uploadFailed') || 'Upload failed');
  } finally {
    uploading.value = false;
  }
};

// 处理文件选择变化
const handleFileChange = (file, fileList) => {
  uploadFiles.value = fileList;
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

  try {
    const blob = await filesStore.previewFile(file.id);
    if (blob) {
      previewUrl.value = URL.createObjectURL(blob);
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
  return ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp', 'svg'].includes(ext);
};

const isPDFFile = (file) => {
  if (!file?.name) return false;
  return file.name.toLowerCase().endsWith('.pdf');
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
</style>
