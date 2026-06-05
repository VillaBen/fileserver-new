<template>
  <div class="auth-page">
    <div class="auth-container">
      <div class="auth-left">
        <div class="auth-branding">
          <div class="brand-logo">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/>
            </svg>
          </div>
          <h1>FileCloud</h1>
        </div>
        
        <div class="auth-features">
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>Secure</h3>
              <p>Your files are protected with enterprise-grade security</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>24/7 Access</h3>
              <p>Access your files anytime, anywhere</p>
            </div>
          </div>
          
          <div class="feature-item">
            <div class="feature-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="7 10 12 15 17 10"/>
                <line x1="12" y1="15" x2="12" y2="3"/>
              </svg>
            </div>
            <div class="feature-text">
              <h3>Easy Upload</h3>
              <p>Drag and drop files with ease</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="auth-right">
        <div class="auth-card">
          <div class="auth-header">
            <h2>{{ i18n.t('resetPassword') || 'Reset Password' }}</h2>
            <p>{{ i18n.t('resetPasswordDesc') || 'Enter your new password below' }}</p>
          </div>
          
          <form @submit.prevent="handleSubmit" class="auth-form">
            <div class="form-group">
              <label>{{ i18n.t('newPassword') || 'New Password' }}</label>
              <div class="password-input">
                <input 
                  :type="showPassword ? 'text' : 'password'" 
                  v-model="newPassword" 
                  :placeholder="i18n.t('enterNewPassword') || 'Enter your new password'"
                  required
                />
                <button type="button" class="toggle-password" @click="showPassword = !showPassword">
                  <svg v-if="!showPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <div class="form-group">
              <label>{{ i18n.t('confirmPassword') || 'Confirm Password' }}</label>
              <div class="password-input">
                <input 
                  :type="showConfirmPassword ? 'text' : 'password'" 
                  v-model="confirmPassword" 
                  :placeholder="i18n.t('confirmNewPassword') || 'Confirm your new password'"
                  required
                />
                <button type="button" class="toggle-password" @click="showConfirmPassword = !showConfirmPassword">
                  <svg v-if="!showConfirmPassword" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                    <circle cx="12" cy="12" r="3"/>
                  </svg>
                  <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                    <line x1="1" y1="1" x2="23" y2="23"/>
                  </svg>
                </button>
              </div>
            </div>
            
            <button type="submit" class="btn-primary" :disabled="loading">
              {{ loading ? (i18n.t('resetting') || 'Resetting...') : (i18n.t('resetPasswordBtn') || 'Reset Password') }}
            </button>
          </form>
          
          <div v-if="message" class="message" :class="messageType">
            {{ message }}
          </div>
          
          <div class="auth-footer">
            <router-link to="/login">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="19" y1="12" x2="5" y2="12"/>
                <polyline points="12 19 5 12 12 5"/>
              </svg>
              {{ i18n.t('backToLogin') || 'Back to Login' }}
            </router-link>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { authAPI } from '../api';
import { useI18nStore } from '../stores/i18n';
import { toast } from '../utils/toast';

const route = useRoute();
const router = useRouter();
const i18n = useI18nStore();

const newPassword = ref('');
const confirmPassword = ref('');
const showPassword = ref(false);
const showConfirmPassword = ref(false);
const loading = ref(false);
const message = ref('');
const messageType = ref('success');

