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
import store from "@/store";


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
      availableMoods: ['none', 'calm', 'happy', 'sad', 'angry', 'surprised', 'tired'], // 更新包括"无心情"选项
      moodLabels: { // 添加心情值到显示文本的映射
        'none': '无心情',
        'calm': '平静',
        'happy': '开心',
        'sad': '悲伤',
        'angry': '愤怒',
        'surprised': '惊讶',
        'tired': '疲惫'
      },
      availableActivities: ['studying', 'working', 'exercising', 'relaxing', 'commuting', ''] // 可选活动
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
        activity: this.currentActivity // 确保活动信息也被发送给推荐系统
      };
    }
  },
  watch: {
    // 监听用户对象的变化，特别是mood属性
    user: {
      handler(newUser, oldUser) {
        // 当用户整个对象变化时，检查心情是否变化
        const newMood = newUser?.mood;
        const oldMood = oldUser?.mood;
        const newActivity = newUser?.activity;
        const oldActivity = oldUser?.activity;
        
        if (newMood !== oldMood) {
          console.log('tuijianPage: 监听到用户心情变化:', oldMood, '->', newMood);
          
          // 更新组件的当前心情
          if (newMood && newMood !== this.currentMood) {
            this.currentMood = newMood;
            console.log('tuijianPage: 同步组件心情:', this.currentMood);
          }
        }
        
        if (newActivity !== oldActivity) {
          console.log('tuijianPage: 监听到用户活动变化:', oldActivity, '->', newActivity);
          
          // 更新组件的当前活动
          if (newActivity !== undefined && newActivity !== this.currentActivity) {
            this.currentActivity = newActivity;
            console.log('tuijianPage: 同步组件活动:', this.currentActivity);
          }
        }
        
        // 如果心情或活动有变化，强制更新UI
        if (newMood !== oldMood || newActivity !== oldActivity) {
          this.$nextTick(() => this.$forceUpdate());
        }
      },
      deep: true, // 深度监听
      immediate: true // 立即执行一次
    }
  },
  created() {
    console.log('tuijianPage: created生命周期钩子执行');
    
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    console.log('tuijianPage: 从localStorage获取到的用户：', this.user);
    
    // 先确保获取到用户心情和活动后再加载推荐
    Promise.all([this.getUserMood(), this.getUserActivity()])
      .then(() => {
        console.log('tuijianPage: 心情和活动获取完成，准备加载推荐');
        this.loadRecommendations();
      })
      .catch(err => {
        console.error('tuijianPage: 获取用户数据失败，使用默认设置加载推荐:', err);
        this.loadRecommendations();
      });
  },
  mounted() {
    // 添加页面可见性变化事件监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },
  beforeDestroy() {
    // 移除页面可见性变化事件监听
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },
  methods: {
    // 获取用户心情
    getUserMood() {
      if (!this.user || !this.user.id) {
        return Promise.resolve(); // 如果没有用户，返回一个已解决的Promise
      }
      
      console.log('tuijianPage: 正在获取用户心情...');
      
      // 返回API调用的Promise
      return api.get('/api/user/get_mood/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        console.log('tuijianPage: API返回的心情数据:', res);
        
        if (res.status === 'success') {
          // 设置当前心情，确保有一个默认值
          const mood = res.mood || 'none';
          
          console.log('tuijianPage: 更新心情为:', mood, '之前心情为:', this.currentMood);
          
          // 更新当前心情
          this.currentMood = mood;
          
          // 同时更新用户对象，确保在其他地方也能获取到
          if (this.user) {
            const updatedUser = JSON.parse(JSON.stringify(this.user));
            updatedUser.mood = mood;
            
            // 使用全局的store更新用户状态
            return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
              console.log('tuijianPage: Vuex状态已更新，当前心情:', mood, '从user对象读取:', this.user.mood);
              
              // 强制重新计算和重新渲染
              this.$nextTick(() => {
                this.$forceUpdate();
                console.log('tuijianPage: UI已强制更新');
              });
            });
          }
        }
        return Promise.resolve(); // 确保总是返回一个Promise
      }).catch(err => {
        console.error('tuijianPage: 获取用户心情失败:', err);
        return Promise.reject(err); // 将错误向上传递
      });
    },
    
    // 获取用户活动
    getUserActivity() {
      if (!this.user || !this.user.id) {
        return Promise.resolve(); // 如果没有用户，返回一个已解决的Promise
      }
      
      console.log('tuijianPage: 正在获取用户活动...');
      
      // 返回API调用的Promise
      return api.get('/api/user/get_activity/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        console.log('tuijianPage: API返回的活动数据:', res);
        
        if (res.status === 'success') {
          // 设置当前活动，确保有一个默认值
          const activity = res.activity || '';
          
          console.log('tuijianPage: 更新活动为:', activity, '之前活动为:', this.currentActivity);
          
          // 更新当前活动
          this.currentActivity = activity;
          
          // 同时更新用户对象，确保在其他地方也能获取到
          if (this.user) {
            const updatedUser = JSON.parse(JSON.stringify(this.user));
            updatedUser.activity = activity;
            
            // 使用全局的store更新用户状态
            return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
              console.log('tuijianPage: Vuex状态已更新，当前活动:', activity, '从user对象读取:', this.user.activity);
              
              // 强制重新计算和重新渲染
              this.$nextTick(() => {
                this.$forceUpdate();
                console.log('tuijianPage: UI已强制更新');
              });
            });
          }
        }
        return Promise.resolve(); // 确保总是返回一个Promise
      }).catch(err => {
        console.error('tuijianPage: 获取用户活动失败:', err);
        return Promise.reject(err); // 将错误向上传递
      });
    },
    
    // 加载推荐
    loadRecommendations() {
      this.loading = true;
      
      // 记录当前心情和活动，避免API调用过程中丢失
      const currentMood = this.currentMood || this.user?.mood || 'none';
      const currentActivity = this.currentActivity || this.user?.activity || '';
      console.log('tuijianPage: loadRecommendations 前的心情:', currentMood, '活动:', currentActivity);
      
      // 获取当前上下文
      const context = this.userContext;
      
      api.post('/api/music/tuijianSongs/', {
        ...context,
        pageNum: this.currentPage,
        pageSize: this.pageSize
      })
      .then(res => {
        // 确保心情和活动不会在API响应后丢失
        console.log('tuijianPage: loadRecommendations API返回后，状态检查:', 
          '当前组件心情:', this.currentMood,
          '当前组件活动:', this.currentActivity,
          'Vuex心情:', this.user?.mood,
          'Vuex活动:', this.user?.activity);
        
        // 如果API响应后心情丢失，恢复之前的心情
        if (!this.currentMood || this.currentMood === '') {
          this.currentMood = currentMood;
          console.log('tuijianPage: 恢复之前的心情:', this.currentMood);
        }
        
        // 如果API响应后活动丢失，恢复之前的活动
        if (!this.currentActivity && currentActivity) {
          this.currentActivity = currentActivity;
          console.log('tuijianPage: 恢复之前的活动:', this.currentActivity);
        }
        
        // 同步更新用户对象
        if (this.user && ((!this.user.mood || this.user.mood !== currentMood) || 
                           (this.user.activity !== currentActivity && currentActivity))) {
          const updatedUser = JSON.parse(JSON.stringify(this.user));
          if (!updatedUser.mood) updatedUser.mood = currentMood;
          if (currentActivity) updatedUser.activity = currentActivity;
          
          store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            console.log('tuijianPage: 已将心情和活动同步到Vuex:', currentMood, currentActivity);
            this.$forceUpdate();
          });
        }
        
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
        console.error('tuijianPage: 获取推荐失败', err);
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
    
    // 处理页面可见性变化
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，重新获取用户心情和活动，然后刷新推荐
        Promise.all([this.getUserMood(), this.getUserActivity()])
          .then(() => {
            // 只有当页面有推荐内容时才重新加载，避免重复加载
            if (this.recommendations.length > 0) {
              this.loadRecommendations();
            }
          })
          .catch(err => {
            console.error('tuijianPage: 刷新页面数据失败:', err);
          });
      }
    },
    
    // 获取心情显示文本
    getMoodLabel(mood) {
      return this.moodLabels[mood] || '平静';
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