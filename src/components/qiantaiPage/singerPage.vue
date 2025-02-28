<template>
  <div class="artist-container">
    <div
        class="artist-card"
        v-for="(artist, index) in artists"
        :key="index"
        @click="onChangeSinger(artist)"
    >
      <div class="artist-content">
        <img
            :src="imagePath(artist)"
            alt="音乐封面"
            class="music-cover"
        />
        <span class="chinese-name">{{ artist.name }}</span>
      </div>
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
      artists: [
      ]
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
    imagePath(artist) {
      return artist.urlPath ? this.fullImagePath(artist.urlPath) :  require('@/assets/img.png');
      // return this.fullImagePath(item.musicPath)
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    initData() {
      api.post('/api/singer/list/', {
        queryStr:this.queryStr,
        pageNum: 1,
        pageSize: 1000,
      }).then(res => {
        this.artists = res.list;
        this.page.total = res.total;
      }).catch(err => {
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
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
.artist-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 20px;
  padding: 30px;
  max-width: 1200px;
  margin: 0 auto;
}

.artist-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.artist-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.1);
}

.artist-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
  z-index: -1;
}

.artist-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.chinese-name {
  font-family: 'Noto Sans SC', sans-serif;
  font-weight: 600;
  font-size: 1.4rem;
  color: #1f2937;
  margin-bottom: 8px;
}

.english-name {
  font-family: 'Roboto', sans-serif;
  font-weight: 400;
  font-size: 0.9rem;
  color: #6b7280;
  letter-spacing: 0.5px;
}

@media (max-width: 768px) {
  .artist-container {
    grid-template-columns: 1fr;
    padding: 20px;
  }

  .artist-card {
    padding: 15px;
  }

  .chinese-name {
    font-size: 1.2rem;
  }
}
.artist-content {
  display: flex;
  align-items: center;
  gap: 10px; /* 调整图片和文字之间的间距 */
}

.music-cover {
  width: 150px; /* 设置图片的宽度 */
  height: 150px; /* 设置图片的高度 */
  border-radius: 50%; /* 将图片设置为圆形 */
  object-fit: cover; /* 确保图片内容填充整个区域 */
  border: 2px solid #ddd; /* 可选：添加一个边框 */
}

.chinese-name {
  font-size: 16px; /* 设置文字大小 */
  font-weight: bold; /* 设置文字为加粗 */
}
</style>