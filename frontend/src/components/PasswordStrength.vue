<template>
  <div class="password-strength">
    <div class="strength-indicator">
      <div class="strength-bars">
        <div
          v-for="(bar, index) in 4"
          :key="index"
          class="strength-bar"
          :class="getBarClass(index)"
        />
      </div>
      <span class="strength-label" v-if="strengthText">
        {{ strengthText }}
      </span>
    </div>
    <div v-if="props.password" class="requirements">
      <div v-for="(req, index) in requirements" :key="index" class="requirement">
        <svg class="req-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline v-if="req.met" points="20 6 9 17 4 12" />
          <circle v-else cx="12" cy="12" r="10" />
        </svg>
        <span class="req-text" :class="{ met: req.met }">{{ req.text }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { useI18nStore } from '../stores/i18n';

const i18n = useI18nStore();

const props = defineProps({
  password: {
    type: String,
    default: '',
  },
});

const strength = computed(() => {
  let score = 0;
  const password = props.password;

  if (!password) return 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

  console.log('PasswordStrength: Current strength score:', Math.min(4, Math.max(0, score)), 'for password length:', password.length);
  return Math.min(4, Math.max(0, score));
});

const strengthText = computed(() => {
  const texts = [
    '', 
    i18n.t('passwordStrength.weak'), 
    i18n.t('passwordStrength.medium'), 
    i18n.t('passwordStrength.strong'), 
    i18n.t('passwordStrength.veryStrong')
  ];
  const text = texts[strength.value];
  console.log('PasswordStrength: Current strength text:', text, 'with strength:', strength.value);
  return text;
});

const requirements = computed(() => [
  {
    met: props.password.length >= 8,
    text: i18n.t('passwordStrength.length'),
  },
  {
    met: /[a-z]/.test(props.password) && /[A-Z]/.test(props.password),
    text: i18n.t('passwordStrength.uppercase'),
  },
  {
    met: /\d/.test(props.password),
    text: i18n.t('passwordStrength.number'),
  },
  {
    met: /[!@#$%^&*(),.?":{}|<>]/.test(props.password),
    text: i18n.t('passwordStrength.special'),
  },
]);

function getBarClass(index) {
  const classes = [];
  if (index < strength.value) {
    if (strength.value <= 1) classes.push('weak');
    else if (strength.value <= 2) classes.push('fair');
    else if (strength.value <= 3) classes.push('good');
    else classes.push('strong');
  }
  return classes;
}
</script>

<style scoped>
.password-strength {
  margin-top: 12px;
}

.strength-indicator {
  display: flex;
  align-items: center;
  gap: 12px;
}

.strength-bars {
  display: flex;
  gap: 6px;
  flex: 1;
}

.strength-bar {
  flex: 1;
  height: 6px;
  background-color: var(--gray-200);
  border-radius: 4px;
  transition: all var(--transition-base);
}

.strength-bar.weak {
  background: linear-gradient(90deg, var(--danger-600) 0%, var(--danger-500) 100%);
}

.strength-bar.fair {
  background: linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%);
}

.strength-bar.good {
  background: linear-gradient(90deg, var(--primary-600) 0%, var(--primary-400) 100%);
}

.strength-bar.strong {
  background: linear-gradient(90deg, var(--accent-600) 0%, var(--accent-500) 100%);
}

.strength-label {
  font-size: 13px;
  font-weight: 600;
  min-width: 40px;
}

.strength-label:has(+ .strength-bar.weak) {
  color: var(--danger-600);
}

.strength-label:has(+ .strength-bar.fair) {
  color: #d97706;
}

.strength-label:has(+ .strength-bar.good) {
  color: var(--primary-600);
}

.strength-label:has(+ .strength-bar.strong) {
  color: var(--accent-600);
}

.requirements {
  margin-top: 12px;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
}

.requirement {
  display: flex;
  align-items: center;
  gap: 6px;
}

.req-icon {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.req-icon:has(polyline) {
  color: var(--accent-600);
}

.req-icon:has(circle) {
  color: var(--gray-300);
}

.req-text {
  font-size: 12px;
  color: var(--text-tertiary);
  transition: color var(--transition-fast);
}

.req-text.met {
  color: var(--text-secondary);
}

@media (max-width: 640px) {
  .requirements {
    grid-template-columns: 1fr;
  }
}
</style>
