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
              class="play-button"
            >
              {{ isPlaying ? '暂停' : '播放' }}
            </el-button>
            
            <el-button 
              type="danger" 
              round 
              :icon="isLiked ? 'el-icon-star-on' : 'el-icon-star-off'"
              @click="toggleLike"
              class="like-button"
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
    },
    fromSinger: {
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
    console.log("[songDetailPage] 初始化，来源: ", this.fromGedan ? "歌单" : this.fromSinger ? "歌手详情" : "其他");
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
    
    // 返回上一页
    goBack() {
      // 使用事件机制，根据来源决定触发哪种返回事件
      if (this.fromGedan) {
        console.log("[songDetailPage] 触发返回歌单事件");
        this.$emit("onBackToGedan");
      } else if (this.fromSinger) {
        console.log("[songDetailPage] 触发返回歌手详情事件");
        this.$emit("onBackToSinger");
      } else {
        // 默认返回首页
        console.log("[songDetailPage] 触发返回首页事件");
        this.$emit("onBackToHome");
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
  background-color: #f8f9fa;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(15px);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 1100px;
  margin: 20px auto;
  padding: 35px;
  animation: fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1);
  background: rgba(255, 255, 255, 0.85);
  border-radius: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.12);
  transition: all 0.3s ease;
}

.back-button {
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  margin-bottom: 30px;
  padding: 10px 18px;
  background-color: #f5f7fa;
  border-radius: 20px;
  font-size: 16px;
  font-weight: 500;
  color: #409EFF;
  transition: all 0.3s ease;
  animation: slideIn 0.4s ease-out;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.back-button:hover {
  background-color: #ecf5ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.back-button i {
  margin-right: 5px;
}

.song-info-container {
  display: flex;
  margin-bottom: 50px;
  gap: 50px;
  animation: fadeIn 0.8s ease-out;
}

.cover-container {
  position: relative;
  flex-shrink: 0;
  width: 320px;
  height: 320px;
  transition: transform 0.3s ease;
  border-radius: 12px;
  box-shadow: 0 15px 35px rgba(0, 0, 0, 0.2);
  overflow: hidden;
}

.cover-container:hover {
  transform: translateY(-5px);
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: all 0.5s ease;
}

.cover-container:hover .song-cover {
  transform: scale(1.05);
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
  background-color: rgba(0, 0, 0, 0.6);
  transform: translate(-50%, -50%) scale(0.8);
  opacity: 0;
  transition: all 0.5s ease;
}

.disc-animation.playing {
  opacity: 0.7;
  transform: translate(-50%, -50%) scale(1);
  animation: rotate 10s linear infinite;
}

@keyframes rotate {
  from { transform: translate(-50%, -50%) rotate(0deg); }
  to { transform: translate(-50%, -50%) rotate(360deg); }
}

.info-text {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
}

.song-title {
  font-size: 36px;
  margin: 0 0 18px 0;
  font-weight: 700;
  color: #303133;
  line-height: 1.2;
  letter-spacing: -0.5px;
}

.artist, .album {
  font-size: 18px;
  margin: 8px 0;
  color: #606266;
  font-weight: 500;
}

.type-tags {
  margin: 15px 0;
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.type-tag {
  background: #409EFF !important;
  color: white !important;
  border: none;
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  animation: tagFadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 10px rgba(64, 158, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: center;
  height: 28px;
}

.type-tag:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.3);
}

@keyframes tagFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.song-description {
  margin: 20px 0;
  padding: 18px 22px;
  background: rgba(255, 255, 255, 0.7);
  border-radius: 16px;
  border-left: 5px solid #409EFF;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.song-description:hover {
  transform: translateX(5px);
  background: rgba(255, 255, 255, 0.9);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.08);
}

.description-title {
  font-size: 18px;
  color: #409EFF;
  margin-bottom: 12px;
  font-weight: 600;
  position: relative;
  padding-left: 5px;
}

.description-content {
  font-size: 16px;
  color: #606266;
  line-height: 1.7;
  text-align: justify;
  margin: 0;
}

.action-buttons {
  margin-top: 25px;
  display: flex;
  gap: 15px;
  animation: fadeIn 1s ease 0.4s both;
}

.play-button, .like-button {
  padding: 12px 25px !important;
  font-size: 16px !important;
  font-weight: 500 !important;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease !important;
}

.play-button {
  background-color: #409EFF !important;
  border-color: #409EFF !important;
}

.play-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(64, 158, 255, 0.3) !important;
  background-color: #66b1ff !important;
}

