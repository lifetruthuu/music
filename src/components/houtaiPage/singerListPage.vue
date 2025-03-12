<template>
  <div class="singer-page-container">
    <div class="page-header">
      <h2 class="page-title">歌手管理</h2>
      
      <div class="action-bar">
        <div class="search-box">
          <el-input
              v-model="searchKey"
              placeholder="搜索歌手名称..."
              prefix-icon="el-icon-search"
              clearable
              @keyup.enter.native="handleSearch"
              @clear="handleSearch"
          >
          </el-input>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="onAddSinger">添加歌手</el-button>
      </div>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-wrapper">
      <i class="el-icon-loading"></i>
      <span>加载中...</span>
    </div>

    <!-- 数据表格 -->
    <el-table
        v-else
        :data="tableData"
        border
        stripe
        highlight-current-row
        style="width: 100%"
        v-loading="loading"
        element-loading-text="加载中..."
        empty-text="暂无数据"
        class="singer-table">
      <el-table-column
          prop="name"
          label="歌手"
          min-width="120">
      </el-table-column>
      
      <el-table-column
          prop="englishName"
          label="英文名"
          min-width="80">
      </el-table-column>

      <el-table-column
          label="头像"
          width="120"
          align="center">
        <template slot-scope="scope">
          <el-image  
            :src="imagePath(scope.row)" 
            alt="歌手头像" 
            fit="cover"
            class="avatar-image"
            :preview-src-list="[imagePath(scope.row)]">
            <div slot="error" class="image-error">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </template>
      </el-table-column>
      
      <el-table-column
          prop="gender"
          label="性别"
          width="60"
          align="center">
        <template slot-scope="scope">
          <el-tag size="mini" :type="scope.row.gender === 1 ? 'primary' : 'danger'">
            {{ scope.row.gender === 1 ? '男' : '女' }}
          </el-tag>
        </template>
      </el-table-column>
      
      <el-table-column
          prop="region"
          label="地区"
          min-width="100">
      </el-table-column>
      
      <el-table-column
          prop="musicStyle"
          label="音乐风格"
          min-width="120">
      </el-table-column>
      
      <el-table-column
          prop="introduction"
          label="简介"
          min-width="200"
          show-overflow-tooltip>
      </el-table-column>

      <el-table-column
          label="操作"
          width="150"
          align="center"
          fixed="right">
        <template slot-scope="scope">
          <el-button 
            @click="onUpdateSinger(scope.row)" 
            type="primary" 
            size="mini" 
            icon="el-icon-edit" 
            circle
            title="编辑歌手">
          </el-button>
          <el-button 
            @click="deleteItem(scope.row)" 
            type="danger" 
            size="mini" 
            icon="el-icon-delete" 
            circle
            title="删除歌手">
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空数据状态 -->
    <div v-if="tableData.length === 0 && !loading" class="empty-state">
      <i class="el-icon-user"></i>
      <p>暂无歌手数据</p>
      <el-button type="primary" icon="el-icon-plus" size="small" @click="onAddSinger">添加新歌手</el-button>
    </div>

    <!-- 分页 -->
    <div class="pagination-wrapper">
      <el-pagination
          background
          layout="total, prev, pager, next, jumper"
          @current-change="handleCurrentChange"
          :current-page.sync="page.pageNum"
          :page-size="page.pageSize"
          :total="page.total">
      </el-pagination>
    </div>

   <update-singer-dialog 
      v-if="updateSingerDialogVisible"
      :singer="singer"
      :update-singer-dialog-visible="updateSingerDialogVisible"
      @onCloseMusicDialog="onCloseSingerDialog">
   </update-singer-dialog>
   
   <insert-singer-dialog  
      v-if="insertSingerDialogVisible"
      :insert-singer-dialog-visible="insertSingerDialogVisible"
      @onCloseInsertSingerDialog="onCloseInsertSingerDialog">
   </insert-singer-dialog>
  </div>
