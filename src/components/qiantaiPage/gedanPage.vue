<template>
  <div>
    <h3>歌单列表</h3>

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
        <el-card class="music-card" @click.native="onGedanAudio(item, index)">
          <img
              :src="fullImagePath(item.urlPath)"
              class="card-image"
          />


          <div class="card-footer">
            <h3 style="text-align: left">{{ item.name }}</h3>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
  </div>
</template>

<script>
import api from "@/api/axios";
export default {
  props:{
    queryStr:String,
  },
  data() {
    return {
      tableData: []
    }
  },
  watch: {
    queryStr(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.initData(newVal);
    }
  },

  created() {
    this.initData();
  },
  methods: {
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    initData() {
      const queryStr = this.searchKey || '';
      api.post('/api/music/gedanList/', {
        queryStr,
        pageNum: 1,
        pageSize: 1000,
      }).then(res => {
        this.tableData = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
        this.tableData = [];
      });
    },

    onGedanAudio(item, index) {
     //跳转到歌单列表
      this.$emit("onMusicListByGedan",{geDanId:item.id,index:1} )
    },

    onAudio(item, index, gedan) {
      // 重置播放状态
      this.currentAudioPath = '';

      this.$nextTick(() => {
        if (!item.audioPath) {
          console.error('无效的音频路径');
          return;
        }

        // 更新音频路径
        this.currentMusicId = item.id;
        this.currentAudioPath = `http://localhost:8000${item.audioPath}`;
        this.currentAudioName = item.name;

        // 直接播放（需用户已授权）
        let audio = this.$refs.audioPlayer;
        audio.load();

        audio.play().catch(error => {
          console.error('播放失败:', error);
        });
      });
    },
    onChangeSinger(item){
      let singerId= item.id;
      this.$emit("onQuerySingerMusic",singerId)
    },
  }
}
</script>

<style scoped>
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
  flex: 1; /* 内容区域填充剩余空间 */
  padding: 20px;
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