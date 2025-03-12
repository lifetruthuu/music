<template>
  <el-dialog 
    title="新增歌手"
    :visible.sync="insertSingerDialogVisible" 
    :before-close="onClose"
    width="700px"
    center
    class="singer-dialog">
    <div class="dialog-body">
      <el-form 
        ref="singerForm" 
        :model="form"  
        :rules="rules"  
        label-width="100px"
        status-icon>
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="名称" prop="name">
              <el-input 
                v-model="form.name" 
                placeholder="请输入歌手名称"
                maxlength="50"
                show-word-limit>
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="英文名" prop="englishName">
              <el-input 
                v-model="form.englishName" 
                placeholder="请输入英文名称"
                maxlength="100">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="头像" prop="cover">
          <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :on-change="handleCoverChange"
            :file-list="fileList"
            :limit="1"
            :before-upload="beforeCoverUpload"
            accept="image/jpeg,image/png,image/jpg,image/gif"
            list-type="picture-card">
            <i class="el-icon-plus"></i>
            <div slot="tip" class="el-upload__tip">支持JPG、PNG格式，大小不超过2MB</div>
          </el-upload>
        </el-form-item>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="form.gender">
                <el-radio :label="1">男</el-radio>
                <el-radio :label="2">女</el-radio>
              </el-radio-group>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="地区" prop="region">
              <el-input 
                v-model="form.region" 
                placeholder="如: 中国内地">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="国家" prop="country">
              <el-input 
                v-model="form.country" 
                placeholder="如: 中国">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="生日" prop="birthday">
              <el-date-picker
                v-model="form.birthday"
                type="date"
                placeholder="选择出生日期"
                value-format="yyyy-MM-dd"
                style="width: 100%">
              </el-date-picker>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="出道日期" prop="debutDate">
              <el-date-picker
                v-model="form.debutDate"
                type="date"
                placeholder="选择出道日期"
                value-format="yyyy-MM-dd"
                style="width: 100%">
              </el-date-picker>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="12">
            <el-form-item label="音乐风格" prop="musicStyle">
              <el-input 
                v-model="form.musicStyle" 
                placeholder="如: 流行、抒情">
              </el-input>
            </el-form-item>
          </el-col>
          <el-col :span="12">
            <el-form-item label="所属厂牌" prop="label">
              <el-input 
                v-model="form.label" 
                placeholder="如: 华纳音乐">
              </el-input>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-row :gutter="20">
          <el-col :span="8">
            <el-form-item label="粉丝数量" prop="fansCount">
              <el-input-number 
                v-model="form.fansCount" 
                :min="0" 
                :controls="false"
                style="width: 100%">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="专辑数量" prop="albumsCount">
              <el-input-number 
                v-model="form.albumsCount" 
                :min="0" 
                :controls="false"
                style="width: 100%">
              </el-input-number>
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="歌曲数量" prop="songsCount">
              <el-input-number 
                v-model="form.songsCount" 
                :min="0" 
                :controls="false"
                style="width: 100%">
              </el-input-number>
            </el-form-item>
          </el-col>
        </el-row>
        
        <el-form-item label="代表作品" prop="representativeWorks">
          <el-input 
            v-model="form.representativeWorks" 
            placeholder="如: 《年轮》《一吻之间》《光年之外》"
            maxlength="500">
          </el-input>
        </el-form-item>
        
        <el-form-item label="获奖情况" prop="awards">
          <el-input 
            v-model="form.awards" 
            placeholder="如: 中国好声音第三季冠军、最佳女歌手"
            maxlength="500">
          </el-input>
        </el-form-item>
        
        <el-form-item label="简介" prop="introduction">
          <el-input 
            v-model="form.introduction" 
            type="textarea"
            :rows="4"
            placeholder="请输入歌手简介"
            maxlength="1000"
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="状态" prop="status">
          <el-radio-group v-model="form.status">
            <el-radio :label="1">启用</el-radio>
            <el-radio :label="0">禁用</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
    </div>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting">添加歌手</el-button>
    </div>
  </el-dialog>
