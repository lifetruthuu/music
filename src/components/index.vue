<template>
  <div class="main-container">
    <!-- 顶部导航栏 -->
    <Header ref="headerComponent" @oChangeMenu="oChangeMenu" @oChangeSearchMenu="oChangeSearchMenu"></Header>

    <!-- 中部内容 -->

    <div class="content">
      <transition name="fade" mode="out-in">
        <component :is="currentComponent"
                   @onQuerySingerMusic="onQuerySingerMusic"
                   @onGeDan="onGeDan"
                   @onBackToSinger="onBackToSinger"
                   @onBackToSingerList="onBackToSingerList"
                   @onBackToGedan="onBackToGedan"
                   @onBackToHome="onBackToHome"
                   @onBackToMyMusic="onBackToMyMusic"
                   @onBackToTuijian="onBackToTuijian"
                   @onMusicListByGedan="onMusicListByGedan"
                   @onGoToSongDetail="onGoToSongDetail"
                   @onGoToSongDetailFromSinger="onGoToSongDetailFromSinger"
                   @onGoToSongDetailFromMyMusic="onGoToSongDetailFromMyMusic"
                   @onGoToSongDetailFromTuijian="onGoToSongDetailFromTuijian"
                   @onGoToRecommendFromMyMusic="onGoToRecommendFromMyMusic"
                   :queryStr="queryStr"
                   :index="index"
                   :geDanId="geDanId"
                   :singerId="singerId"
                   :fromGedan="songSource === 'gedan'"
                   :fromSinger="songSource === 'singer'"
                   :fromMyMusic="songSource === 'myMusic'"
                   :fromTuijian="songSource === 'tuijian'"
                   :userId="currentUserId"
                   :id="currentMusicId"/>
      </transition>
    </div>


  </div>
</template>

<script>

import api from "@/api/axios";
import BehaviorService from "@/services/BehaviorService";
import Header from '@/components/com/header.vue';
import YongHuPage from '@/components/qiantaiPage/yonghuPage.vue';
import MusicPage from '@/components/qiantaiPage/musicPage.vue';
import SingerPage from '@/components/qiantaiPage/singerPage.vue';
import myMusicPage from '@/components/qiantaiPage/myMusicPage.vue';
import tuijianPage from '@/components/qiantaiPage/tuijianPage.vue';
import gedanPage from '@/components/qiantaiPage/gedanPage.vue';
import gedanMusicPage from '@/components/qiantaiPage/gedanMusicPage.vue';
import singerDetailPage from '@/components/qiantaiPage/singerDetailPage.vue';
import songDetailPage from '@/components/qiantaiPage/songDetailPage.vue';

