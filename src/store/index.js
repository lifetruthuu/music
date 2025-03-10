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
      
      // 保存当前的心情状态和活动状态
      const currentMood = currentUser?.mood
      const currentActivity = currentUser?.activity
      console.log('Vuex: 更新用户前的心情:', currentMood, '活动:', currentActivity)
      

      // 创建新的用户对象，合并传入的数据
      const updatedUser = { ...userData }
      
      // 如果当前是管理员，保留ID为1
      if (isAdmin) {
        updatedUser.id = '1'
      }
      
      // 如果新对象没有心情字段但原对象有，则保留原有的心情字段
      if (!updatedUser.mood && currentMood) {
        updatedUser.mood = currentMood
        console.log('Vuex: 保留原有心情:', currentMood)
      }
      
      // 如果新对象没有活动字段但原对象有，则保留原有的活动字段
      if (!updatedUser.activity && currentActivity) {
        updatedUser.activity = currentActivity
        console.log('Vuex: 保留原有活动:', currentActivity)
      }
      
      console.log('Vuex: 最终更新的用户状态 - 心情:', updatedUser.mood, '活动:', updatedUser.activity)
      
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