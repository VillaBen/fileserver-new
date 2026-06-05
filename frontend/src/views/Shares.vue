<template>
  <div class="shares-page">
    <div class="page-header">
      <div class="page-header-left">
        <h1 class="page-title">{{ i18n.t('sharedFiles') }}</h1>
        <p class="page-subtitle">{{ i18n.t('manageShared') }}</p>
      </div>
      <div class="page-header-right">
        <el-input
          v-model="searchQuery"
          :placeholder="i18n.t('searchFiles')"
          prefix-icon="Search"
          clearable
          class="search-input"
        />
      </div>
    </div>
    
    <div class="shares-container">
      <div v-if="loading" class="loading-wrapper">
        <LoadingSpinner :text="i18n.t('loadingFiles')" />
      </div>
      
      <EmptyState
        v-else-if="filteredShares.length === 0"
        type="shares"
        :title="i18n.t('noSharedFiles')"
        :description="i18n.t('shareFromDashboard')"
      >
        <template #actions>
          <el-button type="primary" @click="goToDashboard">
            <el-icon><Folder /></el-icon>
            {{ i18n.t('goToDashboard') }}
          </el-button>
        </template>
      </EmptyState>
      
      <div v-else class="shares-list">
        <div class="shares-grid">
          <div 
            v-for="share in filteredShares" 
            :key="share.id" 
            class="share-card"
            @click="viewShare(share)"
          >
            <div class="share-card-header">
              <div class="share-icon">
                <el-icon :size="32"><Document /></el-icon>
              </div>
              <el-dropdown trigger="click" @command="(cmd) => handleShareCommand(cmd, share)">
                <el-button link>
                  <el-icon><MoreFilled /></el-icon>
                </el-button>
                <template #dropdown>
                  <el-dropdown-menu>
                    <el-dropdown-item command="copy">
                      <el-icon><CopyDocument /></el-icon>
                      {{ i18n.t('copyLink') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="edit">
                      <el-icon><Edit /></el-icon>
                      {{ i18n.t('edit') }}
                    </el-dropdown-item>
                    <el-dropdown-item command="delete" divided>
                      <el-icon><Delete /></el-icon>
                      {{ i18n.t('unshare') }}
                    </el-dropdown-item>
                  </el-dropdown-menu>
                </template>
              </el-dropdown>
            </div>
            
            <div class="share-card-body">
              <h3 class="share-name">{{ share.fileName || share.name }}</h3>
              <div class="share-meta">
                <span class="share-date">
                  <el-icon><Calendar /></el-icon>
                  {{ formatDate(share.createdAt || share.created_at) }}
                </span>
                <span class="share-downloads">
                  <el-icon><Download /></el-icon>
                  {{ share.downloadCount || share.download_count || 0 }} {{ i18n.t('downloads') }}
                </span>
              </div>
              
              <div class="share-link" @click.stop>
                <el-input 
                  :value="getShareLink(share)" 
                  readonly
                  size="small"
                >
                  <template #append>
                    <el-button @click="copyLink(getShareLink(share))">
                      <el-icon><CopyDocument /></el-icon>
                    </el-button>
                  </template>
                </el-input>
              </div>
              
              <div class="share-status">
                <el-tag 
                  v-if="share.expiresAt || share.expires_at" 
                  :type="isExpired(share.expiresAt || share.expires_at) ? 'danger' : 'info'"
                  size="small"
                >
                  {{ isExpired(share.expiresAt || share.expires_at) ? i18n.t('expired') : i18n.t('expiresIn') + ' ' + formatExpiry(share.expiresAt || share.expires_at) }}
                </el-tag>
                <el-tag v-else type="success" size="small">
                  {{ i18n.t('neverExpires') }}
                </el-tag>
                
                <el-tag 
                  v-if="share.password || share.has_password" 
                  type="warning" 
                  size="small"
                >
                  <el-icon><Lock /></el-icon>
                  {{ i18n.t('passwordProtected') }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Edit Share Dialog -->
    <el-dialog v-model="showEditDialog" :title="i18n.t('editShare')" width="500px">
      <el-form :model="editForm" label-position="top">
        <el-form-item :label="i18n.t('expirationDate')">
          <el-date-picker
            v-model="editForm.expiresAt"
            type="datetime"
            :placeholder="i18n.t('selectDate')"
            style="width: 100%"
            clearable
          />
        </el-form-item>
        
        <el-form-item :label="i18n.t('maxDownloads')">
          <el-input-number 
            v-model="editForm.maxDownloads" 
            :min="1" 
            :max="1000"
            style="width: 100%"
          />
        </el-form-item>
        
        <el-form-item :label="i18n.t('password')">
          <el-input 
            v-model="editForm.password" 
            type="password"
            show-password
            :placeholder="i18n.t('enterPassword')"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="saveShare" :loading="saving">
            {{ i18n.t('save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="i18n.t('unshare')"
      :message="i18n.t('deleteShareConfirm')"
      :description="i18n.t('deleteShareDescription')"
      type="danger"
      :confirm-text="i18n.t('unshare')"
      :cancel-text="i18n.t('cancel')"
      confirm-type="danger"
      :confirm-loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { Folder, Document, MoreFilled, CopyDocument, Edit, Delete, Calendar, Download, Lock } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { useSharesStore } from '../stores/shares';
import { toast } from '../utils/toast';
import { formatDate } from '../utils/format';
import EmptyState from '../components/EmptyState.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import ConfirmDialog from '../components/ConfirmDialog.vue';

const router = useRouter();
const i18n = useI18nStore();
const sharesStore = useSharesStore();

const loading = computed(() => sharesStore.isLoading);
const searchQuery = ref('');
const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const currentShare = ref(null);

const editForm = ref({
  expiresAt: null,
  maxDownloads: 10,
  password: ''
});

const shares = computed(() => sharesStore.shares);

const filteredShares = computed(() => {
  if (!searchQuery.value) return shares.value;
  const query = searchQuery.value.toLowerCase();
  return shares.value.filter(share => 
    (share.fileName || share.name || '').toLowerCase().includes(query)
  );
});

onMounted(async () => {
  await loadShares();
});

const loadShares = async () => {
  await sharesStore.loadShares();
};

const goToDashboard = () => {
  router.push('/dashboard');
};

const viewShare = (share) => {
  toast.info(i18n.t('viewShare') || 'Viewing share...');
};

const handleShareCommand = (command, share) => {
  currentShare.value = share;
  
  switch (command) {
    case 'copy':
      copyLink(getShareLink(share));
      break;
    case 'edit':
      openEditDialog(share);
      break;
    case 'delete':
      showDeleteDialog.value = true;
      break;
  }
};

const getShareLink = (share) => {
  if (share.shareUrl) return share.shareUrl;
  if (share.link) return share.link;
  if (share.code) return `${window.location.origin}/share/${share.code}`;
  return '';
};

const copyLink = (link) => {
  navigator.clipboard.writeText(link);
  toast.success(i18n.t('linkCopied') || 'Link copied to clipboard');
};

const openEditDialog = (share) => {
  editForm.value = {
    expiresAt: share.expiresAt || share.expires_at || null,
    maxDownloads: share.maxDownloads || share.max_downloads || 10,
    password: share.password || ''
  };
  showEditDialog.value = true;
};

const saveShare = async () => {
  saving.value = true;
  try {
    const updateData = {};
    if (editForm.value.expiresAt) {
      updateData.expiresAt = editForm.value.expiresAt;
    }
    if (editForm.value.maxDownloads) {
      updateData.maxDownloads = editForm.value.maxDownloads;
    }
    if (editForm.value.password) {
      updateData.password = editForm.value.password;
    }
    
    await sharesStore.updateShare(currentShare.value.id, updateData);
    showEditDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('shareUpdateFailed') || 'Failed to update share');
  } finally {
    saving.value = false;
  }
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await sharesStore.deleteShare(currentShare.value.id);
    showDeleteDialog.value = false;
  } catch (error) {
    toast.error(error.error || i18n.t('shareDeleteFailed') || 'Failed to delete share');
  } finally {
    deleting.value = false;
  }
};

const isExpired = (date) => {
  if (!date) return false;
  return new Date(date) < new Date();
};

const formatExpiry = (date) => {
  if (!date) return '';
  const diff = new Date(date) - new Date();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days < 0) return Math.abs(days) + ' days ago';
  return `${days} days`;
};
</script>

<style scoped>
.shares-page {
  min-height: 100%;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 24px;
  gap: 16px;
}

.page-header-left {
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

.page-header-right {
  flex-shrink: 0;
}

.search-input {
  width: 300px;
}

.shares-container {
  min-height: 400px;
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
}

.shares-list {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
}

.shares-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.share-card {
  background: white;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s;
  cursor: pointer;
}

.share-card:hover {
  border-color: var(--el-color-primary-light-5);
  box-shadow: var(--el-box-shadow-light);
}

.share-card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.share-icon {
  width: 56px;
  height: 56px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.share-card-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.share-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.share-meta {
  display: flex;
  gap: 16px;
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.share-meta span {
  display: flex;
  align-items: center;
  gap: 4px;
}

.share-link {
  margin-top: 4px;
}

.share-status {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }
  
  .search-input {
    width: 100%;
  }
  
  .shares-grid {
    grid-template-columns: 1fr;
  }
}
</style>
