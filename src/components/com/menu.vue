<template>
  <el-menu
      default-active="1"
      class="el-menu-vertical-demo custom-menu"
      @select="handleMenuSelect"
  >
    <el-menu-item
        v-for="item in menuItems"
        :key="item.index"
        :index="item.index"
    >
      <i :class="item.icon"></i>
      <span slot="title">{{ item.title }}</span>
    </el-menu-item>
  </el-menu>
</template>

<script>
export default {
  props:{
  },
  data() {
    return {
      menuItems: [
        { index: 0, icon: 'el-icon-user', title: '用户管理',  },
        { index: 1, icon: 'el-icon-folder', title: '歌单管理' },
        { index: 2, icon: 'el-icon-s-custom', title: '歌手管理' },
        { index: 3, icon: 'el-icon-headset', title: '音乐管理' },
      ],

    };
  },
  computed: {

  },

  created() {

  },
  methods: {
    // 菜单选择事件
    handleMenuSelect(index) {
      this.$nextTick(() => {
        this.$emit('menuselect', index); // 触发父组件的事件
      });
    },

  },
};
</script>

<style scoped>
.el-menu-vertical-demo {
  width: 200px;
  height: 100%;
  background-color: #f5f5f5;
}

.custom-menu .el-menu-item {
  padding-left: 20px !important; /* 调整菜单项的左内边距 */
}
.custom-menu {
  text-align: left; /* 左对齐 */
}
</style>