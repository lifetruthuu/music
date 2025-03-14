<template>
  <main class="yonghu-container">
    <!-- 轮播图 - 95%宽度 -->
    <div class="carousel-section">
      <el-carousel height="400px" :interval="4000" type="card" indicator-position="outside">
        <el-carousel-item v-for="(item,index) in images" :key="index">
          <img
              :src="item"
              class="carousel-image"
              alt="音乐轮播图"
          />
        </el-carousel-item>
      </el-carousel>
    </div>

    <!-- 热门歌曲 - 65%宽度 -->
    <div class="content-section">
      <h3 class="section-title">热门歌曲</h3>
      <div class="playlist-grid" v-loading="loadingHotSongs" element-loading-text="加载热门歌曲中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-if="loadingHotSongs" class="loading-skeleton">
          <div class="skeleton-card" v-for="index in 6" :key="'hot-' + index"></div>
        </div>
        <transition-group 
          tag="el-row" 
          name="item-fade" 
          :gutter="30" 
          v-else
        >
          <el-col
              v-for="(item, index) in hotSongs"
              :key="item.id || index"
              :xs="12"
              :sm="6"
              :md="6"
              :lg="4"
          >
            <el-card class="music-card" @click.native="onAudio(item, index)">
              <img
                  :src="imagePath(item)"
                  class="card-image"
              />
              <div class="card-footer">
                <h3 class="card-title">{{ item.name }}</h3>
                <p class="card-singer">{{ item.singerNames }}</p>
                <div class="card-hot" v-if="item.hot">
                  <i class="el-icon-hot-water"></i> 热门
                </div>
              </div>
            </el-card>
          </el-col>
        </transition-group>
      </div>
    </div>

    <!-- 最近播放的歌曲 - 65%宽度 -->
    <div class="content-section">
      <h3 class="section-title">最近播放</h3>
      <div class="playlist-grid" v-loading="loadingRecentPlays" element-loading-text="加载最近播放中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-if="loadingRecentPlays" class="loading-skeleton">
          <div class="skeleton-card" v-for="index in 6" :key="'recent-' + index"></div>
        </div>
        <transition-group 
          tag="el-row" 
          name="item-fade" 
          :gutter="30" 
          v-else
        >
          <el-col
              v-for="(item, index) in recentPlays"
              :key="item.id || index"
              :xs="12"
              :sm="6"
              :md="6"
              :lg="4"
          >
            <el-card class="music-card" @click.native="onAudio(item, index)">
              <img
                  :src="imagePath(item)"
                  class="card-image"
              />
              <div class="card-footer">
                <h3 class="card-title">{{ item.name }}</h3>
                <p class="card-singer">{{ item.singerNames }}</p>
              </div>
            </el-card>
          </el-col>
        </transition-group>
      </div>
    </div>

    <!-- 歌单网格 - 65%宽度 -->
    <div class="content-section">
      <h3 class="section-title">歌单</h3>
      <div class="playlist-grid" v-loading="loadingGedans" element-loading-text="加载歌单中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-if="loadingGedans" class="loading-skeleton">
          <div class="skeleton-card" v-for="index in 6" :key="'gedan-' + index"></div>
        </div>
        <transition-group 
          tag="el-row" 
          name="item-fade" 
          :gutter="30" 
          v-else
        >
          <el-col
              v-for="(item, index) in tableData"
              :key="item.id || index"
              :xs="12"
              :sm="6"
              :md="6"
              :lg="4"
          >
            <div class="gedan-card" @click="onGeDanDetail(item, index)">
              <div class="gedan-cover-container">
                <img
                    :src="fullImagePath(item.urlPath)"
                    class="gedan-cover-image"
                    alt="歌单封面"
                />
                <div class="gedan-overlay">
                  <i class="el-icon-video-play gedan-play-icon"></i>
                </div>
                <div class="gedan-info-badge">
                  <i class="el-icon-headset"></i>
                  <span>{{ Math.floor(Math.random() * 10000) }}</span>
                </div>
              </div>
              <div class="gedan-info">
                <h3 class="gedan-title">{{ item.name }}</h3>
                <p class="gedan-desc">精选歌单，发现好音乐</p>
              </div>
            </div>
          </el-col>
        </transition-group>
      </div>
    </div>

  </main>
</template>
<script>
import api from "@/api/axios";

