<template>
  <div class="singer-detail-container">
    <!-- 返回按钮 -->
    <div class="back-button" @click="goBack">
      <i class="el-icon-arrow-left"></i>
      <span>返回</span>
    </div>
    
    <!-- 歌手信息头部区域 -->
    <div class="singer-header" v-if="singer">
      <div class="singer-header-backdrop" :style="{ backgroundImage: `url(${imagePath(singer)})` }"></div>
      <div class="singer-header-content">
        <div class="singer-avatar-container">
          <img :src="imagePath(singer)" alt="歌手头像" class="singer-avatar" />
        </div>
        <div class="singer-info">
          <h1 class="singer-name">{{ singer.name }}</h1>
          <h2 class="singer-english-name">{{ singer.englishName }}</h2>
          <div class="singer-stats">
            <div class="stat-item">
              <span class="stat-value">{{ formatNumber(singer.fansCount) }}</span>
              <span class="stat-label">粉丝</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ singer.albumsCount }}</span>
              <span class="stat-label">专辑</span>
            </div>
            <div class="stat-item">
              <span class="stat-value">{{ singer.songsCount }}</span>
              <span class="stat-label">单曲</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 歌手详细信息区域 -->
    <div class="singer-details" v-if="singer">
      <div class="singer-bio">
        <h3 class="section-title">歌手简介</h3>
        <p class="bio-text">{{ singer.introduction }}</p>
      </div>
      
      <div class="singer-metadata">
        <div class="metadata-section">
          <h3 class="section-title">基本信息</h3>
          <div class="metadata-grid">
            <div class="metadata-item">
              <span class="metadata-label">出生日期</span>
              <span class="metadata-value">{{ singer.birthday }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">地区</span>
              <span class="metadata-value">{{ singer.region }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">国籍</span>
              <span class="metadata-value">{{ singer.country }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">性别</span>
              <span class="metadata-value">{{ singer.gender === 1 ? '男' : '女' }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">出道日期</span>
              <span class="metadata-value">{{ singer.debutDate }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">音乐风格</span>
              <span class="metadata-value">{{ singer.musicStyle }}</span>
            </div>
            <div class="metadata-item">
              <span class="metadata-label">所属唱片公司</span>
              <span class="metadata-value">{{ singer.label }}</span>
            </div>
          </div>
        </div>
        
        <div class="metadata-section">
          <h3 class="section-title">代表作品</h3>
          <p class="representative-works">{{ singer.representativeWorks }}</p>
        </div>
        
        <div class="metadata-section">
          <h3 class="section-title">获奖记录</h3>
          <p class="awards">{{ singer.awards }}</p>
        </div>
      </div>
    </div>

    <!-- 歌曲列表区域 -->
    <div class="songs-section">
      <h3 class="section-title">热门歌曲</h3>
      <div class="music-list">
        <!-- 表头 -->
        <div class="header">
          <span class="song-name">歌曲标题</span>
          <span class="song-duration">时长</span>
          <span class="song-type">类型</span>
          <span class="favorite">收藏</span>
        </div>

        <!-- 歌曲列表 -->
        <div class="song-item" v-for="(song, index) in songs" :key="index" :class="{ 'song-item-animated': true }">
          <div class="song-info" @click="goToSongDetail(song)">
            <span class="order">{{ (page.currentPage - 1) * page.pageSize + index + 1 }}</span>
            <div class="cover-container">
              <img
                  :src="imagePath(song)"
                  alt="音乐封面"
                  class="music-cover"
              />
            </div>
            <span class="title">
              {{ song.name }}
            </span>
          </div>

          <div class="song-duration">
            {{ formatTime(song.time) }}
          </div>
          
          <div class="song-type">
            <span v-if="song.types && song.types.length > 0">{{ song.typeName }}</span>
            <span v-else>-</span>
          </div>
          
          <div class="favorite-container">
            <i
                :class="[
                  song.favorited == '1' ? 'el-icon-star-on red' : 'el-icon-star-off',
                  'favorite-icon',
                  { 'animate-favorite': song.isAnimating }
                ]"
                @click="onFavority(song)"
            ></i>
          </div>
        </div>
      </div>
      
      <!-- 分页组件 -->
      <Pagination 
        :total="page.total" 
        :pageSize="page.pageSize" 
        :currentPage.sync="page.currentPage"
        @change="handlePageChange"
      />
    </div>
  </div>
</template>

<script>
import api from "@/api/axios";
import Pagination from "@/components/com/Pagination.vue";

export default {
  components: {
    Pagination
  },
  
  props: {
    singerId: {
      type: [String, Number],
      required: true
    },
    queryStr: {
      type: String,
      default: ''
    }
  },

  watch: {
    singerId(newVal, oldVal) {
      console.log(`singerId changed from ${oldVal} to ${newVal}`);
      this.initData();
    },
    
    // 监听路由变化
    '$route'(to, from) {
      if (to.name === 'SingerDetail' && to.params.singerId !== from.params.singerId) {
        console.log(`Route changed: ${from.params.singerId} -> ${to.params.singerId}`);
        this.initData();
      }
    }
  },

  data() {
    return {
      singer: null,
      songs: [],
      user: {},
      currentAudio: null,  // 当前播放的音频元素
      page: {
        currentPage: 1,
        pageSize: 10,
        total: 0
      }
    }
  },
  
  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    console.log("[singerDetailPage] 初始化，接收到singerId:", this.singerId);
    console.log("[singerDetailPage] 接收到queryStr:", this.queryStr);
    console.log("[singerDetailPage] Route params:", this.$route.params);
    this.initData();
  },
  
  methods: {
    // 返回上一页
    goBack() {
      // 通过触发事件返回到歌手列表页
      console.log("[singerDetailPage] 点击返回按钮，触发从歌手详情页返回歌手列表页事件");
      this.$emit("onBackToSingerList");
    },
    
    // 跳转到歌曲详情页
    goToSongDetail(song) {
      // 通过事件机制触发跳转
      console.log("[singerDetailPage] 触发歌曲详情跳转事件，歌曲ID:", song.id);
      this.$emit("onGoToSongDetailFromSinger", song.id, this.user.id);
    },
    
    formatNumber(num) {
      if (!num) return 0;
      
      if (num >= 10000) {
        return (num / 10000).toFixed(1) + '万';
      }
      return num;
    },
    
    imagePath(item) {
      return item.urlPath || item.musicPath 
        ? this.fullImagePath(item.urlPath || item.musicPath) 
        : require('@/assets/img.png');
    },

    handlePlay(event) {
      // 如果有正在播放的音频且不是当前音频
      if (this.currentAudio && this.currentAudio !== event.target) {
        this.currentAudio.pause()  // 暂停其他音频
      }
      this.currentAudio = event.target  // 记录当前播放的音频
    },
    
    onFavority(song) {
      // 设置动画标志
      this.$set(song, 'isAnimating', true);
      
      // 如果是要添加收藏，则添加波纹效果
      if (song.favorited != '1') {
        const container = event.target.closest('.favorite-container');
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
        
        // 显示收藏操作提示信息
        this.$message({
          message: song.favorited == 1 ? '♥ 已添加到我的收藏！' : '已从收藏中移除',
          type: song.favorited == 1 ? 'success' : 'info',
          duration: 2000,
          showClose: true,
          offset: 80
        });
        
        this.$emit("收藏成功");
        
        // 动画结束后移除动画类
        setTimeout(() => {
          song.isAnimating = false;
        }, 500);
        
        // 重新加载数据以保持状态一致
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
    
    handlePageChange(page) {
      this.page.currentPage = page;
      this.initData();
    },
    
    initData() {
      console.log("Requesting singer details with ID:", this.singerId);
      
      api.post('/api/music/singer/detail/', {
        pageNum: this.page.currentPage,
        pageSize: this.page.pageSize,
        singerId: this.singerId,
        userId: this.user.id,
        queryStr: this.queryStr,
      }).then(res => {
        console.log("API response:", res);
        this.singer = res.singer;
        this.songs = res.list;
        this.page.total = res.total || 0;
      }).catch(err => {
        console.error('请求失败:', err);
        this.singer = null;
        this.songs = [];
        this.page.total = 0;
      });
    },
    
    // 格式化时间显示
    formatTime(time) {
        if (!time) return '00:00';
        
        // 处理时间格式，如03:46.23格式化为03:46
        let formattedTime = time;
        if (time.includes('.')) {
            formattedTime = time.split('.')[0];
        }
        return formattedTime;
    },
  }
}
</script>

<style scoped>
/* 返回按钮样式 */
.back-button {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  cursor: pointer;
  width: fit-content;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-radius: 20px;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.back-button:hover {
  background-color: #e6e9ed;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.back-button i {
  font-size: 18px;
  margin-right: 5px;
  color: #409eff;
}

.back-button span {
  font-size: 16px;
  font-weight: 500;
  color: #409eff;
}

/* 主容器样式 */
.singer-detail-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Microsoft YaHei', sans-serif;
  color: #333;
  padding-bottom: 50px;
  padding-top: 20px;
}

/* 歌手头部区域样式 */
.singer-header {
  position: relative;
  height: 350px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 30px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.singer-header-backdrop {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  filter: blur(20px);
  opacity: 0.7;
  transform: scale(1.1);
  z-index: 1;
}

.singer-header-backdrop::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.7));
  z-index: 2;
}

.singer-header-content {
  position: relative;
  display: flex;
  align-items: center;
  height: 100%;
  padding: 0 50px;
  z-index: 3;
}

.singer-avatar-container {
  flex-shrink: 0;
  width: 200px;
  height: 200px;
  border-radius: 50%;
  overflow: hidden;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
  transition: transform 0.3s ease;
  animation: float 6s ease-in-out infinite;
}

@keyframes float {
  0% {
    transform: translateY(0px);
  }
  50% {
    transform: translateY(-10px);
  }
  100% {
    transform: translateY(0px);
  }
}

.singer-avatar-container:hover {
  transform: scale(1.05);
}

.singer-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.singer-info {
  margin-left: 40px;
  color: white;
}

.singer-name {
  font-size: 42px;
  font-weight: 700;
  margin: 0 0 5px 0;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.8s ease;
}

.singer-english-name {
  font-size: 24px;
  font-weight: 400;
  margin: 0 0 20px 0;
  opacity: 0.9;
  text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.5);
  animation: fadeInUp 0.8s ease 0.2s both;
}

.singer-stats {
  display: flex;
  gap: 30px;
  animation: fadeInUp 0.8s ease 0.4s both;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.stat-value {
  font-size: 24px;
  font-weight: 600;
}

.stat-label {
  font-size: 14px;
  opacity: 0.8;
}

/* 歌手详细信息区域样式 */
.singer-details {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 30px;
  margin-bottom: 40px;
  animation: fadeIn 1s ease;
}

.singer-bio {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 15px 0;
  color: #333;
  position: relative;
  padding-left: 15px;
}

.section-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 5px;
  height: 20px;
  background: linear-gradient(to bottom, #ff7e5f, #feb47b);
  border-radius: 3px;
}

.bio-text {
  font-size: 16px;
  line-height: 1.7;
  color: #555;
  margin: 0;
}

.singer-metadata {
  display: flex;
  flex-direction: column;
  gap: 25px;
}

.metadata-section {
  background: white;
  padding: 25px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
}

.metadata-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 15px;
}

.metadata-item {
  display: flex;
  flex-direction: column;
}

.metadata-label {
  font-size: 14px;
  color: #888;
  margin-bottom: 5px;
}

.metadata-value {
  font-size: 16px;
  color: #333;
  font-weight: 500;
}

.representative-works, .awards {
  font-size: 16px;
  line-height: 1.7;
  color: #555;
  margin: 0;
}

/* 歌曲列表区域样式 */
.songs-section {
  background: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.05);
  animation: fadeIn 1s ease 0.3s both;
}

.music-list {
  width: 100%;
  margin-top: 20px;
}

/* 表头样式 */
.header {
  display: grid;
  grid-template-columns: 4fr 1fr 1fr 1fr;
  padding: 16px 30px;
  background: #f8f9fa;
  font-weight: 600;
  color: #606266;
  border-radius: 8px;
  margin-bottom: 15px;
}

/* 歌曲项布局 */
.song-item {
  display: grid;
  grid-template-columns: 4fr 1fr 1fr 1fr;
  align-items: center;
  padding: 20px 30px;
  transition: all 0.3s ease;
  border-radius: 8px;
  margin-bottom: 10px;
  opacity: 0;
  transform: translateY(20px);
  animation: fadeInUp 0.5s ease forwards;
}

.song-item-animated:nth-child(2) { animation-delay: 0.1s; }
.song-item-animated:nth-child(3) { animation-delay: 0.2s; }
.song-item-animated:nth-child(4) { animation-delay: 0.3s; }
.song-item-animated:nth-child(5) { animation-delay: 0.4s; }
.song-item-animated:nth-child(6) { animation-delay: 0.5s; }
.song-item-animated:nth-child(7) { animation-delay: 0.6s; }
.song-item-animated:nth-child(8) { animation-delay: 0.7s; }
.song-item-animated:nth-child(9) { animation-delay: 0.8s; }
.song-item-animated:nth-child(10) { animation-delay: 0.9s; }

.song-item:hover {
  background: #f5f7fa;
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 20px;
  cursor: pointer;
  padding: 5px;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.song-info:hover {
  background-color: #f0f2f5;
}

.song-info:active {
  transform: scale(0.98);
}

.order {
  width: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
  font-weight: 600;
}

.cover-container {
  width: 60px;
  height: 60px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.music-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.cover-container:hover .music-cover {
  transform: scale(1.1);
}

.title {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 时长和标题样式 */
.song-duration, .song-type {
  text-align: center;
  font-size: 14px;
  color: #606266;
}

.song-type span {
  display: inline-block;
  padding: 4px 8px;
  background-color: #ecf5ff;
  color: #409eff;
  border-radius: 12px;
  font-size: 12px;
}

/* 收藏图标样式 */
.favorite-container {
  display: flex;
  justify-content: center;
  position: relative;
}

.favorite-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 22px;
  color: #ccc;
  position: relative;
  z-index: 1;
}

.favorite-icon:hover {
  transform: scale(1.2);
  color: #ff4757;
}

.favorite-icon.red {
  color: #ff4757;
}

/* 添加收藏动画效果 - 更丰富的动画 */
/* 收藏成功的动画 */
.animate-favorite.el-icon-star-on {
  animation: favorite-added-animation 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

/* 取消收藏的动画 */
.animate-favorite.el-icon-star-off {
  animation: favorite-removed-animation 0.8s ease;
}

/* 收藏按钮背后的波纹效果 */
.favorite-container::before {
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
.favorite-container.show-ripple::before {
  animation: ripple-effect 0.8s ease-out;
}

/* 收藏成功动画 */
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

/* 取消收藏动画 */
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

/* 动画效果 */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 响应式处理 */
@media (max-width: 992px) {
  .singer-details {
    grid-template-columns: 1fr;
  }
  
  .singer-header-content {
    flex-direction: column;
    text-align: center;
    padding: 30px 20px;
  }
  
  .singer-info {
    margin-left: 0;
    margin-top: 20px;
  }
  
  .singer-stats {
    justify-content: center;
  }
}

@media (max-width: 768px) {
  .header, .song-item {
    grid-template-columns: 1fr;
    padding: 15px;
  }
  
  .song-info {
    margin-bottom: 15px;
  }
  
  .singer-header {
    height: auto;
  }
  
  .singer-avatar-container {
    width: 150px;
    height: 150px;
  }
  
  .singer-name {
    font-size: 32px;
  }
  
  .singer-english-name {
    font-size: 18px;
  }
}
</style> 