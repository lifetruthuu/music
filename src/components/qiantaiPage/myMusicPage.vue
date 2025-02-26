<template>
  <div class="music-list-container">
    <!-- 表头 -->
    <div class="header">
      <span class="song-title">歌曲</span>
      <span class="song-duration">播放</span>
      <span class="song-artist">歌手</span>
      <span class="song-actions">收藏</span>
    </div>

    <!-- 歌曲列表 -->
    <div 
      class="song-item" 
      v-for="(song, index) in songs" 
      :key="index"
      :class="{ 'even-row': index % 2 === 1 }"
    >
      <div class="song-info" @click="playSong(song, index)">
        <span class="order">{{ index + 1 }}</span>
        <div class="cover-container">
          <img
            :src="fullImagePath(song.musicPath)"
            alt="音乐封面"
            class="music-cover"
          />
          <div class="play-icon-overlay">
            <i class="el-icon-video-play"></i>
          </div>
        </div>
        <span class="title">{{ song.name }}</span>
      </div>

      <div class="song-duration">
        <!-- <span class="duration-text">{{ formatDuration(song.duration) }}</span> -->
        <i 
          :class="[
            currentSong?.id === song.id && isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play',
            'play-btn'
          ]"
          @click="togglePlay(song, index)"
        ></i>
      </div>

      <span class="artist-info">{{song.singerNames}}</span>

      <div class="song-actions">
        <i
          :class="[
            'el-icon-star-on red favorite-icon',
            { 'animate-favorite': song.isAnimating }
          ]"
          @click="confirmUnfavorite(song)"
        ></i>
      </div>
    </div>

    <!-- 添加播放器组件 -->
    <audio-player
      :show.sync="showPlayer"
      :current-song="currentSong"
      :playlist="songs"
      :current-index="currentIndex"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleAudioEnded"
      @change-song="handleChangeSong"
      @progress-update="handleProgressUpdate"
      ref="player"
    />

    <!-- 确认取消收藏弹窗 -->
    <el-dialog
      title="取消收藏"
      :visible.sync="dialogVisible"
      width="30%"
      custom-class="unfavorite-dialog"
      :show-close="false"
      center
    >
      <div class="dialog-content">
        <i class="el-icon-warning-outline warning-icon"></i>
        <p>确定要取消收藏这首歌曲吗？</p>
        <p class="song-name">《{{ currentSong?.name }}》</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="dialogVisible = false">取 消</el-button>
        <el-button type="danger" @click="handleUnfavorite">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from "@/api/axios";
import AudioPlayer from '@/components/com/AudioPlayer.vue';

