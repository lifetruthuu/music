<template>
  <el-dialog
    :visible.sync="titleDialog"
    :before-close="onClose"
    custom-class="tag-dialog"
    :width="dialogWidth"
    center>
    <div class="container">
      <h1 class="header">选择您喜欢的音乐标签</h1>
      <p class="selection-hint">请至少选择3个标签，帮助我们为您推荐最佳内容</p>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container">
        <el-loading background="rgba(255, 255, 255, 0.7)" element-loading-text="加载中..."></el-loading>
      </div>

      <!-- 错误提示 -->
      <div v-else-if="loadError" class="error-message">
        <i class="el-icon-warning"></i>
        <p>{{ errorMessage }}</p>
        <el-button type="primary" size="small" @click="retryLoad">重试</el-button>
      </div>

      <!-- 分类区块 -->
      <div v-else class="category-container">
        <div class="category-group" v-for="category in categories" :key="category.type">
          <h2 class="category-title">{{ category.name }}</h2>
          <div class="tags-container">
            <div
              class="tag-item"
              :class="{ 
                selected: selectedTags.includes(tag),
                disabled: selectedTags.length >= 3 && !selectedTags.includes(tag)
              }"
              v-for="tag in category.tags"
              :key="tag.id"
              @click="toggleTag(tag)"
            >
              {{ tag.name }}
            </div>
          </div>
        </div>
      </div>

      <!-- 内部确认按钮 -->
      <div class="dialog-footer">
        <span class="selected-count">已选择 {{ selectedTags.length }} 个标签</span>
        <el-button 
          type="primary" 
          class="confirm-btn" 
          @click="onSave()"
          :loading="saving"
          :disabled="selectedTags.length < 3 || saving">
          {{ saving ? '保存中...' : '确认选择' }}
        </el-button>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import api from "@/api/axios";

export default {
  props:{
    titleDialog: Boolean,
  },
  data() {
    return {
      selectedTags: [],
      titleData: [],
      categories: [],
      dialogWidth: '600px',
      windowWidth: window.innerWidth,
      loading: false,
      loadError: false,
      errorMessage: '',
      saving: false
    }
  },
  created() {
    this.fetchData();
    this.updateDialogWidth();
    window.addEventListener('resize', this.updateDialogWidth);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.updateDialogWidth);
  },
  methods:{
    updateDialogWidth() {
      this.windowWidth = window.innerWidth;
      if (this.windowWidth <= 768) {
        this.dialogWidth = '95%';
      } else if (this.windowWidth <= 992) {
        this.dialogWidth = '80%';
      } else if (this.windowWidth <= 1200) {
        this.dialogWidth = '70%';
      } else {
        this.dialogWidth = '600px';
      }
    },
    toggleTag(tag) {
      const index = this.selectedTags.indexOf(tag)
      if (index > -1) {
        this.selectedTags.splice(index, 1)
      } else {
        this.selectedTags.push(tag)
      }
    },
    // 获取所有数据
    fetchData() {
      this.loading = true;
      this.loadError = false;
      
      // 第一步：获取分类数据
      this.queryCode()
        .then(() => {
          // 第二步：获取标签数据
          return this.queryTitle();
        })
        .then(() => {
          // 第三步：组织数据
          this.processData();
          this.loading = false;
        })
        .catch(err => {
          console.error('数据加载失败:', err);
          this.loading = false;
          this.loadError = true;
        });
    },
    // 处理并组织数据
    processData() {
      // 为每个分类添加标签数组
      this.categories = this.categories.map(category => {
        return {
          ...category,
          tags: this.titleData.filter(item => item.type === category.type)
        };
      });
    },
    // 获取标签数据
    queryTitle() {
      return new Promise((resolve, reject) => {
        api.post('/api/title/list/', {})
          .then(res => {
            if (res && res.list) {
              this.titleData = res.list;
              resolve();
            } else {
              reject(new Error('标签数据格式不正确'));
            }
          })
          .catch(err => {
            console.error('获取标签失败:', err);
            this.errorMessage = '加载标签数据失败，请重试';
            reject(err);
          });
      });
    },
    // 获取分类数据
    queryCode() {
      return new Promise((resolve, reject) => {
        api.get('/api/code/byType')
          .then(res => {
            if (res && res.data) {
              this.categories = res.data;
              resolve();
            } else {
              reject(new Error('分类数据格式不正确'));
            }
          })
          .catch(err => {
            console.error('获取分类失败:', err);
            this.errorMessage = '加载分类数据失败，请重试';
            reject(err);
          });
      });
    },
    retryLoad() {
      this.fetchData();
    },
    onClose(){
      this.$emit("onclose")
    },
    onSave(){
      if (this.selectedTags.length < 3) {
        this.$message.warning('请至少选择3个标签');
        return;
      }
      
      const userString = localStorage.getItem('user');
      if (!userString) {
        this.$message.error('用户信息获取失败，请重新登录');
        return;
      }
      
      this.user = JSON.parse(userString);
      this.saving = true;

      api.post('/api/user/title/', {
        userId: this.user.id,
        titleIds: this.selectedTags.map(tag=>tag.id),
      }).then(res => {
        this.saving = false;
        this.$message.success('标签选择成功');
        this.$emit("onclose")
      }).catch(err => {
        console.error('请求失败:', err);
        this.saving = false;
        this.$message.error('保存标签失败，请重试');
      });
    }
  }
}
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

