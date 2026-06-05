<template>
  <div class="captcha-container">
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
    </div>
    <div class="captcha-wrapper" @click="refreshCaptcha" :title="i18n.t('clickToRefresh')">
      <img v-if="captchaImage" :src="captchaImage" :alt="i18n.t('verificationCode')" class="captcha-image" />
      <div v-else class="captcha-loading">
        <svg class="loading-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12a9 9 0 11-6.219-8.56" />
        </svg>
        <span>{{ i18n.t('loading') }}</span>
      </div>
      <div class="refresh-hint">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="23 4 23 10 17 10" />
          <path d="M20.49 15a9 9 0 11-2.121-9.358L23 10" />
        </svg>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18nStore } from '../stores/i18n';
import { captchaAPI } from '../api';

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

function handleInput() {
  emit('update:modelValue', captchaCode.value);
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
  refreshCaptcha();
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
});
</script>

<style scoped>
.captcha-container {
  display: flex;
  gap: 12px;
  align-items: stretch;
  width: 100%;
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

.captcha-input::placeholder {
  color: var(--gray-400);
}

.captcha-wrapper {
  flex-shrink: 0;
  width: 180px;
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

.captcha-wrapper:hover {
  border-color: var(--primary-400);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
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

.refresh-hint {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity var(--transition-base);
}

.captcha-wrapper:hover .refresh-hint {
  opacity: 1;
}

.refresh-hint svg {
  width: 24px;
  height: 24px;
  color: white;
}

@media (max-width: 768px) {
  .captcha-container {
    flex-direction: column;
    gap: 12px;
  }
  
  .captcha-wrapper {
    width: 100%;
    height: 70px;
  }
  
  .captcha-loading {
    gap: 10px;
    font-size: 13px;
  }
}
</style>
