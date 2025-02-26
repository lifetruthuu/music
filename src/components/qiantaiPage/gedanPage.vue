<template>
  <div class="gedan-container">
    <h3 class="page-title">歌单列表</h3>

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
              <h3 class="card-title">{{ item.name }}</h3>
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
.gedan-container {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px 0;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-title {
  font-size: 24px;
  font-weight: bold;
  margin-bottom: 20px;
  color: #303133;
}

.playlist-grid {
  width: 70%;
  margin: 0 auto;
  background-color: #fff;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

/* 修复卡片大小问题 */
.el-col {
  display: flex;
  margin-bottom: 20px;
}

.music-card {
  width: 100%;
  height: 100%;
  margin-bottom: 0;
  transition: all 0.3s;
  cursor: pointer;
  border-radius: 8px;
  overflow: hidden;
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
  height: 100px; /* 固定卡片底部高度 */
  box-sizing: border-box; /* 确保padding不会增加元素高度 */
}

.card-title {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  font-family: 'STXinwei' !important;
  color: #303133;
  white-space: normal; /* 允许文本换行 */
  overflow: visible; /* 允许内容溢出 */
  text-overflow: clip; /* 移除省略号 */
  line-height: 1.4; /* 控制行高 */
  display: -webkit-box; /* 使用box布局实现多行文本 */
  -webkit-line-clamp: 3; /* 最多显示3行 */
  -webkit-box-orient: vertical; /* 垂直方向排列 */
  max-height: 4.2em; /* 3行文本的最大高度 (1.4 * 3) */
}

/* 保留其他必要的样式 */
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.progress-section {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.content {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.red {
  color: red;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .playlist-grid {
    width: 90%;
  }
}
</style>