<template>
  <div>
    <!-- 评论按钮 - 仅在非内嵌模式下显示 -->
    <el-button 
      v-if="!embedMode"
      type="primary" 
      size="medium" 
      plain 
      round 
      @click="init"
      icon="el-icon-chat-dot-square"
      class="comment-button"
    >
      查看评论
    </el-button>

    <!-- 评论弹窗 - 仅在非内嵌模式下使用 -->
    <el-dialog
      v-if="!embedMode"
      title="评论"
      :visible.sync="showCommentSection"
      width="40%"
      :close-on-click-modal="false"
      custom-class="comment-dialog"
      top="5vh"
      :show-close="true"
      class="rounded-dialog"
    >
      <div class="comment-section">
        <!-- 标题与总数 -->
        <div class="section-header">
          <h3 class="title">评论 <span class="count">({{ total }})</span></h3>
          <el-button 
            type="primary" 
            size="small" 
            plain 
            round 
            @click="showCommentDialog = true"
            icon="el-icon-edit"
            class="write-comment-btn"
          >
            写评论
          </el-button>
        </div>

        <!-- 评论列表 -->
        <div class="comments-container" v-loading="loading">
          <!-- 无评论状态 -->
          <div class="no-comments" v-if="comments.length === 0 && !loading">
            <i class="el-icon-chat-dot-square empty-icon"></i>
            <p>暂无评论，发表第一条评论吧！</p>
          </div>

          <!-- 评论列表 -->
          <div class="comments-wrapper">
            <transition-group name="comment-fade" tag="div">
              <div 
                v-for="comment in comments" 
                :key="comment.id"
                class="comment-item"
                :class="{'top-liked': comment.isTopLiked}"
              >
                <!-- 顶部高赞标记 -->
                <div class="top-like-badge" v-if="comment.isTopLiked && comment.likesCount > 0">
                  <i class="el-icon-medal"></i> 热门
                </div>
                
                <!-- 用户头像 -->
                <div class="avatar-container">
                  <img
                    :src="comment.avatarUrl ? getFullImagePath(comment.avatarUrl) : require('@/assets/default-avatar.png')"
                    alt="用户头像"
                    class="avatar"
                  />
                </div>
                
                <!-- 评论内容 -->
                <div class="comment-content">
                  <div class="user-info">
                    <span class="username">{{ comment.nickname }}</span>
                    <span class="time">{{ formatDate(comment.createdAt) }}</span>
                  </div>
                  
                  <!-- 评分展示 -->
                  <div class="rating-display" v-if="comment.rating">
                    <el-rate
                      v-model="comment.rating"
                      disabled
                      :colors="['#409EFF', '#409EFF', '#409EFF']"
                      text-color="#909399"
                      show-score
                      score-template="{value}分"
                    >
                    </el-rate>
                  </div>
                  
                  <p class="text">{{ comment.commentText }}</p>
                  
                  <!-- 操作按钮 -->
                  <div class="actions">
                    <div class="like-action" @click="likeComment(comment)" :class="{ 'active': comment.userLiked }">
                      <i class="el-icon-thumb"></i>
                      <span>{{ comment.likesCount || 0 }}</span>
                    </div>
                    <div class="dislike-action" @click="dislikeComment(comment)" :class="{ 'active': comment.userDisliked }">
                      <i class="el-icon-thumb reverse"></i>
                      <span>{{ comment.dislikesCount || 0 }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </transition-group>
          </div>

          <!-- 分页 -->
          <Pagination
            v-if="total > pageSize"
            :total="total"
            :pageSize="pageSize"
            :currentPage.sync="currentPage"
            @change="handlePageChange"
          />
        </div>
      </div>
    </el-dialog>

    <!-- 内嵌模式直接显示评论内容 -->
    <div v-if="embedMode" class="embedded-comment-section">
      <!-- 写评论按钮 -->
      <div class="embedded-header">
        <el-button 
          type="primary" 
          size="small" 
          plain 
          round 
          @click="showCommentDialog = true"
          icon="el-icon-edit"
          class="write-comment-btn"
        >
          写评论
        </el-button>
      </div>

      <!-- 评论列表 -->
      <div class="comments-container embedded" v-loading="loading">
        <!-- 无评论状态 -->
        <div class="no-comments" v-if="comments.length === 0 && !loading">
          <i class="el-icon-chat-dot-square empty-icon"></i>
          <p>暂无评论，发表第一条评论吧！</p>
        </div>

        <!-- 评论列表 -->
        <div class="comments-wrapper">
          <transition-group name="comment-fade" tag="div">
            <div 
              v-for="comment in comments" 
              :key="comment.id"
              class="comment-item"
              :class="{'top-liked': comment.isTopLiked}"
            >
              <!-- 顶部高赞标记 -->
              <div class="top-like-badge" v-if="comment.isTopLiked && comment.likesCount > 0">
                <i class="el-icon-medal"></i> 热门
              </div>
              
              <!-- 用户头像 -->
              <div class="avatar-container">
                <img
                  :src="comment.avatarUrl ? getFullImagePath(comment.avatarUrl) : require('@/assets/default-avatar.png')"
                  alt="用户头像"
                  class="avatar"
                />
              </div>
              
              <!-- 评论内容 -->
              <div class="comment-content">
                <div class="user-info">
                  <span class="username">{{ comment.nickname }}</span>
                  <span class="time">{{ formatDate(comment.createdAt) }}</span>
                </div>
                
                <!-- 评分展示 -->
                <div class="rating-display" v-if="comment.rating">
                  <el-rate
                    v-model="comment.rating"
                    disabled
                    :colors="['#409EFF', '#409EFF', '#409EFF']"
                    text-color="#909399"
                    show-score
                    score-template="{value}分"
                  >
                  </el-rate>
                </div>
                
                <p class="text">{{ comment.commentText }}</p>
                
                <!-- 操作按钮 -->
                <div class="actions">
                  <div class="like-action" @click="likeComment(comment)" :class="{ 'active': comment.userLiked }">
                    <i class="el-icon-thumb"></i>
                    <span>{{ comment.likesCount || 0 }}</span>
                  </div>
                  <div class="dislike-action" @click="dislikeComment(comment)" :class="{ 'active': comment.userDisliked }">
                    <i class="el-icon-thumb reverse"></i>
                    <span>{{ comment.dislikesCount || 0 }}</span>
                  </div>
                </div>
              </div>
            </div>
          </transition-group>
        </div>

        <!-- 分页 -->
        <Pagination
          v-if="total > pageSize"
          :total="total"
          :pageSize="pageSize"
          :currentPage.sync="currentPage"
          @change="handlePageChange"
        />
      </div>
    </div>

    <!-- 评论输入对话框 - 两种模式共用 -->
    <el-dialog
      title="发表评论"
      :visible.sync="showCommentDialog"
      width="450px"
      :close-on-click-modal="false"
      center
      append-to-body
      custom-class="comment-input-dialog"
      :show-close="true"
      class="rounded-dialog"
    >
      <div class="comment-input-container">
        <el-input
          type="textarea"
          :rows="4"
          placeholder="分享你的想法..."
          v-model="newComment"
          maxlength="500"
          show-word-limit
          class="comment-textarea"
        ></el-input>
        
        <div class="rating-container" v-if="showRating">
          <span class="rating-label">评分:</span>
          <el-rate
            v-model="rating"
            :colors="['#409EFF', '#409EFF', '#409EFF']"
            show-text
            :texts="['1分','2分','3分','4分','5分']"
            text-color="#606266"
          ></el-rate>
        </div>
      </div>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="showCommentDialog = false" class="cancel-btn">取消</el-button>
        <el-button type="primary" @click="submitComment" :loading="submitting" class="submit-btn">发表评论</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
import api from "@/api/axios";
import Pagination from "@/components/com/Pagination.vue";

export default {
  name: 'CommentSection',
  components: {
    Pagination
  },
  props: {
    targetId: {
      type: String,
      required: true
    },
    targetType: {
      type: String,
      required: true,
      validator: value => ['music', 'gedan'].includes(value)
    },
    showRating: {
      type: Boolean,
      default: true
    },
    embedMode: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showCommentSection: false,
      showCommentDialog: false,
      comments: [],
      loading: false,
      submitting: false,
      newComment: '',
      rating: 0,
      total: 0,
      currentPage: 1,
      pageSize: 5,
      user: null
    }
  },
  created() {
    this.loadUser();
    // 如果是内嵌模式，初始化时自动加载评论 - 由 watcher 处理
    if (this.embedMode) {
      console.log("targetId为", this.targetId);
      this.fetchComments();
    }
  },
  watch: {
    // 监听当前页面变化，自动重新获取数据
    currentPage(newVal, oldVal) {
      if (newVal !== oldVal) {
        this.fetchComments();
      }
    },
    // 监听 targetId 的变化，确保在 ID 有效时加载评论
    targetId(newId, oldId) {
      // 仅当 targetId 有效且发生变化时（或首次获得有效值时）才加载
      if (newId && newId !== oldId) {
        // 当评论目标变化时，重置页码到第一页
        this.currentPage = 1;
        this.fetchComments();
      }
    }
  },
  methods: {
    init() {
      this.fetchComments();
      this.showCommentSection = true;
    },
    loadUser() {
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          this.user = JSON.parse(userString);
        } catch (e) {
          console.error("解析用户数据失败", e);
          this.$message.error('获取用户信息失败，请重新登录');
        }
      } else {
        console.warn("未找到用户数据");
        this.$message.warning('请先登录后再操作');
      }
    },
    
    // 获取评论列表
    async fetchComments() {
      if (!this.targetId) {
        console.error('缺少目标ID');
        return;
      }
      
      this.loading = true;
      
      try {
        const response = await api.get('/api/comment/list/', {
          params: {
            targetId: this.targetId,
            targetType: this.targetType,
            page: this.currentPage,
            pageSize: this.pageSize,
            userId: this.user?.id
          }
        });
        
        if (response.status === 'success') {
          this.comments = response.comments.map(comment => {
            // 为每个评论添加当前用户是否已点赞或点踩的标记
            return {
              ...comment,
              isTopLiked: comment.likesCount > 0 && comment.isTopLiked,
              userLiked: comment.userLikeStatus === 'liked',
              userDisliked: comment.userLikeStatus === 'disliked'
            };
          });
          this.total = response.totalCount;
        } else {
          console.error('获取评论失败', response.message);
          this.$message.error('获取评论失败: ' + response.message);
        }
      } catch (error) {
        console.error('获取评论请求失败', error);
        this.$message.error('获取评论请求失败，请检查网络连接');
      } finally {
        this.loading = false;
      }
    },
    
    // 提交评论
    async submitComment() {
      if (!this.user) {
        this.$message.warning('请先登录后再发表评论');
        this.showCommentDialog = false;
        return;
      }
      
      if (!this.newComment.trim()) {
        this.$message.warning('评论内容不能为空');
        return;
      }
      
      this.submitting = true;
      
      try {
        const commentData = {
          userId: this.user.id,
          targetId: this.targetId,
          targetType: this.targetType,
          commentText: this.newComment,
          rating: this.showRating ? this.rating : null
        };
        
        const response = await api.post('/api/comment/add/', commentData);
        
        if (response.status === 'success') {
          this.$message.success('评论发表成功');
          // 重置评论表单
          this.newComment = '';
          this.rating = 0;
          this.showCommentDialog = false;
          
          // 重新加载评论列表
          this.fetchComments();
        } else {
          this.$message.error('评论发表失败: ' + response.message);
        }
      } catch (error) {
        console.error('评论发表请求失败', error);
        this.$message.error('评论发表失败，请检查网络连接');
      } finally {
        this.submitting = false;
      }
    },
    
    // 点赞评论
    async likeComment(comment) {
      if (!this.user) {
        this.$message.warning('请先登录后再操作');
        return;
      }
      
      try {
        // 根据当前点赞状态确定操作类型
        const action = comment.userLiked ? 'unlike' : 'like';
        
        const response = await api.post('/api/comment/like/', {
          userId: this.user.id,
          commentId: comment.id,
          action: action  // 添加action参数
        });
        
        if (response.status === 'success') {
          // 更新评论点赞状态和计数
          comment.userLiked = action === 'like';  // 根据action更新状态
          comment.userDisliked = false;
          comment.likesCount = response.likesCount;
          comment.dislikesCount = response.dislikesCount;
          
          const message = action === 'like' ? '点赞成功' : '已取消点赞';
          this.$message.success(message);
        } else {
          this.$message.error('操作失败: ' + response.message);
        }
      } catch (error) {
        console.error('点赞操作失败', error);
        this.$message.error('操作失败，请检查网络连接');
      }
    },
    
    // 点踩评论
    async dislikeComment(comment) {
      if (!this.user) {
        this.$message.warning('请先登录后再操作');
        return;
      }
      
      try {
        // 根据当前点踩状态确定操作类型
        const action = comment.userDisliked ? 'undislike' : 'dislike';
        
        const response = await api.post('/api/comment/dislike/', {
          userId: this.user.id,
          commentId: comment.id,
          action: action  // 添加action参数
        });
        
        if (response.status === 'success') {
          // 更新评论点踩状态和计数
          comment.userDisliked = action === 'dislike';  // 根据action更新状态
          comment.userLiked = false;
          comment.likesCount = response.likesCount;
          comment.dislikesCount = response.dislikesCount;
          
          const message = action === 'dislike' ? '点踩成功' : '已取消点踩';
          this.$message.success(message);
        } else {
          this.$message.error('操作失败: ' + response.message);
        }
      } catch (error) {
        console.error('点踩操作失败', error);
        this.$message.error('操作失败，请检查网络连接');
      }
    },
    
    // 处理分页变化
    handlePageChange(page) {
      this.currentPage = page;
      // 不需要重复调用fetchComments，由watch监听处理
    },
    
    // 格式化日期
    formatDate(dateString) {
      const date = new Date(dateString);
      const now = new Date();
      const diffMs = now - date;
      const diffSec = Math.floor(diffMs / 1000);
      const diffMin = Math.floor(diffSec / 60);
      const diffHour = Math.floor(diffMin / 60);
      const diffDay = Math.floor(diffHour / 24);
      
      if (diffDay > 30) {
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
      } else if (diffDay > 0) {
        return `${diffDay}天前`;
      } else if (diffHour > 0) {
        return `${diffHour}小时前`;
      } else if (diffMin > 0) {
        return `${diffMin}分钟前`;
      } else {
        return '刚刚';
      }
    },
    
    // 获取完整图片路径
    getFullImagePath(path) {
      // 如果路径已经是完整的URL，则直接返回
      if (path && (path.startsWith('http://') || path.startsWith('https://'))) {
        return path;
      }
      // 否则拼接服务器路径
      return path ? `http://localhost:8000${path}` : require('@/assets/default-avatar.png');
    }
  }
}
</script>

