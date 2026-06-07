<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ i18n.t('settings') }}</h1>
        <p class="page-subtitle">{{ i18n.t('managePreferences') }}</p>
      </div>
    </div>
    
    <div class="settings-container">
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon">
            <el-icon :size="24"><User /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('profile') }}</h2>
            <p class="settings-card-desc">{{ i18n.t('updateProfile') }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <el-form :model="profileForm" label-position="top" ref="profileFormRef">
            <div class="avatar-section">
              <div class="avatar-container">
                <el-avatar :size="80" :src="avatarUrl">{{ userInitial }}</el-avatar>
                <div class="avatar-actions">
                  <input 
                    ref="avatarInput" 
                    type="file" 
                    accept="image/*" 
                    style="display: none" 
                    @change="handleAvatarChange"
                  />
                  <el-button type="primary" size="small" @click="uploadAvatar">
                    <el-icon><Upload /></el-icon>
                    {{ i18n.t('uploadAvatar') }}
                  </el-button>
                  <el-button size="small" @click="removeAvatar" v-if="hasAvatar">
                    <el-icon><Delete /></el-icon>
                    {{ i18n.t('removeAvatar') }}
                  </el-button>
                </div>
              </div>
            </div>
              
            <el-form-item 
              :label="i18n.t('username')"
              :rules="[{ 
                validator: validateUsername, 
                trigger: 'blur' 
              }]"
            >
              <el-input 
                v-model="profileForm.username" 
                :placeholder="i18n.t('enterUsername')"
                size="large"
                @blur="checkUsernameAvailability"
              />
              <div v-if="usernameCheckStatus === 'checking'" class="validation-message checking">
                <el-icon><Loading /></el-icon> {{ i18n.t('checking') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'available'" class="validation-message success">
                <el-icon><CircleCheck /></el-icon> {{ i18n.t('usernameAvailable') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'taken'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('usernameTaken') }}
              </div>
            </el-form-item>
            
            <el-form-item 
              :label="i18n.t('displayName')"
            >
              <el-input 
                v-model="profileForm.displayName" 
                :placeholder="i18n.t('yourName')"
                size="large"
              />
            </el-form-item>
            
            <el-form-item 
              :label="i18n.t('email')"
              :rules="[{ 
                validator: validateEmail, 
                trigger: 'blur' 
              }]"
            >
              <el-input 
                v-model="profileForm.email" 
                :placeholder="i18n.t('yourEmail')"
                size="large"
                @blur="checkEmailAvailability"
              />
              <div v-if="emailCheckStatus === 'checking'" class="validation-message checking">
                <el-icon><Loading /></el-icon> {{ i18n.t('checking') }}
              </div>
              <div v-else-if="emailCheckStatus === 'available'" class="validation-message success">
                <el-icon><CircleCheck /></el-icon> {{ i18n.t('emailAvailable') }}
              </div>
              <div v-else-if="emailCheckStatus === 'taken'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('emailTaken') }}
              </div>
              <div v-else-if="emailCheckStatus === 'invalid'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('invalidEmail') }}
              </div>
            </el-form-item>
            
            <el-button type="primary" @click="saveProfile" :loading="savingProfile">
              {{ i18n.t('saveChanges') }}
            </el-button>
          </el-form>
        </div>
      </div>
      
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);">
            <el-icon :size="24"><Lock /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('security') }}</h2>
            <p class="settings-card-desc">{{ i18n.t('changePassword') }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <el-form :model="passwordForm" label-position="top">
            <el-form-item :label="i18n.t('currentPassword')">
              <el-input 
                v-model="passwordForm.currentPassword" 
                type="password" 
                show-password
                :placeholder="i18n.t('enterPassword')"
                size="large"
              />
            </el-form-item>
            
            <el-form-item :label="i18n.t('newPassword')">
              <el-input 
                v-model="passwordForm.newPassword" 
                type="password" 
                show-password
                :placeholder="i18n.t('enterPassword')"
                size="large"
              />
            </el-form-item>
            
            <el-form-item :label="i18n.t('confirmNewPassword')">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                show-password
                :placeholder="i18n.t('enterPassword')"
                size="large"
              />
            </el-form-item>
            
            <el-button type="primary" @click="changePassword" :loading="changingPassword">
              {{ i18n.t('updatePassword') }}
            </el-button>
          </el-form>

          <!-- 2FA Section -->
          <div class="two-factor-section">
            <div class="two-factor-header">
              <div>
                <h3 class="two-factor-title">{{ i18n.t('twoFactorAuth') || 'Two-Factor Authentication' }}</h3>
                <p class="two-factor-desc">{{ i18n.t('twoFactorAuthDesc') || 'Add an extra layer of security to your account' }}</p>
              </div>
              <el-switch 
                v-model="twoFactorEnabled" 
                @change="handleTwoFactorToggle"
                :loading="tfaLoading"
              />
            </div>

            <!-- Setup 2FA Modal -->
    <el-dialog 
      v-model="showSetup2FA" 
      :title="i18n.t('setupTwoFactor') || 'Setup Two-Factor Authentication'"
      width="500px"
      @close="handleDialogClose"
    >
              <div v-if="setupStep === 1" class="tfa-setup-step">
                <p class="tfa-setup-desc">{{ i18n.t('scanQrCode') || 'Scan this QR code with your authenticator app' }}</p>
                <div class="qr-code-container">
                  <img v-if="qrCodeUrl" :src="qrCodeUrl" alt="QR Code" class="qr-code" />
                  <div v-else class="qr-code-loading">
                    <LoadingSpinner :text="i18n.t('loading') || 'Loading'" />
                  </div>
                </div>
                <p class="tfa-manual-code" v-if="manualCode">
                  {{ i18n.t('orEnterCode') || 'Or enter this code manually:' }} 
                  <span class="manual-code-text">{{ manualCode }}</span>
                </p>
                <el-button type="primary" @click="setupStep = 2" style="margin-top: 16px;">
                  {{ i18n.t('next') || 'Next' }}
                </el-button>
              </div>

              <div v-if="setupStep === 2" class="tfa-setup-step">
                <p class="tfa-setup-desc">{{ i18n.t('enterVerificationCode') || 'Enter the verification code from your authenticator app' }}</p>
                <el-input 
                  v-model="verificationCode" 
                  :placeholder="i18n.t('verificationCode') || 'Verification code'"
                  maxlength="6"
                  size="large"
                  style="margin-top: 16px;"
                />
                <div class="tfa-setup-actions">
                  <el-button @click="setupStep = 1">{{ i18n.t('back') || 'Back' }}</el-button>
                  <el-button type="primary" @click="verifyTwoFactor" :loading="tfaLoading">
                    {{ i18n.t('verify') || 'Verify' }}
                  </el-button>
                </div>
              </div>

              <div v-if="setupStep === 3" class="tfa-setup-step">
                <el-icon :size="64" style="color: var(--el-color-success); margin-bottom: 16px;"><CircleCheck /></el-icon>
                <h3 class="tfa-success-title">{{ i18n.t('setupComplete') || 'Setup Complete!' }}</h3>
                <p class="tfa-success-desc">{{ i18n.t('saveRecoveryCodes') || 'Save these recovery codes in a safe place' }}</p>
                <div class="recovery-codes-container">
                  <div v-for="(code, index) in recoveryCodes" :key="index" class="recovery-code">
                    {{ code }}
                  </div>
                </div>
                <el-button type="primary" @click="copyRecoveryCodes" style="margin-top: 16px;">
                  <el-icon><DocumentCopy /></el-icon>
                  {{ i18n.t('copyCodes') || 'Copy Codes' }}
                </el-button>
              </div>
            </el-dialog>
          </div>
        </div>
      </div>

      <!-- Trash Auto-Delete Card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, #f56c6c 0%, #f9a7a7 100%);">
            <el-icon :size="24"><Delete /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('trashAutoDelete') || '回收站自动删除' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('trashAutoDeleteDesc') || '设置回收站中的文件自动删除规则' }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <el-form label-position="top">
            <el-form-item :label="i18n.t('enableAutoDelete') || '启用自动删除'">
              <el-switch 
                v-model="trashAutoDeleteEnabled" 
                @change="handleTrashAutoDeleteToggle"
              />
            </el-form-item>
            
            <el-form-item 
              :label="i18n.t('autoDeleteDays') || '自动删除时间（天）'" 
              :disabled="!trashAutoDeleteEnabled"
            >
              <el-select 
                v-model="trashAutoDeleteDays" 
                :disabled="!trashAutoDeleteEnabled"
                :placeholder="i18n.t('selectDays') || '选择天数'"
                @change="handleTrashAutoDeleteDaysChange"
                style="width: 200px;"
              >
                <el-option :value="7" :label="i18n.t('sevenDays') || '7天'" />
                <el-option :value="14" :label="i18n.t('fourteenDays') || '14天'" />
                <el-option :value="30" :label="i18n.t('thirtyDays') || '30天'" />
                <el-option :value="60" :label="i18n.t('sixtyDays') || '60天'" />
                <el-option :value="90" :label="i18n.t('ninetyDays') || '90天'" />
              </el-select>
            </el-form-item>
            
            <div v-if="trashAutoDeleteEnabled" class="trash-auto-delete-hint">
              <p>{{ i18n.t('trashAutoDeleteHint', { days: trashAutoDeleteDays }) || `回收站中的文件将在 ${trashAutoDeleteDays} 天后自动永久删除。` }}</p>
            </div>
          </el-form>
        </div>
      </div>

      <!-- Storage Card -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, #409eff 0%, #79bbff 100%);">
            <el-icon :size="24"><Folder /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('storage') || 'Storage' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('storageUsage') || 'Manage your storage usage' }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <div v-if="storageLoading" class="storage-loading">
            <LoadingSpinner :text="i18n.t('loading') || 'Loading'" />
          </div>
          <div v-else class="storage-info">
            <div class="storage-stats">
              <div class="storage-stat">
                <span class="storage-stat-value">{{ formatFileSize(storageInfo.used) }}</span>
                <span class="storage-stat-label">{{ i18n.t('used') || 'Used' }}</span>
              </div>
              <div class="storage-stat">
                <span class="storage-stat-value">{{ formatFileSize(storageInfo.total) }}</span>
                <span class="storage-stat-label">{{ i18n.t('total') || 'Total' }}</span>
              </div>
              <div class="storage-stat">
                <span class="storage-stat-value">{{ storageUsagePercent }}%</span>
                <span class="storage-stat-label">{{ i18n.t('used') || 'Used' }}</span>
              </div>
            </div>
            <el-progress 
              :percentage="storageUsagePercent" 
              :color="storageProgressColor"
              :stroke-width="12"
              style="margin-top: 24px;"
            />
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-warning) 0%, var(--el-color-warning-light-3) 100%);">
            <el-icon :size="24"><Sunny /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('theme') }}</h2>
            <p class="settings-card-desc">{{ i18n.t('customizeAppearance') }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <div class="theme-options">
            <button 
              class="theme-option" 
              :class="{ active: theme === 'light' }"
              @click="setTheme('light')"
            >
              <el-icon :size="28"><Sunny /></el-icon>
              <span>{{ i18n.t('light') }}</span>
            </button>
            
            <button 
              class="theme-option" 
              :class="{ active: theme === 'dark' }"
              @click="setTheme('dark')"
            >
              <el-icon :size="28"><Moon /></el-icon>
              <span>{{ i18n.t('dark') }}</span>
            </button>
            
            <button 
              class="theme-option" 
              :class="{ active: theme === 'system' }"
              @click="setTheme('system')"
            >
              <el-icon :size="28"><Monitor /></el-icon>
              <span>{{ i18n.t('system') }}</span>
            </button>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-info) 0%, var(--el-color-info-light-3) 100%);">
            <el-icon :size="24"><Guide /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('language') }}</h2>
            <p class="settings-card-desc">{{ i18n.t('customizeLanguage') }}</p>
          </div>
        </div>
        
        <div class="settings-card-body">
          <el-radio-group v-model="currentLanguage" size="large">
            <el-radio-button value="en-US">
              <span class="lang-option">
                <span>English</span>
              </span>
            </el-radio-button>
            <el-radio-button value="zh-CN">
              <span class="lang-option">
                <span>中文</span>
              </span>
            </el-radio-button>
          </el-radio-group>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { User, Lock, Sunny, Moon, Monitor, Guide, Upload, Delete, CircleCheck, DocumentCopy, Folder, Loading, CircleClose } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { useAuthStore } from '../stores/auth';
