<template>
  <div class="app-layout">
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <div class="logo">
          <div class="logo-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <span class="logo-text">FileCloud</span>
        </div>
      </div>
      
      <nav class="sidebar-nav">
        <router-link 
          v-for="item in navItems" 
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
        >
          <span class="nav-icon" v-html="item.icon"></span>
          <span class="nav-label">{{ item.label }}</span>
        </router-link>
      </nav>
      
      <div class="sidebar-footer">
        <el-dropdown trigger="click" @command="handleUserCommand">
          <div class="user-info dropdown-trigger">
            <el-avatar :size="40" :src="user?.avatarUrl" class="user-avatar">
              {{ userInitials }}
            </el-avatar>
            <div class="user-details">
              <div class="user-name">{{ user?.username || 'User' }}</div>
              <div class="user-role">{{ user?.role === 'admin' ? 'Administrator' : 'Member' }}</div>
            </div>
          </div>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="profile">
                <el-icon><User /></el-icon>
                {{ i18n.t('profile') }}
              </el-dropdown-item>
              <el-dropdown-item command="settings">
                <el-icon><Setting /></el-icon>
                {{ i18n.t('settings') }}
              </el-dropdown-item>
              <el-dropdown-item divided command="logout">
                <el-icon><SwitchButton /></el-icon>
                {{ i18n.t('logout') }}
              </el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </div>
    </aside>
    
    <!-- Main Content -->
    <main class="main-content">
      <!-- Top Bar -->
      <header class="top-bar">
        <div class="top-bar-left">
          <h1 class="page-title">{{ pageTitle }}</h1>
        </div>
        <div class="top-bar-right">
          <el-input
            v-model="searchQuery"
            :placeholder="i18n.t('search') || 'Search files...'"
            prefix-icon="Search"
            clearable
            class="search-input"
            @keyup.enter="handleSearch"
          />
          <div class="storage-info">
            <div class="storage-bar">
              <div class="storage-used" :style="{ width: storagePercent + '%' }"></div>
            </div>
            <span class="storage-text">{{ storageUsed }} / {{ storageTotal }}</span>
          </div>
          <NotificationCenter @notification-click="handleNotificationClick" />
        </div>
      </header>
      
      <!-- Page Content -->
      <div class="page-content">
        <router-view></router-view>
      </div>
    </main>
  </div>
</template>

