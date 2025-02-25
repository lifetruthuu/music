<template>
  <el-dialog
    :visible.sync="titleDialog"
    :before-close="onClose"
    custom-class="tag-dialog"
    width="600px"
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
    }
  },
  created() {
    this.queryCode();
  },
  methods:{
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
}

.container {
  max-width: 100%;
  margin: 0 auto;
  padding: 10px 20px 20px;
}

.header {
  font-size: 22px;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
}

.selection-hint {
  color: #909399;
  font-size: 14px;
  text-align: center;
  margin-bottom: 20px;
}

.category-group {
  margin-bottom: 20px;
  background: white;
  border-radius: 12px;
  padding: 15px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.category-title {
  font-size: 18px;
  color: #333;
  margin-bottom: 15px;
  font-weight: 500;
}

.tags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tag-item {
  padding: 8px 15px;
  border-radius: 20px;
  border: 1px solid #eee;
  font-size: 14px;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  user-select: none;
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
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #ebeef5;
}

.selected-count {
  color: #666;
  font-size: 14px;
}

.confirm-btn {
  background: #0084ff;
  color: white;
  border: none;
  padding: 10px 25px;
  border-radius: 25px;
  font-size: 15px;
  cursor: pointer;
}

.confirm-btn:disabled {
  background: #c0c4cc;
  cursor: not-allowed;
}

/* 响应式调整 */
@media (max-width: 576px) {
  .container {
    padding: 10px;
  }
  
  .header {
    font-size: 18px;
  }
  
  .category-group {
    padding: 10px;
  }
  
  .tag-item {
    padding: 6px 12px;
    font-size: 13px;
  }
}
</style>