import { userAPI } from '../api';
import { toast } from '../utils/toast';
import { formatFileSize } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const i18n = useI18nStore();
const authStore = useAuthStore();

// Avatar input ref
const avatarInput = ref(null);

// Profile form ref
const profileFormRef = ref(null);

// Profile form
const profileForm = ref({
  username: '',
  displayName: '',
  email: ''
});

// Original values for comparison
const originalProfile = ref({
  username: '',
  displayName: '',
  email: ''
});

const savingProfile = ref(false);
const uploadingAvatar = ref(false);
const avatarUrl = ref('');
const hasAvatar = computed(() => !!avatarUrl.value);
const userInitial = computed(() => profileForm.value.displayName?.charAt(0).toUpperCase() || '');

// Validation status
const usernameCheckStatus = ref('idle'); // idle, checking, available, taken
const emailCheckStatus = ref('idle'); // idle, checking, available, taken, invalid

// Password form
const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});
const changingPassword = ref(false);

// Two-Factor Authentication
const twoFactorEnabled = ref(false);
const showSetup2FA = ref(false);
const tfaLoading = ref(false);
const setupStep = ref(1);
const qrCodeUrl = ref('');
const manualCode = ref('');
const verificationCode = ref('');
const recoveryCodes = ref([]);

// Storage
const storageLoading = ref(false);
const storageInfo = ref({
  used: 0,
  total: 10 * 1024 * 1024 * 1024 // Default 10GB
});