</template>

<script>
import api from '@/api/axios.js';
import updateSingerDialog from "@/components/houtaiPage/dialog/updateSingerDialog.vue";
import insertSingerDialog from "@/components/houtaiPage/dialog/insertSingerDialog.vue";

export default {
  components: {
    updateSingerDialog,
    insertSingerDialog
  },
  data() {
    return {
      tableData: [],
      updateSingerDialogVisible: false,
      insertSingerDialogVisible: false,
      singer: {},
      page: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      searchKey: '', // 搜索关键字
      loading: false
    }
  },
  created() {
    this.initData();
  },
  methods: {
    imagePath(singer) {
      if (!singer.urlPath) return require('@/assets/img_1.png');
      return singer.urlPath.startsWith('http') ? singer.urlPath : `http://localhost:8000${singer.urlPath}`;
    },
    handleSearch() {
      this.page.pageNum = 1; // 重置到第一页
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },
    onCloseSingerDialog() {
      this.updateSingerDialogVisible = false;
      this.initData();
    },
    onCloseInsertSingerDialog() {
      this.insertSingerDialogVisible = false;
      this.initData();
    },
    onAddSinger() {
      this.insertSingerDialogVisible = true;
    },
    onUpdateSinger(row) {
      this.singer = row;
      this.updateSingerDialogVisible = true;
    },
    deleteItem(row) {
      this.$confirm('确定要删除该歌手吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        api.post('/api/singer/delete/',{
          id: row.id
        }).then(res => {
          this.$message.success('删除成功');
          this.initData();
        }).catch(err => {
          this.$message.error('删除失败: ' + (err.message || '未知错误'));
          console.error('删除失败:', err);
        });
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });
      });
    },
    initData() {
      this.loading = true;
      const queryStr = this.searchKey || '';
      api.post('/api/singer/list/', {
        queryStr,
        pageNum: this.page.pageNum,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.tableData = res.list;
        this.page.total = res.total;
        this.loading = false;
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('获取歌手列表失败');
        this.tableData = [];
        this.page.total = 0;
        this.loading = false;
      });
    }
  }
}
</script>

<style scoped>
.singer-page-container {
  padding: 20px;
  background-color: #f5f7fa;
  border-radius: 8px;
  min-height: calc(100vh - 120px);
  display: flex;
  flex-direction: column;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.page-title {
  margin: 0;
  font-size: 22px;
  color: #303133;
  position: relative;
  padding-left: 12px;
}

.page-title::before {
  content: '';
  position: absolute;
  left: 0;
  top: 10%;
  height: 80%;
  width: 4px;
  background-color: #409EFF;
  border-radius: 2px;
}

.action-bar {
  display: flex;
  align-items: center;
  margin-top: 10px;
}

.search-box {
  max-width: 300px;
  margin-right: 15px;
}

.singer-table {
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.avatar-image {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
  object-fit: cover;
}

.avatar-image:hover {
  transform: scale(1.05);
}

.image-error {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 80px;
  height: 80px;
  background-color: #f5f7fa;
  color: #909399;
  font-size: 24px;
  border-radius: 50%;
}

.empty-state {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  padding: 40px;
  color: #909399;
}

.empty-state i {
  font-size: 60px;
  margin-bottom: 20px;
}

.empty-state p {
  margin-bottom: 20px;
}

.loading-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 300px;
  color: #909399;
}

.loading-wrapper i {
  margin-right: 10px;
  font-size: 24px;
}

.pagination-wrapper {
  display: flex;
  justify-content: flex-end;
  margin-top: 20px;
}

@media screen and (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: flex-start;
  }
  
  .action-bar {
    width: 100%;
    margin-top: 15px;
  }
  
  .search-box {
    max-width: none;
    width: 100%;
    margin-right: 0;
    margin-bottom: 10px;
  }
}
</style>