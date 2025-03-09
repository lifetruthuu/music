<template>
  <footer class="player-footer" :class="{ show: show }">
    <div class="player-controls">
      <div class="left-controls">
        <div class="music-cover" :class="{ 'is-playing': isPlaying }">
          <img
            :src="currentSong?.musicPath ? fullImagePath(currentSong.musicPath) : require('@/assets/1740221844832.jpg')"
            alt="封面"
          />
          <div class="cover-overlay">
            <i :class="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
          </div>
        </div>
        <div class="music-info">
          <span class="music-name">{{ currentSong?.name || '未播放' }}</span>
          <span class="music-singer">{{ currentSong?.singerNames || '-' }}</span>
        </div>
      </div>
      <div class="progress-section">
        <i 
          class="el-icon-caret-left control-btn" 
          @click="previousMusic" 
          :class="{ disabled: !hasPrevious }"
        ></i>
        <div class="audio-wrapper">
          <div class="audio-container">
            <audio
              ref="audioPlayer"
              :src="audioPath"
              @timeupdate="updateProgress"
              @ended="handleAudioEnded"
              @play="handlePlay"
              @pause="handlePause"
              @loadedmetadata="handleLoadedMetadata"
              controls
            />
          </div>
          <!-- <div class="progress-bar">
            <div class="progress-inner" :style="{ width: `${progress}%` }"></div>
          </div> -->
        </div>
        <i 
          class="el-icon-caret-right control-btn" 
          @click="nextMusic" 
          :class="{ disabled: !hasNext }"
        ></i>
      </div>
    </div>
  </footer>
</template>

<script>
import BehaviorService from '@/services/BehaviorService';
import { mapState } from 'vuex'; // 导入Vuex状态映射

export default {
  name: 'AudioPlayer',
  
  props: {
    show: {
      type: Boolean,
      default: false
    },
    currentSong: {
      type: Object,
      default: null
    },
    playlist: {
      type: Array,
      default: () => []
    },
    currentIndex: {
      type: Number,
      default: -1
    }
  },

  data() {
    return {
      isPlaying: false,
      duration: 0,
      currentTime: 0,
      mouseY: 0,
      windowHeight: window.innerHeight,
      startPlayTime: null
    }
  },

  computed: {
    ...mapState({
      user: state => state.user // 从Vuex获取用户信息
    }),
    
    // 从Vuex中获取userId
    userId() {
      return this.user ? this.user.id : null;
    },
    
    audioPath() {
      return this.currentSong?.audioPath ? `http://localhost:8000${this.currentSong.audioPath}` : '';
    },
    hasNext() {
      return this.currentIndex < this.playlist.length - 1;
    },
    hasPrevious() {
      return this.currentIndex > 0;
    }
  },

  mounted() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  },

  methods: {
    fullImagePath(path) {
      return `http://localhost:8000${path}`;
    },

    updateProgress() {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        this.currentTime = audio.currentTime;
        const progress = (audio.currentTime / audio.duration) * 100;
        this.$emit('progress-update', progress);
      }
    },

    handlePlay(event) {
      this.isPlaying = true;
      this.$emit('play', event);
      
      this.startPlayTime = new Date();
      
      if (this.currentSong) {
        BehaviorService.recordPlay(this.currentSong, this.userId, 'play');
        BehaviorService.recordBehavior({
          user_id: this.userId,
          music_id: this.currentSong.id,
          action_type: 'play',
          position_in_playlist: this.currentIndex
        });
      }
    },

    handlePause() {
      this.isPlaying = false;
      this.$emit('pause');
      
      if (this.currentSong && this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = this.duration > 0 ? duration / this.duration : 0;
        
        BehaviorService.recordPlay(this.currentSong, this.userId, 'pause', duration, completionRate);
        BehaviorService.recordBehavior({
          user_id: this.userId,
          music_id: this.currentSong.id,
          action_type: 'pause',
          play_duration: duration,
          play_completion_rate: completionRate
        });
      }
    },

    handleAudioEnded() {
      this.isPlaying = false;
      this.$emit('ended');
      
      if (this.currentSong && this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = 1.0;
        
        BehaviorService.recordPlay(this.currentSong, this.userId, 'complete', duration, completionRate);
        BehaviorService.recordBehavior({
          user_id: this.userId,
          music_id: this.currentSong.id,
          action_type: 'complete',
          play_duration: duration,
          play_completion_rate: completionRate
        });
        
        this.startPlayTime = null;
      }
    },

    handleLoadedMetadata() {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        this.duration = audio.duration;
      }
    },

    previousMusic() {
      if (this.hasPrevious) {
        if (this.currentSong && this.startPlayTime) {
          const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
          const completionRate = this.duration > 0 ? duration / this.duration : 0;
          
          BehaviorService.recordPlay(this.currentSong, this.userId, 'skip', duration, completionRate);
          BehaviorService.recordBehavior({
            user_id: this.userId,
            music_id: this.currentSong.id,
            action_type: 'skip_previous',
            play_duration: duration,
            play_completion_rate: completionRate
          });
          
          this.startPlayTime = null;
        }
        this.$emit('change-song', this.currentIndex - 1);
      }
    },

    nextMusic() {
      if (this.hasNext) {
        if (this.currentSong && this.startPlayTime) {
          const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
          const completionRate = this.duration > 0 ? duration / this.duration : 0;
          
          BehaviorService.recordPlay(this.currentSong, this.userId, 'skip', duration, completionRate);
          BehaviorService.recordBehavior({
            user_id: this.userId,
            music_id: this.currentSong.id,
            action_type: 'skip_next',
            play_duration: duration,
            play_completion_rate: completionRate
          });
          
          this.startPlayTime = null;
        }
        this.$emit('change-song', this.currentIndex + 1);
      }
    },

    handleMouseMove(event) {
      this.mouseY = event.clientY;
      this.$emit('update:show', (this.windowHeight - this.mouseY) < 80);
    },

    handleResize() {
      this.windowHeight = window.innerHeight;
    },

    play() {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        audio.play().catch(err => console.error('播放失败:', err));
      }
    },

    pause() {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        audio.pause();
      }
    }
  }
}
</script>

