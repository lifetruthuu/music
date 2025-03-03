<template>
  <main class="yonghu-container">
    <!-- 轮播图 - 100%宽度 -->
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

    <!-- 歌单网格 - 70%宽度 -->
    <div class="content-section">
      <h3 class="section-title">歌单</h3>
      <div class="playlist-grid" v-loading="loadingGedans" element-loading-text="加载歌单中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-if="loadingGedans" class="loading-skeleton">
          <div class="skeleton-card" v-for="index in 6" :key="'gedan-' + index"></div>
        </div>
        <transition-group 
          tag="el-row" 
          name="item-fade" 
          :gutter="20" 
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
            <el-card class="music-card" @click.native="onGeDanDetail(item, index)">
              <img
                  :src="fullImagePath(item.urlPath)"
                  class="card-image"
              />
              <div class="card-footer">
                <h3 class="card-title">{{ item.name }}</h3>
              </div>
            </el-card>
          </el-col>
        </transition-group>
      </div>
    </div>

    <!-- 推荐歌曲 - 70%宽度 -->
    <div class="content-section">
      <h3 class="section-title">推荐歌曲</h3>
      <div class="playlist-grid" v-loading="loadingSongs" element-loading-text="加载推荐歌曲中..." element-loading-spinner="el-icon-loading" element-loading-background="rgba(255, 255, 255, 0.8)">
        <div v-if="loadingSongs" class="loading-skeleton">
          <div class="skeleton-card" v-for="index in 6" :key="'song-' + index"></div>
        </div>
        <transition-group 
          tag="el-row" 
          name="item-fade" 
          :gutter="20" 
          v-else
        >
          <el-col
              v-for="(item, index) in songs"
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
              </div>
            </el-card>
          </el-col>
        </transition-group>
      </div>
    </div>

    <title-select v-if="titleDialog" :title-dialog="titleDialog" @onclose="onclose"></title-select>
  </main>
</template>
<script>
import api from "@/api/axios";
import TitleSelect from "@/components/dialog/titleSelect.vue";

export default {
  components: {TitleSelect},
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
      songs:[],
      showPlayer: false,
      mouseY: 0,
      windowHeight: 0,
      loadingGedans: false, // 加载歌单状态
      loadingSongs: false  // 加载歌曲状态
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
      let item = this.songs[this.currentIndex + 1];
      this.onAudio(item, this.currentIndex + 1)
    },
    previousMusic() {
      if (!this.currentIndex) {
        this.currentIndex = 0;
      }
      let item = this.songs[this.currentIndex - 1];
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
      let item = this.songs[this.currentIndex + 1];
      this.onAudio(item, this.currentIndex + 1)
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
    queryTuijianSongs(){
      this.loadingSongs = true; // 开始加载推荐歌曲，显示动画
      api.post('/api/music/tuijianSongs/', {
        userId: this.userId,
        pageNum: 1,
        pageSize: 6,
      }).then(res => {
        this.songs = res.list
      }).catch(err => {
        console.error('请求失败:', err);
      }).finally(() => {
        this.loadingSongs = false; // 加载完成，隐藏动画
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
    queryIsShowTitle(){
      this.titleDialog = false;
      api.post('/api/user/selectTitle/', {
        userId: this.userId,
      }).then(res => {
        if(res.list && res.list.length == 0){
          this.titleDialog = true;
        }
      }).catch(err => {
        console.error('请求失败:', err);
      });

    },

    beforData(){
      //查询歌单
      this.initData();
      this.queryTuijianSongs();
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
    this.queryIsShowTitle();
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

/* 轮播图区域 - 100%宽度 */
.carousel-section {
  width: 100%;
  margin-bottom: 30px;
}

.carousel-image {
  width: 100%;
  height: 400px;
  object-fit: cover;
}

/* 内容区域 - 70%宽度 */
.content-section {
  width: 70%;
  margin: 0 auto 30px;
  background-color: #fff;
  padding: 20px;
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
}

.music-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
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
  -webkit-line-clamp: 3 !important; /* 最多显示3行 */
  -webkit-box-orient: vertical !important; /* 垂直方向排列 */
  max-height: 4.2em !important; /* 3行文本的最大高度 (1.4 * 3) */
}

/* 修复卡片大小问题 */
.el-col {
  display: flex;
  margin-bottom: 20px;
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
</style>