export default{
  components:{
    Header,YongHuPage,MusicPage,SingerPage,myMusicPage,tuijianPage,gedanPage,gedanMusicPage,singerDetailPage,songDetailPage
  },
  data(){
    return{
      progress: 0,
      searchKey: null,
      username:null,
      tableData:[],
      currentAudioPath: '',
      volume: 1, // 默认音量为最大（1）
      isMuted: false, // 是否静音
      currentAudioName: '', // 当前播放的音频名称
      currentAudioSinger: '', // 当前播放的音频歌手
      isFavorited: false, // 是否已收藏
      currentMusicPath: '',
      currentMusicId: '',
      images:[
        require('../../src/assets/109951170487950389.jpg'),
        require('../../src/assets/109951170487958377.jpg'),
        // 添加更多图片路径
        require('../../src/assets/109951170487965434.jpg'),
        require('../../src/assets/109951170487987122.jpg'),
        require('../../src/assets/109951170488017071.jpg'),
        require('../../src/assets/109951170487997718.jpg'),
      ],
      currentComponent:YongHuPage,
      menu:[ {
        key: 'YongHuPage',
        name: '首页',
        active: false,
        component: YongHuPage,
      }, 
      {
        key: 'gedanPage',
        name: '歌单',
        active: false,
        component: gedanPage,
      }, 
      {
        key: 'singerPage',
        name: '歌手',
        active: false,
        component: SingerPage,

      }, 
      {
        key: 'myMusicPage',
        name: '我的音乐',
        active: false,
        component: myMusicPage,

      },
      {
        key: 'tuijianPage',
        name: '歌曲推荐',
        active: false,
        component: tuijianPage,
      },
      {
        key: 'gedanMusicPage',
        name: '歌单音乐',
        active: false,
        component: gedanMusicPage,
      },
      {
        key: 'singerDetailPage',
        name: '歌手详细',
        active: false,
        component: singerDetailPage,
      },
      {
        key: 'songDetailPage',
        name: '歌曲详情',
        active: false,
        component: songDetailPage,
      }],
      currentPageCode: 'YongHuPage',
      singerId: null,
      geDanId: null,
      queryStr: null,
      index: null,
      // 新增：记录歌曲详情页的来源
      songSource: null,
      previousComponent: null,  // 记录前一个组件
      startPlayTime: null, // 添加播放开始时间
      currentUserId: null, // 新增：当前用户的ID
    }
  },
  computed: {
    // 根据音量大小动态显示图标
    volumeIcon() {
      if (this.volume === 0) {
        return 'el-icon-turn-off-microphone'; // 音量为0
      } else if (this.volume < 0.5) {
        return 'el-icon-microphone'; // 低音量
      } else {
        return 'el-icon-microphone'; // 高音量
      }
    },
  },
  methods:{
    // 处理歌曲详情页面的返回事件
    onBackToGedan() {
      console.log("[index] 收到返回歌单事件");
      // 使用previousComponent可以确保返回到正确的gedanMusicPage组件
      if (this.previousComponent) {
        console.log("[index] 返回到之前的组件：", this.previousComponent.name || 'unknown');
        this.currentComponent = gedanMusicPage; // 始终设置为gedanMusicPage
        this.currentPageCode = 'gedanMusicPage';
        // 不清除gedanId，保持原来的参数
      } else {
        console.log("[index] 没有之前的组件记录，默认返回到gedanMusicPage");
        this.currentComponent = gedanMusicPage;
        this.currentPageCode = 'gedanMusicPage';
      }
    },
    
    // 处理从歌手详情页返回歌手列表页的事件
    onBackToSingerList() {
      console.log("[index] 收到返回歌手列表事件");
      this.currentComponent = SingerPage;
      this.currentPageCode = 'singerPage';
      this.singerId = null; // 清除歌手ID
    },
    
    // 处理从歌曲详情页返回歌手详情页的事件
    onBackToSinger() {
      console.log("[index] 收到返回歌手详情事件");
      
      // 从歌曲详情页返回到歌手详情页
      if (this.currentPageCode === 'songDetailPage' && this.songSource === 'singer') {
        console.log("[index] 从歌曲详情页返回到歌手详情页");
        this.currentComponent = singerDetailPage;
        this.currentPageCode = 'singerDetailPage';
        // 保留singerId，确保显示的是同一个歌手的详情
      } 
      // 其他情况，默认返回歌手列表
      else {
        console.log("[index] 其他情况，默认返回到歌手列表页");
        this.currentComponent = SingerPage;
        this.currentPageCode = 'singerPage';
        this.singerId = null;
      }
    },
    
    onBackToHome() {
      console.log("[index] 收到返回首页事件");
      this.currentComponent = YongHuPage;
      this.currentPageCode = 'YongHuPage';
    },

    // 处理从歌单中点击歌曲进入详情页
    onGoToSongDetail(songId, userId) {
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'gedan';
      
      // 设置歌曲ID和用户ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentUserId = userId; // 保存用户ID
      
      console.log("[index] 从gedanMusicPage接收到跳转请求，歌曲ID:", songId, "用户ID:", userId);
      
      this.currentComponent = songDetailPage;
      this.currentPageCode = 'songDetailPage';
    },
    
    // 处理从歌手详情页点击歌曲进入详情页
    onGoToSongDetailFromSinger(songId, userId) {
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'singer';
      
      // 设置歌曲ID和用户ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentUserId = userId; // 保存用户ID
      
      console.log("[index] 从singerDetailPage接收到跳转请求，歌曲ID:", songId, "用户ID:", userId);
      
      this.currentComponent = songDetailPage;
      this.currentPageCode = 'songDetailPage';
    },

    onQuerySingerMusic(item){
      this.singerId = item;
      this.currentComponent = singerDetailPage; // 切换到歌手详情页面
      this.currentPageCode = 'singerDetailPage';
    },
    onMusicListByGedan(args){
      // 添加过渡动画标记
      document.body.classList.add('page-transitioning');
      
      // 设置参数
      this.geDanId = args.geDanId;
      this.index = args.index;
      
      // 使用setTimeout确保动画效果可见
      setTimeout(() => {
        this.currentComponent = gedanMusicPage; // 切换到歌单音乐页面
        this.currentPageCode = 'gedanMusicPage';
        
        // 移除过渡动画标记
        setTimeout(() => {
          document.body.classList.remove('page-transitioning');
        }, 300);
      }, 50);
    },
    onGeDan(index){
      this.oChangeSearchMenu({index:index,queryStr:null})
    },

    oChangeSearchMenu(menu){
      this.queryStr = menu.queryStr;
      if(this.currentPageCode == 'singerPage' || this.currentPageCode ==  'myMusicPage'){
        return;
      }else{
        // 确保管理员状态
        this.ensureAdminStatus();
        
        let index = menu.index;
        this.currentComponent = this.menu[index].component; // 切换到用户管理页面
        this.currentPageCode = this.menu[index].key;
        
        // 组件切换后再次确认
        this.$nextTick(() => {
          this.ensureAdminStatus();
        });
      }
    },
    oChangeMenu(menu) {
      this.singerId = null;
      let index = menu.index;

      // 即将切换到我的音乐页面
      if (menu.index === 3) { // 3是"我的音乐"的索引
        // 在组件切换前，确认管理员权限
        this.ensureAdminStatus();
      }

      this.currentComponent = this.menu[index].component; // 切换到用户管理页面
      this.currentPageCode = this.menu[index].key;

      // 组件切换后再次确认管理员权限
      this.$nextTick(() => {
        this.ensureAdminStatus();
      });
    },

    onHoutai(){
      window.open('http://localhost:8080/login#/houtaiPage', '_blank');
    },

    initData() {
      const queryStr = this.searchKey || '';
      api.post('/api/music/list/', {
        queryStr,
        pageNum: 1,
        pageSize: 1000,
      }).then(res => {
        this.tableData = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
        this.tableData = [];
        this.page.total = 0;
      });
    },

    onBackToMyMusic() {
      console.log("[index] 收到返回我的音乐事件");
      // 确保管理员状态
      this.ensureAdminStatus();
      
      this.currentComponent = myMusicPage;
      this.currentPageCode = 'myMusicPage';
      
      // 组件切换后再次确认
      this.$nextTick(() => {
        this.ensureAdminStatus();
      });
    },

    // 处理从我的音乐页面点击歌曲进入详情页
    onGoToSongDetailFromMyMusic(songId, userId) {
      console.log("[index] 从myMusicPage接收到跳转请求，歌曲ID:", songId, "用户ID:", userId);
      
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'myMusic';
      
      // 设置歌曲ID、用户ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentUserId = userId; // 保存用户ID
      
      console.log("[index] 设置currentUserId:", this.currentUserId);
      
      // 确保在组件切换前保存好参数
      this.$nextTick(() => {
        this.currentComponent = songDetailPage;
        this.currentPageCode = 'songDetailPage';
        console.log("[index] 已切换到songDetailPage，传递的用户ID:", this.currentUserId);
      });
    },

    // 修改下载音频函数
    downloadAudio() {
      if (!this.currentAudioPath) {
        this.$message.warning('没有可下载的音频');
        return;
      }
      
      // 记录下载行为
      if (this.currentMusicId) {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        BehaviorService.recordBehavior({
          userId: user.id,
          musicId: this.currentMusicId,
          action_type: 'download'
        });
      }
      
      const link = document.createElement('a');
      link.href = this.currentAudioPath;
      link.download = this.currentAudioName || 'audio';
      link.click();
      this.$message.success('下载成功');
    },

    // 修改音频播放函数
    onAudio(item, index){
      if (!item.audioPath) {
        console.error('无效的音频路径');
        return;
      }
      
      // 获取用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      // 如果当前有歌曲正在播放，记录播放中断行为
      if (this.startPlayTime && this.currentMusicId) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const audio = this.$refs.audioPlayer;
        const completionRate = audio && audio.duration ? audio.currentTime / audio.duration : 0;
        
        // 构建歌曲对象，用于记录
        const currentSong = {
          id: this.currentMusicId,
          name: this.currentAudioName,
          singer: this.currentAudioSinger
        };
        
        BehaviorService.recordPlay(currentSong, user.id, 'interrupt', duration, completionRate);
        BehaviorService.recordBehavior({
          userId: user.id,
          musicId: this.currentMusicId,
          action_type: 'interrupt',
          play_duration: duration,
          play_completion_rate: completionRate
        });
      }
      
      this.currentMusicId = item.id;
      this.currentAudioPath = `http://localhost:8000${item.audioPath}`;
      this.currentAudioName = item.name;
      this.currentAudioSinger = item.singerNames;
      this.currentMusicPath = item.musicPath;

      const audio = this.$refs.audioPlayer;
      if (!audio) {
        console.error('audio元素未找到');
        return;
      }

      // 加载并播放音频
      audio.load();
      audio.play().then(() => {
        // 记录播放开始时间
        this.startPlayTime = new Date();
        
        // 记录播放行为
        BehaviorService.recordPlay(item, user.id, 'play');
        BehaviorService.recordBehavior({
          userId: user.id,
          musicId: item.id,
          action_type: 'play',
          position_in_playlist: index
        });
      }).catch(error => {
        if (error.name === 'NotAllowedError') {
          console.error('播放被阻止：请先点击页面任意位置交互');
        } else {
          console.error('播放失败:', error);
        }
      });
    },

    // 添加新的音频事件处理函数
    onAudioPause() {
      if (!this.startPlayTime || !this.currentMusicId) return;
      
      const audio = this.$refs.audioPlayer;
      if (!audio) return;
      
      const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
      const completionRate = audio.duration ? audio.currentTime / audio.duration : 0;
      
      // 构建歌曲对象，用于记录
      const currentSong = {
        id: this.currentMusicId,
        name: this.currentAudioName,
        singer: this.currentAudioSinger
      };
      
      // 获取用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      BehaviorService.recordPlay(currentSong, user.id, 'pause', duration, completionRate);
      BehaviorService.recordBehavior({
        userId: user.id,
        musicId: this.currentMusicId,
        action_type: 'pause',
        play_duration: duration,
        play_completion_rate: completionRate
      });
    },
    
    onAudioEnded() {
      if (!this.startPlayTime || !this.currentMusicId) return;
      
      const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
      
      // 构建歌曲对象，用于记录
      const currentSong = {
        id: this.currentMusicId,
        name: this.currentAudioName,
        singer: this.currentAudioSinger
      };
      
      // 获取用户信息
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      
      BehaviorService.recordPlay(currentSong, user.id, 'complete', duration, 1.0);
      BehaviorService.recordBehavior({
        userId: user.id,
        musicId: this.currentMusicId,
        action_type: 'complete',
        play_duration: duration,
        play_completion_rate: 1.0
      });
      
      this.startPlayTime = null;
      // 可以在这里实现自动播放下一首歌曲的逻辑
    },

    onGoToRecommendFromMyMusic() {
      console.log("[index] 从myMusicPage接收到跳转到推荐音乐页面的请求");
      
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      
      // 切换到推荐音乐页面
      this.currentComponent = tuijianPage;
      this.currentPageCode = 'tuijianPage';
      console.log("[index] 已切换到tuijianPage");
    },

    // 处理从推荐页面点击歌曲进入详情页
    onGoToSongDetailFromTuijian(songId, userId) {
      console.log("[index] 从tuijianPage接收到跳转请求，歌曲ID:", songId, "用户ID:", userId);
      
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'tuijian';
      
      // 设置歌曲ID和用户ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentUserId = userId; // 保存用户ID
      
      this.currentComponent = songDetailPage;
      this.currentPageCode = 'songDetailPage';
    },
    
    // 处理从歌曲详情页返回推荐页面的事件
    onBackToTuijian() {
      console.log("[index] 收到返回推荐页面事件");
      
      // 从歌曲详情页返回到推荐页面
      if (this.currentPageCode === 'songDetailPage' && this.songSource === 'tuijian') {
        console.log("[index] 从歌曲详情页返回到推荐页面");
        this.currentComponent = tuijianPage;
        this.currentPageCode = 'tuijianPage';
      } else {
        console.log("[index] 其他情况，默认返回到推荐页面");
        this.currentComponent = tuijianPage;
        this.currentPageCode = 'tuijianPage';
      }
    },

    // 添加新方法，确保管理员状态
    ensureAdminStatus() {
      // 获取header组件引用
      const headerRef = this.$refs.headerComponent;
      if (!headerRef) return;

      // 从localStorage读取用户信息
      const userString = localStorage.getItem('user');
      if (userString) {
        try {
          const userObj = JSON.parse(userString);
          const isAdmin = userObj && userObj.id === '1';
          
          // 强制更新header组件的isAdmin状态
          headerRef.isAdmin = isAdmin;
        } catch (e) {
          console.error('解析localStorage中的用户信息失败:', e);
        }
      }
    },
  },

  created() {
    const userString = localStorage.getItem('user');
    const user = JSON.parse(userString);
    this.username = user.username;
    this.id = user.id;
  },

  mounted() {
    // 如果使用audio元素，挂载后添加事件监听
    if (this.$refs.audioPlayer) {
      this.$refs.audioPlayer.addEventListener('pause', this.onAudioPause);
      this.$refs.audioPlayer.addEventListener('ended', this.onAudioEnded);
    }
    
    // 页面挂载后确保管理员状态
    this.$nextTick(() => {
      this.ensureAdminStatus();
    });
  },

  beforeDestroy() {
    // 组件销毁前移除事件监听器
    if (this.$refs.audioPlayer) {
      this.$refs.audioPlayer.removeEventListener('pause', this.onAudioPause);
      this.$refs.audioPlayer.removeEventListener('ended', this.onAudioEnded);
      
      // 如果有歌曲正在播放，记录中断行为
      if (this.startPlayTime && this.currentMusicId && this.$refs.audioPlayer.playing) {
        const duration = Math.floor((new Date() - this.startPlayTime) / 1000);
        const completionRate = this.$refs.audioPlayer.duration ? 
          this.$refs.audioPlayer.currentTime / this.$refs.audioPlayer.duration : 0;
        
        // 构建歌曲对象，用于记录
        const currentSong = {
          id: this.currentMusicId,
          name: this.currentAudioName,
          singer: this.currentAudioSinger
        };
        
        // 获取用户信息
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        
        BehaviorService.recordPlay(currentSong, user.id, 'interrupt', duration, completionRate);
        BehaviorService.recordBehavior({
          userId: user.id,
          musicId: this.currentMusicId,
          action_type: 'interrupt',
          play_duration: duration,
          play_completion_rate: completionRate
        });
      }
    }
  }
}