const storageUsagePercent = computed(() => {
  if (storageInfo.value.total === 0) return 0;
  return Math.round((storageInfo.value.used / storageInfo.value.total) * 100);
});

const storageProgressColor = computed(() => {
  const percent = storageUsagePercent.value;
  if (percent >= 90) return '#f56c6c';
  if (percent >= 70) return '#e6a23c';
  return '#67c23a';
});

// Trash Auto-Delete
const trashAutoDeleteEnabled = ref(false);
const trashAutoDeleteDays = ref(30);

// Load user profile and storage
onMounted(async () => {
  // 确保清除旧的localStorage数据
  console.log('[Settings-onMounted] 1. 清除旧的用户数据');
  localStorage.removeItem('filecloud_user');
  
  // 重新获取用户数据
  await authStore.fetchUser();
  await loadUserProfile();
  await load2FAStatus();
  await loadStorageInfo();
});

// Language
const currentLanguage = ref(i18n.currentLocale);
const theme = computed({
  get: () => i18n.theme,
  set: (value) => i18n.setTheme(value)
});

watch(currentLanguage, (newLang) => {
  i18n.setLocale(newLang);
});

// Load 2FA status
const load2FAStatus = async () => {
  twoFactorEnabled.value = authStore.user?.twoFactorEnabled || false;
};

