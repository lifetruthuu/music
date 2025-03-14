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
            
            <!-- 用户心情选择组件 -->
            <div class="mood-selector" @click.stop :class="{ 'active': showMoodSelector }">
              <div class="current-mood" @click="toggleMoodSelector" ref="moodSelectorBtn">
                <i :class="getMoodIcon(currentMood)"></i>
                <span class="mood-text">{{ getMoodLabel(currentMood) }}</span>
                <i class="el-icon-arrow-down mood-arrow"></i>
              </div>
            </div>
            
            <!-- 用户活动选择组件 -->
            <div class="activity-selector" @click.stop :class="{ 'active': showActivitySelector }">
              <div class="current-activity" @click="toggleActivitySelector" ref="activitySelectorBtn">
                <i :class="getActivityIcon(currentActivity)"></i>
                <span class="activity-text">{{ getActivityLabel(currentActivity) }}</span>
                <i class="el-icon-arrow-down activity-arrow"></i>
              </div>
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
    
    <!-- 将下拉菜单移到DOM树的顶层，避免嵌套导致的z-index问题 -->
    <!-- 心情下拉菜单 -->
    <transition name="fade">
      <div class="mood-dropdown floating-dropdown" v-if="showMoodSelector" :style="moodDropdownStyle">
        <div 
          v-for="mood in moodOptions" 
          :key="mood.value" 
          class="mood-option"
          @click="updateMood(mood.value)"
          :class="{ 'active': currentMood === mood.value }"
        >
          <i :class="mood.icon"></i>
          <span>{{ mood.label }}</span>
        </div>
      </div>
    </transition>
    
    <!-- 活动下拉菜单 -->
    <transition name="fade">
      <div class="activity-dropdown floating-dropdown" v-if="showActivitySelector" :style="activityDropdownStyle">
        <div 
          v-for="activity in activityOptions" 
          :key="activity.value" 
          class="activity-option"
          @click="updateActivity(activity.value)"
          :class="{ 'active': currentActivity === activity.value }"
        >
          <i :class="activity.icon"></i>
          <span>{{ activity.label }}</span>
        </div>
      </div>
    </transition>
    
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
      <transition-group 
        name="song-list" 
        tag="div" 
        class="songs-container"
        @before-leave="beforeItemLeave"
        @after-leave="afterItemLeave"
      >
        <div 
          class="song-item" 
          v-for="(song, index) in songs" 
          :key="song.id || index"
          :class="{ 
            'even-row': index % 2 === 1, 
            'playing': currentSong?.id === song.id
          }"
          :data-index="index"
        >
          <div class="song-info" @click="goToSongDetail(song)">
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
        :current-page.sync="pageNum"
        @change="handleCurrentChange"
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
import { mapState } from 'vuex'; // 只导入mapState
import store from '@/store/index'; // 修正为正确的路径

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
      },
      showMoodSelector: false,
      showActivitySelector: false,
      moodOptions: [
        { value: 'none', label: '无心情', icon: 'el-icon-help' },
        { value: 'calm', label: '平静', icon: 'el-icon-moon' },
        { value: 'happy', label: '开心', icon: 'el-icon-sunny' },
        { value: 'sad', label: '悲伤', icon: 'el-icon-umbrella' },
        { value: 'angry', label: '愤怒', icon: 'el-icon-lightning' },
        { value: 'surprised', label: '惊讶', icon: 'el-icon-star-off' },
        { value: 'tired', label: '疲惫', icon: 'el-icon-sunset' }
      ],
      activityOptions: [
        { value: '', label: '无活动', icon: 'el-icon-close' },
        { value: 'studying', label: '学习中', icon: 'el-icon-reading' },
        { value: 'working', label: '工作中', icon: 'el-icon-office-building' },
        { value: 'exercising', label: '锻炼中', icon: 'el-icon-trophy' },
        { value: 'relaxing', label: '放松中', icon: 'el-icon-coffee-cup' },
        { value: 'commuting', label: '通勤中', icon: 'el-icon-truck' }
      ]
    };
  },

  computed: {
    ...mapState({
      user: state => state.user // 从Vuex获取用户信息

    }),
    
    // 用户当前的心情，有默认值
    currentMood() {
      // 添加日志以检查计算过程
      // 确保始终返回有效的心情值
      return this.user?.mood || 'none';
    },
    
    // 用户当前的活动，有默认值
    currentActivity() {
      return this.user?.activity || '';
    },
    
    // 心情下拉菜单的定位样式
    moodDropdownStyle() {
      if (!this.$refs.moodSelectorBtn) return {};
      
      const rect = this.$refs.moodSelectorBtn.getBoundingClientRect();
      return {
        position: 'fixed',
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`,
        zIndex: 9999
      };
    },
    
    // 活动下拉菜单的定位样式
    activityDropdownStyle() {
      if (!this.$refs.activitySelectorBtn) return {};
      
      const rect = this.$refs.activitySelectorBtn.getBoundingClientRect();
      return {
        position: 'fixed',
        top: `${rect.bottom + 5}px`,
        left: `${rect.left}px`,
        zIndex: 9999
      };
    }
  },

  watch: {
    queryStr(newVal) {
      this.searchQuery = newVal;
      this.initData();
    },
    // 监听用户对象的变化，特别是mood属性
    user: {
      handler(newUser, oldUser) {
        // 当用户整个对象变化时，检查心情是否变化
        const newMood = newUser?.mood;
        const oldMood = oldUser?.mood;
        
        if (newMood !== oldMood) {
          // 强制更新UI
          this.$nextTick(() => this.$forceUpdate());
        }
      },
      deep: true, // 深度监听
      immediate: true // 立即执行一次
    }
  },

  created() {

    
    // 先获取用户心情和活动，再初始化数据
    Promise.all([this.getUserMood(), this.getUserActivity()])
      .then(() => {
        this.initData();
      })
      .catch(err => {
        console.error('myMusicPage: 获取用户数据失败，使用默认设置初始化数据:', err);
        this.initData();
      });

  },

  mounted() {
    window.addEventListener('mousemove', this.handleMouseMove);
    window.addEventListener('resize', this.handleResize);
    window.addEventListener('click', this.handleOutsideClick);
    window.addEventListener('scroll', this.updateDropdownPositions);
    this.checkViewportWidth();
    window.addEventListener('resize', this.checkViewportWidth);
    
    // 添加页面可见性变化事件监听
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
  },

  beforeDestroy() {
    window.removeEventListener('mousemove', this.handleMouseMove);
    window.removeEventListener('resize', this.handleResize);
    window.removeEventListener('click', this.handleOutsideClick);
    window.removeEventListener('resize', this.checkViewportWidth);
    window.removeEventListener('scroll', this.updateDropdownPositions);
    
    // 移除页面可见性变化事件监听
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
  },

  methods: {
    getUserMood() {
      // 从API获取用户心情
      if (!this.user || !this.user.id) {
        return Promise.resolve(); // 如果没有用户，返回一个已解决的Promise
      }
      
      // 返回API调用的Promise
      return api.get('/api/user/get_mood/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        
        if (res.status === 'success') {
          // 确保有默认值
          const mood = res.mood || 'none';
          
          // 创建一个新的用户对象，确保不是直接修改引用
          const updatedUser = JSON.parse(JSON.stringify(this.user));
          updatedUser.mood = mood;
          
          // 更新Vuex状态
          return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            
            // 强制重新计算和重新渲染
            this.$nextTick(() => {
              this.$forceUpdate();
            });
            
            // 确保返回一个已解决的Promise
            return Promise.resolve();
          });
        }
        
        // 如果没有成功获取心情，返回一个已解决的Promise
        return Promise.resolve();
      }).catch(err => {
        console.error('myMusicPage: 获取用户心情失败:', err);
        // 返回一个被拒绝的Promise，以便调用者可以处理错误
        return Promise.reject(err);
      });
    },
    
    checkViewportWidth() {
      // 根据视口宽度调整Profile的展开状态
      if (window.innerWidth <= 768) {
        this.expandedProfile = false;
      }
    },
    
    toggleProfileExpansion() {
      // 关闭所有下拉菜单，避免遮挡问题
      this.showMoodSelector = false;
      this.showActivitySelector = false;
      
      // 添加过渡类，用于动画
      this.$el.querySelector('.user-profile-card').classList.add('animating');
      
      // 切换展开状态
      this.expandedProfile = !this.expandedProfile;
      
      // 动画完成后移除过渡类
      setTimeout(() => {
        this.$el.querySelector('.user-profile-card').classList.remove('animating');
      }, 500); // 与CSS中的过渡时间一致
      
      // 如果展开，滚动到卡片顶部以确保用户可以看到所有内容
      if (this.expandedProfile) {
        // 使用平滑滚动
        this.$el.querySelector('.user-profile-card').scrollIntoView({ 
          behavior: 'smooth',
          block: 'start'
        });
      }
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
              
              // 更新Vuex中的用户信息
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
              
              // 使用直接导入的store实例和新的action
              store.dispatch('updateUserPreserveAdmin', updatedUser);
              
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
      // 触发事件，通知父组件切换到推荐音乐页面
      console.log("[myMusicPage] 触发跳转到推荐音乐页面事件");
      this.$emit("onGoToRecommendFromMyMusic");
    },
    
    confirmUnfavorite(song) {
      this.currentSong = song;
      this.unfavoriteDialogVisible = true;
    },

    handleUnfavorite() {
      if (!this.currentSong) return;
      
      // 设置动画标志
      this.$set(this.currentSong, 'isAnimating', true);

      // 添加波纹效果
      const songIndex = this.songs.findIndex(song => song.id === this.currentSong.id);
      if (songIndex !== -1) {
        this.$nextTick(() => {
          const songItems = document.querySelectorAll('.song-item');
          if (songItems && songItems[songIndex]) {
            const actionContainer = songItems[songIndex].querySelector('.song-actions');
            if (actionContainer) {
              actionContainer.classList.add('show-ripple');
              setTimeout(() => {
                actionContainer.classList.remove('show-ripple');
              }, 800);
            }
          }
        });
      }

      api.post('/api/music/deleteFavorites/', {
        musicId: this.currentSong.id,
        userId: this.user.id,
      }).then(res => {
        this.totalFavorites--;
        this.$message({
          type: 'success',
          message: '已取消收藏',
          duration: 1500
        });
        
        // 关闭对话框
        this.unfavoriteDialogVisible = false;
        
        // 标记要删除的歌曲ID
        const songIdToRemove = this.currentSong.id;
        
        // 使用setTimeout确保动画有更好的视觉效果
        setTimeout(() => {
          // 使用Vue的响应式系统更新数据，触发transition-group的动画
          this.songs = this.songs.filter(song => song.id !== songIdToRemove);
          this.totalSongs--;
          
          // 如果歌曲列表为空，更新总收藏数
          if (this.songs.length === 0) {
            this.totalFavorites = 0;
          }
        }, 300);
        
      }).catch(err => {
        console.error('请求失败:', err);
        this.$message.error('取消收藏失败');
        if (this.currentSong) {
          this.currentSong.isAnimating = false;
        }
        this.unfavoriteDialogVisible = false;
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
          
          // 如果API返回了更新的用户信息，使用新的action更新Vuex
          if (res.user) {
            // 保存当前的心情信息，确保不会被覆盖
            const currentMood = this.user?.mood;
            
            // 创建新的用户对象，合并服务器返回的数据和当前心情
            const updatedUser = JSON.parse(JSON.stringify(res.user));
            
            // 如果服务器返回的用户对象没有心情字段，或者心情字段为空，则使用本地保存的心情
            if (!updatedUser.mood && currentMood) {
              updatedUser.mood = currentMood;
            }
            
            // 使用直接导入的store实例和新的action
            store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
              // 强制更新UI
              this.$nextTick(() => this.$forceUpdate());
            });

          }
          
          this.totalFavorites = res.total || 0;
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
    },

    goToSongDetail(song) {
      // 触发
      console.log("[myMusicPage] 跳转到歌曲详情，用户ID:", this.user.id);
      this.$emit('onGoToSongDetailFromMyMusic', song.id, this.user.id);
    },

    beforeItemLeave(el) {
      // 获取元素高度和位置信息
      const rect = el.getBoundingClientRect();
      
      // 将元素设置为绝对定位，以不影响其他元素的初始位置
      el.style.position = 'absolute';
      el.style.top = rect.top + 'px';
      el.style.left = rect.left + 'px';
      el.style.width = rect.width + 'px';
      el.style.height = rect.height + 'px';
      el.style.zIndex = '10';
      
      // 应用移除动画
      el.style.transition = 'all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
      el.style.transform = 'translateX(30px)';
      el.style.opacity = '0';
    },

    afterItemLeave(el) {
      // 重置元素样式
      el.style.position = '';
      el.style.top = '';
      el.style.left = '';
      el.style.width = '';
      el.style.height = '';
      el.style.zIndex = '';
      el.style.transform = '';
      el.style.opacity = '';
      el.style.transition = '';
    },

    toggleMoodSelector() {
      // 关闭活动选择器
      this.showActivitySelector = false;
      
      // 切换心情选择器
      this.showMoodSelector = !this.showMoodSelector;
      
      // 如果打开了选择器，在下一个tick更新位置
      if (this.showMoodSelector) {
        this.$nextTick(() => {
          this.updateDropdownPositions();
        });
      }
    },

    toggleActivitySelector() {
      // 关闭心情选择器
      this.showMoodSelector = false;
      
      // 切换活动选择器
      this.showActivitySelector = !this.showActivitySelector;
      
      // 如果打开了选择器，在下一个tick更新位置
      if (this.showActivitySelector) {
        this.$nextTick(() => {
          this.updateDropdownPositions();
        });
      }
    },
    
    // 更新下拉菜单位置
    updateDropdownPositions() {
      // 强制重新计算计算属性，Vue会自动处理
      this.$forceUpdate();
    },

    updateMood(mood) {
      
      // 先更新本地状态
      const previousMood = this.user.mood;
      this.showMoodSelector = false;
      
      // 创建一个新的用户对象
      const updatedUser = JSON.parse(JSON.stringify(this.user));
      updatedUser.mood = mood;
      
      // 调用API更新服务器上的数据
      api.post('/api/user/update_mood/', {
        userId: this.user.id,
        mood: mood
      }).then(res => {
        if (res.status === 'success') {
          
          // 更新Vuex中的用户信息
          store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            
            // 强制更新视图
            this.$nextTick(() => {
              this.$forceUpdate();
            });
            
            this.$message({
              type: 'success',
              message: '心情已更新',
              duration: 1500
            });
          });
        } else {
          
          // 如果API请求失败，恢复之前的心情状态
          const revertUser = JSON.parse(JSON.stringify(this.user));
          revertUser.mood = previousMood;
          
          store.dispatch('updateUserPreserveAdmin', revertUser).then(() => {
            this.$nextTick(() => this.$forceUpdate());
          });
          
          this.$message.error(res.message || '更新心情失败');
        }
      }).catch(err => {
        console.error('myMusicPage: 更新心情失败:', err);
        
        // 如果API请求失败，恢复之前的心情状态
        const revertUser = JSON.parse(JSON.stringify(this.user));
        revertUser.mood = previousMood;
        
        store.dispatch('updateUserPreserveAdmin', revertUser).then(() => {
          this.$nextTick(() => this.$forceUpdate());
        });
        
        this.$message.error('更新心情失败');
      });
    },

    getMoodIcon(mood) {
      // 如果没有找到对应的心情，使用默认值"none"的图标
      const moodObj = this.moodOptions.find(m => m.value === mood) || 
                     this.moodOptions.find(m => m.value === 'none');
      return moodObj ? moodObj.icon : 'el-icon-help';
    },

    getMoodLabel(mood) {
      const moodObj = this.moodOptions.find(m => m.value === mood) || 
                     this.moodOptions.find(m => m.value === 'none');
      return moodObj ? moodObj.label : '无心情';
    },

    handleOutsideClick(event) {
      // 检查点击是否在心情选择器按钮外部
      const isMoodBtnClick = this.$refs.moodSelectorBtn && this.$refs.moodSelectorBtn.contains(event.target);
      const isMoodDropdownClick = document.querySelector('.mood-dropdown') && 
                                document.querySelector('.mood-dropdown').contains(event.target);
      
      // 检查点击是否在活动选择器按钮外部
      const isActivityBtnClick = this.$refs.activitySelectorBtn && this.$refs.activitySelectorBtn.contains(event.target);
      const isActivityDropdownClick = document.querySelector('.activity-dropdown') && 
                                    document.querySelector('.activity-dropdown').contains(event.target);
      
      // 如果点击在心情选择器和下拉菜单外部，关闭心情选择器
      if (this.showMoodSelector && !isMoodBtnClick && !isMoodDropdownClick) {
        this.showMoodSelector = false;
      }
      
      // 如果点击在活动选择器和下拉菜单外部，关闭活动选择器
      if (this.showActivitySelector && !isActivityBtnClick && !isActivityDropdownClick) {
        this.showActivitySelector = false;
      }
    },

    // 处理页面可见性变化
    handleVisibilityChange() {
      if (document.visibilityState === 'visible') {
        // 页面变为可见时，重新获取用户心情和活动
        this.getUserMood();
        this.getUserActivity();
      }
    },

    // 获取用户活动
    getUserActivity() {
      // 从API获取用户活动
      if (!this.user || !this.user.id) {
        return Promise.resolve(); // 如果没有用户，返回一个已解决的Promise
      }
      
      
      // 返回API调用的Promise
      return api.get('/api/user/get_activity/', {
        params: {
          userId: this.user.id
        }
      }).then(res => {
        
        if (res.status === 'success') {
          // 确保有默认值
          const activity = res.activity || '';
          
          // 创建一个新的用户对象，确保不是直接修改引用
          const updatedUser = JSON.parse(JSON.stringify(this.user));
          updatedUser.activity = activity;
          
          // 更新Vuex状态
          return store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            
            // 强制重新计算和重新渲染
            this.$nextTick(() => {
              this.$forceUpdate();
            });
            
            // 确保返回一个已解决的Promise
            return Promise.resolve();
          });
        }
        
        // 如果没有成功获取活动，返回一个已解决的Promise
        return Promise.resolve();
      }).catch(err => {
        console.error('myMusicPage: 获取用户活动失败:', err);
        // 返回一个被拒绝的Promise，以便调用者可以处理错误
        return Promise.reject(err);
      });
    },

    getActivityIcon(activity) {
      // 如果没有找到对应的活动，使用默认值"无活动"的图标
      const activityObj = this.activityOptions.find(a => a.value === activity) || 
                         this.activityOptions.find(a => a.value === '');
      return activityObj ? activityObj.icon : 'el-icon-close';
    },

    getActivityLabel(activity) {
      // 获取活动的显示标签
      const activityObj = this.activityOptions.find(a => a.value === activity) || 
                         this.activityOptions.find(a => a.value === '');
      return activityObj ? activityObj.label : '无活动';
    },

    updateActivity(activity) {
      
      // 先更新本地状态
      const previousActivity = this.user.activity;
      this.showActivitySelector = false;
      
      // 创建一个新的用户对象
      const updatedUser = JSON.parse(JSON.stringify(this.user));
      updatedUser.activity = activity;
      
      // 调用API更新服务器上的数据
      api.post('/api/user/update_activity/', {
        userId: this.user.id,
        activity: activity
      }).then(res => {
        if (res.status === 'success') {
          
          // 更新Vuex中的用户信息
          store.dispatch('updateUserPreserveAdmin', updatedUser).then(() => {
            
            // 强制更新视图
            this.$nextTick(() => {
              this.$forceUpdate();
            });
            
            this.$message({
              type: 'success',
              message: '活动已更新',
              duration: 1500
            });
          });
        } else {
          
          // 如果API请求失败，恢复之前的活动状态
          const revertUser = JSON.parse(JSON.stringify(this.user));
          revertUser.activity = previousActivity;
          
          store.dispatch('updateUserPreserveAdmin', revertUser).then(() => {
            this.$nextTick(() => this.$forceUpdate());
          });
          
          this.$message.error(res.message || '更新活动失败');
        }
      }).catch(err => {
        console.error('myMusicPage: 更新活动失败:', err);
        
        // 如果API请求失败，恢复之前的活动状态
        const revertUser = JSON.parse(JSON.stringify(this.user));
        revertUser.activity = previousActivity;
        
        store.dispatch('updateUserPreserveAdmin', revertUser).then(() => {
          this.$nextTick(() => this.$forceUpdate());
        });
        
        this.$message.error('更新活动失败');
      });
    },
  }
}
</script>

<style scoped>
/* 浮动下拉菜单样式 */
.floating-dropdown {
  position: fixed;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  z-index: 9999;
  overflow: hidden;
  transform-origin: top left;
}

.my-music-page {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Helvetica Neue', Helvetica, 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', Arial, sans-serif;
}

/* 用户信息卡片样式 */
.user-profile-card {
  background: linear-gradient(135deg, #8e44ad, #3498db, #2980b9, #9b59b6);
  background-size: 300% 300%;
  animation: gradientShift 15s ease infinite;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
  margin-bottom: 30px;
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
  color: white;
  position: relative;
  will-change: transform, box-shadow;
}

.user-profile-card.expanded {
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
  transform: scale(1.01);
}

.profile-header {
  display: flex;
  align-items: center;
  padding: 20px;
  cursor: pointer;
  position: relative;
  transition: background 0.3s ease;
  overflow: hidden;
}

.profile-header:hover {
  background: rgba(255, 255, 255, 0.1);
}

.profile-header::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.6s ease-out, height 0.6s ease-out, opacity 0.6s ease-out;
  opacity: 0;
  z-index: 0;
}

.profile-header:active::before {
  width: 300px;
  height: 300px;
  opacity: 1;
}

.profile-header::after {
  content: '\e6e1';
  font-family: 'element-icons';
  position: absolute;
  right: 15px;
  bottom: 10px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 18px;
  transition: transform 0.3s ease;
}

.user-profile-card:not(.expanded) .profile-header::after {
  animation: pulse 2s infinite;
}

.expanded .profile-header::after {
  animation: none;
  transform: rotate(180deg);
}

.profile-avatar-container {
  position: relative;
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  margin-right: 20px;
  border: 3px solid rgba(255, 255, 255, 0.5);
  transition: all 0.3s ease, transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
  z-index: 1;
}

.expanded .profile-avatar-container {
  transform: scale(1.08);
}

.profile-avatar-container:hover {
  transform: scale(1.05);
  border-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 0 20px rgba(255, 255, 255, 0.3);
}

.expanded .profile-avatar-container:hover {
  transform: scale(1.15);
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
  position: relative;
  z-index: 20;
}

.profile-nickname {
  margin: 0 0 10px;
  font-size: 24px;
  font-weight: 600;
}

.profile-stats {
  display: flex;
  gap: 15px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  padding: 5px 15px;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.stat-item:hover {
  background: rgba(255, 255, 255, 0.3);
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
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height 0.5s cubic-bezier(0, 1, 0, 1),
              opacity 0.5s ease,
              padding 0.5s ease;
  padding: 0 20px;
  position: relative;
  z-index: 10;
}

.expanded .profile-details {
  max-height: 500px; /* 足够大的值来容纳所有内容 */
  opacity: 1;
  padding: 10px 20px 20px;
  transition: max-height 0.5s cubic-bezier(0.5, 0, 1, 0),
              opacity 0.5s ease 0.2s,
              padding 0.5s ease;
}

.detail-item {
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  transform: translateY(10px);
  opacity: 0;
  transition: transform 0.4s ease, opacity 0.4s ease;
}

.expanded .detail-item {
  transform: translateY(0);
  opacity: 1;
}

.expanded .detail-item:nth-child(1) { transition-delay: 0.1s; }
.expanded .detail-item:nth-child(2) { transition-delay: 0.15s; }
.expanded .detail-item:nth-child(3) { transition-delay: 0.2s; }
.expanded .detail-item:nth-child(4) { transition-delay: 0.25s; }
.expanded .detail-item:nth-child(5) { transition-delay: 0.3s; }
.expanded .detail-item:nth-child(6) { transition-delay: 0.35s; }
.expanded .detail-item:nth-child(7) { transition-delay: 0.4s; }

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

/* 动画状态类 */
.user-profile-card.animating {
  pointer-events: none; /* 防止动画过程中的交互 */
}

/* 展开/收起指示动画 */
@keyframes pulse {
  0% { transform: scale(1); opacity: 0.7; }
  50% { transform: scale(1.1); opacity: 1; }
  100% { transform: scale(1); opacity: 0.7; }
}

/* 添加平滑的卡片背景动画 */
@keyframes gradientShift {
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
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
  min-height: 100px;
  width: 100%;
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
  position: relative;
}

.favorite-icon {
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 20px;
  color: #dcdfe6;
  position: relative;
  z-index: 1;
}

.favorite-icon:hover {
  transform: scale(1.2);
}

.favorite-icon.favorited {
  color: #ff4757;
}

.song-actions::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(255, 71, 87, 0.2);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  z-index: 0;
  pointer-events: none;
  opacity: 0;
}

.song-actions.show-ripple::before {
  animation: ripple-effect 0.8s ease-out;
}

.animate-favorite {
  animation: favorite-animation 0.5s ease;
}

@keyframes favorite-animation {
  0% { transform: scale(1); }
  25% { transform: scale(1.4) rotate(-15deg); color: #ff4757; }
  50% { transform: scale(0.8) rotate(15deg); }
  75% { transform: scale(1.2); }
  100% { transform: scale(1); }
}

@keyframes ripple-effect {
  0% {
    width: 0;
    height: 0;
    opacity: 1;
  }
  100% {
    width: 70px;
    height: 70px;
    opacity: 0;
  }
}

.song-item-leave-active {
  animation: slide-out 0.5s ease forwards;
  position: absolute;
  width: 100%;
  z-index: 0;
}

@keyframes slide-out {
  0% {
    transform: translateX(0);
    opacity: 1;
  }
  100% {
    transform: translateX(30px);
    opacity: 0;
  }
}

.song-item-move {
  transition: transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
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
  transition: all 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.song-list-enter {
  opacity: 0;
  transform: translateY(20px);
}

.song-list-leave-to {
  opacity: 0;
  transform: translateX(30px);
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
    flex-wrap: wrap;
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
  
  .mood-dropdown, .activity-dropdown {
    width: 140px;
    left: 50%;
    transform: translateX(-50%);
  }
  
  .expanded .profile-stats {
    margin-bottom: 15px;
  }
}

/* 用户心情选择器样式 */
.mood-selector {
  position: relative;
  margin-left: 15px;
  width: fit-content;
}

.current-mood {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.current-mood:hover {
  background: rgba(255, 255, 255, 0.3);
}

.mood-text {
  margin: 0 5px;
  font-size: 14px;
}

.mood-arrow {
  font-size: 12px;
  margin-left: 5px;
  transition: transform 0.3s ease;
}

.mood-selector.active .mood-arrow {
  transform: rotate(180deg);
}

.mood-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  margin-top: 10px;
  z-index: 2000;
  overflow: hidden;
  will-change: transform, opacity;
}

.close-dropdown {
  cursor: pointer;
  font-size: 16px;
  color: #909399;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
  width: 24px;
  border-radius: 50%;
}

.close-dropdown:hover {
  background: rgba(0, 0, 0, 0.1);
  color: #606266;
}

.mood-option {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
}

.mood-option:hover {
  background: #f5f7fa;
}

.mood-option.active {
  background: #ecf5ff;
  color: #409EFF;
}

.mood-option i {
  margin-right: 10px;
  font-size: 16px;
}

/* 显示/隐藏动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s cubic-bezier(0.25, 1, 0.5, 1);
  transform-origin: top center;
  pointer-events: none;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

/* 用户活动选择器样式 */
.activity-selector {
  position: relative;
  margin-left: 15px;
  width: fit-content;
}

.current-activity {
  display: flex;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 20px;
  padding: 5px 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.current-activity:hover {
  background: rgba(255, 255, 255, 0.3);
}

.activity-text {
  margin: 0 5px;
  font-size: 14px;
}

.activity-arrow {
  font-size: 12px;
  margin-left: 5px;
  transition: transform 0.3s ease;
}

.activity-selector.active .activity-arrow {
  transform: rotate(180deg);
}

.activity-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 150px;
  background: white;
  border-radius: 8px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
  margin-top: 10px;
  z-index: 2000;
  overflow: hidden;
  will-change: transform, opacity;
}

.activity-option {
  display: flex;
  align-items: center;
  padding: 10px 15px;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #606266;
}

.activity-option:hover {
  background: #f5f7fa;
}

.activity-option.active {
  background: #ecf5ff;
  color: #409EFF;
}

.activity-option i {
  margin-right: 10px;
  font-size: 16px;
}

/* 确保下拉菜单在卡片展开时也能正确显示 */
.expanded .mood-selector, .expanded .activity-selector {
  position: static;
}

.expanded .mood-dropdown, .expanded .activity-dropdown {
  position: absolute;
  top: auto;
  left: auto;
  transform: translateY(10px);
}
</style>