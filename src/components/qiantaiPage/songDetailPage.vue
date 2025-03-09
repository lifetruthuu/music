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
import BehaviorService from "@/services/BehaviorService";

export default {
  name: 'SongDetailPage',
  props: {
    id: {
      type: [String, Number],
      required: true
    },
    userId: {
      type: [String, Number],
      default: null
    },
    fromGedan: {
      type: Boolean,
      default: false
    },
    fromSinger: {
      type: Boolean,
      default: false
    },
    fromMyMusic: {
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
      user: "",
      startPlayTime: null // 添加播放开始时间记录
    }
  },
  computed: {
    backgroundStyle() {
      // 使用浅灰色为主基调的背景
      return {
        background: '#f9f9f9',
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
    userId: {
      immediate: true,
      handler(newUserId) {
        console.log("[songDetailPage] userId prop变化:", newUserId);
        if (newUserId) {
          const userString = localStorage.getItem('user');
          let parsedUser = null;
          
          // 解析localStorage中的用户数据
          if (userString) {
            try {
              parsedUser = JSON.parse(userString);
              // 用传入的userId覆盖其id属性
              parsedUser.id = newUserId;
              this.user = parsedUser;
            } catch (e) {
              console.error("解析localStorage中的用户数据失败", e);
              // 如果解析失败，至少保证有id
              this.user = { id: newUserId };
            }
          } else {
            // 如果没有localStorage数据，使用简单对象
            this.user = { id: newUserId };
          }
          
          console.log("[songDetailPage] 更新用户对象:", this.user);
          
          // 如果已经加载了歌曲，可能需要重新获取详情以更新喜欢状态等
          if (this.song && this.song.id) {
            this.fetchSongDetail(this.song.id);
          }
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
    console.log("[songDetailPage] created钩子执行, props userId:", this.userId);
    
    const userString = localStorage.getItem('user');
    let parsedUser = null;
    
    // 解析localStorage中的用户数据
    if (userString) {
      try {
        parsedUser = JSON.parse(userString);
        console.log("[songDetailPage] 从localStorage解析到用户:", parsedUser.id);
      } catch (e) {
        console.error("[songDetailPage] 解析localStorage中的用户数据失败", e);
      }
    } else {
      console.warn("[songDetailPage] localStorage中没有user数据");
    }
    
    // 优先使用props中传入的userId，但保留完整的用户对象属性
    if (this.userId) {
      console.log("[songDetailPage] 使用props传入的userId:", this.userId);
      // 如果有parsedUser，用传入的userId覆盖其id属性
      if (parsedUser) {
        parsedUser.id = this.userId;
        this.user = parsedUser;
      } else {
        // 如果没有完整的用户对象，至少确保有id
        this.user = { id: this.userId };
      }
    } else if (parsedUser) {
      // 如果没有传入userId但有localStorage数据，使用localStorage数据
      console.log("[songDetailPage] 没有props userId，使用localStorage中的用户ID:", parsedUser.id);
      this.user = parsedUser;
    } else {
      // 兜底：创建一个默认用户对象，避免undefined错误
      console.error("[songDetailPage] 无法获取用户信息，使用默认值");
      this.user = { id: 1 }; // 使用默认ID
    }
    
    console.log("[songDetailPage] 初始化完成，用户对象:", this.user);
    console.log("[songDetailPage] 初始化，来源: ", this.fromGedan ? "歌单" : this.fromSinger ? "歌手详情" : this.fromMyMusic ? "我的音乐" : "其他");
    console.log("[songDetailPage] 用户ID: ", this.user.id);
  },
  methods: {
    // 获取歌曲详情
    async fetchSongDetail(id) {
      try {
        // 确保在发送请求前有user对象和用户ID
        if (!this.user || !this.user.id) {
          console.warn("[songDetailPage] fetchSongDetail时用户ID不存在，尝试从props获取");
          if (this.userId) {
            this.user = { id: this.userId };
          } else {
            console.error("[songDetailPage] 无法获取用户ID，请求可能会失败");
          }
        }
        
        console.log("[songDetailPage] 请求歌曲详情，歌曲ID:", id, "用户ID:", this.user.id);
        const response = await api.post('/api/music/detail/', { musicId: id, userId: this.user.id });
        console.log("[songDetailPage] 歌曲详情响应:", response);
        
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
        console.error('[songDetailPage] 获取歌曲详情失败', error);
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
      } else if (this.fromMyMusic) {
        console.log("[songDetailPage] 触发返回我的音乐事件");
        this.$emit("onBackToMyMusic");
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
        // 记录暂停行为
        if (this.startPlayTime) {
          const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
          const completionRate = this.duration ? duration / this.duration : 0;
          BehaviorService.recordPlay(this.song, this.user.id, 'pause', duration, completionRate);
          BehaviorService.recordBehavior({
            userId: this.user.id,
            musicId: this.song.id,
            action_type: 'pause',
            play_duration: duration,
            play_completion_rate: completionRate
          });
        }
      } else {
        audio.play().catch(error => {
          console.error('播放失败', error);
          this.$message.error('播放失败，请检查网络连接');
        });
        // 记录播放开始时间
        this.startPlayTime = new Date();
        // 记录播放行为
        BehaviorService.recordPlay(this.song, this.user.id, 'play');
        BehaviorService.recordBehavior({
          userId: this.user.id,
          musicId: this.song.id,
          action_type: 'play'
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
          // 记录喜欢/不喜欢行为
          BehaviorService.recordBehavior({
            userId: this.user.id,
            musicId: this.song.id,
            action_type: this.isLiked ? 'unfavorite' : 'favorite'
          });
          
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
      // 记录播放完成行为
      if (this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        BehaviorService.recordPlay(this.song, this.user.id, 'complete', duration, 1.0);
        BehaviorService.recordBehavior({
          userId: this.user.id,
          musicId: this.song.id,
          action_type: 'complete',
          play_duration: duration,
          play_completion_rate: 1.0
        });
        this.startPlayTime = null;
      }
      
      this.isPlaying = false;
      this.nextSong();
    },
    
    // 进度条控制
    onProgressChange(value) {
      const audio = this.$refs.audioPlayer;
      const newTime = (value / 100) * this.duration;
      audio.currentTime = newTime;
      this.currentTime = newTime;
      
      // 记录跳转行为
      BehaviorService.recordBehavior({
        userId: this.user.id,
        musicId: this.song.id,
        action_type: 'seek',
        position: value / 100 // 记录跳转到的位置百分比
      });
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
      // 记录跳过行为
      if (this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = this.duration ? duration / this.duration : 0;
        BehaviorService.recordPlay(this.song, this.user.id, 'skip', duration, completionRate);
        BehaviorService.recordBehavior({
          userId: this.user.id,
          musicId: this.song.id,
          action_type: 'skip',
          play_duration: duration,
          play_completion_rate: completionRate,
          skip_direction: 'previous'
        });
        this.startPlayTime = null;
      }
      
      // 这里应实现切换到上一首歌曲的逻辑
      this.$message.info('切换到上一首');
    },
    
    nextSong() {
      // 记录跳过行为
      if (this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = this.duration ? duration / this.duration : 0;
        BehaviorService.recordPlay(this.song, this.user.id, 'skip', duration, completionRate);
        BehaviorService.recordBehavior({
          userId: this.user.id,
          musicId: this.song.id,
          action_type: 'skip',
          play_duration: duration,
          play_completion_rate: completionRate,
          skip_direction: 'next'
        });
        this.startPlayTime = null;
      }
      
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
    // 组件销毁前停止播放并记录
    if (this.$refs.audioPlayer) {
      if (this.isPlaying && this.startPlayTime) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = this.duration ? duration / this.duration : 0;
        BehaviorService.recordPlay(this.song, this.user.id, 'interrupt', duration, completionRate);
        BehaviorService.recordBehavior({
          userId: this.user.id,
          musicId: this.song.id,
          action_type: 'interrupt',
          play_duration: duration,
          play_completion_rate: completionRate
        });
      }
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
  color: #333333;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f9f9f9; /* 修改为浅灰色背景，减轻白色背景的视觉冲击 */
}

.overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(0px);
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
  background: #ffffff;
  border-radius: 20px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.05); /* 减小阴影强度，使视觉更柔和 */
}

.back-button {
  cursor: pointer;
  font-size: 16px;
  margin-bottom: 30px;
  display: inline-flex;
  align-items: center;
  transition: color 0.3s;
  animation: slideIn 0.4s ease-out;
  color: #333333;
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
  color: #333333;
}

.artist, .album {
  font-size: 18px;
  margin: 5px 0;
  color: #666666; /* 中等灰色，确保在白色背景上清晰可见 */
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

.action-buttons .el-button {
  transition: all 0.3s ease;
}

.action-buttons .el-button:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.player-controls {
  margin: 30px 0;
  width: 100%;
  background: #ffffff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); /* 减轻阴影 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.player-controls:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05); /* 减轻悬停状态阴影 */
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
  background: #ffffff;
  padding: 25px;
  border-radius: 16px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.03); /* 减轻阴影 */
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.lyrics-title {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333333;
}

.lyrics-scroll {
  height: 300px;
  overflow-y: auto;
  padding: 20px;
  background-color: #f9f9f9;
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
  box-shadow: inset 0 0 6px rgba(0, 0, 0, 0.02); /* 减轻内阴影 */
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
  color: #555555; /* 更改为深灰色 */
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
  background: rgba(0, 0, 0, 0.05);
  border-radius: 3px;
}

.lyrics-scroll::-webkit-scrollbar-thumb {
  background: rgba(0, 0, 0, 0.2);
  border-radius: 3px;
  transition: background-color 0.3s;
}

.lyrics-scroll::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 0, 0, 0.3);
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
  background: #ffffff;
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

.song-description {
  margin: 20px 0;
  padding: 15px;
  background: #f9f9f9;
  border-radius: 12px;
  border-left: 4px solid #409EFF;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.03); /* 添加轻微阴影 */
}

.song-description:hover {
  transform: translateX(5px);
  background: #f5f5f5;
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
  color: #555555; /* 更深的灰色，更易读 */
  line-height: 1.6;
  text-align: justify;
}

.lyrics-content {
  width: 100%;
  max-width: 600px;
  line-height: 1.8;
  white-space: pre-wrap;
  animation: fadeIn 0.5s ease-out;
  color: #555555; /* 灰色文本，适合白色背景 */
}
</style> 