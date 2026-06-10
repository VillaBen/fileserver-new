import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { playlistsAPI } from '../api';
import { useAuthStore } from './auth';
import { toast } from '../utils/toast';

export const usePlayerStore = defineStore('player', () => {
  // 当前播放列表（动态列表，不一定对应数据库中的 playlist）
  const queue = ref([]);
  const currentIndex = ref(-1);
  const isPlaying = ref(false);
  const isPaused = ref(false);
  const volume = ref(0.7);
  const progress = ref(0);  // 0-100 (百分比)
  const duration = ref(0); // 秒
  const currentTime = ref(0); // 秒
  const isShuffle = ref(false);
  const isMuted = ref(false);
  const playMode = ref('loop'); // 'loop' | 'repeat-one' | 'random'
  const isVisible = ref(false);  // 灵动岛是否展开
  const isExpanded = ref(false); // 是否展开详细信息
  const userPlaylists = ref([]); // 用户的数据库播放列表

  const audio = ref(null);
  let lastProgressUpdate = 0; // 用于节流高频进度更新

  const currentTrack = computed(() => {
    if (currentIndex.value >= 0 && currentIndex.value < queue.value.length) {
      return queue.value[currentIndex.value];
    }
    return null;
  });

  const isInQueue = computed(() => (fileId) => {
    return queue.value.some((t) => t.fileId === fileId);
  });

  function initAudio() {
    if (!audio.value) {
      audio.value = new Audio();
      audio.value.volume = volume.value;

      audio.value.addEventListener('play', () => {
        isPlaying.value = true;
        isPaused.value = false;
      });

      audio.value.addEventListener('pause', () => {
        isPlaying.value = false;
        isPaused.value = true;
      });

      audio.value.addEventListener('ended', () => {
        handleEnded();
      });

      audio.value.addEventListener('timeupdate', () => {
        if (audio.value && audio.value.duration) {
          // 节流：每 500ms 最多更新一次进度，避免高频触发 Vue 响应式
          const now = Date.now();
          if (!lastProgressUpdate || now - lastProgressUpdate >= 500) {
            lastProgressUpdate = now;
            currentTime.value = audio.value.currentTime;
            duration.value = audio.value.duration;
            progress.value = (audio.value.currentTime / audio.value.duration) * 100;
          }
        }
      });

      audio.value.addEventListener('loadedmetadata', () => {
        if (audio.value && audio.value.duration) {
          duration.value = audio.value.duration;
        }
      });

      audio.value.addEventListener('error', () => {
        toast.error('播放失败：文件可能无法访问或格式不受支持');
        isPlaying.value = false;
        isPaused.value = true;
      });
    }
  }

  function clearAudio() {
    if (audio.value) {
      audio.value.pause();
      audio.value.src = '';
      audio.value = null;
    }
    isPlaying.value = false;
    isPaused.value = false;
    currentIndex.value = -1;
    queue.value = [];
    progress.value = 0;
    currentTime.value = 0;
    duration.value = 0;
  }

  function setQueue(tracks, startIndex = 0) {
    initAudio();
    queue.value = tracks;
    currentIndex.value = startIndex;
    loadCurrentTrack();
    isVisible.value = true;
  }

  function addToQueue(track) {
    initAudio();
    queue.value.push(track);
    if (currentIndex.value === -1) {
      currentIndex.value = 0;
      loadCurrentTrack();
    }
    isVisible.value = true;
    toast.success('已加入播放队列');
  }

  function removeFromQueue(index) {
    if (index === currentIndex.value) {
      // 正在播放的被移除
      if (audio.value) {
        audio.value.pause();
      }
      queue.value.splice(index, 1);
      if (queue.value.length === 0) {
        currentIndex.value = -1;
        isPlaying.value = false;
        isVisible.value = false;
      } else {
        if (currentIndex.value >= queue.value.length) {
          currentIndex.value = 0;
        }
        loadCurrentTrack();
      }
    } else {
      queue.value.splice(index, 1);
      if (index < currentIndex.value) {
        currentIndex.value--;
      }
    }
  }

  function loadCurrentTrack() {
    if (!audio.value) initAudio();
    if (currentTrack.value) {
      audio.value.src = currentTrack.value.url;
      audio.value.load();
    }
  }

  function play() {
    if (audio.value && currentTrack.value) {
      audio.value.play().catch((err) => {
        console.error('播放失败:', err);
        toast.error('播放失败');
      });
    }
  }

  function pause() {
    if (audio.value) {
      audio.value.pause();
    }
  }

  function togglePlay() {
    if (!currentTrack.value) return;
    if (isPlaying.value) {
      pause();
    } else {
      play();
    }
  }

  function next() {
    if (queue.value.length === 0) return;
    if (playMode.value === 'random') {
      currentIndex.value = Math.floor(Math.random() * queue.value.length);
    } else {
      currentIndex.value = (currentIndex.value + 1) % queue.value.length;
    }
    loadCurrentTrack();
    play();
  }

  function prev() {
    if (queue.value.length === 0) return;
    if (currentTime.value > 3 && audio.value) {
      audio.value.currentTime = 0;
      return;
    }
    if (playMode.value === 'random') {
      currentIndex.value = Math.floor(Math.random() * queue.value.length);
    } else {
      currentIndex.value = (currentIndex.value - 1 + queue.value.length) % queue.value.length;
    }
    loadCurrentTrack();
    play();
  }

  function playAt(index) {
    if (index >= 0 && index < queue.value.length) {
      currentIndex.value = index;
      loadCurrentTrack();
      play();
    }
  }

  function handleEnded() {
    if (playMode.value === 'repeat-one' && audio.value) {
      audio.value.currentTime = 0;
      audio.value.play();
    } else {
      next();
    }
  }

  function seekTo(percent) {
    if (audio.value && audio.value.duration) {
      audio.value.currentTime = (percent / 100) * audio.value.duration;
    }
  }

  function setVolume(val) {
    volume.value = val;
    if (audio.value) {
      audio.value.volume = val;
    }
    if (val > 0) {
      isMuted.value = false;
    }
  }

  function toggleMute() {
    isMuted.value = !isMuted.value;
    if (audio.value) {
      audio.value.muted = isMuted.value;
    }
  }

  function togglePlayMode() {
    const modes = ['loop', 'repeat-one', 'random'];
    const idx = modes.indexOf(playMode.value);
    playMode.value = modes[(idx + 1) % modes.length];
    const modeNames = { 'loop': '列表循环', 'repeat-one': '单曲循环', 'random': '随机播放' };
    toast.success(modeNames[playMode.value]);
  }

  function toggleExpand() {
    isExpanded.value = !isExpanded.value;
  }

  function collapsePlayer() {
    isExpanded.value = false;
  }

  function showPlayer() {
    isVisible.value = true;
  }

  function hidePlayer() {
    if (audio.value) {
      audio.value.pause();
    }
    isVisible.value = false;
  }

  // 数据库播放列表操作
  async function fetchPlaylists() {
    const authStore = useAuthStore();
    if (!authStore.isAuthenticated) return;
    try {
      const response = await playlistsAPI.getPlaylists();
      if (response.success) {
        userPlaylists.value = response.data?.playlists || [];
      }
    } catch (error) {
      console.error('获取播放列表失败:', error);
    }
  }

  async function createPlaylist(name, description = '') {
    try {
      const response = await playlistsAPI.createPlaylist({ name, description });
      if (response.success) {
        await fetchPlaylists();
        toast.success('播放列表已创建');
        return response.data;
      }
    } catch (error) {
      toast.error(error.error || '创建失败');
    }
    return null;
  }

  async function deletePlaylist(id) {
    try {
      const response = await playlistsAPI.deletePlaylist(id);
      if (response.success) {
        await fetchPlaylists();
        toast.success('播放列表已删除');
      }
    } catch (error) {
      toast.error(error.error || '删除失败');
    }
  }

  async function addToPlaylist(playlistId, fileId, fileName) {
    try {
      const response = await playlistsAPI.addItem(playlistId, { fileId, fileName });
      if (response.success) {
        toast.success('已添加到播放列表');
      }
    } catch (error) {
      toast.error(error.error || '添加失败');
    }
  }

  function formatTime(seconds) {
    if (!seconds || isNaN(seconds)) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  }

  function reset() {
    clearAudio();
    userPlaylists.value = [];
    isVisible.value = false;
    isExpanded.value = false;
  }

  return {
    queue,
    currentIndex,
    currentTrack,
    isPlaying,
    isPaused,
    volume,
    progress,
    duration,
    currentTime,
    isShuffle,
    isMuted,
    playMode,
    isVisible,
    isExpanded,
    userPlaylists,
    isInQueue,
    setQueue,
    addToQueue,
    removeFromQueue,
    play,
    pause,
    togglePlay,
    next,
    prev,
    playAt,
    seekTo,
    setVolume,
    toggleMute,
    togglePlayMode,
    toggleExpand,
    collapsePlayer,
    showPlayer,
    hidePlayer,
    fetchPlaylists,
    createPlaylist,
    deletePlaylist,
    addToPlaylist,
    formatTime,
    reset,
  };
});