<style>
/* 全局圆角对话框样式 - 直接作用于el-dialog */
.rounded-dialog .el-dialog {
  border-radius: 16px !important;
  overflow: hidden;
}
</style>

<style scoped>
/* 评论按钮样式 */
.comment-button {
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  background: #f5f7fa !important;
  color: #606266 !important;
  border-color: #dcdfe6 !important;
  margin-top: 5px;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  overflow: hidden;
  font-family: 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.5px;
  font-size: 14px;
  border-radius: 20px !important; /* 更大的圆角 */
  height: 40px; /* 固定高度 */
  backdrop-filter: blur(5px); /* 毛玻璃效果 */
}

.comment-button:hover,
.comment-button:focus {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  background: #ecf5ff !important; /* Light blue hover */
  border-color: #409EFF !important;
  color: #606266 !important; /* 保持字体颜色不变 */
}

.comment-button:active {
  transform: translateY(1px);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
  color: #606266 !important; /* 确保点击时颜色也不变 */
  background: #e0efff !important; /* 稍深一点的蓝色 */
}

/* 重写el-button的默认聚焦样式 */
.comment-button.is-plain:focus, 
.comment-button.is-plain:hover {
  background: #ecf5ff !important;
  border-color: #409EFF !important;
  color: #606266 !important;
}

