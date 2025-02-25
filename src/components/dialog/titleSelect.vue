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

      <!-- 分类区块 -->
      <div class="category-group" v-for="category in codes" :key="category.title">
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

      <!-- 内部确认按钮 -->
      <div class="dialog-footer">
        <span class="selected-count">已选择 {{ selectedTags.length }} 个标签</span>
        <el-button 
          type="primary" 
          class="confirm-btn" 
          @click="onSave()"
          :disabled="selectedTags.length < 3">
          确认选择
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
      codes: [],
      dialogWidth: '600px',
      windowWidth: window.innerWidth
    }
  },
  created() {
    this.queryCode();
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
    initData(){
      this.codes.forEach(code=>{
        this.$set(code,'tags',[])
        code.tags = this.titleData.filter(item => item.type === code.id);
      })
    },
    queryTitle(){
      api.post('/api/title/list/', {
      }).then(res => {
        this.titleData = res.list;
        this.initData();
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    queryCode(){
      api.post('/api/code/byType/', {
        typeId: 'music_type'
      }).then(res => {
        this.codes = res.list;
        this.queryTitle();
      }).catch(err => {
        console.error('请求失败:', err);
      });
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
      console.log("userString", userString);
      this.user = JSON.parse(userString);

      api.post('/api/user/title/', {
        userId: this.user.id,
        titleIds: this.selectedTags.map(tag=>tag.id),
      }).then(res => {
        this.codes = res.list;
        this.$message.success('标签选择成功');
        this.$emit("onclose")
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('保存标签失败');
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

.category-group {
  margin-bottom: 1.5em;
  background: white;
  border-radius: 12px;
  padding: 1em;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
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
}

.tag-item.selected {
  background: #0084ff;
  color: white;
  border-color: #0084ff;
}

.tag-item.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.tag-item.disabled:hover {
  border-color: #eee;
  color: #666;
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
}

.confirm-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
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