// Load storage info
const loadStorageInfo = async () => {
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
};

// Toggle 2FA
const handleTwoFactorToggle = async (enabled) => {
  // 先暂存当前状态
  const previousState = twoFactorEnabled.value;
  
  if (enabled) {
    // 尝试启用 2FA
    try {
      await setupTwoFactor();
    } catch (error) {
      // 如果失败，恢复原来的状态
      twoFactorEnabled.value = previousState;
    }
  } else {
    // 禁用 2FA
    try {
      await disableTwoFactor();
    } catch (error) {
      // 如果失败，恢复原来的状态
      twoFactorEnabled.value = previousState;
    }
  }
};

// Setup 2FA
const setupTwoFactor = async () => {
  tfaLoading.value = true;
  try {
    const response = await authStore.setupTwoFactor();
    if (response) {
      qrCodeUrl.value = response.qrCodeUrl || '';
      manualCode.value = response.secret || '';
      setupStep.value = 1;
      showSetup2FA.value = true;
      // 重置验证码
      verificationCode.value = '';
    } else {
      // 如果响应为空，抛出错误
      throw new Error('No response from server');
    }
  } catch (error) {
    toast.error(error.error || 'Failed to setup 2FA');
    // 恢复开关状态
    twoFactorEnabled.value = false;
    throw error; // 继续抛出错误给上层处理
  } finally {
    tfaLoading.value = false;
  }
};

