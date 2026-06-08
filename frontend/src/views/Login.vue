<template>
  <div class="login-page">
    <div class="login-container">
      <!-- Left Illustration Section -->
      <div class="login-illustration">
        <div class="language-selector-wrapper">
          <LanguageSelector />
        </div>
        <div class="illustration-content">
          <div class="logo-section">
            <div class="logo-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h1 class="app-title">{{ i18n.t('appName') || 'FileCloud' }}</h1>
            <p class="app-tagline">{{ i18n.t('secureSimpleSmart') }}</p>
          </div>
          
          <div class="features-grid">
            <div class="feature-card">
              <div class="feature-icon" style="background: linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>{{ i18n.t('endToEndEncryption') }}</h4>
                <p>{{ i18n.t('filesSafeWithUs') }}</p>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon" style="background: linear-gradient(135deg, #22c55e 0%, #4ade80 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                  <polyline points="17 8 12 3 7 8"/>
                  <line x1="12" y1="3" x2="12" y2="15"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>{{ i18n.t('lightningFast') }}</h4>
                <p>{{ i18n.t('uploadDownloadSeconds') }}</p>
              </div>
            </div>
            
            <div class="feature-card">
              <div class="feature-icon" style="background: linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 6v6l4 2"/>
                </svg>
              </div>
              <div class="feature-text">
                <h4>{{ i18n.t('alwaysAvailable') }}</h4>
                <p>{{ i18n.t('uptimeGuarantee') }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Form Section -->
      <div class="login-form-section">
        <div class="form-wrapper">
          <div class="form-header">
            <h2>{{ i18n.t('welcomeBack') }}</h2>
            <p>{{ i18n.t('signInToContinue') }}</p>
          </div>
          
          <div v-if="!twoFactorRequired">
            <el-form ref="formRef" :model="formData" class="login-form">
              <el-form-item prop="username">
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                      <circle cx="12" cy="7" r="4"/>
                    </svg>
                  </span>
                  <el-input
                    v-model="formData.username"
                    type="text"
                    :placeholder="i18n.t('username')"
                    size="large"
                    @input="handleUsernameInput"
                  />
                </div>
              </el-form-item>
              
              <el-form-item prop="password">
                <div class="input-wrapper">
                  <span class="input-icon">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    </svg>
                  </span>
                  <el-input
                    v-model="formData.password"
                    type="password"
                    show-password
                    :placeholder="i18n.t('password')"
                    size="large"
                    @keyup.enter="handleLogin"
                  />
                </div>
              </el-form-item>
              
              <el-form-item prop="captcha">
                <Captcha 
                  ref="captchaRef" 
                  class="captcha-component" 
                  v-model="formData.captcha"
                />
              </el-form-item>
              
              <el-form-item class="submit-item">
                <el-button
                  type="primary"
                  @click="handleLogin"
                  :loading="isLoading"
                  class="submit-button"
                  size="large"
                >
                  <span v-if="!isLoading">{{ i18n.t('signIn') }}</span>
                  <span v-else>{{ i18n.t('signingIn') }}</span>
                </el-button>
              </el-form-item>
              
              <div v-if="errorMessage" class="error-message">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <circle cx="12" cy="12" r="10"/>
                  <line x1="12" y1="8" x2="12" y2="12"/>
                  <line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {{ errorMessage }}
              </div>
              
              <div class="form-links">
                <router-link to="/forgot-password" class="link">
                  {{ i18n.t('forgotPassword') }}
                </router-link>
              </div>
            </el-form>
            
            <div class="divider">
              <span>{{ i18n.t('or') }}</span>
            </div>
            
            <div class="register-prompt">
              <p>{{ i18n.t('dontHaveAccount') }}</p>
              <router-link to="/register" class="register-link">
                {{ i18n.t('createAccount') }}
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </router-link>
            </div>
          </div>
          
          <!-- 2FA Section -->
          <div v-else class="two-factor-section">
            <div class="two-factor-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
                <line x1="12" y1="18" x2="12.01" y2="18"/>
              </svg>
            </div>
            <h3>{{ i18n.t('twoFactor') }}</h3>
            <p class="two-factor-desc">{{ i18n.t('enterVerificationCode') }}</p>
            
            <el-form class="two-factor-form">
              <el-form-item>
                <el-input
                  v-model="twoFactorCode"
                  type="text"
                  :placeholder="i18n.t('verificationCode')"
                  size="large"
                  maxlength="6"
                  class="two-factor-input"
                  @input="handleTwoFactorInput"
                  @keyup.enter="verifyTwoFactor"
                />
              </el-form-item>
              
              <el-button
                type="primary"
                @click="verifyTwoFactor"
                :loading="isLoading"
                class="submit-button"
                size="large"
              >
                {{ i18n.t('verify') }}
              </el-button>
              
              <button @click="cancelTwoFactor" class="back-button">
                {{ i18n.t('backToLogin') }}
              </button>
            </el-form>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAuthStore } from '../stores/auth';
import { useI18nStore } from '../stores/i18n';
import Captcha from '../components/Captcha.vue';
import LanguageSelector from '../components/LanguageSelector.vue';

const router = useRouter();
const authStore = useAuthStore();
const i18n = useI18nStore();

const formRef = ref(null);
const captchaRef = ref(null);
const isLoading = ref(false);
const twoFactorRequired = ref(false);
const twoFactorCode = ref('');
const errorMessage = ref('');

const formData = reactive({
  username: '',
  password: '',
  captcha: ''
});

async function handleLogin() {
  if (!formData.username || !formData.password) {
    ElMessage.warning(i18n.t('requiredField'));
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const captchaData = captchaRef.value?.getCaptchaData?.();
    const user = await authStore.login(
      formData.username,
      formData.password,
      captchaData
    );
    if (user.twoFactorRequired) {
      twoFactorRequired.value = true;
    } else {
      ElMessage.success(i18n.t('loginSuccess'));
      router.push('/dashboard');
    }
  } catch (error) {
    console.log('Login error:', error);
    
    // Try to get a detailed error message
    let msg = '';
    
    if (error?.errorCode) {
      // Try to get the i18n translation for the error code
      const i18nKey = `errors.${error.errorCode}`;
      const translated = i18n.t(i18nKey);
      if (translated !== i18nKey) {
        msg = translated;
      }
    }
    
    // Fallback options
    if (!msg && error?.error) {
      msg = error.error;
    } else if (!msg) {
      msg = i18n.t('loginFailed');
    }
    
    errorMessage.value = msg;
    captchaRef.value?.refreshCaptcha();
  } finally {
    isLoading.value = false;
  }
}

async function verifyTwoFactor() {
  if (!twoFactorCode.value || twoFactorCode.value.length !== 6) {
    ElMessage.warning(i18n.t('enterVerificationCode'));
    return;
  }
  
  isLoading.value = true;
  
  try {
    await authStore.verifyTwoFactor(twoFactorCode.value);
    ElMessage.success(i18n.t('loginSuccess'));
    router.push('/dashboard');
  } catch (error) {
    ElMessage.error(i18n.t('invalidCaptcha'));
  } finally {
    isLoading.value = false;
  }
}

async function cancelTwoFactor() {
  twoFactorRequired.value = false;
  twoFactorCode.value = '';
}

// 字符过滤函数
const sanitizeUsername = (value) => {
  if (!value) return '';
  // 只允许字母、数字、下划线、连字符
  return value.replace(/[^a-zA-Z0-9_-]/g, '');
};

const sanitizeTwoFactorCode = (value) => {
  if (!value) return '';
  // 只允许数字
  return value.replace(/[^0-9]/g, '');
};

// 输入处理函数
const handleUsernameInput = (value) => {
  formData.username = sanitizeUsername(value);
};

const handleTwoFactorInput = (value) => {
  twoFactorCode.value = sanitizeTwoFactorCode(value);
};</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
}

