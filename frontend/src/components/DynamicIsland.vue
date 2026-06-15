<template>
  <div v-if="playerStore.isVisible" class="dynamic-island-wrapper">
    <!-- 灵动岛主体（紧凑模式） -->
    <div
      class="dynamic-island"
      :class="{ expanded: playerStore.isExpanded }"
      @click="playerStore.toggleExpand"
    >
      <div class="island-compact">
        <div class="island-left">
          <div class="music-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
            </svg>
          </div>
          <span v-if="playerStore.currentTrack" class="track-name-compact">
            {{ playerStore.currentTrack.name }}
          </span>
          <span v-else class="track-name-compact">暂无播放</span>
        </div>
        <div class="island-right">
          <div
            class="play-btn-small"
            @click.stop="playerStore.togglePlay"
            v-if="playerStore.currentTrack"
          >
            <svg v-if="!playerStore.isPlaying" viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
            </svg>
          </div>
        </div>
      </div>

      <!-- 展开模式 -->
      <div v-if="playerStore.isExpanded" class="island-expanded">
        <div class="track-header">
          <div class="album-art">
            <svg viewBox="0 0 24 24" width="32" height="32" fill="currentColor">
              <path d="M12 3v10.55A4 4 0 1 0 14 17V7h4V3h-6z"/>
            </svg>
          </div>
          <div class="track-info">
            <div class="track-title">{{ playerStore.currentTrack?.name || '未选择' }}</div>
            <div class="track-time">
              {{ playerStore.formatTime(playerStore.currentTime) }} /
              {{ playerStore.formatTime(playerStore.duration) }}
            </div>
          </div>
          <button class="collapse-btn" @click.stop="playerStore.collapsePlayer">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 14l5-5 5 5z"/>
            </svg>
          </button>
        </div>

        <div class="progress-wrapper">
          <div class="progress-bar" @click.stop="handleProgressClick">
            <div class="progress-fill" :style="{ width: playerStore.progress + '%' }"></div>
          </div>
        </div>

        <div class="controls">
          <button class="ctrl-btn" @click.stop="playerStore.togglePlayMode" :title="modeName">
            <svg v-if="playerStore.playMode === 'loop'" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 4V1L8 5l4 4V6c3.31 0 6 2.69 6 6 0 1.01-.25 1.97-.7 2.8l1.46 1.46C19.54 15.03 20 13.57 20 12c0-4.42-3.58-8-8-8zm0 14c-3.31 0-6-2.69-6-6 0-1.01.25-1.97.7-2.8L5.24 7.74C4.46 8.97 4 10.43 4 12c0 4.42 3.58 8 8 8v3l4-4-4-4v3z"/>
            </svg>
            <svg v-else-if="playerStore.playMode === 'repeat-one'" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z"/>
            </svg>
          </button>
          <button class="ctrl-btn" @click.stop="playerStore.prev">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
            </svg>
          </button>
          <button class="ctrl-btn play-btn" @click.stop="playerStore.togglePlay">
            <svg v-if="!playerStore.isPlaying" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M8 5v14l11-7z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
              <path d="M6 4h4v16H6zm8 0h4v16h-4z"/>
            </svg>
          </button>
          <button class="ctrl-btn" @click.stop="playerStore.next">
            <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
              <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
            </svg>
          </button>
          <button class="ctrl-btn" @click.stop="playerStore.toggleMute">
            <svg v-if="!playerStore.isMuted && playerStore.volume > 0" viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z"/>
            </svg>
            <svg v-else viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3L3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4L9.91 6.09 12 8.18V4z"/>
            </svg>
          </button>
        </div>

        <div class="volume-wrapper" v-if="playerStore.currentTrack">
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            :value="playerStore.volume"
            @input="handleVolumeInput"
            class="volume-slider"
          />
        </div>

        <!-- 队列列表 -->
        <div class="queue-section" v-if="playerStore.queue.length > 0">
          <div class="queue-title">播放队列 ({{ playerStore.queue.length }})</div>
          <div class="queue-list">
            <div
              v-for="(track, idx) in playerStore.queue"
              :key="idx"
              class="queue-item"
              :class="{ active: idx === playerStore.currentIndex }"
              @click.stop="playerStore.playAt(idx)"
            >
              <span class="queue-index">{{ idx + 1 }}</span>
              <span class="queue-name">{{ track.name }}</span>
              <button
                v-if="playerStore.queue.length > 1"
                class="queue-remove"
                @click.stop="playerStore.removeFromQueue(idx)"
              >
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>

        <button class="close-btn" @click.stop="playerStore.hidePlayer">
          关闭
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';
import { usePlayerStore } from '../stores/player';

const playerStore = usePlayerStore();

const modeName = computed(() => {
  const names = { 'loop': '列表循环', 'repeat-one': '单曲循环', 'random': '随机播放' };
  return names[playerStore.playMode] || '列表循环';
});

function handleProgressClick(e) {
  const rect = e.currentTarget.getBoundingClientRect();
  const percent = ((e.clientX - rect.left) / rect.width) * 100;
  playerStore.seekTo(percent);
}

function handleVolumeInput(e) {
  playerStore.setVolume(parseFloat(e.target.value));
}
</script>

<style scoped>
.dynamic-island-wrapper {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1000;
  pointer-events: none;
}

