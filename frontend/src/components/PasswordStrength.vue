<template>
  <div class="password-strength">
    <div class="strength-indicator">
      <div class="strength-bars">
        <div
          v-for="(bar, index) in 5"
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
      <div v-for="(req, index) in requirements" :key="index" class="requirement" :class="{ warning: req.warn }">
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

const WEAK_PATTERNS = [
  /^[0-9]+$/,
  /^[a-z]+$/,
  /^[A-Z]+$/,
  /(.)\1{3,}/,
  /0123|1234|2345|3456|4567|5678|6789|7890|8901|9012|0987|9876|8765|7654|6543|5432|4321|3210|2109/,
  /abcd|bcde|cdef|defg|efgh|fghi|ghij|hijk|ijkl|jklm|klmn|lmno|mnop|nopq|opqr|pqrs|qrst|rstu|stuv|tuvw|uvwx|vwxy|wxyz/i,
  /password|passwort|passphrase|secret|admin|letmein|welcome|monkey|master|qwerty|abc123|1111|0000|1234|1212|6666|9999|iloveyou|loveyou|login|trustno1|dragon|admin123|root|toor/i,
];

const strength = computed(() => {
  let score = 0;
  const password = props.password;

  if (!password) return 0;

  const lower = /[a-z]/.test(password);
  const upper = /[A-Z]/.test(password);
  const digits = /\d/.test(password);
  const special = /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;`'~]/.test(password);
  const unicode = /[^\x00-\x7F]/.test(password);

  const uniqueChars = new Set(password.toLowerCase()).size;
  const uniqueRatio = uniqueChars / password.length;

  let hasWeakPattern = false;
  for (const pattern of WEAK_PATTERNS) {
    if (pattern.test(password)) {
      hasWeakPattern = true;
      break;
    }
  }
  const hasUsername = /admin|username|user|login|test|demo/i.test(password);
  const hasDatePattern = /(19|20)\d{2}[01]\d[0-3]\d|[01]\d[0-3]\d(19|20)\d{2}|\d{4}[-_.]\d{2}[-_.]\d{2}|\d{2}[-_.]\d{2}[-_.]\d{4}/.test(password);
  const hasReversedWord = (() => {
    const reversed = password.toLowerCase().split('').reverse().join('');
    return /drowssap|nimda|toor|niamod|esrever/.test(reversed);
  })();

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (password.length >= 16) score++;
  if (password.length >= 20) score++;

  if (lower && upper) score++;
  if (digits) score++;
  if (special) score++;
  if (unicode) score++;

  if (uniqueRatio > 0.7) score++;

  if (hasWeakPattern || hasUsername || hasDatePattern || hasReversedWord) {
    score = Math.max(0, score - 2);
  }

  if (password.length <= 6) score = Math.min(score, 1);

  return Math.min(5, Math.max(0, score));
});

const strengthText = computed(() => {
  const texts = [
    '',
    i18n.t('passwordStrength.weak'),
    i18n.t('passwordStrength.medium'),
    i18n.t('passwordStrength.strong'),
    i18n.t('passwordStrength.veryStrong'),
    i18n.t('passwordStrength.excellent') || 'Excellent'
  ];
  return texts[strength.value];
});

const requirements = computed(() => {
  const pwd = props.password;
  const hasWeakPattern = pwd && WEAK_PATTERNS.some(pattern => pattern.test(pwd));

  return [
    {
      met: pwd.length >= 8,
      text: i18n.t('passwordStrength.length'),
    },
    {
      met: /[a-z]/.test(pwd) && /[A-Z]/.test(pwd),
      text: i18n.t('passwordStrength.uppercase'),
    },
    {
      met: /\d/.test(pwd),
      text: i18n.t('passwordStrength.number'),
    },
    {
      met: /[!@#$%^&*(),.?":{}|<>_\-+=\[\]\\;`'~]/.test(pwd),
      text: i18n.t('passwordStrength.special'),
    },
    {
      met: pwd.length > 0 && !hasWeakPattern,
      text: i18n.t('passwordStrength.noWeak') || 'No common patterns',
      warn: pwd.length > 0 && hasWeakPattern,
    },
  ];
});

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