// Verify 2FA
const verifyTwoFactor = async () => {
  if (!verificationCode.value || verificationCode.value.length !== 6) {
    toast.warning('Please enter a valid 6-digit code');
    return;
  }

  tfaLoading.value = true;
  try {
    const response = await authStore.verifyTwoFactor(verificationCode.value);
    if (response) {
      recoveryCodes.value = response.data?.recoveryCodes || [];
      setupStep.value = 3;
      // 只有在验证成功后，才标记为启用
      twoFactorEnabled.value = true;
      await authStore.fetchUser();
      toast.success('Two-factor authentication enabled successfully');
    }
  } catch (error) {
    toast.error(error.error || 'Verification failed');
  } finally {
    tfaLoading.value = false;
  }
};

// Disable 2FA
const disableTwoFactor = async () => {
  tfaLoading.value = true;
  try {
    await authStore.disableTwoFactor();
    toast.success('Two-factor authentication disabled');
    twoFactorEnabled.value = false;
    await authStore.fetchUser();
  } catch (error) {
    toast.error(error.error || 'Failed to disable 2FA');
    twoFactorEnabled.value = true;
    throw error;
  } finally {
    tfaLoading.value = false;
  }
};

// Handle 2FA setup dialog close
const handleDialogClose = () => {
  // 如果设置步骤还没到成功的第3步，恢复开关状态
  if (setupStep !== 3) {
    // 从 authStore 获取真实的状态
    twoFactorEnabled.value = authStore.user?.twoFactorEnabled || false;
  }
  // 重置步骤
  setupStep.value = 1;
};

// Copy recovery codes
const copyRecoveryCodes = async () => {
  try {
    await navigator.clipboard.writeText(recoveryCodes.value.join('\n'));
    toast.success('Recovery codes copied to clipboard');
  } catch (error) {
    toast.error('Failed to copy recovery codes');
  }
};

// Username validation
const validateUsername = (rule, value, callback) => {
  if (!value) {
    callback(new Error(i18n.t('usernameRequired')));
  } else if (value.length < 3) {
    callback(new Error(i18n.t('usernameTooShort')));
  } else if (usernameCheckStatus.value === 'taken') {
    callback(new Error(i18n.t('usernameTaken')));
  } else {
    callback();
  }
};

// Email validation
const validateEmail = (rule, value, callback) => {
  if (!value) {
    callback(); // Email is optional
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      callback(new Error(i18n.t('invalidEmail')));
    } else if (emailCheckStatus.value === 'taken') {
      callback(new Error(i18n.t('emailTaken')));
    } else {
      callback();
    }
  }
};

