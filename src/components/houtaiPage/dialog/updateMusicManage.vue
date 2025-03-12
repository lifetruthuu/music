<template>
  <el-dialog 
    title="编辑音乐信息" 
    :visible.sync="musicDialogFormVisible" 
    :before-close="onClose"
    width="600px"
    center>
    <el-form 
      ref="musicForm" 
      :model="form" 
      :rules="rules"
      label-width="80px"
      v-loading="loading">
      <el-form-item label="音乐名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入音乐名称"></el-input>
      </el-form-item>
      
      <el-form-item label="音乐封面" prop="cover">
        <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :on-change="handleCoverChange"
            :before-upload="beforeCoverUpload"
            :file-list="coverFileList"
            :limit="1"
            accept="image/jpeg,image/png,image/jpg,image/gif"
            list-type="picture-card">
          <i class="el-icon-plus"></i>
        </el-upload>
        <div class="el-upload__tip">可上传新封面，支持jpg/png/gif格式，不超过2MB</div>
      </el-form-item>
      
      <el-form-item label="作词人" prop="writer">
        <el-input v-model="form.writer" placeholder="请输入作词人"></el-input>
      </el-form-item>
      
      <el-form-item label="歌手" prop="singer">
        <el-select 
          v-model="form.singer" 
          placeholder="请选择歌手"
          filterable
          style="width: 100%"
          :loading="singersLoading">
          <el-option
              v-for="item in singers"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>
      
      <el-form-item label="当前音频">
        <audio v-if="currentAudioUrl" controls style="width: 100%;">
          <source :src="currentAudioUrl" type="audio/ogg">
          您的浏览器不支持音频播放
        </audio>
        <div v-else class="no-audio">暂无音频</div>
      </el-form-item>
      
      <el-form-item label="音频文件" prop="audio">
        <el-upload
            class="audio-uploader"
            action=""
            :auto-upload="false"
            :on-change="handleAudioChange"
            :before-upload="beforeAudioUpload"
            :file-list="audioFileList"
            :limit="1"
            accept="audio/*">
          <el-button type="primary" icon="el-icon-upload">选择新音频</el-button>
        </el-upload>
        <div class="el-upload__tip">可上传新音频文件，支持常见音频格式，不超过20MB</div>
      </el-form-item>
      
      <div v-if="audioPreview">
        <h4>新音频预览</h4>
        <audio controls style="width: 100%;">
          <source :src="audioPreview" type="audio/mpeg">
          您的浏览器不支持音频播放
        </audio>
      </div>
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
    musicDialogFormVisible: Boolean,
    music: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      form: {
        id: '',
        name: '',
        cover: null,
        writer: '',
        singer: '',
        lyrics: '',
        audio: null
      },
      audioFileList: [],
      coverFileList: [],
      singers: [],
      loading: false,
      singersLoading: false,
      submitLoading: false,
      currentCoverUrl: '',
      currentAudioUrl: '',
      coverPreview: '',
      audioPreview: '',
      rules: {
        name: [
          { required: true, message: '请输入音乐名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        singer: [
          { required: true, message: '请选择歌手', trigger: 'change' }
        ]
      }
    };
  },
  watch: {
    musicDialogFormVisible(val) {
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
      this.querySingers();
      
      // 重置表单
      this.form = { 
        id: '',
        name: '',
        cover: null,
        writer: '',
        singer: '',
        lyrics: '',
        audio: null
      };
      
      this.coverPreview = '';
      this.audioPreview = '';
      this.currentCoverUrl = '';
      this.currentAudioUrl = '';
      this.audioFileList = [];
      this.coverFileList = [];
      
      // 设置编辑数据
      if (this.music.id) {
        this.form.id = this.music.id;
        this.form.name = this.music.name || '';
        this.form.writer = this.music.writerNames || '';
        this.form.singer = this.music.singerId || '';
        
        // 设置当前封面和音频URL
        if (this.music.musicPath) {
          this.currentCoverUrl = 'http://localhost:8000' + this.music.musicPath;
          this.coverFileList = [{ name: '当前封面', url: this.currentCoverUrl }];
        }
        
        if (this.music.audioPath) {
          this.currentAudioUrl = 'http://localhost:8000' + this.music.audioPath;
          this.audioFileList = [{ name: '当前音频', url: this.currentAudioUrl }];
        }
      }
      
      this.loading = false;
    },
    querySingers() {
      this.singersLoading = true;
      api.get('/api/singer/all/', {}).then(res => {
        this.singers = res.list || [];
      }).catch(err => {
        this.$message.error('获取歌手列表失败');
        console.error('请求失败:', err);
      }).finally(() => {
        this.singersLoading = false;
      });
    },
    onClose() {
      // 清理对象URL以避免内存泄漏
      if (this.coverPreview && this.coverPreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.coverPreview);
      }
      if (this.audioPreview && this.audioPreview.startsWith('blob:')) {
        URL.revokeObjectURL(this.audioPreview);
      }
      this.$emit("onCloseMusicDialog");
    },
    beforeCoverUpload(file) {
      const isImage = file.type === 'image/jpeg' || file.type === 'image/png' || file.type === 'image/gif' || file.type === 'image/jpg';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isImage) {
        this.$message.error('上传封面图片只能是JPG/PNG/GIF格式!');
        return false;
      }
      
      if (!isLt2M) {
        this.$message.error('上传封面图片大小不能超过2MB!');
        return false;
      }
      
      return true;
    },
    beforeAudioUpload(file) {
      const isAudio = file.type.startsWith('audio/');
      const isLt20M = file.size / 1024 / 1024 < 20;

      if (!isAudio) {
        this.$message.error('请上传有效的音频文件!');
        return false;
      }
      
      if (!isLt20M) {
        this.$message.error('音频文件大小不能超过20MB!');
        return false;
      }
      
      return true;
    },
    handleCoverChange(file) {
      if (file && file.raw) {
        // 清理之前的预览
        if (this.coverPreview && this.coverPreview.startsWith('blob:')) {
          URL.revokeObjectURL(this.coverPreview);
        }
        
        this.form.cover = file.raw;
        this.coverPreview = URL.createObjectURL(file.raw);
      }
    },
    handleAudioChange(file) {
      if (file && file.raw) {
        // 清理之前的预览
        if (this.audioPreview && this.audioPreview.startsWith('blob:')) {
          URL.revokeObjectURL(this.audioPreview);
        }
        
        this.form.audio = file.raw;
        this.audioPreview = URL.createObjectURL(file.raw);
      }
    },
    submitForm() {
      this.$refs.musicForm.validate(valid => {
        if (valid) {
          this.submitLoading = true;
          const formData = new FormData();
          formData.append('id', this.form.id);
          formData.append('name', this.form.name);
          
          if (this.form.cover) {
            formData.append('cover', this.form.cover);
          }
          
          formData.append('writer', this.form.writer || '');
          formData.append('singer', this.form.singer);
          
          if (this.form.audio) {
            formData.append('audio', this.form.audio);
          }

          api.post('/api/music/update/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(response => {
            this.$message.success('音乐信息更新成功');
            this.$emit("onCloseMusicDialog");
          }).catch(error => {
            this.$message.error('更新失败: ' + (error.response?.data?.message || error.message || '未知错误'));
            console.error(error);
          }).finally(() => {
            this.submitLoading = false;
          });
        }
      });
    }
  }
};
</script>

<style scoped>
.preview-wrapper {
  display: flex;
  justify-content: space-around;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.preview-section {
  text-align: center;
  margin: 10px;
}

.preview-image {
  width: 150px;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.no-image, .no-audio {
  width: 150px;
  height: 150px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border-radius: 4px;
}

.no-audio {
  width: 100%;
  height: 50px;
}

.avatar-uploader, .audio-uploader {
  text-align: center;
  margin-bottom: 10px;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.dialog-footer {
  text-align: right;
}

h4 {
  margin: 10px 0;
  color: #606266;
  font-size: 14px;
}
</style>