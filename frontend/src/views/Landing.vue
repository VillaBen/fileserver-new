<template>
  <div class="landing-page">
    <div class="landing-header">
      <div class="landing-logo">📁</div>
      <h1 class="landing-title">FileCloud</h1>
      <p class="landing-subtitle">安全、快速的文件管理系统</p>
      <div class="version-badge">
        <span>版本</span>
        <span class="version-number">v1.0</span>
      </div>
    </div>

    <div class="landing-content">
      <div class="features-grid">
        <div class="feature-card">
          <div class="feature-icon">🔒</div>
          <div class="feature-title">安全可靠</div>
          <div class="feature-desc">端到端加密，保护您的文件安全</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">⚡</div>
          <div class="feature-title">极速体验</div>
          <div class="feature-desc">优化的传输速度，流畅的操作体验</div>
        </div>
        <div class="feature-card">
          <div class="feature-icon">📱</div>
          <div class="feature-title">多端同步</div>
          <div class="feature-desc">支持各种设备，随时随地访问</div>
        </div>
      </div>

      <div class="status-section">
        <div class="status-info">
          <div class="status-dot"></div>
          <span class="status-text">服务正常运行中</span>
        </div>
        <span class="status-version">Vue 3 + Vite</span>
      </div>

      <div class="action-buttons">
        <router-link to="/login" class="btn btn-primary">
          <span class="btn-icon">🚀</span>
          开始使用
        </router-link>
        <router-link to="/register" class="btn btn-secondary">
          <span class="btn-icon">📝</span>
          创建账户
        </router-link>
      </div>
    </div>

    <div class="landing-footer">
      <p class="footer-text">Powered by Vue 3 + Express + SQLite</p>
      <div class="footer-links">
        <a href="http://localhost:3000/api/health" class="footer-link" target="_blank">API 状态</a>
        <a href="http://localhost:3000/api" class="footer-link" target="_blank">API 文档</a>
      </div>
    </div>
  </div>
</template>

<script setup>
</script>

<style scoped>
:root {
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
  line-height: 1.6;
  font-weight: 400;
  color: #0f172a;
  background-color: #f8fafc;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

html, body {
  height: 100%;
  width: 100%;
}

body {
  min-height: 100vh;
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.landing-page {
  background: white;
  border-radius: 24px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
  max-width: 600px;
  width: 100%;
  overflow: hidden;
  animation: fadeIn 0.6s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(30px); }
  to { opacity: 1; transform: translateY(0); }
}

.landing-header {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  padding: 56px 48px;
  text-align: center;
  color: white;
}

.landing-logo {
  font-size: 72px;
  margin-bottom: 20px;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-12px); }
}

.landing-title {
  font-size: 32px;
  font-weight: 700;
  margin-bottom: 12px;
  letter-spacing: -0.5px;
}

.landing-subtitle {
  font-size: 16px;
  opacity: 0.95;
  line-height: 1.6;
}

.landing-content {
  padding: 48px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.feature-card {
  background: linear-gradient(135deg, #f8faff 0%, #f0f4ff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 24px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
  border-color: #667eea;
}

.feature-icon {
  font-size: 32px;
  margin-bottom: 12px;
}

.feature-title {
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
  margin-bottom: 8px;
}

.feature-desc {
  font-size: 13px;
  color: #64748b;
  line-height: 1.5;
}

.status-section {
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-dot {
  width: 12px;
  height: 12px;
  background: #22c55e;
  border-radius: 50%;
  animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(0.9); }
}

.status-text {
  font-size: 14px;
  color: #166534;
  font-weight: 500;
}

.status-version {
  font-size: 13px;
  color: #22c55e;
  font-weight: 600;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.btn {
  padding: 14px 28px;
  border-radius: 12px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;
}

.btn-primary {
  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 50%, #22c55e 100%);
  color: white;
  box-shadow: 0 4px 16px rgba(37, 99, 235, 0.3);
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 24px rgba(37, 99, 235, 0.4);
}

.btn-secondary {
  background: #f1f5f9;
  color: #475569;
  border: 1px solid #e2e8f0;
}

.btn-secondary:hover {
  background: #e2e8f0;
  color: #1e293b;
}

.btn-icon {
  font-size: 18px;
}

.landing-footer {
  padding: 24px 48px;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
  text-align: center;
}

.footer-text {
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 8px;
}

.footer-links {
  display: flex;
  justify-content: center;
  gap: 16px;
}

.footer-link {
  font-size: 13px;
  color: #3b82f6;
  text-decoration: none;
  transition: color 0.2s;
}

.footer-link:hover {
  color: #2563eb;
  text-decoration: underline;
}

.version-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: white;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  color: #1e40af;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin-top: 12px;
}

.version-number {
  color: #22c55e;
}

@media (max-width: 1024px) {
  .features-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
  
  .feature-card {
    padding: 18px;
  }
}

@media (max-width: 768px) {
  .landing-page {
    padding: 16px;
  }
  
  .landing-header {
    padding: 48px 32px;
  }
  
  .landing-title {
    font-size: 28px;
  }
  
  .landing-subtitle {
    font-size: 15px;
  }
  
  .landing-content {
    padding: 40px 32px;
  }
  
  .landing-footer {
    padding: 24px 32px;
  }
}

@media (max-width: 640px) {
  .landing-page {
    padding: 12px;
  }
  
  .landing-header {
    padding: 40px 24px;
  }

  .landing-title {
    font-size: 26px;
  }
  
  .landing-logo {
    font-size: 60px;
    margin-bottom: 16px;
  }

  .landing-content {
    padding: 32px 24px;
  }

  .landing-footer {
    padding: 20px 24px;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }

  .status-section {
    flex-direction: column;
    gap: 12px;
    text-align: center;
  }

  .action-buttons {
    gap: 10px;
  }

  .btn {
    padding: 12px 20px;
    font-size: 14px;
  }
  
  .feature-card {
    padding: 16px;
  }
  
  .feature-icon {
    font-size: 28px;
  }
  
  .feature-title {
    font-size: 15px;
  }
  
  .feature-desc {
    font-size: 12px;
  }
}
</style>
