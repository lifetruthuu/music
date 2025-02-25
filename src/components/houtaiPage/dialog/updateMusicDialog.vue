<template>
  <el-dialog title="编辑歌单信息"
             :visible.sync="musicDialogFormVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form" label-width="100px">
      <el-form-item label="名称">
        <el-input v-model="form.name" ></el-input>
      </el-form-item>
      <el-form-item label="封面">
        <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :on-change="handleCoverChange"
            :file-list="coverFileList"
            :limit="1"
            list-type="picture-card"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </el-form-item>
      <el-form-item label="简介">
        <el-input v-model="form.content" ></el-input>
      </el-form-item>
      <el-form-item label="歌曲" prop="musicIds">
        <el-select v-model="form.musicIds" placeholder="请选择歌曲"  multiple style="text-align: left">
          <el-option
              v-for="item in songs"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
      </el-form-item>

      <el-form-item>
        <el-button type="primary" @click="submitForm">上传</el-button>
      </el-form-item>
    </el-form>
  </el-dialog>

</template>

<script>
import axios from 'axios';
import api from "@/api/axios";

export default {
  props: {
    musicDialogFormVisible: Boolean,
    music:{}
  },
  data() {
    return {
      form: {
        name: '',
        musicIds: [],
        content: '',

      },
      audioFileList: [],
      coverFileList: [],
      musicType: [],
      songs: [],
    };
  },

  created() {
    this.queryGedanSongIds();
    this.querySongs();

    this.form.id = this.music.id;
    this.form.name = this.music.name
    this.form.musicIds = [];
    this.form.content = this.music.content;
    this.form.urlPath = this.music.urlPath;

    this.coverFileList =  [{ name: '封面', url: 'http://localhost:8000'+ this.music.urlPath }];

    this.handleCoverChange({ name: '封面', url: 'http://localhost:8000'+ this.form.urlPath});


  },
  methods: {
    querySongs(){
      api.post('/api/music/list/', {
        pageNum: 1,
        pageSize: 10000,
      }).then(res => {
        this.songs = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    queryGedanSongIds(){
      api.post('/api/gedan/musicIds/', {
      id:this.music.id,
      }).then(res => {
        this.form.musicIds = [];
        res.list.forEach(item => {
          this.form.musicIds.push(item.music_id);
        });
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    onClose(){
      this.$emit("onCloseMusicDialog")
    },
    handleCoverChange(file) {
      this.form.cover = file.raw;
    },

    submitForm() {
      const formData = new FormData();
      formData.append('id', this.form.id);
      formData.append('name', this.form.name);
      formData.append('musicIds', this.form.musicIds);
      formData.append('content', this.form.content);
      formData.append('cover', this.form.cover);




      axios.post('http://localhost:8000/api/gedan/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
            this.$message.success('修改成功');
            this.$emit("onCloseMusicDialog")
          })
          .catch(error => {
            this.$message.error('修改失败');
            console.error(error);
          });
    }
  }
};
</script>
<style>

</style>