export default {
  data() {
    return {
      progress: 0,
      searchKey: null,
      username: null,
      tableData: [],
      currentAudioPath: '',
      volume: 1, // 默认音量为最大（1）
      isMuted: false, // 是否静音
      currentAudioName: '', // 当前播放的音频名称
      currentAudioSinger: '', // 当前播放的音频歌手
      favorited: 0, // 是否已收藏
      currentMusicPath: '',
      currentMusicId: '',
      images: [
        require('../../../src/assets/109951170487950389.jpg'),
        require('../../../src/assets/109951170487958377.jpg'),
        // 添加更多图片路径
        require('../../../src/assets/109951170487965434.jpg'),
        require('../../../src/assets/109951170487987122.jpg'),
        require('../../../src/assets/109951170488017071.jpg'),
        require('../../../src/assets/109951170487997718.jpg'),
      ],
      currentIndex: null,
      favotiries: [],
      // 当前播放列表
      playlist: [],
      // 当前播放索引
      // 当前播放歌曲数据
      currentAudio: null,
      titleDialog: false,
      userId: '',
      showPlayer: false,
      mouseY: 0,
      windowHeight: 0,
      loadingGedans: false, // 加载歌单状态
      loadingRecentPlays: false, // 加载最近播放状态
      loadingHotSongs: false, // 加载热门歌曲状态
      recentPlays: [], // 最近播放列表
      hotSongs: [], // 热门歌曲列表
    }
  },
  computed: {
    // 根据音量大小动态显示图标
    hasNext() {
      return this.currentIndex < this.playlist.length - 1
    }
  },
  methods: {
    imagePath(item) {
      return item.musicPath ? this.fullImagePath(item.musicPath) :  require('../../../src/assets/img.png');
    },
    onclose(){
      this.titleDialog = false;
    },

    nextMusic() {
      if (!this.currentIndex) {
        this.currentIndex = 0;
      }
      let collection = this.currentCollection || this.recentPlays;
      let item = collection[this.currentIndex + 1];
      this.onAudio(item, this.currentIndex + 1)
    },
    previousMusic() {
      if (!this.currentIndex) {
        this.currentIndex = 0;
      }
      let collection = this.currentCollection || this.recentPlays;
      let item = collection[this.currentIndex - 1];
      this.onAudio(item, this.currentIndex - 1)
    },
    // 切换收藏状态
    toggleFavorite() {
      this.favorited = !this.favorited;
      let message = this.favorited ? '已添加到收藏' : '已取消收藏'
      let url = this.favorited ? '/api/music/deleteFavorites/' : '/api/music/favorites/'
      api.post(url, {
        musicId: this.currentMusicId,
        userId: this.userId,
      }).then(res => {
        this.$message.success(message);
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },

    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },

    onGeDanDetail(item, index) {
      this.$emit("onMusicListByGedan",{geDanId:item.id,index:0})
    },

    onAudio(item, index, gedan) {
      this.currentIndex = index;
      this.currentAudio = item; // 保存当前播放的音频对象
      this.showPlayer = true;   // 确保播放器显示
      this.currentCollection = gedan ? this.gedanSongs : 
                              (index >= this.recentPlays.length ? this.hotSongs : this.recentPlays);
      
      // 重置播放状态
      this.currentAudioPath = '';

      this.$nextTick(() => {
        if (!item.audioPath) {
          console.error('无效的音频路径');
          return;
        }

        // 更新音频路径
        this.currentMusicId = item.id;
        this.currentAudioPath = item.audioPath ? `http://localhost:8000${item.audioPath}` : '../../../src/assets/img.png';
        this.currentAudioName = item.name;
        this.currentAudioSinger = item.singerNames || '';

        // 获取音频元素
        let audio = this.$refs.audioPlayer;

        // 监听音频加载完成事件
        audio.addEventListener('canplaythrough', () => {
          // 音频加载完成后尝试播放
          audio.play().catch(error => {
            console.error('播放失败:', error);
          });
        }, { once: true }); // 只监听一次

        // 加载音频
        audio.load();
        //将音乐添加到播放记录中
        api.post('/api/music/play/', {
          userId: this.userId,
          musicId: item.id,
        }).then(res => {

        }).catch(err => {
          console.error('请求失败:', err);
        });

      });
    },

    updateProgress() {
      this.progress = (this.$refs.audioPlayer.currentTime / this.$refs.audioPlayer.duration) * 100;
    },
    handleAudioEnded() {
      let collection = this.currentCollection || this.recentPlays;
      if (this.currentIndex < collection.length - 1) {
        let item = collection[this.currentIndex + 1];
        this.onAudio(item, this.currentIndex + 1)
      }
    },
    initData() {
      const queryStr = this.searchKey || '';
      this.loadingGedans = true; // 开始加载歌单，显示动画
      api.post('/api/music/gedanList/', {
        queryStr,
        pageNum: 1,
        pageSize: 6,
      }).then(res => {
        this.tableData = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
      }).finally(() => {
        this.loadingGedans = false; // 加载完成，隐藏动画
      });
    },
    getRecentPlays() {
      this.loadingRecentPlays = true; // 开始加载最近播放，显示动画
      api.get(`/api/music/recent_plays/?userId=${this.userId}&limit=6`).then(res => {
        if (res.status === 'success' && res.list) {
          this.recentPlays = res.list;
        } else {
          this.recentPlays = [];
        }
      }).catch(err => {
        console.error('获取最近播放失败:', err);
        this.recentPlays = [];
      }).finally(() => {
        this.loadingRecentPlays = false; // 加载完成，隐藏动画
      });
    },
    getHotSongs() {
      this.loadingHotSongs = true; // 开始加载热门歌曲，显示动画
      api.get(`/api/music/hot_songs/?userId=${this.userId}&limit=6`).then(res => {
        if (res.status === 'success' && res.list) {
          this.hotSongs = res.list;
        } else {
          this.hotSongs = [];
        }
      }).catch(err => {
        console.error('获取热门歌曲失败:', err);
        this.hotSongs = [];
      }).finally(() => {
        this.loadingHotSongs = false; // 加载完成，隐藏动画
      });
    },
    queryUserFavitory() {
      api.post('/api/favorites/list/', {
        userId: this.userId,
      }).then(res => {
        this.favotiries = res.list.map(item => item.musicId);
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    beforData(){
      //查询歌单
      this.initData();
      this.getRecentPlays();
      this.getHotSongs();
      this.queryUserFavitory();
    },
    handleMouseMove(event) {
      this.mouseY = event.clientY;
      // 当鼠标位置在窗口底部100px范围内时显示播放器
      this.showPlayer = (this.windowHeight - this.mouseY) < 100;
    },
    handleResize() {
      this.windowHeight = window.innerHeight;
    },
  },

  created() {
    const userString = localStorage.getItem('user');
    const user = JSON.parse(userString);
    this.username = user.username;
    this.userId = user.id;
    this.beforData();
    // 添加鼠标移动监听
    window.addEventListener('mousemove', this.handleMouseMove);
    // 获取窗口高度
    this.windowHeight = window.innerHeight;
    // 添加窗口大小变化监听
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    // 移除事件监听器
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
  }
}

</script>

<style scoped>
/* 容器样式 */
.yonghu-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: #f5f7fa;
  min-height: 100vh;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 轮播图区域 - 95%宽度 */
.carousel-section {
  width: 95%;
  margin: 0 auto 30px;
}

.carousel-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* 内容区域 - 65%宽度 */
.content-section {
  width: 65%;
  margin: 0 auto 40px;
  background-color: #fff;
  padding: 25px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 区块标题样式 */
.section-title {
  font-size: 22px !important;
  font-weight: bold !important;
  margin: 0 0 20px 0 !important;
  color: #303133 !important;
  text-align: left !important;
  padding-left: 10px !important;
  border-left: 4px solid #409EFF !important;
  width: auto !important;
}

.section-title::before {
  display: none !important;
}

/* 卡片样式 */
.music-card {
  margin-bottom: 20px;
  transition: all 0.3s;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  transition: all 0.3s;
  flex-shrink: 0; /* 防止图片被压缩 */
}

.music-card:hover .card-image {
  transform: scale(1.05);
}

.card-footer {
  padding: 12px;
  text-align: left;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 110px; /* 固定卡片底部高度，与gedanPage保持一致 */
  box-sizing: border-box; /* 确保padding不会增加元素高度 */
  position: relative; /* 为热门标签准备 */
}

.card-title {
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 500 !important;
  font-family: 'STXinwei' !important;
  color: #303133 !important;
  white-space: normal !important; /* 允许文本换行 */
  overflow: visible !important; /* 允许内容溢出 */
  text-overflow: clip !important; /* 移除省略号 */
  padding-left: 0 !important;
  width: auto !important;
  line-height: 1.4 !important; /* 控制行高 */
  display: -webkit-box !important; /* 使用box布局实现多行文本 */
  -webkit-line-clamp: 2 !important; /* 最多显示2行 */
  -webkit-box-orient: vertical !important; /* 垂直方向排列 */
  max-height: 2.8em !important; /* 2行文本的最大高度 (1.4 * 2) */
}

.card-singer {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-hot {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #ff4d4f;
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
}

.card-hot i {
  font-size: 14px;
}

/* 修复卡片大小问题 */
.el-col {
  display: flex;
  margin-bottom: 30px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .content-section {
    width: 90%;
  }
}

/* 保留其他必要的样式 */
.red {
  color: red;
}

.playlist-grid {
  width: 100%;
  margin: 0;
}

/* 加载骨架屏样式 */
.loading-skeleton {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 20px;
  width: 100%;
}

.skeleton-card {
  height: 290px; /* 卡片高度 = 图片高度(180px) + 底部高度(110px) */
  border-radius: 8px;
  background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s infinite;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

/* 元素加载动画 */
.el-loading-spinner .el-icon-loading {
  font-size: 30px;
  color: #409EFF;
}

.el-loading-spinner .el-loading-text {
  font-size: 14px;
  margin-top: 10px;
  color: #409EFF;
}

/* 列表项进入动画 */
.item-fade-enter-active {
  transition: all 0.6s ease;
  transition-delay: calc(0.1s * v-bind('$index'));
}

.item-fade-leave-active {
  transition: all 0.3s ease;
}

.item-fade-enter {
  opacity: 0;
  transform: translateY(30px);
}

.item-fade-leave-to {
  opacity: 0;
}

/* 为每个列表项添加不同的延迟，实现错落的动画效果 */
.el-col:nth-child(1) .music-card { animation-delay: 0.05s; }
.el-col:nth-child(2) .music-card { animation-delay: 0.1s; }
.el-col:nth-child(3) .music-card { animation-delay: 0.15s; }
.el-col:nth-child(4) .music-card { animation-delay: 0.2s; }
.el-col:nth-child(5) .music-card { animation-delay: 0.25s; }
.el-col:nth-child(6) .music-card { animation-delay: 0.3s; }

/* 添加一个默认的卡片动画 */
.music-card {
  animation: cardFadeIn 0.6s ease forwards;
  animation-play-state: paused;
  opacity: 0;
}

.playlist-grid:not(.el-loading-parent--relative) .music-card {
  animation-play-state: running;
}

@keyframes cardFadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 歌单卡片特殊样式 */
.gedan-card {
  position: relative;
  margin-bottom: 20px;
  transition: all 0.3s ease;
  cursor: pointer;
  border-radius: 12px;
  overflow: hidden;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  background-color: #fff;
  animation: cardFadeIn 0.6s ease forwards;
  animation-play-state: paused;
  opacity: 0;
}

.playlist-grid:not(.el-loading-parent--relative) .gedan-card {
  animation-play-state: running;
}

.gedan-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12);
}

.gedan-cover-container {
  position: relative;
  width: 100%;
  padding-bottom: 100%; /* 1:1 宽高比例 */
  overflow: hidden;
}

.gedan-cover-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.gedan-card:hover .gedan-cover-image {
  transform: scale(1.08);
}

.gedan-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.5) 0%, rgba(0, 0, 0, 0) 60%);
  opacity: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: opacity 0.3s ease;
}

.gedan-card:hover .gedan-overlay {
  opacity: 1;
}

.gedan-play-icon {
  font-size: 48px;
  color: white;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
  transform: scale(0.8);
  transition: transform 0.3s ease;
}

.gedan-card:hover .gedan-play-icon {
  transform: scale(1);
}

.gedan-info-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: rgba(0, 0, 0, 0.6);
  color: white;
  padding: 5px 10px;
  border-radius: 20px;
  font-size: 12px;
  display: flex;
  align-items: center;
  gap: 4px;
  z-index: 2;
}

.gedan-info {
  padding: 16px;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
}

.gedan-title {
  margin: 0 0 5px 0 !important;
  font-size: 16px !important;
  font-weight: 600 !important;
  color: #303133 !important;
  line-height: 1.4 !important;
  display: -webkit-box !important;
  -webkit-line-clamp: 2 !important;
  -webkit-box-orient: vertical !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
  max-height: 2.8em !important;
}

.gedan-desc {
  margin: 0;
  font-size: 13px;
  color: #909399;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .gedan-info-badge {
    padding: 3px 8px;
    font-size: 10px;
  }
  
  .gedan-title {
    font-size: 14px !important;
  }
  
  .gedan-desc {
    font-size: 12px;
  }
}

/* 为每个歌单卡片添加交错动画延迟 */
.el-col:nth-child(1) .gedan-card { animation-delay: 0.05s; }
.el-col:nth-child(2) .gedan-card { animation-delay: 0.1s; }
.el-col:nth-child(3) .gedan-card { animation-delay: 0.15s; }
.el-col:nth-child(4) .gedan-card { animation-delay: 0.2s; }
.el-col:nth-child(5) .gedan-card { animation-delay: 0.25s; }
.el-col:nth-child(6) .gedan-card { animation-delay: 0.3s; }

/* 音乐卡片布局优化 */
.el-row {
  width: 100%;
  margin-left: 0 !important;
  margin-right: 0 !important;
}

@media (max-width: 1400px) {
  /* 在较宽的屏幕上也减少列数 */
  .el-col-lg-4 {
    width: 33.33333%;
  }
}

@media (max-width: 992px) {
  /* 中等屏幕尺寸时的宽度调整 */
  .content-section {
    width: 75%;
  }
}

@media (max-width: 768px) {
  /* 小屏幕时的宽度调整 */
  .carousel-section {
    width: 100%;
  }
  
  .content-section {
    width: 90%;
  }
}
</style>