<template>
  <div class="recommendation-container" v-loading.fullscreen.lock="initialLoading" 
       element-loading-text="为您挑选中..." 
       element-loading-spinner="el-icon-loading"
       element-loading-background="rgba(255, 255, 255, 0.9)">
    <!-- 整体内容区域的淡入效果 -->
    <transition name="fade-in">
      <div v-if="!initialLoading" class="content-wrapper">
        <!-- 标题栏和偏好设置按钮放在同一行 -->
        <div class="header-container">
          <div class="title-container">
            <h1 class="page-title">为您推荐</h1>
            <p class="page-subtitle">获取属于您的个性化音乐推荐</p>
          </div>
          
          <!-- 添加偏好标签设置按钮 -->
          <div class="preference-options">
            <div class="button-wrapper">
              <el-button 
                class="refresh-button" 
                type="primary" 
                @click="handleRefresh"
                title="刷新推荐"
              >
                <i class="el-icon-refresh" style="font-size: 24px;"></i>
              </el-button>
              <el-button 
                class="preference-button" 
                type="primary" 
                @click="openTagDialog"
              >
                <i class="el-icon-set-up" style="font-size: 24px; margin-right: 4px;"></i>
                <span class="button-text">设置偏好标签</span>
              </el-button>
            </div>
          </div>
        </div>
        
        <!-- 如果有推荐内容 -->
        <transition-group 
          name="recommendation-list" 
          tag="div" 
          class="recommendations-grid"
          v-if="recommendations.length">
          <div v-for="(song, index) in recommendations" 
               :key="song.id" 
               class="recommendation-card"
               :style="{ animationDelay: index * 0.1 + 's' }">
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
        </transition-group>
        
        <!-- 无推荐内容时显示 -->
        <transition name="fade">
          <div v-if="!recommendations.length && !initialLoading" class="no-recommendations">
            <i class="el-icon-warning-outline pulse-animation"></i>
            <p>正在为您生成个性化推荐...</p>
          </div>
        </transition>
      </div>
    </transition>
    
    <!-- 偏好标签设置弹窗 -->
    <TitleSelect 
      :titleDialog="showTagDialog" 
      @onclose="closeTagDialog"
    />
  </div>
</template>

<script>
import api from "@/api/axios";
import BehaviorService from "@/services/BehaviorService";
import store from "@/store";
import TitleSelect from '@/components/dialog/titleSelect.vue';