.comment-button::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 5px;
  height: 5px;
  background: rgba(144, 147, 153, 0.3);
  opacity: 0;
  border-radius: 100%;
  transform: scale(1) translate(-50%, -50%);
  transform-origin: 50% 50%;
}

.comment-button:hover::after {
  animation: ripple 1s ease-out;
}

@keyframes ripple {
  0% {
    transform: scale(0) translate(-50%, -50%);
    opacity: 0.5;
  }
  100% {
    transform: scale(40) translate(-50%, -50%);
    opacity: 0;
  }
}

/* 对话框样式 */
.comment-dialog {
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  border-radius: 16px !important; /* 增加圆角 */
  overflow: hidden;
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.15) !important;
}

.comment-dialog >>> .el-dialog__header {
  background: #f5f7fa;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
}

.comment-dialog >>> .el-dialog__body {
  padding: 25px;
  background: #fff;
  height: 75vh;
  overflow-y: hidden;
}

/* 添加对话框动画 */
.comment-dialog >>> .el-dialog {
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 16px !important;
  overflow: hidden;
}

.comment-dialog >>> .el-dialog.dialog-fade-enter-active,
.comment-dialog >>> .el-dialog.dialog-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.comment-dialog >>> .el-dialog.dialog-fade-enter-to {
  transform: scale(1);
  opacity: 1;
}