</template>

<script>
import api from "@/api/axios";

export default {
  props: {
    insertSingerDialogVisible: Boolean,
  },
  data() {
    return {
      form: {
        name: '',
        englishName: '',
        cover: null,
        cover_url: '',
        introduction: '',
        fansCount: 0,
        region: '',
        country: '',
        birthday: '',
        gender: 2, // 默认女性
        debutDate: '',
        musicStyle: '',
        label: '',
        representativeWorks: '',
        awards: '',
        albumsCount: 0,
        songsCount: 0,
        status: 1 // 默认启用
      },
      fileList: [],
      submitting: false,
      rules: {
        name: [
          { required: true, message: '请输入歌手名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        cover: [
          { required: true, message: '请上传歌手头像', trigger: 'change' }
        ],
        gender: [
          { required: true, message: '请选择性别', trigger: 'change' }
        ],
        status: [
          { required: true, message: '请选择状态', trigger: 'change' }
        ]
      },
      coverFile: null
    };
  },
  created() {
    this.resetForm();
  },
  methods: {
    resetForm() {
      if (this.$refs.singerForm) {
        this.$refs.singerForm.resetFields();
      }
      this.form = {
        name: '',
        englishName: '',
        cover: null,
        cover_url: '',
        introduction: '',
        fansCount: 0,
        region: '',
        country: '',
        birthday: '',
        gender: 2, // 默认女性
        debutDate: '',
        musicStyle: '',
        label: '',
        representativeWorks: '',
        awards: '',
        albumsCount: 0,
        songsCount: 0,
        status: 1 // 默认启用
      };
      this.fileList = [];
      this.coverFile = null;
    },
    onClose() {
      this.resetForm();
      this.$emit("onCloseInsertSingerDialog");
    },
    handleCoverChange(file) {
      const isJPG = file.raw.type === 'image/jpeg' || file.raw.type === 'image/png';
      const isLt2M = file.raw.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
        this.fileList = [];
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        this.fileList = [];
        return false;
      }

      // 保存文件对象
      this.coverFile = file.raw;
      this.form.cover = file.raw;
      
      // 生成预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.form.cover_url = e.target.result;
      };
      reader.readAsDataURL(file.raw);
    },
    beforeCoverUpload(file) {
      // 只做验证，不处理文件，文件处理放在handleCoverChange中
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传头像图片只能是 JPG 或 PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传头像图片大小不能超过 2MB!');
        return false;
      }
      
      // 阻止自动上传
      return false;
    },
    submitForm() {
      this.$refs.singerForm.validate((valid) => {
        if (valid) {
          if (!this.form.cover && this.fileList.length === 0) {
            this.$message.warning('请上传歌手头像');
            return false;
          }
          
          this.submitting = true;
          
          const formData = new FormData();
          formData.append('name', this.form.name);
          
          // 添加封面文件
          if (this.coverFile) {
            formData.append('cover', this.coverFile);
          }

          // 使用封装的api模块发送请求
          api.post('/api/singer/insert/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(response => {
            this.$message.success('添加歌手成功');
            this.submitting = false;
            this.resetForm();
            this.$emit("onCloseInsertSingerDialog");
          }).catch(error => {
            this.submitting = false;
            this.$message.error('添加失败: ' + (error.message || '未知错误'));
            console.error('添加失败:', error);
          });
        } else {
          this.$message.warning('请完善表单信息');
          return false;
        }
      });
    }
  }
};
</script>

<style>
.singer-dialog .el-dialog__body {
  padding: 20px 30px;
}

.dialog-body {
  max-height: 60vh;
  overflow-y: auto;
}

.avatar-uploader .el-upload {
  border: 1px dashed #d9d9d9;
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
}

.avatar-uploader .el-upload:hover {
  border-color: #409EFF;
}

.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 178px;
  height: 178px;
  line-height: 178px;
  text-align: center;
}

.el-upload__tip {
  line-height: 1.2;
  padding-top: 8px;
  color: #909399;
  font-size: 12px;
}
</style>
