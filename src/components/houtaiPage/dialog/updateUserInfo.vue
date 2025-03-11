<template>
  <el-dialog 
    :title="ruleForm.id ? '编辑用户信息' : '创建用户信息'"
    :visible.sync="dialogFormVisible" 
    :before-close="onClose"
    width="650px"
    center
    class="user-edit-dialog">
    <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm" :inline="false">
      <div class="avatar-container">
        <el-avatar :size="100" :src="avatarPreview || fullImagePath(ruleForm.avatar_url) || 'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png'"></el-avatar>
        <el-upload
          class="avatar-uploader"
          action="#"
          :http-request="uploadAvatar"
          :show-file-list="false"
          :before-upload="beforeAvatarUpload">
          <el-button size="small" type="primary" icon="el-icon-upload" class="upload-btn">更换头像</el-button>
        </el-upload>
      </div>

      <el-tabs v-model="activeTab" @tab-click="handleTabClick">
        <el-tab-pane label="基本信息" name="basic">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="用户名" prop="userName">
                <el-input v-model="ruleForm.userName" placeholder="请输入用户名"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="密码" prop="password">
                <el-input v-model="ruleForm.password" placeholder="请输入密码" show-password></el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="昵称" prop="nickname">
                <el-input v-model="ruleForm.nickname" placeholder="请输入昵称"></el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="性别" prop="sex">
                <el-radio-group v-model="ruleForm.sex">
                  <el-radio label="男">男</el-radio>
                  <el-radio label="女">女</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="年龄" prop="age">
                <el-input-number v-model="ruleForm.age" :min="1" :max="120" controls-position="right" style="width: 100%"></el-input-number>
              </el-form-item>
            </el-col>
          </el-row>
        </el-tab-pane>

        <el-tab-pane label="联系方式" name="contact">
          <el-row :gutter="20">
            <el-col :span="12">
              <el-form-item label="电子邮箱" prop="email">
                <el-input v-model="ruleForm.email" placeholder="请输入电子邮箱">
                  <i slot="prefix" class="el-icon-message"></i>
                </el-input>
              </el-form-item>
            </el-col>
            <el-col :span="12">
              <el-form-item label="手机号码" prop="phone">
                <el-input v-model="ruleForm.phone" placeholder="请输入手机号码">
                  <i slot="prefix" class="el-icon-phone"></i>
                </el-input>
              </el-form-item>
            </el-col>
          </el-row>

          <el-form-item label="个人简介" prop="bio">
            <el-input type="textarea" v-model="ruleForm.bio" placeholder="请输入个人简介" :rows="4"></el-input>
          </el-form-item>
        </el-tab-pane>
      </el-tabs>

      <el-form-item style="text-align: right; margin-top: 20px;">
        <el-button @click="onClose">取消</el-button>
        <el-button type="primary" @click="submitForm('ruleForm')" :loading="loading">保存</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>
</template>

