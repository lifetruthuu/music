<template>
  <el-dialog 
    title="用户画像分析" 
    :visible.sync="userHuaXiangdialogFormVisible" 
    :before-close="onClose"
    width="90%"
    fullscreen
    class="user-profile-dialog">
    <div class="user-profile-container">
      <!-- 顶部用户基本信息卡片 -->

      <!-- 图表区域 -->
      <div class="chart-section">
        <el-tabs v-model="activeTab" type="border-card" @tab-click="handleTabClick">
          <el-tab-pane label="活跃时间分析" name="activity">
            <el-row>
              <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                <div class="chart-card">
                  <div class="chart-header">
                    <h3>一周活跃时间热力图</h3>
                    <div class="chart-action">
                      <el-tooltip content="刷新数据" placement="top">
                        <el-button type="text" icon="el-icon-refresh" @click="refreshActivityData" :loading="chartLoading"></el-button>
                      </el-tooltip>
                    </div>
                  </div>
                  <div ref="workloadChart" class="chart-content" v-loading="chartLoading"></div>
                </div>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="标签分析" name="tags">
            <el-row>
              <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                <div class="chart-card">
                  <div class="chart-header">
                    <h3>用户标签雷达图</h3>
                    <div class="chart-action">
                      <el-tooltip content="刷新数据" placement="top">
                        <el-button type="text" icon="el-icon-refresh" @click="refreshTagData" :loading="chartLoading"></el-button>
                      </el-tooltip>
                    </div>
                  </div>
                  <div ref="titleEcharts" class="chart-content" v-loading="chartLoading"></div>
                </div>
              </el-col>
            </el-row>
          </el-tab-pane>
          
          <el-tab-pane label="情绪追踪" name="mood">
            <el-row>
              <el-col :xs="24" :sm="24" :md="24" :lg="24" :xl="24">
                <div class="chart-card">
                  <div class="chart-header">
                    <h3>用户情绪变化趋势</h3>
                    <div class="chart-action">
                      <el-tooltip content="刷新数据" placement="top">
                        <el-button type="text" icon="el-icon-refresh" @click="refreshMoodData" :loading="chartLoading"></el-button>
                      </el-tooltip>
                    </div>
                  </div>
                  <div ref="moodChart" class="chart-content" v-loading="chartLoading"></div>
                  <div class="chart-empty" v-if="!hasMoodData">
                    <i class="el-icon-data-analysis"></i>
                    <p>暂无情绪数据</p>
                  </div>
                </div>
              </el-col>
            </el-row>
          </el-tab-pane>
        </el-tabs>
      </div>
    </div>
  </el-dialog>
</template>

