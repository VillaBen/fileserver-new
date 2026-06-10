<template>
  <div class="notification-center">
    <button
      class="notif-btn"
      @click="togglePanel"
      :class="{ 'has-unread': notificationStore.unreadCount > 0 }"
    >
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
        <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
      </svg>
      <span v-if="notificationStore.unreadCount > 0" class="badge">
        {{ notificationStore.unreadCount > 99 ? '99+' : notificationStore.unreadCount }}
      </span>
    </button>

    <!-- 通知面板 -->
    <div v-if="isPanelOpen" class="notif-panel" @click.stop>
      <div class="panel-header">
        <div class="panel-title">
          通知中心
          <span class="count-badge" v-if="notificationStore.totalCount > 0">
            {{ notificationStore.totalCount }}
          </span>
        </div>
        <div class="panel-actions">
          <button
            v-if="notificationStore.unreadCount > 0"
            class="action-btn"
            @click="handleMarkAllRead"
          >
            全部已读
          </button>
          <button
            v-if="notificationStore.totalCount > 0"
            class="action-btn danger"
            @click="handleClearAll"
          >
            清空
          </button>
          <button class="action-btn" @click="isPanelOpen = false">关闭</button>
        </div>
      </div>

      <div class="panel-body">
        <div v-if="notificationStore.isLoading" class="loading">
          加载中...
        </div>
        <div v-else-if="notificationStore.notifications.length === 0" class="empty">
          <div class="empty-icon">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="currentColor">
              <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
            </svg>
          </div>
          <div class="empty-text">暂无通知</div>
        </div>
        <div v-else class="notif-list">
          <div
            v-for="notif in notificationStore.notifications"
            :key="notif.id"
            class="notif-item"
            :class="{ unread: !notif.read }"
            @click="handleClickNotif(notif)"
          >
            <div class="notif-icon" :class="'type-' + (notif.type || 'info')">
              <svg v-if="notif.type === 'success'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
              </svg>
              <svg v-else-if="notif.type === 'warning'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M1 21h22L12 2 1 21zm12-3h-2v-2h2v2zm0-4h-2v-4h2v4z"/>
              </svg>
              <svg v-else-if="notif.type === 'error'" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z"/>
              </svg>
              <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
              </svg>
            </div>
            <div class="notif-content">
              <div class="notif-title">{{ notif.title }}</div>
              <div v-if="notif.message" class="notif-message">{{ notif.message }}</div>
              <div class="notif-time">{{ formatTime(notif.created_at) }}</div>
            </div>
            <button
              class="notif-delete"
              @click.stop="handleDelete(notif.id)"
              title="删除"
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 点击外部遮罩 -->
    <div v-if="isPanelOpen" class="overlay" @click="isPanelOpen = false"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useNotificationStore } from '../stores/notifications';
import { useAuthStore } from '../stores/auth';
import { toast } from '../utils/toast';

const notificationStore = useNotificationStore();
const authStore = useAuthStore();

const isPanelOpen = ref(false);

function togglePanel() {
  isPanelOpen.value = !isPanelOpen.value;
  if (isPanelOpen.value) {
    notificationStore.fetchNotifications({ limit: 50 });
  }
}

function handleClickNotif(notif) {
  if (!notif.read) {
    notificationStore.markAsRead(notif.id);
  }
  if (notif.action_url) {
    window.location.href = notif.action_url;
  }
}

async function handleMarkAllRead() {
  await notificationStore.markAllAsRead();
  toast.success('已标记全部为已读');
}

async function handleClearAll() {
  if (confirm('确定要清空所有通知吗？')) {
    await notificationStore.clearAll();
    toast.success('通知已清空');
  }
}

async function handleDelete(id) {
  await notificationStore.deleteNotification(id);
}

