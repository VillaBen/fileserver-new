<template>
  <div class="admin-dashboard">
    <!-- Stats Grid -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">
          <el-icon :size="28"><User /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalUsers || 0 }}</div>
          <div class="stat-label">{{ i18n.t('totalUsers') || 'Total Users' }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon green">
          <el-icon :size="28"><FolderOpened /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalFiles || 0 }}</div>
          <div class="stat-label">{{ i18n.t('totalFiles') || 'Total Files' }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon purple">
          <el-icon :size="28"><Files /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.totalStorage || '0 B' }}</div>
          <div class="stat-label">{{ i18n.t('totalStorage') || 'Total Storage' }}</div>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon orange">
          <el-icon :size="28"><TrendCharts /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-number">{{ stats.activeToday || 0 }}</div>
          <div class="stat-label">{{ i18n.t('activeToday') || 'Active Today' }}</div>
        </div>
      </div>
    </div>
    
    <!-- Recent Activity -->
    <div class="activity-section">
      <div class="section-header">
        <h2 class="section-title">{{ i18n.t('recentActivity') || 'Recent Activity' }}</h2>
      </div>
      
      <div v-if="loading" class="loading-wrapper">
        <LoadingSpinner :text="i18n.t('loading')" />
      </div>
      
      <div v-else class="activity-list">
        <div v-for="activity in recentActivity" :key="activity.id" class="activity-item">
          <div class="activity-icon" :class="getActivityType(activity.action)">
            <el-icon :size="20">
              <User v-if="isActionType(activity.action, ['register', 'created'])"/>
              <Upload v-else-if="isActionType(activity.action, ['upload'])"/>
              <Lock v-else-if="isActionType(activity.action, ['password', 'change'])"/>
              <Share v-else-if="isActionType(activity.action, ['share'])"/>
              <Folder v-else-if="isActionType(activity.action, ['folder'])"/>
              <Setting v-else/>
            </el-icon>
          </div>
          <div class="activity-content">
            <div class="activity-action">{{ activity.action }}</div>
            <div class="activity-user">{{ i18n.t('by') }} {{ activity.username }}</div>
          </div>
          <div class="activity-time">{{ formatTime(activity.createdAt || activity.created_at) }}</div>
        </div>
        
        <EmptyState
          v-if="recentActivity.length === 0"
          type="search"
          :title="i18n.t('noActivity') || 'No activity'"
          :description="i18n.t('noActivityDescription') || 'No recent activity to show'"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { User, FolderOpened, Files, TrendCharts, Upload, Lock, Share, Folder, Setting } from '@element-plus/icons-vue';
import { useI18nStore } from '../../stores/i18n';
import { useAdminStore } from '../../stores/admin';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import EmptyState from '../../components/EmptyState.vue';

const i18n = useI18nStore();
const adminStore = useAdminStore();

const loading = computed(() => adminStore.isLoading);
const dashboardStats = computed(() => adminStore.dashboardStats);
const recentActivity = ref([]);

const stats = computed(() => ({
  totalUsers: dashboardStats.value.totalUsers || 0,
  totalFiles: dashboardStats.value.totalFiles || 0,
  totalStorage: dashboardStats.value.totalStorage || '0 B',
  activeToday: dashboardStats.value.activeToday || 0
}));

onMounted(async () => {
  await loadDashboardData();
});

const loadDashboardData = async () => {
  await adminStore.loadDashboardStats();
  await loadRecentActivity();
};

const loadRecentActivity = async () => {
  await adminStore.loadAuditLogs({ limit: 10 });
  recentActivity.value = adminStore.auditLogs;
};

const formatTime = (date) => {
  if (!date) return '';
  const now = new Date();
  const diff = now - new Date(date);
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  
  if (minutes < 60) {
    return `${minutes}m ${i18n.t('ago') || 'ago'}`;
  } else if (hours < 24) {
    return `${hours}h ${i18n.t('ago') || 'ago'}`;
  } else {
    return new Date(date).toLocaleDateString();
  }
};

const getActivityType = (action) => {
  if (isActionType(action, ['register', 'created'])) return 'success';
  if (isActionType(action, ['upload', 'file'])) return 'primary';
  if (isActionType(action, ['password', 'change', 'security'])) return 'warning';
  if (isActionType(action, ['share'])) return 'info';
  if (isActionType(action, ['folder'])) return 'success';
  return 'default';
};

const isActionType = (action, types) => {
  if (!action) return false;
  return types.some(type => action.toLowerCase().includes(type.toLowerCase()));
};
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* Stats Grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 16px;
}

.stat-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.stat-icon {
  width: 56px;
  height: 56px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon.blue {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
}

.stat-icon.green {
  background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);
}

.stat-icon.purple {
  background: linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%);
}

.stat-icon.orange {
  background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
}

.stat-content {
  flex: 1;
}

.stat-number {
  font-size: 32px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  line-height: 1.2;
}

.stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

/* Activity Section */
.activity-section {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
}

.section-header {
  margin-bottom: 20px;
}

.section-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--el-bg-color-page);
  border-radius: 12px;
  transition: all 0.2s;
}

.activity-item:hover {
  background: var(--el-bg-color);
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-icon.default {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.activity-icon.success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.activity-icon.primary {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.activity-icon.warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.activity-icon.info {
  background: var(--el-color-info-light-9);
  color: var(--el-color-info);
}

.activity-content {
  flex: 1;
}

.activity-action {
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.activity-user {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.activity-time {
  font-size: 13px;
  color: var(--el-text-color-placeholder);
  white-space: nowrap;
}

@media (max-width: 768px) {
  .stats-grid {
    grid-template-columns: 1fr;
  }
  
  .stat-number {
    font-size: 24px;
  }
  
  .activity-item {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>
