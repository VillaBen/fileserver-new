<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :width="width"
    :close-on-click-modal="false"
    :center="center"
    @close="handleClose"
  >
    <div class="confirm-dialog-content">
      <div class="confirm-dialog-icon" v-if="icon">
        <el-icon :size="48" :class="iconClass">
          <component :is="iconComponent" />
        </el-icon>
      </div>
      <div class="confirm-dialog-message">
        <p>{{ message }}</p>
        <p v-if="description" class="confirm-dialog-description">{{ description }}</p>
      </div>
    </div>

    <template #footer>
      <div class="confirm-dialog-footer">
        <el-button @click="handleCancel" :loading="cancelLoading">
          {{ cancelText }}
        </el-button>
        <el-button
          :type="confirmType"
          @click="handleConfirm"
          :loading="confirmLoading"
        >
          {{ confirmText }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { computed } from 'vue';
import { Warning, CircleCheck, CircleClose, QuestionFilled, InfoFilled } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  title: {
    type: String,
    default: 'Confirm'
  },
  message: {
    type: String,
    required: true
  },
  description: {
    type: String,
    default: ''
  },
  type: {
    type: String,
    default: 'warning',
    validator: (value) => ['warning', 'info', 'success', 'danger', 'question'].includes(value)
  },
  confirmText: {
    type: String,
    default: 'Confirm'
  },
  cancelText: {
    type: String,
    default: 'Cancel'
  },
  confirmType: {
    type: String,
    default: 'primary'
  },
  width: {
    type: String,
    default: '420px'
  },
  center: {
    type: Boolean,
    default: true
  },
  confirmLoading: {
    type: Boolean,
    default: false
  },
  cancelLoading: {
    type: Boolean,
    default: false
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const iconMap = {
  warning: Warning,
  info: InfoFilled,
  success: CircleCheck,
  danger: CircleClose,
  question: QuestionFilled
};

const icon = computed(() => iconMap[props.type]);
const iconComponent = computed(() => iconMap[props.type] || QuestionFilled);
const iconClass = computed(() => `confirm-dialog-icon-${props.type}`);

const handleClose = () => {
  emit('update:modelValue', false);
};

const handleCancel = () => {
  emit('cancel');
  handleClose();
};

const handleConfirm = () => {
  emit('confirm');
};
</script>

<style scoped>
.confirm-dialog-content {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.confirm-dialog-icon {
  flex-shrink: 0;
  margin-top: -4px;
}

.confirm-dialog-icon-warning {
  color: var(--el-color-warning);
}

.confirm-dialog-icon-info {
  color: var(--el-color-info);
}

.confirm-dialog-icon-success {
  color: var(--el-color-success);
}

.confirm-dialog-icon-danger {
  color: var(--el-color-danger);
}

.confirm-dialog-icon-question {
  color: var(--el-color-primary);
}

.confirm-dialog-message {
  flex: 1;
}

.confirm-dialog-message p {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--el-text-color-primary);
}

.confirm-dialog-description {
  margin-top: 8px !important;
  font-size: 14px !important;
  color: var(--el-text-color-secondary) !important;
}

.confirm-dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}
</style>
