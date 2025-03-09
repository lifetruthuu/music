<template>
  <div class="register">
    <div class="myregister" align="center">
      <h4>用户注册</h4>
      <el-form
        :model="ruleForm"
        :rules="rules"
        ref="ruleForm"
        label-width="0px"
      >
        <el-form-item label="" prop="userName" style="margin-top: 10px">
          <el-row>
            <el-col :span="2">
              <span class="el-icon-s-custom"></span>
            </el-col>
            <el-col :span="22">
              <el-input
                class="inps"
                placeholder="用户名"
                v-model="ruleForm.userName"
                autocomplete="off"
              >
              </el-input>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="" prop="password">
          <el-row>
            <el-col :span="2">
              <span class="el-icon-lock"></span>
            </el-col>
            <el-col :span="22">
              <el-input
                class="inps"
                type="password"
                placeholder="密码"
                v-model="ruleForm.password"
                autocomplete="off"
              ></el-input>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item label="" prop="confirmPassword">
          <el-row>
            <el-col :span="2">
              <span class="el-icon-lock"></span>
            </el-col>
            <el-col :span="22">
              <el-input
                class="inps"
                type="password"
                placeholder="确认密码"
                v-model="ruleForm.confirmPassword"
                autocomplete="off"
              ></el-input>
            </el-col>
          </el-row>
        </el-form-item>
        <el-form-item style="margin-top: 40px">
          <el-button type="primary" round class="submitBtn" @click="onResigins('ruleForm')"
            >注册
          </el-button>
        </el-form-item>
        <div class="login-link">
          <router-link to="/">已有账号？返回登录</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
// 直接导入store实例
import store from '@/store';

export default {
  name: 'Register',
  data() {
    // 密码验证一致性的校验规则
    const validatePass2 = (rule, value, callback) => {
      if (value === '') {
        callback(new Error('请再次输入密码'));
      } else if (value !== this.ruleForm.password) {
        callback(new Error('两次输入密码不一致!'));
      } else {
        callback();
      }
    };
    
    return {
      ruleForm:{
        userName: '',
        password: '',
        confirmPassword: ''
      },
      rules:{
        userName:[
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 3, max: 20, message: '长度在 3 到 20 个字符', trigger: 'blur'}
        ],
        password:[
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 6, message: '密码长度至少为 6 个字符', trigger: 'blur'}
        ],
        confirmPassword: [
          {required: true, message: '请再次输入密码', trigger: 'blur'},
          {validator: validatePass2, trigger: 'blur'}
        ]
      }
    };
  },
  mounted(){
    this.ruleForm.userName = "";
    this.ruleForm.password = "";
    this.ruleForm.confirmPassword = "";
  },
  methods: {
    async onResigins(formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          try {
            const response = await axios.post('http://127.0.0.1:8000/api/resigins/', {
              username: this.ruleForm.userName,
              password: this.ruleForm.password,
            });
            
            this.$message({
              message: '注册成功',
              type: 'success'
            });
            
            // 如果注册接口直接返回了用户信息，则存入Vuex
            if (response.data.user) {
              // 使用直接导入的store实例
              store.dispatch('setUser', response.data.user);
              // 注册并登录成功后直接跳转到首页
              setTimeout(() => {
                this.$router.push('/');
              }, 1500);
            } else {
              // 如果注册接口没有返回用户信息，则跳转到登录页
              setTimeout(() => {
                this.$router.push('/');
              }, 1500);
            }
          } catch (error) {
            let message = error.response?.data?.message || '注册失败，请稍后再试';
            // 请求失败，显示错误信息
            this.$message({
              message: message,
              type: 'error'
            });
          }
        } else {
          return false;
        }
      });
    }
  }
}
</script>

<style scoped>
.register {
  width: 100vw;
  padding: 0;
  margin: 0;
  height: 100vh;
  font-size: 16px;
  background-position: center;
  background-size: cover;
  /* 使用明亮的蓝色渐变背景，与登录页面保持一致 */
  background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
  color: #fff;
  font-family: "Source Sans Pro", sans-serif;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.myregister {
  width: 320px;
  height: auto;
  padding: 40px;
  border-radius: 12px;
  /* 使用半透明白色背景，让内容更加突出 */
  background-color: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.myregister h4 {
  font-size: 28px;
  margin-bottom: 30px;
  /* 使用明亮的蓝色作为标题颜色 */
  color: #ffffff;
  font-weight: 600;
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* 输入框样式 */
.inps :deep(.el-input__inner) {
  border: none;
  border-bottom: 2px solid rgba(255, 255, 255, 0.5);
  color: #fff;
  background-color: transparent;
  font-size: 14px;
  padding: 10px 5px;
  transition: all 0.3s ease;
}

.inps :deep(.el-input__inner:focus) {
  border-bottom: 2px solid #64b5f6;
  box-shadow: 0 2px 8px rgba(100, 181, 246, 0.3);
}

/* 图标样式 */
.el-icon-s-custom, .el-icon-lock {
  color: #64b5f6;
  font-size: 18px;
}

/* 按钮样式 */
.submitBtn {
  background-color: #2196f3;
  border: none;
  color: white;
  width: 100%;
  padding: 12px 0;
  font-size: 16px;
  font-weight: 600;
  border-radius: 30px;
  margin-top: 10px;
  transition: all 0.3s ease;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.3);
}

.submitBtn:hover {
  background-color: #1976d2;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(33, 150, 243, 0.4);
}

.submitBtn:active {
  transform: translateY(0);
}

/* 登录链接样式 */
.login-link {
  margin-top: 20px;
  text-align: center;
}

.login-link a {
  color: #bbdefb;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.login-link a:hover {
  color: #ffffff;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .myregister {
    width: 85%;
    max-width: 320px;
    padding: 30px;
  }
}
</style> 