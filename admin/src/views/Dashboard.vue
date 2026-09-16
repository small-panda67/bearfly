<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6" v-for="stat in stats" :key="stat.label">
        <div class="stat-card" :class="stat.color">
          <div class="stat-label">{{ stat.label }}</div>
          <div class="stat-value">{{ stat.value }}</div>
          <div class="stat-change" :class="stat.trend > 0 ? 'up' : 'down'">
            {{ stat.trend > 0 ? '↑' : '↓' }} {{ Math.abs(stat.trend) }}% 较昨日
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 图表区域 -->
    <el-row :gutter="20">
      <el-col :span="16">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">近7日订单趋势</span>
            <el-radio-group v-model="trendDays" size="small" @change="loadTrend">
              <el-radio-button :value="7">7天</el-radio-button>
              <el-radio-button :value="14">14天</el-radio-button>
              <el-radio-button :value="30">30天</el-radio-button>
            </el-radio-group>
          </div>
          <v-chart class="chart" :option="trendOption" autoresize />
        </div>
      </el-col>
      <el-col :span="8">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">服务类型占比</span>
          </div>
          <v-chart class="chart" :option="pieOption" autoresize />
        </div>
      </el-col>
    </el-row>

    <!-- 待办与最新订单 -->
    <el-row :gutter="20">
      <el-col :span="10">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">待处理事项</span>
            <el-badge :value="totalTodos" class="todo-badge" />
          </div>
          <el-table :data="todos" style="width: 100%">
            <el-table-column prop="name" label="类型" min-width="120">
              <template #default="{ row }">
                <el-tag :type="row.tagType" size="small">{{ row.name }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="desc" label="说明" min-width="140" />
            <el-table-column prop="count" label="数量" width="80" align="center">
              <template #default="{ row }">
                <el-badge :value="row.count" :type="row.count > 0 ? 'danger' : 'info'" />
              </template>
            </el-table-column>
            <el-table-column label="操作" width="80" align="center">
              <template #default="{ row }">
                <el-button type="primary" link size="small" @click="handleTodo(row)">去处理</el-button>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </el-col>
      <el-col :span="14">
        <div class="page-card">
          <div class="card-header">
            <span class="card-title">最新订单</span>
            <el-button type="primary" link size="small" @click="$router.push('/orders')">查看全部</el-button>
          </div>
          <el-table :data="latestOrders" style="width: 100%" v-loading="loading">
            <el-table-column prop="order_no" label="订单号" min-width="160" />
            <el-table-column prop="type" label="类型" width="100">
              <template #default="{ row }">
                <el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="user_name" label="用户" width="100" />
            <el-table-column prop="amount" label="金额" width="90" align="right">
              <template #default="{ row }">¥{{ row.amount }}</template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="90">
              <template #default="{ row }">
                <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="created_at" label="下单时间" min-width="160" />
          </el-table>
        </div>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart, PieChart } from 'echarts/charts'
