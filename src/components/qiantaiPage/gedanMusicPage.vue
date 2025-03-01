<template>
  <div class="gedan-music-container">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button type="text" icon="el-icon-arrow-left" @click="onBack">返回歌单列表</el-button>
    </div>

    <!-- 歌单信息头部 -->
    <div class="gedan-header">
      <div class="gedan-cover">
        <img :src="gedanCover" alt="歌单封面" class="cover-image" />
      </div>
      <div class="gedan-info">
        <h1 class="gedan-title">{{ gedanTitle }}</h1>
        <p class="gedan-creator">创建者: {{ gedanCreator }}</p>
        <p class="gedan-desc">共{{ songs.length }}首歌曲</p>
        <div class="gedan-description" v-if="gedanDescription">
          <p class="description-title">歌单介绍:</p>
          <p class="description-content">{{ gedanDescription }}</p>
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="music-list">
      <!-- 表头 -->
      <div class="header">
        <span class="song-title">歌曲标题</span>
        <span class="song-duration">时长</span>
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
        <!-- 歌曲信息 -->
        <div class="song-info" @click="navigateToSongDetail(song)" style="cursor: pointer;">
          <span class="order">{{ index + 1 }}</span>
          <div class="cover-container">
            <img
              :src="imagePath(song)"
              alt="音乐封面"
              class="music-cover"
            />
          </div>
          <span class="title">{{ song.name }}</span>
        </div>

        <!-- 播放控件 -->
        <div class="song-duration">
          <audio controls class="audio-player" @play="handlePlay">
            <source :src="getFullAudioPath(song.audioPath)" type="audio/mpeg">
          </audio>
        </div>

        <!-- 歌手信息 -->
        <div class="song-artist">
          <span v-for="(singer, idx) in song.singers" :key="singer.id" class="artist-info">
            {{ singer.name }}{{ idx < song.singers.length - 1 ? '/' : '' }}
          </span>
        </div>

        <!-- 收藏按钮 -->
        <div class="song-actions">
          <i
            :class="[
              song.favorited == 1 ? 'el-icon-star-on red' : 'el-icon-star-off',
              'favorite-icon',
              { 'animate-favorite': song.isAnimating }
            ]"
            @click="onFavitory(song)"
          ></i>
        </div>
      </div>

      <!-- 添加分页组件 -->
      <Pagination
        :total="totalSongs"
        :page-size="pageSize"
        :current-page.sync="currentPage"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import api from "@/api/axios";
import Pagination from '@/components/com/Pagination.vue'

