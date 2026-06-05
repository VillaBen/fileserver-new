<template>
  <el-dropdown
    v-model="visible"
    trigger="click"
    @visible-change="handleVisibleChange"
    placement="bottom-end"
  >
    <div class="notification-trigger">
      <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
        <el-button circle>
          <el-icon :size="20"><Bell /></el-icon>
        </el-button>
      </el-badge>
    </div>
    
    <template #dropdown>
      <el-dropdown-menu class="notification-dropdown">
        <div class="notification-header">
          <h3 class="notification-title">{{ i18n.t('notifications') || 'Notifications' }}</h3>
          <el-button 
            v-if="notifications.length > 0" 
            text 
            size="small"
            @click="markAllAsRead"
          >
            {{ i18n.t('markAllAsRead') || 'Mark all as read' }}
          </el-button>
        </div>
        
        <div class="notification-list" v-if="notifications.length > 0">
          <div
            v-for="notification in notifications"
            :key="notification.id"
            class="notification-item"
            :class="{ unread: !notification.read }"
            @click="handleNotificationClick(notification)"
          >
            <div class="notification-icon" :class="notification.type">
              <el-icon size="18">
                <Bell v-if="notification.type === 'system'" />
                <Share v-else-if="notification.type === 'share'" />
                <Upload v-else-if="notification.type === 'upload'" />
                <Download v-else-if="notification.type === 'download'" />
                <Warning v-else />
              </el-icon>
            </div>
            
            <div class="notification-content">
              <div class="notification-message">{{ notification.message }}</div>
              <div class="notification-time">{{ formatTime(notification.createdAt) }}</div>
            </div>
            
            <div class="notification-actions">
              <el-button
                v-if="!notification.read"
                circle
                size="small"
                text
                @click.stop="markAsRead(notification)"
                :title="i18n.t('markAsRead') || 'Mark as read'"
              >
                <el-icon><Check /></el-icon>
              </el-button>
              <el-button
                circle
                size="small"
                text
                @click.stop="deleteNotification(notification)"
                :title="i18n.t('delete') || 'Delete'"
              >
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
        </div>
        
        <div class="notification-empty" v-else>
          <el-icon size="48" class="empty-icon"><Bell /></el-icon>
          <p>{{ i18n.t('noNotifications') || 'No notifications' }}</p>
        </div>
        
        <div class="notification-footer" v-if="notifications.length > 0">
          <el-button text size="small" @click="clearAll">
            {{ i18n.t('clearAll') || 'Clear all' }}
          </el-button>
        </div>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Bell, Share, Upload, Download, Warning, Check, Delete } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { toast } from '../utils/toast';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'notification-click', 'mark-read', 'delete']);

const i18n = useI18nStore();
const visible = ref(false);

// Mock notifications data
const notifications = ref([
  {
    id: '1',
    type: 'share',
    message: 'John shared "Project Report.pdf" with you',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 2),
    link: '/shares'
  },
  {
    id: '2',
    type: 'upload',
    message: 'File upload completed: Annual Report.xlsx',
    read: false,
    createdAt: new Date(Date.now() - 3600000 * 5),
    link: '/dashboard'
  },
  {
    id: '3',
    type: 'system',
    message: 'Storage usage reached 80%',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 24),
    link: '/settings'
  },
  {
    id: '4',
    type: 'download',
    message: 'Download completed: Team Photo.jpg',
    read: true,
    createdAt: new Date(Date.now() - 3600000 * 48),
    link: '/dashboard'
  }
]);

const unreadCount = computed(() => {
  return notifications.value.filter(n => !n.read).length;
});

const handleVisibleChange = (val) => {
  visible.value = val;
};

const formatTime = (date) => {
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  
  if (minutes < 1) {
    return i18n.t('justNow') || 'Just now';
  } else if (minutes < 60) {
    return `${minutes} ${i18n.t('minutesAgo') || 'min ago'}`;
  } else if (hours < 24) {
    return `${hours} ${i18n.t('hoursAgo') || 'h ago'}`;
  } else {
    return `${days} ${i18n.t('daysAgo') || 'd ago'}`;
  }
};

const handleNotificationClick = (notification) => {
  if (!notification.read) {
    markAsRead(notification);
  }
  
  if (notification.link) {
    emit('notification-click', notification);
  }
};

const markAsRead = (notification) => {
  notification.read = true;
  toast.success(i18n.t('markedAsRead') || 'Marked as read');
  emit('mark-read', notification);
};

const markAllAsRead = () => {
  notifications.value.forEach(n => {
    n.read = true;
  });
  toast.success(i18n.t('allMarkedAsRead') || 'All notifications marked as read');
  emit('mark-read', null);
};

const deleteNotification = (notification) => {
  const index = notifications.value.findIndex(n => n.id === notification.id);
  if (index > -1) {
    notifications.value.splice(index, 1);
    toast.success(i18n.t('notificationDeleted') || 'Notification deleted');
    emit('delete', notification);
  }
};

const clearAll = () => {
  notifications.value = [];
  toast.success(i18n.t('allNotificationsCleared') || 'All notifications cleared');
  emit('delete', null);
};
</script>

<style scoped>
.notification-trigger {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.notification-dropdown {
  width: 380px;
  max-height: 500px;
  padding: 0;
}

.notification-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid var(--el-border-color-light);
}

.notification-title {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.notification-list {
  max-height: 400px;
  overflow-y: auto;
}

.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  cursor: pointer;
  transition: background-color 0.2s;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.notification-item:hover {
  background-color: var(--el-fill-color-light);
}

.notification-item.unread {
  background-color: var(--el-color-primary-light-9);
}

.notification-item.unread:hover {
  background-color: var(--el-color-primary-light-8);
}

.notification-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.notification-icon.system {
  background-color: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.notification-icon.share {
  background-color: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.notification-icon.upload {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.notification-icon.download {
  background-color: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.notification-content {
  flex: 1;
  min-width: 0;
}

.notification-message {
  font-size: 14px;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
  line-height: 1.4;
}

.notification-time {
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.notification-actions {
  display: flex;
  gap: 4px;
  opacity: 0;
  transition: opacity 0.2s;
}

.notification-item:hover .notification-actions {
  opacity: 1;
}

.notification-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--el-text-color-secondary);
}

.empty-icon {
  margin-bottom: 12px;
  opacity: 0.3;
}

.notification-footer {
  padding: 12px 16px;
  border-top: 1px solid var(--el-border-color-light);
  text-align: center;
}
</style>
