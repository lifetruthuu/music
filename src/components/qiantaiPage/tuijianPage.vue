<template>
  <div class="recommendation-container">
    <h1 class="page-title">为您推荐</h1>
    
    <!-- 如果有推荐内容 -->
    <div v-if="recommendations.length" class="recommendations-grid">
      <div v-for="(song, index) in recommendations" :key="song.id" class="recommendation-card">
        <div class="song-cover" @click="playRecommendation(song, index)">
          <img :src="getFullImagePath(song.musicPath)" alt="歌曲封面" />
          <div class="play-overlay">
            <i class="el-icon-video-play"></i>
          </div>
        </div>
        
        <div class="song-info">
          <h3 class="song-title">{{ song.name }}</h3>
          <p class="song-artist">{{ song.singerNames }}</p>
          
          <!-- 添加推荐原因显示 -->
          <div v-if="song.recommendReason" class="recommend-reason">
            {{ song.recommendReason }}
          </div>
          
          <!-- 添加反馈按钮 -->
          <div class="feedback-buttons">
            <el-button 
              type="success" 
              size="mini" 
              icon="el-icon-thumb" 
              circle
              @click.stop="likeSong(song, index)"
              title="喜欢"
            ></el-button>
            <el-button 
              type="danger" 
              size="mini" 
              icon="el-icon-close" 
              circle
              @click.stop="dislikeSong(song, index)"
              title="不喜欢"
            ></el-button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 无推荐内容时显示 -->
    <div v-else class="no-recommendations">
      <i class="el-icon-warning-outline"></i>
      <p>正在为您生成个性化推荐...</p>
    </div>
    
    <!-- 分页控件 -->
    <div v-if="recommendations.length" class="pagination-container">
      <el-pagination
        background
        layout="prev, pager, next"
        :total="totalRecommendations"
        :page-size="pageSize"
        :current-page.sync="currentPage"
        @current-change="handlePageChange"
      ></el-pagination>
    </div>
  </div>
</template>

<script>
import api from "@/api/axios";
import BehaviorService from "@/services/BehaviorService";

