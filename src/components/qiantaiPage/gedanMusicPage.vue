<template>
  <div>
   <div style="text-align: left;margin-left: 6%;">
     <el-button  type="text" icon="el-icon-arrow-left" @click="onBack">上一页</el-button>
   </div>
  <div class="music-list">

    <!-- 表头 -->
    <div class="header">
      <span class="song-title" style="margin-left: -211px">歌曲</span>
      <span class="play-count" style="text-align: left">播放</span>
      <span class="artist">歌手</span>
    </div>

    <!-- 歌曲列表 -->
    <div class="song-item" v-for="(song, index) in songs" :key="index">
      <div class="song-info">
        <span class="order">{{ index + 1 }}</span>
        <div class="cover-container">
          <img
              :src="imagePath(song)"
              alt="音乐封面"
              class="music-cover"
          />
        </div>
        <span class="title">
          {{ song.name }}
        </span>
      </div>

      <div class="play-count">
        <audio controls class="audio-player"  @play="handlePlay" >
          <source :src="getFullAudioPath(song.audioPath)" type="audio/ogg">
        </audio>
      </div>
<!--      <i :class="song.favitoryed ? 'el-icon-star-off even-row-color red' : 'el-icon-star-on'" @click="onFavitory(song)"></i>-->
      <i
          :class="song.favorited == 1 ? 'el-icon-star-on red' : 'el-icon-star-off'"
          @click="onFavitory(song)"
          class="favorite-icon"
      ></i>
      <span class="artist-info">{{song.singerNames}}</span>

    </div>
  </div>
  </div>
</template>

<script>

import api from "@/api/axios";

export default {

  props:{
    geDanId: String,
    queryStr:String,
    index:Number,
  },

  watch: {
    queryStr(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.initData(newVal);
    },
    singerId(newVal, oldVal) {
      console.log(`queryStr changed from ${oldVal} to ${newVal}`);
      this.initData(newVal);
    }
  },


  data(){
    return{
       songs: [],
       user:{},
       currentAudio: null,  // 当前播放的音频元素
    }
  },
  created() {
    const userString = localStorage.getItem('user');
    this.user = JSON.parse(userString);
    this.initData();
  },
  methods:{
    imagePath(item) {
      return item.musicPath ? this.fullImagePath(item.musicPath) :  require('@/assets/1740221844832.jpg');
    },
    handlePlay(event) {
      // 如果有正在播放的音频且不是当前音频
      if (this.currentAudio && this.currentAudio !== event.target) {
        this.currentAudio.pause()  // 暂停其他音频
      }
      this.currentAudio = event.target  // 记录当前播放的音频
    },
    onFavitory(song){
        let url = song.favorited == '1' ? '/api/music/deleteFavorites/' : '/api/music/favorites/'
        api.post(url, {
        musicId: song.id,
        userId: this.user.id,
      }).then(res => {
        song.favorited = true;
        this.$emit("收藏成功")
        this.initData();
      }).catch(err => {
        console.error('请求失败:', err);
        this.songs = [];
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
    onBack(){
      this.$emit("onGeDan",this.index)
    },
    initData() {
      api.post('/api/music/list/', {
        pageNum: 1,
        pageSize: 1000,
        singerId: this.singerId,
        userId: this.user.id,
        queryStr:this.queryStr,
      }).then(res => {
        this.songs = res.list;
      }).catch(err => {
        console.error('请求失败:', err);
        this.songs = [];
      });
    }
  }
}

</script>

<style scoped>
.favorite-icon {
  cursor: pointer; /* 添加鼠标悬停效果 */
  transition: color 0.3s ease; /* 添加颜色过渡效果 */
  font-size: 18px; /* 设置图标大小 */
  margin-left: 10px; /* 添加一些间距 */
}

.red {
  color: red; /* 收藏后显示为红色 */
}

.el-icon-star-off {
  color: #ccc; /* 未收藏时显示为灰色 */
}
.music-list {
  width: 100%;
  max-width: 1200px;
  margin: 20px auto;
  font-family: 'Microsoft YaHei', sans-serif;
  background: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px rgba(0,0,0,0.1);
}

/* 表头样式 */
.header {
  display: grid;
  grid-template-columns: 4fr 3fr 3fr;
  padding: 16px 30px;
  background: #f8f9fa;
  font-weight: 600;
  color: #606266;
  border-bottom: 1px solid #ebeef5;
}

/* 歌曲项布局 */
.song-item {
  display: grid;
  grid-template-columns: 4fr 3fr 3fr 3fr;
  align-items: center;
  padding: 20px 30px;
  transition: background 0.3s;
}

.song-item:hover {
  background: #f5f7fa;
}

/* 歌曲信息区域 */
.song-info {
  display: flex;
  align-items: center;
  gap: 20px;
}

.order {
  width: 30px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}

.cover-container {
  width: 60px;
  height: 60px;
  border-radius: 6px;
  overflow: hidden;
  flex-shrink: 0;
}

.music-cover {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.music-cover:hover {
  transform: scale(1.1);
}

.title {
  font-size: 16px;
  color: #303133;
  font-weight: 500;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* 播放器样式 */
.audio-player {
  width: 200px;
  height: 40px;
}

.audio-player::-webkit-media-controls-panel {
  background: #f5f7fa;
}

.audio-player::-webkit-media-controls-play-button {
  filter: brightness(0.8);
}

/* 歌手信息 */
.artist-info {
  color: #606266;
  font-size: 14px;
  padding-left: 20px;
}

/* 响应式处理 */
@media (max-width: 768px) {
  .header, .song-item {
    grid-template-columns: 1fr;
    padding: 15px;
  }

  .song-info {
    gap: 10px;
    margin-bottom: 15px;
  }

  .audio-player {
    width: 100%;
    margin: 10px 0;
  }
}
</style>