.like-button {
  background-color: #f56c6c !important;
  border-color: #f56c6c !important;
}

.like-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 6px 15px rgba(245, 108, 108, 0.3) !important;
  background-color: #f78989 !important;
}

.player-controls {
  margin: 30px 0;
  width: 100%;
  background: #f9fafc;
  padding: 28px;
  border-radius: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 1s ease 0.2s both;
}

.player-controls:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.12);
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 18px;
}

.time-info {
  width: 55px;
  font-size: 14px;
  color: #606266;
  font-family: monospace;
  font-weight: 500;
}

.progress-slider {
  flex-grow: 1;
  margin: 0 15px;
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
  transition: transform 0.3s ease, box-shadow 0.3s ease;
  width: 16px;
  height: 16px;
}

.progress-slider :deep(.el-slider__button:hover) {
  transform: scale(1.2);
  box-shadow: 0 0 0 8px rgba(64, 158, 255, 0.1);
}

.control-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 50px;
  margin: 25px 0;
}

.control-icon {
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.control-icon:hover {
  color: #409EFF;
  transform: scale(1.2);
}

.play-icon {
  font-size: 36px;
  color: #409EFF;
}

.lyrics-container {
  margin-top: 40px;
  width: 100%;
  background: #f9fafc;
  padding: 28px;
  border-radius: 20px;
  box-shadow: 0 5px 20px rgba(0, 0, 0, 0.08);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  animation: fadeIn 1s ease 0.3s both;
}

.lyrics-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #303133;
  font-weight: 600;
  position: relative;
  padding-left: 15px;
}

.lyrics-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 24px;
  background: linear-gradient(to bottom, #409EFF, #53a8ff);
  border-radius: 3px;
}

.lyrics-scroll {
  height: 320px;
  overflow-y: auto;
  padding: 25px 20px;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 16px;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  scroll-behavior: smooth;
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
  margin: 18px 0;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  opacity: 0.7;
  text-align: center;
  padding: 12px 30px;
  line-height: 1.5;
  cursor: pointer;
  color: #606266;
  border-radius: 8px;
}

.lyrics-scroll p:hover {
  opacity: 0.9;
  background: rgba(255, 255, 255, 0.7);
}

.active-lyric {
  font-size: 18px !important;
  font-weight: 600;
  color: #409EFF !important;
  opacity: 1 !important;
  transform: scale(1.08) !important;
  background: rgba(255, 255, 255, 0.95) !important;
  box-shadow: 0 4px 15px rgba(64, 158, 255, 0.15) !important;
}

/* 优化滚动条样式 */
.lyrics-scroll::-webkit-scrollbar {
  width: 6px;
}

.lyrics-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.lyrics-scroll::-webkit-scrollbar-thumb {
  background: rgba(64, 158, 255, 0.2);
  border-radius: 3px;
  transition: background-color 0.3s;
}

.lyrics-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(64, 158, 255, 0.4);
}

.no-lyrics {
  text-align: center;
  color: #909399;
  margin-top: 120px;
  font-size: 16px;
  font-style: italic;
}

/* 响应式调整 */
@media (max-width: 992px) {
  .content-container {
    width: 95%;
    padding: 25px;
  }
  
  .song-info-container {
    gap: 30px;
  }
  
  .cover-container {
    width: 280px;
    height: 280px;
  }
  
  .song-title {
    font-size: 30px;
  }
}

@media (max-width: 768px) {
  .content-container {
    padding: 20px;
  }
  
  .song-info-container {
    flex-direction: column;
    align-items: center;
  }
  
  .cover-container {
    width: 220px;
    height: 220px;
    margin-bottom: 25px;
  }
  
  .info-text {
    text-align: center;
  }
  
  .action-buttons {
    justify-content: center;
  }
  
  .song-description {
    padding: 15px;
  }
  
  .lyrics-scroll {
    height: 250px;
    padding: 15px;
  }
  
  .player-controls, .lyrics-container {
    padding: 20px;
  }
  
  .control-buttons {
    gap: 30px;
  }
}

/* 添加动画 */
@keyframes fadeIn {
  from { 
    opacity: 0; 
    transform: translateY(20px);
  }
  to { 
    opacity: 1; 
    transform: translateY(0);
  }
}

@keyframes slideIn {
  from { 
    transform: translateX(-20px);
    opacity: 0;
  }
  to { 
    transform: translateX(0);
    opacity: 1;
  }
}
</style> 