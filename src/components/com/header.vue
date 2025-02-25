<template>
  <header class="header">
    <div class="nav-buttons">
      <el-button type="text" v-for="menu in menus"  :key="menu.id" @click="onChange(menu)">
        {{menu.name}}
      </el-button>

      <el-input
          v-model="searchKey"
          placeholder="请输入搜索关键字"
          clearable
          @keyup.enter.native="handleSearch"
          @clear="handleSearch"
      >
        <el-button
            slot="append"
            icon="el-icon-search"
            @click="handleSearch"
        ></el-button>
      </el-input>
    </div>

    <div class="right-section">
      <el-button type="text" @click="onTuichu">退出</el-button>
      <el-button v-if="username && username == 'admin'" type="text" @click="onHoutai()">后台管理</el-button>
    </div>
  </header>
</template>

<script>
export default {
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
      menus:[{index:0,name:'首页'},{index:1,name:'歌单'},{index:2,name:'歌手'},{index:3,name:'我的音乐'}]
    }
  },

  created() {
    const userString = localStorage.getItem('user');
    const user = JSON.parse(userString);
    this.username = user.username;
  },
  methods:{
    handleSearch(){
      this.$emit("oChangeSearchMenu",{index:1,name:'歌单',queryStr:this.searchKey})
    },
    onChange(menu){
      this.$emit("oChangeMenu",menu)
    },
    onHoutai(){
      window.open('http://localhost:8080/login#/houtaiPage', '_blank');
    },

    onTuichu(){
      localStorage.clear();
      this.$router.push('/login'); // 跳转到首页
    }
  }
}

</script>



<style scoped>
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
</style>