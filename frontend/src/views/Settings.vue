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
                maxlength="50"
                show-word-limit
                clearable
                @input="handleUsernameInput"
                @blur="checkUsernameAvailability"
              />
              <div v-if="usernameCheckStatus === 'checking'" class="validation-message checking">
                <el-icon :size="16" class="settings-checking-icon"><Loading /></el-icon>
                {{ i18n.t('checking') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'available'" class="validation-message success">
                <el-icon><CircleCheck /></el-icon> {{ i18n.t('usernameAvailable') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'taken'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('usernameTaken') }}
              </div>
              <div v-if="usernameFilterWarning" class="validation-message filter-inline">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
              </div>
            </el-form-item>
            
            <el-form-item 
              :label="i18n.t('displayName')"
            >
              <el-input 
                v-model="profileForm.displayName" 
                :placeholder="i18n.t('yourName')"
                size="large"
                maxlength="100"
                show-word-limit
                clearable
                @input="handleDisplayNameInput"
              />
              <div v-if="displayNameFilterWarning" class="validation-message filter-inline">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
              </div>
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
                maxlength="100"
                show-word-limit
                clearable
                @input="handleEmailInput"
                @blur="checkEmailAvailability"
              />
              <div v-if="emailCheckStatus === 'checking'" class="validation-message checking">
                <el-icon :size="16" class="settings-checking-icon"><Loading /></el-icon>
                {{ i18n.t('checking') }}
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
              <div v-if="emailFilterWarning" class="validation-message filter-inline">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
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
              <PasswordStrength :password="passwordForm.newPassword" />
            </el-form-item>
            
            <el-form-item :label="i18n.t('confirmNewPassword')">
              <el-input 
                v-model="passwordForm.confirmPassword" 
                type="password" 
                show-password
                :placeholder="i18n.t('enterPassword')"
                size="large"
              />
              <div v-if="passwordForm.newPassword || passwordForm.confirmPassword" class="password-match-indicator">
                <span v-if="passwordForm.newPassword && passwordForm.newPassword === passwordForm.confirmPassword" class="match-valid">
                  <el-icon><CircleCheck /></el-icon>
                  {{ i18n.t('passwordsMatch') }}
                </span>
                <span v-else-if="passwordForm.newPassword && passwordForm.confirmPassword" class="match-invalid">
                  <el-icon><CircleClose /></el-icon>
                  {{ i18n.t('passwordsDontMatch') }}
                </span>
              </div>
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
          <div class="settings-icon" style="background: linear-gradient(135deg, #8b5cf6 0%, #c4b5fd 100%);">
            <el-icon :size="24"><Key /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">安全问题</h2>
            <p class="settings-card-desc">设置一个用于找回账户的安全问题与答案</p>
          </div>
        </div>

        <div class="settings-card-body">
          <div v-if="!securityStatus.has_security_question || securityEditing">
            <el-form :model="securityForm" label-position="top">
              <el-form-item label="安全问题">
                <el-select v-model="securityForm.question" placeholder="请选择或自定义一个安全问题" style="width: 100%;">
                  <el-option
                    v-for="item in PRESET_QUESTIONS"
                    :key="item.value"
                    :label="item.label"
                    :value="item.value"
                  />
                </el-select>
              </el-form-item>

              <el-form-item v-if="securityForm.question === 'custom'" label="自定义问题">
                <el-input v-model="securityForm.customQuestion" placeholder="请输入自定义的安全问题" />
              </el-form-item>

              <el-form-item label="答案">
                <el-input v-model="securityForm.answer" show-password placeholder="请输入安全问题的答案" />
              </el-form-item>

              <el-form-item label="再次输入答案">
                <el-input v-model="securityForm.confirmAnswer" show-password placeholder="请再次输入答案以确认" />
              </el-form-item>

              <el-button type="primary" @click="saveSecurityQuestion" :loading="securityLoading">
                {{ securityEditing ? '更新安全问题' : '保存安全问题' }}
              </el-button>
              <el-button v-if="securityEditing" @click="securityEditing = false">
                取消
              </el-button>
            </el-form>
          </div>

          <div v-else class="security-question-set">
            <div class="security-status-row">
              <span class="security-status-label">当前问题：</span>
              <span class="security-status-value">{{ securityStatus.question?.slice(0, 3) }}***</span>
            </div>
            <div class="security-status-row" style="margin-top: 12px;">
              <el-tag type="success">已设置</el-tag>
            </div>
            <div class="security-actions" style="margin-top: 16px;">
              <el-button @click="securityEditing = true">修改</el-button>
              <el-button type="danger" @click="deleteSecurityQuestion">删除</el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, #06b6d4 0%, #67e8f9 100%);">
            <el-icon :size="24"><Monitor /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">信任设备</h2>
            <p class="settings-card-desc">管理已标记为信任的登录设备</p>
          </div>
        </div>

        <div class="settings-card-body">
          <div v-if="trustedDevicesLoading" class="storage-loading">
            <LoadingSpinner text="加载中..." />
          </div>
          <div v-else-if="trustedDevices.length === 0" class="empty-state">
            <span>暂无信任设备</span>
          </div>
          <div v-else>
            <el-table :data="trustedDevices" style="width: 100%" stripe>
              <el-table-column label="设备" prop="user_agent" min-width="200">
                <template #default="scope">
                  <span class="truncate-text">{{ scope.row.user_agent || '未知设备' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="IP 地址" prop="ip" width="140" />
              <el-table-column label="位置" prop="location" width="140">
                <template #default="scope">
                  <span>{{ scope.row.location || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="信任时间" prop="created_at" width="180">
                <template #default="scope">
                  <span>{{ new Date(scope.row.created_at).toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column label="操作" width="120" fixed="right">
                <template #default="scope">
                  <el-button size="small" type="danger" link @click="removeTrustedDevice(scope.row.id)">
                    移除信任
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 16px;">
              <el-button type="danger" @click="clearAllTrustedDevices">
                清除所有信任设备
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fcd34d 100%);">
            <el-icon :size="24"><Histogram /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">登录日志</h2>
            <p class="settings-card-desc">查看最近的账户登录活动</p>
          </div>
        </div>

        <div class="settings-card-body">
          <div v-if="loginLogsLoading" class="storage-loading">
            <LoadingSpinner text="加载中..." />
          </div>
          <div v-else-if="loginLogs.length === 0" class="empty-state">
            <span>暂无登录记录</span>
          </div>
          <div v-else>
            <el-table :data="loginLogs" style="width: 100%" stripe>
              <el-table-column label="登录时间" prop="created_at" width="180">
                <template #default="scope">
                  <span>{{ new Date(scope.row.created_at || scope.row.timestamp).toLocaleString() }}</span>
                </template>
              </el-table-column>
              <el-table-column label="IP 地址" prop="ip" width="140" />
              <el-table-column label="位置" prop="location" width="140">
                <template #default="scope">
                  <span>{{ scope.row.location || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="设备 / 浏览器" prop="user_agent" min-width="200">
                <template #default="scope">
                  <span class="truncate-text">{{ scope.row.user_agent || '-' }}</span>
                </template>
              </el-table-column>
              <el-table-column label="状态" width="100">
                <template #default="scope">
                  <el-tag :type="scope.row.success ? 'success' : 'danger'">
                    {{ scope.row.success ? '成功' : '失败' }}
                  </el-tag>
                </template>
              </el-table-column>
            </el-table>
            <div style="margin-top: 16px;">
              <el-button type="danger" @click="clearLoginLogs">
                清除登录日志
              </el-button>
            </div>
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
import { User, Lock, Sunny, Moon, Monitor, Guide, Upload, Delete, CircleCheck, DocumentCopy, Folder, Loading, CircleClose, Warning, Key, Histogram } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { useAuthStore } from '../stores/auth';
import { userAPI, securityAPI } from '../api';
import { toast } from '../utils/toast';
import { formatFileSize } from '../utils/format';
import LoadingSpinner from '../components/LoadingSpinner.vue';
import PasswordStrength from '../components/PasswordStrength.vue';
import { filterUsername, filterEmail, filterDisplayName } from '../utils/inputFilter';

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
const userInitial = computed(() => profileForm.value.displayName?.charAt(0).toUpperCase() || (profileForm.value.username?.charAt(0).toUpperCase() || ''));

// Debounce timers
let usernameCheckTimer = null;
let emailCheckTimer = null;

// Validation status
const usernameCheckStatus = ref('idle'); // idle, checking, available, taken
const emailCheckStatus = ref('idle'); // idle, checking, available, taken, invalid
const usernameFilterWarning = ref(false);
const displayNameFilterWarning = ref(false);
const emailFilterWarning = ref(false);

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
  // 确保值是有效的数字
  const used = Number(storageInfo.value.used) || 0;
  const total = Number(storageInfo.value.total) || 1;
  if (total === 0) return 0;
  const percent = Math.round((used / total) * 100);
  // 确保百分比在合理范围内
  return Math.min(100, Math.max(0, percent));
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
  await loadSecurityStatus();
  await loadTrustedDevices();
  await loadLoginLogs();
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

// Check username availability (real-time)
const checkUsernameAvailability = async () => {
  const username = profileForm.value.username;
  if (!username || username === originalProfile.value.username) {
    usernameCheckStatus.value = 'idle';
    return;
  }
  
  usernameCheckStatus.value = 'checking';
  try {
    const response = await userAPI.checkUsername(username);
    if (response.success) {
      usernameCheckStatus.value = response.data.available ? 'available' : 'taken';
    }
  } catch (error) {
    console.error('检查用户名失败:', error);
    usernameCheckStatus.value = 'idle';
  }
};

// Debounced username check
const debouncedCheckUsername = () => {
  if (usernameCheckTimer) {
    clearTimeout(usernameCheckTimer);
  }
  usernameCheckTimer = setTimeout(() => {
    checkUsernameAvailability();
  }, 500);
};

// Check email availability (real-time)
const checkEmailAvailability = async () => {
  const email = profileForm.value.email;
  if (!email || email === originalProfile.value.email) {
    emailCheckStatus.value = 'idle';
    return;
  }
  
  emailCheckStatus.value = 'checking';
  try {
    const response = await userAPI.checkEmail(email);
    if (response.success) {
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

// Debounced email check
const debouncedCheckEmail = () => {
  if (emailCheckTimer) {
    clearTimeout(emailCheckTimer);
  }
  emailCheckTimer = setTimeout(() => {
    checkEmailAvailability();
  }, 500);
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

const validatePasswordStrength = (password) => {
  const WEAK_PATTERNS = [
    /^[0-9]+$/,
    /^[a-z]+$/,
    /^[A-Z]+$/,
    /(.)\1{3,}/,
    /0123|1234|2345|3456|4567|5678|6789|7890|8901|9012|0987|9876|8765|7654|6543|5432|4321|3210|2109/,
    /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i,
    /password|passwort|passphrase|secret|admin|letmein|welcome|monkey|master|qwerty|abc123|1111|0000|1234|1212|6666|9999|iloveyou|loveyou|login|trustno1|dragon|admin123|root|toor/i,
  ];

  let score = 0;
  if (!password) return 0;

  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digits = /\d/.test(password);
  const special = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;`'~]/.test(password);
  const unicode = /[^\x00-\x7F]/.test(password);

  const uniqueChars = new Set(password.toLowerCase()).size;
  const uniqueRatio = uniqueChars / password.length;

  let hasWeakPattern = false;
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(password)) {
      hasWeakPattern = true;
      break;
    }
  }
  const hasUsername = /admin|username|user|login|test|demo/i.test(password);
  const hasDatePattern = /(19|20)\d{2}[01]\d[0-3]\d|[01]\d[0-3]\d(19|20)\d{2}|\d{4}[-_.]\d{2}[-_.]\d{2}|\d{2}[-_.]\d{2}[-_.]\d{4}/.test(password);

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;

  if (lower && upper) score++;
  if (digits) score++;
  if (special) score++;
  if (unicode) score++;

  if (uniqueRatio > 0.7) score++;

  if (hasWeakPattern || hasUsername || hasDatePattern) {
    score = Math.max(0, score - 2);
  }

  if (password.length <= 6) score = Math.min(score, 1);

  return Math.min(5, Math.max(0, score));
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
  if (passwordForm.value.newPassword.length < 8) {
    toast.warning(i18n.t('passwordTooShort') || 'Password must be at least 8 characters');
    return;
  }
  const passwordStrength = validatePasswordStrength(passwordForm.value.newPassword);
  if (passwordStrength < 2) {
    toast.warning(i18n.t('passwordTooWeak') || 'Password is too weak. Please use a stronger password');
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

// 显示过滤警告提示（每个输入框独立的）
const showUsernameFilterWarning = () => {
  usernameFilterWarning.value = true;
  setTimeout(() => {
    usernameFilterWarning.value = false;
  }, 3000);
};

const showDisplayNameFilterWarning = () => {
  displayNameFilterWarning.value = true;
  setTimeout(() => {
    displayNameFilterWarning.value = false;
  }, 3000);
};

const showEmailFilterWarning = () => {
  emailFilterWarning.value = true;
  setTimeout(() => {
    emailFilterWarning.value = false;
  }, 3000);
};

// 输入处理函数（使用统一过滤工具）
const handleUsernameInput = (value) => {
  const sanitized = filterUsername(value, showUsernameFilterWarning);
  profileForm.value.username = sanitized;
  // 实时检查用户名可用性
  debouncedCheckUsername();
};

const handleDisplayNameInput = (value) => {
  const sanitized = filterDisplayName(value, showDisplayNameFilterWarning);
  profileForm.value.displayName = sanitized;
};

// 邮箱输入处理（实时检查）
const handleEmailInput = (value) => {
  const sanitized = filterEmail(value, showEmailFilterWarning);
  profileForm.value.email = sanitized;
  // 实时检查邮箱可用性
  debouncedCheckEmail();
};

// ==================== 安全问题 ====================
const securityForm = ref({
  question: 'your_first_school',
  customQuestion: '',
  answer: '',
  confirmAnswer: ''
});
const securityStatus = ref({ has_security_question: false, question: '' });
const securityEditing = ref(false);
const securityLoading = ref(false);
const PRESET_QUESTIONS = [
  { value: 'your_first_school', label: '你的第一所学校叫什么？' },
  { value: 'birth_city', label: '你出生的城市是？' },
  { value: 'favorite_book', label: '你最喜欢的书是什么？' },
  { value: 'mother_maiden_name', label: '你母亲的姓氏（婚前）是什么？' },
  { value: 'first_pet', label: '你的第一只宠物叫什么？' },
  { value: 'custom', label: '自定义问题' }
];

async function loadSecurityStatus() {
  try {
    const res = await securityAPI.getSecurityQuestion();
    if (res?.success) securityStatus.value = res.data || { has_security_question: false };
  } catch (e) { console.error(e); }
}

async function saveSecurityQuestion() {
  if (!securityForm.value.answer) return toast.warning('请填写答案');
  if (securityForm.value.answer !== securityForm.value.confirmAnswer) return toast.warning('两次输入的答案不一致');
  const payload = {
    question: securityForm.value.question === 'custom' ? securityForm.value.customQuestion : securityForm.value.question,
    answer: securityForm.value.answer,
    is_custom: securityForm.value.question === 'custom'
  };
  securityLoading.value = true;
  try {
    const res = securityEditing.value
      ? await securityAPI.updateSecurityQuestion(payload)
      : await securityAPI.setSecurityQuestion(payload);
    if (res?.success) {
      toast.success('保存成功');
      securityEditing.value = false;
      securityForm.value.answer = '';
      securityForm.value.confirmAnswer = '';
      await loadSecurityStatus();
    }
  } catch (e) { toast.error(e.error || '保存失败'); }
  finally { securityLoading.value = false; }
}

async function deleteSecurityQuestion() {
  if (!confirm('确认删除安全问题吗？删除后需要重新设置。')) return;
  try {
    const res = await securityAPI.deleteSecurityQuestion();
    if (res?.success) {
      toast.success('已删除安全问题');
      await loadSecurityStatus();
    }
  } catch (e) { toast.error(e.error || '删除失败'); }
}

// ==================== 信任设备 ====================
const trustedDevices = ref([]);
const trustedDevicesLoading = ref(false);
async function loadTrustedDevices() {
  trustedDevicesLoading.value = true;
  try {
    const res = await securityAPI.getTrustedDevices();
    if (res?.success) trustedDevices.value = res.data || [];
  } catch (e) { console.error(e); }
  finally { trustedDevicesLoading.value = false; }
}
async function removeTrustedDevice(id) {
  if (!confirm('确认移除此设备的信任标记？')) return;
  try {
    const res = await securityAPI.deleteTrustedDevice(id);
    if (res?.success) {
      toast.success('已移除');
      await loadTrustedDevices();
    }
  } catch (e) { toast.error(e.error || '操作失败'); }
}
async function clearAllTrustedDevices() {
  if (!confirm('确认清除所有信任设备吗？')) return;
  try {
    const res = await securityAPI.clearTrustedDevices();
    if (res?.success) {
      toast.success('已清除全部信任设备');
      await loadTrustedDevices();
    }
  } catch (e) { toast.error(e.error || '操作失败'); }
}

// ==================== 登录日志 ====================
const loginLogs = ref([]);
const loginLogsLoading = ref(false);
async function loadLoginLogs() {
  loginLogsLoading.value = true;
  try {
    const res = await securityAPI.getLoginLogs({ limit: 20, offset: 0 });
    if (res?.success) loginLogs.value = res.data?.logs || res.data || [];
  } catch (e) { console.error(e); }
  finally { loginLogsLoading.value = false; }
}
async function clearLoginLogs() {
  if (!confirm('确认清除所有登录日志吗？')) return;
  try {
    const res = await securityAPI.clearLoginLogs();
    if (res?.success) {
      toast.success('已清除登录日志');
      await loadLoginLogs();
    }
  } catch (e) { toast.error(e.error || '操作失败'); }
}
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

.validation-message.filter-inline {
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
}

.filter-inline .warning-icon {
  flex-shrink: 0;
}

.password-match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  margin-top: 4px;
}

.password-match-indicator .match-valid {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-success);
}

.password-match-indicator .match-invalid {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--el-color-danger);
}

.settings-checking-icon {
  display: inline-flex;
  animation: settings-spin 1s linear infinite;
}

@keyframes settings-spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.filter-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  background: var(--el-color-warning-light-9);
  color: var(--el-color-warning-dark-2);
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid var(--el-color-warning-light-7);
  font-size: 14px;
}

.filter-warning .warning-icon {
  flex-shrink: 0;
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

.empty-state {
  text-align: center;
  padding: 40px 0;
  color: var(--el-text-color-secondary);
  font-size: 14px;
}

.truncate-text {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
  word-break: break-all;
  font-size: 13px;
  color: var(--el-text-color-regular);
}

.security-question-set {
  padding: 8px 0;
}

.security-status-row {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 14px;
}

.security-status-label {
  color: var(--el-text-color-secondary);
}

.security-status-value {
  color: var(--el-text-color-primary);
  font-weight: 500;
}

.security-actions {
  display: flex;
  gap: 12px;
}
</style>