.comment-dialog >>> .el-dialog.dialog-fade-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

/* 修改标题样式 */
.comment-dialog >>> .el-dialog__title {
  color: #303133;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Microsoft YaHei', sans-serif;
}

/* 修改关闭按钮 */
.comment-dialog >>> .el-dialog__headerbtn {
  top: 12px;
  right: 15px;
}

.comment-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: #909399;
  transition: all 0.3s;
}

.comment-dialog >>> .el-dialog__headerbtn:hover .el-dialog__close {
  color: #409EFF;
  transform: rotate(90deg);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 25px;
  padding-bottom: 18px;
  border-bottom: 1px solid #ebeef5;
}

.title {
  font-size: 24px;
  color: #303133;
  margin: 0;
  font-weight: 600;
  font-family: 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.5px;
  position: relative;
  padding-left: 15px;
}

.title:before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 5px;
  background: linear-gradient(to bottom, #409EFF, #337ecc); /* Blue gradient */
  border-radius: 3px;
}

.count {
  font-size: 16px;
  color: #909399;
  font-weight: normal;
  font-family: 'Microsoft YaHei', sans-serif;
  margin-left: 8px;
}

.write-comment-btn {
  transition: all 0.3s;
  background: #f5f7fa;
  color: #606266;
  border-color: #dcdfe6;
  border-radius: 20px; /* 增加圆角 */
  padding: 9px 18px;
  display: flex;
  align-items: center;
  gap: 5px;
}

