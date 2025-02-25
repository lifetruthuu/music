<template>
  <div>
    <div style="text-align: left;">
      <!--       搜索关键字-->
      <div class="search-box">
        <el-input
            v-model="searchKey"
            placeholder="请输入搜索关键字"
            clearable
            @keyup.enter.native="handleSearch"
            @clear="handleSearch"
        >
          <el-button
              slot="append"
              icon="el-icon-search"
              @click="handleSearch"
          ></el-button>
        </el-input>
      </div>
      <el-button type="primary" @click="handleClick({})">新增用户</el-button>
    </div>
    <el-table
        :data="tableData"
        border
        style="width: 100%">
      <el-table-column
          prop="username"
          label="用户姓名"
          width="200">
      </el-table-column>
      <el-table-column
          prop="password"
          label="密码"
          width="180">
      </el-table-column>
      <el-table-column
          prop="sex"
          label="性别"
          width="180">
      </el-table-column>
      <el-table-column
          prop="age"
          label="年龄"
          width="180">
      </el-table-column>
      <el-table-column
          label="操作"
          min-width="20%">
        <template slot-scope="scope">
          <el-button @click="handleClick(scope.row)" type="text" size="small">编辑</el-button>
          <el-button @click="deleteUser(scope.row)" type="text" size="small">删除</el-button>
          <el-button @click="onUserHuaXiang(scope.row)" type="text" size="small">用户画像</el-button>
        </template>
      </el-table-column>


    </el-table>

    <el-pagination
        style="text-align: right"
        layout="prev, pager, next"
        @current-change="handleCurrentChange"
        :current-page.sync="page.pageNum"
        :total="page.total">
    </el-pagination>

    <update-user-dialog v-if="dialogFormVisible" :dialog-form-visible="dialogFormVisible"
                        :user="user" @onCloseUserDialog="onCloseUserDialog"></update-user-dialog>
    <user-info v-if="userHuaXiangdialogFormVisible"
               :user-hua-xiangdialog-form-visible="userHuaXiangdialogFormVisible"
               :user-id="userId"
               @onCloseUserInFoDialog="onCloseUserInFoDialog"
                  ></user-info>
  </div>

</template>

<script>
import updateUserDialog from './dialog/updateUserInfo.vue';
import UserInfo from './dialog/userInfo.vue';
import api from '@/api/axios.js';
export default {
  components: {
    updateUserDialog,UserInfo
  },
  data() {
    return {
      tableData: [],
      dialogFormVisible: false,
      user: {},
      page: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      searchKey: '', // 搜索关键字
      userHuaXiangdialogFormVisible:false,
      userId: '',
    }
  },
  created() {
    this.dialogFormVisible =false;
    this.initData();
  },
  methods: {
    handleSearch() {
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },
    onCloseUserDialog() {
      this.dialogFormVisible = false;
      this.initData();
    },
    handleClick(row) {
      this.user = row;
      this.dialogFormVisible = true;
    },
    deleteUser(row) {
      api.post('/api/user/delete/',{
        id:row.id
      }).then(res => {
        console.log('删除成功:', res.data);
        this.initData();
      }).catch(err => {
        console.error('删除失败:', err);
      });
    },
    onUserHuaXiang(row){
      this.userId = row.id;
      this.userHuaXiangdialogFormVisible = true;
    },
    onCloseUserInFoDialog(){
      this.userHuaXiangdialogFormVisible = false;
    },
    initData() {
      const queryStr = this.searchKey || '';
      api.post('/api/user/list/', {
        queryStr,
        pageNum: this.page.pageNum,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.tableData = res.list;
        this.page.total = res.total;
      }).catch(err => {
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
      });
    }
  }
}
</script>


<style scoped>
.search-box {
  display: inline-block;
  max-width: 400px; /* 设置搜索框的最大宽度 */
  width: 100%; /* 宽度自适应 */
  margin-right: 10px;
  margin-bottom: 10px;
  text-align: left;
}


</style>