function formatTime(t) {
  if (!t) return '';
  const date = new Date(t);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return '刚刚';
  if (diffSec < 3600) return Math.floor(diffSec / 60) + ' 分钟前';
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + ' 小时前';
  if (diffSec < 604800) return Math.floor(diffSec / 86400) + ' 天前';
  return date.toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

// 登录后拉取通知
watch(
  () => authStore.isAuthenticated,
  (val) => {
    if (val) {
      notificationStore.fetchNotifications({ limit: 20 });
    } else {
      notificationStore.reset();
    }
  },
  { immediate: true }
);

// 每隔一段时间刷新一次未读数量
let refreshTimer = null;
onMounted(() => {
  if (refreshTimer) clearInterval(refreshTimer);
  refreshTimer = setInterval(() => {
    if (authStore.isAuthenticated && !isPanelOpen.value) {
      notificationStore.fetchNotifications({ limit: 10 });
    }
  }, 60000);
});
</script>

<style scoped>
.notification-center {
  position: relative;
}

.notif-btn {
  position: relative;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: transparent;
  border: none;
  color: var(--text-secondary, #94a3b8);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s, color 0.2s;
}

.notif-btn:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--accent-color, #3b82f6);
}

.notif-btn.has-unread {
  color: var(--accent-color, #3b82f6);
}

.badge {
  position: absolute;
  top: 4px;
  right: 4px;
  min-width: 16px;
  height: 16px;
  padding: 0 4px;
  border-radius: 8px;
  background: #ef4444;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 16px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overlay {
  position: fixed;
  inset: 0;
  z-index: 998;
  background: transparent;
}

.notif-panel {
  position: absolute;
  top: 48px;
  right: 0;
  width: 380px;
  max-width: calc(100vw - 32px);
  background: var(--bg-surface, #fff);
  border: 1px solid var(--border-color, #e5e7eb);
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  z-index: 999;
  overflow: hidden;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  display: flex;
  align-items: center;
  gap: 8px;
}

.count-badge {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--accent-bg, #dbeafe);
  color: var(--accent-color, #3b82f6);
  border-radius: 10px;
  font-weight: 500;
}

.panel-actions {
  display: flex;
  gap: 6px;
}

.action-btn {
  padding: 6px 12px;
  font-size: 12px;
  border-radius: 6px;
  border: 1px solid var(--border-color, #e5e7eb);
  background: transparent;
  color: var(--text-secondary, #64748b);
  cursor: pointer;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--bg-hover, #f1f5f9);
  color: var(--accent-color, #3b82f6);
  border-color: var(--accent-color, #3b82f6);
}

.action-btn.danger:hover {
  color: #ef4444;
  border-color: #ef4444;
  background: #fef2f2;
}

.panel-body {
  max-height: 440px;
  overflow-y: auto;
}

.loading,
.empty {
  padding: 48px 20px;
  text-align: center;
  color: var(--text-secondary, #94a3b8);
  font-size: 13px;
}

.empty-icon {
  opacity: 0.3;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 13px;
}

.notif-list {
  display: flex;
  flex-direction: column;
}

.notif-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid var(--border-light, #f1f5f9);
  cursor: pointer;
  transition: background 0.15s;
  position: relative;
}

.notif-item:hover {
  background: var(--bg-hover, #f8fafc);
}

.notif-item.unread {
  background: var(--accent-bg-soft, #f0f9ff);
}

.notif-item.unread::before {
  content: '';
  position: absolute;
  left: 6px;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 4px;
  background: var(--accent-color, #3b82f6);
  border-radius: 50%;
}

.notif-icon {
  width: 34px;
  height: 34px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  background: #dbeafe;
  color: #3b82f6;
}

.notif-icon.type-success {
  background: #dcfce7;
  color: #22c55e;
}

.notif-icon.type-warning {
  background: #fef3c7;
  color: #f59e0b;
}

.notif-icon.type-error {
  background: #fee2e2;
  color: #ef4444;
}

.notif-content {
  flex: 1;
  min-width: 0;
}

.notif-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-primary, #1e293b);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notif-message {
  font-size: 12px;
  color: var(--text-secondary, #64748b);
  line-height: 1.5;
  margin-bottom: 4px;
}

.notif-time {
  font-size: 11px;
  color: var(--text-muted, #94a3b8);
}

.notif-delete {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background: transparent;
  border: none;
  color: var(--text-muted, #94a3b8);
  cursor: pointer;
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.15s, background 0.15s;
  flex-shrink: 0;
}

.notif-item:hover .notif-delete {
  opacity: 1;
}

.notif-delete:hover {
  background: #fee2e2;
  color: #ef4444;
}

@media (max-width: 480px) {
  .notif-panel {
    width: calc(100vw - 24px);
    right: -8px;
  }
}
</style>
