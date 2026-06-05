<template>
  <div v-if="visible" class="modal-overlay" @click.self="handleClose">
    <div class="modal-content">
      <!-- Header -->
      <div class="modal-header">
        <div class="header-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11l4-7 2 3 4-4 3 8" />
          </svg>
        </div>
        <div class="header-text">
          <h2 class="modal-title">两步验证</h2>
          <p class="modal-subtitle">{{ getStepSubtitle() }}</p>
        </div>
        <button class="close-btn" @click="handleClose">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>

      <!-- Step 1: QR Code -->
      <div v-if="step === 1" class="modal-body">
        <div class="step-content">
          <div class="qr-container">
            <div v-if="qrCodeUrl" class="qr-wrapper">
              <img :src="qrCodeUrl" alt="QR Code" class="qr-image" />
            </div>
            <div v-else class="qr-loading">
              <svg class="loading-spinner" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 12a9 9 0 11-6.219-8.56" />
              </svg>
            </div>
          </div>
          
          <div class="instruction">
            <h3>使用验证器应用扫描二维码</h3>
            <p>下载 Google Authenticator 或 Authy，扫描上方二维码来添加账户</p>
          </div>

          <div v-if="secret" class="secret-box">
            <div class="secret-label">无法扫描？手动输入密钥：</div>
            <div class="secret-value">{{ secret }}</div>
          </div>
        </div>
      </div>

      <!-- Step 2: Verify Code -->
      <div v-if="step === 2" class="modal-body">
        <div class="step-content">
          <div class="verify-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="16" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12.01" y2="8" />
            </svg>
          </div>
          
          <div class="instruction">
            <h3>输入验证码</h3>
            <p>请输入验证器应用中显示的 6 位数字</p>
          </div>

          <div class="code-inputs">
            <input
              v-for="(_, index) in 6"
              :key="index"
              ref="codeInputs"
              type="text"
              maxlength="1"
              class="code-input"
              :value="verificationCode[index]"
              @input="handleCodeInput($event, index)"
              @keydown="handleKeyDown($event, index)"
              @paste="handlePaste"
            />
          </div>
        </div>
      </div>

      <!-- Step 3: Recovery Codes -->
      <div v-if="step === 3" class="modal-body">
        <div class="step-content">
          <div class="success-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>
          
          <div class="instruction">
            <h3>设置成功！</h3>
            <p>请保存以下恢复代码，以便在丢失设备时访问账户</p>
          </div>

          <div class="recovery-container">
            <div class="recovery-grid">
              <div v-for="(code, index) in recoveryCodes" :key="index" class="recovery-code">
                {{ code }}
              </div>
            </div>
          </div>

          <div class="warning-box">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              <line x1="12" y1="9" x2="12" y2="13" />
              <line x1="12" y1="17" x2="12.01" y2="17" />
            </svg>
            <span>请将这些代码保存在安全的地方，不要与他人分享</span>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="modal-footer">
        <button v-if="step > 1" class="btn secondary" @click="prevStep">
          上一步
        </button>
        <div class="spacer" />
        <button v-if="step === 1" class="btn primary" @click="nextStep">
          继续
        </button>
        <button v-if="step === 2" class="btn primary" @click="verifyCode" :disabled="isLoading || verificationCode.length !== 6">
          {{ isLoading ? '验证中...' : '验证' }}
        </button>
        <div v-if="step === 3" class="footer-actions">
          <button class="btn secondary" @click="copyCodes">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
              <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
            </svg>
            复制全部
          </button>
          <button class="btn primary" @click="finishSetup">
            完成
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, nextTick } from 'vue';
import { authAPI } from '../api';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(['update:modelValue', 'success']);

const visible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
});

const step = ref(1);
const qrCodeUrl = ref('');
const secret = ref('');
const verificationCode = ref([]);
const recoveryCodes = ref([]);
const isLoading = ref(false);
const codeInputs = ref([]);