</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
.progress-section {
  display: flex;
  align-items: center; /* 垂直居中对齐 */
  justify-content: center; /* 水平居中对齐（可选） */
  gap: 10px; /* 添加一些间距 */
}

.progress-section i {
  cursor: pointer;
  font-size: 20px;
}
.header {
  display: flex;
  justify-content: space-between; /* 保持两侧间距 */
  align-items: center;
  padding: 0 7rem;
  height: 60px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}
.right-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
}

.volume-slider-container {
  display: flex;
  align-items: center;
  height: 100px; /* 控制滑块高度 */
  margin-left: 10px;
}

/* 自定义滑块样式 */
:deep(.el-slider__bar) {
  background-color: #409eff; /* 滑块背景色 */
}


:deep(.el-slider__button) {
  width: 12px;
  height: 12px;
  border: 2px solid #409eff; /* 滑块按钮边框 */
}
/* 新增导航区容器 */
.nav-section {
  display: flex;
  align-items: center;
  gap: 1.5rem; /* 控制按钮与搜索框间距 */
}

.nav-buttons {
  display: flex;
  gap: 1rem; /* 按钮间间距 */
}

.search-input {
  width: 200px;
  transition: all 0.3s;
}

/* 保持右侧操作区样式 */
.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .nav-section {
    gap: 0.5rem;
  }

  .search-input {
    width: 150px;
  }

  .nav-buttons .el-button {
    font-size: 0.9rem;
    padding: 8px;
  }
}
.nav-buttons[data-v-47323bf2] {
  display: flex;
  gap: 1rem;
  width: 44%;
}


