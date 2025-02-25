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
      <el-button type="primary" @click="onAddMusic({})">添加歌单</el-button>
    </div>
    <el-table
        :data="tableData"
        border
        style="width: 100%">
      <el-table-column
          prop="name"
          label="歌单名称"
          width="300">
      </el-table-column>
      <el-table-column
          prop="content"
          label="歌单简介"
          width="580">
      </el-table-column>

      <el-table-column
          label="封面"
          width="180">
        <template slot-scope="scope">
          <img :src="fullImagePath( scope.row.urlPath)" alt="音乐封面" style="max-height: 100px; width: auto;text-align: center"/>
        </template>
      </el-table-column>

      <el-table-column
          label="操作"
          min-width="10%">
        <template slot-scope="scope">
                    <el-button @click="onUpdateMusic(scope.row)" type="text" size="small">编辑</el-button>
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

    <update-music-dialog v-if="musicDialogFormVisible"
                         :music="music"
                         :music-dialog-form-visible="musicDialogFormVisible"
                         @onCloseMusicDialog="onCloseMusicDialog"> </update-music-dialog>
    <insert-music-dialog  v-if="insertDialogFormVisible"
                          :insert-dialog-form-visible="insertDialogFormVisible"
                          @onCloseInsertMusicDialog="onCloseInsertMusicDialog"> </insert-music-dialog>
  </div>

</template>

<script>
import api from '@/api/axios.js';
import updateMusicDialog from "@/components/houtaiPage/dialog/updateMusicDialog.vue";
import InsertMusicDialog from "@/components/houtaiPage/dialog/insertMusicDialog.vue";
import axios from "axios";
export default {
  components: {
    updateMusicDialog,InsertMusicDialog
  },
  data() {
    return {
      tableData: [],
      musicDialogFormVisible: false,
      insertDialogFormVisible: false,
      music: {},
      page: {
        pageNum: 1,
        pageSize: 8,
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
    handleSearch() {
      this.initData();
    },
    handleCurrentChange(val) {
      this.page.pageNum = val;
      this.initData();
    },

    onAddMusic() {
      this.insertDialogFormVisible = true;
    },
    onCloseInsertMusicDialog(){
      this.insertDialogFormVisible = false;
      this.initData();
    },


    onUpdateMusic(row){
      this.music = row;
      this.musicDialogFormVisible = true;
    },
    onCloseMusicDialog() {
      this.musicDialogFormVisible = false;
      this.initData();
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },

    deleteItem(row) {
      api.post('/api/gedan/delete/',{
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
      api.post('/api/music/gedanList/', {
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