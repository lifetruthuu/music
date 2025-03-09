<template>
  <header class="header">
    <div class="nav-buttons">
      <el-button type="text" v-for="menu in menus" :key="menu.id" @click="onChange(menu)">
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
      <el-button v-if="checkIsAdmin()" type="text" @click="onHoutai()">后台管理</el-button>
    </div>
  </header>
</template>

<script>
import { mapState } from 'vuex'; // 导入Vuex辅助函数
import store from '@/store'; // 直接导入store实例

export default {
  name: 'top-header',
  data() {
    return {
      logoUrl: require('@/assets/logo.png'),
      activeIndex: 0,
      searchKey: '',
      isRotated: false,
      username: '',
      isLogedIn: false,
      userId:'',
      currentMusicId: '',
      menus:[{index:0,name:'首页'},{index:1,name:'歌单'},{index:2,name:'歌手'},{index:3,name:'我的音乐'},{index:4,name:'歌曲推荐'}],
      isAdmin: false
    }
  },

  computed: {
    ...mapState({
      user: state => state.user // 从Vuex获取用户信息
    })
  },

  created() {
    // 从localStorage获取用户信息，检查是否管理员
    const userString = localStorage.getItem('user');
    if (userString) {
      try {
        const userObj = JSON.parse(userString);
        this.isAdmin = userObj && userObj.id === '1';
      } catch (e) {
        console.error('解析localStorage中的用户信息失败:', e);
      }
    }
    
    // 从Vuex获取用户信息
    if (this.user && this.user.username) {
      this.username = this.user.username;
      this.isLogedIn = true;
      this.userId = this.user.id;
      // 同时通过Vuex也检查一次管理员权限
      this.isAdmin = this.isAdmin || (this.user.id === '1');
    }
  },
  
  // 监听Vuex中user的变化
  watch: {
    user: {
      handler(newUser) {
        if (newUser && newUser.username) {
          this.username = newUser.username;
          this.isLogedIn = true;
          this.userId = newUser.id;
          // 同时更新管理员状态
          this.isAdmin = this.isAdmin || (newUser.id === '1');
        } else {
          this.username = '';
          this.isLogedIn = false;
          this.userId = '';
          this.isAdmin = false;
        }
      },
      deep: true,
      immediate: true
    }
  },
  
  methods:{
    checkIsAdmin() {
      // 直接从localStorage读取用户信息
      try {
        const userStr = localStorage.getItem('user');
        if (userStr) {
          const user = JSON.parse(userStr);
          return user && user.id === '1';
        }
      } catch (e) {
        console.error('解析用户信息失败:', e);
      }
      return false;
    },
    
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
      // 使用直接导入的store实例
      store.dispatch('logout');
      // 清除管理员状态
      this.isAdmin = false;
      // 跳转到登录页
      this.$router.push('/login');
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