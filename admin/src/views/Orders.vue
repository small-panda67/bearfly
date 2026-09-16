<template>
  <div class="orders-page">
    <div class="page-card">
      <!-- 搜索栏 -->
      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="搜索订单号/用户/跑腿员" clearable style="width: 240px" @keyup.enter="loadData" />
        <el-select v-model="query.type" placeholder="服务类型" clearable style="width: 140px">
          <el-option label="全部类型" value="" />
          <el-option label="快递代取" value="express" />
          <el-option label="食堂代购" value="canteen" />
          <el-option label="商超代购" value="supermarket" />
          <el-option label="代办事务" value="errand" />
          <el-option label="万能跑腿" value="other" />
        </el-select>
        <el-select v-model="query.status" placeholder="订单状态" clearable style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="待接单" value="pending" />
          <el-option label="待取货" value="picked" />
          <el-option label="配送中" value="delivering" />
          <el-option label="待确认" value="delivered" />
          <el-option label="已完成" value="completed" />
          <el-option label="已取消" value="cancelled" />
        </el-select>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
        <el-button type="success" @click="exportData">导出</el-button>
      </div>

      <!-- 表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="order_no" label="订单号" min-width="170" fixed />
        <el-table-column prop="type" label="服务类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ typeMap[row.type] || row.type }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="user_name" label="下单用户" width="100" />
        <el-table-column prop="rider_name" label="跑腿员" width="100">
          <template #default="{ row }">{{ row.rider_name || '-' }}</template>
        </el-table-column>
        <el-table-column prop="amount" label="金额" width="90" align="right">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] || row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="下单时间" min-width="160" />
        <el-table-column prop="delivered_at" label="完成时间" min-width="160">
          <template #default="{ row }">{{ row.delivered_at || '-' }}</template>
        </el-table-column>
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="contact(row)">联系</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>

    <!-- 订单详情抽屉 -->
    <el-drawer v-model="detailVisible" title="订单详情" size="50%">
      <div v-if="currentOrder" class="order-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="订单号">{{ currentOrder.order_no }}</el-descriptions-item>
          <el-descriptions-item label="服务类型">{{ typeMap[currentOrder.type] }}</el-descriptions-item>
          <el-descriptions-item label="下单用户">{{ currentOrder.user_name }}</el-descriptions-item>
          <el-descriptions-item label="跑腿员">{{ currentOrder.rider_name || '-' }}</el-descriptions-item>
          <el-descriptions-item label="订单金额">¥{{ currentOrder.amount }}</el-descriptions-item>
          <el-descriptions-item label="订单状态">
            <el-tag :type="statusTypeMap[currentOrder.status]">{{ statusMap[currentOrder.status] }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="取货地址" :span="2">{{ currentOrder.pickup_address }}</el-descriptions-item>
          <el-descriptions-item label="送达地址" :span="2">{{ currentOrder.delivery_address }}</el-descriptions-item>
          <el-descriptions-item label="物品描述" :span="2">{{ currentOrder.item_desc || '-' }}</el-descriptions-item>
          <el-descriptions-item label="备注" :span="2">{{ currentOrder.remark || '-' }}</el-descriptions-item>
          <el-descriptions-item label="下单时间">{{ currentOrder.created_at }}</el-descriptions-item>
          <el-descriptions-item label="完成时间">{{ currentOrder.delivered_at || '-' }}</el-descriptions-item>
        </el-descriptions>
      </div>
    </el-drawer>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getOrderList, getOrderDetail } from '@/api/orders'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const total = ref(0)
const tableData = ref([])
const detailVisible = ref(false)
const currentOrder = ref(null)

const query = reactive({
  keyword: '', type: '', status: '',
  page: 1, pageSize: 20
})

const typeMap = {
  express: '快递代取', canteen: '食堂代购',
  supermarket: '商超代购', errand: '代办事务', other: '万能跑腿'
}
const statusMap = {
  pending: '待接单', picked: '待取货', delivering: '配送中',
  delivered: '待确认', completed: '已完成', cancelled: '已取消'
}
const statusTypeMap = {
  pending: 'warning', picked: 'primary', delivering: 'primary',
  delivered: 'warning', completed: 'success', cancelled: 'info'
}

async function loadData() {
  loading.value = true
  try {
    const res = await getOrderList(query)
    if (res.code === 0) {
      tableData.value = res.data.list || []
      total.value = res.data.total || 0
    }
  } catch (err) {
    tableData.value = []
    total.value = 0
  } finally {
    loading.value = false
  }
}

function resetQuery() {
  query.keyword = ''
  query.type = ''
  query.status = ''
  query.page = 1
  loadData()
}

function exportData() {
  ElMessage.success('导出功能开发中')
}

async function viewDetail(row) {
  try {
    const res = await getOrderDetail(row.id)
    if (res.code === 0) {
      currentOrder.value = res.data
      detailVisible.value = true
    }
  } catch (err) {
    currentOrder.value = null
  }
}

function contact(row) {
  ElMessage.info(`联系用户：${row.user_name || '-'}`)
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.pagination {
  margin-top: 20px;
  display: flex;
  justify-content: flex-end;
}
.order-detail {
  padding: 0 20px;
}
</style>
