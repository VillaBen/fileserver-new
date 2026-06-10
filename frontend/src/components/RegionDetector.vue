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
        <p class="detection-source">{{ detectionSourceText }}</p>
      </div>
      
      <div class="checkbox-container">
        <el-checkbox v-model="dontShowAgain" :label="i18n.t('dontShowAgain') || \"Don't show again\"">
        </el-checkbox>
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
const dontShowAgain = ref(false);
const detectionSource = ref('');

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

const detectionSourceText = computed(() => {
  if (detectionSource.value === 'ip') {
    return '(Based on IP location)';
  } else if (detectionSource.value === 'browser') {
    return '(Based on browser language)';
  }
  return '';
});

async function detectLocation() {
  const storedLocale = localStorage.getItem('locale');
  const neverShowAgain = localStorage.getItem('regionDialogNeverShow');

  if (storedLocale && storedLocale !== 'en-US') {
    console.log('[RegionDetector] 已有语言设置:', storedLocale, '跳过检测');
    return;
  }

  if (neverShowAgain === 'true') {
    console.log('[RegionDetector] 用户已勾选不再弹出，跳过');
    return;
  }

  // 方案1：优先使用IP检测
  let detectedByIP = await detectByIP();
  
  if (!detectedByIP) {
    // 方案2：IP检测失败，使用浏览器语言作为备用方案
    console.log('[RegionDetector] IP检测失败，使用浏览器语言作为备用方案');
    detectedByIP = await detectByBrowserLanguage();
  }

  if (detectedByIP) {
    checkAndShowDialog();
  }
}

async function detectByIP() {
  try {
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
    console.log('[RegionDetector] IP检测结果:', data);
    
    detectedCountryCode.value = data.country_code;
    detectedCountryName.value = data.country_name;
    detectionSource.value = 'ip';
    
    return true;
  } catch (error) {
    console.debug('[RegionDetector] IP检测失败:', error.message);
    return false;
  }
}

async function detectByBrowserLanguage() {
  try {
    const browserLang = navigator.language || navigator.userLanguage;
    console.log('[RegionDetector] 浏览器语言:', browserLang);
    
    // 检查是否为中文语言
    if (browserLang.startsWith('zh')) {
      // 设置为中国区域
      detectedCountryCode.value = 'CN';
      detectedCountryName.value = 'China';
      detectionSource.value = 'browser';
      return true;
    }
    
    return false;
  } catch (error) {
    console.debug('[RegionDetector] 浏览器语言检测失败:', error.message);
    return false;
  }
}

function checkAndShowDialog() {
  const currentLocale = i18n.currentLocale;
  console.log('[RegionDetector] 检测到代码:', detectedCountryCode.value, '当前语言:', currentLocale, '检测来源:', detectionSource.value);
  
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
  
  // 只有勾选了不再弹出才保存
  if (dontShowAgain.value) {
    localStorage.setItem('regionDialogNeverShow', 'true');
    console.log('[RegionDetector] 用户勾选不再弹出，已记录');
  }
  
  dontShowAgain.value = false;
}

function skipLanguageChange() {
  showDialog.value = false;
  
  // 只有勾选了不再弹出才保存
  if (dontShowAgain.value) {
    localStorage.setItem('regionDialogNeverShow', 'true');
    console.log('[RegionDetector] 用户勾选不再弹出，已记录');
  }
  
  dontShowAgain.value = false;
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

.detection-source {
  margin: 0;
  font-size: 12px;
  color: var(--el-text-color-placeholder);
  text-align: center;
}

.checkbox-container {
  padding: 0 16px 16px;
  display: flex;
  justify-content: center;
}

.checkbox-container .el-checkbox {
  font-size: 13px;
  color: var(--el-text-color-secondary);
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
