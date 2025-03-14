<template>
  <el-dialog
    :visible.sync="titleDialog"
    :before-close="onClose"
    custom-class="tag-dialog"
    :width="dialogWidth"
    center>
    <div class="container">
      <h1 class="header">选择您喜欢的音乐标签</h1>
      <p class="selection-hint">请选择3-8个标签，帮助我们为您推荐最佳内容</p>

      <!-- 加载状态 -->
      <div v-if="loading" class="loading-container" v-loading="loading" element-loading-text="加载中..." element-loading-background="rgba(255, 255, 255, 0.7)">
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
                selected: isTagSelected(tag),
                disabled: selectedTags.length >= 8 && !isTagSelected(tag)
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

      <!-- 已选择标签及权重设置 -->
      <div v-if="selectedTags.length > 0" class="selected-tags-container">
        <h3 class="selected-section-title">已选择的标签 ({{ selectedTags.length }}/8)</h3>
        <div class="selected-tags-list">
          <div class="selected-tag-item" v-for="(tag, index) in selectedTags" :key="tag.id">
            <div class="tag-name">{{ tag.name }}</div>
            <div class="weight-control">
              <span class="weight-label">权重:</span>
              <el-rate
                v-model="tag.weight"
                :max="5"
                :texts="['1', '2', '3', '4', '5']"
                show-text
                @change="updateTagWeight(index, $event)"
              ></el-rate>
            </div>
            <el-button 
              type="danger" 
              icon="el-icon-close" 
              size="mini" 
              circle 
              class="remove-tag-btn"
              @click="removeTag(index)"
            ></el-button>
          </div>
        </div>
      </div>

      <!-- 内部确认按钮 -->
      <div class="dialog-footer">
        <span class="selected-count">已选择 {{ selectedTags.length }} 个标签</span>
        <div class="action-buttons">
          <el-button 
            class="skip-btn" 
            @click="skipSelection"
            :disabled="saving">
            跳过选择
          </el-button>
          <el-button 
            type="primary" 
            class="confirm-btn" 
            @click="onSave()"
            :loading="saving"
            :disabled="selectedTags.length < 3 || selectedTags.length > 8 || saving">
            {{ saving ? '保存中...' : '确认选择' }}
          </el-button>
        </div>
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
      saving: false,
      userTagsLoaded: false, // 标记是否已加载用户标签
      user: null
    }
  },
  watch: {
    titleDialog(val) {
      if (val && !this.userTagsLoaded) {
        this.fetchData();
      }
    }
  },
  created() {
    this.user = JSON.parse(localStorage.getItem('user') || '{}');
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
    isTagSelected(tag) {
      return this.selectedTags.some(item => item.id === tag.id);
    },
    toggleTag(tag) {
      // 如果已经选择了8个标签并且当前标签不在选中列表中，则不允许添加
      if (this.selectedTags.length >= 8 && !this.isTagSelected(tag)) {
        this.$message.warning('最多只能选择8个标签');
        return;
      }
      
      const index = this.selectedTags.findIndex(item => item.id === tag.id);
      if (index > -1) {
        // 移除标签
        this.selectedTags.splice(index, 1);
      } else {
        // 添加标签，默认权重为3
        this.selectedTags.push({
          ...tag,
          weight: 3
        });
      }
    },
    removeTag(index) {
      this.selectedTags.splice(index, 1);
    },
    updateTagWeight(index, value) {
      // 确保权重在1-5之间
      if (value < 1) value = 1;
      if (value > 5) value = 5;
      this.selectedTags[index].weight = value;
    },
    // 获取所有数据
    fetchData() {
      this.loading = true;
      this.loadError = false;
      this.userTagsLoaded = false;
      
      // 第一步：获取分类数据
      this.queryCode()
        .then(() => {
          // 第二步：获取标签数据
          return this.queryTitle();
        })
        .then(() => {
          // 第三步：组织数据
          this.processData();
          
          // 第四步：获取用户已选择的标签
          if (this.user && this.user.id) {
            return this.loadUserTags();
          }
        })
        .then(() => {
          this.loading = false;
          this.userTagsLoaded = true;
        })
        .catch(err => {
          console.error('数据加载失败:', err);
          this.loading = false;
          this.loadError = true;
        });
    },
    // 加载用户已选择的标签
    loadUserTags() {
      if (!this.user || !this.user.id) {
        return Promise.resolve();
      }
      
      return api.get(`/api/user/getTitle/?userId=${this.user.id}`)
      .then(res => {
        if (res && res.status === 'success' && res.list && res.list.length > 0) {
          // 清空当前选择的标签
          this.selectedTags = [];
          
          // 将用户已选择的标签添加到选择列表中
          res.list.forEach(tag => {
            // 在所有标签中查找匹配的标签
            for (const category of this.categories) {
              const matchingTag = category.tags.find(t => t.id === tag.id);
              if (matchingTag) {
                // 添加到已选择标签，包含权重
                this.selectedTags.push({
                  ...matchingTag,
                  weight: tag.weight || 3
                });
                break;
              }
            }
          });
          
          console.log('已加载用户标签:', this.selectedTags);
        } else {
          console.log('用户未选择标签或加载失败');
        }
      })
      .catch(err => {
        console.error('加载用户标签失败:', err);
        this.$message.warning('无法加载您之前选择的标签，请重新选择');
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
      
      if (this.selectedTags.length > 8) {
        this.$message.warning('最多只能选择8个标签');
        return;
      }
      
      const userString = localStorage.getItem('user');
      if (!userString) {
        this.$message.error('用户信息获取失败，请重新登录');
        return;
      }
      
      this.user = JSON.parse(userString);
      this.saving = true;

      // 准备发送的数据，包括标签ID和权重
      const titleData = this.selectedTags.map(tag => ({
        id: tag.id,
        weight: tag.weight || 3
      }));

      api.post('/api/user/title/', {
        userId: this.user.id,
        titleData: titleData
      }).then(res => {
        this.saving = false;
        this.$message.success('标签选择成功');
        this.$emit("onclose")
      }).catch(err => {
        console.error('请求失败:', err);
        this.saving = false;
        this.$message.error('保存标签失败，请重试');
      });
    },
    skipSelection() {
      api.post('/api/user/title/', {
        userId: this.user.id,
        titleData: []
      }).then(res => {
        this.$message.info('已跳过标签选择');
        this.selectedTags = [];
        this.$emit("onclose");
      }).catch(err => {
        console.error('请求失败:', err);
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
  min-height: 200px;
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  position: relative;
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
  margin-bottom: 1.5em;
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

/* 已选择标签区域 */
.selected-tags-container {
  margin: 1.5em 0;
  padding: 1em;
  background: #f9f9f9;
  border-radius: 12px;
  border: 1px solid #eee;
}

.selected-section-title {
  font-size: 1.1rem;
  color: #333;
  margin-bottom: 1em;
  font-weight: 500;
}

.selected-tags-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.selected-tag-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.8em;
  background: white;
  border-radius: 8px;
  box-shadow: 0 1px 5px rgba(0,0,0,0.05);
}

.tag-name {
  font-weight: 500;
  color: #333;
  flex: 0 0 20%;
}

.weight-control {
  display: flex;
  align-items: center;
  flex: 1;
  margin: 0 10px;
}

.weight-label {
  margin-right: 10px;
  color: #666;
}

.remove-tag-btn {
  flex: 0 0 auto;
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

.action-buttons {
  display: flex;
  gap: 10px;
  align-items: center;
}

.selected-count {
  color: #666;
  font-size: clamp(0.8rem, 2.5vw, 0.9rem);
}

.skip-btn {
  border: 1px solid #dcdfe6;
  color: #606266;
  padding: 0.6em 1.5em;
  border-radius: 25px;
  font-size: clamp(0.85rem, 2.5vw, 0.95rem);
  cursor: pointer;
  transition: all 0.3s ease;
}

.skip-btn:hover:not(:disabled) {
  border-color: #c6e2ff;
  color: #409eff;
  background-color: #ecf5ff;
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
  
  .selected-tag-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
  
  .tag-name {
    flex: 0 0 100%;
  }
  
  .weight-control {
    flex: 0 0 100%;
    margin: 0;
  }
  
  .remove-tag-btn {
    align-self: flex-end;
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
  
  .action-buttons {
    width: 100%;
    justify-content: center;
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