<script>
import http from '@/api/axios.js'; // 导入封装好的 http 模块
import * as echarts from 'echarts';
import api from "@/api/axios";
export default {
  props: {
    userHuaXiangdialogFormVisible: Boolean,
    userId: String
  },
  data() {
    return {
      weekDates:[],
      time: ['0:00' , '4:00', '8:00' , '12:00', '16:00', '20:00',  '23:00'],
      indicator:[],
      activeTab: 'activity',
      chartLoading: false,
      headerLoading: false,
      userInfo: {},
      hasMoodData: false,
      charts: {
        workloadChart: null,
        titleChart: null,
        moodChart: null
      }
    };
  },
  created() {
    this.getWeekDates();
  },
  mounted() {
    this.initData();
    this.handleResize();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.handleResize);
    // 销毁图表实例以防内存泄漏
    Object.values(this.charts).forEach(chart => {
      chart && chart.dispose();
    });
  },
  methods: {
    initData() {
      this.headerLoading = true;
      // 获取用户基本信息
      api.post('/api/user/get/', {
        id: this.userId
      }).then(res => {
        this.userInfo = res.data || {};
        this.headerLoading = false;
      }).catch(err => {
        this.headerLoading = false;
        console.error('获取用户信息失败:', err);
      });
      
      // 初始化所有图表数据
      this.refreshActivityData();
      this.refreshTagData();
      this.refreshMoodData();
    },
    handleResize() {
      // 窗口大小改变时重绘所有图表
      Object.values(this.charts).forEach(chart => {
        chart && chart.resize();
      });
    },
    handleTabClick() {
      // 延迟执行以确保DOM已更新
      this.$nextTick(() => {
        this.handleResize();
      });
    },
    refreshActivityData() {
      this.chartLoading = true;
      this.queryUserTimeWeek();
    },
    refreshTagData() {
      this.chartLoading = true;
      this.queryUserTitle();
    },
    refreshMoodData() {
      this.chartLoading = true;
      // 模拟情绪数据
      setTimeout(() => {
        this.chartLoading = false;
        this.hasMoodData = Math.random() > 0.3; // 随机决定是否有数据，仅用于演示
        if (this.hasMoodData) {
          this.initMoodChart();
        }
      }, 1000);
    },
    getWeekDates() {
      // 获取当前日期
      let currentDate = new Date();
      // 获取当前日期是星期几（0 表示周日，1 表示周一，以此类推）
      let currentDay = currentDate.getDay();
      // 计算本周一的日期
      let monday = new Date(currentDate);
      monday.setDate(currentDate.getDate() - (currentDay === 0 ? 6 : currentDay - 1));

      // 生成本周从周一到周日的日期列表
      this.weekDates = [];
      for (let i = 0; i < 7; i++) {
        let date = new Date(monday);
        date.setDate(monday.getDate() + i);
        // 格式化日期为 YYYY-MM-DD 格式
        let formattedDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        this.weekDates.push(formattedDate);
      }
    },
    queryUserTimeWeek(){
      api.post('/api/music/get_plays/',{
        userId: this.userId
      }).then(res => {
        this.chartLoading = false;
        this.zuzhuangData(res.list);
      }).catch(err => {
        this.chartLoading = false;
        console.error('获取活跃数据失败:', err);
      });
    },
    queryUserTitle(){
      api.post('/api/music/get_title/',{
        userId: this.userId
      }).then(res => {
        this.chartLoading = false;
        this.initCharts1(res.list, res.list_title);
      }).catch(err => {
        this.chartLoading = false;
        console.error('获取标签数据失败:', err);
      });
    },
    zuzhuangData(res){
      this.initCharts(res);
    },
    timeToMinutes(timeStr) {
      let [hours, minutes] = timeStr.split(':').map(Number);
      return hours * 60 + minutes;
    },
    initCharts(list) {
      let data = [];
      for (let i = 0; i < this.weekDates.length; i++) { // 7 天
        let dateArray = list.filter(item => item.riqi === this.weekDates[i]);
        if(!dateArray || dateArray.length == 0){
          continue;
        }
        for (let j = 0; j < this.time.length; j++) { // 24 小时
          let end = null;
          if(j == this.time.length-1){
            end = '24:00';
          }else{
            end = this.timeToMinutes(this.time[j + 1]);
          }
          let start = this.timeToMinutes(this.time[j]);
          for (let k = 0; k < dateArray.length; k++) {
            let dateArrayElement = this.timeToMinutes(dateArray[k].hourMin);
            if (dateArrayElement > start && dateArrayElement <= end) {
              data.push([ i, j, 1]);
            }
          }
        }
      }
      
      // 如果已存在图表实例，销毁它
      if (this.charts.workloadChart) {
        this.charts.workloadChart.dispose();
      }
      
      // 创建新图表
      this.charts.workloadChart = echarts.init(this.$refs.workloadChart);
      
      const option = {
        title: {
          text: '用户一周活跃时间热力图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          position: 'top',
          formatter: (params) => {
            const dayIndex = params.data[0];
            const timeIndex = params.data[1];
            return `${this.weekDates[dayIndex]}<br>${this.time[timeIndex]}-${timeIndex < this.time.length - 1 ? this.time[timeIndex + 1] : '24:00'}<br>活跃度: ${params.data[2]}`;
          }
        },
        grid: {
          left: '5%',
          right: '5%',
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: this.time,
          axisLabel: {
            show: true,
            interval: 0,
            rotate: 45,
            fontSize: 12,
            margin: 10
          },
          splitArea: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: this.weekDates.map(date => {
            const d = new Date(date);
            const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
            return `${date.slice(5)} ${weekdays[d.getDay()]}`;
          }),
          splitArea: {
            show: true
          }
        },
        visualMap: {
          min: 0,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: ['#e6f7ff', '#1890ff', '#002766']
          }
        },
        series: [{
          name: '活跃程度',
          type: 'heatmap',
          data: data,
          label: {
            show: false
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }],
        animation: true
      };
      
      this.charts.workloadChart.setOption(option);
    },
    initCharts1(list, list_title) {
      this.indicator = [];
      let values = [];
      for (let i = 0; i < list_title.length; i++) {
        this.indicator.push({name: list_title[i].name, max: 10 });
        let value = 0;
        let filter = list.filter(item => item.name === list_title[i].name);
        if(filter && filter.length > 0){
          value = filter[0].count;
        }
        values.push(value);
      }
      
      // 如果已存在图表实例，销毁它
      if (this.charts.titleChart) {
        this.charts.titleChart.dispose();
      }
      
      // 创建新图表
      this.charts.titleChart = echarts.init(this.$refs.titleEcharts);
      
      const option = {
        title: {
          text: '用户标签雷达图',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {},
        radar: {
          indicator: this.indicator,
          splitArea: {
            areaStyle: {
              color: ['rgba(255, 255, 255, 0.5)']
            }
          },
          axisLine: {
            lineStyle: {
              color: '#999'
            }
          },
          splitLine: {
            lineStyle: {
              color: '#ddd'
            }
          }
        },
        series: [
          {
            name: '用户标签分析',
            type: 'radar',
            data: [
              {
                value: values,
                name: '兴趣偏好',
                areaStyle: {
                  color: 'rgba(64, 158, 255, 0.6)'
                },
                lineStyle: {
                  color: '#409EFF'
                },
                itemStyle: {
                  color: '#409EFF'
                }
              }
            ],
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 0, 0, 0.3)'
              }
            }
          }
        ],
        animation: true
      };
      
      this.charts.titleChart.setOption(option);
    },
    initMoodChart() {
      // 模拟情绪数据
      const dates = [];
      const moodData = [];
      const now = new Date();
      
      for (let i = 14; i >= 0; i--) {
        const date = new Date();
        date.setDate(now.getDate() - i);
        dates.push(`${date.getMonth() + 1}/${date.getDate()}`);
        
        // 模拟情绪数值 (范围: 1-10)
        moodData.push(Math.floor(Math.random() * 10) + 1);
      }
      
      // 如果已存在图表实例，销毁它
      if (this.charts.moodChart) {
        this.charts.moodChart.dispose();
      }
      
      // 创建新图表
      this.charts.moodChart = echarts.init(this.$refs.moodChart);
      
      const option = {
        title: {
          text: '最近两周情绪变化趋势',
          left: 'center',
          textStyle: {
            fontSize: 16,
            fontWeight: 'normal'
          }
        },
        tooltip: {
          trigger: 'axis',
          formatter: '{b}: {c} 分'
        },
        xAxis: {
          type: 'category',
          data: dates,
          axisLabel: {
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          min: 0,
          max: 10,
          name: '情绪评分',
          nameLocation: 'end'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '15%',
          containLabel: true
        },
        series: [
          {
            data: moodData,
            type: 'line',
            smooth: true,
            lineStyle: {
              width: 3,
              color: '#5470c6'
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(84,112,198,0.5)' },
                  { offset: 1, color: 'rgba(84,112,198,0.1)' }
                ]
              }
            },
            markPoint: {
              data: [
                { type: 'max', name: '最高' },
                { type: 'min', name: '最低' }
              ]
            },
            markLine: {
              data: [{ type: 'average', name: '平均' }]
            }
          }
        ],
        animation: true
      };
      
      this.charts.moodChart.setOption(option);
    },
    onClose() {
      this.$emit('onCloseUserInFoDialog', false);
    },
  }
}
</script>