.right-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.search-input {
  width: 200px;
  margin-right: 1rem;
}

.content {
  flex: 1;
  padding: 2rem;
}

.carousel-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.playlist-grid {
  margin-top: 2rem;
  width: 90%;
  margin-left: 7%;
}

.music-card {
  margin-bottom: 1rem;
}

.card-image {
  width: 100%;
  height: 180px;
  object-fit: cover;
}

.card-footer {
  padding: 1rem 0;
  text-align: center;
}

.card-footer h3 {
  margin: 0;
  font-size: 1rem;
}

.card-footer p {
  margin: 0.5rem 0 0;
  color: #666;
  font-size: 0.9rem;
}

.player-footer {
  background: #fff;
  box-shadow: 0 -2px 12px rgba(0,0,0,0.1);
  padding: 1rem 2rem;
}

.player-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
}

.left-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.progress-section {
  flex: 1;
  margin: 0 2rem;
}

.progress-bar :deep(.el-slider__runway) {
  height: 4px;
}

.right-controls {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  width: 200px;
}

.volume-slider {
  width: 100px;
}

.time {
  font-size: 0.8rem;
  color: #666;
  margin-top: 0.5rem;
  display: block;
}

/* 添加组件切换动画 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
  transform: translateX(20px);
}

.fade-enter-to,
.fade-leave-from {
  opacity: 1;
  transform: translateX(0);
}

/* 组件切换动画 - 增强版 */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.5s cubic-bezier(0.19, 1, 0.22, 1), 
              transform 0.5s cubic-bezier(0.19, 1, 0.22, 1);
}

.fade-enter-from {
  opacity: 0;
  transform: translateY(30px);
}

.fade-leave-to {
  opacity: 0;
  transform: translateY(-30px);
}

/* 增强特定页面转场动画 */
.fade-enter-active.gedan-transition,
.fade-leave-active.gedan-transition {
  transition: opacity 0.4s ease-in-out, transform 0.5s cubic-bezier(0.25, 0.1, 0.25, 1);
}

.fade-enter-from.gedan-transition,
.fade-leave-to.gedan-transition {
  opacity: 0;
  transform: translateY(30px) scale(0.95);
}

/* 页面过渡中的全局状态 */
:global(.page-transitioning) .content {
  overflow: hidden;
}
</style>