export default {
  components: {
    AudioPlayer
  },
  props:{
    singerId: String,
    queryStr:String,
  },
  data(){
    return{
      songs: [],
      user:{},
      currentAudio: null,  // 当前播放的音频元素
      dialogVisible: false,
      currentSong: null,
      showPlayer: false,
      currentIndex: -1,
      progress: 0,
      isPlaying: false,
      mouseY: 0,
      windowHeight: window.innerHeight
    }
  },

  watch: {
    queryStr(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.initData(newVal);
    }
  },

  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    this.initData();
  },

  mounted() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  },

  methods:{
    confirmUnfavorite(song) {
      this.currentSong = song;
      this.dialogVisible = true;
    },

    handleUnfavorite() {
      if (!this.currentSong) return;
      
      // 设置动画标志
      this.$set(this.currentSong, 'isAnimating', true);

      api.post('/api/music/deleteFavorites/', {
        musicId: this.currentSong.id,
        userId: this.user.id,
      }).then(res => {
        this.$message({
          type: 'success',
          message: '已取消收藏'
        });
        
        // 动画结束后移除动画类
        setTimeout(() => {
          if (this.currentSong) {
            this.currentSong.isAnimating = false;
          }
        }, 500);
        
        this.dialogVisible = false;
        this.initData();
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('取消收藏失败');
        if (this.currentSong) {
          this.currentSong.isAnimating = false;
        }
      });
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    getFullAudioPath(path) {
      // 拼接完整的音频文件 URL
      return `http://localhost:8000${path}`;
    },
    handlePlay(event) {
      this.isPlaying = true;
    },
    handleAudioEnded() {
      this.playNext();
    },
    handleChangeSong(index) {
      if (index >= 0 && index < this.songs.length) {
        this.currentIndex = index;
        this.currentSong = this.songs[index];
        this.showPlayer = true;
        
        // 记录播放历史
        this.recordPlayHistory(this.currentSong.id);
      }
    },
    handleProgressUpdate(progress) {
      this.progress = progress;
    },
    playNext() {
      if (this.currentIndex < this.songs.length - 1) {
        this.handleChangeSong(this.currentIndex + 1);
      }
    },
    recordPlayHistory(musicId) {
      api.post('/api/music/play/', {
        userId: this.user.id,
        musicId: musicId,
      }).catch(err => {
        console.error('记录播放历史失败:', err);
      });
    },
    initData() {
      api.post('/api/music/myMusic/', {
        pageNum: 1,
        pageSize: 1000,
        singerId: this.singerId,
        userId: this.user.id,
        queryStr:this.queryStr,
      }).then(res => {
        this.songs = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
        this.songs = [];
      });
    },
    playSong(song, index) {
      this.currentIndex = index;
      this.currentSong = song;
      this.showPlayer = true;
      this.$nextTick(() => {
        this.$refs.player?.play();
      });
      this.recordPlayHistory(song.id);
    },
    togglePlay(song, index) {
      if (this.currentSong?.id === song.id) {
        if (this.isPlaying) {
          this.$refs.player?.pause();
        } else {
          this.$refs.player?.play();
        }
      } else {
        this.playSong(song, index);
      }
    },
    handlePause() {
      this.isPlaying = false;
    },
    handleMouseMove(event) {
      this.mouseY = event.clientY;
      this.showPlayer = (this.windowHeight - this.mouseY) < 100 || this.isPlaying;
    },
    handleResize() {
      this.windowHeight = window.innerHeight;
    },
    formatDuration(duration) {
      if (!duration) return '00:00';
      const minutes = Math.floor(duration / 60);
      const seconds = Math.floor(duration % 60);
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
  }
}
</script>

<style scoped>
/* 容器样式 */
.music-list-container {
  width: 100%;
  max-width: 1200px;
  margin: 20px auto;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* 表头样式 */
.header {
  display: grid;
  grid-template-columns: 4fr 2fr 2fr 1fr;
  padding: 16px 20px;
  background: #f8f9fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

/* 歌曲项样式 */
.song-item {
  display: grid;
  grid-template-columns: 4fr 2fr 2fr 1fr;
  align-items: center;
  padding: 15px 20px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
}

.song-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.even-row {
  background-color: #fafafa;
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.song-info:hover {
  color: #409EFF;
}

.order {
  width: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.cover-container {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.music-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.music-cover:hover {
  transform: scale(1.1);
}

.title {
  font-size: 16px;
  font-family: 'STXinwei';
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放器样式 */
.audio-player {
  width: 180px;
  height: 36px;
}

/* 收藏图标样式 */
.favorite-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;
}

.animate-favorite {
  animation: favorite-animation 0.5s ease;
}

@keyframes favorite-animation {
  0% { transform: scale(1); }
  50% { transform: scale(1.3); }
  100% { transform: scale(1); }
}

.red {
  color: #ff4757;
}

/* 确认弹窗样式 */
.unfavorite-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #ff4757;
  margin-bottom: 20px;
}

.song-name {
  color: #606266;
  font-size: 16px;
  margin-top: 10px;
  font-weight: bold;
}

.dialog-footer {
  text-align: center;
  margin-top: 20px;
}

/* 播放器控制样式 */
.play-icon-overlay {
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

.song-info:hover .play-icon-overlay {
  opacity: 1;
}

.play-icon-overlay i {
  color: white;
  font-size: 24px;
}

.song-duration {
  display: flex;
  align-items: center;
  gap: 10px;
}

.duration-text {
  color: #606266;
  font-size: 14px;
}

.play-btn {
  cursor: pointer;
  color: #409EFF;
  font-size: 20px;
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.1);
  color: #66b1ff;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .header, .song-item {
    grid-template-columns: 1fr;
    padding: 15px;
  }

  .song-info {
    margin-bottom: 15px;
  }

  .audio-player {
    width: 100%;
    margin: 10px 0;
  }

  .duration-text {
    font-size: 12px;
  }

  .play-btn {
    font-size: 18px;
  }
}
</style>