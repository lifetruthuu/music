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
      <el-button type="primary" @click="onAddMusic({})">获取歌曲数据</el-button>
      <el-button type="primary" @click="onAddGeci({})">获取歌词数据</el-button>
    </div>
    <el-table
        :data="tableData"
        border
        style="width: 100%">
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
          width="280">
        <template slot-scope="scope">
          <img v-if="scope.row.musicPath" :src="fullImagePath( scope.row.musicPath)" alt="音乐封面" style="max-height: 100px; width: auto;text-align: center"/>
        </template>
      </el-table-column>
      <el-table-column
          label="音频"
          width="350">
        <template slot-scope="scope">
          <audio :key="scope.row.audioPath" controls>
            <source :src="getFullAudioPath(scope.row.audioPath)" type="audio/ogg">
          </audio>
        </template>
      </el-table-column>
      <el-table-column
          label="操作"
          min-width="10%">
        <template slot-scope="scope">
<!--          <el-button @click="onUpdateMusic(scope.row)" type="text" size="small">编辑</el-button>-->
          <el-button @click="deleteItem(scope.row)" type="text" size="small">删除</el-button>
          <el-button @click="addTitle(scope.row)" type="text" size="small">添加标签</el-button>
          <el-button @click="getMusicFengmian(scope.row)" type="text" size="small">上传封面</el-button>
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
   <update-music-title-dialog v-if="updateMusicTitleDialogVisible"
   :update-music-title-dialog-visible="updateMusicTitleDialogVisible"
                              :music-title="musicTitle"
    @onCloseMusicTitleDialog="onCloseMusicTitleDialog"></update-music-title-dialog>
    <music-fengmian-dialog v-if="musicFengmianDialogVisible" :music-fengmian-dialog-visible="musicFengmianDialogVisible"
                          :music-id="musicId"  :music-path="musicPath"
                           @onCloseMusicFengMian="onCloseMusicFengMian"> </music-fengmian-dialog>

  </div>

</template>

<script>
import api from '@/api/axios.js';
import updateMusicDialog from "@/components/houtaiPage/dialog/updateMusicDialog.vue";
import InsertMusicDialog from "@/components/houtaiPage/dialog/insertMusicDialog.vue";
import UpdateMusicTitleDialog  from "@/components/houtaiPage/dialog/updateMusicTitleDialog.vue";
import MusicFengmianDialog  from "@/components/houtaiPage/dialog/musicFengmianDialog.vue";
import axios from "axios";
export default {
  components: {
    updateMusicDialog,InsertMusicDialog,UpdateMusicTitleDialog,MusicFengmianDialog,
  },
  data() {
    return {
      tableData: [],
      musicDialogFormVisible: false,
      insertDialogFormVisible: false,
      updateMusicTitleDialogVisible: false,
      musicFengmianDialogVisible: false,
      music: {},
      musicTitle: {},
      page: {
        pageNum: 1,
        pageSize: 8,
        total: 0,
      },
      searchKey: '', // 搜索关键字
      musicId: '',
      musicPath: ''
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

      axios.post('http://localhost:8000/api/music/create/', {}, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
        // this.$message.success('音乐上传成功');
        // this.$emit("onCloseInsertMusicDialog")
      })
          .catch(error => {
            this.$message.error('音乐上传失败');
            console.error(error);
          });

      // this.insertDialogFormVisible = true;
    },
    onAddGeci(){
      api.post('/api/music/getGeci/', {}).then(res => {

      }).catch(err => {
        console.error('请求失败:', err);

      });
    },

    onCloseMusicFengMian(){
      this.musicFengmianDialogVisible = false;
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
    getFullAudioPath(path) {
      // 拼接完整的音频文件 URL
      return `http://localhost:8000${path}`;
    },
    deleteItem(row) {
      api.post('/api/music/delete/',{
        id:row.id
      }).then(res => {
        console.log('删除成功:', res.data);
        this.initData();
      }).catch(err => {
        console.error('删除失败:', err);
      });
    },

    addTitle(item){
      this.musicTitle = item;
      this.updateMusicTitleDialogVisible = true;
    },
    onCloseMusicTitleDialog(){
      this.updateMusicTitleDialogVisible = false;
    },

    getMusicFengmian(row){
      this.musicId = row.id;
      this.musicPath = row.musicPath;
      this.musicFengmianDialogVisible = true;
    },
    getFengmian(row){
      api.post('/api/music/get_url/', {
       mid:row.id
      }).then(res => {

      }).catch(err => {
        console.error('请求失败:', err);

      });
    },
    initData() {
      const queryStr = this.searchKey || '';
      api.post('/api/music/list/', {
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