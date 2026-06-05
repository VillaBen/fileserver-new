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
        return response;
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
