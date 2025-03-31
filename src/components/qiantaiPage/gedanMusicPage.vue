<template>
  <div class="gedan-music-container">
    <!-- 返回按钮 -->
    <div class="back-button">
      <el-button type="text" icon="el-icon-arrow-left" @click="onBack">返回歌单列表</el-button>
    </div>

    <!-- 歌单信息头部 -->
    <div class="gedan-header" v-loading="loadingGedan" element-loading-text="加载歌单信息中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
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
        
        <!-- 添加评论组件 -->
        <div class="header-comment-section">
          <CommentSection
            v-if="geDanId"
            :target-id="geDanId"
            target-type="gedan"
            :show-rating="true"
          />
        </div>
      </div>
    </div>

    <!-- 歌曲列表 -->
    <div class="music-list" v-loading="loading" element-loading-text="加载歌曲中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
      <!-- 表头 -->
      <div class="header">
        <span class="song-title">歌曲标题</span>
        <span class="song-duration">时长</span>
        <span class="song-type">类型</span>
        <span class="song-artist">歌手</span>
        <span class="song-actions">收藏</span>
      </div>

      <!-- 歌曲列表 -->
      <transition-group name="song-item" tag="div" class="song-list-container">
        <div 
          class="song-item" 
          v-for="(song, index) in songs" 
          :key="song.id || index"
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

          <!-- 时长显示 -->
          <div class="song-duration">
            <span class="duration-text">{{ formatTime(song.time) || formatDuration(song.duration) }}</span>
          </div>

          <!-- 类型信息 -->
          <div class="song-type">
            <span v-if="song.types && song.types.length > 0" class="type-tag">{{ song.typeName || (song.types && song.types.length > 0 ? song.types[0].name : '') }}</span>
            <span v-else>-</span>
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
              @click="onFavority(song)"
            ></i>
          </div>
        </div>
      </transition-group>

      <!-- 添加分页组件 -->
      <div class="pagination-container">
        <Pagination
          :total="totalSongs"
          :page-size="pageSize"
          :current-page.sync="currentPage"
          @change="handlePageChange"
        />
      </div>
    </div>
  </div>
</template>

<script>
import api from "@/api/axios";
import Pagination from '@/components/com/Pagination.vue'
import CommentSection from '@/components/com/CommentSection.vue'

export default {
  components: {
    Pagination,
    CommentSection
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
      totalSongs: 0,
      loading: false,  // 添加加载状态
      loadingGedan: false  // 歌单信息加载状态
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
        this.loadingGedan = true;  // 开始加载，显示动画
        api.post(`/api/music/gedanList/`, {geDanId:this.geDanId}).then(res => {
          if (res.list.length > 0) {
            this.gedanTitle = res.list[0].name || "精选歌单";
            this.gedanCover = res.list[0].urlPath ? this.fullImagePath(res.list[0].urlPath) : require('@/assets/1740221844832.jpg');
            this.gedanCreator = res.list[0].creator || "音乐爱好者";
            this.gedanDescription = res.list[0].content || "";
          }
        }).catch(err => {
          console.error('获取歌单信息失败:', err);
        }).finally(() => {
          this.loadingGedan = false;  // 加载完成，隐藏动画
        });
      }
    },
    
    imagePath(item) {
      return item.musicPath ? this.fullImagePath(item.musicPath) : require('@/assets/1740221844832.jpg');
    },
    
    handlePlay(song) {
      // 这个方法不再实际播放音乐，但为了向后兼容性保留方法体
      console.log('播放功能已移除，歌曲ID:', song.id);
    },
    
    formatDuration(seconds) {
      // 如果duration是undefined或null，返回默认值
      if (!seconds) return '00:00';
      
      // 将秒数转换为分钟:秒格式
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = Math.floor(seconds % 60);
      
      // 格式化为两位数
      const formattedMinutes = String(minutes).padStart(2, '0');
      const formattedSeconds = String(remainingSeconds).padStart(2, '0');
      
      return `${formattedMinutes}:${formattedSeconds}`;
    },
    
    // 添加格式化时间显示的方法
    formatTime(time) {
      if (!time) return '00:00';
      
      // 处理时间格式，如03:46.23格式化为03:46
      let formattedTime = time;
      if (time.includes('.')) {
        formattedTime = time.split('.')[0];
      }
      return formattedTime;
    },
    
    onFavority(song) {
      // 设置动画标志
      this.$set(song, 'isAnimating', true);
      
      // 如果是要添加收藏，则添加波纹效果
      if (song.favorited != '1') {
        const container = event.target.closest('.song-actions');
        if (container) {
          container.classList.add('show-ripple');
          setTimeout(() => {
            container.classList.remove('show-ripple');
          }, 800);
        }
      }
      
      let url = song.favorited == '1' ? '/api/music/deleteFavorites/' : '/api/music/favorites/';
      api.post(url, {
        musicId: song.id,
        userId: this.user.id,
      }).then(res => {
        song.favorited = song.favorited == '1' ? 0 : 1;
        this.$emit("收藏成功");
        
        // 显示收藏操作提示信息
        this.$message({
          message: song.favorited === 1 ? '♥ 已添加到我的收藏！' : '已从收藏中移除',
          type: song.favorited === 1 ? 'success' : 'info',
          duration: 2000,
          showClose: true,
          offset: 80
        });
        
        // 动画结束后移除动画类
        setTimeout(() => {
          song.isAnimating = false;
        }, 500);
        
        this.initData();
      }).catch(err => {
        console.error('请求失败:', err);
        song.isAnimating = false;
        
        // 显示失败提示
        this.$message({
          message: '操作失败，请稍后再试',
          type: 'error',
          duration: 2000
        });
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
      this.loading = true;  // 开始加载，显示动画
      
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
      }).finally(() => {
        this.loading = false;  // 加载完成，隐藏动画
      });
    },
    
    // 添加导航到歌曲详情页的方法
    navigateToSongDetail(song) {
      // 通过事件机制触发跳转
      console.log("[gedanMusicPage] 触发歌曲详情跳转事件，歌曲ID:", song.id);
      this.$emit("onGoToSongDetail", song.id, this.user.id);
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
  padding-bottom: 20px;
}

