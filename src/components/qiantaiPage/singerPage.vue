<template>
  <div class="singer-page-container">
    <!-- 标题和描述 -->
    <div class="page-header">
      <h1 class="page-title">热门歌手</h1>
      <p class="page-description">发现你喜爱的音乐人</p>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <span>正在加载歌手信息...</span>
    </div>

    <!-- 歌手列表 -->
    <transition-group 
      name="artist-list" 
      tag="div" 
      class="artist-container"
      v-else
    >
      <div
          class="artist-card"
          v-for="(artist, index) in artists"
          :key="artist.id || index"
          @click="onChangeSinger(artist)"
          :style="{ animationDelay: `${index * 0.05}s` }"
      >
        <div class="artist-content">
          <div class="image-container">
            <img
                :src="imagePath(artist)"
                alt="歌手封面"
                class="music-cover"
                loading="lazy"
            />
          </div>
          <div class="artist-info">
            <span class="chinese-name">{{ artist.name }}</span>
            <span class="song-count" v-if="artist.songsCount">{{ artist.songsCount }} 首歌曲</span>
          </div>
        </div>
      </div>
    </transition-group>

    <!-- 无数据展示 -->
    <div v-if="!loading && artists.length === 0" class="no-data">
      <i class="el-icon-warning-outline"></i>
      <p>没有找到相关歌手</p>
    </div>

    <!-- 分页组件 -->
    <Pagination 
      v-if="artists.length > 0"
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
    queryStr: String
  },
  data() {
    return {
      artists: [],
      loading: false,
      page: {
        currentPage: 1,
        pageSize: 10,
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
    imagePath(artist) {
      return artist.urlPath ? this.fullImagePath(artist.urlPath) :  require('@/assets/img.png');
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    initData(queryString) {
      this.loading = true;

      api.post('/api/singer/list/', {
        queryStr: queryString || this.queryStr,
        pageNum: this.page.currentPage,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.artists = res.list;
        this.page.total = res.total;
        this.loading = false;
      }).catch(err => {
        console.error('请求失败:', err);
        this.artists = [];
        this.page.total = 0;
        this.loading = false;
      });
    },
    onChangeSinger(item){
      let singerId = item.id;
      // 直接通过事件触发跳转，与gedanPage的onGedanAudio方法一致
      this.$emit("onQuerySingerMusic", singerId);
    },
    // 处理分页变化
    handlePageChange(page) {
      this.page.currentPage = page;
      this.initData();
    }
  }
}
</script>

<style scoped>
.singer-page-container {
  display: flex;
  flex-direction: column;
  padding: 20px;
  min-height: 80vh;
}

.page-header {
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

.page-description {
  font-size: 1.1rem;
  color: #606266;
  margin-top: 15px;
}

.artist-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 25px;
  padding: 10px;
  max-width: 1200px;
  margin: 0 auto;
  width: 100%;
}

.artist-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 6px 15px rgba(0, 0, 0, 0.05);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  animation: fadeInUp 0.5s ease forwards;
  opacity: 0;
  transform: translateY(30px);
}

.artist-card:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 20px rgba(0, 0, 0, 0.1);
}

.artist-card:active {
  transform: scale(0.98);
}

.artist-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f5f7fa 0%, #ecf0f3 100%);
  z-index: -1;
}

.artist-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.image-container {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  overflow: hidden;
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
}

.image-container::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  box-shadow: inset 0 0 10px rgba(0, 0, 0, 0.2);
  border-radius: 50%;
}

.music-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.artist-card:hover .music-cover {
  transform: scale(1.1) rotate(3deg);
}

.artist-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.chinese-name {
  font-size: 1.2rem;
  font-weight: 600;
  color: #303133;
  margin-bottom: 5px;
  transition: color 0.3s ease;
}

.song-count {
  font-size: 0.9rem;
  color: #909399;
}

.artist-card:hover .chinese-name {
  color: #409eff;
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
  margin-top: 40px;
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

/* 列表动画 */
.artist-list-enter-active {
  transition: all 0.5s ease;
}

.artist-list-leave-active {
  transition: all 0.3s cubic-bezier(1, 0.5, 0.8, 1);
  position: absolute;
}

.artist-list-enter, .artist-list-leave-to {
  transform: translateY(30px);
  opacity: 0;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .artist-container {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
    gap: 15px;
    padding: 10px;
  }

  .image-container {
    width: 120px;
    height: 120px;
  }

  .page-title {
    font-size: 2rem;
  }
}

@media (max-width: 480px) {
  .artist-container {
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }

  .artist-card {
    padding: 15px;
  }

  .image-container {
    width: 100px;
    height: 100px;
  }

  .chinese-name {
    font-size: 1rem;
  }
}
</style>