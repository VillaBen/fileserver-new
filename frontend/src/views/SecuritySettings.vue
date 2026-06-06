<template>
  <div class="settings-page">
    <div class="page-header">
      <div>
        <h1 class="page-title">{{ i18n.t('securitySettings') || '安全设置' }}</h1>
        <p class="page-subtitle">{{ i18n.t('securitySettingsDesc') || '配置恶意文件检测和API密钥' }}</p>
      </div>
    </div>

    <div class="settings-container">
      <!-- SMTP 邮件配置 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-info) 0%, var(--el-color-info-light-3) 100%);">
            <el-icon :size="24"><Message /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('smtpConfig') || 'SMTP 邮件配置' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('smtpConfigDesc') || '配置邮件服务器以发送验证码和通知' }}</p>
          </div>
        </div>

        <div class="settings-card-body">
          <el-form :model="smtpForm" label-position="top">
            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpHost') || 'SMTP 主机'">
                  <el-input
                    v-model="smtpForm.host"
                    :placeholder="i18n.t('smtpHostPlaceholder') || '例如: smtp.example.com'"
                    size="large"
                    :disabled="loading"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpPort') || 'SMTP 端口'">
                  <el-input
                    v-model="smtpForm.port"
                    :placeholder="i18n.t('smtpPortPlaceholder') || '例如: 587 或 465'"
                    size="large"
                    :disabled="loading"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpUser') || '邮箱账号'">
                  <el-input
                    v-model="smtpForm.user"
                    :placeholder="i18n.t('smtpUserPlaceholder') || '例如: noreply@example.com'"
                    size="large"
                    :disabled="loading"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpPass') || '授权码/密码'">
                  <el-input
                    v-model="smtpForm.pass"
                    type="password"
                    show-password
                    :placeholder="i18n.t('smtpPassPlaceholder') || '邮箱授权码或登录密码'"
                    size="large"
                    :disabled="loading"
                  />
                </el-form-item>
              </el-col>
            </el-row>

            <el-row :gutter="20">
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpFrom') || '发件人名称'">
                  <el-input
                    v-model="smtpForm.from"
                    :placeholder="i18n.t('smtpFromPlaceholder') || '例如: FileCloud'"
                    size="large"
                    :disabled="loading"
                  />
                </el-form-item>
              </el-col>
              <el-col :span="12">
                <el-form-item :label="i18n.t('smtpSecure') || '使用 SSL/TLS'">
                  <el-select v-model="smtpForm.secure" size="large" :disabled="loading">
                    <el-option label="否 (STARTTLS)" value="false" />
                    <el-option label="是 (SSL/TLS)" value="true" />
                  </el-select>
                </el-form-item>
              </el-col>
            </el-row>

            <div class="form-tip">
              <el-icon><InfoFilled /></el-icon>
              <span>{{ i18n.t('smtpTip') || '邮箱账号和授权码将使用 AES-256 加密存储' }}</span>
            </div>

            <div class="form-actions">
              <el-button type="primary" @click="saveSmtp" :loading="savingSmtp">
                {{ i18n.t('save') || '保存' }}
              </el-button>
              <el-button @click="testSmtp" :loading="testingSmtp" :disabled="!smtpForm.host || !smtpForm.user || !smtpForm.pass">
                {{ i18n.t('testConnection') || '测试连接' }}
              </el-button>
              <el-button @click="showSendTestEmail = true" :disabled="!smtpForm.host || !smtpForm.user || !smtpForm.pass">
                {{ i18n.t('sendTestEmail') || '发送测试邮件' }}
              </el-button>
            </div>

            <el-alert
              v-if="smtpTestResult"
              :title="smtpTestResult.message"
              :type="smtpTestResult.type"
              :closable="false"
              class="mt-4"
            />
          </el-form>
        </div>
      </div>

      <!-- VirusTotal API 配置 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-primary) 0%, var(--el-color-primary-light-3) 100%);">
            <el-icon :size="24"><Key /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('virusTotalApiKey') || 'VirusTotal API Key' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('virusTotalApiKeyDesc') || '配置 VirusTotal API Key 以增强恶意文件检测能力' }}</p>
          </div>
        </div>

        <div class="settings-card-body">
          <el-form :model="apiKeyForm" label-position="top">
            <el-form-item :label="i18n.t('apiKey') || 'API Key'">
              <el-input
                v-model="apiKeyForm.apiKey"
                type="password"
                show-password
                :placeholder="i18n.t('enterApiKey') || '请输入 VirusTotal API Key'"
                size="large"
                :disabled="loading"
              />
              <div class="form-tip">
                <el-icon><InfoFilled /></el-icon>
                <span>{{ i18n.t('apiKeyTip') || 'API Key 将使用 AES-256 加密存储' }}</span>
              </div>
            </el-form-item>

            <div class="form-actions">
              <el-button type="primary" @click="saveApiKey" :loading="saving" :disabled="!apiKeyForm.apiKey">
                {{ i18n.t('save') || '保存' }}
              </el-button>
              <el-button @click="testApiKey" :loading="testing" :disabled="!apiKeyForm.apiKey">
                {{ i18n.t('testConnection') || '测试连接' }}
              </el-button>
            </div>

            <el-alert
              v-if="testResult"
              :title="testResult.message"
              :type="testResult.type"
              :closable="false"
              class="mt-4"
            />
          </el-form>
        </div>
      </div>

      <!-- 检测模式配置 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-success) 0%, var(--el-color-success-light-3) 100%);">
            <el-icon :size="24"><Lock /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('scanMode') || '扫描模式' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('scanModeDesc') || '选择恶意文件检测模式' }}</p>
          </div>
        </div>

        <div class="settings-card-body">
          <el-form :model="scanModeForm" label-position="top">
            <el-form-item :label="i18n.t('currentMode') || '当前模式'">
              <el-select v-model="scanModeForm.mode" size="large" :disabled="loading">
                <el-option label="多引擎扫描 (Multi-scan)" value="multi-scan" />
                <el-option label="混合模式 (Hybrid)" value="hybrid" />
                <el-option label="仅文件头检测" value="file-header" />
                <el-option label="ClamAV 扫描" value="clamav" />
                <el-option label="VirusTotal 云端扫描" value="virustotal" />
                <el-option label="禁用" value="disabled" />
              </el-select>
            </el-form-item>

            <div class="scan-mode-info">
              <div class="mode-item">
                <h4>{{ i18n.t('hybridMode') || '混合模式' }}</h4>
                <p>{{ i18n.t('hybridModeDesc') || '同时使用文件头检测和 ClamAV/VirusTotal 进行检测，提供最全面的保护' }}</p>
              </div>
              <div class="mode-item">
                <h4>{{ i18n.t('fileHeaderMode') || '文件头检测' }}</h4>
                <p>{{ i18n.t('fileHeaderModeDesc') || '通过检测文件的魔数（文件头签名）来识别恶意文件，无需网络请求' }}</p>
              </div>
              <div class="mode-item">
                <h4>{{ i18n.t('clamavMode') || 'ClamAV 扫描' }}</h4>
                <p>{{ i18n.t('clamavModeDesc') || '使用本地 ClamAV 引擎进行病毒扫描（需要服务器安装 ClamAV）' }}</p>
              </div>
            </div>

            <el-button type="primary" @click="saveScanMode" :loading="savingScanMode" :disabled="loading">
              {{ i18n.t('save') || '保存' }}
            </el-button>
          </el-form>
        </div>
      </div>

      <!-- 安全状态说明 -->
      <div class="settings-card">
        <div class="settings-card-header">
          <div class="settings-icon" style="background: linear-gradient(135deg, var(--el-color-warning) 0%, var(--el-color-warning-light-3) 100%);">
            <el-icon :size="24"><InfoFilled /></el-icon>
          </div>
          <div>
            <h2 class="settings-card-title">{{ i18n.t('securityStatusInfo') || '安全状态说明' }}</h2>
            <p class="settings-card-desc">{{ i18n.t('securityStatusInfoDesc') || '了解文件安全状态图标含义' }}</p>
          </div>
        </div>

        <div class="settings-card-body">
          <div class="status-list">
            <div class="status-item">
              <el-icon :size="20" class="status-safe"><CircleCheck /></el-icon>
              <div>
                <h4>{{ i18n.t('statusSafe') || '安全' }}</h4>
                <p>{{ i18n.t('statusSafeDesc') || '文件通过所有安全检测，可以安全使用' }}</p>
              </div>
            </div>
            <div class="status-item">
              <el-icon :size="20" class="status-warning"><Warning /></el-icon>
              <div>
                <h4>{{ i18n.t('statusWarning') || '警告' }}</h4>
                <p>{{ i18n.t('statusWarningDesc') || '文件存在可疑特征，建议谨慎使用' }}</p>
              </div>
            </div>
            <div class="status-item">
              <el-icon :size="20" class="status-danger"><CircleClose /></el-icon>
              <div>
                <h4>{{ i18n.t('statusDanger') || '危险' }}</h4>
                <p>{{ i18n.t('statusDangerDesc') || '文件被识别为恶意文件，上传已被阻止' }}</p>
              </div>
            </div>
            <div class="status-item">
              <el-icon :size="20" class="status-unknown"><QuestionFilled /></el-icon>
              <div>
                <h4>{{ i18n.t('statusUnknown') || '未知' }}</h4>
                <p>{{ i18n.t('statusUnknownDesc') || '文件尚未进行安全检测' }}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 发送测试邮件对话框 -->
    <el-dialog
      v-model="showSendTestEmail"
      :title="i18n.t('sendTestEmail') || '发送测试邮件'"
      width="500px"
    >
      <el-form :model="testEmailForm" label-position="top">
        <el-form-item :label="i18n.t('recipientEmail') || '收件人邮箱'">
          <el-input
            v-model="testEmailForm.to"
            :placeholder="i18n.t('recipientEmailPlaceholder') || '请输入收件人邮箱'"
            size="large"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showSendTestEmail = false">{{ i18n.t('cancel') || '取消' }}</el-button>
        <el-button type="primary" @click="sendTestEmail" :loading="sendingTestEmail">{{ i18n.t('send') || '发送' }}</el-button>
      </template>
    </el-dialog>

    <!-- 高危操作确认对话框 -->
    <HighRiskConfirmDialog
      v-model="showHighRiskDialog"
      :steps="disableScanSteps"
      @confirm="handleDisableConfirm"
      @cancel="handleDisableCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { ElMessage } from 'element-plus';
