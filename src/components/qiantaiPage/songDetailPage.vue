<template>
  <div class="song-detail-container" :style="backgroundStyle">
    <div class="overlay"></div>
    
    <div class="content-container">
      <!-- 返回按钮 -->
      <div class="back-button" @click="goBack">
        <i class="el-icon-arrow-left"></i> 返回
      </div>
      
      <!-- 歌曲信息区域 -->
      <div class="song-info-container">
        <div class="cover-container" :class="{ 'playing': isPlaying }">
          <img :src="song.picUrl" alt="歌曲封面" class="song-cover" />
          <div class="disc-animation" :class="{ 'playing': isPlaying }"></div>
        </div>
        
        <div class="info-text">
          <h1 class="song-title">{{ song.name }}</h1>
          <p class="artist">歌手：{{ song.singer }}</p>
          <p class="album" v-if="song.album">专辑：{{ song.album }}</p>
          
          <!-- 添加歌曲介绍 -->
          <div class="song-description" v-if="song.content">
            <h3 class="description-title">歌曲介绍</h3>
            <p class="description-content">{{ song.content }}</p>
          </div>
          
          <!-- 添加类型标签 -->
          <div class="type-tags" v-if="song.typeNames && song.typeNames.length">
            <el-tag
              v-for="(type, index) in song.typeNames"
              :key="index"
              size="small"
              effect="dark"
              class="type-tag"
            >
              {{ type }}
            </el-tag>
          </div>
          
          <!-- 操作按钮 -->
          <div class="action-buttons">
            <el-button 
              type="primary" 
              round 
              :icon="isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"
              @click="togglePlay"
            >
              {{ isPlaying ? '暂停' : '播放' }}
            </el-button>
            
            <el-button 
              type="danger" 
              round 
              :icon="isLiked ? 'el-icon-star-on' : 'el-icon-star-off'"
              @click="toggleLike"
            >
              {{ isLiked ? '已喜欢' : '喜欢' }}
            </el-button>
          </div>
        </div>
      </div>
      
      <!-- 播放器控制区域 -->
      <div class="player-controls">
        <div class="progress-container">
          <span class="time-info">{{ formatTime(currentTime) }}</span>
          <el-slider 
            v-model="progressPercentage" 
            @change="onProgressChange"
            :format-tooltip="formatTooltip"
            class="progress-slider"
          ></el-slider>
          <span class="time-info">{{ formatTime(duration) }}</span>
        </div>
        
        <div class="control-buttons">
          <i class="el-icon-arrow-left control-icon" @click="prevSong"></i>
          <i 
            :class="['control-icon', 'play-icon', isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play']" 
            @click="togglePlay"
          ></i>
          <i class="el-icon-arrow-right control-icon" @click="nextSong"></i>
        </div>
      </div>
      
      <!-- 歌词显示区域 -->
      <div class="lyrics-container">
        <h3 class="lyrics-title">歌词</h3>
        <div class="lyrics-scroll" ref="lyricsContainer">
          <p 
            v-for="(line, index) in parsedLyrics" 
            :key="index"
            :class="{ 'active-lyric': currentLyricIndex === index }"
            ref="lyricLines"
            @click="onLyricClick(line.time)"
          >
            {{ line.text }}
          </p>
          <p v-if="parsedLyrics.length === 0" class="no-lyrics">暂无歌词</p>
        </div>
      </div>
    </div>
    
    <!-- 音频元素 -->
    <audio 
      ref="audioPlayer" 
      :src="song.url" 
      @timeupdate="onTimeUpdate" 
      @loadedmetadata="onLoadedMetadata"
      @ended="onEnded"
    ></audio>
  </div>
</template>

