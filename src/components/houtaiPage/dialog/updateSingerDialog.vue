<template>

  <el-dialog :title="form.id? '编辑歌手信息':'新增歌手信息'"
             :visible.sync="updateSingerDialogVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form" label-width="120px"
    >
      <el-form-item label="歌手名称">
        <el-input v-model="form.name"></el-input>
      </el-form-item>
      <el-form-item label="歌手头像">
        <el-upload
            class="avatar-uploader"
            action=""
            :auto-upload="false"
            :on-change="handleCoverChange"
            :file-list="fileList"
            :limit="1"
            list-type="picture-card"
        >
          <i class="el-icon-plus"></i>
        </el-upload>
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="submitForm">保存</el-button>
      </el-form-item>
    </el-form>

  </el-dialog>

</template>

<script>
import axios from 'axios';
import api from "@/api/axios";

export default {
  props: {
    updateSingerDialogVisible: Boolean,
    music:{}
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
      fileList: [],
      musicType: [],
    };
  },

  created() {
    if(this.music.id) {
      this.form.id = this.music.id;
      this.form.name = this.music.name
    }

  },
  methods: {

    onClose() {
      this.$emit("onCloseMusicDialog")
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

      axios.post('http://localhost:8000/api/singer/update/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
            this.$message.success('音乐上传成功');
            this.$emit("onCloseMusicDialog")
          })
          .catch(error => {
            this.$message.error('音乐上传失败');
            console.error(error);
          });
    }
  }
};
</script>