import { Key, Lock, InfoFilled, CircleCheck, Warning, CircleClose, QuestionFilled, Message } from '@element-plus/icons-vue';
import { useI18nStore } from '@/stores/i18n';
import settingsApi from '@/api/client';
import HighRiskConfirmDialog from '@/components/HighRiskConfirmDialog.vue';

const i18n = useI18nStore();

const apiKeyForm = ref({
  apiKey: ''
});

const scanModeForm = ref({
  mode: 'hybrid'
});

const smtpForm = ref({
  host: '',
  port: '587',
  user: '',
  pass: '',
  from: '',
  secure: 'false'
});

const testEmailForm = ref({
  to: ''
});

const loading = ref(false);
const saving = ref(false);
const testing = ref(false);
const savingScanMode = ref(false);
const savingSmtp = ref(false);
const testingSmtp = ref(false);
const sendingTestEmail = ref(false);
const testResult = ref(null);
const smtpTestResult = ref(null);
const showSendTestEmail = ref(false);

// 高危操作确认相关
const showHighRiskDialog = ref(false);
const pendingScanMode = ref('');
const originalScanMode = ref('');
const disableScanSteps = [
  {
    title: '确认禁用',
    message: '您确定要禁用恶意文件检测吗？',
    confirmText: '继续'
  },
  {
    title: '风险警告',
    message: '禁用后，系统将不会对上传的文件进行任何安全检测，可能导致恶意文件进入系统！',
    confirmText: '我理解风险'
  },
  {
    title: '最终确认',
    message: '您确定要关闭恶意文件检测吗？此操作将降低系统安全性！',
    confirmText: '确认关闭'
  }
];