<script>
import api from "@/api/axios";
export default {
  name: 'SongDetailPage',
  props: {
    id: {
      type: [String, Number],
      required: true
    },
    fromGedan: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      song: {
        id: '',
        name: '歌曲加载中...',
        singer: '未知歌手',
        album: '',
        picUrl: '',
        url: '',
        lyrics: [],
        typeNames: [],
        content: ''
      },
      isPlaying: false,
      isLiked: false,
      currentTime: 0,
      duration: 0,
      progressPercentage: 0,
      parsedLyrics: [],
      currentLyricIndex: -1,
      user: ""
    }
  },
  computed: {
    backgroundStyle() {
      return {
        backgroundImage: this.song.picUrl ? `url(${this.song.picUrl})` : 'none',
      }
    }
  },
  watch: {
    id: {
      immediate: true,
      handler(newId) {
        if (newId) {
          this.fetchSongDetail(newId);
        }
      }
    },
    currentTime(newTime) {
      // 更新当前播放的歌词位置
      const index = this.parsedLyrics.findIndex((item, i, arr) => {
        return newTime >= item.time && (i === arr.length - 1 || newTime < arr[i + 1].time);
      });
      
      if (index !== -1 && index !== this.currentLyricIndex) {
        this.currentLyricIndex = index;
        this.$nextTick(() => {
          this.scrollToActiveLyric(true);
        });
      }
    }
  },
  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
  },
  methods: {
    // 获取歌曲详情
    async fetchSongDetail(id) {
      try {
        console.log("aaa", this.user.id);
        const response = await api.post('/api/music/detail/', { musicId: id, userId: this.user.id });
        if (response.data) {
          this.song = {
            id: response.data.id,
            name: response.data.name,
            singer: response.data.singerNames || '未知歌手',
            album: '',
            picUrl: this.getFullImagePath(response.data.musicPath),
            url: this.getFullAudioPath(response.data.audioPath),
            lyrics: response.data.lyrics || [],
            typeNames: response.data.typeName || [],
            content: response.data.content || '暂无介绍'
          };
          this.isLiked = response.data.favorited === 1;
          this.parseLyrics();
        }
      } catch (error) {
        console.error('获取歌曲详情失败', error);
        this.$message.error('加载歌曲信息失败，请重试');
      }
    },
    
    getFullImagePath(path) {
      return path ? `http://localhost:8000${path}` : require('@/assets/1740221844832.jpg');
    },

    getFullAudioPath(path) {
      return `http://localhost:8000${path}`;
    },
    
    // 解析歌词
    parseLyrics() {
      if (!this.song.lyrics || !this.song.lyrics.length) {
        this.parsedLyrics = [];
        return;
      }
      
      this.parsedLyrics = this.song.lyrics.map(line => {
        const timeArr = line.time.split(':');
        const minutes = parseInt(timeArr[0]);
        const seconds = parseFloat(timeArr[1]);
        
        return {
          time: minutes * 60 + seconds,
          text: line.content
        };
      }).sort((a, b) => a.time - b.time);
    },
    
    // 播放控制
    togglePlay() {
      const audio = this.$refs.audioPlayer;
      if (this.isPlaying) {
        audio.pause();
      } else {
        audio.play().catch(error => {
          console.error('播放失败', error);
          this.$message.error('播放失败，请检查网络连接');
        });
      }
      this.isPlaying = !this.isPlaying;
    },
    
    // 喜欢
    async toggleLike() {
      try {
        const url = this.isLiked ? '/api/music/deleteFavorites/' : '/api/music/favorites/';
        const response = await api.post(url, {
          musicId: this.song.id,
          userId: this.user.id
        });
        
        if (response.status === 'success') {
          this.isLiked = !this.isLiked;
          this.$message({
            type: 'success',
            message: this.isLiked ? '已添加到我喜欢的音乐' : '已取消喜欢',
            duration: 1500
          });
        }
      } catch (error) {
        console.error('操作失败', error);
        this.$message.error('操作失败，请重试');
      }
    },
    
    // 音频事件处理
    onTimeUpdate(e) {
      this.currentTime = e.target.currentTime;
      this.progressPercentage = (this.currentTime / this.duration) * 100;
    },
    
    onLoadedMetadata(e) {
      this.duration = e.target.duration;
    },
    
    onEnded() {
      this.isPlaying = false;
      this.nextSong();
    },
    
    // 进度条控制
    onProgressChange(value) {
      const audio = this.$refs.audioPlayer;
      const newTime = (value / 100) * this.duration;
      audio.currentTime = newTime;
      this.currentTime = newTime;
    },
    
    formatTime(seconds) {
      if (isNaN(seconds) || seconds === Infinity) return '00:00';
      const mins = Math.floor(seconds / 60);
      const secs = Math.floor(seconds % 60);
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    },
    
    formatTooltip(value) {
      return this.formatTime((value / 100) * this.duration);
    },
    
    // 歌词滚动
    scrollToActiveLyric(animate = false) {
      if (!this.$refs.lyricLines || this.currentLyricIndex === -1) return;
      
      this.$nextTick(() => {
        const container = this.$refs.lyricsContainer;
        const activeElement = this.$refs.lyricLines[this.currentLyricIndex];
        
        if (container && activeElement) {
          const targetScrollTop = activeElement.offsetTop - container.offsetHeight / 2 + activeElement.offsetHeight / 2;
          
          if (animate) {
            // 使用自定义动画实现更慢的滚动
            const currentScrollTop = container.scrollTop;
            const distance = targetScrollTop - currentScrollTop;
            const duration = 1000; // 增加到1秒
            const startTime = performance.now();
            
            const animateScroll = (currentTime) => {
              const elapsedTime = currentTime - startTime;
              if (elapsedTime < duration) {
                // 使用缓动函数使动画更自然
                const progress = this.easeInOutCubic(elapsedTime / duration);
                container.scrollTop = currentScrollTop + distance * progress;
                requestAnimationFrame(animateScroll);
              } else {
                container.scrollTop = targetScrollTop;
              }
            };
            
            requestAnimationFrame(animateScroll);
          } else {
            container.scrollTop = targetScrollTop;
          }
        }
      });
    },
    
    // 添加缓动函数
    easeInOutCubic(t) {
      return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    },
    
    // 上一首/下一首
    prevSong() {
      // 这里应实现切换到上一首歌曲的逻辑
      this.$message.info('切换到上一首');
    },
    
    nextSong() {
      // 这里应实现切换到下一首歌曲的逻辑
      this.$message.info('切换到下一首');
    },
    
    // 返回上一页
    goBack() {
      if (this.fromGedan) {
        this.$router.go(-1); // 返回歌单页面
      } else {
        this.$router.push('/'); // 返回首页
      }
    },
    
    // 添加歌词点击跳转方法
    onLyricClick(time) {
      if (this.$refs.audioPlayer) {
        this.$refs.audioPlayer.currentTime = time;
        if (!this.isPlaying) {
          this.togglePlay();
        }
      }
    }
  },
  beforeDestroy() {
    // 组件销毁前停止播放
    if (this.$refs.audioPlayer) {
      this.$refs.audioPlayer.pause();
    }
  }
}
</script>

