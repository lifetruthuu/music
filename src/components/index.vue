<template>
  <div class="main-container">
    <!-- 顶部导航栏 -->
    <Header @oChangeMenu="oChangeMenu" @oChangeSearchMenu="oChangeSearchMenu"></Header>

    <!-- 中部内容 -->

    <div class="content">
      <component :is="currentComponent"
                 @onQuerySingerMusic="onQuerySingerMusic"
                 @onGeDan="onGeDan"
                 @onBackToSinger="onBackToSinger"
                 @onBackToGedan="onBackToGedan"
                 @onBackToHome="onBackToHome"
                 @onMusicListByGedan="onMusicListByGedan"
                 @onGoToSongDetail="onGoToSongDetail"
                 @onGoToSongDetailFromSinger="onGoToSongDetailFromSinger"
                 :queryStr="queryStr"
                 :index="index"
                 :geDanId="geDanId"
                 :singerId="singerId"
                 :fromGedan="songSource === 'gedan'"
                 :fromSinger="songSource === 'singer'"
                 :id="currentMusicId"/>
    </div>


  </div>
</template>

<script>

import api from "@/api/axios";
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
      },
      {
        key: 'tuijianPage',
        name: '歌曲推荐',
        active: false,
        component: tuijianPage,
      }],
      currentPageCode: 'YongHuPage',
      singerId: null,
      geDanId: null,
      queryStr: null,
      index: null,
      // 新增：记录歌曲详情页的来源
      songSource: null,
      previousComponent: null  // 记录前一个组件
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
      this.currentComponent = gedanMusicPage;
      this.currentPageCode = 'gedanMusicPage';
    },
    
    onBackToSinger() {
      console.log("[index] 收到返回歌手详情事件");
      this.currentComponent = singerDetailPage;
      this.currentPageCode = 'singerDetailPage';
    },
    
    onBackToHome() {
      console.log("[index] 收到返回首页事件");
      this.currentComponent = YongHuPage;
      this.currentPageCode = 'YongHuPage';
    },

    // 处理从歌单中点击歌曲进入详情页
    onGoToSongDetail(songId) {
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'gedan';
      
      // 设置歌曲ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentComponent = songDetailPage;
      this.currentPageCode = 'songDetailPage';
    },
    
    // 处理从歌手详情页点击歌曲进入详情页
    onGoToSongDetailFromSinger(songId) {
      // 保存当前组件作为返回目标
      this.previousComponent = this.currentComponent;
      this.songSource = 'singer';
      
      // 设置歌曲ID并切换到歌曲详情页
      this.currentMusicId = songId;
      this.currentComponent = songDetailPage;
      this.currentPageCode = 'songDetailPage';
    },

    onQuerySingerMusic(item){
      this.singerId = item;
      this.currentComponent = singerDetailPage; // 切换到歌手详情页面
      this.currentPageCode = 'singerDetailPage';
    },
    onMusicListByGedan(args){
      this.geDanId = args.geDanId;
      this.index = args.index;
      this.currentComponent = gedanMusicPage; // 切换到用户管理页面
      this.currentPageCode = 'gedanMusicPage'
    },
    onBackToSinger(){
      // 找到singerPage在menu数组中的索引
      const singerPageIndex = this.menu.findIndex(item => item.key === 'singerPage');
      if(singerPageIndex !== -1) {
        this.currentComponent = SingerPage; // 切换到歌手页面
        this.currentPageCode = 'singerPage';
        this.singerId = null; // 清除歌手ID
      }
    },
    onGeDan(index){
      this.oChangeSearchMenu({index:index,queryStr:null})
    },

    oChangeSearchMenu(menu){
      this.queryStr = menu.queryStr;
      if(this.currentPageCode == 'singerPage' || this.currentPageCode ==  'myMusicPage'){
        return;
      }else{
        let index = menu.index;
        this.currentComponent = this.menu[index].component; // 切换到用户管理页面
        this.currentPageCode = this.menu[index].key
      }
    },
    oChangeMenu(menu) {
      this.singerId = null;
      let index = menu.index;

      this.currentComponent = this.menu[index].component; // 切换到用户管理页面
      this.currentPageCode = this.menu[index].key
    },

    seekAudio(value) {
      const audio = this.$refs.audioPlayer;
      audio.currentTime = (value / 100) * audio.duration;
    },

    // 切换收藏状态
    toggleFavorite() {
      this.isFavorited = !this.isFavorited;
      let message = this.isFavorited ? '已添加到收藏':'已取消收藏'
      let url = this.isFavorited ? '/api/music/deleteFavorites/' : '/api/music/favorites/'
      api.post(url, {
        musicId: this.currentMusicId,
        userId: this.id ,
      }).then(res => {
        this.$message.success(message);
      }).catch(err => {
        console.error('请求失败:', err);
      });


    },

    // 下载音频
    downloadAudio() {
      if (!this.currentAudioPath) {
        this.$message.warning('没有可下载的音频');
        return;
      }
      const link = document.createElement('a');
      link.href = this.currentAudioPath;
      link.download = this.currentAudioName || 'audio';
      link.click();
      this.$message.success('下载成功');
    },


    onHoutai(){
      window.open('http://localhost:8080/login#/houtaiPage', '_blank');
    },
    fullImagePath(path) {
      // 拼接完整的图片 URL
      return `http://localhost:8000${path}`;
    },


    onAudio(item, index){
      if (!item.audioPath) {
        console.error('无效的音频路径');
        return;
      }
      this.currentMusicId = item.id;
      this.currentAudioPath = `http://localhost:8000${item.audioPath}`;
      this.currentAudioName = item.name;
      this.currentAudioSinger = item.singerNames;
      this.currentMusicPath= item.musicPath;

      const audio = this.$refs.audioPlayer;
      if (!audio) {
        console.error('audio元素未找到');
        return;
      }

      // 加载并播放音频
      audio.load();
      audio.play().catch(error => {
        if (error.name === 'NotAllowedError') {
          console.error('播放被阻止：请先点击页面任意位置交互');
        } else {
          console.error('播放失败:', error);
        }
      });
    },

    updateProgress() {
      this.progress = (this.$refs.audioPlayer.currentTime / this.$refs.audioPlayer.duration) * 100;
    },
    handleAudioEnded() {
      this.progress = 0; // 音频播放结束，重置进度
    },

    // 改变音量
    changeVolume(value) {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        audio.volume = value;
      }
    },

    // 切换音量图标
    toggleVolume() {
      const audio = this.$refs.audioPlayer;
      if (audio) {
        if (this.volume === 0) {
          this.volume = 1; // 如果音量为0，设置为最大
        } else {
          this.volume = 0; // 否则设置为0
        }
        audio.volume = this.volume;
      }
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
    }
  },

  created() {
    const userString = localStorage.getItem('user');
    const user = JSON.parse(userString);
    this.username = user.username;
    this.id = user.id;
    this.initData();
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
</style>