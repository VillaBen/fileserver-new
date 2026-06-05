import { defineStore } from 'pinia';
import { ref } from 'vue';
import { filesAPI } from '../api';
import { toast } from '../utils/toast';

export const useTrashStore = defineStore('trash', () => {
  const trashedFiles = ref([]);
  const trashedFolders = ref([]);
  const isLoading = ref(false);

  async function loadTrash() {
    isLoading.value = true;
    try {
      const response = await filesAPI.getFiles({ inTrash: 1 });
      if (response.success) {
        trashedFiles.value = response.data.files || [];
        trashedFolders.value = response.data.folders || [];
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load trash');
      console.error('Failed to load trash:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function restoreFile(fileId, conflictAction = 'keepBoth') {
    try {
      const response = await filesAPI.restore(fileId, { conflictAction });
      if (response.success) {
        toast.success('File restored successfully');
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to restore file');
      throw error;
    }
  }

  async function deletePermanently(fileId) {
    try {
      const response = await filesAPI.deletePermanently(fileId);
      if (response.success) {
        toast.success('File permanently deleted');
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to delete file');
      throw error;
    }
  }

  async function emptyTrash() {
    try {
      const response = await filesAPI.emptyTrash();
      if (response.success) {
        toast.success('Trash emptied successfully');
        await loadTrash();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to empty trash');
      throw error;
    }
  }

  return {
    trashedFiles,
    trashedFolders,
    isLoading,
    loadTrash,
    restoreFile,
    deletePermanently,
    emptyTrash,
  };
});
