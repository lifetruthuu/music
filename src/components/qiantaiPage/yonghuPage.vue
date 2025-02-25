<template>
  <main class="content">
    <!-- 轮播图 -->
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

    <!-- 歌单网格 -->
    <h3>歌单</h3>
    <div class="playlist-grid">
      <el-row :gutter="20">
        <el-col
            v-for="(item, index) in tableData"
            :key="index"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
        >
          <el-card class="music-card" @click.native="onGeDanDetail(item, index)">
            <img
                :src="fullImagePath(item.urlPath)"
                class="card-image"
            />


            <div class="card-footer">
              <h3 style="text-align: left">{{ item.name }}</h3>
              <!--                <p>{{ item.singerNames }}</p>-->
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <h3>推荐歌曲</h3>
    <div class="playlist-grid">
      <el-row :gutter="20">
        <el-col
            v-for="(item, index) in songs"
            :key="index"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
        >
          <el-card class="music-card" @click.native="onAudio(item, index)">

            <img
                :src="imagePath(item)"
                class="card-image"
            />



            <div class="card-footer">
              <h3 style="text-align: left">{{ item.name }}</h3>
              <!--                <p>{{ item.singerNames }}</p>-->
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 底部播放器 -->
    <footer class="player-footer" :class="{ show: showPlayer }">
      <div class="player-controls">
        <div class="left-controls">
          <span v-if="currentAudioName" class="music-cover">
            <img
              :src="currentAudio && currentAudio.musicPath ? fullImagePath(currentAudio.musicPath) : require('../../assets/1740221524183.jpg')"
              alt="封面"
            />
          </span>
          <div class="music-info">
            <span class="music-name">{{ currentAudioName || '未播放' }}</span>
            <span class="music-singer">{{ currentAudioSinger || '-' }}</span>
          </div>
        </div>
        <div class="progress-section">
          <i class="el-icon-caret-left" @click="previousMusic"></i>
          <audio
              ref="audioPlayer"
              :src="currentAudioPath"
              @timeupdate="updateProgress"
              @ended="handleAudioEnded"
              controls
          />
          <i class="el-icon-caret-right" @click="nextMusic"></i>
        </div>
      </div>
    </footer>
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
      api.post('/api/music/gedanList/', {
        queryStr,
        pageNum: 1,
        pageSize: 6,
      }).then(res => {
        this.tableData = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    queryTuijianSongs(){
      api.post('/api/music/tuijianSongs/', {
        userId: this.userId,
        pageNum: 1,
        pageSize: 6,
      }).then(res => {
        this.songs = res.list
      }).catch(err => {
        console.error('请求失败:', err);
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
/* 全局容器样式 */
.content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #f9f9f9;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 轮播图优化 */
.carousel-section {
  margin: 20px auto;
  width: 92%;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
}

.carousel-image {
  transition: all 0.5s ease;
  filter: brightness(0.95);
}

.el-carousel__item:hover .carousel-image {
  filter: brightness(1.05);
  transform: scale(1.02);
}

/* 标题样式 */
h3 {
  margin: 25px auto 15px;
  font-size: 18px;
  font-weight: 600;
  color: #333;
  position: relative;
  padding-left: 12px;
  letter-spacing: 0.5px;
  width: 90%;
  max-width: 1200px;
}

h3::before {
  content: "";
  position: absolute;
  left: 0;
  top: 25%;
  height: 50%;
  width: 4px;
  background: #fcfcfc;
  border-radius: 2px;
}

/* 卡片样式优化 */
.music-card {
  margin-bottom: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
}

.music-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.12);
}

.card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
  flex-grow: 0;
}

.music-card:hover .card-image {
  transform: scale(1.05);
}

/* 播放器优化 - 添加动态显示和居中效果 */
.player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: rgba(255, 255, 255, 0.95);
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 10px 0;
  transform: translateY(100%);
  transition: transform 0.4s ease;
  opacity: 0.2;
}

/* 当鼠标靠近底部时显示播放器 */
.player-footer.show {
  transform: translateY(0);
  opacity: 1;
}

/* 居中播放器内容 */
.player-controls {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 20px;
}

/* 优化左侧控制区布局 */
.left-controls {
  display: flex;
  align-items: center;
  gap: 15px;
  width: 300px;
}

/* 专辑封面样式 */
.music-cover {
  width: 60px;
  height: 60px;
  border-radius: 4px;
  overflow: hidden;
  margin-right: 10px;
}

.music-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 音乐信息显示优化 */
.music-info {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.music-name {
  font-weight: 500;
  color: #333;
  margin-bottom: 4px;
}

.music-singer {
  font-size: 12px;
  color: #666;
}

/* 进度条区域优化 */
.progress-section {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 20px;
  max-width: 600px;
}

audio {
  width: 100%;
  max-width: 500px;
}

/* 进度条优化 */
.progress-bar :deep(.el-slider__runway) {
  height: 4px;
  background-color: #e8e8e8;
}

:deep(.el-slider__bar) {
  background-color: #409EFF;
}

:deep(.el-slider__button) {
  border: 2px solid #409EFF;
  transition: transform 0.2s;
}

:deep(.el-slider__button):hover {
  transform: scale(1.2);
}

/* 音频控件美化 */
audio {
  border-radius: 4px;
}

/* 卡片内容区域 */
.card-footer {
  padding: 12px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.card-footer h3 {
  margin: 0;
  padding-left: 0;
  font-size: 14px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-footer h3::before {
  display: none;
}

.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.progress-section {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中对齐（可选） */
  gap: 10px; /* 添加一些间距 */
}

/* 确保内容区域和 footer 布局 */
.content {
  display: flex;
  flex-direction: column;
  min-height: 100vh; /* 占满整个视口高度 */
}

.red {
  color: red; /* 收藏后显示为红色 */
}

.playlist-grid {
  margin: 1rem auto 2rem;
  width: 90%;
  max-width: 1200px;
  padding: 0;
}

.player-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  background: #fff;
  box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  padding: 10px 20px;
}


.progress-section i {
  cursor: pointer;
  font-size: 20px;
}

.header {
  display: flex;
  justify-content: space-between; /* 保持两侧间距 */
  align-items: center;
  padding: 0 7rem;
  height: 60px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.volume-slider-container {
  display: flex;
  align-items: center;
  height: 100px; /* 控制滑块高度 */
  margin-left: 10px;
}

/* 自定义滑块样式 */
:deep(.el-slider__bar) {
  background-color: #409eff; /* 滑块背景色 */
}


:deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border: 2px solid #409eff; /* 滑块按钮边框 */
}

/* 新增导航区容器 */
.nav-section {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* 控制按钮与搜索框间距 */
}

.nav-buttons {
  display: flex;
  gap: 1rem; /* 按钮间间距 */
}

.search-input {
  width: 200px;
  transition: all 0.3s;
}

/* 保持右侧操作区样式 */
.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .nav-section {
    gap: 0.5rem;
  }

  .search-input {
    width: 150px;
  }

  .nav-buttons .el-button {
    font-size: 0.9rem;
    padding: 8px;
  }
}

.nav-buttons[data-v-47323bf2] {
  display: flex;
  gap: 1rem;
  width: 44%;
}


.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input {
  width: 200px;
  margin-right: 1rem;
}

.content {
  flex: 1;
  padding: 2rem;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-grid {
  margin-top: 2rem;
  width: 90%;
  margin-left: 7%;
}

.music-card {
  margin-bottom: 1rem;
}

.card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-footer {
  padding: 1rem 0;
  text-align: center;
}

.card-footer h3 {
  margin: 0;
  font-size: 1rem;
}

.card-footer p {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.player-footer {
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.progress-section {
  flex: 1;
  margin: 0 2rem;
}

.progress-bar :deep(.el-slider__runway) {
  height: 4px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.volume-slider {
  width: 100px;
}

.time {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
  display: block;
}

.card-footer {
  padding: 1rem 0;
  text-align: center;
}

.card-footer h3 {
  margin: 0;
  font-size: 1rem;
}

.card-footer p {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.player-footer {
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.1);
  padding: 1rem 2rem;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.progress-section {
  flex: 1;
  margin: 0 2rem;
}

.progress-bar :deep(.el-slider__runway) {
  height: 4px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.volume-slider {
  width: 100px;
}

.time {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
  display: block;
}
</style>