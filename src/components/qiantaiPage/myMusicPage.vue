<template>
  <div class="my-music-page">
    <!-- 用户信息卡片 -->
    <div class="user-profile-card" :class="{ 'expanded': expandedProfile }">
      <div class="profile-header" @click="toggleProfileExpansion">
        <div class="profile-avatar-container">
          <img 
            :src="user.avatarUrl ? `http://localhost:8000${user.avatarUrl}` : require('@/assets/default-avatar.png')" 
            alt="用户头像" 
            class="profile-avatar" 
          />
          <div class="avatar-overlay">
            <i class="el-icon-camera"></i>
          </div>
        </div>
        <div class="profile-basic-info">
          <h2 class="profile-nickname">{{ user.nickname || user.userName }}</h2>
          <div class="profile-stats">
            <div class="stat-item">
              <span class="stat-value">{{ totalFavorites }}</span>
              <span class="stat-label">收藏</span>
            </div>
          </div>
        </div>
        <el-button 
          type="primary" 
          icon="el-icon-setting" 
          circle 
          class="settings-button"
          @click.stop="openSettingsDialog"
        ></el-button>
      </div>
      
      <div class="profile-details" v-if="expandedProfile">
        <div class="detail-item">
          <i class="el-icon-user"></i>
          <span class="detail-label">用户名:</span>
          <span class="detail-value">{{ user.userName }}</span>
        </div>
        <div class="detail-item">
          <i class="el-icon-male" v-if="user.sex === '男'"></i>
          <i class="el-icon-female" v-else-if="user.sex === '女'"></i>
          <i class="el-icon-question" v-else></i>
          <span class="detail-label">性别:</span>
          <span class="detail-value">{{ user.sex || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <i class="el-icon-date"></i>
          <span class="detail-label">年龄:</span>
          <span class="detail-value">{{ user.age || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <i class="el-icon-message"></i>
          <span class="detail-label">邮箱:</span>
          <span class="detail-value">{{ user.email || '未设置' }}</span>
        </div>
        <div class="detail-item">
          <i class="el-icon-mobile-phone"></i>
          <span class="detail-label">电话:</span>
          <span class="detail-value">{{ user.phone || '未设置' }}</span>
        </div>
        <div class="detail-item bio-item">
          <i class="el-icon-document"></i>
          <span class="detail-label">简介:</span>
          <span class="detail-value">{{ user.bio || '这个人很懒，什么都没留下...' }}</span>
        </div>
        <div class="detail-item">
          <i class="el-icon-time"></i>
          <span class="detail-label">注册时间:</span>
          <span class="detail-value">{{ user.registerDate || '未知' }}</span>
        </div>
      </div>
    </div>
    
    <!-- 搜索栏 -->
    <div class="search-container">
      <el-input
        v-model="searchQuery"
        placeholder="搜索我的收藏歌曲..."
        prefix-icon="el-icon-search"
        clearable
        @clear="handleSearch"
        @keyup.enter.native="handleSearch"
      >
        <el-button 
          slot="append" 
          icon="el-icon-search" 
          @click="handleSearch"
        ></el-button>
      </el-input>
    </div>

    <!-- 音乐列表容器 -->
    <div class="music-list-container">
      <!-- 表头 -->
      <div class="header">
        <span class="song-title">歌曲</span>
        <span class="song-artist">歌手</span>
        <span class="song-duration">播放</span>
        <span class="song-actions">收藏</span>
      </div>

      <!-- 歌曲列表 -->
      <transition-group name="song-list" tag="div" class="songs-container">
        <div 
          class="song-item" 
          v-for="(song, index) in songs" 
          :key="song.id"
          :class="{ 'even-row': index % 2 === 1, 'playing': currentSong?.id === song.id }"
        >
          <div class="song-info" @click="playSong(song, index)">
            <span class="order">{{ index + 1 }}</span>
            <div class="cover-container">
              <img
                :src="fullImagePath(song.musicPath)"
                alt="音乐封面"
                class="music-cover"
              />
              <div class="play-icon-overlay">
                <i :class="currentSong?.id === song.id && isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play'"></i>
              </div>
            </div>
            <span class="title">{{ song.name }}</span>
          </div>

          <span class="artist-info">{{song.singerNames}}</span>

          <div class="song-duration">
            <i 
              :class="[
                currentSong?.id === song.id && isPlaying ? 'el-icon-video-pause' : 'el-icon-video-play',
                'play-btn'
              ]"
              @click="togglePlay(song, index)"
            ></i>
          </div>

          <div class="song-actions">
            <i
              :class="[
                'el-icon-star-on favorite-icon',
                { 'animate-favorite': song.isAnimating, 'favorited': song.favorited === 1 }
              ]"
              @click="confirmUnfavorite(song)"
            ></i>
          </div>
        </div>
      </transition-group>

      <!-- 无数据提示 -->
      <div class="empty-state" v-if="songs.length === 0">
        <i class="el-icon-headset empty-icon"></i>
        <p class="empty-text">你还没有收藏任何歌曲</p>
        <el-button type="primary" @click="goToExplore">去发现音乐</el-button>
      </div>

      <!-- 分页器 -->
      <Pagination
        v-if="totalSongs > 0"
        :total="totalSongs"
        :page-size="pageSize"
        :current-page="pageNum"
        @change="handleCurrentChange"
        @update:currentPage="handleCurrentChange"
        class="pagination"
      />
    </div>

    <!-- 个人信息设置弹窗 -->
    <el-dialog
      title="个人信息设置"
      :visible.sync="settingsDialogVisible"
      width="50%"
      custom-class="user-settings-dialog"
    >
      <el-form :model="userFormData" :rules="userFormRules" ref="userForm" label-width="100px">
        <div class="avatar-upload-container">
          <el-avatar 
            :size="100" 
            :src="avatarPreview || (user.avatarUrl ? `http://localhost:8000${user.avatarUrl}` : require('@/assets/default-avatar.png'))"
          ></el-avatar>
          <el-upload
            class="avatar-uploader"
            action="#"
            :http-request="uploadAvatar"
            :show-file-list="false"
            :before-upload="beforeAvatarUpload"
          >
            <el-button size="small" type="primary" icon="el-icon-upload">更换头像</el-button>
          </el-upload>
        </div>

        <el-form-item label="用户名" prop="userName">
          <el-input v-model="userFormData.userName" disabled placeholder="用户名不可修改"></el-input>
        </el-form-item>
        
        <el-form-item label="昵称" prop="nickname">
          <el-input v-model="userFormData.nickname" placeholder="请输入昵称"></el-input>
        </el-form-item>
        
        <el-form-item label="性别" prop="sex">
          <el-radio-group v-model="userFormData.sex">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
            <el-radio label="保密">保密</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="年龄" prop="age">
          <el-input-number v-model="userFormData.age" :min="1" :max="120"></el-input-number>
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userFormData.email" placeholder="请输入邮箱"></el-input>
        </el-form-item>
        
        <el-form-item label="电话" prop="phone">
          <el-input v-model="userFormData.phone" placeholder="请输入电话号码"></el-input>
        </el-form-item>
        
        <el-form-item label="个人简介" prop="bio">
          <el-input 
            type="textarea" 
            v-model="userFormData.bio" 
            placeholder="介绍一下自己吧..."
            :rows="4"
          ></el-input>
        </el-form-item>
      </el-form>
      
      <span slot="footer" class="dialog-footer">
        <el-button @click="settingsDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveUserInfo" :loading="saving">保 存</el-button>
      </span>
    </el-dialog>

    <!-- 确认取消收藏弹窗 -->
    <el-dialog
      title="取消收藏"
      :visible.sync="unfavoriteDialogVisible"
      width="30%"
      custom-class="unfavorite-dialog"
      :show-close="false"
      center
    >
      <div class="dialog-content">
        <i class="el-icon-warning-outline warning-icon"></i>
        <p>确定要取消收藏这首歌曲吗？</p>
        <p class="song-name">《{{ currentSong?.name }}》</p>
      </div>
      <span slot="footer" class="dialog-footer">
        <el-button @click="unfavoriteDialogVisible = false">取 消</el-button>
        <el-button type="danger" @click="handleUnfavorite">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 添加播放器组件 -->
    <audio-player
      :show.sync="showPlayer"
      :current-song="currentSong"
      :playlist="songs"
      :current-index="currentIndex"
      @play="handlePlay"
      @pause="handlePause"
      @ended="handleAudioEnded"
      @change-song="handleChangeSong"
      @progress-update="handleProgressUpdate"
      ref="player"
    />
  </div>
</template>

<script>
import api from "@/api/axios";
import AudioPlayer from '@/components/com/AudioPlayer.vue';
import Pagination from '@/components/com/Pagination.vue';

export default {
  components: {
    AudioPlayer,
    Pagination
  },
  props:{
    singerId: String,
    queryStr: String,
  },
  data() {
    // 表单验证规则
    const validateEmail = (rule, value, callback) => {
      if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        callback(new Error('请输入正确的邮箱格式'));
      } else {
        callback();
      }
    };
    
    const validatePhone = (rule, value, callback) => {
      if (value && !/^1[3-9]\d{9}$/.test(value)) {
        callback(new Error('请输入正确的手机号码'));
      } else {
        callback();
      }
    };
    
    return {
      songs: [],
      user: {},
      totalFavorites: 0,
      totalSongs: 0,
      pageNum: 1,
      pageSize: 10,
      searchQuery: '',
      expandedProfile: false,
      currentAudio: null,
      unfavoriteDialogVisible: false,
      settingsDialogVisible: false,
      currentSong: null,
      showPlayer: false,
      currentIndex: -1,
      progress: 0,
      isPlaying: false,
      mouseY: 0,
      windowHeight: window.innerHeight,
      avatarPreview: null,
      avatarFile: null,
      saving: false,
      userFormData: {
        userName: '',
        nickname: '',
        sex: '',
        age: null,
        email: '',
        phone: '',
        bio: ''
      },
      userFormRules: {
        nickname: [
          { max: 20, message: '昵称不能超过20个字符', trigger: 'blur' }
        ],
        email: [
          { validator: validateEmail, trigger: 'blur' }
        ],
        phone: [
          { validator: validatePhone, trigger: 'blur' }
        ],
        bio: [
          { max: 500, message: '个人简介不能超过500个字符', trigger: 'blur' }
        ]
      }
    };
  },

  watch: {
    queryStr(newVal) {
      this.searchQuery = newVal;
      this.initData();
    }
  },

  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString) || {};
    this.initData();
  },

  mounted() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
    this.checkViewportWidth();
    window.addEventListener('resize', this.checkViewportWidth);
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('resize', this.checkViewportWidth);
  },

  methods: {
    checkViewportWidth() {
      // 根据视口宽度调整Profile的展开状态
      if (window.innerWidth <= 768) {
        this.expandedProfile = false;
      }
    },
    
    toggleProfileExpansion() {
      this.expandedProfile = !this.expandedProfile;
    },
    
    openSettingsDialog() {
      // 复制用户数据到表单
      this.userFormData = {
        userName: this.user.userName,
        nickname: this.user.nickname,
        sex: this.user.sex || '保密',
        age: this.user.age || 18,
        email: this.user.email || '',
        phone: this.user.phone || '',
        bio: this.user.bio || ''
      };
      this.settingsDialogVisible = true;
    },
    
    beforeAvatarUpload(file) {
      const isJPG = file.type === 'image/jpeg';
      const isPNG = file.type === 'image/png';
      const isLt2M = file.size / 1024 / 1024 < 2;

      if (!isJPG && !isPNG) {
        this.$message.error('头像图片只能是 JPG 或 PNG 格式!');
        return false;
      }
      if (!isLt2M) {
        this.$message.error('头像图片大小不能超过 2MB!');
        return false;
      }
      
      // 预览图片
      this.avatarFile = file;
      const reader = new FileReader();
      reader.onload = (e) => {
        this.avatarPreview = e.target.result;
      };
      reader.readAsDataURL(file);
      return false; // 阻止自动上传
    },
    
    uploadAvatar() {
      // 这里不做实际上传，保存表单时一起处理
      return false;
    },
    
    saveUserInfo() {
      this.$refs.userForm.validate((valid) => {
        if (valid) {
          this.saving = true;
          
          // 创建FormData对象用于文件上传
          const formData = new FormData();
          formData.append('id', this.user.id);
          formData.append('userName', this.userFormData.userName);
          formData.append('nickname', this.userFormData.nickname);
          formData.append('sex', this.userFormData.sex);
          formData.append('age', this.userFormData.age);
          formData.append('email', this.userFormData.email);
          formData.append('phone', this.userFormData.phone);
          formData.append('bio', this.userFormData.bio);
          
          if (this.avatarFile) {
            formData.append('avatar', this.avatarFile);
          }
          
          // 发送请求更新用户信息
          api.post('/api/user/update/', formData, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          }).then(res => {
            if (res.status === 'success') {
              this.$message.success('个人信息更新成功');
              
              // 更新本地用户信息
              const updatedUser = {
                ...this.user,
                nickname: this.userFormData.nickname,
                sex: this.userFormData.sex,
                age: this.userFormData.age,
                email: this.userFormData.email,
                phone: this.userFormData.phone,
                bio: this.userFormData.bio
              };
              
              if (res.avatarUrl) {
                updatedUser.avatarUrl = res.avatarUrl;
              }
              
              localStorage.setItem('user', JSON.stringify(updatedUser));
              this.user = updatedUser;
              
              this.settingsDialogVisible = false;
              this.avatarPreview = null;
              this.avatarFile = null;
            } else {
              this.$message.error(res.message || '更新失败');
            }
          }).catch(err => {
            console.error('更新用户信息失败:', err);
            this.$message.error('更新用户信息失败');
          }).finally(() => {
            this.saving = false;
          });
        }
      });
    },
    
    handleSearch() {
      this.pageNum = 1;
      this.initData();
    },
    
    handleCurrentChange(page) {
      this.pageNum = page;
      this.initData();
    },
    
    goToExplore() {
      this.$router.push('/music');
    },
    
    confirmUnfavorite(song) {
      this.currentSong = song;
      this.unfavoriteDialogVisible = true;
    },

    handleUnfavorite() {
      if (!this.currentSong) return;
      
      // 设置动画标志
      this.$set(this.currentSong, 'isAnimating', true);

      api.post('/api/music/deleteFavorites/', {
        musicId: this.currentSong.id,
        userId: this.user.id,
      }).then(res => {
        this.$message({
          type: 'success',
          message: '已取消收藏'
        });
        
        // 动画结束后移除歌曲
        setTimeout(() => {
          this.initData();
        }, 500);
        
        this.unfavoriteDialogVisible = false;
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('取消收藏失败');
        if (this.currentSong) {
          this.currentSong.isAnimating = false;
        }
      });
    },
    
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },
    
    getFullAudioPath(path) {
      // 拼接完整的音频文件 URL
      return `http://localhost:8000${path}`;
    },
    
    handlePlay() {
      this.isPlaying = true;
    },
    
    handlePause() {
      this.isPlaying = false;
    },
    
    handleAudioEnded() {
      this.playNext();
    },
    
    handleChangeSong(index) {
      if (index >= 0 && index < this.songs.length) {
        this.currentIndex = index;
        this.currentSong = this.songs[index];
        this.showPlayer = true;
        
        // 记录播放历史
        this.recordPlayHistory(this.currentSong.id);
      }
    },
    
    handleProgressUpdate(progress) {
      this.progress = progress;
    },
    
    playNext() {
      if (this.currentIndex < this.songs.length - 1) {
        this.handleChangeSong(this.currentIndex + 1);
      }
    },
    
    recordPlayHistory(musicId) {
      api.post('/api/music/play/', {
        userId: this.user.id,
        musicId: musicId,
      }).catch(err => {
        console.error('记录播放历史失败:', err);
      });
    },
    
    initData() {
      api.post('/api/music/myMusic/', {
        pageNum: this.pageNum,
        pageSize: this.pageSize,
        singerId: this.singerId,
        userId: this.user.id,
        queryStr: this.searchQuery,
      }).then(res => {
        if (res.status === 'success') {
          this.songs = res.list;
          this.totalSongs = res.total;
          this.user = res.user || this.user;
          this.totalFavorites = res.total || 0;
          
          // 更新localStorage中的用户信息
          localStorage.setItem('user', JSON.stringify(this.user));
        } else {
          this.$message.error(res.message || '获取数据失败');
          this.songs = [];
        }
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('获取数据失败');
        this.songs = [];
      });
    },
    
    playSong(song, index) {
      this.currentIndex = index;
      this.currentSong = song;
      this.showPlayer = true;
      this.$nextTick(() => {
        this.$refs.player?.play();
      });
      this.recordPlayHistory(song.id);
      
      // 触发跳转到歌曲详情页事件
      this.$emit('onGoToSongDetail', song.id);
    },
    
    togglePlay(song, index) {
      if (this.currentSong?.id === song.id) {
        if (this.isPlaying) {
          this.$refs.player?.pause();
        } else {
          this.$refs.player?.play();
        }
      } else {
        this.playSong(song, index);
      }
    },
    
    handleMouseMove(event) {
      this.mouseY = event.clientY;
      this.showPlayer = (this.windowHeight - this.mouseY) < 100 || this.isPlaying;
    },
    
    handleResize() {
      this.windowHeight = window.innerHeight;
    }
  }
}
</script>