function getStepSubtitle() {
  const subtitles = ['第 1 步，共 3 步', '第 2 步，共 3 步', '完成！'];
  return subtitles[step.value - 1];
}

async function startSetup() {
  try {
    const response = await authAPI.setup2FA();
    if (response.success && response.data) {
      qrCodeUrl.value = response.data.qrCodeUrl;
      secret.value = response.data.secret;
      step.value = 1;
    }
  } catch (error) {
    console.error('设置 2FA 失败', error);
  }
}

function nextStep() {
  step.value++;
  if (step.value === 2) {
    nextTick(() => {
      codeInputs.value[0]?.focus();
    });
  }
}

function prevStep() {
  step.value--;
  verificationCode.value = [];
}

function handleCodeInput(event, index) {
  const input = event.target;
  const value = input.value.slice(-1);
  
  if (/^\d$/.test(value)) {
    verificationCode.value[index] = value;
    
    if (value && index < 5) {
      nextTick(() => {
        codeInputs.value[index + 1]?.focus();
      });
    }
  } else {
    input.value = verificationCode.value[index] || '';
  }
}

function handleKeyDown(event, index) {
  if (event.key === 'Backspace' && !verificationCode.value[index] && index > 0) {
    nextTick(() => {
      codeInputs.value[index - 1]?.focus();
    });
  } else if (event.key === 'ArrowLeft' && index > 0) {
    event.preventDefault();
    codeInputs.value[index - 1]?.focus();
  } else if (event.key === 'ArrowRight' && index < 5) {
    event.preventDefault();
    codeInputs.value[index + 1]?.focus();
  } else if (event.key === 'Enter' && verificationCode.value.length === 6) {
    verifyCode();
  }
}

function handlePaste(event) {
  event.preventDefault();
  const pastedText = event.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
  
  if (pastedText) {
    verificationCode.value = pastedText.split('');
    nextTick(() => {
      if (pastedText.length === 6) {
        codeInputs.value[5]?.focus();
      } else {
        codeInputs.value[pastedText.length]?.focus();
      }
    });
  }
}

async function verifyCode() {
  if (verificationCode.value.length !== 6) return;

  try {
    isLoading.value = true;
    const response = await authAPI.verify2FA({
      code: verificationCode.value.join(''),
    });

    if (response.success) {
      await generateRecoveryCodes();
      step.value = 3;
    }
  } catch (error) {
    verificationCode.value = [];
    codeInputs.value[0]?.focus();
  } finally {
    isLoading.value = false;
  }
}

async function generateRecoveryCodes() {
  try {
    const response = await authAPI.generateRecoveryCodes();
    if (response.success && response.data) {
      recoveryCodes.value = response.data.codes || [];
    }
  } catch (error) {
    console.error('生成恢复码失败', error);
  }
}

function copyCodes() {
  const codes = recoveryCodes.value.join('\n');
  navigator.clipboard.writeText(codes);
}

function finishSetup() {
  emit('success');
  handleClose();
}

function handleClose() {
  step.value = 1;
  qrCodeUrl.value = '';
  secret.value = '';
  verificationCode.value = [];
  recoveryCodes.value = [];
  visible.value = false;
}

defineExpose({
  startSetup,
});
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
  animation: fadeIn 0.2s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal-content {
  background: white;
  border-radius: 20px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-xl);
  animation: slideUp 0.3s ease;
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.modal-header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--gray-100);
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--accent-50) 100%);
}

.header-icon {
  width: 48px;
  height: 48px;
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.header-icon svg {
  width: 24px;
  height: 24px;
}

.header-text {
  flex: 1;
}

.modal-title {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 4px 0;
}

.modal-subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--text-tertiary);
  font-weight: 500;
}

.close-btn {
  width: 36px;
  height: 36px;
  border: none;
  background: var(--gray-100);
  border-radius: 10px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
  flex-shrink: 0;
}

