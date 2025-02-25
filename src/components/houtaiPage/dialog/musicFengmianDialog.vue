<template>

  <el-dialog title="编辑封面"
             :visible.sync="musicFengmianDialogVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form" label-width="100px">

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
    musicFengmianDialogVisible: Boolean,
    musicId:String,
    musicPath:String,
  },
  data() {
    return {
      form: {
        cover: null,
      },
      coverFileList: [],
    };
  },

  created() {
    this.form = {
      cover: null,
    };
    this.coverFileList =  [{ name: '封面', url: 'http://localhost:8000'+ this.musicPath }];
    this.handleCoverChange({ name: '封面', url: 'http://localhost:8000'+ this.musicPath});
  },
  methods: {

    onClose(){
      this.$emit("onCloseMusicFengMian")
    },
    handleCoverChange(file) {
      let fileArray = file.target.files; // 获取上传的文件列表
      if (fileArray.length > 1) {
        // 如果上传的文件数量大于1
        this.$message.warning("只能上传一张图片！")
      } else {
        this.form.cover = file.raw; // 保存文件
      }

    },




    submitForm() {
      if (!this.form.cover) {
        this.$message.warning("请上传封面图片！")
        return; // 阻止提交
      }
      const formData = new FormData();
      formData.append('musicId', this.musicId);
      formData.append('cover', this.form.cover);
      axios.post('http://localhost:8000/api/music/shangchuanfengmian/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }}).then(response => {
            this.$message.success('音乐上传成功');
            this.$emit("onCloseMusicFengMian")
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