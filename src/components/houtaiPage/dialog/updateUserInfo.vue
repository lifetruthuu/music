<template>
  <el-dialog :title="ruleForm.id? '创建用户信息':'编辑用户信息'"
             :visible.sync="dialogFormVisible" :before-close="onClose">
    <el-form :model="ruleForm" :rules="rules" ref="ruleForm" label-width="100px" class="demo-ruleForm">
      <el-form-item label="用户名称" prop="userName">
        <el-input v-model="ruleForm.userName"></el-input>
      </el-form-item>
      <el-form-item label="用户密码" prop="password">
        <el-input v-model="ruleForm.password"></el-input>
      </el-form-item>
      <el-form-item label="性别" prop="sex">
        <el-select v-model="ruleForm.sex" placeholder="请选择性别" style="width: 100%;">
          <el-option label="男" value="1"></el-option>
          <el-option label="女" value="2"></el-option>
        </el-select>
      </el-form-item>
      <el-form-item label="年龄" prop="age">
        <el-input v-model="ruleForm.age"></el-input>
      </el-form-item>
      <el-form-item style="text-align: right">
        <el-button type="primary" @click="submitForm('ruleForm')">保存</el-button>
        <el-button @click="onClose">取消</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

</template>
<script>
import http from '@/api/axios.js'; // 导入封装好的 http 模块
export default {

  props: {
    dialogFormVisible: Boolean,
    user: Object
  },
  data() {
    return {
      ruleForm: {
        id: '',
        userName: '',
        password: '',
        sex: '',
        age: '',
      },
      rules: {
        userName: [
          {required: true, message: '请输入用户名', trigger: 'blur'},
          {min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur'}
        ],
        password: [
          {required: true, message: '请输入密码', trigger: 'blur'},
          {min: 3, max: 5, message: '长度在 3 到 5 个字符', trigger: 'blur'}
        ],
        sex: [
          {required: true, message: '请选择性别', trigger: 'change'}
        ],
        age: [
          {required: true, message: '请输入年龄', trigger: 'blur'},
        ],
      },
      roles: [],
    };
  },
  created() {
    //查询所有角色
    this.queryAllRole();
    if (this.user.id) {
      this.ruleForm.id = this.user.id;
      this.ruleForm.userName = this.user.userName;
      this.ruleForm.password = this.user.password;
      this.ruleForm.sex = this.user.sex;
      this.ruleForm.age = this.user.age;
    } else {
      this.ruleForm = {
        id: null,
        userName: '',
        password: '',
        sex: '',
        age: '',
      }
    }
  },
  methods: {
    submitForm(formName) {
      this.$refs[formName].validate((valid) => {
        if (valid) {
          http.post('/api/user/update/', this.ruleForm).then(res => {
            this.$emit('onCloseUserDialog', false);
          }).catch(err => {
            console.error('请求失败:', err);
          });
        } else {
          console.log('error submit!!');
          return false;
        }
      });
    },
    onClose() {
      this.$emit('onCloseUserDialog', false);
    },
  }
}
</script>
<style scoped>

</style>