// Check username availability
const checkUsernameAvailability = async () => {
  const username = profileForm.value.username;
  if (!username || username === originalProfile.value.username) {
    usernameCheckStatus.value = 'idle';
    return;
  }
  
  usernameCheckStatus.value = 'checking';
  try {
    const response = await userAPI.checkUsername(username);
    if (response.success && response.data) {
      usernameCheckStatus.value = response.data.available ? 'available' : 'taken';
    }
  } catch (error) {
    console.error('检查用户名失败:', error);
    usernameCheckStatus.value = 'idle';
  }
};

// Check email availability
const checkEmailAvailability = async () => {
  const email = profileForm.value.email;
  if (!email || email === originalProfile.value.email) {
    emailCheckStatus.value = 'idle';
    return;
  }
  
  emailCheckStatus.value = 'checking';
  try {
    const response = await userAPI.checkEmail(email);
    if (response.success && response.data) {
      if (!response.data.valid) {
        emailCheckStatus.value = 'invalid';
      } else {
        emailCheckStatus.value = response.data.available ? 'available' : 'taken';
      }
    }
  } catch (error) {
    console.error('检查邮箱失败:', error);
    emailCheckStatus.value = 'idle';
  }
};

// Load user profile (moved up)
const loadUserProfile = async () => {
  console.log('[Avatar-loadUserProfile] 1. 开始加载用户信息...');
  
  try {
    // 先获取最新的用户数据
    await authStore.fetchUser();
    console.log('[Avatar-loadUserProfile] 2. fetchUser后authStore.user:', authStore.user);
    console.log('[Avatar-loadUserProfile] 3. authStore.user.avatarUrl:', authStore.user?.avatarUrl);
    
    if (authStore.user) {
      profileForm.value.username = authStore.user.username || '';
      profileForm.value.displayName = authStore.user.displayName || authStore.user.username || '';
      profileForm.value.email = authStore.user.email || '';
      
      // Save original values
      originalProfile.value = {
        username: profileForm.value.username,
        displayName: profileForm.value.displayName,
        email: profileForm.value.email
      };
      
      // 添加时间戳防止浏览器缓存头像
      const baseAvatarUrl = authStore.user.avatarUrl || '';
      avatarUrl.value = baseAvatarUrl ? baseAvatarUrl + '?t=' + Date.now() : '';
      console.log('[Avatar-loadUserProfile] 4. 设置后的avatarUrl:', avatarUrl.value);
      trashAutoDeleteEnabled.value = authStore.user.trashAutoDeleteEnabled || false;
      trashAutoDeleteDays.value = authStore.user.trashAutoDeleteDays || 30;
    }
  } catch (error) {
    console.error('[Avatar-loadUserProfile] 加载用户信息失败:', error);
    toast.error('加载用户信息失败');
  }
};

// Trash Auto-Delete functions
const handleTrashAutoDeleteToggle = async (enabled) => {
  try {
    await userAPI.updateProfile({
      trashAutoDeleteEnabled: enabled,
      trashAutoDeleteDays: enabled ? trashAutoDeleteDays.value : null
    });
    await authStore.fetchUser();
    toast.success(enabled ? i18n.t('trashAutoDeleteEnabled') : i18n.t('trashAutoDeleteDisabled'));
  } catch (error) {
    toast.error(error.error || i18n.t('trashAutoDeleteUpdateFailed'));
    trashAutoDeleteEnabled.value = !enabled;
  }
};

const handleTrashAutoDeleteDaysChange = async (days) => {
  try {
    await userAPI.updateProfile({
      trashAutoDeleteDays: days
    });
    await authStore.fetchUser();
    toast.success(i18n.t('trashAutoDeleteDaysUpdated', { days }));
  } catch (error) {
    toast.error(error.error || i18n.t('trashAutoDeleteUpdateFailed'));
  }
};

