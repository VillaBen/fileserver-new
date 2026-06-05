<template>
  <div class="audit-logs-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ i18n.t('auditLogs') || 'Audit Logs' }}</h1>
        <p class="page-subtitle">{{ i18n.t('trackSystemActivities') || 'Track all system activities and changes' }}</p>
      </div>
      <div class="header-right">
        <el-button type="primary" @click="loadLogs" :loading="loading">
          <el-icon><Refresh /></el-icon>
          {{ i18n.t('refresh') || 'Refresh' }}
        </el-button>
      </div>
    </div>

    <div v-if="loading" class="loading-wrapper">
      <LoadingSpinner :text="i18n.t('loading') || 'Loading...'" />
    </div>

    <EmptyState
      v-else-if="logs.length === 0"
      type="search"
      :title="i18n.t('noAuditLogs') || 'No audit logs found'"
    />

    <div v-else class="logs-list">
      <div v-for="log in logs" :key="log.id" class="log-item">
        <div class="log-icon" :class="log.type">
          <el-icon v-if="log.type === 'info'"><InfoFilled /></el-icon>
          <el-icon v-else-if="log.type === 'success'"><CircleCheck /></el-icon>
          <el-icon v-else-if="log.type === 'warning'"><Warning /></el-icon>
          <el-icon v-else><CircleClose /></el-icon>
        </div>

        <div class="log-content">
          <div class="log-action">{{ log.action }}</div>
          <div class="log-details">{{ log.details }}</div>
          <div class="log-meta">
            <span class="log-user">{{ log.username }}</span>
            <span class="log-ip">{{ log.ipAddress }}</span>
            <span class="log-time">{{ formatTime(log.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>

    <el-pagination
      v-if="pagination.total > pagination.limit"
      :current-page="pagination.page"
      :page-size="pagination.limit"
      :total="pagination.total"
      @current-change="handlePageChange"
      class="pagination"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Refresh, InfoFilled, CircleCheck, Warning, CircleClose } from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';
import { useAdminStore } from '@/stores/admin';
import EmptyState from '@/components/EmptyState.vue';
import LoadingSpinner from '@/components/LoadingSpinner.vue';

const i18n = useI18nStore();
const adminStore = useAdminStore();

const loading = computed(() => adminStore.isLoading);
const logs = computed(() => adminStore.auditLogs);
const pagination = computed(() => adminStore.auditLogsPagination);

onMounted(async () => {
  await loadLogs();
});

async function loadLogs() {
  await adminStore.loadAuditLogs({
    page: pagination.value.page,
    limit: pagination.value.limit
  });
}

function formatTime(date) {
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
}

function handlePageChange(page) {
  adminStore.auditLogsPagination.page = page;
  loadLogs();
}
</script>

<style scoped>
.audit-logs-page {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.header-left {
  flex: 1;
}

.page-title {
  font-size: 28px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.page-subtitle {
  margin: 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.logs-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.log-item {
  display: flex;
  gap: 16px;
  background: var(--el-bg-color);
  border-radius: 12px;
  padding: 20px;
  box-shadow: var(--el-box-shadow-light);
  border: 1px solid var(--el-border-color-lighter);
  transition: all 0.2s;
}

.log-item:hover {
  transform: translateY(-2px);
  box-shadow: var(--el-box-shadow);
}

.log-icon {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.log-icon.info {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

.log-icon.success {
  background: var(--el-color-success-light-9);
  color: var(--el-color-success);
}

.log-icon.warning {
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning);
}

.log-icon.error {
  background: var(--el-color-danger-light-9);
  color: var(--el-color-danger);
}

.log-content {
  flex: 1;
}

.log-action {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.log-details {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin-bottom: 8px;
}

.log-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.log-user {
  font-weight: 500;
}

.pagination {
  margin-top: 24px;
  display: flex;
  justify-content: flex-end;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-right {
    width: 100%;
  }

  .page-title {
    font-size: 22px;
  }

  .log-item {
    flex-direction: column;
  }

  .log-meta {
    flex-direction: column;
    gap: 4px;
  }
}
</style>
