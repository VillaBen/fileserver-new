import { createApp } from 'vue';
import { createPinia } from 'pinia';
import router from './router';
import ElementPlus from 'element-plus';
import 'element-plus/dist/index.css';
import App from './App.vue';
import { useI18nStore } from './stores/i18n';
import { toast } from './utils/toast';

// Initialize app
const app = createApp(App);
const pinia = createPinia();

// Use plugins
app.use(pinia);
app.use(router);
app.use(ElementPlus);

// Initialize i18n
const i18nStore = useI18nStore();
i18nStore.init();

// Global error handler - Q2
app.config.errorHandler = (err, vm, info) => {
  console.error('Vue Error:', err, info);
  
  // Show user-friendly error message
  const errorMessage = err.message || 'An unexpected error occurred';
  toast.error(errorMessage);
  
  // Log to console for debugging
  if (err.stack) {
    console.error('Error stack:', err.stack);
  }
};

// Global warning handler
app.config.warnHandler = (msg, vm, trace) => {
  console.warn('Vue Warning:', msg, trace);
};

// Mount app
app.mount('#app');

console.log('%c📁 FileCloud', 'color: #667eea; font-size: 20px; font-weight: bold;');
console.log('%cWelcome to FileCloud - Your personal file management system', 'color: #764ba2;');
