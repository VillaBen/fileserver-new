<template>
  <router-view />
  <RegionDetector />
</template>

<script setup>
import { onMounted } from 'vue';
import RegionDetector from './components/RegionDetector.vue';
import { useI18nStore } from './stores/i18n';

// 页面加载时初始化主题设置（确保深色模式在首次渲染时就生效）
onMounted(() => {
  const i18nStore = useI18nStore();
  i18nStore.init();
});
</script>

<style>
/* ==============================================
   NEW DESIGN SYSTEM - COMPLETE OVERHAUL
   ============================================== */

/* CSS Variables - Design Tokens */
:root {
  /* Colors */
  --primary-50: #eff6ff;
  --primary-100: #dbeafe;
  --primary-200: #bfdbfe;
  --primary-300: #93c5fd;
  --primary-400: #60a5fa;
  --primary-500: #3b82f6;
  --primary-600: #2563eb;
  --primary-700: #1d4ed8;
  --primary-800: #1e40af;
  --primary-900: #1e3a8a;
  --accent-50: #f0fdf4;
  --accent-100: #dcfce7;
  --accent-500: #22c55e;
  --accent-600: #16a34a;
  
  --danger-500: #ef4444;
  --danger-600: #dc2626;
  
  --gray-50: #f9fafb;
  --gray-100: #f3f4f6;
  --gray-200: #e5e7eb;
  --gray-300: #d1d5db;
  --gray-400: #9ca3af;
  --gray-500: #6b7280;
  --gray-600: #4b5563;
  --gray-700: #374151;
  --gray-800: #1f2937;
  --gray-900: #111827;
  
  /* Surface Colors */
  --bg-page: #f8fafc;
  --bg-surface: #ffffff;
  --bg-surface-hover: #f1f5f9;
  
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  --text-primary: #0f172a;
  --text-secondary: #475569;
  --text-tertiary: #94a3b8;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow: 0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
  --shadow-lg: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  --shadow-xl: 0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1);
  
  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;
  --spacing-2xl: 3rem;
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 200ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

/* Reset & Base */
*, *::before, *::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
}

body {
  font-family: var(--font-sans);
  font-size: 14px;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-page);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* Scrollbar Styling */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: transparent;
}

::-webkit-scrollbar-thumb {
  background: var(--gray-300);
  border-radius: var(--radius-full);
}

::-webkit-scrollbar-thumb:hover {
  background: var(--gray-400);
}

/* Typography */
h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
}

h1 { font-size: 2rem; }
h2 { font-size: 1.5rem; }
h3 { font-size: 1.25rem; }
h4 { font-size: 1rem; }

/* Utility Classes */
.flex { display: flex; }
.flex-col { flex-direction: column; }
.items-center { align-items: center; }
.justify-between { justify-content: space-between; }
.gap-1 { gap: 0.25rem; }
.gap-2 { gap: 0.5rem; }
.gap-3 { gap: 0.75rem; }
.gap-4 { gap: 1rem; }
.gap-6 { gap: 1.5rem; }

.p-2 { padding: 0.5rem; }
.p-3 { padding: 0.75rem; }
.p-4 { padding: 1rem; }
.p-6 { padding: 1.5rem; }
.p-8 { padding: 2rem; }

.mt-2 { margin-top: 0.5rem; }
.mt-4 { margin-top: 1rem; }
.mt-6 { margin-top: 1.5rem; }

/* Element Plus Overrides for New Design */
.el-button {
  border-radius: var(--radius-md);
  font-weight: 500;
  padding: 8px 16px;
  transition: all var(--transition-fast);
}

.el-button--primary {
  background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-500) 100%);
  border: none;
  box-shadow: 0 4px 14px 0 rgb(37 99 235 / 30%);
}

.el-button--primary:hover {
  background: linear-gradient(135deg, var(--primary-700) 0%, var(--primary-600) 100%);
  transform: translateY(-1px);
  box-shadow: 0 6px 20px 0 rgb(37 99 235 / 40%);
}

.el-button--success {
  background: linear-gradient(135deg, var(--accent-600) 0%, var(--accent-500) 100%);
  border: none;
}

.el-button--success:hover {
  background: linear-gradient(135deg, #15803d 0%, var(--accent-600) 100%);
}

.el-input__wrapper {
  border-radius: var(--radius-md);
  box-shadow: 0 0 0 1px var(--gray-200) inset;
  transition: all var(--transition-fast);
}

.el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--gray-300) inset;
}

.el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px var(--primary-200) inset;
}

.el-card {
  border-radius: var(--radius-xl);
  border: none;
  box-shadow: var(--shadow);
}

.el-dialog {
  border-radius: var(--radius-xl);
  overflow: hidden;
}

.el-dialog__header {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--accent-50) 100%);
  padding: 20px 24px;
  border-bottom: 1px solid var(--gray-100);
}

.el-menu {
  border: none;
  background: transparent;
}

.el-menu-item {
  border-radius: var(--radius-md);
  margin: 4px 8px;
  color: var(--text-secondary);
  transition: all var(--transition-fast);
}

.el-menu-item:hover {
  background: var(--gray-100);
  color: var(--text-primary);
}