export default {
  components: {
    Pagination
  },
  props: {
    geDanId: String,
    queryStr: String,
    index: Number,
  },

  watch: {
    queryStr(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.initData(newVal);
    },
    geDanId(newVal, oldVal) {
      console.log(`geDanId changed from ${oldVal} to ${newVal}`);
      this.initData();
      this.fetchGedanInfo();
    }
  },

  data() {
    return {
      songs: [],
      user: {},
      currentAudio: null,  // 当前播放的音频元素
      gedanTitle: "精选歌单",
      gedanCover: require('@/assets/1740221844832.jpg'),
      gedanCreator: "音乐爱好者",
      gedanDescription: "",
      currentPage: 1,
      pageSize: 10,
      totalSongs: 0
    }
  },
  
  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    this.initData();
    this.fetchGedanInfo();
  },
  
  methods: {
    fetchGedanInfo() {
      // 如果有歌单ID，获取歌单详情
      if (this.geDanId) {
        api.post(`/api/music/gedanList/`, {geDanId:this.geDanId}).then(res => {
          if (res.list.length > 0) {
            this.gedanTitle = res.list[0].name || "精选歌单";
            this.gedanCover = res.list[0].urlPath ? this.fullImagePath(res.list[0].urlPath) : require('@/assets/1740221844832.jpg');
            this.gedanCreator = res.list[0].creator || "音乐爱好者";
            this.gedanDescription = res.list[0].content || "";
          }
        }).catch(err => {
          console.error('获取歌单信息失败:', err);
        });
      }
    },
    
    imagePath(item) {
      return item.musicPath ? this.fullImagePath(item.musicPath) : require('@/assets/1740221844832.jpg');
    },
    
    handlePlay(event) {
      // 如果有正在播放的音频且不是当前音频
      if (this.currentAudio && this.currentAudio !== event.target) {
        this.currentAudio.pause();  // 暂停其他音频
      }
      this.currentAudio = event.target;  // 记录当前播放的音频
    },
    
    onFavitory(song) {
      // 设置动画标志
      this.$set(song, 'isAnimating', true);
      
      let url = song.favorited == '1' ? '/api/music/deleteFavorites/' : '/api/music/favorites/';
      api.post(url, {
        musicId: song.id,
        userId: this.user.id,
      }).then(res => {
        song.favorited = song.favorited == '1' ? 0 : 1;
        this.$emit("收藏成功");
        
        // 动画结束后移除动画类
        setTimeout(() => {
          song.isAnimating = false;
        }, 500);
        
        this.initData();
      }).catch(err => {
        console.error('请求失败:', err);
        song.isAnimating = false;
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
    
    onBack() {
      this.$emit("onGeDan", this.index);
    },
    
    handlePageChange(page) {
      this.currentPage = page;
      this.initData();
    },
    
    initData() {
      let params = {
        pageNum: this.currentPage,
        pageSize: this.pageSize,
        userId: this.user.id,
      };
      
      if (this.queryStr) {
        params.queryStr = this.queryStr;
      }
      
      if (this.geDanId) {
        params.gedanId = this.geDanId;
      }
      
      api.post('/api/music/list/', params).then(res => {
        this.songs = res.list;
        this.totalSongs = res.total; // 更新总数
      }).catch(err => {
        console.error('请求失败:', err);
        this.songs = [];
        this.totalSongs = 0;
      });
    },
    
    // 添加导航到歌曲详情页的方法
    navigateToSongDetail(song) {
      // 通过事件机制触发跳转
      console.log("[gedanMusicPage] 触发歌曲详情跳转事件，歌曲ID:", song.id);
      this.$emit("onGoToSongDetail", song.id);
    },
  }
}
</script>

<style scoped>
.gedan-music-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.back-button {
  text-align: left;
  margin-bottom: 20px;
}

/* 歌单头部样式 */
.gedan-header {
  display: flex;
  margin-bottom: 30px;
  background: #f8f9fa;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

.gedan-cover {
  width: 200px;
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 30px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.15);
}

.cover-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.gedan-info {
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  flex: 1;
}

.gedan-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 10px;
  color: #303133;
}

.gedan-creator {
  color: #606266;
  margin: 5px 0;
}

.gedan-desc {
  color: #606266;
  margin: 5px 0;
}

.gedan-description {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #ebeef5;
}

.description-title {
  font-size: 16px;
  color: #606266;
  margin-bottom: 10px;
  font-weight: 500;
}

.description-content {
  font-size: 14px;
  color: #909399;
  line-height: 1.6;
  white-space: pre-wrap;
  max-height: 80px;
  overflow-y: auto;
  padding-right: 10px;
}

/* 自定义滚动条样式 */
.description-content::-webkit-scrollbar {
  width: 6px;
}

.description-content::-webkit-scrollbar-thumb {
  background-color: #dcdfe6;
  border-radius: 3px;
}

.description-content::-webkit-scrollbar-track {
  background-color: #f2f6fc;
}

/* 音乐列表样式 */
.music-list {
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

/* 歌曲项布局 */
.song-item {
  display: grid;
  grid-template-columns: 4fr 2fr 2fr 1fr;
  align-items: center;
  padding: 15px 20px;
  transition: background 0.3s;
  border-bottom: 1px solid #f0f0f0;
}

.song-item:hover {
  background: #f5f7fa;
}

.even-row {
  background-color: #fafafa;
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
}

.song-info:hover {
  transform: translateX(10px);
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
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放器样式 */
.audio-player {
  width: 180px;
  height: 36px;
}

.audio-player::-webkit-media-controls-panel {
  background: #f5f7fa;
}

.audio-player::-webkit-media-controls-play-button {
  filter: brightness(0.8);
}

/* 歌手信息 */
.song-artist {
  display: flex;
  flex-wrap: wrap;
}

.artist-info {
  color: #606266;
  font-size: 14px;
  margin-right: 5px;
}

/* 收藏图标 */
.favorite-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;
  display: flex;
  justify-content: center;
}

.animate-favorite {
  animation: favorite-animation 0.5s ease;
}

@keyframes favorite-animation {
  0% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.3);
  }
  100% {
    transform: scale(1);
  }
}

.red {
  color: #ff4757;
}

.el-icon-star-off {
  color: #ccc;
}

.el-icon-star-off:hover {
  color: #ff4757;
  transform: scale(1.1);
}

/* 响应式处理 */
@media (max-width: 768px) {
  .gedan-header {
    flex-direction: column;
    padding: 20px;
  }
  
  .gedan-cover {
    margin-right: 0;
    margin-bottom: 20px;
  }
  
  .gedan-description {
    margin-top: 15px;
    padding-top: 15px;
  }
  
  .description-content {
    max-height: 120px;
  }
  
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
  
  .song-artist, .song-actions {
    justify-content: center;
    margin-top: 10px;
  }
}

/* 可以添加一些过渡动画 */
.song-item {
  transition: all 0.3s ease-in-out;
}

.song-item-enter-active, .song-item-leave-active {
  transition: all 0.3s;
}

.song-item-enter, .song-item-leave-to {
  opacity: 0;
  transform: translateY(30px);
}
</style>