.login-container {
  display: flex;
  width: 100%;
  max-width: 1400px;
  margin: auto;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: var(--shadow-xl);
  background: white;
  margin: 24px;
}

/* Left Illustration Section */
.login-illustration {
  width: 50%;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  padding: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.language-selector-wrapper {
  position: absolute;
  top: 24px;
  right: 24px;
  z-index: 2;
}

.illustration-content {
  position: relative;
  z-index: 1;
  width: 100%;
  max-width: 420px;
}

.logo-section {
  text-align: center;
  margin-bottom: 48px;
}

.logo-icon {
  width: 80px;
  height: 80px;
  background: rgba(255,255,255,0.2);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
  border: 2px solid rgba(255,255,255,0.3);
}

.logo-icon svg {
  width: 40px;
  height: 40px;
  color: white;
}

.app-title {
  font-size: 32px;
  font-weight: 700;
  color: white;
  margin-bottom: 8px;
}

.app-tagline {
  font-size: 16px;
  color: rgba(255,255,255,0.8);
  margin: 0;
}

.features-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.feature-card {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.15);
}

.feature-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-text h4 {
  font-size: 16px;
  font-weight: 600;
  color: white;
  margin: 0 0 4px;
}

.feature-text p {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
  margin: 0;
}

/* Right Form Section */
.login-form-section {
  width: 50%;
  padding: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-wrapper {
  width: 100%;
  max-width: 420px;
}

.form-header {
  margin-bottom: 40px;
}

.form-header h2 {
  font-size: 28px;
  font-weight: 700;
  margin: 0 0 8px;
  color: var(--text-primary);
}

.form-header p {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0;
}

.login-form {
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.input-icon {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: var(--gray-400);
  z-index: 1;
  width: 20px;
  height: 20px;
}

.input-icon svg {
  width: 100%;
  height: 100%;
}

.input-wrapper :deep(.el-input__wrapper) {
  padding-left: 52px;
  padding-right: 16px;
  background: var(--gray-50);
  border: none;
  box-shadow: none;
  width: 100%;
}

.input-wrapper :deep(.el-input__wrapper:hover) {
  background: var(--gray-100);
}

.input-wrapper :deep(.el-input__wrapper.is-focus) {
  background: white;
  box-shadow: 0 0 0 2px var(--primary-200), 0 0 0 1px var(--primary-500) inset;
}

.captcha-component {
  flex-shrink: 0;
}

.submit-item {
  margin-top: 8px;
}

.submit-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.error-message {
  display: flex;
  align-items: center;
  gap: 10px;
  background: #fef2f2;
  color: #dc2626;
  padding: 14px 16px;
  border-radius: 10px;
  margin-top: 16px;
  border: 1px solid #fecaca;
  width: 100%;
}

.error-message svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.form-links {
  text-align: center;
  margin-top: 16px;
}

.link {
  color: var(--primary-600);
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

.link:hover {
  text-decoration: underline;
}

.divider {
  display: flex;
  align-items: center;
  margin: 32px 0 24px;
  color: var(--gray-400);
  font-size: 14px;
}

.divider::before,
.divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--gray-200);
}

.divider span {
  padding: 0 16px;
}

.register-prompt {
  text-align: center;
}

.register-prompt p {
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.register-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-600);
  font-weight: 600;
  text-decoration: none;
  font-size: 16px;
  transition: all var(--transition-fast);
}