<style scoped>
.song-detail-container {
  position: relative;
  width: 100%;
  min-height: 100vh;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  color: #333;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f0f2f5;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(10px);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px;
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.9);
  border-radius: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
}

.back-button {
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 30px;
  display: inline-flex;
  align-items: center;
  transition: color 0.3s;
  animation: slideIn 0.4s ease-out;
}

.back-button:hover {
  color: #409EFF;
}

.song-info-container {
  display: flex;
  margin-bottom: 40px;
  gap: 40px;
  animation: fadeIn 0.8s ease-out;
}

.cover-container {
  position: relative;
  flex-shrink: 0;
  width: 300px;
  height: 300px;
  transition: transform 0.3s ease;
}

.cover-container:hover {
  transform: scale(1.05);
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.5s ease;
}

.cover-container:hover .song-cover,
.playing .song-cover {
  transform: rotate(5deg);
}

/* 添加封面旋转动画 */
@keyframes coverRotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.playing .song-cover {
  animation: coverRotate 20s linear infinite;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.4);
}

.disc-animation {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background-color: rgba(0, 0, 0, 0.7);
  transform: translate(-50%, -50%);
  opacity: 0;
  transition: opacity 0.3s;
}

.disc-animation.playing {
  opacity: 1;
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.info-text {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.song-title {
  font-size: 32px;
  margin: 0 0 15px 0;
  font-weight: 700;
}

.artist, .album {
  font-size: 18px;
  margin: 5px 0;
  color: #666; /* 加深歌手颜色 */
}

.type-tags {
  margin: 10px 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.type-tag {
  background: #409EFF !important;
  color: white !important;
  border: none;
  padding: 6px 12px;
  border-radius: 20px;
  font-size: 14px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: tagFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 2px 8px rgba(64, 158, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
}

.type-tag:hover {
  transform: translateY(-2px) scale(1.05);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.3);
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
    filter: blur(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }
}

.action-buttons {
  margin-top: 25px;
  display: flex;
  gap: 15px;
}

.player-controls {
  margin: 30px 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.player-controls:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.time-info {
  width: 50px;
  font-size: 14px;
  color: #666;
}

.progress-slider {
  flex-grow: 1;
  margin: 0 15px;
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 40px;
  margin: 20px 0;
}

.control-icon {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.control-icon:hover {
  color: #409EFF;
  transform: scale(1.2);
}

.play-icon {
  font-size: 32px;
}

.lyrics-container {
  margin-top: 40px;
  width: 100%;
  background: rgba(255, 255, 255, 0.9);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyrics-title {
  font-size: 24px;
  margin-bottom: 20px;
}

.lyrics-scroll {
  height: 300px;
  overflow-y: auto;
  padding: 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  perspective: 1000px;
  transform-style: preserve-3d;
  scroll-behavior: smooth; /* 确保平滑滚动 */
  mask-image: linear-gradient(
    to bottom,
    transparent 0%,
    black 10%,
    black 90%,
    transparent 100%
  );
}

.lyrics-scroll p {
  font-size: 16px;
  margin: 16px 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  opacity: 0.7;
  text-align: center;
  padding: 12px 30px;
  line-height: 1.5;
  cursor: pointer;
  transform: translateZ(0) rotateX(0);
  transform-origin: center center;
  color: #666;
  border-radius: 8px;
}

.lyrics-scroll p:not(.active-lyric) {
  transform: translateZ(0) scale(0.95);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyrics-scroll p:not(.active-lyric):hover {
  transform: translateZ(15px) scale(1.02);
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.7);
}

.active-lyric {
  font-size: 20px !important;
  font-weight: bold;
  color: #409EFF !important;
  opacity: 1 !important;
  transform: translateZ(30px) scale(1.08) !important;
  text-shadow: 0 0 10px rgba(64, 158, 255, 0.3);
  letter-spacing: 1px;
  animation: lyricPulse 3s infinite cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15) !important;
}

@keyframes lyricPulse {
  0% {
    transform: translateZ(30px) scale(1.08);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  }
  50% {
    transform: translateZ(40px) scale(1.1);
    box-shadow: 0 12px 28px rgba(64, 158, 255, 0.25);
  }
  100% {
    transform: translateZ(30px) scale(1.08);
    box-shadow: 0 8px 24px rgba(64, 158, 255, 0.15);
  }
}

.lyrics-scroll p:not(.active-lyric) {
  transform: translateZ(0) rotateX(0);
  transition: all 0.3s ease;
}

.lyrics-scroll p:not(.active-lyric):hover {
  transform: translateZ(15px) scale(1.05);
  opacity: 0.8;
}

/* 添加歌词渐变效果 */
/* .lyrics-scroll p:not(.active-lyric) {
  transform: scale(0.95);
}

.lyrics-scroll p:not(.active-lyric):hover {
  opacity: 0.8;
  transform: scale(0.98);
} */

/* 添加歌词切换动画 */
@keyframes lyricFadeIn {
  from {
    opacity: 0;
    transform: translateY(10px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translateY(0) translateZ(30px) scale(1.08);
  }
}

.active-lyric {
  animation: lyricFadeIn 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 优化滚动条样式 */
.lyrics-scroll::-webkit-scrollbar {
  width: 6px;
}

.lyrics-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 3px;
}

.lyrics-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
  transition: background-color 0.3s;
}

.lyrics-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.3);
}

.no-lyrics {
  text-align: center;
  color: #999;
  margin-top: 100px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .song-info-container {
    flex-direction: column;
    align-items: center;
    padding: 0 15px;
  }
  
  .cover-container {
    width: 200px;
    height: 200px;
    margin-bottom: 20px;
  }
  
  .info-text {
    text-align: center;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .lyrics-scroll {
    height: 200px;
  }
}

/* 添加新的动画样式 */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(30px);
    filter: blur(10px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
    filter: blur(0);
  }
}

@keyframes slideIn {
  from { 
    transform: translateX(-30px);
    opacity: 0;
    filter: blur(5px);
  }
  to { 
    transform: translateX(0);
    opacity: 1;
    filter: blur(0);
  }
}

/* 优化播放器控件样式 */
.player-controls {
  background: rgba(255, 255, 255, 0.9);
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.player-controls:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.control-icon {
  transition: all 0.3s ease;
}

.control-icon:hover {
  color: #409EFF;
  transform: scale(1.2);
}

/* 优化进度条样式 */
.progress-slider :deep(.el-slider__runway) {
  background-color: rgba(0, 0, 0, 0.1);
  height: 6px;
}

.progress-slider :deep(.el-slider__bar) {
  background-color: #409EFF;
  height: 6px;
}

.progress-slider :deep(.el-slider__button) {
  border: 2px solid #409EFF;
  background-color: #fff;
  transition: transform 0.3s ease;
  width: 16px;
  height: 16px;
}

.progress-slider :deep(.el-slider__button:hover) {
  transform: scale(1.2);
}

/* 添加暗色主题支持 */
@media (prefers-color-scheme: dark) {
  .overlay {
    background-color: rgba(0, 0, 0, 0.8);
  }
  
  .player-controls {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .lyrics-scroll {
    background-color: rgba(0, 0, 0, 0.3);
  }
}

.song-description {
  margin: 20px 0;
  padding: 15px;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 12px;
  border-left: 4px solid #409EFF;
  transition: all 0.3s ease;
}

.song-description:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

.description-title {
  font-size: 18px;
  color: #409EFF;
  margin-bottom: 10px;
  font-weight: 600;
}

.description-content {
  font-size: 15px;
  color: #666;
  line-height: 1.6;
  text-align: justify;
}
</style> 