export default {
  name: 'TuijianPage',
  data() {
    return {
      recommendations: [],
      totalRecommendations: 0,
      currentPage: 1,
      pageSize: 12,
      loading: false,
      user: null,
      currentMood: '', // 用户当前心情
      currentActivity: '', // 用户当前活动
      availableMoods: ['relaxed', 'energetic', 'happy', 'sad', 'focused'], // 可选心情
      availableActivities: ['studying', 'working', 'exercising', 'relaxing', 'commuting'] // 可选活动
    }
  },
  computed: {
    // 生成当前的用户上下文信息
    userContext() {
      return {
        userId: this.user?.id,
        deviceType: BehaviorService.getDeviceType(),
        timeOfDay: BehaviorService.getTimeOfDay(),
        dayOfWeek: new Date().getDay(),
        mood: this.currentMood,
        activity: this.currentActivity
      };
    }
  },
  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    this.loadRecommendations();
  },
  methods: {
    // 加载推荐
    loadRecommendations() {
      this.loading = true;
      
      // 获取当前上下文
      const context = this.userContext;
      
      api.post('/api/music/tuijianSongs/', {
        ...context,
        pageNum: this.currentPage,
        pageSize: this.pageSize
      })
      .then(res => {
        this.recommendations = res.list || [];
        this.totalRecommendations = res.total || 0;
        
        // 如果返回的推荐中没有包含推荐原因，为每个推荐添加一个默认的推荐原因
        this.recommendations = this.recommendations.map(song => {
          if (!song.recommendReason) {
            // 基于当前时间段生成简单的推荐原因
            const timeReasons = {
              'morning': '清晨活力之选',
              'afternoon': '下午放松必听',
              'evening': '晚间休闲佳品',
              'night': '夜晚舒眠良曲'
            };
            
            song.recommendReason = timeReasons[context.timeOfDay] || '猜你喜欢';
            song.source = song.source || 'hybrid'; // 设置推荐来源
          }
          return song;
        });
      })
      .catch(err => {
        console.error('获取推荐失败', err);
        this.$message.error('获取推荐失败，请重试');
      })
      .finally(() => {
        this.loading = false;
      });
    },
    
    // 获取完整图片路径
    getFullImagePath(path) {
      return path ? `http://localhost:8000${path}` : require('@/assets/1740221844832.jpg');
    },
    
    // 处理页面变化
    handlePageChange(page) {
      this.currentPage = page;
      this.loadRecommendations();
    },
    
    // 播放推荐歌曲
    playRecommendation(song, index) {
      // 记录推荐点击反馈
      BehaviorService.recordFeedback(song, 'clicked', index, this.user.id);
      
      // 触发事件告知父组件播放此歌曲
      this.$emit('onGoToSongDetail', song.id);
    },
    
    // 喜欢歌曲
    likeSong(song, index) {
      BehaviorService.recordFeedback(song, 'liked', index, this.user.id);
      
      // 添加到收藏
      api.post('/api/music/favorites/', {
        musicId: song.id,
        userId: this.user.id
      }).then(() => {
        this.$message({
          type: 'success',
          message: '已添加到我喜欢的音乐',
          duration: 1500
        });
      }).catch(err => {
        console.error('添加收藏失败', err);
      });
    },
    
    // 不喜欢歌曲
    dislikeSong(song, index) {
      BehaviorService.recordFeedback(song, 'disliked', index, this.user.id);
      
      // 从当前推荐列表中移除
      this.recommendations = this.recommendations.filter(item => item.id !== song.id);
      
      this.$message({
        type: 'info',
        message: '感谢您的反馈，我们将优化您的推荐',
        duration: 1500
      });
      
      // 如果移除后列表为空，加载更多推荐
      if (this.recommendations.length === 0) {
        this.loadRecommendations();
      }
    },
    
    // 设置心情
    setMood(mood) {
      this.currentMood = mood;
      this.loadRecommendations();
    },
    
    // 设置活动
    setActivity(activity) {
      this.currentActivity = activity;
      this.loadRecommendations();
    }
  }
}
</script>

<style scoped>
.recommendation-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  font-size: 28px;
  margin-bottom: 30px;
  color: #333;
  text-align: center;
}

.recommendations-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 30px;
  margin-bottom: 40px;
}

.recommendation-card {
  background: #fff;
  border-radius: 10px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.recommendation-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
}

.song-cover {
  position: relative;
  height: 180px;
  overflow: hidden;
  cursor: pointer;
}

.song-cover img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
}

.recommendation-card:hover .song-cover img {
  transform: scale(1.1);
}

.play-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-overlay i {
  font-size: 48px;
  color: white;
}

.song-cover:hover .play-overlay {
  opacity: 1;
}

.song-info {
  padding: 15px;
}

.song-title {
  margin: 0 0 10px;
  font-size: 16px;
  font-weight: 600;
  color: #333;
}

.song-artist {
  margin: 0 0 15px;
  font-size: 14px;
  color: #666;
}

.recommend-reason {
  margin: 10px 0;
  font-size: 12px;
  color: #888;
  font-style: italic;
  padding: 5px 10px;
  background: #f9f9f9;
  border-radius: 4px;
}

.feedback-buttons {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-top: 15px;
}

.no-recommendations {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 100px 20px;
  text-align: center;
}

.no-recommendations i {
  font-size: 48px;
  color: #d0d0d0;
  margin-bottom: 20px;
}

.no-recommendations p {
  font-size: 18px;
  color: #888;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 30px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .recommendations-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 15px;
  }
  
  .song-cover {
    height: 130px;
  }
  
  .song-title {
    font-size: 14px;
  }
  
  .song-artist {
    font-size: 12px;
  }
}
</style>