.el-menu-item.is-active {
  background: linear-gradient(135deg, var(--primary-50) 0%, var(--primary-100) 100%);
  color: var(--primary-700);
  font-weight: 500;
}

.el-table {
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.el-form-item__label {
  color: var(--text-primary);
  font-weight: 500;
}

/* Dark Theme - 覆盖 Element Plus 核心 CSS 变量 */
.dark-theme {
  /* ===== 页面背景颜色 ===== */
  --bg-page: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-hover: #334155;

  /* ===== Element Plus 背景颜色 ===== */
  --el-bg-color: #1e293b;
  --el-bg-color-page: #0f172a;
  --el-bg-color-overlay: #1e293b;
  --el-fill-color: #334155;
  --el-fill-color-light: #1e293b;
  --el-fill-color-lighter: #334155;
  --el-fill-color-blank: #1e293b;

  /* ===== Element Plus 文字颜色 ===== */
  --el-text-color-primary: #f1f5f9;
  --el-text-color-regular: #cbd5e1;
  --el-text-color-secondary: #94a3b8;
  --el-text-color-placeholder: #64748b;
  --el-text-color-disabled: #475569;

  /* ===== Element Plus 边框颜色 ===== */
  --el-border-color: #334155;
  --el-border-color-light: #1e293b;
  --el-border-color-lighter: #334155;
  --el-border-color-extra-light: #334155;
  --el-border-color-dark: #475569;
  --el-border-radius-base: 8px;
  --el-border-radius-small: 6px;

  /* ===== Element Plus 主色 ===== */
  --el-color-primary: #3b82f6;
  --el-color-primary-light-3: #60a5fa;
  --el-color-primary-light-5: #7db9fb;
  --el-color-primary-light-7: #a4cfff;
  --el-color-primary-light-8: #b8daff;
  --el-color-primary-light-9: #dbeafe;
  --el-color-primary-dark-2: #2563eb;

  /* ===== Element Plus 成功/警告/危险色 ===== */
  --el-color-success: #22c55e;
  --el-color-success-light-3: #4ade80;
  --el-color-success-light-5: #86efac;
  --el-color-success-light-7: #bbf7d0;
  --el-color-success-light-8: #dcfce7;
  --el-color-success-light-9: #f0fdf4;
  --el-color-success-dark-2: #16a34a;

  --el-color-warning: #f59e0b;
  --el-color-warning-light-3: #fbbf24;
  --el-color-warning-light-5: #fcd34d;
  --el-color-warning-light-7: #fde68a;
  --el-color-warning-light-8: #fef3c7;
  --el-color-warning-light-9: #fffbeb;
  --el-color-warning-dark-2: #d97706;

  --el-color-danger: #ef4444;
  --el-color-danger-light-3: #f87171;
  --el-color-danger-light-5: #fca5a5;
  --el-color-danger-light-7: #fecaca;
  --el-color-danger-light-8: #fee2e2;
  --el-color-danger-light-9: #fef2f2;
  --el-color-danger-dark-2: #dc2626;

  /* ===== 阴影 ===== */
  --el-box-shadow: 0 12px 32px 4px rgba(2, 6, 23, 0.36), 0 8px 20px rgba(2, 6, 23, 0.36);
  --el-box-shadow-light: 0 2px 8px 0 rgba(2, 6, 23, 0.5);
  --el-box-shadow-lighter: 0 1px 4px rgba(2, 6, 23, 0.5);
  --el-box-shadow-dark: 0 20px 48px 16px rgba(2, 6, 23, 0.6), 0 8px 32px rgba(2, 6, 23, 0.6);

  /* 输入框占位符颜色 */
  color-scheme: dark;
}

.dark-theme body {
  background-color: var(--bg-page);
  color: var(--el-text-color-primary);
}

.dark-theme .el-card {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
}

.dark-theme .el-dialog {
  background: var(--el-bg-color);
}

.dark-theme .el-dialog__header {
  background: transparent;
  border-bottom: 1px solid var(--el-border-color);
}

.dark-theme .el-table {
  background: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-table tr {
  background-color: var(--el-bg-color);
}

.dark-theme .el-table th.el-table__cell {
  background-color: var(--el-fill-color-light);
}

.dark-theme .el-table--enable-row-hover .el-table__body tr:hover > td.el-table__cell {
  background-color: var(--el-fill-color);
}

.dark-theme .el-table td.el-table__cell,
.dark-theme .el-table th.el-table__cell.is-leaf {
  border-bottom: 1px solid var(--el-border-color);
}

.dark-theme .el-table::before {
  background-color: var(--el-border-color);
}

.dark-theme .el-menu {
  background: var(--el-bg-color);
  border-right: 1px solid var(--el-border-color);
}

.dark-theme .el-menu-item {
  color: var(--el-text-color-regular);
}

.dark-theme .el-menu-item:hover {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-menu-item.is-active {
  background: linear-gradient(135deg, var(--el-color-primary-light-9) 0%, var(--el-color-primary-light-8) 100%);
  color: var(--el-color-primary);
}

.dark-theme .el-input__wrapper {
  background-color: var(--el-fill-color-blank);
  box-shadow: 0 0 0 1px var(--el-border-color) inset;
  transition: box-shadow 0.2s;
}

.dark-theme .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--el-color-primary) inset;
}

.dark-theme .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px var(--el-color-primary) inset;
}