import {
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import { getDashboard, getOrderTrend, getServiceTypeStats } from '@/api/dashboard'
import { getOrderList } from '@/api/orders'
import { ElMessage } from 'element-plus'
import { useRouter } from 'vue-router'

const router = useRouter()

use([
  CanvasRenderer, LineChart, PieChart,
  TitleComponent, TooltipComponent, LegendComponent,
  GridComponent, DatasetComponent
])

const loading = ref(false)
const trendDays = ref(7)

const stats = reactive([
  { label: '今日订单', value: 0, trend: 0, color: 'blue' },
  { label: '今日交易额', value: '¥0', trend: 0, color: 'green' },
  { label: '新增用户', value: 0, trend: 0, color: 'orange' },
  { label: '活跃跑腿员', value: 0, trend: 0, color: 'purple' }
])

const todos = reactive([
  { name: '实名认证审核', desc: '待审核用户实名认证', count: 0, tagType: 'warning', path: '/users' },
  { name: '跑腿员入驻', desc: '待审核入驻申请', count: 0, tagType: 'primary', path: '/rider-audit' },
  { name: '投诉工单', desc: '待处理用户投诉', count: 0, tagType: 'danger', path: '/complaints' },
  { name: '提现审核', desc: '待审核跑腿员提现', count: 0, tagType: 'success', path: '/finance' }
])

const totalTodos = ref(0)
const latestOrders = ref([])

const typeMap = {
  express: '快递代取', canteen: '食堂代购',
  supermarket: '商超代购', errand: '代办事务', other: '万能跑腿'
}
const statusMap = {
  pending: '待接单', picked: '待取货', delivering: '配送中',
  completed: '已完成', cancelled: '已取消'
}
const statusTypeMap = {
  pending: 'warning', picked: 'primary', delivering: 'primary',
  completed: 'success', cancelled: 'info'
}

// 订单趋势图
const trendOption = reactive({
  tooltip: { trigger: 'axis' },
  legend: { data: ['订单量', '交易额'], right: 10 },
  grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
  xAxis: { type: 'category', boundaryGap: false, data: [] },
  yAxis: [
    { type: 'value', name: '订单量' },
    { type: 'value', name: '交易额(元)' }
  ],
  series: [
    { name: '订单量', type: 'line', smooth: true, data: [],
      areaStyle: { color: 'rgba(64,158,255,0.1)' },
      lineStyle: { color: '#409eff', width: 2 },
      itemStyle: { color: '#409eff' }
    },
    { name: '交易额', type: 'line', smooth: true, yAxisIndex: 1, data: [],
      areaStyle: { color: 'rgba(103,194,58,0.1)' },
      lineStyle: { color: '#67c23a', width: 2 },
      itemStyle: { color: '#67c23a' }
    }
  ]
})

// 服务类型饼图
const pieOption = reactive({
  tooltip: { trigger: 'item', formatter: '{b}: {c}单 ({d}%)' },
  legend: { orient: 'vertical', left: 'left' },
  series: [{
    type: 'pie',
    radius: ['40%', '70%'],
    avoidLabelOverlap: false,
    itemStyle: { borderRadius: 6, borderColor: '#fff', borderWidth: 2 },
    label: { show: false },
    emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
    data: []
  }]
})

async function loadDashboard() {
  try {
    const res = await getDashboard()
    if (res.code === 0) {
      const d = res.data
      stats[0].value = d.todayOrders || 0
      stats[1].value = `¥${d.todayGmv || 0}`
      stats[2].value = d.newUsers || 0
      stats[3].value = d.activeRiders || 0
      if (d.todos) {
        todos[0].count = d.todos.userAudit || 0
        todos[1].count = d.todos.riderAudit || 0
        todos[2].count = d.todos.complaint || 0
        todos[3].count = d.todos.withdraw || 0
        totalTodos.value = todos.reduce((sum, t) => sum + t.count, 0)
      }
    }
  } catch (err) {
    // 错误已在拦截器处理，数据保持空状态
  }
}

async function loadServiceTypeStats() {
  try {
    const res = await getServiceTypeStats()
    if (res.code === 0 && res.data) {
      pieOption.series[0].data = res.data
    }
  } catch (err) {
    // 错误已在拦截器处理，饼图保持空
  }
}

async function loadTrend() {
  try {
    const res = await getOrderTrend(trendDays.value)
    if (res.code === 0 && res.data) {
      trendOption.xAxis.data = res.data.dates || []
      trendOption.series[0].data = res.data.orders || []
      trendOption.series[1].data = res.data.gmv || []
    }
  } catch (err) {
    // 错误已在拦截器处理，图表保持空
  }
}

async function loadLatestOrders() {
  loading.value = true
  try {
    const res = await getOrderList({ page: 1, pageSize: 5 })
    if (res.code === 0) {
      latestOrders.value = res.data.list || []
    }
  } catch (err) {
    latestOrders.value = []
  } finally {
    loading.value = false
  }
}

function handleTodo(row) {
  if (row.path) {
    router.push(row.path)
  }
}

onMounted(() => {
  loadDashboard()
  loadTrend()
  loadServiceTypeStats()
  loadLatestOrders()
})
</script>

<style scoped lang="scss">
.dashboard {
  .stats-row {
    margin-bottom: 20px;
  }
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.card-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.chart {
  height: 320px;
}

.todo-badge {
  margin-right: 8px;
}
</style>
