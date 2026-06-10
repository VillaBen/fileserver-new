import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { notificationsAPI } from '../api';
import { useAuthStore } from './auth';

export const useNotificationStore = defineStore('notifications', () => {
  const notifications = ref([]);
  const unreadCount = ref(0);
  const totalCount = ref(0);
  const isLoading = ref(false);

  const unreadNotifications = computed(() =>
    notifications.value.filter((n) => !n.read)
  );

  const readNotifications = computed(() =>
    notifications.value.filter((n) => n.read)
  );

  async function fetchNotifications(params = {}) {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;

    isLoading.value = true;
    try {
      const response = await notificationsAPI.getNotifications(params);
      if (response.success) {
        notifications.value = response.data?.notifications || [];
        unreadCount.value = response.data?.unreadCount || 0;
        totalCount.value = response.data?.totalCount || 0;
      }
    } catch (error) {
      console.error('获取通知失败:', error);
    } finally {
      isLoading.value = false;
    }
  }

  async function markAsRead(id) {
    try {
      const response = await notificationsAPI.markAsRead(id);
      if (response.success) {
        const notif = notifications.value.find((n) => n.id === id);
        if (notif) {
          notif.read = 1;
          notif.read_at = new Date().toISOString();
        }
        if (unreadCount.value > 0) unreadCount.value--;
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  }

  async function markAllAsRead() {
    try {
      const response = await notificationsAPI.markAllAsRead();
      if (response.success) {
        notifications.value.forEach((n) => {
          n.read = 1;
          n.read_at = new Date().toISOString();
        });
        unreadCount.value = 0;
      }
    } catch (error) {
      console.error('全部标记已读失败:', error);
    }
  }

  async function deleteNotification(id) {
    try {
      const response = await notificationsAPI.deleteNotification(id);
      if (response.success) {
        const idx = notifications.value.findIndex((n) => n.id === id);
        if (idx !== -1) {
          const wasUnread = !notifications.value[idx].read;
          notifications.value.splice(idx, 1);
          if (wasUnread && unreadCount.value > 0) unreadCount.value--;
          if (totalCount.value > 0) totalCount.value--;
        }
      }
    } catch (error) {
      console.error('删除通知失败:', error);
    }
  }

  async function clearAll() {
    try {
      const response = await notificationsAPI.clearAll();
      if (response.success) {
        notifications.value = [];
        unreadCount.value = 0;
        totalCount.value = 0;
      }
    } catch (error) {
      console.error('清空通知失败:', error);
    }
  }

  function addLocalNotification(notif) {
    notifications.value.unshift({
      id: Date.now(),
      type: notif.type || 'info',
      title: notif.title,
      message: notif.message || '',
      action_url: notif.action_url || null,
      read: 0,
      created_at: new Date().toISOString(),
    });
    unreadCount.value++;
    totalCount.value++;
  }

  function reset() {
    notifications.value = [];
    unreadCount.value = 0;
    totalCount.value = 0;
  }

  return {
    notifications,
    unreadCount,
    totalCount,
    isLoading,
    unreadNotifications,
    readNotifications,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAll,
    addLocalNotification,
    reset,
  };
});
