<template>
  <div class="gedan-page-container">
    <div class="page-header">
      <h2 class="page-title">歌单管理</h2>
      
      <div class="action-bar">
        <div class="search-box">
          <el-input
              v-model="searchKey"
              placeholder="搜索歌单名称..."
              prefix-icon="el-icon-search"
              clearable
              @keyup.enter.native="handleSearch"
              @clear="handleSearch"
          >
          </el-input>
        </div>
        <el-button type="primary" icon="el-icon-plus" @click="onAddMusic({})">添加歌单</el-button>
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
        class="gedan-table">
      <el-table-column
          prop="name"
          label="歌单名称"
          min-width="180">
      </el-table-column>
      
      <el-table-column
          prop="content"
          label="歌单简介"
          min-width="300"
          show-overflow-tooltip>
      </el-table-column>

      <el-table-column
          label="封面"
          width="120"
          align="center">
        <template slot-scope="scope">
          <el-image 
            :src="fullImagePath(scope.row.urlPath)" 
            alt="歌单封面" 
            fit="cover"
            class="cover-image"
            :preview-src-list="[fullImagePath(scope.row.urlPath)]">
            <div slot="error" class="image-error">
              <i class="el-icon-picture-outline"></i>
            </div>
          </el-image>
        </template>
      </el-table-column>

      <el-table-column
          label="操作"
          width="150"
          align="center">
        <template slot-scope="scope">
          <el-button 
            @click="onUpdateMusic(scope.row)" 
            type="primary" 
            size="mini" 
            icon="el-icon-edit" 
            circle
            title="编辑歌单">
          </el-button>
          <el-button 
            @click="deleteItem(scope.row)" 
            type="danger" 
            size="mini" 
            icon="el-icon-delete" 
            circle
            title="删除歌单">
          </el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 空数据状态 -->
    <div v-if="tableData.length === 0 && !loading" class="empty-state">
      <i class="el-icon-folder-opened"></i>
      <p>暂无歌单数据</p>
      <el-button type="primary" icon="el-icon-plus" size="small" @click="onAddMusic({})">添加新歌单</el-button>
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

    <!-- 弹窗组件 -->
    <update-music-dialog 
      v-if="musicDialogFormVisible"
      :music="music"
      :music-dialog-form-visible="musicDialogFormVisible"
      @onCloseMusicDialog="onCloseMusicDialog">
    </update-music-dialog>
    
    <insert-music-dialog  
      v-if="insertDialogFormVisible"
      :insert-dialog-form-visible="insertDialogFormVisible"
      @onCloseInsertMusicDialog="onCloseInsertMusicDialog">
    </insert-music-dialog>
  </div>
</template>

<script>
import api from '@/api/axios.js';
import updateMusicDialog from "@/components/houtaiPage/dialog/updateMusicDialog.vue";
import InsertMusicDialog from "@/components/houtaiPage/dialog/insertMusicDialog.vue";

export default {
  components: {
    updateMusicDialog,
    InsertMusicDialog
  },
  data() {
    return {
      tableData: [],
      musicDialogFormVisible: false,
      insertDialogFormVisible: false,
      music: {},
      page: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      searchKey: '',
      loading: false
    }
  },
  created() {
    this.dialogFormVisible = false;
    this.initData();
  },
  methods: {
    handleSearch() {
      this.page.pageNum = 1; // 重置到第一页
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },
    onAddMusic() {
      this.insertDialogFormVisible = true;
    },
    onCloseInsertMusicDialog() {
      this.insertDialogFormVisible = false;
      this.initData();
    },
    onUpdateMusic(row) {
      this.music = row;
      this.musicDialogFormVisible = true;
    },
    onCloseMusicDialog() {
      this.musicDialogFormVisible = false;
      this.initData();
    },
    fullImagePath(path) {
      if (!path) return require('@/assets/img.png'); // 默认图片
      return `http://localhost:8000${path}`;
    },
    deleteItem(row) {
      this.$confirm('确定要删除这个歌单吗?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        api.post('/api/gedan/delete/', {
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
      api.post('/api/music/gedanList/', {
        queryStr,
        pageNum: this.page.pageNum,
        pageSize: this.page.pageSize,
      }).then(res => {
        this.tableData = res.list;
        this.page.total = res.total;
        this.loading = false;
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('获取歌单列表失败');
        this.tableData = [];
        this.page.total = 0;
        this.loading = false;
      });
    }
  }
}
</script>

<style scoped>
.gedan-page-container {
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

.gedan-table {
  margin-bottom: 20px;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
}

.cover-image {
  width: 80px;
  height: 80px;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s;
}

.cover-image:hover {
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
  border-radius: 4px;
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