.dark-theme .el-input__inner {
  color: var(--el-text-color-primary);
}

.dark-theme .el-input__inner::placeholder {
  color: var(--el-text-color-placeholder);
}

.dark-theme .el-textarea__inner {
  background-color: var(--el-fill-color-blank);
  color: var(--el-text-color-primary);
  border-color: var(--el-border-color);
}

.dark-theme .el-textarea__inner::placeholder {
  color: var(--el-text-color-placeholder);
}

.dark-theme .el-form-item__label {
  color: var(--el-text-color-primary);
}

.dark-theme .el-select-dropdown {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}

.dark-theme .el-select-dropdown__item {
  color: var(--el-text-color-primary);
}

.dark-theme .el-select-dropdown__item.hover,
.dark-theme .el-select-dropdown__item:hover {
  background-color: var(--el-fill-color);
}

.dark-theme .el-select-dropdown__item.selected {
  color: var(--el-color-primary);
  background-color: var(--el-color-primary-light-9);
}

.dark-theme .el-popper {
  background: var(--el-bg-color-overlay);
  border: 1px solid var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}

.dark-theme .el-popper__arrow::before {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
}

.dark-theme .el-switch__core {
  background-color: var(--el-border-color-dark);
}

.dark-theme .el-avatar {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-divider__text {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-secondary);
}

.dark-theme .el-divider {
  border-color: var(--el-border-color);
}

.dark-theme ::-webkit-scrollbar-thumb {
  background: var(--el-border-color-dark);
  border-radius: 4px;
}

.dark-theme ::-webkit-scrollbar-thumb:hover {
  background: var(--el-text-color-tertiary);
}

.dark-theme .el-message-box {
  background: var(--el-bg-color);
  border-color: var(--el-border-color);
}

.dark-theme .el-message {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-notification {
  background-color: var(--el-bg-color);
  border-color: var(--el-border-color);
}

.dark-theme .el-notification__title,
.dark-theme .el-notification__content {
  color: var(--el-text-color-primary);
}

.dark-theme .el-pagination button,
.dark-theme .el-pager li {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-regular);
}

.dark-theme .el-pager li:not(.disabled).active {
  background-color: var(--el-color-primary);
  color: white;
}

.dark-theme .el-drawer {
  background-color: var(--el-bg-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-dropdown-menu {
  background-color: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  box-shadow: var(--el-box-shadow-light);
}

.dark-theme .el-dropdown-menu__item {
  color: var(--el-text-color-primary);
}

.dark-theme .el-dropdown-menu__item:focus,
.dark-theme .el-dropdown-menu__item:not(.is-disabled):hover {
  background-color: var(--el-fill-color);
  color: var(--el-color-primary);
}

.dark-theme .el-date-editor {
  background-color: var(--el-fill-color-blank);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-picker-panel {
  background: var(--el-bg-color-overlay);
  border-color: var(--el-border-color);
  color: var(--el-text-color-primary);
}

.dark-theme .el-calendar-day:hover {
  background-color: var(--el-fill-color);
}

.dark-theme .el-calendar__button-group .el-button-group > .el-button {
  background-color: var(--el-fill-color);
}

.dark-theme .el-tag {
  border-color: transparent;
}

.dark-theme .el-button.is-plain {
  background-color: var(--el-fill-color);
  border-color: transparent;
}

.dark-theme .el-radio-button__inner,
.dark-theme .el-checkbox-button__inner {
  background-color: var(--el-fill-color);
  border-color: var(--el-border-color);
  color: var(--el-text-color-regular);
}

.dark-theme .el-radio-button__original-radio:checked + .el-radio-button__inner,
.dark-theme .el-checkbox-button__original-checkbox:checked + .el-checkbox-button__inner {
  background-color: var(--el-color-primary);
  border-color: var(--el-color-primary);
  color: white;
}

.dark-theme .qr-code-container {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color);
}

.dark-theme .recovery-codes-container {
  background: var(--el-fill-color-light);
}

.dark-theme .recovery-code {
  background: var(--el-bg-color);
}

.dark-theme .manual-code-text {
  background: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 深色模式按钮在非主色按钮上的微调 */
.dark-theme .el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(.el-button--info) {
  background-color: var(--el-fill-color);
  color: var(--el-text-color-regular);
  border-color: transparent;
}

.dark-theme .el-button:not(.el-button--primary):not(.el-button--success):not(.el-button--warning):not(.el-button--danger):not(.el-button--info):hover {
  background-color: var(--el-color-primary-light-9);
  color: var(--el-color-primary);
}

/* 深色模式下的加载动画 */
.dark-theme .el-loading-spinner .path {
  stroke: var(--el-color-primary);
}

.dark-theme .el-loading-spinner .el-loading-text {
  color: var(--el-text-color-secondary);
}

.dark-theme .el-loading-mask {
  background-color: rgba(15, 23, 42, 0.8);
}
</style>
