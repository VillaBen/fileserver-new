<template>
  <Teleport to="body">
    <el-dialog
      v-if="showDialog"
      :title="dialogTitle"
      v-model="showDialog"
      :close-on-click-modal="false"
      :close-on-press-escape="false"
      :show-close="false"
      width="90%"
      max-width="400px"
      class="region-detector-dialog"
    >
      <div class="dialog-content">
        <div class="flag-icon">{{ detectedFlag }}</div>
        <p class="location-text">{{ detectedLocation }}</p>
        <p class="message-text">{{ messageText }}</p>
      </div>
      
      <template #footer>
        <div class="dialog-footer">
          <el-button @click="skipLanguageChange" class="skip-btn">
            {{ i18n.t('skip') || 'Skip' }}
          </el-button>
          <el-button type="primary" @click="changeLanguage" class="change-btn">
            {{ i18n.t('changeLanguage') || 'Change to Chinese' }}
          </el-button>
        </div>
      </template>
    </el-dialog>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18nStore } from '../stores/i18n';

const i18n = useI18nStore();

const showDialog = ref(false);
const detectedCountryCode = ref('');
const detectedCountryName = ref('');

const chineseRegions = [
  { code: 'CN', name: 'China', flag: '🇨🇳', locale: 'zh-CN' },
  { code: 'TW', name: 'Taiwan', flag: '🇹🇼', locale: 'zh-CN' },
  { code: 'HK', name: 'Hong Kong', flag: '🇭🇰', locale: 'zh-CN' },
  { code: 'MO', name: 'Macao', flag: '🇲🇴', locale: 'zh-CN' },
  { code: 'SG', name: 'Singapore', flag: '🇸🇬', locale: 'zh-CN' },
  { code: 'MY', name: 'Malaysia', flag: '🇲🇾', locale: 'zh-CN' }
];

const detectedRegion = computed(() => {
  return chineseRegions.find(r => r.code === detectedCountryCode.value);
});

const detectedFlag = computed(() => {
  return detectedRegion.value?.flag || '🌍';
});

const detectedLocation = computed(() => {
  return detectedRegion.value?.name || detectedCountryName.value || 'Your location';
});

const dialogTitle = computed(() => {
  return i18n.t('regionDetectionTitle') || 'Language Preference';
});

const messageText = computed(() => {
  return i18n.t('regionDetectionMessage') || 
    `We detected you are in ${detectedLocation.value}. Would you like to switch to Chinese?`;
});

async function detectLocation() {
  const storedLocale = localStorage.getItem('locale');
  const hasSeenDialog = localStorage.getItem('regionDialogShown');

  if (storedLocale && storedLocale !== 'en-US') {
    console.log('[RegionDetector] 已有语言设置:', storedLocale, '跳过检测');
    return;
  }

  if (hasSeenDialog === 'true') {
    console.log('[RegionDetector] 已显示过对话框，跳过');
    return;
  }

  try {
    // 纯IP检测模式，使用 AbortController 设置超时
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch('https://ipapi.co/json/', {
      method: 'GET',
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Location API failed with status: ${response.status}`);
    }

    const data = await response.json();
    console.log('[RegionDetector] IP 检测结果:', data);
    
    detectedCountryCode.value = data.country_code;
    detectedCountryName.value = data.country_name;
    checkAndShowDialog();
  } catch (error) {
    console.debug('[RegionDetector] 区域检测跳过或失败:', error.message);
  }
}

function checkAndShowDialog() {
  const currentLocale = i18n.currentLocale;
  console.log('[RegionDetector] 检测到代码:', detectedCountryCode.value, '当前语言:', currentLocale);
  
  // 如果检测到中文区域且当前语言是英文，显示提示
  if (detectedRegion.value && currentLocale === 'en-US') {
    console.log('[RegionDetector] 显示对话框');
    showDialog.value = true;
  }
}

function changeLanguage() {
  if (detectedRegion.value) {
    i18n.setLocale(detectedRegion.value.locale);
    localStorage.setItem('locale', detectedRegion.value.locale);
  }
  showDialog.value = false;
  localStorage.setItem('regionDialogShown', 'true');
}

function skipLanguageChange() {
  showDialog.value = false;
  localStorage.setItem('regionDialogShown', 'true');
}

onMounted(() => {
  setTimeout(() => {
    detectLocation();
  }, 1000);
});
</script>

<style scoped>
.region-detector-dialog {
  border-radius: 16px;
  overflow: hidden;
}

.region-detector-dialog .el-dialog__header {
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  padding: 20px;
}

.region-detector-dialog .el-dialog__title {
  color: white;
  font-size: 18px;
  font-weight: 600;
}

.dialog-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 24px 16px;
  gap: 12px;
}

.flag-icon {
  font-size: 48px;
}

.location-text {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
}

.message-text {
  margin: 0;
  font-size: 14px;
  color: var(--el-text-color-secondary);
  text-align: center;
  line-height: 1.6;
}

.dialog-footer {
  display: flex;
  gap: 12px;
  justify-content: center;
  padding: 16px 20px;
}

.skip-btn {
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
}

.change-btn {
  padding: 10px 24px;
  border-radius: 20px;
  font-size: 14px;
  background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);
  border: none;
}
</style>
