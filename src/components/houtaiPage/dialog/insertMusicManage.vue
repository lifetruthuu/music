<template>
  <el-dialog 
    title="添加新歌曲" 
    :visible.sync="insertDialogFormVisible" 
    :before-close="onClose"
    width="600px"
    center>
    <el-form 
      ref="musicForm" 
      :model="form" 
      :rules="rules"
      label-width="80px"
      v-loading="loading">
      <el-form-item label="歌曲名称" prop="name">
        <el-input v-model="form.name" placeholder="请输入歌曲名称"></el-input>
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
      
      <el-form-item label="作词人" prop="writer">
        <el-input v-model="form.writer" placeholder="请输入作词人"></el-input>
      </el-form-item>
      
      <el-form-item label="封面" prop="cover">
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
        <div class="el-upload__tip">只能上传jpg/png/gif图片，且不超过2MB</div>
      </el-form-item>
      
      <div class="preview-container" v-if="coverPreview">
        <div class="preview-item">
          <h4>封面预览</h4>
          <img :src="coverPreview" class="preview-image" alt="封面预览">
        </div>
      </div>
      
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
          <el-button type="primary" icon="el-icon-upload">选择音频文件</el-button>
        </el-upload>
        <div class="el-upload__tip">支持MP3、WAV等音频格式，大小不超过20MB</div>
      </el-form-item>
      
      <audio v-if="audioPreview" controls style="width: 100%; margin-top: 10px;">
        <source :src="audioPreview" type="audio/mpeg">
        您的浏览器不支持音频播放
      </audio>
    </el-form>
    <div slot="footer" class="dialog-footer">
      <el-button @click="onClose">取 消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitLoading">上 传</el-button>
    </div>
  </el-dialog>
</template>

<script>
import api from "@/api/axios";

export default {
  props: {
    insertDialogFormVisible: Boolean,
  },
  data() {
    return {
      form: {
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
      coverPreview: '',
      audioPreview: '',
      rules: {
        name: [
          { required: true, message: '请输入歌曲名称', trigger: 'blur' },
          { min: 1, max: 50, message: '长度在 1 到 50 个字符', trigger: 'blur' }
        ],
        singer: [
          { required: true, message: '请选择歌手', trigger: 'change' }
        ],
        cover: [
          { required: true, message: '请上传封面图片', trigger: 'change' }
        ],
        audio: [
          { required: true, message: '请上传音频文件', trigger: 'change' }
        ]
      }
    };
  },
  watch: {
    insertDialogFormVisible(val) {
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
      this.form = { 
        name: '',
        cover: null,
        writer: '',
        singer: '',
        lyrics: '',
        audio: null
      };
      this.coverFileList = [];
      this.audioFileList = [];
      this.coverPreview = '';
      this.audioPreview = '';
      this.querySingers();
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
      this.$emit("onCloseInsertMusicDialog");
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
          if (!this.form.cover) {
            this.$message.warning("请上传封面图片");
            return;
          }
          
          if (!this.form.audio) {
            this.$message.warning("请上传音频文件");
            return;
          }
          
          this.submitLoading = true;
          const formData = new FormData();
          formData.append('name', this.form.name);
          formData.append('cover', this.form.cover);
          formData.append('writer', this.form.writer);
          formData.append('singer', this.form.singer);
          formData.append('audio', this.form.audio);

          api.post('/api/music/insert/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(response => {
            this.$message.success('歌曲上传成功');
            this.$emit("onCloseInsertMusicDialog");
          }).catch(error => {
            this.$message.error('歌曲上传失败: ' + (error.response?.data?.message || error.message || '未知错误'));
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
.el-select {
  width: 100%;
}

.preview-container {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.preview-item {
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

.avatar-uploader {
  text-align: center;
}

.audio-uploader {
  display: inline-block;
  margin-right: 10px;
}

.el-upload__tip {
  color: #909399;
  font-size: 12px;
  line-height: 1.5;
}

.dialog-footer {
  text-align: right;
}
</style>