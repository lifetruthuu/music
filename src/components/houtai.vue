<template>
  <div class="main-container">
    <!-- 系统标题 -->
    <div class="system-title">
      <h3>音乐推荐系统</h3>
    </div>

    <!-- 主体内容 -->
    <div class="container">
      <!-- 左侧菜单 -->
      <!-- 左侧菜单 -->
      <SideMenu @menuselect='handelfather' ></SideMenu>
      <!-- 右侧内容 -->
      <div class="content">
        <component :is="currentComponent" />
      </div>
    </div>
  </div>
</template>

<script>

import SideMenu from '@/components/com/menu.vue';

export default {
  components: {
    SideMenu, // 注册菜单组件
  },
  data() {
    return {
      currentIndex: '1',
      // 菜单选中项
      currentComponent: 'UserPage',
      menu:[ {
        key: 'UserPage',
        name: '用户信息',
        active: false,
        component: () => import('./houtaiPage/userPage.vue'),
      }, {
        key: 'gedanListPage',
        name: '歌单管理',
        active: false,
        component: () => import('./houtaiPage/gedanPage.vue'),
      },{
        key: 'singerListPage',
        name: '歌手管理',
        active: false,
        component: () => import('./houtaiPage/singerListPage.vue'),
      },{
        key: 'musicPage',
        name: '音乐管理',
        active: false,
        component: () => import('./houtaiPage/musicListPage.vue'),
      },]
    };
  },
  created() {
    this.currentComponent = this.menu[0].component; // 切换到用户管理页面
  },
  methods: {
    // 菜单选择
    handelfather(index) {
      this.currentComponent = this.menu[index].component; // 切换到用户管理页面
    },
  },
};
</script>

<style scoped>
.main-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
}

.system-title {
  background-color: #409EFF;
  color: white;
  padding: 0 20px;
  font-weight: bold;
  text-align: left;
}

.container {
  display: flex;
  flex: 1;
}

.content {
  flex: 1;
  padding: 20px;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.left-toolbar {
  display: flex;
  align-items: center;
}

.search-input {
  width: 300px;
  margin-right: 20px;
}

.pagination {
  margin-top: 20px;
  text-align: right;
}
</style>