onMounted(async () => {
  await loadSettings();
});

async function loadSettings() {
  try {
    loading.value = true;
    const response = await settingsApi.getSettings();

    if (response.success && response.data) {
      if (response.data.virustotal_api_key) {
        apiKeyForm.value.apiKey = response.data.virustotal_api_key;
      }
      if (response.data.smtp_host) {
        smtpForm.value.host = response.data.smtp_host;
      }
      if (response.data.smtp_port) {
        smtpForm.value.port = response.data.smtp_port;
      }
      if (response.data.smtp_user) {
        smtpForm.value.user = response.data.smtp_user;
      }
      if (response.data.smtp_pass) {
        smtpForm.value.pass = response.data.smtp_pass;
      }
      if (response.data.smtp_from) {
        smtpForm.value.from = response.data.smtp_from;
      }
      if (response.data.smtp_secure !== undefined) {
        smtpForm.value.secure = response.data.smtp_secure;
      }
      if (response.data.malware_scan_mode) {
        scanModeForm.value.mode = response.data.malware_scan_mode;
      }
    }
  } catch (error) {
    console.error('加载设置失败:', error);
  } finally {
    loading.value = false;
  }
}

async function saveApiKey() {
  try {
    saving.value = true;
    await settingsApi.updateVirusTotalApiKey(apiKeyForm.value.apiKey);
    ElMessage.success(i18n.t('saveSuccess') || '保存成功');
    testResult.value = null;
  } catch (error) {
    console.error('保存 API Key 失败:', error);
    ElMessage.error(i18n.t('saveFailed') || '保存失败');
  } finally {
    saving.value = false;
  }
}

