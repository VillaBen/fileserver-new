<template>
  <div class="language-selector">
    <button 
      class="language-btn" 
      @click="toggleDropdown"
      :title="i18n.t('language')"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="12" cy="12" r="10" />
        <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
        <path d="M2 12h20" />
        <path d="M12 2a7.5 7.5 0 0 0 9 9 7.5 7.5 0 0 1-9 9 7.5 7.5 0 0 1-9-9 7.5 7.5 0 0 0 9-9" />
      </svg>
      <span class="language-label">{{ currentLanguageLabel }}</span>
      <svg 
        class="dropdown-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="currentColor" 
        stroke-width="2"
        :class="{ rotated: isOpen }"
      >
        <polyline points="6 9 12 15 18 9" />
      </svg>
    </button>
    
    <div v-if="isOpen" class="dropdown-menu" @click.self="isOpen = false">
      <button 
        v-for="lang in languages" 
        :key="lang.code"
        class="dropdown-item"
        :class="{ active: i18n.currentLocale === lang.code }"
        @click="selectLanguage(lang.code)"
      >
        <span class="flag">{{ lang.flag }}</span>
        <span class="lang-name">{{ lang.name }}</span>
      </button>
    </div>
    
    <div v-if="showLocationHint" class="location-hint">
      <span>{{ i18n.t('detectedLocation') }}: {{ detectedLocationName }}</span>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useI18nStore } from '../stores/i18n';

const i18n = useI18nStore();
const isOpen = ref(false);
const showLocationHint = ref(false);
const detectedLocationName = ref('');

const languages = [
  { code: 'en-US', name: 'English', flag: '🇺🇸' },
  { code: 'zh-CN', name: '中文', flag: '🇨🇳' }
];

const currentLanguageLabel = computed(() => {
  const lang = languages.find(l => l.code === i18n.currentLocale);
  return lang ? lang.name : 'English';
});

function toggleDropdown() {
  isOpen.value = !isOpen.value;
}

function selectLanguage(code) {
  console.log('LanguageSelector: selectLanguage called with code:', code);
  console.log('LanguageSelector: Current locale before change:', i18n.currentLocale);
  i18n.setLocale(code);
  console.log('LanguageSelector: Current locale after change:', i18n.currentLocale);
  isOpen.value = false;
}

async function detectLocation() {
  console.log('LanguageSelector: Starting location detection...');
  try {
    const response = await fetch('https://ipapi.co/json/');
    if (!response.ok) {
      throw new Error(`Location API failed with status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('LanguageSelector: Location API response:', data);
    
    const countryCode = data.country_code;
    const countryName = data.country_name || 'Your location';
    
    detectedLocationName.value = countryName;
    console.log('LanguageSelector: Detected location:', countryCode, countryName);
    
    const chineseRegions = ['CN', 'TW', 'HK', 'MO', 'SG', 'MY'];
    if (chineseRegions.includes(countryCode)) {
      console.log('LanguageSelector: User in Chinese-speaking region');
      if (i18n.currentLocale === 'en-US' && !localStorage.getItem('locale')) {
        console.log('LanguageSelector: Showing location hint');
        showLocationHint.value = true;
        setTimeout(() => {
          showLocationHint.value = false;
        }, 8000);
      }
    } else {
      console.log('LanguageSelector: User not in Chinese-speaking region');
    }
  } catch (error) {
    console.warn('LanguageSelector: Location detection failed:', error);
    console.warn('LanguageSelector: Error message:', error.message);
    detectedLocationName.value = '';
  }
}

function handleClickOutside(event) {
  const selector = document.querySelector('.language-selector');
  if (selector && !selector.contains(event.target)) {
    isOpen.value = false;
  }
}

onMounted(() => {
  detectLocation();
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.language-selector {
  position: relative;
  display: flex;
  align-items: center;
  gap: 12px;
}

.language-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  color: white;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.language-btn:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.3);
}

.language-btn svg {
  width: 18px;
  height: 18px;
}

.dropdown-icon {
  transition: transform 0.2s ease;
}

.dropdown-icon.rotated {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1000;
  animation: slideDown 0.2s ease;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 14px;
  color: var(--text-primary);
  transition: background 0.2s ease;
  text-align: left;
}

.dropdown-item:hover {
  background: var(--gray-50);
}

.dropdown-item.active {
  background: var(--primary-50);
  color: var(--primary-600);
}

.flag {
  font-size: 18px;
}

.lang-name {
  font-weight: 500;
}

.location-hint {
  position: absolute;
  bottom: calc(100% + 12px);
  right: 0;
  padding: 8px 12px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  font-size: 12px;
  border-radius: 8px;
  white-space: nowrap;
  animation: fadeInUp 0.3s ease;
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@media (max-width: 768px) {
  .language-btn {
    padding: 6px 10px;
    font-size: 12px;
  }
  
  .language-label {
    display: none;
  }
  
  .language-btn svg {
    width: 16px;
    height: 16px;
  }
}
</style>