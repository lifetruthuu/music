<template>
  <div class="pagination-container" v-if="total > 0">
    <div class="pagination-wrapper">
      <!-- 上一页 -->
      <div 
        class="page-btn prev" 
        :class="{ disabled: currentPage === 1 }"
        @click="handlePrevPage"
      >
        <i class="el-icon-arrow-left"></i>
      </div>

      <!-- 页码按钮 -->
      <div class="page-numbers">
        <div
          v-for="num in displayedPages"
          :key="num"
          class="page-num"
          :class="{ 
            active: currentPage === num,
            'page-ellipsis': num === '...'
          }"
          @click="num !== '...' && handlePageChange(num)"
        >
          {{ num }}
        </div>
      </div>

      <!-- 下一页 -->
      <div 
        class="page-btn next"
        :class="{ disabled: currentPage === totalPages }"
        @click="handleNextPage"
      >
        <i class="el-icon-arrow-right"></i>
      </div>

      <!-- 跳转 -->
      <div class="page-jump">
        <span>跳转到</span>
        <el-input
          v-model.number="jumpPage"
          class="jump-input"
          @keyup.enter.native="handleJumpPage"
        ></el-input>
        <span>页</span>
      </div>

      <!-- 总数显示 -->
      <div class="total-info">
        共 {{ total }} 条
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Pagination',
  props: {
    total: {
      type: Number,
      required: true
    },
    pageSize: {
      type: Number,
      default: 10
    },
    currentPage: {
      type: Number,
      default: 1
    }
  },

  data() {
    return {
      jumpPage: ''
    }
  },

  computed: {
    totalPages() {
      return Math.ceil(this.total / this.pageSize)
    },

    displayedPages() {
      const pages = []
      const maxDisplayPages = 7 // 最多显示的页码数
      
      if (this.totalPages <= maxDisplayPages) {
        // 总页数较少时，显示所有页码
        for (let i = 1; i <= this.totalPages; i++) {
          pages.push(i)
        }
      } else {
        // 总页数较多时，显示部分页码
        if (this.currentPage <= 4) {
          // 当前页靠前
          for (let i = 1; i <= 5; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(this.totalPages)
        } else if (this.currentPage >= this.totalPages - 3) {
          // 当前页靠后
          pages.push(1)
          pages.push('...')
          for (let i = this.totalPages - 4; i <= this.totalPages; i++) {
            pages.push(i)
          }
        } else {
          // 当前页在中间
          pages.push(1)
          pages.push('...')
          for (let i = this.currentPage - 2; i <= this.currentPage + 2; i++) {
            pages.push(i)
          }
          pages.push('...')
          pages.push(this.totalPages)
        }
      }
      return pages
    }
  },

  methods: {
    handlePageChange(page) {
      if (page === this.currentPage) return
      this.$emit('update:currentPage', page)
      this.$emit('change', page)
    },

    handlePrevPage() {
      if (this.currentPage > 1) {
        this.handlePageChange(this.currentPage - 1)
      }
    },

    handleNextPage() {
      if (this.currentPage < this.totalPages) {
        this.handlePageChange(this.currentPage + 1)
      }
    },

    handleJumpPage() {
      const page = parseInt(this.jumpPage)
      if (page && page >= 1 && page <= this.totalPages) {
        this.handlePageChange(page)
      }
      this.jumpPage = ''
    }
  }
}
</script>

<style scoped>
.pagination-container {
  margin: 20px 0;
  display: flex;
  justify-content: center;
}

.pagination-wrapper {
  display: flex;
  align-items: center;
  background: #fff;
  padding: 8px 15px;
  border-radius: 25px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.page-numbers {
  display: flex;
  margin: 0 10px;
}

.page-num {
  min-width: 32px;
  height: 32px;
  margin: 0 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 14px;
  color: #606266;
}

.page-num:not(.page-ellipsis):hover {
  background-color: #f5f7fa;
  color: #409eff;
}

.page-num.active {
  background-color: #409eff;
  color: #fff;
}

.page-ellipsis {
  cursor: default;
}

.page-btn {
  width: 32px;
  height: 32px;
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #606266;
}

.page-btn:hover:not(.disabled) {
  background-color: #f5f7fa;
  color: #409eff;
}

.page-btn.disabled {
  cursor: not-allowed;
  color: #c0c4cc;
}

.page-jump {
  margin-left: 15px;
  display: flex;
  align-items: center;
  font-size: 14px;
  color: #606266;
}

.jump-input {
  width: 50px;
  margin: 0 8px;
}

.jump-input >>> .el-input__inner {
  height: 28px;
  line-height: 28px;
  text-align: center;
  padding: 0 5px;
}

.total-info {
  margin-left: 15px;
  font-size: 14px;
  color: #606266;
}

/* 添加动画效果 */
.page-num {
  position: relative;
  overflow: hidden;
}

.page-num::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  background: rgba(64, 158, 255, 0.1);
  border-radius: 50%;
  transform: translate(-50%, -50%);
  transition: width 0.3s, height 0.3s;
}

.page-num:hover::after {
  width: 100%;
  height: 100%;
  border-radius: 16px;
}

@media (max-width: 768px) {
  .pagination-wrapper {
    flex-wrap: wrap;
    justify-content: center;
    padding: 8px;
  }

  .page-jump, .total-info {
    margin-top: 10px;
    width: 100%;
    justify-content: center;
  }
}
</style> 