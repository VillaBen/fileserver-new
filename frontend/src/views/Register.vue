<template>
  <div class="register-page">
    <div class="register-container">
      <!-- Left Illustration Section -->
      <div class="register-illustration">
        <div class="language-selector-wrapper">
          <LanguageSelector />
        </div>
        <div class="illustration-content">
          <div class="welcome-text">
            <h1>{{ i18n.t('welcome') }}</h1>
            <p>{{ i18n.t('welcomeSubtitle') }}</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(255,255,255,0.15);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 00-3-3.87"/>
                  <path d="M16 3.13a4 4 0 010 7.75"/>
                </svg>
              </div>
              <div class="stat-text">
                <div class="stat-number">1M+</div>
                <div class="stat-label">{{ i18n.t('activeUsers') }}</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(255,255,255,0.15);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
                </svg>
              </div>
              <div class="stat-text">
                <div class="stat-number">10B+</div>
                <div class="stat-label">{{ i18n.t('filesStored') }}</div>
              </div>
            </div>
            
            <div class="stat-card">
              <div class="stat-icon" style="background: rgba(255,255,255,0.15);">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                  <line x1="16" y1="13" x2="8" y2="13"/>
                  <line x1="16" y1="17" x2="8" y2="17"/>
                  <polyline points="10 9 9 9 8 9"/>
                </svg>
              </div>
              <div class="stat-text">
                <div class="stat-number">99.9%</div>
                <div class="stat-label">{{ i18n.t('uptime') }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Right Form Section -->
      <div class="register-form-section">
        <div class="form-wrapper">
          <div class="form-header">
            <div class="mini-logo">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
              </svg>
            </div>
            <h2>{{ i18n.t('createAccount') }}</h2>
            <p>{{ i18n.t('joinFileCloud') }}</p>
          </div>
          
          <el-form ref="formRef" :model="formData" class="register-form">
            <el-form-item prop="username">
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
                <el-input
                  v-model="formData.username"
                  type="text"
                  :placeholder="i18n.t('username')"
                  size="large"
                  maxlength="50"
                  show-word-limit
                  clearable
                  @input="handleUsernameInput"
                  @blur="checkUsernameAvailability"
                />
              </div>
              <div v-if="usernameCheckStatus === 'checking'" class="validation-message checking">
                <el-icon :size="16" class="register-checking-icon"><Loading /></el-icon>
                {{ i18n.t('checking') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'available'" class="validation-message success">
                <el-icon><CircleCheck /></el-icon> {{ i18n.t('usernameAvailable') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'taken'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('usernameTaken') }}
              </div>
              <div v-else-if="usernameCheckStatus === 'invalid'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ usernameValidationMessage }}
              </div>
              <div v-if="usernameFilterWarning" class="filter-warning">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
              </div>
            </el-form-item>
            
            <el-form-item prop="email">
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                </span>
                <el-input
                  v-model="formData.email"
                  type="email"
                  :placeholder="i18n.t('email')"
                  size="large"
                  maxlength="100"
                  show-word-limit
                  clearable
                  @input="handleEmailInput"
                  @blur="checkEmailAvailability"
                />
              </div>
              <div v-if="emailCheckStatus === 'checking'" class="validation-message checking">
                <el-icon :size="16" class="register-checking-icon"><Loading /></el-icon>
                {{ i18n.t('checking') }}
              </div>
              <div v-else-if="emailCheckStatus === 'available'" class="validation-message success">
                <el-icon><CircleCheck /></el-icon> {{ i18n.t('emailAvailable') }}
              </div>
              <div v-else-if="emailCheckStatus === 'taken'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('emailTaken') }}
              </div>
              <div v-if="emailFilterWarning" class="filter-warning">
                <el-icon class="warning-icon"><Warning /></el-icon>
                <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
              </div>
              <div v-else-if="emailCheckStatus === 'invalid'" class="validation-message error">
                <el-icon><CircleClose /></el-icon> {{ i18n.t('invalidEmail') }}
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
                  maxlength="100"
                  show-word-limit
                  clearable
                  @input="onPasswordInput"
                />
              </div>
              <PasswordStrength :password="formData.password" />
            </el-form-item>
            
            <el-form-item prop="confirmPassword">
              <div class="input-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                    <path d="M9 16l2 2 4-4"/>
                  </svg>
                </span>
                <el-input
                  v-model="formData.confirmPassword"
                  type="password"
                  show-password
                  :placeholder="i18n.t('confirmPassword')"
                  size="large"
                  maxlength="100"
                  show-word-limit
                  clearable
                />
              </div>
              <div v-if="formData.password || formData.confirmPassword" class="match-indicator">
                <span v-if="formData.password && formData.password === formData.confirmPassword" class="match-valid">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                  {{ i18n.t('passwordsMatch') }}
                </span>
                <span v-else-if="formData.password && formData.confirmPassword" class="match-invalid">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"/>
                    <line x1="6" y1="6" x2="18" y2="18"/>
                  </svg>
                  {{ i18n.t('passwordsDontMatch') }}
                </span>
              </div>
            </el-form-item>

            <el-form-item v-if="emailEnabled" prop="emailCode">
              <div class="input-wrapper email-code-wrapper">
                <span class="input-icon">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <rect x="3" y="5" width="18" height="14" rx="2"/>
                    <path d="m3 7 9 6 9-6"/>
                  </svg>
                </span>
                <el-input
                  v-model="formData.emailCode"
                  type="text"
                  placeholder="邮箱验证码（6位数字）"
                  size="large"
                  maxlength="6"
                  clearable
                />
                <el-button
                  class="email-code-btn"
                  type="primary"
                  size="large"
                  @click="sendEmailCode"
                  :disabled="emailCodeCountdown > 0 || emailSending || !formData.email"
                  :loading="emailSending"
                >
                  <template v-if="emailCodeCountdown > 0">{{ emailCodeCountdown }}s</template>
                  <template v-else>发送验证码</template>
                </el-button>
              </div>
            </el-form-item>
            
            <el-form-item prop="captcha">
              <Captcha 
                ref="captchaRef" 
                class="captcha-component" 
                v-model="formData.captcha"
              />
            </el-form-item>
            
            <el-form-item class="terms-item">
              <el-checkbox v-model="agreeTerms">
                {{ i18n.t('agreeTerms') }} <a href="#" class="terms-link">{{ i18n.t('termsOfService') }}</a> {{ i18n.t('and') }} <a href="#" class="terms-link">{{ i18n.t('privacyPolicy') }}</a>
              </el-checkbox>
            </el-form-item>
            
            <el-form-item class="submit-item">
              <el-button
                type="primary"
                @click="handleRegister"
                :loading="isLoading"
                :disabled="!agreeTerms"
                class="submit-button"
                size="large"
              >
                <span v-if="!isLoading">{{ i18n.t('createAccount') }}</span>
                <span v-else>{{ i18n.t('creatingAccount') }}</span>
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
          </el-form>
          
          <div class="divider">
            <span>{{ i18n.t('or') }} {{ i18n.t('continueWith') }}</span>
          </div>
          
          <div class="social-buttons">
            <button class="social-btn">
              <svg viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {{ i18n.t('google') }}
            </button>
            <button class="social-btn">
              <svg viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/>
              </svg>
              {{ i18n.t('github') }}
            </button>
          </div>
          
          <div class="login-prompt">
            <p>{{ i18n.t('alreadyHaveAccount') }}</p>
            <router-link to="/login" class="login-link">
              {{ i18n.t('signIn') }}
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { Loading, CircleCheck, CircleClose, Warning } from '@element-plus/icons-vue';
import { useAuthStore } from '../stores/auth';
import { useI18nStore } from '../stores/i18n';
import { userAPI, authAPI } from '../api';
import Captcha from '../components/Captcha.vue';
import PasswordStrength from '../components/PasswordStrength.vue';
import LanguageSelector from '../components/LanguageSelector.vue';
import { filterUsername, filterEmail } from '../utils/inputFilter';

const router = useRouter();
const authStore = useAuthStore();
const i18n = useI18nStore();

const formRef = ref(null);
const captchaRef = ref(null);
const isLoading = ref(false);
const agreeTerms = ref(false);
const errorMessage = ref('');

// Validation status
const usernameCheckStatus = ref('idle'); // idle, checking, available, taken, invalid
const usernameValidationMessage = ref('');
const emailCheckStatus = ref('idle'); // idle, checking, available, taken, invalid
const usernameFilterWarning = ref(false);
const emailFilterWarning = ref(false);

// Debounce timers
let usernameCheckTimer = null;
let emailCheckTimer = null;

// Email verification code
const emailEnabled = ref(false);
const emailAuthRequired = ref(false);
const emailSending = ref(false);
const emailCodeCountdown = ref(0);
let emailCodeTimer = null;

const formData = reactive({
  username: '',
  email: '',
  password: '',
  confirmPassword: '',
  captcha: '',
  emailCode: ''
});

// 显示过滤警告提示（每个输入框独立）
const showUsernameFilterWarning = () => {
  usernameFilterWarning.value = true;
  setTimeout(() => {
    usernameFilterWarning.value = false;
  }, 3000);
};

const showEmailFilterWarning = () => {
  emailFilterWarning.value = true;
  setTimeout(() => {
    emailFilterWarning.value = false;
  }, 3000);
};

// Check username availability (real-time)
const checkUsernameAvailability = async () => {
  const username = formData.username;
  if (!username) {
    usernameCheckStatus.value = 'idle';
    return;
  }
  
  usernameCheckStatus.value = 'checking';
  try {
    const response = await userAPI.checkUsername(username);
    if (response.success) {
      if (!response.data.valid) {
        usernameCheckStatus.value = 'invalid';
        usernameValidationMessage.value = response.data.errors?.[0] || '';
      } else {
        usernameCheckStatus.value = response.data.available ? 'available' : 'taken';
      }
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
  const email = formData.email;
  if (!email) {
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

// 输入处理函数（防止内容残留）
const handleUsernameInput = (value) => {
  // 直接使用统一的过滤函数，防止部分内容残留
  const sanitized = filterUsername(value, showUsernameFilterWarning);
  formData.username = sanitized;
  // 实时检查用户名可用性
  debouncedCheckUsername();
};

// 邮箱输入处理（实时检查）
const handleEmailInput = (value) => {
  // 直接使用统一的过滤函数，防止部分内容残留
  const sanitized = filterEmail(value, showEmailFilterWarning);
  formData.email = sanitized;
  // 实时检查邮箱可用性
  debouncedCheckEmail();
};

function onPasswordInput() {}

async function loadEmailConfig() {
  try {
    const res = await authAPI.getAuthConfig();
    if (res.success && res.data) {
      emailEnabled.value = !!res.data.emailEnabled;
      emailAuthRequired.value = !!res.data.emailAuthRequired;
    }
  } catch (error) {
    console.error('加载邮箱配置失败:', error);
    emailEnabled.value = false;
    emailAuthRequired.value = false;
  }
}

async function sendEmailCode() {
  if (!formData.email) {
    ElMessage.warning('请先输入邮箱地址');
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(formData.email)) {
    ElMessage.warning('请输入有效的邮箱地址');
    return;
  }

  if (emailCodeCountdown.value > 0 || emailSending.value) {
    return;
  }

  emailSending.value = true;
  try {
    const res = await authAPI.sendEmailVerificationCode({ email: formData.email });
    if (res.success) {
      ElMessage.success('验证码已发送到你的邮箱，有效期 10 分钟');
      emailCodeCountdown.value = 60;
      emailCodeTimer = setInterval(() => {
        emailCodeCountdown.value--;
        if (emailCodeCountdown.value <= 0) {
          clearInterval(emailCodeTimer);
          emailCodeTimer = null;
        }
      }, 1000);
    } else {
      ElMessage.error(res.error || '验证码发送失败，请稍后重试');
    }
  } catch (error) {
    console.error('发送邮箱验证码失败:', error);
    ElMessage.error(error?.error || '验证码发送失败，请稍后重试');
  } finally {
    emailSending.value = false;
  }
}

onMounted(() => {
  loadEmailConfig();
});

async function handleRegister() {
  if (!formData.username || !formData.password) {
    ElMessage.warning(i18n.t('requiredField'));
    return;
  }

  if (formData.password.length < 8) {
    ElMessage.warning(i18n.t('passwordTooShort') || 'Password must be at least 8 characters');
    return;
  }

  const WEAK_PATTERNS = [
    /^[0-9]+$/,
    /^[a-z]+$/,
    /^[A-Z]+$/,
    /(.)\1{3,}/,
    /0123|1234|2345|3456|4567|5678|6789|7890|8901|9012|0987|9876|8765|7654|6543|5432|4321|3210|2109/,
    /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i,
    /password|passwort|passphrase|secret|admin|letmein|welcome|monkey|master|qwerty|abc123|1111|0000|1234|1212|6666|9999|iloveyou|loveyou|login|trustno1|dragon|admin123|root|toor/i,
  ];

  let passwordScore = 0;
  const pw = formData.password;
  const lower = /[a-z]/.test(pw);
  const upper = /[A-Z]/.test(pw);
  const digits = /\d/.test(pw);
  const special = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;`'~]/.test(pw);
  const uniqueChars = new Set(pw.toLowerCase()).size;
  const uniqueRatio = uniqueChars / pw.length;

  let hasWeakPattern = false;
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(pw)) {
      hasWeakPattern = true;
      break;
    }
  }

  if (pw.length >= 8) passwordScore++;
  if (pw.length >= 12) passwordScore++;
  if (pw.length >= 16) passwordScore++;
  if (lower && upper) passwordScore++;
  if (digits) passwordScore++;
  if (special) passwordScore++;
  if (uniqueRatio > 0.7) passwordScore++;
  if (hasWeakPattern) passwordScore = Math.max(0, passwordScore - 2);
  if (pw.length <= 6) passwordScore = Math.min(passwordScore, 1);

  if (passwordScore < 2) {
    ElMessage.warning(i18n.t('passwordTooWeak') || 'Password is too weak. Please use a stronger password');
    return;
  }

  if (formData.password !== formData.confirmPassword) {
    ElMessage.warning(i18n.t('passwordsDontMatch'));
    return;
  }

  if (emailEnabled.value && !formData.emailCode) {
    ElMessage.warning('请输入邮箱验证码');
    return;
  }
  
  if (!agreeTerms.value) {
    ElMessage.warning(i18n.t('agreeTerms'));
    return;
  }
  
  isLoading.value = true;
  errorMessage.value = '';
  
  try {
    const captchaData = captchaRef.value?.getCaptchaData?.();
    await authStore.register(
      formData.username,
      formData.password,
      formData.email || undefined,
      captchaData,
      formData.emailCode || undefined
    );
    ElMessage.success(i18n.t('registrationSuccess'));
    router.push('/login');
  } catch (error) {
    console.log('Register error:', error);
    
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
      msg = i18n.t('registrationFailed');
    }
    
    errorMessage.value = msg;
    captchaRef.value?.refreshCaptcha();
  } finally {
    isLoading.value = false;
  }
}
</script>

<style scoped>
.register-page {
  min-height: 100vh;
  display: flex;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
}

.register-container {
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
.register-illustration {
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

.welcome-text {
  margin-bottom: 48px;
}

.welcome-text h1 {
  font-size: 36px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
}

.welcome-text p {
  font-size: 18px;
  color: rgba(255,255,255,0.8);
  margin: 0;
}

.stats-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.stat-card {
  display: flex;
  align-items: center;
  gap: 16px;
  background: rgba(255,255,255,0.1);
  backdrop-filter: blur(10px);
  padding: 20px;
  border-radius: 16px;
  border: 1px solid rgba(255,255,255,0.15);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.stat-icon svg {
  width: 24px;
  height: 24px;
}

.stat-number {
  font-size: 24px;
  font-weight: 700;
  color: white;
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: rgba(255,255,255,0.7);
}

/* Right Form Section */
.register-form-section {
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

.mini-logo {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--accent-600) 100%);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  margin-bottom: 20px;
}

.mini-logo svg {
  width: 24px;
  height: 24px;
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

.register-form {
  width: 100%;
}

.input-wrapper {
  position: relative;
  width: 100%;
}

.email-code-wrapper {
  display: flex;
  align-items: center;
  gap: 12px;
}

.email-code-wrapper .el-input {
  flex: 1;
}

.email-code-btn {
  flex-shrink: 0;
  white-space: nowrap;
  min-width: 120px;
}

.email-code-wrapper :deep(.el-input__wrapper) {
  padding-left: 52px;
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

.match-indicator {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 8px;
  font-size: 13px;
}

.match-valid {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--accent-600);
}

.match-invalid {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--danger-600);
}

.match-valid svg,
.match-invalid svg {
  width: 16px;
  height: 16px;
}

.terms-item {
  margin-bottom: 8px;
}

.terms-link {
  color: var(--primary-600);
  text-decoration: none;
  font-weight: 500;
}

.terms-link:hover {
  text-decoration: underline;
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

.social-buttons {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.social-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 12px 16px;
  border: 1px solid var(--gray-200);
  background: white;
  border-radius: 10px;
  font-size: 14px;
  font-weight: 500;
  color: var(--text-secondary);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.social-btn:hover {
  background: var(--gray-50);
  border-color: var(--gray-300);
}

.social-btn svg {
  width: 20px;
  height: 20px;
}

.login-prompt {
  text-align: center;
}

.login-prompt p {
  color: var(--text-secondary);
  margin-bottom: 12px;
}

.login-link {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--primary-600);
  font-weight: 600;
  text-decoration: none;
  font-size: 16px;
  transition: all var(--transition-fast);
}

.login-link:hover {
  color: var(--primary-700);
  gap: 10px;
}

.login-link svg {
  width: 18px;
  height: 18px;
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
  color: var(--el-color-warning);
}

.validation-message.filter-inline .warning-icon {
  flex-shrink: 0;
}

.register-checking-icon {
  display: inline-flex;
  animation: register-spin 1s linear infinite;
}

@keyframes register-spin {
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
  background: #fffbeb;
  color: #d97706;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  font-size: 14px;
  margin-top: 8px;
}

.filter-warning .warning-icon {
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 1024px) {
  .register-container {
    flex-direction: column;
    margin: 0;
    border-radius: 0;
  }
  
  .register-illustration {
    width: 100%;
    padding: 40px 24px;
  }
  
  .register-form-section {
    width: 100%;
    padding: 40px 24px;
  }
  
  .stats-grid {
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
  }
  
  .stat-card {
    width: calc(50% - 6px);
  }
}

@media (max-width: 768px) {
  .register-page {
    padding: 16px;
  }
  
  .register-container {
    border-radius: 24px;
    margin: 0;
    box-shadow: var(--shadow-xl);
  }
  
  .register-illustration {
    padding: 40px 24px;
  }
  
  .register-form-section {
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
  .register-page {
    padding: 12px;
  }
  
  .register-container {
    border-radius: 20px;
  }
  
  .register-illustration {
    padding: 32px 20px;
  }
  
  .register-form-section {
    padding: 32px 20px;
  }
  
  .form-header h2 {
    font-size: 24px;
  }
  
  .form-header p {
    font-size: 14px;
  }
  
  .stat-card {
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
  
  .social-buttons {
    flex-direction: column;
  }
  
  .submit-button {
    height: 46px;
    font-size: 15px;
  }
  
  .welcome-text h1 {
    font-size: 28px;
  }
  
  .welcome-text p {
    font-size: 15px;
  }
}
</style>
