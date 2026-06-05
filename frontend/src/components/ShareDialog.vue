<template>
  <el-dialog
    v-model="visible"
    :title="i18n.t('shareFile') || 'Share File'"
    width="500px"
    @close="handleClose"
  >
    <div class="share-dialog-content">
      <!-- File Info -->
      <div class="file-info" v-if="file">
        <el-icon size="32" class="file-icon">
          <Folder v-if="file.type === 'folder'" />
          <Document v-else />
        </el-icon>
        <div class="file-details">
          <div class="file-name">{{ file.name }}</div>
          <div class="file-size" v-if="file.size">{{ formatFileSize(file.size) }}</div>
        </div>
      </div>

      <el-divider />

      <!-- Share Settings -->
      <el-form :model="shareForm" label-position="top">
        <el-form-item :label="i18n.t('expirationDate') || 'Expiration Date'">
          <el-select v-model="shareForm.expiresIn" @change="handleExpirationChange">
            <el-option :label="i18n.t('neverExpires') || 'Never'" :value="0" />
            <el-option :label="i18n.t('oneDay') || '1 Day'" :value="1" />
            <el-option :label="i18n.t('sevenDays') || '7 Days'" :value="7" />
            <el-option :label="i18n.t('thirtyDays') || '30 Days'" :value="30" />
            <el-option :label="i18n.t('customDate') || 'Custom'" value="custom" />
          </el-select>
          <el-date-picker
            v-if="shareForm.expiresIn === 'custom'"
            v-model="shareForm.customDate"
            type="datetime"
            :placeholder="i18n.t('selectDate') || 'Select date'"
            class="custom-date-picker"
          />
        </el-form-item>

        <el-form-item :label="i18n.t('maxDownloads') || 'Max Downloads'">
          <el-input-number 
            v-model="shareForm.maxDownloads" 
            :min="0" 
            :max="1000"
            :placeholder="i18n.t('unlimited') || 'Unlimited'"
          />
          <div class="form-hint">{{ i18n.t('maxDownloadsHint') || '0 means unlimited' }}</div>
        </el-form-item>

        <el-form-item :label="i18n.t('passwordProtection') || 'Password Protection'">
          <el-switch v-model="shareForm.hasPassword" />
        </el-form-item>

        <el-form-item v-if="shareForm.hasPassword" :label="i18n.t('password') || 'Password'">
          <el-input
            v-model="shareForm.password"
            type="password"
            show-password
            :placeholder="i18n.t('enterPassword') || 'Enter password'"
          />
        </el-form-item>

        <el-form-item :label="i18n.t('permissions') || 'Permissions'">
          <el-checkbox v-model="shareForm.allowDownload">
            {{ i18n.t('allowDownload') || 'Allow Download' }}
          </el-checkbox>
          <el-checkbox v-model="shareForm.allowPreview">
            {{ i18n.t('allowPreview') || 'Allow Preview' }}
          </el-checkbox>
        </el-form-item>
      </el-form>

      <!-- Generated Link -->
      <div class="share-link-section" v-if="shareLink">
        <div class="share-link-label">{{ i18n.t('shareLink') || 'Share Link' }}</div>
        <div class="share-link-input">
          <el-input :value="shareLink" readonly>
            <template #append>
              <el-button @click="copyLink">
                <el-icon><CopyDocument /></el-icon>
              </el-button>
            </template>
          </el-input>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">
          {{ i18n.t('cancel') || 'Cancel' }}
        </el-button>
        <el-button v-if="!shareLink" type="primary" @click="generateLink" :loading="generating">
          {{ i18n.t('createShareLink') || 'Create Share Link' }}
        </el-button>
        <el-button v-else type="primary" @click="updateShare">
          {{ i18n.t('update') || 'Update' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
import { Folder, Document, CopyDocument } from '@element-plus/icons-vue';
import { useI18nStore } from '../stores/i18n';
import { toast } from '../utils/toast';
import { formatFileSize } from '../utils/format';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  file: {
    type: Object,
    default: null
  }
});

const emit = defineEmits(['update:modelValue', 'share-created', 'share-updated']);

const i18n = useI18nStore();

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
});

const shareForm = ref({
  expiresIn: 7,
  customDate: null,
  maxDownloads: 0,
  hasPassword: false,
  password: '',
  allowDownload: true,
  allowPreview: true
});

const shareLink = ref('');
const generating = ref(false);

const handleExpirationChange = (value) => {
  if (value !== 'custom') {
    shareForm.value.customDate = null;
  }
};

const generateLink = async () => {
  generating.value = true;
  
  try {
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const fileId = props.file?.id || 'demo';
    const token = Math.random().toString(36).substring(2, 15);
    shareLink.value = `https://filecloud.com/share/${fileId}/${token}`;
    
    toast.success(i18n.t('shareLinkCreated') || 'Share link created');
    emit('share-created', { link: shareLink.value, ...shareForm.value });
  } catch (error) {
    toast.error(i18n.t('failedToCreateShareLink') || 'Failed to create share link');
  } finally {
    generating.value = false;
  }
};

const updateShare = async () => {
  try {
    await new Promise(resolve => setTimeout(resolve, 500));
    toast.success(i18n.t('shareUpdated') || 'Share settings updated');
    emit('share-updated', { link: shareLink.value, ...shareForm.value });
    handleClose();
  } catch (error) {
    toast.error(i18n.t('failedToUpdateShare') || 'Failed to update share');
  }
};

const copyLink = () => {
  if (shareLink.value) {
    navigator.clipboard.writeText(shareLink.value);
    toast.success(i18n.t('linkCopied') || 'Link copied to clipboard');
  }
};

const handleClose = () => {
  visible.value = false;
};

watch(() => props.file, () => {
  if (props.file) {
    shareLink.value = '';
  }
});
</script>

<style scoped>
.share-dialog-content {
  padding: 10px 0;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--el-fill-color-light);
  border-radius: 8px;
  margin-bottom: 16px;
}

.file-icon {
  color: var(--el-color-primary);
}

.file-details {
  flex: 1;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 4px;
}

.file-size {
  font-size: 13px;
  color: var(--el-text-color-secondary);
}

.form-hint {
  font-size: 12px;
  color: var(--el-text-color-secondary);
  margin-top: 4px;
}

.custom-date-picker {
  margin-top: 8px;
  width: 100%;
}

.share-link-section {
  margin-top: 24px;
  padding-top: 16px;
  border-top: 1px solid var(--el-border-color);
}

.share-link-label {
  font-size: 14px;
  font-weight: 600;
  color: var(--el-text-color-primary);
  margin-bottom: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