.close-btn:hover {
  background: var(--gray-200);
  color: var(--text-primary);
}

.close-btn svg {
  width: 20px;
  height: 20px;
}

.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 28px 24px;
}

.step-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qr-container {
  margin-bottom: 24px;
}

.qr-wrapper {
  padding: 16px;
  background: white;
  border: 2px dashed var(--gray-200);
  border-radius: 16px;
}

.qr-image {
  width: 200px;
  height: 200px;
  display: block;
}

.qr-loading {
  width: 200px;
  height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--gray-50);
  border-radius: 16px;
  border: 2px dashed var(--gray-200);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  color: var(--primary-500);
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.verify-icon,
.success-icon {
  width: 64px;
  height: 64px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20px;
}

.verify-icon {
  background: linear-gradient(135deg, var(--primary-100) 0%, var(--accent-100) 100%);
  color: var(--primary-600);
}

.success-icon {
  background: linear-gradient(135deg, var(--accent-100) 0%, var(--accent-200) 100%);
  color: var(--accent-600);
}

.verify-icon svg,
.success-icon svg {
  width: 32px;
  height: 32px;
}

.instruction {
  text-align: center;
  margin-bottom: 24px;
}

.instruction h3 {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
  margin: 0 0 8px 0;
}

.instruction p {
  margin: 0;
  font-size: 14px;
  color: var(--text-secondary);
  line-height: 1.6;
}

.secret-box {
  width: 100%;
  padding: 16px;
  background: var(--gray-50);
  border-radius: 12px;
  text-align: center;
}

.secret-label {
  font-size: 13px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

.secret-value {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 4px;
  color: var(--primary-600);
}

.code-inputs {
  display: flex;
  gap: 10px;
  justify-content: center;
  margin-bottom: 8px;
}

.code-input {
  width: 48px;
  height: 56px;
  text-align: center;
  font-size: 24px;
  font-weight: 700;
  border: 2px solid var(--gray-200);
  border-radius: 12px;
  background: white;
  color: var(--text-primary);
  transition: all var(--transition-fast);
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
}

.code-input:focus {
  outline: none;
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.recovery-container {
  width: 100%;
  padding: 20px;
  background: var(--gray-50);
  border-radius: 16px;
  margin-bottom: 20px;
}

.recovery-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
}

.recovery-code {
  font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
  background: white;
  padding: 10px 14px;
  border-radius: 8px;
  text-align: center;
  letter-spacing: 2px;
}

.warning-box {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 14px 16px;
  background: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 12px;
  width: 100%;
}

.warning-box svg {
  width: 20px;
  height: 20px;
  color: #d97706;
  flex-shrink: 0;
}

.warning-box span {
  font-size: 13px;
  color: #92400e;
  line-height: 1.5;
}

.modal-footer {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--gray-100);
  background: white;
}

.spacer {
  flex: 1;
}

.footer-actions {
  display: flex;
  gap: 12px;
  margin-left: auto;
}

.btn {
  padding: 12px 24px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all var(--transition-fast);
  display: flex;
  align-items: center;
  gap: 8px;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn.secondary {
  background: var(--gray-100);
  color: var(--text-primary);
}

.btn.secondary:hover:not(:disabled) {
  background: var(--gray-200);
}

.btn.primary {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
  color: white;
  box-shadow: 0 4px 14px 0 rgb(59, 130, 246, 0.3);
}

.btn.primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgb(59, 130, 246, 0.4);
}

.btn svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 480px) {
  .modal-content {
    border-radius: 16px;
  }
  
  .modal-header,
  .modal-body,
  .modal-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
  
  .qr-image,
  .qr-loading {
    width: 160px;
    height: 160px;
  }
  
  .code-input {
    width: 42px;
    height: 52px;
    font-size: 20px;
  }
  
  .recovery-grid {
    grid-template-columns: 1fr;
  }
}
</style>