<style scoped>
.player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 15px 0;
  transform: translateY(100%);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  opacity: 0;
}

.player-footer.show {
  transform: translateY(0);
  opacity: 1;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 30px;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 20px;
  width: 300px;
}

.music-cover {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.music-cover:hover {
  transform: scale(1.05);
}

.music-cover.is-playing img {
  animation: rotate 20s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.music-cover:hover .cover-overlay {
  opacity: 1;
}

.cover-overlay i {
  color: white;
  font-size: 24px;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.music-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.music-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 6px;
  font-size: 16px;
}

.music-singer {
  font-size: 13px;
  color: #666;
}

.progress-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
  max-width: 700px;
  padding: 0 20px;
}

.control-btn {
  cursor: pointer;
  font-size: 26px;
  color: #409EFF;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.control-btn:hover:not(.disabled) {
  transform: scale(1.2);
  color: #66b1ff;
}

.control-btn.disabled {
  color: #C0C4CC;
  cursor: not-allowed;
  opacity: 0.6;
}

.audio-wrapper {
  flex: 1;
  position: relative;
  padding: 8px;
  background: linear-gradient(145deg, #ffffff, #f5f7fa);
  border-radius: 20px;
  box-shadow: 
    5px 5px 10px rgba(0, 0, 0, 0.05),
    -5px -5px 10px rgba(255, 255, 255, 0.8);
}

.audio-container {
  position: relative;
  width: 100%;
  border-radius: 15px;
  overflow: hidden;
  background: #fff;
}

audio {
  width: 100%;
  height: 36px;
  border-radius: 15px;
  outline: none;
}

/* 自定义音频控件样式 */
audio::-webkit-media-controls-panel {
  background: linear-gradient(145deg, #f5f7fa, #ffffff);
  padding: 5px 8px;
  display: flex;
  align-items: center;
  gap: 5px;
}

audio::-webkit-media-controls-play-button {
  background-color: #409EFF;
  border-radius: 50%;
  transition: all 0.3s ease;
}

audio::-webkit-media-controls-play-button:hover {
  background-color: #66b1ff;
  transform: scale(1.1);
}

/* 音量控制样式 */
audio::-webkit-media-controls-volume-slider {
  width: 60px;
  height: 4px;
  padding: 0;
  border-radius: 2px;
  background-color: #e4e7ed;
  transition: all 1.2s ease;
  margin-top: 13.4px;
}

audio::-webkit-media-controls-volume-slider::-webkit-slider-thumb {
  background-color: #409EFF;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 1.2s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  /* margin-top: -4px; */
}

audio::-webkit-media-controls-volume-slider::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background-color: #66b1ff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

audio::-webkit-media-controls-mute-button {
  padding: 5px;
  border-radius: 50%;
  transition: all 1s ease;
  margin-right: 5px;
  /* margin-top: 4px; */
}

audio::-webkit-media-controls-mute-button:hover {
  background-color: rgba(64, 158, 255, 0.1);
  transform: scale(1.1);
}

/* 优化进度条样式 */
audio::-webkit-media-controls-timeline {
  height: 4px;
  padding: 0;
  margin: 0 10px;
  border-radius: 2px;
  background-color: #e4e7ed;
}

audio::-webkit-media-controls-timeline::-webkit-slider-thumb {
  background-color: #409EFF;
  width: 12px;
  height: 12px;
  border-radius: 50%;
  transition: all 0.3s ease;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

audio::-webkit-media-controls-timeline::-webkit-slider-thumb:hover {
  transform: scale(1.2);
  background-color: #66b1ff;
  box-shadow: 0 2px 6px rgba(64, 158, 255, 0.3);
}

/* 优化时间显示 */
audio::-webkit-media-controls-current-time-display,
audio::-webkit-media-controls-time-remaining-display {
  color: #606266;
  font-size: 12px;
  padding: 0 5px;
  font-family: 'Monaco', monospace;
}

.progress-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 3px;
  background: rgba(0, 0, 0, 0.05);
  border-radius: 1.5px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .player-footer {
    padding: 10px 0;
  }

  .player-controls {
    padding: 0 15px;
  }

  .left-controls {
    width: auto;
    gap: 10px;
  }

  .music-cover {
    width: 45px;
    height: 45px;
    border-radius: 8px;
  }

  .music-name {
    font-size: 14px;
  }

  .music-singer {
    font-size: 12px;
  }

  .progress-section {
    gap: 15px;
    padding: 0 10px;
  }

  .control-btn {
    font-size: 22px;
  }

  .audio-wrapper {
    padding: 6px;
  }

  audio {
    height: 32px;
  }

  audio::-webkit-media-controls-volume-slider {
    width: 50px;
    margin-top: 6px;
  }

  audio::-webkit-media-controls-panel {
    padding: 4px 6px;
  }
}
</style> 