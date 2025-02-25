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
        <div class="cover-container">
          <img :src="song.picUrl" alt="歌曲封面" class="song-cover" />
          <div class="disc-animation" :class="{ 'playing': isPlaying }"></div>
        </div>
        
        <div class="info-text">
          <h1 class="song-title">{{ song.name }}</h1>
          <p class="artist">歌手：{{ song.singer }}</p>
          <p class="album" v-if="song.album">专辑：{{ song.album }}</p>
          
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
export default {
  name: 'SongDetailPage',
  props: {
    id: {
      type: [String, Number],
      required: true
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
        lyrics: ''
      },
      isPlaying: false,
      isLiked: false,
      currentTime: 0,
      duration: 0,
      progressPercentage: 0,
      parsedLyrics: [],
      currentLyricIndex: -1
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
        this.scrollToActiveLyric();
      }
    }
  },
  methods: {
    // 获取歌曲详情
    async fetchSongDetail(id) {
      try {
        // 这里应替换为实际的API调用
        // const response = await this.$http.get(`/api/song/detail?id=${id}`);
        // this.song = response.data;
        
        // 模拟获取的歌曲数据
        setTimeout(() => {
          this.song = {
            id: id,
            name: '示例歌曲名称',
            singer: '示例歌手',
            album: '示例专辑',
            picUrl: 'https://placekitten.com/500/500', // 使用占位图
            url: 'https://example.com/song.mp3', // 实际项目中替换为真实URL
            lyrics: '[00:00.00]示例歌词\n[00:03.00]这是第二行歌词\n[00:06.00]这是第三行歌词\n[00:09.00]这是示例歌词的第四行\n[00:12.00]继续显示更多歌词行\n[00:15.00]让我们显示多一些的歌词\n[00:18.00]以便于测试滚动效果\n[00:21.00]这首歌非常好听\n[00:24.00]希望用户会喜欢这个界面\n[00:27.00]设计简洁易于使用'
          };
          this.parseLyrics();
          
          // 检查用户是否已收藏
          this.checkIfLiked();
        }, 500);
      } catch (error) {
        console.error('获取歌曲详情失败', error);
        this.$message.error('加载歌曲信息失败，请重试');
      }
    },
    
    // 解析歌词
    parseLyrics() {
      if (!this.song.lyrics) {
        this.parsedLyrics = [];
        return;
      }
      
      const lines = this.song.lyrics.split('\n');
      const timeRegex = /\[(\d{2}):(\d{2})\.(\d{2})\]/;
      
      this.parsedLyrics = lines
        .map(line => {
          const match = timeRegex.exec(line);
          if (!match) return null;
          
          const minutes = parseInt(match[1]);
          const seconds = parseInt(match[2]);
          const milliseconds = parseInt(match[3]);
          
          const time = minutes * 60 + seconds + milliseconds / 100;
          const text = line.replace(timeRegex, '').trim();
          
          return { time, text };
        })
        .filter(item => item !== null)
        .sort((a, b) => a.time - b.time);
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
    
    // 喜欢/收藏控制
    async toggleLike() {
      try {
        // 这里应替换为实际的API调用
        // await this.$http.post(`/api/song/like`, { id: this.song.id, like: !this.isLiked });
        this.isLiked = !this.isLiked;
        this.$message.success(this.isLiked ? '已添加到我喜欢的音乐' : '已取消喜欢');
      } catch (error) {
        console.error('操作失败', error);
        this.$message.error('操作失败，请重试');
      }
    },
    
    // 检查是否已收藏
    async checkIfLiked() {
      try {
        // 这里应替换为实际的API调用
        // const response = await this.$http.get(`/api/user/like/check?id=${this.song.id}`);
        // this.isLiked = response.data.isLiked;
        
        // 模拟API结果
        this.isLiked = Math.random() > 0.5;
      } catch (error) {
        console.error('检查收藏状态失败', error);
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
    scrollToActiveLyric() {
      if (!this.$refs.lyricLines || this.currentLyricIndex === -1) return;
      
      this.$nextTick(() => {
        const container = this.$refs.lyricsContainer;
        const activeElement = this.$refs.lyricLines[this.currentLyricIndex];
        
        if (container && activeElement) {
          container.scrollTop = activeElement.offsetTop - container.offsetHeight / 2 + activeElement.offsetHeight / 2;
        }
      });
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
      this.$router.go(-1);
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
  color: #fff;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(20px);
  z-index: 1;
}

.content-container {
  position: relative;
  z-index: 2;
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 30px 0;
}

.back-button {
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 30px;
  display: inline-flex;
  align-items: center;
  transition: color 0.3s;
}

.back-button:hover {
  color: #409EFF;
}

.song-info-container {
  display: flex;
  margin-bottom: 40px;
  gap: 40px;
}

.cover-container {
  position: relative;
  flex-shrink: 0;
  width: 300px;
  height: 300px;
}

.song-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 8px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  color: #e6e6e6;
}

.action-buttons {
  margin-top: 25px;
  display: flex;
  gap: 15px;
}

.player-controls {
  margin: 30px 0;
  width: 100%;
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
}

.time-info {
  width: 50px;
  font-size: 14px;
  color: #e6e6e6;
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
  transition: all 0.3s;
}

.control-icon:hover {
  color: #409EFF;
  transform: scale(1.1);
}

.play-icon {
  font-size: 32px;
}

.lyrics-container {
  margin-top: 40px;
  width: 100%;
}

.lyrics-title {
  font-size: 24px;
  margin-bottom: 20px;
}

.lyrics-scroll {
  height: 300px;
  overflow-y: auto;
  padding: 15px;
  background-color: rgba(255, 255, 255, 0.1);
  border-radius: 8px;
}

.lyrics-scroll p {
  font-size: 16px;
  margin: 16px 0;
  transition: all 0.3s;
  opacity: 0.7;
  text-align: center;
}

.active-lyric {
  font-size: 18px !important;
  font-weight: bold;
  color: #409EFF;
  opacity: 1 !important;
}

.no-lyrics {
  text-align: center;
  color: #999;
  margin-top: 100px;
}

/* 自定义滚动条样式 */
.lyrics-scroll::-webkit-scrollbar {
  width: 6px;
}

.lyrics-scroll::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 3px;
}

.lyrics-scroll::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
}

.lyrics-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .song-info-container {
    flex-direction: column;
    align-items: center;
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
}
</style> 