.register-link:hover {
  color: var(--primary-700);
  gap: 10px;
}

.register-link svg {
  width: 18px;
  height: 18px;
}

/* 2FA Section */
.two-factor-section {
  text-align: center;
  width: 100%;
}

.two-factor-icon {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 24px;
}

.two-factor-icon svg {
  width: 32px;
  height: 32px;
  color: white;
}

.two-factor-section h3 {
  font-size: 24px;
  font-weight: 700;
  margin: 0 0 12px;
  color: var(--text-primary);
}

.two-factor-desc {
  font-size: 15px;
  color: var(--text-secondary);
  margin: 0 0 32px;
}

.two-factor-form {
  max-width: 420px;
  margin: 0 auto;
  width: 100%;
}

.two-factor-input {
  margin-bottom: 16px;
  width: 100%;
}

.two-factor-input :deep(.el-input__wrapper) {
  width: 100%;
}

.back-button {
  width: 100%;
  margin-top: 16px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  color: var(--text-secondary);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.back-button:hover {
  color: var(--primary-600);
}

/* Responsive */
@media (max-width: 1024px) {
  .login-container {
    flex-direction: column;
    margin: 0;
    border-radius: 0;
  }
  
  .login-illustration {
    width: 100%;
    padding: 40px 24px;
  }
  
  .login-form-section {
    width: 100%;
    padding: 40px 24px;
  }
  
  .features-grid {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .feature-card {
    width: calc(50% - 6px);
  }
}

@media (max-width: 768px) {
  .login-page {
    padding: 16px;
  }
  
  .login-container {
    border-radius: 24px;
    margin: 0;
    box-shadow: var(--shadow-xl);
  }
  
  .login-illustration {
    padding: 40px 24px;
  }
  
  .login-form-section {
    padding: 40px 24px;
  }
  
  .form-header h2 {
    font-size: 28px;
  }
  
  .form-header p {
    font-size: 15px;
  }
}

@media (max-width: 640px) {
  .login-page {
    padding: 12px;
  }
  
  .login-container {
    border-radius: 20px;
  }
  
  .login-illustration {
    padding: 32px 20px;
  }
  
  .login-form-section {
    padding: 32px 20px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-header p {
    font-size: 14px;
  }
  
  .feature-card {
    width: 100%;
  }
  
  .input-wrapper :deep(.el-input__wrapper) {
    padding-left: 48px;
    padding-top: 12px;
    padding-bottom: 12px;
    padding-right: 12px;
  }
  
  .input-icon {
    left: 14px;
    width: 18px;
    height: 18px;
  }
  
  .submit-button {
    height: 46px;
    font-size: 15px;
  }
  
  .logo-section {
    margin-bottom: 40px;
  }
  
  .logo-icon {
    width: 64px;
    height: 64px;
    margin-bottom: 20px;
  }
  
  .app-title {
    font-size: 28px;
  }
  
  .app-tagline {
    font-size: 14px;
  }
}
</style>
