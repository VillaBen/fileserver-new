<template>
  <div class="captcha-container">
    <div class="captcha-left">
      <div class="input-wrapper">
        <svg class="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
          <path d="M7 11l4-7 2 3 4-4 3 8" />
        </svg>
        <input
          v-model="captchaCode"
          type="text"
          :placeholder="i18n.t('verificationCode')"
          class="captcha-input"
          @input="handleInput"
        />
        <button 
          v-if="captchaCode" 
          type="button" 
          class="clear-btn" 
          @click="clearCaptcha"
          :title="i18n.t('clear') || 'Clear'"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>
      </div>
      <div v-if="filterWarning" class="captcha-filter-warning">
        <svg class="warning-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>{{ i18n.t('invalidCharactersRemoved') }}</span>
      </div>
    </div>
    <div class="captcha-wrapper" @click="refreshCaptcha" :title="i18n.t('clickToRefresh')">
      <img v-if="captchaImage" :src="captchaImage" :alt="i18n.t('verificationCode')" class="captcha-image" />
      <div v-else class="captcha-loading">
        <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <span>{{ i18n.t('loading') }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useI18nStore } from '../stores/i18n';
import { captchaAPI } from '../api';
import { filterCaptcha } from '../utils/inputFilter';

const i18n = useI18nStore();

const emit = defineEmits(['update:modelValue', 'captchaReady']);

const props = defineProps({
  modelValue: {
    type: String,
    default: '',
  },
});

const captchaCode = ref('');
const captchaImage = ref('');
const captchaId = ref('');
const filterWarning = ref(false);

function handleInput() {
  const sanitized = filterCaptcha(captchaCode.value);
  if (sanitized !== captchaCode.value) {
    captchaCode.value = sanitized;
    filterWarning.value = true;
    setTimeout(() => {
      filterWarning.value = false;
    }, 3000);
  }
  emit('update:modelValue', captchaCode.value);
}

function clearCaptcha() {
  captchaCode.value = '';
  emit('update:modelValue', '');
}

async function refreshCaptcha() {
  try {
    const response = await captchaAPI.generate();
    if (response.success && response.data) {
      captchaId.value = response.data.captchaId;
      captchaImage.value = response.data.image;
      emit('captchaReady', captchaId.value);
    } else {
      console.error('Captcha: Invalid response structure', response);
    }
  } catch (error) {
    console.error('Captcha: Failed to refresh captcha', error);
  }
}

onMounted(() => {
  captchaCode.value = props.modelValue;
  refreshCaptcha();
});

watch(() => props.modelValue, (newValue) => {
  captchaCode.value = newValue;
});

function getCaptchaData() {
  return {
    captchaId: captchaId.value,
    captchaCode: captchaCode.value,
  };
}

defineExpose({
  refreshCaptcha,
  getCaptchaData,
  clearCaptcha,
});
</script>

<style scoped>
.captcha-container {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  width: 100%;
}

.captcha-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
}

.input-wrapper {
  flex: 1;
  display: flex;
  align-items: center;
  background: white;
  border: 1.5px solid var(--gray-200);
  border-radius: 12px;
  padding: 0 16px;
  transition: all var(--transition-base);
  min-width: 0;
}

.input-wrapper:focus-within {
  border-color: var(--primary-500);
  box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.1);
}

.input-icon {
  width: 18px;
  height: 18px;
  color: var(--gray-400);
  flex-shrink: 0;
  margin-right: 10px;
}

.captcha-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 15px;
  color: var(--text-primary);
  padding: 14px 0;
  min-width: 0;
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px;
  color: var(--gray-400);
  transition: color var(--transition-base);
  border-radius: 50%;
  flex-shrink: 0;
}

.clear-btn:hover {
  color: var(--gray-600);
  background: var(--gray-100);
}

.clear-btn svg {
  width: 16px;
  height: 16px;
}

.captcha-input::placeholder {
  color: var(--gray-400);
}

.captcha-wrapper {
  flex-shrink: 0;
  width: 160px;
  height: 56px;
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--accent-50) 100%);
  border: 1.5px solid var(--gray-200);
  border-radius: 12px;
  cursor: pointer;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  transition: all var(--transition-base);
}

.captcha-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.captcha-loading {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: var(--gray-500);
  font-size: 12px;
  width: 100%;
  height: 100%;
}

.loading-icon {
  width: 20px;
  height: 20px;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.captcha-filter-warning {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #fffbeb;
  color: #d97706;
  padding: 10px 14px;
  border-radius: 8px;
  border: 1px solid #fed7aa;
  font-size: 14px;
}

.captcha-filter-warning .warning-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

@media (max-width: 768px) {
  .captcha-container {
    flex-direction: row;
    gap: 10px;
  }
  
  .captcha-wrapper {
    width: 120px;
    height: 48px;
  }
  
  .captcha-loading {
    gap: 8px;
    font-size: 12px;
  }
  
  .captcha-input {
    padding: 12px 0;
    font-size: 14px;
  }
}
</style>