// Avatar functions
const uploadAvatar = () => {
  avatarInput.value?.click();
};

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;
  
  console.log('[Avatar] 1. 选择文件:', file.name, file.size, file.type);
  
  uploadingAvatar.value = true;
  try {
    console.log('[Avatar] 2. 开始上传...');
    const formData = new FormData();
    formData.append('avatar', file);
    const uploadResponse = await userAPI.uploadAvatar(formData);
    console.log('[Avatar] 3. 上传响应:', uploadResponse);
    console.log('[Avatar] 4. 上传响应avatarUrl:', uploadResponse?.data?.avatarUrl);
    
    toast.success(i18n.t('avatarUploadSuccess') || 'Avatar uploaded successfully');
    
    // 添加时间戳参数来防止浏览器缓存
    console.log('[Avatar] 5. 开始获取用户信息...');
    const userData = await authStore.fetchUser();
    console.log('[Avatar] 6. 获取到的用户数据:', userData);
    console.log('[Avatar] 7. authStore中的用户头像:', authStore.user?.avatarUrl);
    
    await loadUserProfile();
    console.log('[Avatar] 8. loadUserProfile后的avatarUrl:', avatarUrl.value);
  } catch (error) {
    console.error('[Avatar] 上传失败:', error);
    toast.error(error.error || i18n.t('avatarUploadFailed') || 'Avatar upload failed');
  } finally {
    uploadingAvatar.value = false;
    if (avatarInput.value) {
      avatarInput.value.value = '';
    }
  }
};

const removeAvatar = async () => {
  try {
    await userAPI.deleteAvatar();
    toast.success(i18n.t('avatarRemoved') || 'Avatar removed');
    await authStore.fetchUser();
    await loadUserProfile();
  } catch (error) {
    toast.error(i18n.t('avatarRemoveFailed') || 'Failed to remove avatar');
  }
};

// Profile functions
const saveProfile = async () => {
  // Validate form first
  if (profileFormRef.value) {
    try {
      await profileFormRef.value.validate();
    } catch (error) {
      return;
    }
  }
  
  if (!profileForm.value.displayName.trim()) {
    toast.warning(i18n.t('pleaseEnterName') || 'Please enter your name');
    return;
  }
  
  savingProfile.value = true;
  try {
    const updateData = {
      displayName: profileForm.value.displayName
    };
    
    // Only include username if it changed
    if (profileForm.value.username !== originalProfile.value.username) {
      updateData.username = profileForm.value.username;
    }
    
    // Only include email if it changed
    if (profileForm.value.email !== originalProfile.value.email) {
      updateData.email = profileForm.value.email;
    }
    
    await userAPI.updateProfile(updateData);
    
    // Update original values
    originalProfile.value = {
      username: profileForm.value.username,
      displayName: profileForm.value.displayName,
      email: profileForm.value.email
    };
    
    // Reset validation status
    usernameCheckStatus.value = 'idle';
    emailCheckStatus.value = 'idle';
    
    await authStore.fetchUser();
    toast.success(i18n.t('profileUpdated') || 'Profile updated successfully');
  } catch (error) {
    toast.error(error.error || i18n.t('profileUpdateFailed') || 'Failed to update profile');
  } finally {
    savingProfile.value = false;
  }
};

// Password functions
const changePassword = async () => {
  if (!passwordForm.value.currentPassword) {
    toast.warning(i18n.t('pleaseEnterCurrentPassword') || 'Please enter current password');
    return;
  }
  if (!passwordForm.value.newPassword) {
    toast.warning(i18n.t('pleaseEnterNewPassword') || 'Please enter new password');
    return;
  }
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    toast.error(i18n.t('passwordsDoNotMatch') || 'Passwords do not match');
    return;
  }
  
  changingPassword.value = true;
  try {
    await authStore.changePassword(
      passwordForm.value.currentPassword, 
      passwordForm.value.newPassword
    );
    toast.success(i18n.t('passwordChanged') || 'Password changed successfully');
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    toast.error(error.error || i18n.t('passwordChangeFailed') || 'Failed to change password');
  } finally {
    changingPassword.value = false;
  }
};