<style scoped>
.user-profile-dialog >>> .el-dialog {
  margin-top: 3vh !important;
}

.user-profile-container {
  padding: 0;
  height: 90vh;
  display: flex;
  flex-direction: column;
}

.profile-header {
  margin-bottom: 20px;
}

.profile-header-content {
  display: flex;
  align-items: center;
}

.user-avatar {
  margin-right: 30px;
}

.user-info h2 {
  margin-top: 0;
  margin-bottom: 15px;
  font-size: 22px;
  color: #303133;
}

.nickname {
  font-size: 16px;
  color: #909399;
  font-weight: normal;
}

.user-stats {
  display: flex;
  flex-wrap: wrap;
}

.stat-item {
  margin-right: 20px;
  margin-bottom: 10px;
  color: #606266;
}

.stat-item i {
  margin-right: 5px;
}

.chart-section {
  flex: 1;
  overflow: auto;
}

.chart-card {
  background-color: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
  position: relative;
  height: 500px;
}

.chart-header {
  padding: 15px 20px;
  border-bottom: 1px solid #ebeef5;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.chart-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
  color: #303133;
}

.chart-content {
  height: calc(100% - 52px);
  width: 100%;
}

.chart-empty {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #909399;
}

.chart-empty i {
  font-size: 48px;
  margin-bottom: 10px;
}

/* 标签页动画 */
.el-tabs >>> .el-tabs__item {
  transition: all 0.3s ease;
}

.el-tabs >>> .el-tabs__item.is-active {
  transform: translateY(-2px);
}

/* 响应式调整 */
@media screen and (max-width: 768px) {
  .profile-header-content {
    flex-direction: column;
    text-align: center;
  }
  
  .user-avatar {
    margin-right: 0;
    margin-bottom: 15px;
  }
  
  .user-stats {
    justify-content: center;
  }
  
  .chart-card {
    height: 350px;
  }
}
</style>