/* 表头样式 */
.header {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1.5fr 0.5fr;
  padding: 16px 20px;
  background: #f8f9fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
  margin-bottom: 10px;
}

/* 歌曲列表容器 */
.song-list-container {
  position: relative;
  min-height: 100px;
  padding: 0 20px;
  max-width: 95%;
  margin: 0 auto;
}

/* 歌曲项动画 */
.song-item-enter-active {
  transition: all 0.5s ease;
  transition-delay: calc(0.05s * var(--index, 0));
}

.song-item-leave-active {
  transition: all 0.3s ease;
  position: absolute;
  width: 100%;
}

.song-item-enter {
  opacity: 0;
  transform: translateX(-20px);
}

.song-item-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

/* 为歌曲项添加序列动画 */
.song-item {
  animation: songFadeIn 0.5s ease forwards;
  animation-delay: calc(0.05s * var(--index, 0));
  opacity: 0;
}

@keyframes songFadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 使歌曲项具有不同的动画延迟 */
.song-item:nth-child(1) { --index: 0; }
.song-item:nth-child(2) { --index: 1; }
.song-item:nth-child(3) { --index: 2; }
.song-item:nth-child(4) { --index: 3; }
.song-item:nth-child(5) { --index: 4; }
.song-item:nth-child(6) { --index: 5; }
.song-item:nth-child(7) { --index: 6; }
.song-item:nth-child(8) { --index: 7; }
.song-item:nth-child(9) { --index: 8; }
.song-item:nth-child(10) { --index: 9; }

/* 歌曲项布局 */
.song-item {
  display: grid;
  grid-template-columns: 3fr 1fr 1fr 1.5fr 0.5fr;
  align-items: center;
  padding: 15px 20px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
  margin: 10px 0;
  border-radius: 10px;
  box-shadow: 0 2px 5px rgba(0,0,0,0.03);
  background-color: #ffffff;
}

.song-item:hover {
  background: #f9fafc;
  transform: translateX(5px) translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.even-row {
  background-color: #f9fafc;
}

.even-row:hover {
  background-color: #f5f7fa;
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 15px;
  transition: transform 0.2s ease;
  padding-left: 5px;
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

/* 时长显示样式 */
.song-duration {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.duration-text {
  font-size: 14px;
  color: #606266;
  font-family: 'Courier New', monospace;
  background-color: #f8f9fb;
  padding: 3px 8px;
  border-radius: 12px;
}

/* 歌手信息 */
.song-artist {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
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
  position: relative;
  z-index: 1;
}

.song-actions {
  position: relative;
}

/* 收藏成功的动画 */
.animate-favorite.el-icon-star-on {
  animation: favorite-added-animation 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 取消收藏的动画 */
.animate-favorite.el-icon-star-off {
  animation: favorite-removed-animation 0.8s ease;
}

/* 收藏按钮背后的波纹效果 */
.song-actions::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 71, 87, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  opacity: 0;
}

/* 点击收藏时添加波纹效果 */
.song-actions.show-ripple::before {
  animation: ripple-effect 0.8s ease-out;
}

@keyframes favorite-added-animation {
  0% {
    transform: scale(1);
  }
  25% {
    transform: scale(1.4) rotate(-15deg);
    color: #ff4757;
  }
  50% {
    transform: scale(0.8) rotate(15deg);
  }
  75% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
  }
}

@keyframes favorite-removed-animation {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  25% {
    transform: scale(0.8);
  }
  50% {
    transform: scale(1.1) rotate(10deg);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

/* 波纹扩散效果 */
@keyframes ripple-effect {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 70px;
    height: 70px;
    opacity: 0;
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

/* 新增歌曲类型样式 - 参考 singerDetailPage */
.song-type {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.type-tag {
  display: inline-block;
  padding: 4px 8px;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
}

/* 移除旧的类型样式 */
.type-name, .type-more {
  display: none;
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
  
  .header-comment-section {
    margin-top: 20px;
    padding-top: 15px;
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

/* 添加分页组件样式 */
.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding: 0 20px;
}


/* 头部评论区样式 */
.header-comment-section {
  margin-top: 25px;
  border-top: 1px solid #ebeef5;
  padding-top: 20px;
  transition: all 0.3s ease;
  animation: fade-in-up 0.6s ease-out;
}

@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>