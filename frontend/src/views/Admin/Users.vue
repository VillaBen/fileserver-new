<template>
  <div class="users-page">
    <div class="page-header">
      <div class="header-left">
        <h1 class="page-title">{{ i18n.t('userManagement') || 'User Management' }}</h1>
        <p class="page-subtitle">{{ i18n.t('manageSystemUsers') || 'Manage system users and permissions' }}</p>
      </div>
      <div class="header-right">
        <div class="search-input-wrapper">
          <el-input
            v-model="searchQuery"
            :placeholder="i18n.t('searchUsers') || 'Search users'"
            prefix-icon="Search"
            clearable
            class="search-input"
            @input="handleSearchInput"
          />
          <transition name="fade">
            <div v-if="searchFilterWarning" class="filter-warning">
              <el-icon><Warning /></el-icon>
              <span>{{ i18n.t('invalidCharactersRemoved') || '无效字符已移除' }}</span>
            </div>
          </transition>
        </div>
        <el-button type="primary" @click="loadUsers">
          <el-icon><Refresh /></el-icon>
          {{ i18n.t('refresh') }}
        </el-button>
      </div>
    </div>
    
    <div class="users-table-container">
      <div v-if="loading" class="loading-wrapper">
        <LoadingSpinner :text="i18n.t('loading')" />
      </div>
      
      <EmptyState
        v-else-if="users.length === 0"
        type="search"
        :title="i18n.t('noUsers') || 'No users found'"
        :description="i18n.t('noUsersDescription') || 'No users to display'"
      />
      
      <div v-else>
        <el-table :data="users" style="width: 100%" @row-click="handleRowClick">
          <el-table-column :label="i18n.t('user')" min-width="180">
            <template #default="{ row }">
              <div class="user-info">
                <el-avatar :size="40">{{ getInitials(row.username) }}</el-avatar>
                <div class="user-details">
                  <div class="user-name">{{ row.username }}</div>
                  <div class="user-id">ID: {{ row.id }}</div>
                </div>
              </div>
            </template>
          </el-table-column>
          
          <el-table-column prop="email" :label="i18n.t('email')" min-width="200" />
          
          <el-table-column :label="i18n.t('role')" width="120">
            <template #default="{ row }">
              <el-tag :type="getRoleType(row.role)" size="small">
                {{ i18n.t(row.role) || row.role }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column :label="i18n.t('status')" width="120">
            <template #default="{ row }">
              <el-tag :type="getStatusType(row.status)" size="small">
                {{ i18n.t(row.status) || row.status }}
              </el-tag>
            </template>
          </el-table-column>
          
          <el-table-column :label="i18n.t('storage')" width="180">
            <template #default="{ row }">
              {{ row.usedStorage || '0 B' }} / {{ row.quota ? row.quota + ' GB' : i18n.t('unlimited') }}
            </template>
          </el-table-column>
          
          <el-table-column :label="i18n.t('created')" width="150">
            <template #default="{ row }">
              {{ formatDate(row.createdAt || row.created_at) }}
            </template>
          </el-table-column>
          
          <el-table-column :label="i18n.t('actions')" width="180" fixed="right">
            <template #default="{ row }">
              <el-button size="small" @click.stop="editUser(row)">
                <el-icon><Edit /></el-icon>
                {{ i18n.t('edit') }}
              </el-button>
              <el-button 
                size="small" 
                type="danger" 
                @click.stop="showDeleteConfirm(row)"
              >
                <el-icon><Delete /></el-icon>
                {{ i18n.t('delete') }}
              </el-button>
            </template>
          </el-table-column>
        </el-table>
        
        <el-pagination
          v-if="pagination.total > pagination.limit"
          layout="prev, pager, next, jumper"
          :total="pagination.total"
          :page-size="pagination.limit"
          :current-page="pagination.page"
          @current-change="handlePageChange"
          class="pagination"
        />
      </div>
    </div>

    <!-- Edit User Dialog -->
    <el-dialog v-model="showEditDialog" :title="i18n.t('editUser')" width="500px">
      <el-form :model="editForm" label-position="top">
        <el-form-item :label="i18n.t('username')">
          <el-input v-model="editForm.username" disabled />
        </el-form-item>
        
        <el-form-item :label="i18n.t('email')">
          <el-input v-model="editForm.email" disabled />
        </el-form-item>
        
        <el-form-item :label="i18n.t('role')">
          <el-select v-model="editForm.role">
            <el-option :label="i18n.t('admin')" value="admin" />
            <el-option :label="i18n.t('member')" value="member" />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="i18n.t('status')">
          <el-select v-model="editForm.status">
            <el-option :label="i18n.t('active')" value="active" />
            <el-option :label="i18n.t('inactive')" value="inactive" />
          </el-select>
        </el-form-item>
        
        <el-form-item :label="i18n.t('storageQuota')">
          <el-input-number 
            v-model="editForm.quota" 
            :min="1" 
            :max="1000"
            style="width: 100%"
          />
          <span style="margin-left: 8px;">{{ i18n.t('gbUnit') }}</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="showEditDialog = false">{{ i18n.t('cancel') }}</el-button>
          <el-button type="primary" @click="saveUser" :loading="saving">
            {{ i18n.t('save') }}
          </el-button>
        </div>
      </template>
    </el-dialog>
    
    <!-- Delete Confirm Dialog -->
    <ConfirmDialog
      v-model="showDeleteDialog"
      :title="i18n.t('deleteUser')"
      :message="i18n.t('deleteUserConfirm')"
      :description="i18n.t('deleteUserDescription')"
      type="danger"
      :confirm-text="i18n.t('delete')"
      :cancel-text="i18n.t('cancel')"
      confirm-type="danger"
      :confirm-loading="deleting"
      @confirm="confirmDelete"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { Refresh, Edit, Delete, Search, Warning } from '@element-plus/icons-vue';
import { useI18nStore } from '../../stores/i18n';
import { useAdminStore } from '../../stores/admin';
import { toast } from '../../utils/toast';
import { formatDate } from '../../utils/format';
import { filterUsername } from '../../utils/inputFilter';
import LoadingSpinner from '../../components/LoadingSpinner.vue';
import EmptyState from '../../components/EmptyState.vue';
import ConfirmDialog from '../../components/ConfirmDialog.vue';

const i18n = useI18nStore();
const adminStore = useAdminStore();

const searchQuery = ref('');
const loading = computed(() => adminStore.isLoading);
const users = computed(() => adminStore.users);
const pagination = computed(() => adminStore.usersPagination);

const showEditDialog = ref(false);
const showDeleteDialog = ref(false);
const saving = ref(false);
const deleting = ref(false);
const currentUser = ref(null);

const editForm = ref({
  username: '',
  email: '',
  role: 'member',
  status: 'active',
  quota: 10
});

// 搜索框过滤警告
const searchFilterWarning = ref(false);

const showSearchFilterWarning = () => {
  searchFilterWarning.value = true;
  setTimeout(() => {
    searchFilterWarning.value = false;
  }, 3000);
};

const handleSearchInput = (value) => {
  searchQuery.value = filterUsername(value, showSearchFilterWarning);
  pagination.value.page = 1;
  loadUsers();
};

onMounted(async () => {
  await loadUsers();
});

const loadUsers = async () => {
  const params = {};
  if (searchQuery.value) {
    params.search = searchQuery.value;
  }
  await adminStore.loadUsers(params);
};

const handleSearch = () => {
  pagination.value.page = 1;
  loadUsers();
};

const handlePageChange = (page) => {
  adminStore.usersPagination.page = page;
  loadUsers();
};

const handleRowClick = (row) => {
  editUser(row);
};

const getInitials = (username) => {
  return username ? username.substring(0, 2).toUpperCase() : '?';
};

const getRoleType = (role) => {
  return role === 'admin' ? 'primary' : 'success';
};

const getStatusType = (status) => {
  return status === 'active' ? 'success' : 'warning';
};

const editUser = (user) => {
  currentUser.value = user;
  editForm.value = {
    username: user.username || '',
    email: user.email || '',
    role: user.role || 'member',
    status: user.status || 'active',
    quota: parseInt((user.quota || '10 GB').replace(' GB', '')) || 10
  };
  showEditDialog.value = true;
};

const saveUser = async () => {
  saving.value = true;
  try {
    const updates = {};
    
    if (editForm.value.role !== currentUser.value.role) {
      await adminStore.updateUserRole(currentUser.value.id, editForm.value.role);
    }
    
    if (editForm.value.status !== currentUser.value.status) {
      await adminStore.updateUserStatus(currentUser.value.id, editForm.value.status);
    }
    
    const newQuota = `${editForm.value.quota} GB`;
    if (newQuota !== currentUser.value.quota) {
      await adminStore.updateUserQuota(currentUser.value.id, newQuota);
    }
    
    showEditDialog.value = false;
    await loadUsers();
  } catch (error) {
    toast.error(error.error || i18n.t('updateFailed') || 'Update failed');
  } finally {
    saving.value = false;
  }
};

const showDeleteConfirm = (user) => {
  currentUser.value = user;
  showDeleteDialog.value = true;
};

const confirmDelete = async () => {
  deleting.value = true;
  try {
    await adminStore.deleteUser(currentUser.value.id);
    showDeleteDialog.value = false;
    await loadUsers();
  } catch (error) {
    toast.error(error.error || i18n.t('deleteFailed') || 'Delete failed');
  } finally {
    deleting.value = false;
  }
};
</script>

<style scoped>
.users-page {
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

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-input {
  width: 250px;
}

.search-input-wrapper {
  position: relative;
}

.filter-warning {
  position: absolute;
  top: 100%;
  left: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  color: #d97706;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  font-size: 14px;
  margin-top: 8px;
  z-index: 10;
  box-shadow: var(--el-box-shadow-light);
}

.filter-warning .el-icon {
  flex-shrink: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.users-table-container {
  background: var(--el-bg-color);
  border-radius: 16px;
  padding: 24px;
  box-shadow: var(--el-box-shadow-light);
}

.loading-wrapper {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.user-details {
  display: flex;
  flex-direction: column;
}

.user-name {
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.user-id {
  font-size: 12px;
  color: var(--el-text-color-placeholder);
}

.pagination {
  margin-top: 20px;
  text-align: right;
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
  
  .header-right {
    width: 100%;
  }
  
  .search-input {
    flex: 1;
    width: auto;
  }
}
</style>
