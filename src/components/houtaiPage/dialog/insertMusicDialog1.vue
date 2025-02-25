<template>

  <el-dialog title="新增歌单"
             :visible.sync="insertDialogFormVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form" label-width="100px">
      <el-form-item label="歌单名称">
        <el-input v-model="form.name" ></el-input>
      </el-form-item>
      <el-form-item label="歌单封面">
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
      <el-form-item label="歌单简介">
        <el-input v-model="form.writer" ></el-input>
      </el-form-item>
      <el-form-item label="歌手">
        <el-select v-model="form.singer" placeholder="请选择歌手" >
          <el-option
              v-for="item in singers"
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
    insertDialogFormVisible: Boolean,
  },
  data() {
    return {
      form: {
        name: '',
        cover: null,
        lyricist: '',
        singer: '',
        lyrics: '',
        audio: null,
        type: ''
      },
      audioFileList: [],
      coverFileList: [],
      musicType: [],
      singers: [],
    };
  },

  created() {
    this.querySingers();
    this.form = { name: '',
      cover: null,
      lyricist: '',
      singer: '',
      lyrics: '',
      audio: null,};
  },
  methods: {
    querySingers(){
      api.post('/api/singer/list/', {}).then(res => {
        this.singers = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    onClose(){
      this.$emit("onCloseInsertMusicDialog")
    },
    handleCoverChange(file) {
      this.form.cover = file.raw;
    },
    handleAudioChange(file) {
      this.form.audio = file.raw;
    },
    submitForm() {
      const formData = new FormData();
      formData.append('name', this.form.name);
      formData.append('cover', this.form.cover);
      formData.append('writer', this.form.writer);
      formData.append('singer', this.form.singer);
      formData.append('lyrics', this.form.lyrics);
      formData.append('audio', this.form.audio);


      axios.post('http://localhost:8000/api/music/insert/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
            this.$message.success('音乐上传成功');
            this.$emit("onCloseInsertMusicDialog")
          })
          .catch(error => {
            this.$message.error('音乐上传失败');
            console.error(error);
          });
    }
  }
};
</script>
<style>

</style>