.write-comment-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  background: #ecf5ff; /* Light blue hover */
  border-color: #a0cfff;
  color: #409EFF;
}

.write-comment-btn:active {
  transform: translateY(1px);
}

/* 评论输入对话框 */
.comment-input-dialog {
  border-radius: 16px !important; /* 增加圆角 */
  overflow: hidden;
}

.comment-input-dialog >>> .el-dialog {
  transform: scale(0.9);
  opacity: 0;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  border-radius: 16px !important;
  overflow: hidden;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
}

.comment-input-dialog >>> .el-dialog.dialog-fade-enter-active,
.comment-input-dialog >>> .el-dialog.dialog-fade-leave-active {
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.comment-input-dialog >>> .el-dialog.dialog-fade-enter-to {
  transform: scale(1);
  opacity: 1;
}

.comment-input-dialog >>> .el-dialog.dialog-fade-leave-to {
  transform: scale(0.9);
  opacity: 0;
}

.comment-input-dialog >>> .el-dialog__header {
  background: #f5f7fa;
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  border-radius: 16px 16px 0 0;
}

.comment-input-dialog >>> .el-dialog__title {
  color: #303133;
  font-weight: 600;
  font-size: 18px;
  font-family: 'Microsoft YaHei', sans-serif;
}

.comment-input-dialog >>> .el-dialog__headerbtn {
  top: 12px;
  right: 15px;
}

.comment-input-dialog >>> .el-dialog__headerbtn .el-dialog__close {
  color: #909399;
  transition: all 0.3s;
}

.comment-input-dialog >>> .el-dialog__headerbtn:hover .el-dialog__close {
  color: #409EFF;
  transform: rotate(90deg);
}

.comment-input-dialog >>> .el-dialog__body {
  padding: 25px;
}

.comment-input-dialog >>> .el-dialog__footer {
  padding: 10px 25px 20px;
  background: #fff;
  border-top: 1px solid rgba(235, 238, 245, 0.5);
  border-radius: 0 0 16px 16px;
}

.comment-input-container {
  margin-bottom: 20px;
}

.comment-textarea >>> .el-textarea__inner {
  background-color: #f9f9fa;
  border: 1px solid #ebeef5;
  border-radius: 12px; /* 增加圆角 */
  transition: all 0.3s;
  padding: 15px;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #303133;
  resize: none; /* 禁止调整大小 */
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.comment-textarea >>> .el-textarea__inner:focus {
  border-color: #409EFF; /* Blue border on focus */
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.2); /* Blue shadow on focus */
  background-color: #fff;
}

.rating-container {
  display: flex;
  align-items: center;
  margin-top: 15px;
  padding: 15px;
  background-color: #f9f9fa;
  border-radius: 12px; /* 增加圆角 */
  border: 1px solid #ebeef5;
  transition: all 0.3s;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
}

.rating-container:hover {
  background-color: #f5f7fa;
  box-shadow: 0 3px 8px rgba(0, 0, 0, 0.06);
  border-color: #a0cfff;
}

.rating-label {
  margin-right: 10px;
  color: #606266;
  font-family: 'Microsoft YaHei', sans-serif;
  font-weight: 500;
}

.rating-container >>> .el-rate__icon {
  font-size: 20px;
  margin-right: 5px;
}

.rating-container >>> .el-rate__text {
  font-size: 14px;
  margin-left: 10px;
}

.rating-display {
  margin-top: 8px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
}

.rating-display >>> .el-rate__icon {
  font-size: 16px;
  margin-right: 2px;
}

.rating-display >>> .el-rate__text {
  font-size: 12px;
  color: #909399;
  margin-left: 6px;
}

.cancel-btn, .submit-btn {
  transition: all 0.3s;
  padding: 9px 20px;
  font-family: 'Microsoft YaHei', sans-serif;
  border-radius: 20px; /* 增加圆角 */
}

.submit-btn {
  background-color: #409EFF; /* Primary blue */
  border-color: #409EFF;
  padding: 9px 24px;
}

.submit-btn:hover {
  background-color: #66b1ff; /* Lighter blue on hover */
  border-color: #66b1ff;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.2);
}

.cancel-btn:hover {
  transform: translateY(-2px);
  background-color: #f5f7fa;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  border-color: rgba(220, 223, 230, 0.9);
}

.submit-btn:active, .cancel-btn:active {
  transform: translateY(1px);
}

/* 评论容器 */
.comments-container {
  height: 65vh;
  overflow-y: auto;
  padding-right: 15px;
  padding-left: 5px; /* 添加左侧内边距 */
  position: relative;
  -webkit-overflow-scrolling: touch; /* 提高在iOS上的滚动体验 */
  scroll-behavior: smooth; /* 平滑滚动 */
  padding-top: 15px; /* 添加顶部内边距，防止第一个评论被遮挡 */
}

.comments-wrapper {
  position: relative;
  min-height: 100px;
  padding-bottom: 20px; /* 确保底部有足够空间 */
  overflow: visible;
}

/* 无评论状态 */
.no-comments {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 0;
  color: #909399;
  animation: fadeIn 0.6s ease-out;
  font-family: 'Microsoft YaHei', sans-serif;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.empty-icon {
  font-size: 60px;
  color: #dcdfe6;
  margin-bottom: 20px;
  animation: pulse 2.5s infinite ease-in-out;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 0.8; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.8; }
}

/* 评论项样式 - 增强卡片效果 */
.comment-item {
  display: flex;
  margin-bottom: 35px;
  padding: 20px;
  transition: all 0.4s cubic-bezier(0.165, 0.84, 0.44, 1);
  border-radius: 16px; /* 增加圆角 */
  position: relative;
  background: #ffffff; /* 修改为白色背景 */
  box-shadow: 0 3px 12px rgba(0, 0, 0, 0.06);
  transform-origin: center center;
  z-index: 1;
  overflow: visible;
  will-change: transform, opacity, box-shadow;
  border: 1px solid rgba(235, 238, 245, 0.8);
}

.comment-item:hover {
  background: #f9f9fa; /* 修改hover背景色为淡灰色 */
  transform: translateY(-5px) scale(1.01);
  box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  border-color: rgba(220, 223, 230, 0.9);
  z-index: 2; /* 确保hover时在最上层 */
}

.top-liked {
  background: linear-gradient(to right, #ecf5ff, #f0f8ff) !important; /* 只有热门评论保留浅蓝色渐变背景 */
  border: 1px solid #e4e7ed;
  box-shadow: 0 5px 15px rgba(64, 158, 255, 0.15);
}

.top-liked:hover {
  background: linear-gradient(to right, #e6f2ff, #eaf6ff) !important;
  box-shadow: 0 10px 25px rgba(64, 158, 255, 0.2);
}

.top-like-badge {
  position: absolute;
  top: -10px;
  right: 20px;
  background: linear-gradient(135deg, #eb1f1f, #ff5101); /* Blue gradient */
  color: white;
  font-size: 12px;
  padding: 4px 12px;
  border-radius: 15px;
  box-shadow: 0 3px 8px rgba(64, 158, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 4px;
  animation: badgePulse 2.5s infinite;
  z-index: 5;
}

@keyframes badgePulse {
  0% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0.4);
  }
  70% {
    box-shadow: 0 0 0 8px rgba(64, 158, 255, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(64, 158, 255, 0);
  }
}

.avatar-container {
  margin-right: 15px;
}

.avatar {
  width: 45px;
  height: 45px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.12);
  border: 3px solid white;
  transition: all 0.3s ease;
}

.comment-item:hover .avatar {
  transform: scale(1.08);
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.18);
}

.comment-content {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.user-info {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.username {
  font-weight: 600;
  color: #606266;
  margin-right: 10px;
  transition: color 0.3s;
  font-family: 'Microsoft YaHei', sans-serif;
  letter-spacing: 0.3px;
}

.comment-item:hover .username {
  color: #303133;
}

.time {
  font-size: 12px;
  color: #909399;
  background: rgba(144, 147, 153, 0.1);
  padding: 2px 8px;
  border-radius: 10px;
  transition: all 0.3s;
}

.comment-item:hover .time {
  background: rgba(144, 147, 153, 0.15);
}

.text {
  line-height: 1.7;
  color: #606266;
  margin: 12px 0;
  white-space: pre-wrap;
  transition: color 0.3s;
  font-family: 'Microsoft YaHei', sans-serif;
  font-size: 14.5px;
  letter-spacing: 0.3px;
  position: relative;
  padding-left: 10px;
}

.text::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 3px;
  background: rgba(64, 158, 255, 0.2); /* Light blue accent */
  border-radius: 3px;
  transition: all 0.3s;
}

.comment-item:hover .text::before {
  background: rgba(64, 158, 255, 0.4); /* Darker blue accent on hover */
}

.comment-item:hover .text {
  color: #303133;
}

.actions {
  display: flex;
  gap: 15px;
  margin-top: 12px;
}

.like-action, .dislike-action {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 5px 10px;
  border-radius: 12px;
  transition: all 0.25s;
  color: #909399;
  font-size: 14px;
  background: rgba(144, 147, 153, 0.08);
}

.like-action:hover, .dislike-action:hover {
  background: rgba(64, 158, 255, 0.1); /* Light blue hover */
  color: #606266;
  transform: translateY(-2px);
}

.like-action.active {
  color: #409EFF; /* Blue for active like */
  font-weight: 500;
  background: rgba(64, 158, 255, 0.15);
}

.dislike-action.active {
  color: #909399;
  font-weight: 500;
  background: rgba(144, 147, 153, 0.15);
}

.like-action:active, .dislike-action:active {
  transform: translateY(1px);
}

.reverse {
  transform: rotate(180deg);
}

/* 评论动画 - 增强动画效果 */
.comment-fade-enter-active {
  animation: comment-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
  z-index: 10;
  position: relative;
}

.comment-fade-leave-active {
  animation: comment-out 0.4s cubic-bezier(0.6, -0.28, 0.735, 0.045);
  position: absolute;
  width: 100%;
  z-index: 5;
}

/* 自定义滚动条样式 */
.comments-container::-webkit-scrollbar {
  width: 8px;
}

.comments-container::-webkit-scrollbar-track {
  background: #f5f7fa;
  border-radius: 4px;
}

.comments-container::-webkit-scrollbar-thumb {
  background: #a0cfff; /* Lighter blue scrollbar */
  border-radius: 4px;
  transition: all 0.3s;
}

.comments-container::-webkit-scrollbar-thumb:hover {
  background: #66b1ff; /* Darker blue scrollbar on hover */
}

/* 响应式样式 */
@media (max-width: 768px) {
  .comment-dialog {
    width: 95% !important;
  }
  
  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .comment-item {
    flex-direction: column;
    margin-bottom: 30px;
  }
  
  .avatar-container {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .top-like-badge {
    top: 10px;
    right: 10px;
  }
}

@keyframes comment-in {
  0% {
    opacity: 0;
    transform: translateY(40px) scale(0.95);
  }
  100% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

@keyframes comment-out {
  0% {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
  100% {
    opacity: 0;
    transform: translateY(-40px) scale(0.95);
  }
}

/* 添加反馈浮动效果 */
@keyframes float {
  0% { transform: translateY(0px); }
  50% { transform: translateY(-5px); }
  100% { transform: translateY(0px); }
}

.no-comments p {
  animation: float 3s ease-in-out infinite;
}

/* 内嵌模式样式 */
.embedded-comment-section {
  width: 100%;
}

.embedded-header {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20px;
}

.comments-container.embedded {
  height: auto;
  max-height: 600px;
}
</style> 