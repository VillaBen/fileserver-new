<template>
  <el-dialog
    v-model="dialogVisible"
    :title="currentStepConfig.title"
    width="500px"
    :close-on-click-modal="false"
    :close-on-press-escape="false"
    @close="handleCancel"
  >
    <div class="dialog-content">
      <div class="warning-icon">
        <el-icon :size="48" color="#F56C6C">
          <Warning />
        </el-icon>
      </div>
      <p class="warning-message">{{ currentStepConfig.message }}</p>
      <div v-if="showCountdown && countdown > 0" class="countdown">
        <span class="countdown-number">{{ countdown }}</span>
        <span class="countdown-text">秒后可以确认</span>
      </div>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleCancel">取消</el-button>
        <el-button
          type="primary"
          :disabled="showCountdown && countdown > 0"
          @click="handleConfirm"
        >
          {{ currentStepConfig.confirmText || '确认' }}
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup>
import { ref, computed, onUnmounted, watch } from 'vue';
import { Warning } from '@element-plus/icons-vue';

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  steps: {
    type: Array,
    default: () => [
      {
        title: '操作确认',
        message: '您确定要执行此操作吗？',
        confirmText: '确认'
      }
    ]
  },
  countdownDuration: {
    type: Number,
    default: 10
  }
});

const emit = defineEmits(['update:modelValue', 'confirm', 'cancel']);

const dialogVisible = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const currentStep = ref(0);
const countdown = ref(props.countdownDuration);
let countdownTimer = null;

const currentStepConfig = computed(() => {
  return props.steps[currentStep.value] || props.steps[0];
});

const showCountdown = computed(() => {
  // 只在最后一步显示倒计时
  return currentStep.value === props.steps.length - 1;
});

const startCountdown = () => {
  countdown.value = props.countdownDuration;
  if (countdownTimer) {
    clearInterval(countdownTimer);
  }
  countdownTimer = setInterval(() => {
    if (countdown.value > 0) {
      countdown.value--;
    } else {
      clearInterval(countdownTimer);
    }
  }, 1000);
};

const stopCountdown = () => {
  if (countdownTimer) {
    clearInterval(countdownTimer);
    countdownTimer = null;
  }
};

const reset = () => {
  currentStep.value = 0;
  countdown.value = props.countdownDuration;
  stopCountdown();
};

const handleConfirm = () => {
  if (currentStep.value < props.steps.length - 1) {
    // 进入下一步
    currentStep.value++;
    // 如果是最后一步，开始倒计时
    if (currentStep.value === props.steps.length - 1) {
      startCountdown();
    }
  } else {
    // 最后一步，完成确认
    stopCountdown();
    emit('confirm');
    dialogVisible.value = false;
    reset();
  }
};

const handleCancel = () => {
  stopCountdown();
  emit('cancel');
  dialogVisible.value = false;
  reset();
};

// 监听显示变化
watch(() => props.modelValue, (val) => {
  if (val) {
    reset();
  }
});

onUnmounted(() => {
  stopCountdown();
});
</script>

<style scoped>
.dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  margin-bottom: 16px;
}

.warning-message {
  font-size: 16px;
  color: #606266;
  line-height: 1.6;
}

.countdown {
  margin-top: 24px;
  padding: 16px;
  background: #FFF0F0;
  border-radius: 8px;
}

.countdown-number {
  font-size: 32px;
  font-weight: bold;
  color: #F56C6C;
}

.countdown-text {
  font-size: 14px;
  color: #909399;
  margin-left: 8px;
}

.dialog-footer {
  display: flex;
  justify-content: center;
  gap: 12px;
}
</style>
