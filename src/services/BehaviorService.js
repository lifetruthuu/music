import api from "@/api/axios";

export default {
  // 记录用户行为
  recordBehavior(params) {
    // 克隆参数对象，避免修改原始对象
    const apiParams = { ...params };
    
    // 如果存在user_id，转换为userId
    if (apiParams.user_id) {
      apiParams.userId = apiParams.user_id;
      delete apiParams.user_id;
    }
    
    // 如果存在music_id，转换为musicId
    if (apiParams.music_id) {
      apiParams.musicId = apiParams.music_id;
      delete apiParams.music_id;
    }
    
    return api.post('/api/user/record_behavior/', {
      ...apiParams,
      timestamp: new Date().toISOString(),
      session_id: this.getSessionId(),
      device_type: this.getDeviceType(),
      time_of_day: this.getTimeOfDay(),
      day_of_week: new Date().getDay()
    });
  },
  
  // 记录推荐反馈
  recordFeedback(song, feedbackType, position, userId) {
    return api.post('/api/user/record_feedback/', {
      userId: userId,
      musicId: song.id,
      recommendation_type: song.source || 'hybrid',
      feedback_type: feedbackType,
      recommendation_position: position,
      timestamp: new Date().toISOString()
    });
  },
  
  // 记录播放数据
  recordPlay(song, userId, action, duration = 0, completionRate = 0) {
    const now = new Date();
    return api.post('/api/music/play/', {
      musicId: song.id,
      userId: userId,
      play_time: now.toISOString(),
      date: now.toISOString().split('T')[0],
      hour_min: `${now.getHours()}:${now.getMinutes()}`,
      play_duration: duration,
      play_completion_rate: completionRate,
      player_action: action,
      device_type: this.getDeviceType()
    });
  },
  
  // 获取或创建会话ID
  getSessionId() {
    if (!localStorage.getItem('session_id')) {
      localStorage.setItem('session_id', 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9));
    }
    return localStorage.getItem('session_id');
  },
  
  // 获取设备类型
  getDeviceType() {
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    if (/tablet/i.test(ua)) return 'tablet';
    return 'desktop';
  },
  
  // 获取一天中的时段
  getTimeOfDay() {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}; 