async function testApiKey() {
  try {
    testing.value = true;
    testResult.value = null;

    await settingsApi.testVirusTotalApiKey(apiKeyForm.value.apiKey);

    testResult.value = {
      type: 'success',
      message: i18n.t('connectionSuccess') || 'API Key 验证成功，连接正常'
    };
  } catch (error) {
    console.error('测试 VirusTotal API Key 失败:', error);
    testResult.value = {
      type: 'error',
      message: error.error || i18n.t('connectionFailed') || 'API Key 验证失败，请检查是否正确'
    };
  } finally {
    testing.value = false;
  }
}

async function saveScanMode() {
  const newMode = scanModeForm.value.mode;

  // 如果是要禁用，需要确认
  if (newMode === 'disabled') {
    originalScanMode.value = (await loadCurrentScanMode()) || 'hybrid';
    pendingScanMode.value = 'disabled';
    showHighRiskDialog.value = true;
    return;
  }

  // 其他模式直接保存
  await performSaveScanMode(newMode);
}

async function loadCurrentScanMode() {
  try {
    const response = await settingsApi.getSettings();
    return response?.data?.malware_scan_mode || 'hybrid';
  } catch (error) {
    return 'hybrid';
  }
}

async function performSaveScanMode(mode) {
  try {
    savingScanMode.value = true;
    await settingsApi.updateSettings({ malware_scan_mode: mode });
    scanModeForm.value.mode = mode;
    ElMessage.success(i18n.t('saveSuccess') || '保存成功');
  } catch (error) {
    console.error('保存扫描模式失败:', error);
    ElMessage.error(i18n.t('saveFailed') || '保存失败');
    if (originalScanMode.value) {
      scanModeForm.value.mode = originalScanMode.value;
    }
  } finally {
    savingScanMode.value = false;
  }
}

