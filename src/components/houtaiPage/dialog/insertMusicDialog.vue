<template>

  <el-dialog title="新增歌单信息"
             :visible.sync="insertDialogFormVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form"  :rules="rules"  label-width="100px">
      <el-form-item label="歌单名称" prop="name">
        <el-input v-model="form.name"    show-word-limit></el-input>
      </el-form-item>
      <el-form-item label="歌单简介" prop="content">
        <el-input v-model="form.content"    show-word-limit></el-input>
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
        musicIds: [],
        content: '',
      },
      audioFileList: [],
      coverFileList: [],
      musicType: [],
      songs: [],
      rules: {
        name: [
          { required: true, message: '请输入歌单名称', trigger: 'blur' },
          { min: 3, max: 50, message: '长度在 3 到 50 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入歌单简介', trigger: 'blur' },
          { min: 3, max: 200, message: '长度在1 到 200 个字符', trigger: 'blur' }
        ],
        musicIds: [
          { required: true, message: '请选择歌曲', trigger: 'change' }
        ],
      }
    };
  },

  created() {
    this.querySingers();
    this.form = {
      name: '',
      musicIds: [],
      content: '',};
  },
  methods: {
    querySingers(){
      api.post('/api/music/list/', {}).then(res => {
        this.songs = res.list;
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

    submitForm() {
      const formData = new FormData();
      formData.append('name', this.form.name);
      formData.append('musicIds', this.form.musicIds);
      formData.append('content', this.form.content);
      formData.append('cover', this.form.cover);



      axios.post('http://localhost:8000/api/gedan/insert/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
            this.$message.success('新增成功');
            this.$emit("onCloseInsertMusicDialog")
          })
          .catch(error => {
            this.$message.error('新增失败');
            console.error(error);
          });
    }
  }
};
</script>
<style>

</style>