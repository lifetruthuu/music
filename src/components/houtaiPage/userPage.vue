<template>
  <div class="user-page-container">
    <!-- 搜索区域 -->
    <el-card class="search-card" shadow="hover">
      <div class="header-section">
        <div class="search-box">
          <el-input
              v-model="searchKey"
              placeholder="搜索用户名/昵称/邮箱/手机号"
              clearable
              prefix-icon="el-icon-search"
              @keyup.enter.native="handleSearch"
              @clear="handleSearch"
          >
          </el-input>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="handleClick({})">新增用户</el-button>
      </div>
    </el-card>

    <!-- 表格区域 -->
    <el-card class="table-card" shadow="hover">
      <el-table
          :data="tableData"
          border
          stripe
          highlight-current-row
          v-loading="tableLoading"
          element-loading-text="加载中..."
          element-loading-spinner="el-icon-loading"
          style="width: 100%">
        <el-table-column
            prop="username"
            label="用户姓名"
            min-width="120">
        </el-table-column>
        <el-table-column
            label="密码"
            min-width="120">
          <template slot-scope="scope">
            <span>{{ scope.row.password ? '••••••••' : '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column
            prop="sex"
            label="性别"
            min-width="80">
          <template slot-scope="scope">
            <el-tag :type="scope.row.sex === '男' ? 'primary' : 'danger'" size="small">
              {{ scope.row.sex || '-' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
            prop="age"
            label="年龄"
            min-width="80">
        </el-table-column>
        <el-table-column
            prop="nickname"
            label="昵称"
            min-width="120">
        </el-table-column>
        <el-table-column
            prop="email"
            label="邮箱"
            min-width="180">
        </el-table-column>
        <el-table-column
            prop="phone"
            label="手机号"
            min-width="120">
        </el-table-column>
        <el-table-column
            prop="last_login"
            label="最后登录"
            min-width="180">
          <template slot-scope="scope">
            {{ scope.row.last_login ? formatDate(scope.row.last_login) : '-' }}
          </template>
        </el-table-column>
        <el-table-column
            label="操作"
            fixed="right"
            min-width="200">
          <template slot-scope="scope">
            <el-tooltip content="编辑用户" placement="top" :open-delay="300">
              <el-button @click="handleClick(scope.row)" type="primary" size="mini" icon="el-icon-edit" circle></el-button>
            </el-tooltip>
            <el-tooltip content="删除用户" placement="top" :open-delay="300">
              <el-button @click="confirmDelete(scope.row)" type="danger" size="mini" icon="el-icon-delete" circle></el-button>
            </el-tooltip>
            <el-tooltip content="用户画像" placement="top" :open-delay="300">
              <el-button @click="onUserHuaXiang(scope.row)" type="info" size="mini" icon="el-icon-data-analysis" circle></el-button>
            </el-tooltip>
          </template>
        </el-table-column>
      </el-table>
      
      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
            background
            @current-change="handleCurrentChange"
            :current-page.sync="page.pageNum"
            :page-size="page.pageSize"
            layout="total, prev, pager, next, jumper"
            :total="page.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 弹窗组件 -->
    <transition name="fade">
      <update-user-dialog v-if="dialogFormVisible" :dialog-form-visible="dialogFormVisible"
                          :user="user" @onCloseUserDialog="onCloseUserDialog"></update-user-dialog>
    </transition>
    
    <transition name="fade">
      <user-info v-if="userHuaXiangdialogFormVisible"
                :user-hua-xiangdialog-form-visible="userHuaXiangdialogFormVisible"
                :user-id="userId"
                @onCloseUserInFoDialog="onCloseUserInFoDialog">
      </user-info>
    </transition>
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
      tableLoading: false,
    }
  },
  created() {
    this.dialogFormVisible = false;
    this.initData();
  },
  methods: {
    handleSearch() {
      this.page.pageNum = 1; // 重置为第一页
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
    confirmDelete(row) {
      this.$confirm('确定删除该用户吗? 此操作不可恢复', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteUser(row);
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    deleteUser(row) {
      this.tableLoading = true;
      api.post('/api/user/delete/',{
        id:row.id
      }).then(res => {
        this.tableLoading = false;
        this.$message.success('删除成功');
        this.initData();
      }).catch(err => {
        this.tableLoading = false;
        this.$message.error('删除失败');
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
      this.tableLoading = true;
      const queryStr = this.searchKey || '';
      api.post('/api/user/list/', {
        queryStr,
        pageNum: this.page.pageNum,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.tableLoading = false;
        this.tableData = res.list;
        this.page.total = res.total;
      }).catch(err => {
        this.tableLoading = false;
        this.$message.error('获取用户列表失败');
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
      });
    },
    formatDate(dateString) {
      if (!dateString) return '-';
      const date = new Date(dateString);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  }
}
</script>


<style scoped>
.user-page-container {
  padding: 20px;
}

.search-card {
  margin-bottom: 20px;
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.search-box {
  width: 350px;
  transition: all 0.3s;
}

.search-box:focus-within {
  width: 400px;
}

.table-card {
  margin-bottom: 20px;
  transition: all 0.3s;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

/* 动画效果 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter, .fade-leave-to {
  opacity: 0;
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .header-section {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .search-box {
    width: 100%;
    margin-bottom: 15px;
  }
  
  .search-box:focus-within {
    width: 100%;
  }
}
</style>