async function handleSubmit() {
  if (!newPassword.value || !confirmPassword.value) {
    message.value = i18n.t('fillAllFields') || 'Please fill in all fields';
    messageType.value = 'error';
    toast.error(message.value);
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    message.value = i18n.t('passwordsDoNotMatch') || 'Passwords do not match';
    messageType.value = 'error';
    toast.error(message.value);
    return;
  }
  
  if (newPassword.value.length < 6) {
    message.value = i18n.t('passwordTooShort') || 'Password must be at least 6 characters';
    messageType.value = 'error';
    toast.error(message.value);
    return;
  }
  
  const token = route.query.token;
  if (!token) {
    message.value = i18n.t('invalidResetLink') || 'Invalid or expired reset link';
    messageType.value = 'error';
    toast.error(message.value);
    return;
  }
  
  loading.value = true;
  message.value = '';
  
  try {
    await authAPI.resetPassword({
      token,
      newPassword: newPassword.value
    });
    
    message.value = i18n.t('passwordResetSuccess') || 'Password has been reset successfully! You can now login with your new password.';
    messageType.value = 'success';
    toast.success(message.value);
    
    setTimeout(() => {
      router.push('/login');
    }, 2000);
  } catch (error) {
    const errorMsg = error.response?.data?.error || error.message || 'Failed to reset password. Please try again.';
    message.value = errorMsg;
    messageType.value = 'error';
    toast.error(errorMsg);
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.auth-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.auth-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  max-width: 1200px;
  width: 100%;
  background: white;
  border-radius: 24px;
  overflow: hidden;
  box-shadow: 0 25px 50px -12px rgb(0 0 0 / 25%);
}

.auth-left {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  padding: 60px 50px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  color: white;
}

.auth-branding {
  margin-bottom: 50px;
}

.brand-logo {
  width: 60px;
  height: 60px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.brand-logo svg {
  width: 32px;
  height: 32px;
}

.auth-branding h1 {
  font-size: 32px;
  font-weight: 700;
  margin: 0;
}

.auth-features {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.feature-icon {
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.feature-icon svg {
  width: 24px;
  height: 24px;
}

.feature-text h3 {
  margin: 0 0 4px 0;
  font-size: 18px;
  font-weight: 600;
}

.feature-text p {
  margin: 0;
  font-size: 14px;
  opacity: 0.9;
}

.auth-right {
  padding: 60px 50px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.auth-card {
  width: 100%;
  max-width: 400px;
}

.auth-header {
  margin-bottom: 40px;
}

.auth-header h2 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.auth-header p {
  color: var(--text-secondary);
  margin: 0;
  font-size: 14px;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 14px;
}

.password-input {
  position: relative;
}

.password-input input {
  padding: 14px 44px 14px 16px;
  width: 100%;
  border: 1px solid var(--gray-300);
  border-radius: 10px;
  font-size: 14px;
  transition: all var(--transition-fast);
}

.password-input input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
}

.toggle-password {
  position: absolute;
  right: 12px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--text-secondary);
  padding: 4px;
}

.toggle-password svg {
  width: 20px;
  height: 20px;
}

.btn-primary {
  padding: 14px 24px;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  color: white;
  border: none;
  border-radius: 10px;
  font-weight: 600;
  font-size: 15px;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 10px 20px -5px rgba(37, 99, 235, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  text-align: center;
}

.message.success {
  background: #dcfce7;
  color: #166534;
}

.message.error {
  background: #fee2e2;
  color: #991b1b;
}

.auth-footer {
  margin-top: 30px;
  text-align: center;
}

.auth-footer a {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: var(--text-secondary);
  text-decoration: none;
  font-size: 14px;
  transition: color var(--transition-fast);
}

.auth-footer a:hover {
  color: var(--primary-600);
}

.auth-footer svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 1024px) {
  .auth-container {
    grid-template-columns: 1fr;
  }
  
  .auth-left {
    display: none;
  }
  
  .auth-right {
    padding: 48px 40px;
  }
}

@media (max-width: 768px) {
  .auth-right {
    padding: 40px 24px;
  }
  
  .auth-container {
    border-radius: 24px;
    margin: 16px;
  }
}

@media (max-width: 640px) {
  .auth-page {
    padding: 12px;
  }
  
  .auth-container {
    border-radius: 20px;
    margin: 0;
    box-shadow: var(--shadow-lg);
  }
  
  .auth-right {
    padding: 32px 20px;
  }
  
  .auth-header h2 {
    font-size: 24px;
  }
  
  .btn-primary {
    padding: 12px 20px;
    font-size: 14px;
  }
}
</style>
