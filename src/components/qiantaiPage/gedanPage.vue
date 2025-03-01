<template>
  <div class="gedan-container">
    <!-- 标题和描述区域 -->
    <div class="header-section">
      <h2 class="page-title">精选歌单</h2>
      <p class="page-subtitle">探索你的音乐世界，发现专属于你的乐趣</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>正在加载歌单信息...</span>
    </div>

    <!-- 歌单列表 -->
    <div class="playlist-grid" v-else>
      <transition-group 
        name="playlist-fade" 
        tag="el-row" 
        :gutter="20"
      >
        <el-col
            v-for="(item, index) in tableData"
            :key="item.id || index"
            :xs="12"
            :sm="8"
            :md="6"
            :lg="4"
            :style="{ animationDelay: `${index * 0.05}s` }"
            class="playlist-item-col"
        >
          <div class="music-card" @click="onGedanAudio(item, index)">
            <div class="card-image-container">
              <img
                  :src="fullImagePath(item.urlPath)"
                  class="card-image"
                  alt="歌单封面"
                  loading="lazy"
              />
              <div class="play-overlay">
                <i class="el-icon-video-play"></i>
              </div>
            </div>
            <div class="card-content">
              <h3 class="card-title">{{ item.name }}</h3>
              <p class="card-info" v-if="item.songCount">
                <i class="el-icon-headset"></i> {{ item.songCount }}首歌曲
              </p>
            </div>
          </div>
        </el-col>
      </transition-group>
    </div>

    <!-- 无数据展示 -->
    <div v-if="!loading && tableData.length === 0" class="no-data">
      <i class="el-icon-warning-outline"></i>
      <p>暂无歌单</p>
    </div>

    <!-- 分页组件 -->
    <Pagination 
      v-if="tableData.length > 0"
      :total="page.total" 
      :pageSize="page.pageSize" 
      :currentPage.sync="page.currentPage"
      @change="handlePageChange"
      class="pagination-container"
    />
  </div>
</template>

<script>
import api from "@/api/axios";
import Pagination from "@/components/com/Pagination.vue";

export default {
  components: {
    Pagination
  },
  props:{
    queryStr: String,
  },
  data() {
    return {
      tableData: [],
      loading: false,
      page: {
        currentPage: 1,
        pageSize: 12,
        total: 0
      }
    }
  },
  watch: {
    queryStr(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.page.currentPage = 1; // 搜索条件变化，重置到第一页
      this.initData(newVal);
    }
  },

  created() {
    this.initData();
  },
  methods: {
    fullImagePath(path) {
      // 拼接完整的图片 URL
      if (!path) return require('@/assets/img.png');
      return `http://localhost:8000${path}`;
    },
    
    initData(queryString) {
      this.loading = true;
      const queryStr = queryString || this.queryStr || '';
      
      api.post('/api/music/gedanList/', {
        queryStr,
        pageNum: this.page.currentPage,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.tableData = res.list;
        this.page.total = res.total || 0;
        this.loading = false;
      }).catch(err => {
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
        this.loading = false;
      });
    },

    onGedanAudio(item, index) {
      //跳转到歌单列表
      this.$emit("onMusicListByGedan", {geDanId: item.id, index: 1});
    },
    
    // 处理分页变化
    handlePageChange(page) {
      this.page.currentPage = page;
      this.initData();
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
.gedan-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 30px 20px;
  background-color: #f9fafc;
  min-height: 80vh;
}

.header-section {
  text-align: center;
  margin-bottom: 40px;
  animation: fadeIn 0.8s ease;
}

.page-title {
  font-size: 2.5rem;
  font-weight: 700;
  margin-bottom: 10px;
  color: #303133;
  position: relative;
  display: inline-block;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 50%;
  transform: translateX(-50%);
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #606266;
  margin-top: 15px;
}

.playlist-grid {
  width: 90%;
  max-width: 1200px;
  margin: 0 auto;
  background-color: transparent;
  padding: 20px 0;
}

.playlist-item-col {
  margin-bottom: 30px;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(30px);
}

.music-card {
  width: 100%;
  height: 100%;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.06);
  transition: all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1);
  background-color: #fff;
  display: flex;
  flex-direction: column;
  cursor: pointer;
}

.music-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.1);
}

.card-image-container {
  position: relative;
  overflow: hidden;
  padding-top: 100%; /* 保持1:1的长宽比 */
}

.card-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.music-card:hover .card-image {
  transform: scale(1.08);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.3);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-overlay i {
  font-size: 48px;
  color: white;
  opacity: 0.9;
  transform: scale(0.8);
  transition: transform 0.3s ease;
}

.music-card:hover .play-overlay {
  opacity: 1;
}

.music-card:hover .play-overlay i {
  transform: scale(1);
}

.card-content {
  padding: 15px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.card-title {
  margin: 0 0 8px 0;
  font-size: 1rem;
  font-weight: 600;
  color: #303133;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: color 0.3s ease;
}

.music-card:hover .card-title {
  color: #409eff;
}

.card-info {
  margin: 0;
  font-size: 0.85rem;
  color: #909399;
  display: flex;
  align-items: center;
  gap: 5px;
}

.card-info i {
  font-size: 0.9rem;
}

/* 加载动画 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  gap: 20px;
  color: #909399;
}

.loading-spinner {
  width: 50px;
  height: 50px;
  border: 5px solid #f3f3f3;
  border-top: 5px solid #409eff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

/* 无数据状态 */
.no-data {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 300px;
  color: #909399;
  animation: fadeIn 0.8s ease;
}

.no-data i {
  font-size: 3rem;
  margin-bottom: 20px;
  color: #dcdfe6;
}

.no-data p {
  font-size: 1.2rem;
}

/* 分页容器 */
.pagination-container {
  margin: 30px 0;
  display: flex;
  justify-content: center;
  animation: fadeIn 0.8s ease;
}

/* 动画定义 */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 列表过渡动画 */
.playlist-fade-enter-active {
  transition: all 0.5s ease;
}

.playlist-fade-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  position: absolute;
}

.playlist-fade-enter, .playlist-fade-leave-to {
  transform: translateY(30px);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .page-title {
    font-size: 2rem;
  }
  
  .page-subtitle {
    font-size: 1rem;
  }
  
  .playlist-grid {
    width: 95%;
    padding: 10px 0;
  }
  
  .playlist-item-col {
    margin-bottom: 20px;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 1.8rem;
  }
  
  .page-title::after {
    width: 60px;
  }
  
  .card-title {
    font-size: 0.9rem;
  }
}
</style>