export default {
  name: 'TuijianPage',
  components: {
    TitleSelect
  },
  data() {
    return {
      recommendations: [],
      totalRecommendations: 0,
      pageSize: 8, // 增加默认展示数量
      loading: false,
      initialLoading: true, // 添加初始加载状态
      user: '',
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
      availableActivities: ['studying', 'working', 'exercising', 'relaxing', 'commuting', ''], // 可选活动
      showTagDialog: false, // 控制偏好标签弹窗显示
      refreshInterval: null // 添加刷新间隔
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
          
          // 更新组件的当前心情
          if (newMood && newMood !== this.currentMood) {
            this.currentMood = newMood;
          }
        }
        
        if (newActivity !== oldActivity) {
          
          // 更新组件的当前活动
          if (newActivity !== undefined && newActivity !== this.currentActivity) {
            this.currentActivity = newActivity;
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
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    // 先确保获取到用户心情和活动后再加载推荐
    Promise.all([this.getUserMood(), this.getUserActivity()])
      .then(() => {
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
    // 打开标签设置对话框
    openTagDialog() {
      this.showTagDialog = true;
    },
    
    // 关闭标签设置对话框
    closeTagDialog() {
      this.showTagDialog = false;
      // 关闭后刷新推荐
      this.loadRecommendations();
    },
    
    // 获取用户心情
    getUserMood() {
      if (!this.user || !this.user.id) {
        return Promise.resolve(); // 如果没有用户，返回一个已解决的Promise
      }
      
      // 返回API调用的Promise
      return api.get('/api/user/get_mood/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        
        if (res.status === 'success') {
          // 设置当前心情，确保有一个默认值
          const mood = res.mood || 'none';
               
          // 更新当前心情
          this.currentMood = mood;
          
          // 同时更新用户对象，确保在其他地方也能获取到
          if (this.user) {
            const updatedUser = JSON.parse(JSON.stringify(this.user));
            updatedUser.mood = mood;
            
            // 使用全局的store更新用户状态
            return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
              
              // 强制重新计算和重新渲染
              this.$nextTick(() => {
                this.$forceUpdate();
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
      
      
      // 返回API调用的Promise
      return api.get('/api/user/get_activity/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        
        if (res.status === 'success') {
          // 设置当前活动，确保有一个默认值
          const activity = res.activity || '';
          
          
          // 更新当前活动
          this.currentActivity = activity;
          
          // 同时更新用户对象，确保在其他地方也能获取到
          if (this.user) {
            const updatedUser = JSON.parse(JSON.stringify(this.user));
            updatedUser.activity = activity;
            
            // 使用全局的store更新用户状态
            return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
              
              // 强制重新计算和重新渲染
              this.$nextTick(() => {
                this.$forceUpdate();
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
      
      // 获取当前上下文
      const context = this.userContext;
      
      api.post('/api/music/tuijianSongs/', {
        ...context,
        pageSize: this.pageSize
      })
      .then(res => {
        // 确保心情和活动不会在API响应后丢失
        
        // 如果API响应后心情丢失，恢复之前的心情
        if (!this.currentMood || this.currentMood === '') {
          this.currentMood = currentMood;
        }
        
        // 如果API响应后活动丢失，恢复之前的活动
        if (!this.currentActivity && currentActivity) {
          this.currentActivity = currentActivity;
        }
        
        // 同步更新用户对象
        if (this.user && ((!this.user.mood || this.user.mood !== currentMood) || 
                           (this.user.activity !== currentActivity && currentActivity))) {
          const updatedUser = JSON.parse(JSON.stringify(this.user));
          if (!updatedUser.mood) updatedUser.mood = currentMood;
          if (currentActivity) updatedUser.activity = currentActivity;
          
          store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            this.$forceUpdate();
          });
        }
        
        // 为了让动画更平滑，使用setTimeout延迟设置数据
        setTimeout(() => {
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
          this.initialLoading = false;
        }, 800); // 给予足够的时间进行初始加载动画展示
      })
      .catch(err => {
        console.error('tuijianPage: 获取推荐失败', err);
        this.$message.error('获取推荐失败，请重试');
        this.initialLoading = false; // 即使出错也要关闭加载动画
      })
      .finally(() => {
        this.loading = false;
      });
    },
    
    // 获取完整图片路径
    getFullImagePath(path) {
      return path ? `http://localhost:8000${path}` : require('@/assets/1740221844832.jpg');
    },
    
    // 播放推荐歌曲
    playRecommendation(song, index) {
      // 记录推荐点击反馈
      BehaviorService.recordFeedback(song, 'clicked', index, this.user.id);
      // 触发事件跳转至页面
      this.$emit('onGoToSongDetailFromTuijian', song.id, this.user.id);
    },
    
    // 喜欢歌曲
    likeSong(song, index) {
      BehaviorService.recordFeedback(song, 'liked', index, this.user.id);
      this.$message({
        type: 'success',
        message: '感谢您的反馈，我们将根据您的喜好为您推荐更多歌曲',
        duration: 1500
      });
      
      // 如果移除后列表为空，加载更多推荐
      if (this.recommendations.length === 0) {
        this.loadRecommendations();
      }
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
        this.refreshRecommendations();
      }
    },
    
    // 添加刷新方法
    handleRefresh() {
      // 显示加载动画
      this.initialLoading = true;
      // 调用刷新方法
      this.refreshRecommendations();
    },

    // 重构刷新推荐的方法
    refreshRecommendations() {
      Promise.all([this.getUserMood(), this.getUserActivity()])
        .then(() => {
          this.loadRecommendations();
        })
        .catch(err => {
          console.error('tuijianPage: 刷新页面数据失败:', err);
          this.$message.error('刷新推荐失败，请重试');
          this.initialLoading = false;
        });
    },
  }
}
</script>

<style scoped>
.recommendation-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 80vh; /* 确保即使内容不足也有足够的高度 */
}

.content-wrapper {
  width: 100%;
}

/* 页面整体淡入动画 */
.fade-in-enter-active {
  transition: opacity 0.8s ease-in-out;
}
.fade-in-enter {
  opacity: 0;
}
.fade-in-leave-active {
  transition: opacity 0.5s ease-in-out;
}
.fade-in-leave-to {
  opacity: 0;
}

/* 推荐卡片列表动画 */
.recommendation-list-enter-active, .recommendation-list-leave-active {
  transition: all 0.5s;
}
.recommendation-list-enter, .recommendation-list-leave-to {
  opacity: 0;
  transform: translateY(30px);
}

/* 单个卡片的动画 */
.recommendation-card {
  animation: fade-slide-up 0.6s ease-out forwards;
  opacity: 0;
}

@keyframes fade-slide-up {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 没有推荐内容时的动画 */
.pulse-animation {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0% {
    transform: scale(0.95);
    opacity: 0.7;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  100% {
    transform: scale(0.95);
    opacity: 0.7;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.5s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 标题和偏好按钮的容器 */
.header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.title-container {
  flex: 1;
}

/* 页面标题样式 */
.page-title {
  font-size: 28px;
  margin-bottom: 5px;
  color: #333;
  text-align: left;
  animation: slide-down 0.8s ease-out forwards;
  position: relative;
}

.page-title::after {
  content: '';
  position: absolute;
  bottom: -8px;
  left: 0;
  width: 80px;
  height: 3px;
  background: linear-gradient(90deg, #409eff, #67c23a);
  border-radius: 3px;
  transform: none;
}

.page-subtitle {
  font-size: 1.1rem;
  color: #606266;
  margin-top: 15px;
  text-align: left;
}

@keyframes slide-down {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 偏好设置按钮样式 */
.preference-options {
  display: flex;
  justify-content: flex-end;
}

/* 按钮包装器，用于动画 */
.button-wrapper {
  overflow: hidden;
  animation: expand-button 0.8s ease-out 0.3s forwards;
  transform-origin: right center;
  transform: scaleX(0);
  opacity: 0;
}

@keyframes expand-button {
  0% {
    transform: scaleX(0);
    opacity: 0;
  }
  50% {
    transform: scaleX(1.05);
    opacity: 0.8;
  }
  70% {
    transform: scaleX(0.98);
    opacity: 0.9;
  }
  100% {
    transform: scaleX(1);
    opacity: 1;
  }
}

/* 自定义按钮样式 */
.preference-button {
  background: linear-gradient(-225deg, #FF057C 0%, #7C64D5 48%, #4CC3FF 100%) !important;
  border: none !important;
  padding: 12px 24px !important;
  border-radius: 25px !important;
  font-weight: 500 !important;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(99, 102, 241, 0.2) !important;
  animation: button-content 0.5s ease-out 0.8s forwards;
  opacity: 0;
  transform: translateX(-10px);
}

@keyframes button-content {
  0% {
    opacity: 0;
    transform: translateX(-10px);
  }
  100% {
    opacity: 1;
    transform: translateX(0);
  }
}

.preference-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(99, 102, 241, 0.3) !important;
  background: linear-gradient(to top, #f43b47 0%, #453a94 100%) !important;
}

.preference-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.2) !important;
}

.preference-button i {
  margin-right: 8px;
  font-size: 16px;
  vertical-align: middle;
}

.button-text {
  vertical-align: middle;
  font-size: 14px;
}

/* 添加按钮点击波纹效果 */
.preference-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(255, 255, 255, 0.5);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1, 1) translate(-50%);
  transform-origin: 50% 50%;
}

.preference-button:focus:not(:active)::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0, 0);
    opacity: 0.5;
  }
  20% {
    transform: scale(25, 25);
    opacity: 0.3;
  }
  100% {
    opacity: 0;
    transform: scale(40, 40);
  }
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

/* 响应式调整 */
@media (max-width: 768px) {
  .header-container {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .page-title, .page-subtitle {
    text-align: center;
    width: 100%;
  }
  
  .page-title::after {
    left: 50%;
    transform: translateX(-50%);
  }
  
  .preference-options {
    margin-top: 20px;
    width: 100%;
    justify-content: center;
  }
  
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
  
  .preference-button {
    width: 100%;
    padding: 10px 20px !important;
  }
}

/* 自定义加载动画样式 */
.el-loading-mask {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.el-loading-spinner .el-icon-loading {
  font-size: 100px !important;
  color: #409eff !important;
}

.el-loading-spinner .el-loading-text {
  font-size: 36px !important;
  color: #409eff !important;
  margin-top: 30px !important;
  font-weight: 500 !important;
  letter-spacing: 1px !important;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
  animation: pulse-text 2s infinite !important;
}

@keyframes pulse-text {
  0% {
    opacity: 0.8;
  }
  50% {
    opacity: 1;
  }
  100% {
    opacity: 0.8;
  }
}

/* 刷新按钮样式 */
.refresh-button {
  background: linear-gradient(120deg, #84fab0 0%, #8fd3f4 100%) !important;
  border: none !important;
  padding: 12px !important;
  border-radius: 50% !important;
  margin-right: 15px;
  transition: all 0.3s ease !important;
  box-shadow: 0 4px 15px rgba(132, 250, 176, 0.2) !important;
}

.refresh-button:hover {
  transform: rotate(180deg);
  background: linear-gradient(120deg, #8fd3f4 0%, #84fab0 100%) !important;
  box-shadow: 0 6px 20px rgba(132, 250, 176, 0.3) !important;
}

.refresh-button:active {
  transform: rotate(180deg) scale(0.95);
}

.refresh-button i {
  transition: all 0.3s ease;
}

.refresh-button:hover i {
  transform: scale(1.1);
}
</style>