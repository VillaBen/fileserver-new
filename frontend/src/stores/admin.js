import { defineStore } from 'pinia';
import { ref } from 'vue';
import { adminAPI } from '../api';
import { toast } from '../utils/toast';

export const useAdminStore = defineStore('admin', () => {
  const dashboardStats = ref({});
  const users = ref([]);
  const auditLogs = ref([]);
  const allFiles = ref([]);
  const isLoading = ref(false);
  const usersPagination = ref({
    page: 1,
    limit: 20,
    total: 0
  });
  const auditLogsPagination = ref({
    page: 1,
    limit: 20,
    total: 0
  });

  async function loadDashboardStats() {
    isLoading.value = true;
    try {
      const response = await adminAPI.getDashboardStats();
      if (response.success) {
        dashboardStats.value = response.data || {};
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load dashboard stats');
      console.error('Failed to load dashboard stats:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadUsers(params = {}) {
    isLoading.value = true;
    try {
      const response = await adminAPI.getUsers({
        page: usersPagination.value.page,
        limit: usersPagination.value.limit,
        ...params
      });
      if (response.success) {
        users.value = response.data.users || [];
        if (response.data.total !== undefined) {
          usersPagination.value.total = response.data.total;
        }
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load users');
      console.error('Failed to load users:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function getUserDetails(accountId) {
    try {
      const response = await adminAPI.getUserDetails(accountId);
      if (response.success) {
        return response.data;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to load user details');
      throw error;
    }
  }

  async function updateUserRole(accountId, role) {
    try {
      const response = await adminAPI.updateUserRole(accountId, { role });
      if (response.success) {
        toast.success('User role updated');
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to update user role');
      throw error;
    }
  }

  async function updateUserStatus(accountId, status) {
    try {
      const response = await adminAPI.updateUserStatus(accountId, { status });
      if (response.success) {
        toast.success('User status updated');
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to update user status');
      throw error;
    }
  }

  async function updateUserQuota(accountId, quota) {
    try {
      const response = await adminAPI.updateUserQuota(accountId, { quota });
      if (response.success) {
        toast.success('User quota updated');
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to update user quota');
      throw error;
    }
  }

  async function deleteUser(accountId) {
    try {
      const response = await adminAPI.deleteUser(accountId);
      if (response.success) {
        toast.success('User deleted');
        return response;
      }
      throw response;
    } catch (error) {
      toast.error(error.error || 'Failed to delete user');
      throw error;
    }
  }

  async function loadAuditLogs(params = {}) {
    isLoading.value = true;
    try {
      const response = await adminAPI.getAuditLogs(params);
      if (response.success) {
        auditLogs.value = response.data.logs || [];
        if (response.data.total !== undefined) {
          auditLogsPagination.value.total = response.data.total;
        }
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load audit logs');
      console.error('Failed to load audit logs:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function loadAllFiles(params = {}) {
    isLoading.value = true;
    try {
      const response = await adminAPI.getAllFiles(params);
      if (response.success) {
        allFiles.value = response.data.files || [];
      }
    } catch (error) {
      toast.error(error.error || 'Failed to load files');
      console.error('Failed to load files:', error);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    dashboardStats,
    users,
    auditLogs,
    allFiles,
    isLoading,
    usersPagination,
    auditLogsPagination,
    loadDashboardStats,
    loadUsers,
    getUserDetails,
    updateUserRole,
    updateUserStatus,
    updateUserQuota,
    deleteUser,
    loadAuditLogs,
    loadAllFiles,
  };
});
