<template>
  <el-dialog 
    title="编辑歌单信息"
    :visible.sync="musicDialogFormVisible" 
    :before-close="onClose"
    width="600px"
    center
    class="music-dialog">
    <div class="dialog-body">
      <el-form 
        ref="musicForm" 
        :model="form" 
        :rules="rules"
        label-width="80px"
        status-icon>
        <el-form-item label="名称" prop="name">
          <el-input 
            v-model="form.name" 
            placeholder="请输入歌单名称" 
            maxlength="50" 
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="简介" prop="content">
          <el-input 
            v-model="form.content" 
            type="textarea"
            :rows="5"
            placeholder="请输入歌单简介"
            maxlength="200"
            show-word-limit>
          </el-input>
        </el-form-item>
        
        <el-form-item label="封面" prop="cover">
          <div class="cover-uploader-container">
            <!-- 封面预览区域 -->
            <div class="cover-preview-area">
              <img 
                :src="coverPreview || form.cover_url || require('@/assets/img.png')" 
                alt="封面预览" 
                class="cover-image" />
              <div class="cover-title">封面预览</div>
            </div>
            
            <!-- 上传控件区域 -->
            <div class="upload-control-area">
              <el-upload
                class="cover-uploader"
                action="#"
                :http-request="uploadCover"
                :show-file-list="false"
                :before-upload="beforeCoverUpload"
                accept="image/jpeg,image/png,image/jpg,image/gif">
                <el-button type="primary" size="small" icon="el-icon-picture">
                  {{ form.cover_url ? '更换封面' : '上传封面' }}
                </el-button>
                <div slot="tip" class="el-upload__tip">支持JPG、PNG格式，大小不超过2MB</div>
              </el-upload>
            </div>
          </div>
        </el-form-item>
        
        <el-form-item label="歌曲" prop="musicIds">
          <div class="song-selector-container">
            <!-- 搜索和选择区域 -->
            <div class="song-search-area">
              <el-select 
                v-model="form.musicIds" 
                placeholder="选择要添加的歌曲" 
                multiple 
                filterable
                collapse-tags
                style="width: 100%; margin-top: 10px;">
                <el-option
                  v-for="item in filteredSongs"
                  :key="item.id"
                  :label="item.name"
                  :value="item.id">
                  <span style="float: left">{{ item.name }}</span>
                  <span style="float: right; color: #8492a6; font-size: 13px">{{ item.singerName || '未知歌手' }}</span>
                </el-option>
              </el-select>
              
              <div class="selected-count" v-if="form.musicIds.length > 0">
                已选择 {{ form.musicIds.length }} 首歌曲
              </div>
            </div>
            
            <!-- 已选歌曲展示区域 -->
            <div class="selected-songs-area">
              <div class="area-header">
                <h4>已添加歌曲列表</h4>
                <el-button 
                  type="text" 
                  size="mini" 
                  @click="selectedSongsVisible = !selectedSongsVisible">
                  {{ selectedSongsVisible ? '收起' : '展开' }}
                </el-button>
              </div>
              
              <transition name="fade">
                <div v-show="selectedSongsVisible" class="songs-table-wrapper">
                  <el-table
                    v-if="selectedSongsPreview.length > 0"
                    :data="selectedSongsPreview"
                    border
                    size="mini"
                    max-height="200"
                    style="width: 100%">
                    <el-table-column 
                      type="index" 
                      label="#" 
                      width="50" 
                      align="center">
                    </el-table-column>
                    <el-table-column 
                      prop="name" 
                      label="歌曲名称">
                    </el-table-column>
                    <el-table-column 
                      prop="singer" 
                      label="歌手" 
                      width="120">
                    </el-table-column>
                    <el-table-column
                      label="操作"
                      width="60"
                      align="center">
                      <template slot-scope="scope">
                        <el-button
                          @click="removeSong(scope.row.id)"
                          type="danger"
                          icon="el-icon-delete"
                          circle
                          size="mini">
                        </el-button>
                      </template>
                    </el-table-column>
                  </el-table>
                  
                  <div v-else class="empty-songs-tip">
                    <i class="el-icon-warning-outline"></i>
                    <p>暂无已选歌曲，请从上方添加</p>
                  </div>
                </div>
              </transition>
            </div>
          </div>
        </el-form-item>
      </el-form>
    </div>
    
    <div slot="footer" class="dialog-footer">
      <el-button @click="onClose">取消</el-button>
      <el-button type="primary" @click="submitForm" :loading="submitting">保存</el-button>
    </div>
  </el-dialog>
