<template>
  <el-dialog title="用户画像" style="width: 84%;margin-left: 70px"
             :visible.sync="userHuaXiangdialogFormVisible" :before-close="onClose">
    <div class="chart-container">
      <div ref="workloadChart" class="chart" style="width: 50%;height:  400px"></div>
      <div ref="titleEcharts" class="chart" style="width: 50%;height:  400px"></div>
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
      time: ['0:00' , '4:00',    '8:00' , '12:00',   '16:00',   '20:00',  '23:00'],
      indicator:[],
    };
  },
  created() {
    this.getWeekDates();
    this.queryUserTimeWeek();
    this.queryUserTitle();

  },
  methods: {
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
        this.zuzhuangData(res.list);
      }).catch(err => {
        console.error('删除失败:', err);
      });
    },
    queryUserTitle(){
      api.post('/api/music/get_title/',{
        userId: this.userId
      }).then(res => {
        this.initCharts1(res.list,res.list_title);
      }).catch(err => {
        console.error('删除失败:', err);
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
        if(!dateArray && dateArray.length == 0){
           continue
        }
        for (let j = 0; j < this.time.length; j++) { // 24 小时
          let end = null
          if(j == this.time.length-1){
            end = '24:00';
          }else{
            end = this.timeToMinutes(this.time[j + 1]);
          }
          let start = this.timeToMinutes(this.time[j]);
          for (let k = 0; k < dateArray.length; k++) {
            let dateArrayElement = this.timeToMinutes(dateArray[k].hourMin);
            if (dateArrayElement > start && dateArrayElement <= end) {
              data.push([ i,j, 1]);
            }
          }
        }
      }
      let workloadChart = echarts.init(this.$refs.workloadChart);
      workloadChart.setOption({
        title: {
          text: '用户一周活跃时间热力图', // 标题文本
          left: 'center' // 标题位置，这里设置为居中
        },
        grid: {
          left: '3%',
          right: '4%',
          // 增加 bottom 的值，为 X 轴标签留出更多空间
          bottom: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: ['0:00', '4:00', '8:00', '12:00', '16:00', '20:00', '23:00'],
          axisLabel: {
            show: true, // 确保标签显示
            interval: 0, // 显示所有标签
            rotate: 45, // 如果标签过长，可以旋转
            // 调整字体大小
            fontSize: 12,
            // 调整标签与坐标轴的间距
            margin: 10
          },
          splitArea: {
            show: true
          }
        },
        yAxis: {
          type: 'category',
          data: this.weekDates,
        },
        visualMap: {
          min: 0,
          max: 1,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%'
        },
        series: [{
          name: '活跃程度',
          type: 'heatmap',
          data: data
        }]
      });
    },
    initCharts1(list,list_title) {
      this.indicator = [];
      let values = [];
      for (let i = 0; i < list_title.length; i++) {
        this.indicator.push({name: list_title[i].name, max: 10 })
        let value = 0
        let filter = list.filter(item=>item.name === list_title[i].name);
        if(filter && filter.length >0 ){
          value = filter[0].count;
        }
        values.push(value)
      }


      let workloadChart = echarts.init(this.$refs.titleEcharts);
      workloadChart.setOption({
        title: {
          text: '用户标签雷达图',
          left: 'center' // 标题位置，这里设置为居中
        },

        radar: {
          indicator: this.indicator
        },
        series: [
          {
            name: 'Budget vs spending',
            type: 'radar',
            data: [

              {
                value: values,
                name: 'Actual Spending'
              }
            ]
          }
        ]
      });
    },
    onClose() {
      this.$emit('onCloseUserInFoDialog', false);
    },
  }
}
</script>
<style scoped>
.chart-container {
  /* 使用 flexbox 布局 */
  display: flex;
  /* 让子元素在一行显示 */
  flex-direction: row;
  /* 子元素之间有一定间距 */
  gap: 10px;
}

.chart {
  /* 可以根据需要调整宽度 */
  width: 50%;
}
</style>