// Theme functions
const setTheme = (newTheme) => {
  i18n.setTheme(newTheme);
  toast.success(i18n.t('themeUpdated'));
};
</script>

<style scoped>
.settings-page {
  min-height: 100%;
}

.validation-message {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 4px;
}

.validation-message.checking {
  color: var(--el-color-info);
}

.validation-message.success {
  color: var(--el-color-success);
}

.validation-message.error {
  color: var(--el-color-danger);
}

.page-header {
  margin-bottom: 24px;
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

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.settings-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  border: 1px solid var(--el-border-color-lighter);
  box-shadow: var(--el-box-shadow-light);
  overflow: hidden;
}

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.settings-card-title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.settings-card-desc {
  margin: 4px 0 0 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.settings-card-body {
  padding: 24px;
}

.avatar-section {
  margin-bottom: 24px;
  padding-bottom: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.two-factor-section {
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.two-factor-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 16px;
}

.two-factor-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0;
}

.two-factor-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 4px 0 0 0;
}

.tfa-setup-step {
  text-align: center;
  padding: 16px 0;
}

.tfa-setup-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 16px 0;
}

.qr-code-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  background: white;
  border-radius: 12px;
  border: 1px solid var(--el-border-color);
  margin: 16px 0;
}

.qr-code {
  width: 200px;
  height: 200px;
}

.qr-code-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tfa-manual-code {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 16px 0 0 0;
}

.manual-code-text {
  font-family: monospace;
  font-size: 16px;
  font-weight: 600;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 4px 12px;
  border-radius: 4px;
  display: inline-block;
  margin-top: 8px;
}

.tfa-setup-actions {
  display: flex;
  justify-content: center;
  gap: 12px;
  margin-top: 24px;
}

.tfa-success-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.tfa-success-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0 0 16px 0;
}

.recovery-codes-container {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  background: var(--el-color-primary-light-9);
  padding: 16px;
  border-radius: 8px;
}

.recovery-code {
  font-family: monospace;
  font-size: 14px;
  color: var(--el-color-primary);
  background: white;
  padding: 8px 12px;
  border-radius: 4px;
  text-align: center;
}

.storage-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 0;
}

.storage-info {
  padding: 8px 0;
}

.storage-stats {
  display: flex;
  justify-content: space-around;
  gap: 16px;
}

.storage-stat {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.storage-stat-value {
  font-size: 24px;
  font-weight: 700;
  color: var(--el-text-color-primary);
}

.storage-stat-label {
  font-size: 14px;
  color: var(--el-text-color-secondary);
}

.avatar-container {
  display: flex;
  align-items: center;
  gap: 16px;
}

.avatar-actions {
  display: flex;
  gap: 12px;
}

.theme-options {
  display: flex;
  gap: 16px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  padding: 20px;
  border: 2px solid var(--el-border-color);
  border-radius: 12px;
  background: var(--el-bg-color);
  cursor: pointer;
  transition: all 0.2s;
  min-width: 100px;
}

.theme-option:hover {
  border-color: var(--el-color-primary-light-3);
  background: var(--el-color-primary-light-9);
}

.theme-option.active {
  border-color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
}

.theme-option span {
  font-size: 13px;
  font-weight: 500;
  color: var(--el-text-color-secondary);
}

.theme-option.active span {
  color: var(--el-color-primary);
}

.lang-option {
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 768px) {
  .page-title {
    font-size: 22px;
  }
  
  .settings-card-header,
  .settings-card-body {
    padding: 20px;
  }
  
  .avatar-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .theme-options {
    flex-direction: column;
  }
  
  .theme-option {
    flex-direction: row;
    width: 100%;
  }
}
</style>
