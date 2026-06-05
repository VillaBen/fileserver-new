import { ref, computed, onMounted, onUnmounted } from 'vue';

export const DEVICE_TYPES = {
  DESKTOP: 'desktop',
  TABLET: 'tablet',
  MOBILE: 'mobile',
};

export const BREAKPOINTS = {
  MOBILE: 480,
  TABLET: 768,
  DESKTOP: 1024,
};

export function getDeviceType() {
  const width = window.innerWidth;
  if (width <= BREAKPOINTS.MOBILE) {
    return DEVICE_TYPES.MOBILE;
  } else if (width <= BREAKPOINTS.TABLET) {
    return DEVICE_TYPES.TABLET;
  }
  return DEVICE_TYPES.DESKTOP;
}

export function useDeviceDetection() {
  const deviceType = ref(getDeviceType());

  const updateDeviceType = () => {
    deviceType.value = getDeviceType();
  };

  onMounted(() => {
    window.addEventListener('resize', updateDeviceType);
  });

  onUnmounted(() => {
    window.removeEventListener('resize', updateDeviceType);
  });

  return {
    deviceType,
    isDesktop: computed(() => deviceType.value === DEVICE_TYPES.DESKTOP),
    isTablet: computed(() => deviceType.value === DEVICE_TYPES.TABLET),
    isMobile: computed(() => deviceType.value === DEVICE_TYPES.MOBILE),
  };
}
