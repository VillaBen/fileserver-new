import { defineStore } from 'pinia';
import { ref } from 'vue';
import { sharesAPI } from '../api';
import { toast } from '../utils/toast';

export const useSharesStore = defineStore('shares', () => {
  const shares = ref([]);
  const isLoading = ref(false);

  async function loadShares() {
    isLoading.value = true;
    try {
      const response = await sharesAPI.getShares();
      if (response.success) {
        shares.value = response.data || [];
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load shares');
      console.error('Failed to load shares:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function createShare(fileId, data) {
    try {
      const response = await sharesAPI.createShare(fileId, data);
      if (response.success) {
        toast.success('Share created successfully');
        await loadShares();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to create share');
      throw error;
    }
  }

  async function updateShare(shareId, data) {
    try {
      const response = await sharesAPI.updateShare(shareId, data);
      if (response.success) {
        toast.success('Share updated successfully');
        await loadShares();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to update share');
      throw error;
    }
  }

  async function deleteShare(shareId) {
    try {
      const response = await sharesAPI.deleteShare(shareId);
      if (response.success) {
        toast.success('Share deleted successfully');
        await loadShares();
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to delete share');
      throw error;
    }
  }

  async function getShareInfo(code) {
    try {
      const response = await sharesAPI.getShareInfo(code);
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to get share info');
      throw error;
    }
  }

  async function downloadShare(code, password) {
    try {
      const response = await sharesAPI.downloadShare(code, { password });
      return response;
    } catch (error) {
      toast.error(error.error || 'Failed to download file');
      throw error;
    }
  }

  return {
    shares,
    isLoading,
    loadShares,
    createShare,
    updateShare,
    deleteShare,
    getShareInfo,
    downloadShare,
  };
});
