<template>
  <div class="login">
    <div class="mylogin" align="center">
      <h4>音乐推荐系统</h4>
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
        <el-form-item style="margin-top: 55px">
          <el-button type="primary" round class="submitBtn" @click="onLogin('ruleForm')"
            >登录
          </el-button>
        </el-form-item>
        <div class="unlogin">
          <router-link to="/register">注册新账号</router-link>
        </div>
      </el-form>
    </div>
  </div>
</template>

<script>
import axios from 'axios';
export default {
  name: 'HelloWorld',
  props: {
    msg: String
  },
  data() {
    return {
      ruleForm:{
        userName: '',
        password: '',
      },
      rules:{
        userName:[{required: true, message: '请输入用户名', trigger: 'blur'}],
        password:[{required: true, message: '请输入密码', trigger: 'blur'}]
      },
      errorMessage: ''
    };
  },
  methods:{
    async onLogin(formName) {
      this.$refs[formName].validate(async (valid) => {
        if (valid) {
          try {
            const response = await axios.post('http://127.0.0.1:8000/api/login/', {
              username: this.ruleForm.userName,
              password: this.ruleForm.password,
            });
            if (response.data.user) {
              // 登录成功，保存用户信息并跳转到首页
              localStorage.setItem('user', JSON.stringify(response.data.user));
              this.$message({
                message: '登录成功',
                type: 'success'
              });
              this.$router.push({ path: '/index', query: { userId: response.data.user.id } }); // 跳转到首页
            } else {
              // 登录失败，显示错误信息
              this.$message({
                message: response.data.message || '登录失败',
                type: 'error'
              });
            }
          } catch (error) {
            // 请求失败，显示错误信息
            this.$message({
              message: '登录失败，请检查用户名和密码',
              type: 'error'
            });
            console.error(error);
          }
        } else {
          return false;
        }
      });
    },
    resetForm() {
      // 重置表单数据
      this.ruleForm.userName = '';
      this.ruleForm.password = '';
      // 如果有其他表单字段，也在这里重置
    }
  }
}
</script>

<style scoped>
.login {
  width: 100vw;
  padding: 0;
  margin: 0;
  height: 100vh;
  font-size: 16px;
  background-position: center;
  background-size: cover;
  /* 使用明亮的蓝色渐变背景 */
  background: linear-gradient(135deg, #1e88e5 0%, #0d47a1 100%);
  color: #fff;
  font-family: "Source Sans Pro", sans-serif;
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mylogin {
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

.mylogin h4 {
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

/* 注册链接样式 */
.unlogin {
  margin-top: 20px;
  text-align: center;
}

.unlogin a {
  color: #bbdefb;
  text-decoration: none;
  font-size: 14px;
  transition: all 0.3s ease;
}

.unlogin a:hover {
  color: #ffffff;
  text-decoration: underline;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .mylogin {
    width: 85%;
    max-width: 320px;
    padding: 30px;
  }
}
</style>