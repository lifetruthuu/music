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
<!--      <el-button type="primary" @click="onAddMusic({})">新增</el-button>-->
    </div>
    <el-table
        :data="tableData"
        border
        style="width: 100%">
      <el-table-column
          prop="name"
          label="歌手"
          width="380">
      </el-table-column>

      <el-table-column
          label="头像"
          width="380">
        <template slot-scope="scope">
          <img  :src="imagePath(scope.row)" alt="音乐封面" style="max-height: 100px; width: auto;text-align: center"/>
        </template>
      </el-table-column>

      <el-table-column
          label="操作"
          min-width="10%">
        <template slot-scope="scope">
<!--          <el-button @click="onAddMusic(scope.row)" type="text" size="small">编辑</el-button>-->
          <el-button @click="deleteItem(scope.row)" type="text" size="small">删除</el-button>
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

   <update-singer-dialog v-if="updateSingerDialogVisible"
                        :singer="singer"
                        :update-singer-dialog-visible="updateSingerDialogVisible"
                        @onCloseMusicDialog="onCloseMusicDialog"> </update-singer-dialog>
  </div>

</template>

<script>
import api from '@/api/axios.js';
import updateSingerDialog from "@/components/houtaiPage/dialog/updateSingerDialog.vue";
export default {
  components: {
    updateSingerDialog,
  },
  data() {
    return {
      tableData: [],
      updateSingerDialogVisible: false,
      singer: {},
      page: {
        pageNum: 1,
        pageSize: 10,
        total: 0,
      },
      searchKey: '', // 搜索关键字
    }
  },
  created() {
    this.dialogFormVisible =false;
    this.initData();
  },
  methods: {
    imagePath(artist) {
      return artist.urlPath ? this.fullImagePath(artist.urlPath) :  require('@/assets/img_1.png');
      // return this.fullImagePath(item.musicPath)
    },
    handleSearch() {
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },
    onCloseMusicDialog() {
      this.updateSingerDialogVisible = false;
      this.initData();
    },
    onAddMusic(row) {
      this.singer = row;
      this.updateSingerDialogVisible = true;
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    deleteItem(row) {
      api.post('/api/singer/delete/',{
        id:row.id
      }).then(res => {
        console.log('删除成功:', res.data);
        this.initData();
      }).catch(err => {
        console.error('删除失败:', err);
      });
    },
    initData() {
      const queryStr = this.searchKey || '';
      api.post('/api/singer/list/', {
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