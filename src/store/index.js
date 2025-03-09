import Vue from 'vue'
import Vuex from 'vuex'

// 确保Vue使用Vuex插件
Vue.use(Vuex)

// 创建并导出store实例
const store = new Vuex.Store({
  state: {
    user: JSON.parse(localStorage.getItem('user')) || {}
  },
  mutations: {
    SET_USER(state, user) {
      state.user = user
      localStorage.setItem('user', JSON.stringify(user))
    },
    UPDATE_USER_PRESERVE_ADMIN(state, userData) {
      // 如果当前用户是管理员(id为1)，确保更新后仍然是
      const currentUser = state.user
      const isAdmin = currentUser && currentUser.id === '1'
      
      // 创建新的用户对象，合并传入的数据
      const updatedUser = { ...userData }
      
      // 如果当前是管理员，保留ID为1
      if (isAdmin) {
        updatedUser.id = '1'
      }
      
      // 更新状态和localStorage
      state.user = updatedUser
      localStorage.setItem('user', JSON.stringify(updatedUser))
    },
    CLEAR_USER(state) {
      state.user = {}
      localStorage.removeItem('user')
    }
  },
  actions: {
    setUser({commit}, user) {
      commit('SET_USER', user)
    },
    updateUserPreserveAdmin({commit}, userData) {
      commit('UPDATE_USER_PRESERVE_ADMIN', userData)
    },
    logout({commit}) {
      commit('CLEAR_USER')
    }
  },
  getters: {
    user: state => state.user,
    userId: state => state.user ? state.user.id : null
  }
})

export default store 