</template>

<script>
import axios from 'axios';
import api from "@/api/axios";

export default {
  props: {
    musicDialogFormVisible: Boolean,
    music: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      form: {
        id: '',
        name: '',
        musicIds: [],
        content: '',
        urlPath: '',
        cover: null,
        cover_url: ''
      },
      rules: {
        name: [
          { required: true, message: '请输入歌单名称', trigger: 'blur' },
          { min: 2, max: 50, message: '长度在 2 到 50 个字符', trigger: 'blur' }
        ],
        content: [
          { required: true, message: '请输入歌单简介', trigger: 'blur' },
          { max: 200, message: '简介不超过 200 个字符', trigger: 'blur' }
        ],
        musicIds: [
          { type: 'array', required: true, message: '请选择至少一首歌曲', trigger: 'change' }
        ]
      },
      coverPreview: null,
      songs: [],
      submitting: false,
      showSelectedSongs: false,
      selectedSongsPreview: [],
      songSearchKeyword: '',
      filteredSongs: [],
      selectedSongsVisible: false,
      coverFile: null
    };
  },
  created() {
    this.initializeForm();
    this.queryGedanSongIds();
    this.querySongs();
  },
  watch: {
    'form.musicIds': {
      handler() {
        this.updateSelectedSongsPreview();
      },
      deep: true
    }
  },
  methods: {
    initializeForm() {
      if (this.music && this.music.id) {
        this.form = {
          id: this.music.id,
          name: this.music.name,
          content: this.music.content,
          cover: null,
          cover_url: this.fullImagePath(this.music.urlPath),
          urlPath: this.music.urlPath,
          musicIds: this.music.musicIds || []
        };
        
        // 重置预览和文件
        this.coverPreview = null;
        this.coverFile = null;
        
        // 更新已选歌曲预览
        this.updateSelectedSongsPreview();
      }
    },
    querySongs() {
      this.loading = true;
      api.get('/api/gedan/musicSelect/', {}).then(res => {
        this.songs = res.list;
        this.filteredSongs = [...this.songs]; // 初始化过滤后的歌曲列表
        this.loading = false;
        
        // 如果已经加载了musicIds，更新selectedSongsPreview
        if (this.form.musicIds.length > 0) {
          this.updateSelectedSongsPreview();
        }
      }).catch(err => {
        console.error('获取歌曲列表失败:', err);
        this.$message.error('获取歌曲列表失败');
        this.loading = false;
      });
    },
    queryGedanSongIds() {
      api.post('/api/gedan/musicIds/', {
        id: this.music.id,
      }).then(res => {
        this.form.musicIds = [];
        res.list.forEach(item => {
          this.form.musicIds.push(item.music_id);
        });
        
        // 显示成功加载的信息
        if (res.list && res.list.length > 0) {
          this.$message.success(`已加载${res.list.length}首歌曲`);
          
          // 更新已选歌曲预览
          this.updateSelectedSongsPreview();
        }
      }).catch(err => {
        console.error('获取歌单歌曲失败:', err);
        this.$message.error('获取歌单歌曲失败');
      });
    },
    updateSelectedSongsPreview() {
      // 根据选择的musicIds过滤歌曲列表生成预览数据
      if (this.songs && this.songs.length > 0) {
        this.selectedSongsPreview = this.songs
          .filter(song => this.form.musicIds.includes(song.id))
          .map(song => ({
            id: song.id,
            name: song.name,
            singer: song.singerName || '未知歌手'
          }));
      }
    },
    onClose() {
      this.$emit("onCloseMusicDialog");
    },
    fullImagePath(path) {
      if (!path) return '';
      return path.startsWith('http') ? path : `http://localhost:8000${path}`;
    },
    beforeCoverUpload(file) {
      const isJPG = file.type === 'image/jpeg' || file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG) {
        this.$message.error('上传封面图片只能是 JPG 或 PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('上传封面图片大小不能超过 2MB!');
        return false;
      }

      // 保存文件对象到专门的变量
      this.coverFile = file;
      
      // 生成预览URL
      const reader = new FileReader();
      reader.onload = (e) => {
        this.coverPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      
      // 阻止自动上传
      return false;
    },
    uploadCover() {
      // 这里不执行实际上传，保存表单时一起处理
      return false;
    },
    submitForm() {
      this.$refs.musicForm.validate((valid) => {
        if (valid) {
          this.submitting = true;
          
          const formData = new FormData();
          formData.append('id', this.form.id);
          formData.append('name', this.form.name);
          formData.append('content', this.form.content || '');
          
          // 使用专门的变量添加封面文件
          if (this.coverFile) {
            console.log('封面文件信息:', {
              name: this.coverFile.name,
              type: this.coverFile.type,
              size: this.coverFile.size,
              lastModified: new Date(this.coverFile.lastModified).toISOString()
            });
            
            formData.append('cover', this.coverFile);
          } else if (this.form.urlPath) {
            // 如果没有新上传的封面但有原始封面路径，则提交原始路径
            console.log('使用原有封面路径:', this.form.urlPath);
            formData.append('urlPath', this.form.urlPath);
          }
          
          // 处理歌曲ID数组
          if (this.form.musicIds && this.form.musicIds.length > 0) {
            formData.append('musicIds', this.form.musicIds.join(','));
          } else {
            formData.append('musicIds', '');
          }
          
          // 检查formData内容 - 移到这里确保可以看到所有添加的内容
          console.log('FormData内容：');
          for (let [key, value] of formData.entries()) {
            console.log(key, ':', value instanceof File ? `${value.name} (${value.size} bytes)` : value);
          }
          
          // 使用封装的api模块发送请求，与updateUserInfo一致
          api.post('/api/gedan/update/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(res => {
            this.$message.success('歌单修改成功');
            this.submitting = false;
            this.$emit("onCloseMusicDialog");
          }).catch(err => {
            this.submitting = false;
            this.$message.error('修改失败: ' + (err.message || '未知错误'));
            console.error('修改失败:', err);
          });
        } else {
          this.$message.warning('请完善表单信息');
          return false;
        }
      });
    },
    removeSong(id) {
      this.form.musicIds = this.form.musicIds.filter(item => item !== id);
      this.selectedSongsPreview = this.songs.filter(item => this.form.musicIds.includes(item.id));
    },
    filterSongs() {
      this.filteredSongs = this.songs.filter(song => song.name.toLowerCase().includes(this.songSearchKeyword.toLowerCase()));
    },
    resetForm() {
      this.$refs.musicForm.resetFields();
      this.form = {
        id: '',
        name: '',
        content: '',
        cover: null,
        cover_url: '',
        urlPath: '',
        musicIds: []
      };
      this.selectedSongsPreview = [];
      this.songSearchKeyword = '';
      this.filteredSongs = [];
      this.selectedSongsVisible = false;
      this.coverFile = null;
      this.coverPreview = null;
    }
  }
};
</script>

