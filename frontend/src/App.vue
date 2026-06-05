<template>
  <router-view />
</template>

<script setup>
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

/* Dark Theme */
.dark-theme {
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
  
  --gray-50: #020617;
  --gray-100: #0f172a;
  --gray-200: #1e293b;
  --gray-300: #334155;
  --gray-400: #475569;
  --gray-500: #64748b;
  --gray-600: #94a3b8;
  --gray-700: #cbd5e1;
  --gray-800: #e2e8f0;
  --gray-900: #f8fafc;
  
  /* Surface Colors */
  --bg-page: #0f172a;
  --bg-surface: #1e293b;
  --bg-surface-hover: #334155;
  
  /* Typography */
  --text-primary: #f8fafc;
  --text-secondary: #cbd5e1;
  --text-tertiary: #94a3b8;
}

.dark-theme body {
  background-color: var(--bg-page);
  color: var(--text-primary);
}

.dark-theme .el-button--primary {
  box-shadow: 0 4px 14px 0 rgb(37 99 235 / 20%);
}

.dark-theme .el-input__wrapper {
  box-shadow: 0 0 0 1px var(--gray-600) inset;
  background: var(--bg-surface);
}

.dark-theme .el-input__wrapper:hover {
  box-shadow: 0 0 0 1px var(--gray-500) inset;
}

.dark-theme .el-input__wrapper.is-focus {
  box-shadow: 0 0 0 2px var(--primary-400) inset;
}

.dark-theme .el-card {
  background: var(--bg-surface);
}

.dark-theme .el-dialog {
  background: var(--bg-surface);
}

.dark-theme .el-dialog__header {
  background: linear-gradient(135deg, var(--gray-100) 0%, var(--gray-200) 100%);
  border-bottom: 1px solid var(--gray-300);
}

.dark-theme .el-menu-item:hover {
  background: var(--gray-200);
}

.dark-theme .el-menu-item.is-active {
  background: linear-gradient(135deg, var(--primary-900) 0%, var(--primary-800) 100%);
  color: var(--primary-200);
}

.dark-theme .el-table {
  background: var(--bg-surface);
}

.dark-theme .el-form-item__label {
  color: var(--text-primary);
}

.dark-theme ::-webkit-scrollbar-thumb {
  background: var(--gray-600);
}

.dark-theme ::-webkit-scrollbar-thumb:hover {
  background: var(--gray-500);
}

.dark-theme .el-avatar {
  background: var(--gray-300);
  color: var(--text-primary);
}

.dark-theme .qr-code-container {
  background: var(--bg-surface);
  border: 1px solid var(--gray-400);
}

.dark-theme .recovery-codes-container {
  background: var(--gray-100);
}

.dark-theme .recovery-code {
  background: var(--bg-surface);
}

.dark-theme .manual-code-text {
  background: var(--primary-900);
  color: var(--primary-300);
}
</style>
