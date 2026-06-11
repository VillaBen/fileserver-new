import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { filesAPI, sharesAPI } from '../api';
import { toast } from '../utils/toast';
import { useI18nStore } from './i18n';

export const useFilesStore = defineStore('files', () => {
  const i18n = useI18nStore();
  const files = ref([]);
  const folders = ref([]);
  const currentFolderId = ref(null);
  const isLoading = ref(false);
  const trashFiles = ref([]);
  const trashFolders = ref([]);
  const selectedItems = ref([]);
  const stats = ref({
    fileCount: 0,
    folderCount: 0,
    totalSize: 0,
    sharedCount: 0
  });

  const folderHistory = ref([]); // 用于记录文件夹历史，构建面包屑
  const folderMap = ref(new Map()); // 用于快速查找文件夹信息

  // 上传管理相关状态
  const uploadQueue = ref([]); // 上传队列
  const activeUploads = ref([]); // 正在进行的上传
  const completedUploads = ref([]); // 已完成的上传
  const failedUploads = ref([]); // 失败的上传
  const isUploading = computed(() => activeUploads.value.length > 0);
  const uploadProgress = computed(() => {
    if (uploadQueue.value.length === 0 && activeUploads.value.length === 0) return 0;
    const totalFiles = uploadQueue.value.length + activeUploads.value.length + completedUploads.value.length + failedUploads.value.length;
    const completedFiles = completedUploads.value.length;
    let totalProgress = 0;
    activeUploads.value.forEach(upload => {
      totalProgress += upload.progress || 0;
    });
    const activeAvg = activeUploads.value.length > 0 ? totalProgress / activeUploads.value.length : 0;
    return Math.round(((completedFiles * 100 + activeAvg * activeUploads.value.length) / totalFiles) || 0);
  });

  const breadcrumbs = computed(() => {
    const crumbs = [{ id: null, name: i18n.t('myFiles') || '我的文件' }];
    
    // 根据历史记录构建面包屑
    folderHistory.value.forEach((folderId) => {
      const folder = folderMap.value.get(folderId);
      if (folder) {
        crumbs.push({ id: folder.id, name: folder.name });
      }
    });
    
    return crumbs;
  });

  const hasSelectedItems = computed(() => selectedItems.value.length > 0);

  async function loadFiles(folderId = null) {
    isLoading.value = true;
    try {
      const response = await filesAPI.getFiles({ folderId });
      if (response.success) {
        files.value = response.data.files || [];
        folders.value = response.data.folders || [];
        currentFolderId.value = folderId;
        selectedItems.value = [];
        
        // 更新文件夹映射（用于面包屑显示）
        folders.value.forEach(folder => {
          folderMap.value.set(folder.id, folder);
        });
      }
      // 同时加载统计信息
      await loadStats();
    } catch (error) {
      toast.error(error.error || i18n.t('loadFilesFailed'));
      console.error('Failed to load files:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // 进入文件夹
  function navigateToFolder(folderId, folderName) {
    // 如果是根目录，清空历史
    if (folderId === null) {
      folderHistory.value = [];
    } else {
      // 否则添加到历史记录
      folderHistory.value.push(folderId);
      // 确保在 folderMap 中有这个文件夹的信息
      if (folderName && !folderMap.value.has(folderId)) {
        folderMap.value.set(folderId, { id: folderId, name: folderName });
      }
    }
    loadFiles(folderId);
  }

  // 跳转到特定文件夹（面包屑导航）
  function goToFolder(targetFolderId) {
    if (targetFolderId === null) {
      // 根目录
      folderHistory.value = [];
    } else {
      // 找到目标文件夹在历史记录中的位置，截断到那个位置
      const index = folderHistory.value.indexOf(targetFolderId);
      if (index !== -1) {
        folderHistory.value = folderHistory.value.slice(0, index + 1);
      }
    }
    loadFiles(targetFolderId);
  }

  async function loadStats() {
    try {
      const response = await filesAPI.getStats();
      if (response.success) {
        stats.value = response.data || {
          fileCount: 0,
          folderCount: 0,
          totalSize: 0,
          sharedCount: 0
        };
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  }

  async function loadTrash() {
    isLoading.value = true;
    try {
      const response = await filesAPI.getFiles({ inTrash: 1 });
      if (response.success) {
        trashFiles.value = response.data.files || [];
        trashFolders.value = response.data.folders || [];
        selectedItems.value = [];
      }
    } catch (error) {
      toast.error(error.error || i18n.t('loadTrashFailed'));
      console.error('Failed to load trash:', error);
    } finally {
      isLoading.value = false;
    }
  }

  // 初始化上传队列
  function initUploadQueue(fileList, folderId = null, conflictAction = 'keepBoth') {
    uploadQueue.value = [];
    activeUploads.value = [];
    completedUploads.value = [];
    failedUploads.value = [];

    if (!fileList || fileList.length === 0) {
      return uploadQueue.value;
    }

    fileList.forEach((item, index) => {
      // 支持两种格式：直接的 File 对象 或 包含文件和扫描结果的对象
      const file = item.file || item;
      const securityStatus = item.securityStatus || 'pending';
      const scanResult = item.scanResult || null;
      
      uploadQueue.value.push({
        id: `upload-${Date.now()}-${index}`,
        file,
        name: file.name,
        size: file.size,
        progress: 0,
        status: 'pending', // pending, uploading, completed, failed, paused
        folderId,
        conflictAction,
        controller: null,
        securityStatus,
        scanResult,
      });
    });

    return uploadQueue.value;
  }

  // 开始上传
  async function startUploads(folderId = null, conflictAction = 'keepBoth') {
    const maxConcurrent = 3; // 最多同时上传 3 个文件
    
    while (uploadQueue.value.length > 0 || activeUploads.value.length > 0) {
      // 启动新的上传
      while (activeUploads.value.length < maxConcurrent && uploadQueue.value.length > 0) {
        const uploadItem = uploadQueue.value.shift();
        uploadItem.status = 'uploading';
        activeUploads.value.push(uploadItem);
        
        // 异步开始上传
        uploadSingleFile(uploadItem, folderId, conflictAction);
      }
      
      // 等待一下
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  // 上传单个文件
  async function uploadSingleFile(uploadItem, folderId, conflictAction) {
    const formData = new FormData();
    formData.append('files', uploadItem.file);
    const targetFolderId = folderId !== undefined && folderId !== null
      ? folderId
      : (uploadItem.folderId !== undefined ? uploadItem.folderId : null);
    if (targetFolderId !== null) {
      formData.append('folderId', targetFolderId);
    }
    const targetConflictAction = conflictAction || uploadItem.conflictAction || 'keepBoth';
    formData.append('conflictAction', targetConflictAction);

    // 创建 AbortController 用于取消上传
    const controller = new AbortController();
    uploadItem.controller = controller;

    // 标记是否被取消（区分暂停和取消）
    let wasCancelled = false;

    try {
      uploadItem.status = 'uploading';
      uploadItem.progress = 0;

      const response = await filesAPI.uploadWithProgress(
        formData,
        (progress) => {
          // 只有在上传状态下才更新进度
          if (uploadItem.status === 'uploading') {
            // 网络上传阶段占 0-85%，后端处理占 85-100%
            uploadItem.progress = Math.round(progress * 0.85);
          }
        },
        { signal: controller.signal }
      );

      // 网络上传完成，进入后端处理阶段（加密、扫描、写入数据库）
      uploadItem.progress = 85;
      uploadItem.status = 'processing';

      if (response.success) {
        // 检查是否有文件被跳过（因验证失败等原因）
        if (response.data.conflicts && response.data.conflicts.length > 0) {
          // 文件因验证等原因被跳过
          uploadItem.status = 'failed';
          uploadItem.errorReason = response.data.conflicts[0]?.reason || '文件验证失败';
          failedUploads.value.push(uploadItem);

          // 显示警告提示
          const conflictInfo = response.data.conflicts.map(c =>
            `${c.fileName}: ${c.reason}`
          ).join('；');
          toast.warning(`部分文件上传失败：${conflictInfo}`);
        } else {
          // 完全成功
          uploadItem.status = 'completed';
          uploadItem.progress = 100;
          completedUploads.value.push(uploadItem);
        }
      } else {
        throw response;
      }
    } catch (error) {
      if (error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
        // 检查是取消还是暂停
        if (uploadItem.status === 'paused') {
          // 暂停：将文件移回队列，保留当前进度
          wasCancelled = false;
          // 进度已经在 pauseUpload 中处理，这里不需要额外操作
        } else {
          // 取消：标记为失败
          wasCancelled = true;
          uploadItem.status = 'failed';
          uploadItem.errorReason = '已取消';
          failedUploads.value.push(uploadItem);
        }
      } else {
        uploadItem.status = 'failed';
        uploadItem.errorReason = error.message || '上传失败';
        failedUploads.value.push(uploadItem);
        console.error('Upload failed:', error);
      }
    } finally {
      // 从 activeUploads 中移除（仅当不是暂停状态时）
      if (uploadItem.status !== 'paused') {
        const index = activeUploads.value.findIndex(u => u.id === uploadItem.id);
        if (index > -1) {
          activeUploads.value.splice(index, 1);
        }
      }

      // 检查是否所有上传都完成
      if (uploadQueue.value.length === 0 && activeUploads.value.length === 0) {
        if (failedUploads.value.length > 0 && completedUploads.value.length === 0) {
          // 全部失败
          toast.error(i18n.t('uploadFailed') || '上传失败');
        } else if (failedUploads.value.length > 0 && completedUploads.value.length > 0) {
          // 部分成功部分失败
          toast.warning(i18n.t('uploadPartialSuccess') || `${completedUploads.value.length} 个文件上传成功，${failedUploads.value.length} 个文件上传失败`);
        } else {
          // 全部成功
          toast.success(i18n.t('uploadSuccess') || '上传成功');
        }
        await loadFiles(currentFolderId.value);
      }
    }
  }

  // 暂停上传
  function pauseUpload(uploadId) {
    const upload = activeUploads.value.find(u => u.id === uploadId);
    if (upload && upload.controller) {
      // 先标记为暂停状态，再中止请求
      upload.status = 'paused';
      upload.controller.abort();
      // 移回队列前端
      const index = activeUploads.value.findIndex(u => u.id === uploadId);
      if (index > -1) {
        activeUploads.value.splice(index, 1);
      }
      // 保留当前进度，添加到队列前端以便恢复
      uploadQueue.value.unshift(upload);
    }
  }

  // 恢复上传
  function resumeUpload(uploadId) {
    const upload = uploadQueue.value.find(u => u.id === uploadId);
    if (upload && upload.status === 'paused') {
      // 重置状态为pending，让 startUploads 处理
      upload.status = 'pending';
      // 进度从0开始重新上传（断点续传需要后端支持）
      upload.progress = 0;
      upload.controller = null;
    }
  }

  // 取消上传
  function cancelUpload(uploadId) {
    // 检查在 activeUploads 中
    const activeIndex = activeUploads.value.findIndex(u => u.id === uploadId);
    if (activeIndex > -1) {
      const upload = activeUploads.value[activeIndex];
      if (upload.controller) {
        upload.controller.abort();
      }
      activeUploads.value.splice(activeIndex, 1);
      return;
    }

    // 检查在 queue 中
    const queueIndex = uploadQueue.value.findIndex(u => u.id === uploadId);
    if (queueIndex > -1) {
      uploadQueue.value.splice(queueIndex, 1);
    }
  }

  // 清空上传记录
  function clearUploads() {
    uploadQueue.value = [];
    activeUploads.value = [];
    completedUploads.value = [];
    failedUploads.value = [];
  }

  // 重新上传失败的文件
  async function retryFailedUploads() {
    failedUploads.value.forEach(upload => {
      upload.status = 'pending';
      upload.progress = 0;
      uploadQueue.value.push(upload);
    });
    failedUploads.value = [];
    await startUploads();
  }

  // 重试单个上传
  async function retryUpload(uploadId) {
    const index = failedUploads.value.findIndex(u => u.id === uploadId);
    if (index > -1) {
      const upload = { ...failedUploads.value[index] };
      upload.status = 'pending';
      upload.progress = 0;
      failedUploads.value.splice(index, 1);
      uploadQueue.value.push(upload);
      await startUploads();
    }
  }

  // 旧的上传方法（保持兼容性）
  async function uploadFiles(selectedFiles, folderId = null, conflictAction = 'keepBoth') {
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append('files', file);
    });
    if (folderId !== null) {
      formData.append('folderId', folderId);
    }
    formData.append('conflictAction', conflictAction);

    try {
      const response = await filesAPI.upload(formData);
      if (response.success) {
        toast.success(i18n.t('uploadSuccess'));
        await loadFiles(currentFolderId.value);
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('uploadFailed'));
      throw error;
    }
  }

  async function deleteFile(fileId) {
    try {
      const response = await filesAPI.delete(fileId);
      if (response.success) {
        toast.success(i18n.t('deleteSuccess'));
        await loadFiles(currentFolderId.value);
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('deleteFailed'));
      throw error;
    }
  }

  async function deleteSelectedItems() {
    for (const itemId of selectedItems.value) {
      await deleteFile(itemId);
    }
    selectedItems.value = [];
  }

  async function restoreFile(fileId) {
    try {
      const response = await filesAPI.restore(fileId);
      if (response.success) {
        toast.success(i18n.t('fileRestored'));
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('restoreFailed'));
      throw error;
    }
  }

  async function deletePermanently(fileId) {
    try {
      const response = await filesAPI.deletePermanently(fileId);
      if (response.success) {
        toast.success(i18n.t('fileDeleted'));
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('deleteFailed'));
      throw error;
    }
  }

  async function emptyTrash() {
    try {
      const response = await filesAPI.emptyTrash();
      if (response.success) {
        toast.success(i18n.t('trashEmptied'));
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('emptyTrashFailed'));
      throw error;
    }
  }

  async function downloadFile(fileId) {
    try {
      const response = await filesAPI.download(fileId);
      // 响应拦截器已经为 blob 类型保留了完整响应
      if (response.config?.responseType === 'blob') {
        return response.data;
      }
      return response;
    } catch (error) {
      toast.error(error.error || '下载失败');
      throw error;
    }
  }

  async function previewFile(fileId) {
    try {
      const response = await filesAPI.preview(fileId);
      // 响应拦截器已经为 blob 类型保留了完整响应
      if (response.config?.responseType === 'blob') {
        return response.data;
      }
      return response;
    } catch (error) {
      toast.error(error.error || '预览失败');
      throw error;
    }
  }

  async function searchFiles(query) {
    try {
      const response = await filesAPI.search({ query });
      if (response.success) {
        return response.data.files || [];
      }
      throw response;
    } catch (error) {
      toast.error(error.error || '搜索失败');
      throw error;
    }
  }

  async function renameFile(fileId, newName) {
    try {
      const response = await filesAPI.rename(fileId, { newName });
      if (response.success) {
        toast.success(i18n.t('renameSuccess'));
        await loadFiles(currentFolderId.value);
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || i18n.t('renameFailed'));
      throw error;
    }
  }

  async function moveFile(fileIds, targetFolderId = null, conflictAction = 'replace') {
    try {
      const response = await filesAPI.move({ fileIds, targetFolderId, conflictAction });
      if (response.success) {
        toast.success(i18n.t('moveSuccess') || 'Moved successfully');
        await loadFiles(currentFolderId.value);
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || (i18n.t('moveFailed') || 'Move failed'));
      throw error;
    }
  }

  async function createFolder(name, parentId = null, conflictAction = 'merge') {
    try {
      const response = await filesAPI.createFolder({ name, parentId, conflictAction });
      if (response.success) {
        // 检查是否跳过
        if (response.data?.skipped) {
          toast.info(i18n.t('folderSkipped') || '文件夹创建已跳过');
        }
        // 检查是否有冲突
        else if (response.data?.conflict) {
          // 合并模式
          if (conflictAction === 'merge') {
            toast.info(i18n.t('folderMerged') || '文件夹已存在，内容已合并');
          } else if (conflictAction === 'skip') {
            toast.info(i18n.t('folderSkipped') || '文件夹创建已跳过');
          } else if (conflictAction === 'keepBoth') {
            toast.success(i18n.t('folderCreated') || '文件夹创建成功（已重命名）');
          } else {
            toast.success(i18n.t('folderCreated') || '文件夹创建成功');
          }
        } else {
          toast.success(i18n.t('folderCreated') || '文件夹创建成功');
        }
        await loadFiles(currentFolderId.value);
        return response.data;
      }
      throw response;
    } catch (error) {
      const errorMessage = typeof error.error === 'object' ? error.error.message : error.error;
      toast.error(errorMessage || i18n.t('folderCreateFailed'));
      throw error;
    }
  }

  function toggleSelectItem(itemId) {
    const index = selectedItems.value.indexOf(itemId);
    if (index > -1) {
      selectedItems.value.splice(index, 1);
    } else {
      selectedItems.value.push(itemId);
    }
  }

  function selectAll() {
    const allItems = [...folders.value.map((f) => f.id), ...files.value.map((f) => f.id)];
    selectedItems.value = allItems;
  }

  function clearSelection() {
    selectedItems.value = [];
  }

  async function shareFile(fileId, data = {}) {
    try {
      const response = await sharesAPI.createShare(fileId, data);
      if (response.success) {
        toast.success(i18n.t('shareCreated') || 'Share created successfully');
        await loadStats(); // 更新统计数据
        return response.data;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || (i18n.t('shareFailed') || 'Failed to create share'));
      throw error;
    }
  }

  return {
    files,
    folders,
    currentFolderId,
    isLoading,
    trashFiles,
    trashFolders,
    selectedItems,
    hasSelectedItems,
    breadcrumbs,
    stats,
    // 上传相关
    uploadQueue,
    activeUploads,
    completedUploads,
    failedUploads,
    isUploading,
    uploadProgress,
    initUploadQueue,
    startUploads,
    pauseUpload,
    resumeUpload,
    cancelUpload,
    clearUploads,
    retryUpload,
    retryFailedUploads,
    // 基础功能
    loadFiles,
    loadTrash,
    uploadFiles,
    deleteFile,
    deleteSelectedItems,
    restoreFile,
    deletePermanently,
    emptyTrash,
    downloadFile,
    previewFile,
    loadStats,
    searchFiles,
    renameFile,
    moveFile,
    createFolder,
    toggleSelectItem,
    selectAll,
    clearSelection,
    shareFile,
    navigateToFolder, // 新添加的导航到文件夹
    goToFolder, // 新添加的跳转到文件夹（面包屑导航）
  };
});