<style scoped>
.my-music-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 用户信息卡片样式 */
.user-profile-card {
  background: linear-gradient(135deg, #8e44ad, #3498db);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 30px;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  color: white;
}

.user-profile-card.expanded {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  position: relative;
}

.profile-avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease;
}

.profile-avatar-container:hover {
  transform: scale(1.05);
}

.profile-avatar {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.profile-avatar-container:hover .avatar-overlay {
  opacity: 1;
}

.avatar-overlay i {
  color: white;
  font-size: 24px;
}

.profile-basic-info {
  flex: 1;
}

.profile-nickname {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 600;
}

.profile-stats {
  display: flex;
  gap: 20px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 20px;
}

.stat-value {
  font-weight: 600;
  font-size: 16px;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
}

.settings-button {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  transition: all 0.3s ease;
}

.settings-button:hover {
  background: rgba(255, 255, 255, 0.4);
  transform: rotate(120deg);
}

.profile-details {
  padding: 0 20px 20px;
  animation: fadeIn 0.5s ease;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.detail-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
}

.detail-item i {
  margin-right: 10px;
  width: 20px;
  text-align: center;
}

.detail-label {
  width: 70px;
  opacity: 0.8;
}

.detail-value {
  font-weight: 500;
}

.bio-item {
  align-items: flex-start;
}

/* 搜索容器样式 */
.search-container {
  margin-bottom: 20px;
}

/* 音乐列表容器样式 */
.music-list-container {
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
  overflow: hidden;
}

/* 表头样式 */
.header {
  display: grid;
  grid-template-columns: 4fr 2fr 1fr 1fr;
  padding: 16px 20px;
  background: #f8f9fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

/* 歌曲项样式 */
.songs-container {
  position: relative;
  min-height: 200px;
}

.song-item {
  display: grid;
  grid-template-columns: 4fr 2fr 1fr 1fr;
  align-items: center;
  padding: 15px 20px;
  transition: all 0.3s ease;
  border-bottom: 1px solid #f0f0f0;
}

.song-item:hover {
  background: #f5f7fa;
  transform: translateX(5px);
}

.song-item.playing {
  background: rgba(64, 158, 255, 0.1);
  border-left: 4px solid #409EFF;
  padding-left: 16px;
}

.even-row {
  background-color: #fafafa;
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.song-info:hover {
  color: #409EFF;
}

.order {
  width: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.cover-container {
  width: 50px;
  height: 50px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
  position: relative;
}

.music-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.song-info:hover .music-cover {
  transform: scale(1.1);
}

.title {
  font-size: 16px;
  font-family: 'STXinwei';
  color: #303133;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.artist-info {
  font-size: 14px;
  color: #606266;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放图标样式 */
.play-icon-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.song-info:hover .play-icon-overlay {
  opacity: 1;
}

.play-icon-overlay i {
  color: white;
  font-size: 24px;
}

.song-duration {
  display: flex;
  align-items: center;
  justify-content: center;
}

.play-btn {
  cursor: pointer;
  color: #409EFF;
  font-size: 20px;
  transition: all 0.3s ease;
}

.play-btn:hover {
  transform: scale(1.2);
  color: #66b1ff;
}

/* 收藏图标样式 */
.song-actions {
  display: flex;
  justify-content: center;
}

.favorite-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;
  color: #dcdfe6;
}

.favorite-icon:hover {
  transform: scale(1.2);
}

.favorite-icon.favorited {
  color: #ff4757;
}

.animate-favorite {
  animation: favorite-animation 0.5s ease;
}

@keyframes favorite-animation {
  0% { transform: scale(1); }
  50% { transform: scale(1.3) rotate(20deg); }
  100% { transform: scale(1); }
}

/* 空状态样式 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 50px 20px;
  text-align: center;
}

.empty-icon {
  font-size: 60px;
  color: #dcdfe6;
  margin-bottom: 20px;
}

.empty-text {
  font-size: 16px;
  color: #909399;
  margin-bottom: 20px;
}

/* 分页器样式 */
.pagination {
  margin-top: 30px;
  text-align: center;
}

/* 确保Pagination组件与页面风格一致 */
.pagination >>> .pagination-wrapper {
  background: transparent;
  box-shadow: none;
  padding: 10px;
}

.pagination >>> .page-num {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  margin: 0 5px;
}

.pagination >>> .page-num.active {
  background-color: #8e44ad;
  color: #fff;
}

.pagination >>> .page-btn {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
}

.pagination >>> .page-jump,
.pagination >>> .total-info {
  color: #fff;
}

.pagination >>> .jump-input >>> .el-input__inner {
  background-color: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

/* 确认弹窗样式 */
.unfavorite-dialog {
  border-radius: 12px;
  overflow: hidden;
}

.dialog-content {
  text-align: center;
  padding: 20px 0;
}

.warning-icon {
  font-size: 48px;
  color: #ff4757;
  margin-bottom: 20px;
}

.song-name {
  color: #606266;
  font-size: 16px;
  margin-top: 10px;
  font-weight: bold;
}

.dialog-footer {
  text-align: center;
  margin-top: 20px;
}

/* 设置弹窗样式 */
.user-settings-dialog {
  border-radius: 8px;
}

.avatar-upload-container {
  text-align: center;
  margin-bottom: 20px;
}

.avatar-uploader {
  margin-top: 10px;
}

/* 列表动画 */
.song-list-enter-active, .song-list-leave-active {
  transition: all 0.5s;
}
.song-list-enter, .song-list-leave-to {
  opacity: 0;
  transform: translateX(-30px);
}

/* 响应式样式 */
@media (max-width: 768px) {
  .my-music-page {
    padding: 10px;
  }
  
  .profile-header {
    flex-direction: column;
    text-align: center;
  }
  
  .profile-avatar-container {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .profile-stats {
    justify-content: center;
  }
  
  .settings-button {
    position: absolute;
    top: 10px;
    right: 10px;
  }
  
  .header, .song-item {
    grid-template-columns: 4fr 2fr 1fr 1fr;
    font-size: 14px;
    padding: 10px;
  }
  
  .cover-container {
    width: 40px;
    height: 40px;
  }
  
  .order {
    display: none;
  }
  
  .title {
    font-size: 14px;
  }
  
  .artist-info {
    font-size: 12px;
  }
  
  .play-btn, .favorite-icon {
    font-size: 18px;
  }
}
</style>