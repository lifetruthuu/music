<template>
  <el-dialog 
    title="编辑歌曲标签" 
    :visible.sync="updateMusicTitleDialogVisible" 
    :before-close="onClose"
    width="500px"
    center>
    <el-form 
      ref="musicForm" 
      :model="form" 
      :rules="rules"
      label-width="80px"
      v-loading="loading">
      <el-form-item label="歌曲名称">
        <el-input v-model="form.name" disabled></el-input>
      </el-form-item>

      <el-form-item label="标签" prop="musicTitleIds">
        <el-select 
          v-model="form.musicTitleIds" 
          placeholder="请选择标签"  
          multiple 
          filterable
          style="width: 100%; text-align: left"
          :loading="titleLoading">
          <el-option
              v-for="item in titleData"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
        <div class="tips">提示：可以选择多个标签</div>
      </el-form-item>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="onClose">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitLoading">保 存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import axios from 'axios';
import api from "@/api/axios";

export default {
  props: {
    updateMusicTitleDialogVisible: Boolean,
    musicTitle: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        id: '',
        name: '',
        musicTitleIds: [],
      },
      titleData: [],
      loading: false,
      titleLoading: false,
      submitLoading: false,
      rules: {
        musicTitleIds: [
          { type: 'array', required: false, message: '请至少选择一个标签', trigger: 'change' }
        ]
      }
    };
  },
  watch: {
    updateMusicTitleDialogVisible(val) {
      if (val) {
        this.initForm();
      }
    }
  },
  created() {
    this.initForm();
  },
  methods: {
    initForm() {
      this.loading = true;
      this.form.id = this.musicTitle.id || '';
      this.form.name = this.musicTitle.name || '';
      this.form.musicTitleIds = [];
      
      // 获取标签数据
      this.queryTitle();
      
      // 获取歌曲已有标签
      if (this.form.id) {
        this.querySongTitles();
      }
    },
    queryTitle() {
      this.titleLoading = true;
      api.post('/api/title/list/', {})
        .then(res => {
          this.titleData = res.list || [];
        })
        .catch(err => {
          this.$message.error('获取标签列表失败');
          console.error('请求失败:', err);
        })
        .finally(() => {
          this.titleLoading = false;
        });
    },
    querySongTitles() {
      api.post('/api/music/musicTitle/', {
        id: this.form.id,
      })
        .then(res => {
          this.form.musicTitleIds = [];
          if (res.list && Array.isArray(res.list)) {
            res.list.forEach(item => {
              this.form.musicTitleIds.push(item.id);
            });
          }
        })
        .catch(err => {
          this.$message.error('获取歌曲标签失败');
          console.error('请求失败:', err);
        })
        .finally(() => {
          this.loading = false;
        });
    },
    onClose() {
      this.$emit("onCloseMusicTitleDialog");
    },
    submitForm() {
      this.$refs.musicForm.validate(valid => {
        if (valid) {
          this.submitLoading = true;
          api.post('/api/music/updateMusicTitle/', this.form)
            .then(response => {
              this.$message.success('标签修改成功');
              this.$emit("onCloseMusicTitleDialog");
            })
            .catch(error => {
              this.$message.error('修改失败: ' + (error.response?.data?.message || error.message || '未知错误'));
              console.error(error);
            })
            .finally(() => {
              this.submitLoading = false;
            });
        }
      });
    }
  }
};
</script>

<style scoped>
.el-select {
  width: 100%;
}

.tips {
  font-size: 12px;
  color: #909399;
  margin-top: 5px;
}

.dialog-footer {
  text-align: right;
}
</style>