async function handleDisableConfirm() {
  await performSaveScanMode('disabled');
  showHighRiskDialog.value = false;
}

function handleDisableCancel() {
  // 恢复为原来的模式
  scanModeForm.value.mode = originalScanMode.value;
  showHighRiskDialog.value = false;
}

async function saveSmtp() {
  try {
    savingSmtp.value = true;
    await settingsApi.updateSettings({
      smtp_host: smtpForm.value.host,
      smtp_port: smtpForm.value.port,
      smtp_user: smtpForm.value.user,
      smtp_pass: smtpForm.value.pass,
      smtp_from: smtpForm.value.from,
      smtp_secure: smtpForm.value.secure
    });
    ElMessage.success(i18n.t('saveSuccess') || '保存成功');
    smtpTestResult.value = null;
  } catch (error) {
    console.error('保存 SMTP 配置失败:', error);
    ElMessage.error(i18n.t('saveFailed') || '保存失败');
  } finally {
    savingSmtp.value = false;
  }
}

async function testSmtp() {
  try {
    testingSmtp.value = true;
    smtpTestResult.value = null;

    await settingsApi.testSmtp({
      host: smtpForm.value.host,
      port: parseInt(smtpForm.value.port) || 587,
      secure: smtpForm.value.secure === 'true',
      user: smtpForm.value.user,
      pass: smtpForm.value.pass
    });

    smtpTestResult.value = {
      type: 'success',
      message: i18n.t('connectionSuccess') || 'SMTP 连接验证成功'
    };
  } catch (error) {
    console.error('测试 SMTP 失败:', error);
    smtpTestResult.value = {
      type: 'error',
      message: error.error || i18n.t('connectionFailed') || '连接失败，请检查配置'
    };
  } finally {
    testingSmtp.value = false;
  }
}

async function sendTestEmail() {
  if (!testEmailForm.value.to) {
    ElMessage.warning(i18n.t('pleaseEnterEmail') || '请输入收件人邮箱');
    return;
  }

  try {
    sendingTestEmail.value = true;
    await settingsApi.sendTestEmail(testEmailForm.value.to);
    ElMessage.success(i18n.t('testEmailSent') || '测试邮件已发送，请查收');
    showSendTestEmail.value = false;
    testEmailForm.value.to = '';
  } catch (error) {
    console.error('发送测试邮件失败:', error);
    ElMessage.error(error.error || i18n.t('sendFailed') || '发送失败');
  } finally {
    sendingTestEmail.value = false;
  }
}
</script>

<style scoped>
.settings-page {
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 32px;
}

.page-title {
  font-size: 28px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 8px 0;
}

.page-subtitle {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.settings-card {
  background: var(--el-bg-color);
  border-radius: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
  overflow: hidden;
}

.settings-card-header {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 24px;
  border-bottom: 1px solid var(--el-border-color-lighter);
}

.settings-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.settings-card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.settings-card-desc {
  font-size: 14px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.settings-card-body {
  padding: 24px;
}

.form-tip {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 8px;
  font-size: 12px;
  color: var(--el-text-color-secondary);
}

.form-actions {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.mt-4 {
  margin-top: 16px;
}

.scan-mode-info {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 24px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.mode-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.mode-item p {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.status-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 12px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
}

.status-item h4 {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin: 0 0 4px 0;
}

.status-item p {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  margin: 0;
}

.status-safe {
  color: var(--el-color-success);
}

.status-warning {
  color: var(--el-color-warning);
}

.status-danger {
  color: var(--el-color-danger);
}

.status-unknown {
  color: var(--el-color-info);
}

@media (max-width: 768px) {
  .settings-page {
    padding: 16px;
  }

  .settings-card-header {
    padding: 16px;
  }

  .settings-card-body {
    padding: 16px;
  }

  .form-actions {
    flex-direction: column;
  }

  .form-actions .el-button {
    width: 100%;
  }
}
</style>