/* 对话框自定义样式 */
:deep(.tag-dialog) {
  border-radius: 12px;
  overflow: hidden;
  max-width: 96%;
  margin: 0 auto;
}

.container {
  width: 100%;
  margin: 0 auto;
  padding: 2% 3%;
  position: relative;
  min-height: 300px;
}

.header {
  font-size: clamp(1.2rem, 4vw, 1.8rem);
  color: #333;
  margin-bottom: 0.8em;
  text-align: center;
}

.selection-hint {
  color: #909399;
  font-size: clamp(0.8rem, 3vw, 1rem);
  text-align: center;
  margin-bottom: 1.5em;
}

/* 加载状态和错误提示 */
.loading-container {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 200px;
  z-index: 10;
}

.error-message {
  text-align: center;
  padding: 30px;
  color: #f56c6c;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 15px;
}

.error-message i {
  font-size: 48px;
}

.error-message p {
  font-size: 16px;
  margin: 10px 0;
}

.category-container {
  animation: fadeIn 0.5s ease-out;
}

.category-group {
  margin-bottom: 1.5em;
  background: white;
  border-radius: 12px;
  padding: 1em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.category-group:hover {
  transform: translateY(-3px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.08);
}

.category-title {
  font-size: clamp(1rem, 3.5vw, 1.2rem);
  color: #333;
  margin-bottom: 0.8em;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 0.6em;
}

.tag-item {
  padding: 0.5em 1em;
  border-radius: 20px;
  border: 1px solid #eee;
  font-size: clamp(0.75rem, 2.5vw, 0.9rem);
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
  margin-bottom: 0.4em;
}

.tag-item:hover {
  border-color: #0084ff;
  color: #0084ff;
  transform: translateY(-2px);
}

.tag-item.selected {
  background: #0084ff;
  color: white;
  border-color: #0084ff;
  transform: scale(1.05);
}

.tag-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-item.disabled:hover {
  border-color: #eee;
  color: #666;
  transform: none;
}

/* 对话框底部 */
.dialog-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 1.2em;
  padding-top: 1em;
  border-top: 1px solid #ebeef5;
}

.selected-count {
  color: #666;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
}

.confirm-btn {
  background: #0084ff;
  color: white;
  border: none;
  padding: 0.6em 1.5em;
  border-radius: 25px;
  font-size: clamp(0.85rem, 2.5vw, 0.95rem);
  cursor: pointer;
  transition: all 0.3s ease;
}

.confirm-btn:hover:not(:disabled) {
  background: #0077e6;
  transform: translateY(-2px);
  box-shadow: 0 4px 10px rgba(0, 132, 255, 0.2);
}

.confirm-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 动画 */
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 响应式调整 */
@media (max-width: 1200px) {
  .tags-container {
    gap: 0.5em;
  }
}

@media (max-width: 992px) {
  .container {
    padding: 1.5% 2.5%;
  }
  
  .category-group {
    padding: 0.8em;
  }
}

@media (max-width: 768px) {
  .container {
    padding: 1.2% 2%;
  }
  
  .dialog-footer {
    flex-direction: column;
    gap: 0.8em;
  }
  
  .selected-count {
    margin-bottom: 0.5em;
  }
}

@media (max-width: 576px) {
  .container {
    padding: 0.8em;
  }
  
  .header {
    margin-bottom: 0.5em;
  }
  
  .category-group {
    padding: 0.7em;
    margin-bottom: 1em;
  }
  
  .tag-item {
    padding: 0.4em 0.8em;
  }
}

@media (max-width: 320px) {
  .tag-item {
    font-size: 0.7rem;
    padding: 0.3em 0.6em;
  }
  
  .category-title {
    font-size: 0.95rem;
  }
}
</style>
