<template>
  <div class="music-list-container">
    <div class="page-header">
      <div class="search-box">
        <el-input
            v-model="searchKey"
            placeholder="请输入歌曲名称搜索"
            clearable
            prefix-icon="el-icon-search"
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
      <el-button type="primary" @click="showInsertDialog" icon="el-icon-plus">添加歌曲</el-button>
    </div>
    
    <el-card shadow="hover" class="table-card">
      <el-table
          :data="tableData"
          border
          style="width: 100%"
          v-loading="loading"
          element-loading-text="正在加载数据..."
          element-loading-spinner="el-icon-loading"
          element-loading-background="rgba(255, 255, 255, 0.8)"
          :header-cell-style="{background:'#f5f7fa', color:'#606266'}"
          :row-class-name="tableRowClassName">
        <el-table-column
            prop="name"
            label="歌曲名称"
            width="200">
        </el-table-column>
        <el-table-column
            prop="singerNames"
            label="歌手"
            width="180">
        </el-table-column>
        <el-table-column
            label="封面"
            width="180"
            align="center">
          <template slot-scope="scope">
            <div class="image-container">
              <img v-if="scope.row.musicPath" :src="fullImagePath(scope.row.musicPath)" alt="音乐封面" class="music-cover"/>
              <div v-else class="no-cover">暂无封面</div>
            </div>
          </template>
        </el-table-column>
        <el-table-column
            label="音频"
            align="center">
          <template slot-scope="scope">
            <audio :key="scope.row.audioPath" controls class="audio-player">
              <source :src="getFullAudioPath(scope.row.audioPath)" type="audio/ogg">
              您的浏览器不支持音频播放
            </audio>
          </template>
        </el-table-column>
        <el-table-column
            label="操作"
            width="200"
            align="center">
          <template slot-scope="scope">
            <el-button @click="onUpdateMusic(scope.row)" type="primary" size="mini" icon="el-icon-edit">编辑</el-button>
            <el-button @click="addTitle(scope.row)" type="success" size="mini" icon="el-icon-price-tag">标签</el-button>
            <el-button @click="confirmDelete(scope.row)" type="danger" size="mini" icon="el-icon-delete">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container">
        <el-pagination
            @size-change="handleSizeChange"
            @current-change="handleCurrentChange"
            :current-page.sync="page.pageNum"
            :page-sizes="[5, 10, 20, 50]"
            :page-size="page.pageSize"
            layout="total, sizes, prev, pager, next, jumper"
            :total="page.total">
        </el-pagination>
      </div>
    </el-card>

    <!-- 修改弹窗 -->
    <update-music-manage v-if="musicDialogFormVisible"
                        :music="music"
                        :music-dialog-form-visible="musicDialogFormVisible"
                        @onCloseMusicDialog="onCloseMusicDialog"> </update-music-manage>
    
    <!-- 新增弹窗 -->                      
    <insert-music-manage  v-if="insertDialogFormVisible"
                          :insert-dialog-form-visible="insertDialogFormVisible"
                          @onCloseInsertMusicDialog="onCloseInsertMusicDialog"> </insert-music-manage>
    
    <!-- 标签弹窗 -->                          
    <update-music-title-dialog v-if="updateMusicTitleDialogVisible"
      :update-music-title-dialog-visible="updateMusicTitleDialogVisible"
      :music-title="musicTitle"
      @onCloseMusicTitleDialog="onCloseMusicTitleDialog"></update-music-title-dialog>

  </div>
</template>

<script>
import api from '@/api/axios.js';
import updateMusicManage from "@/components/houtaiPage/dialog/updateMusicManage.vue";
import insertMusicManage from "@/components/houtaiPage/dialog/insertMusicManage.vue";
import updateMusicTitleDialog  from "@/components/houtaiPage/dialog/updateMusicTitleDialog.vue";
export default {
  components: {
    updateMusicManage,insertMusicManage,updateMusicTitleDialog,
  },
  data() {
    return {
      tableData: [],
      musicDialogFormVisible: false,
      insertDialogFormVisible: false,
      updateMusicTitleDialogVisible: false,
      music: {},
      musicTitle: {},
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
    this.dialogFormVisible = false;
    this.initData();
  },
  methods: {
    tableRowClassName({row, rowIndex}) {
      return rowIndex % 2 === 0 ? 'even-row' : 'odd-row';
    },
    showInsertDialog() {
      this.insertDialogFormVisible = true;
    },
    handleSearch() {
      this.page.pageNum = 1; // 搜索时重置为第一页
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },
    handleSizeChange(val) {
      this.page.pageSize = val;
      this.page.pageNum = 1; // 修改每页显示条数后重置为第一页
      this.initData();
    },
    onCloseInsertMusicDialog(){
      this.insertDialogFormVisible = false;
      this.initData();
    },
    onUpdateMusic(row){
      this.music = JSON.parse(JSON.stringify(row)); // 深拷贝，避免直接修改表格数据
      this.musicDialogFormVisible = true;
    },
    onCloseMusicDialog() {
      this.musicDialogFormVisible = false;
      this.initData();
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return path ? `http://localhost:8000${path}` : '';
    },
    getFullAudioPath(path) {
      // 拼接完整的音频文件 URL
      return path ? `http://localhost:8000${path}` : '';
    },
    confirmDelete(row) {
      this.$confirm('确认删除该歌曲?', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteItem(row);
      }).catch(() => {
        this.$message({
          type: 'info',
          message: '已取消删除'
        });          
      });
    },
    deleteItem(row) {
      this.loading = true;
      api.post('/api/music/delete/',{
        id: row.id
      }).then(res => {
        this.$message.success('删除成功');
        this.initData();
      }).catch(err => {
        this.$message.error('删除失败: ' + err.message);
        console.error('删除失败:', err);
      }).finally(() => {
        this.loading = false;
      });
    },
    addTitle(item){
      this.musicTitle = JSON.parse(JSON.stringify(item));
      this.updateMusicTitleDialogVisible = true;
    },
    onCloseMusicTitleDialog(){
      this.updateMusicTitleDialogVisible = false;
      this.initData(); // 关闭后刷新
    },
    initData() {
      this.loading = true;
      const queryStr = this.searchKey || '';
      api.get('/api/music/all/', {
        params: {
          queryStr,
          pageNum: this.page.pageNum,
          pageSize: this.page.pageSize,
        }
      }).then(res => {
        if (res && res.list) {
          this.tableData = res.list;
          this.page.total = res.total;
        } else {
          this.$message.warning('返回的数据格式不正确');
          this.tableData = [];
          this.page.total = 0;
        }
      }).catch(err => {
        this.$message.error('获取数据失败: ' + err.message);
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
      }).finally(() => {
        this.loading = false;
      });
    }
  }
}
</script>

<style scoped>
.music-list-container {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.search-box {
  display: inline-block;
  width: 300px;
  margin-right: 10px;
  text-align: left;
}

.table-card {
  margin-bottom: 20px;
  border-radius: 8px;
}

.pagination-container {
  margin-top: 20px;
  text-align: right;
}

.image-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.music-cover {
  max-height: 90px;
  max-width: 90px;
  border-radius: 6px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  object-fit: cover;
}

.no-cover {
  width: 90px;
  height: 90px;
  background-color: #f5f7fa;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #909399;
  border-radius: 6px;
}

.audio-player {
  width: 250px;
}

/* 表格行样式 */
::v-deep .even-row {
  background-color: #fafafa;
}

::v-deep .odd-row {
  background-color: #ffffff;
}

::v-deep .el-table td, ::v-deep .el-table th {
  padding: 12px 0;
}
</style>