.dynamic-island {
  pointer-events: auto;
  background: var(--bg-surface, #ffffff);
  color: var(--text-primary, #1a1a2e);
  border-radius: 24px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
  overflow: hidden;
  cursor: pointer;
  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
  width: 280px;
  max-height: 42px;
}

.dynamic-island.expanded {
  width: 380px;
  max-height: 600px;
  border-radius: 32px;
  padding-bottom: 16px;
}

.island-compact {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 18px;
  height: 42px;
  gap: 12px;
}

.dynamic-island.expanded .island-compact {
  display: none;
}

.island-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.music-icon {
  display: flex;
  align-items: center;
  color: var(--accent-color, #4fc3f7);
  flex-shrink: 0;
}

.track-name-compact {
  font-size: 13px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  opacity: 0.9;
}

.island-right {
  flex-shrink: 0;
}

.play-btn-small {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary, #1a1a2e);
  border: none;
  cursor: pointer;
  transition: background 0.2s;
}

.play-btn-small:hover {
  background: rgba(0, 0, 0, 0.1);
}

.island-expanded {
  padding: 0 20px;
  cursor: default;
}

.track-header {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 8px 0 14px 0;
}

.album-art {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, var(--accent-color, #4fc3f7), #7e57c2);
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  flex-shrink: 0;
}

.track-info {
  flex: 1;
  min-width: 0;
}

.track-title {
  font-size: 14px;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  margin-bottom: 4px;
}

.track-time {
  font-size: 11px;
  opacity: 0.6;
}

.collapse-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary, #1a1a2e);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.collapse-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

.progress-wrapper {
  padding: 4px 0 12px 0;
}

.progress-bar {
  height: 4px;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--accent-color, #4fc3f7);
  border-radius: 2px;
  transition: width 0.1s linear;
}

.controls {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 14px;
  padding: 4px 0 12px 0;
}

.ctrl-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: transparent;
  color: var(--text-primary, #1a1a2e);
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0.85;
  transition: opacity 0.2s, background 0.2s;
}

.ctrl-btn:hover {
  opacity: 1;
  background: rgba(0, 0, 0, 0.08);
}

.ctrl-btn.play-btn {
  width: 52px;
  height: 52px;
  background: rgba(0, 0, 0, 0.08);
  opacity: 1;
}

.ctrl-btn.play-btn:hover {
  background: rgba(0, 0, 0, 0.15);
}

.volume-wrapper {
  padding: 4px 0 12px 0;
}

.volume-slider {
  width: 100%;
  height: 4px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 2px;
  outline: none;
}

.volume-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-color, #4fc3f7);
  cursor: pointer;
}

.volume-slider::-moz-range-thumb {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: var(--accent-color, #4fc3f7);
  cursor: pointer;
  border: none;
}

.queue-section {
  padding: 8px 0 14px 0;
  max-height: 200px;
  overflow-y: auto;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  margin-top: 4px;
}

.queue-title {
  font-size: 12px;
  opacity: 0.6;
  padding: 8px 0;
}

.queue-list {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 8px 10px;
  border-radius: 8px;
  cursor: pointer;
  transition: background 0.2s;
}

.queue-item:hover {
  background: rgba(0, 0, 0, 0.05);
}

.queue-item.active {
  background: rgba(0, 0, 0, 0.08);
}

.queue-item.active .queue-name {
  color: var(--accent-color, #4fc3f7);
  font-weight: 600;
}

.queue-index {
  font-size: 11px;
  opacity: 0.5;
  width: 18px;
  flex-shrink: 0;
}

.queue-name {
  flex: 1;
  font-size: 12px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.queue-remove {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: transparent;
  border: none;
  color: var(--text-primary, #1a1a2e);
  opacity: 0.5;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.queue-remove:hover {
  background: rgba(0, 0, 0, 0.1);
  opacity: 1;
}

.close-btn {
  width: 100%;
  padding: 10px;
  background: rgba(0, 0, 0, 0.06);
  color: var(--text-primary, #1a1a2e);
  border: none;
  border-radius: 10px;
  font-size: 13px;
  cursor: pointer;
  margin-top: 4px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.12);
}

/* 深色主题适配（通过 html.dark-theme class 识别） */
:deep(.dark-theme) .dynamic-island {
  background: var(--bg-surface, #1a1a2e);
  color: #fff;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
}

:deep(.dark-theme) .ctrl-btn {
  color: #fff;
}

:deep(.dark-theme) .ctrl-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

:deep(.dark-theme) .ctrl-btn.play-btn {
  background: rgba(255, 255, 255, 0.15);
}

:deep(.dark-theme) .ctrl-btn.play-btn:hover {
  background: rgba(255, 255, 255, 0.25);
}

:deep(.dark-theme) .play-btn-small {
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
}

:deep(.dark-theme) .play-btn-small:hover {
  background: rgba(255, 255, 255, 0.22);
}

:deep(.dark-theme) .collapse-btn,
:deep(.dark-theme) .close-btn {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

:deep(.dark-theme) .collapse-btn:hover,
:deep(.dark-theme) .close-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

:deep(.dark-theme) .track-time {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.dark-theme) .progress-bar {
  background: rgba(255, 255, 255, 0.15);
}

:deep(.dark-theme) .volume-slider {
  background: rgba(255, 255, 255, 0.15);
}

:deep(.dark-theme) .queue-item:hover {
  background: rgba(255, 255, 255, 0.08);
}

:deep(.dark-theme) .queue-item.active {
  background: rgba(255, 255, 255, 0.12);
}

:deep(.dark-theme) .queue-title {
  color: rgba(255, 255, 255, 0.6);
}

:deep(.dark-theme) .queue-section {
  border-top-color: rgba(255, 255, 255, 0.08);
}

:deep(.dark-theme) .queue-remove {
  color: #fff;
}

:deep(.dark-theme) .queue-remove:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 响应式 */
@media (max-width: 480px) {
  .dynamic-island {
    width: calc(100vw - 40px);
    max-width: 340px;
  }
  .dynamic-island.expanded {
    width: calc(100vw - 24px);
    max-width: 380px;
  }
}
</style>
