import { ElMessage } from 'element-plus';

const toastConfig = {
  offset: 20,
  duration: 3000,
  customClass: 'app-toast',
};

function getErrorMessage(error) {
  if (!error) return null;
  if (typeof error === 'string') return error;
  if (typeof error === 'object' && error.message) return error.message;
  if (typeof error === 'object' && error.error) return getErrorMessage(error.error);
  return null;
}

export const toast = {
  success: (msg) => ElMessage.success({ message: msg, ...toastConfig }),
  error: (msg) => {
    const message = getErrorMessage(msg) || msg;
    ElMessage.error({ message: message, ...toastConfig });
  },
  info: (msg) => ElMessage.info({ message: msg, ...toastConfig }),
  warning: (msg) => ElMessage.warning({ message: msg, ...toastConfig }),
};