<script>
import http from '@/api/axios.js'; // 导入封装好的 http 模块
import axios from 'axios';
export default {
  props: {
    dialogFormVisible: Boolean,
    user: Object
  },
  data() {
    // 自定义邮箱验证规则
    const validateEmail = (rule, value, callback) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback(new Error('请输入正确的电子邮箱'));
      } else {
        callback();
      }
    };
    
    // 自定义手机号验证规则
    const validatePhone = (rule, value, callback) => {
      if (value && !/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号码'));
      } else {
        callback();
      }
    };
    
    return {
      ruleForm: {
        id: '',
        userName: '',
        password: '',
        sex: '',
        age: '',
        nickname: '',
        avatar_url: '',
        email: '',
        phone: '',
        bio: '',
      },
      rules: {
        userName: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 6, max: 20, message: '长度在 6 到 20 个字符', trigger: 'blur'}
        ],
        sex: [
          {required: true, message: '请选择性别', trigger: 'change'}
        ],
        age: [
          {required: true, message: '请输入年龄', trigger: 'blur'},
        ],
        email: [
          {validator: validateEmail, trigger: 'blur'}
        ],
        phone: [
          {validator: validatePhone, trigger: 'blur'}
        ],
      },
      loading: false,
      activeTab: 'basic',
      avatarFile: null,
      avatarPreview: null,
    };
  },
  created() {
    this.initFormData();
  },
  methods: {
    initFormData() {
      if (this.user.id) {
        // 复制用户对象到表单
        Object.keys(this.ruleForm).forEach(key => {
          if (this.user[key] !== undefined) {
            this.ruleForm[key] = this.user[key];
          }
        });
      } else {
        // 重置表单
        this.$refs['ruleForm']?.resetFields();
        this.ruleForm = {
          id: null,
          userName: '',
          password: '',
          sex: '',
          age: '',
          nickname: '',
          avatar_url: '',
          email: '',
          phone: '',
          bio: '',
        };
      }
      // 重置头像预览
      this.avatarPreview = null;
      this.avatarFile = null;
    },
    handleTabClick() {
      // Tab切换时的处理逻辑
    },
    beforeAvatarUpload(file) {
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
      
      // 保存文件并生成预览
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // 阻止自动上传
      return false;
    },
    uploadAvatar() {
      // 这里不执行实际上传，保存表单时一起处理
      return false;
    },
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          this.loading = true;
          
          // 创建FormData对象，用于同时处理表单数据和文件上传
          const formData = new FormData();
          
          // 确保包含用户ID
          const userId = this.ruleForm.id || this.user.id;
          if (userId) {
            formData.append('id', userId);
          }
          
          // 添加其他表单字段
          formData.append('userName', this.ruleForm.userName);
          formData.append('password', this.ruleForm.password);
          formData.append('sex', this.ruleForm.sex);
          formData.append('age', this.ruleForm.age);
          formData.append('nickname', this.ruleForm.nickname);
          formData.append('email', this.ruleForm.email || '');
          formData.append('phone', this.ruleForm.phone || '');
          formData.append('bio', this.ruleForm.bio || '');
          
          // 如果有新上传的头像文件，添加到FormData
          if (this.avatarFile) {
            formData.append('avatar', this.avatarFile);
          }
          
          // 发送请求
          http.post('/api/user/update/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(res => {
            this.loading = false;
            
            // 检查响应状态
            if (res.status === 'success') {
              // 更新头像URL（如果有）
              if (res.avatarUrl) {
                this.ruleForm.avatar_url = res.avatarUrl;
              }
              
              this.$message({
                message: '保存成功',
                type: 'success',
                duration: 2000
              });
              this.$emit('onCloseUserDialog', false);
            } else {
              this.$message.error(res.message || '保存失败');
            }
          }).catch(err => {
            this.loading = false;
            this.$message.error('保存失败，请稍后重试');
            console.error('请求失败:', err);
          });
        } else {
          this.$message({
            message: '请正确填写表单信息',
            type: 'warning'
          });
          return false;
        }
      });
    },
    onClose() {
      this.$emit('onCloseUserDialog', false);
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      if (!path) return '';
      return path.startsWith('http') ? path : `http://localhost:8000${path}`;
    },
  },
  computed: {
    getUploadData() {
      return {
        id: this.ruleForm.id || this.user.id,
        userName: this.ruleForm.userName
      };
    }
  },
}
</script>

<style scoped>
.user-edit-dialog >>> .el-dialog__body {
  padding: 20px 30px;
}

.avatar-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
}

.upload-btn {
  margin-top: 10px;
}

.avatar-uploader {
  text-align: center;
}

/* 动画效果 */
.el-tabs__item {
  transition: all 0.3s;
}

.el-tabs__item.is-active {
  font-weight: bold;
  transform: scale(1.05);
}

.el-form-item {
  transition: all 0.3s ease-in-out;
}

/* 表单项间距 */
.el-row {
  margin-bottom: 10px;
}

/* 移动端响应式 */
@media screen and (max-width: 768px) {
  .user-edit-dialog >>> .el-dialog {
    width: 95% !important;
    margin-top: 10vh !important;
  }
  
  .el-form-item {
    margin-bottom: 15px;
  }
}
</style>