<script setup>
import { computed, ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import { useI18nStore } from '../stores/i18n';
import { User, Setting, SwitchButton, Bell } from '@element-plus/icons-vue';
import { userAPI } from '../api';
import { formatFileSize } from '../utils/format';
import NotificationCenter from './NotificationCenter.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const i18n = useI18nStore();

const user = computed(() => authStore.user);
const notificationCount = ref(3);
const searchQuery = ref('');

const storageLoading = ref(false);
const storageInfo = ref({
  used: 0,
  total: 10 * 1024 * 1024 * 1024
});

const storageUsed = computed(() => formatFileSize(storageInfo.value.used));
const storageTotal = computed(() => formatFileSize(storageInfo.value.total));
const storagePercent = computed(() => {
  if (storageInfo.value.total === 0) return 0;
  return Math.round((storageInfo.value.used / storageInfo.value.total) * 100);
});

const userInitials = computed(() => {
  if (!user.value?.username) return 'U';
  return user.value.username.substring(0, 2).toUpperCase();
});

const navItems = computed(() => {
  const items = [
    { 
      path: '/dashboard', 
      label: i18n.t('files'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>'
    },
    { 
      path: '/shares', 
      label: i18n.t('shares'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>'
    },
    { 
      path: '/trash', 
      label: i18n.t('trash'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>'
    },
    { 
      path: '/settings', 
      label: i18n.t('settings'),
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>'
    },
    { 
      path: '/security-settings', 
      label: i18n.t('securitySettings') || '安全设置',
      icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>'
    }
  ];

  if (user.value?.role === 'admin') {
        items.push({
          path: '/admin',
          label: i18n.t('adminPanel') || 'Admin',
          icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>',
          isAdmin: true
        });
      }

  return items;
});

const pageTitle = computed(() => {
  const currentItem = navItems.value.find(item => isActive(item.path));
  return currentItem?.label || i18n.t('dashboard');
});

onMounted(async () => {
  await loadStorageInfo();
});

async function loadStorageInfo() {
  storageLoading.value = true;
  try {
    const response = await userAPI.getStorage();
    if (response.success) {
      storageInfo.value = {
        used: response.data.used || 0,
        total: response.data.total || 10 * 1024 * 1024 * 1024
      };
    }
  } catch (error) {
    console.error('Failed to load storage info:', error);
  } finally {
    storageLoading.value = false;
  }
}

function isActive(path) {
  return route.path === path || route.path.startsWith(path + '/');
}

function handleUserCommand(command) {
  switch (command) {
    case 'profile':
    case 'settings':
      router.push('/settings');
      break;
    case 'logout':
      handleLogout();
      break;
  }
}

async function handleLogout() {
  await authStore.logout();
  router.push('/login');
}

function handleNotificationClick(notification) {
  if (notification.link) {
    router.push(notification.link);
  }
}

function handleSearch() {
  if (searchQuery.value.trim()) {
    router.push({
      path: '/dashboard',
      query: { search: searchQuery.value }
    });
  }
}
</script>

<style scoped>
.app-layout {
  display: flex;
  min-height: 100vh;
  background: var(--bg-page);
}

/* Sidebar */
.sidebar {
  width: 260px;
  background: white;
  border-right: 1px solid var(--el-border-color-light);
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  left: 0;
  top: 0;
  z-index: 100;
}

.sidebar-header {
  padding: 24px 20px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.logo {
  display: flex;
  align-items: center;
  gap: 12px;
}

.logo-icon {
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.logo-icon svg {
  width: 22px;
  height: 22px;
}

.logo-text {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.sidebar-nav {
  flex: 1;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  overflow-y: auto;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-radius: 12px;
  color: var(--el-text-color-secondary);
  text-decoration: none;
  transition: all 0.2s;
}

.nav-item:hover {
  background: var(--el-fill-color-light);
  color: var(--el-text-color-primary);
}

.nav-item.active {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-7) 100%);
  color: var(--el-color-primary);
  font-weight: 600;
}

.nav-icon {
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.nav-icon svg {
  width: 100%;
  height: 100%;
}

.nav-label {
  font-size: 14px;
}

.sidebar-footer {
  padding: 20px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  border-radius: 12px;
  transition: background 0.2s;
  cursor: pointer;
}

.user-info:hover {
  background: var(--el-fill-color-light);
}

.user-avatar {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  font-weight: 600;
}

.user-details {
  flex: 1;
  min-width: 0;
}

.user-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.user-role {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 2px;
}

.dropdown-trigger {
  display: flex;
  align-items: center;
}

/* Main Content */
.main-content {
  flex: 1;
  margin-left: 260px;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 32px;
  background: white;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.page-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
}

.top-bar-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-input {
  width: 280px;
}

.storage-info {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 16px;
  background: var(--el-fill-color-light);
  border-radius: 10px;
}

.storage-bar {
  width: 100px;
  height: 8px;
  background: var(--el-border-color-lighter);
  border-radius: 4px;
  overflow: hidden;
}

.storage-used {
  height: 100%;
  background: linear-gradient(90deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 4px;
  transition: width 0.3s;
}

.storage-text {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  white-space: nowrap;
}

.notification-badge {
  cursor: pointer;
}

.page-content {
  flex: 1;
  padding: 32px;
  overflow-y: auto;
}

@media (max-width: 768px) {
  .sidebar {
    width: 72px;
  }

  .logo-text,
  .nav-label {
    display: none;
  }

  .sidebar-header,
  .sidebar-nav {
    padding: 16px 12px;
  }

  .user-details {
    display: none;
  }

  .main-content {
    margin-left: 72px;
  }

  .page-content {
    padding: 20px;
  }

  .top-bar {
    padding: 16px 20px;
  }

  .storage-info {
    display: none;
  }
}
</style>