<style>
.music-dialog .el-dialog__body {
  padding: 20px 30px;
}

.dialog-body {
  max-height: 60vh;
  overflow-y: auto;
}

.cover-uploader-container {
  display: flex;
  align-items: flex-start;
}

.cover-preview-area {
  width: 150px;
  height: 180px;
  margin-right: 20px;
  display: flex;
  flex-direction: column;
  border-radius: 4px;
  overflow: hidden;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

.cover-image {
  width: 100%;
  height: 150px;
  object-fit: cover;
  background-color: #f5f7fa;
}

.cover-title {
  padding: 5px 0;
  text-align: center;
  font-size: 12px;
  color: #606266;
  background-color: #f5f7fa;
  border-top: 1px solid #ebeef5;
}

.upload-control-area {
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding-top: 20px;
}

.el-upload__tip {
  line-height: 1.2;
  padding-top: 8px;
  color: #909399;
  font-size: 12px;
}

.selected-count {
  margin-top: 5px;
  font-size: 12px;
  color: #606266;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s;
}

.fade-enter,
.fade-leave-to {
  opacity: 0;
}

.song-selector-container {
  display: flex;
  flex-direction: column;
}

.song-search-area {
  display: flex;
  flex-direction: column;
  background-color: #f9f9f9;
  padding: 15px;
  border-radius: 4px;
  margin-bottom: 15px;
}

.selected-songs-area {
  margin-top: 5px;
  border: 1px solid #ebeef5;
  border-radius: 4px;
}

.area-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #ebeef5;
}

.area-header h4 {
  margin: 0;
  font-size: 14px;
  font-weight: 500;
  color: #303133;
}

.songs-table-wrapper {
  max-height: 200px;
  overflow-y: auto;
}

.empty-songs-tip {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  color: #909399;
}

.empty-songs-tip i {
  font-size: 24px;
  margin-bottom: 10px;
}

.empty-songs-tip p {
  margin: 0;
}
</style>