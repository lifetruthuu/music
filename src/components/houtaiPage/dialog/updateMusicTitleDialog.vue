<template>
  <el-dialog title="编辑歌单信息"
             :visible.sync="updateMusicTitleDialogVisible" :before-close="onClose">
    <el-form ref="musicForm" :model="form" label-width="100px">
      <el-form-item label="名称">
        <el-input v-model="form.name" disabled></el-input>
      </el-form-item>

      <el-form-item label="标签" prop="musicTitleIds">
        <el-select v-model="form.musicTitleIds" placeholder="请选择标签"  multiple style="text-align: left">
          <el-option
              v-for="item in titleData"
              :key="item.id"
              :label="item.name"
              :value="item.id">
          </el-option>
        </el-select>
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
    updateMusicTitleDialogVisible: Boolean,
    musicTitle:{}
  },
  data() {
    return {
      form: {
        id: '',
        name: '',
        musicTitleIds: [],
      },
      titleData: [],
    };
  },

  created() {
    this.queryTitle();
    this.querySongTitles();
    this.form.id = this.musicTitle.id;
    this.form.name = this.musicTitle.name

  },
  methods: {
    queryTitle(){
      api.post('/api/title/list/', {
      }).then(res => {
        this.titleData = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    querySongTitles(){
      api.post('/api/music/musicTitle/', {
      id:this.musicTitle.id,
      }).then(res => {
        this.form.musicTitleIds = [];
        res.list.forEach(item => {
          this.form.musicTitleIds.push(item.id);
        });
      }).catch(err => {
        console.error('请求失败:', err);
      });
    },
    onClose(){
      this.$emit("onCloseMusicTitleDialog")
    },


    submitForm() {
      axios.post('http://localhost:8000/api/music/updateMusicTitle/', this.form).then(response => {
            this.$message.success('修改成功');
            this.$emit("onCloseMusicTitleDialog")
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