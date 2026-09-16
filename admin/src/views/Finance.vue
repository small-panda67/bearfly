<template>
  <div class="finance-page">
    <!-- 统计卡片 -->
    <el-row :gutter="20" class="stats-row">
      <el-col :span="6">
        <div class="stat-card blue">
          <div class="stat-label">今日交易额</div>
          <div class="stat-value">¥{{ summary.todayGmv }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card green">
          <div class="stat-label">平台收入(10%)</div>
          <div class="stat-value">¥{{ summary.platformIncome }}</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card orange">
          <div class="stat-label">待审核提现</div>
          <div class="stat-value">{{ summary.pendingWithdrawals }}笔</div>
        </div>
      </el-col>
      <el-col :span="6">
        <div class="stat-card purple">
          <div class="stat-label">本月交易额</div>
          <div class="stat-value">¥{{ summary.monthGmv }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- 提现审核 -->
    <div class="page-card">
      <div class="card-header">
        <span class="card-title">提现审核</span>
        <el-button type="success" size="small" @click="batchApprove">批量通过</el-button>
      </div>
        <el-table :data="withdrawals" v-loading="loading" border stripe style="width: 100%" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="50" />
        <el-table-column prop="id" label="申请编号" width="100" />
        <el-table-column prop="rider_name" label="跑腿员" width="100" />
        <el-table-column prop="amount" label="提现金额" width="110" align="right">
          <template #default="{ row }">¥{{ row.amount }}</template>
        </el-table-column>
        <el-table-column prop="pay_method" label="提现方式" width="100">
          <template #default="{ row }">{{ row.pay_method === 'wechat' ? '微信钱包' : row.pay_method }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" min-width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="auditWithdraw(row, 'approved')">通过</el-button>
              <el-button type="danger" link size="small" @click="auditWithdraw(row, 'rejected')">拒绝</el-button>
            </template>
            <el-button type="primary" link size="small" v-else>详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 交易流水 -->
    <div class="page-card">
      <div class="card-header">
        <span class="card-title">交易流水</span>
      </div>
      <el-table :data="transactions" v-loading="txLoading" border stripe style="width: 100%">
        <el-table-column prop="id" label="流水号" width="100" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === 'income' ? 'success' : 'danger'" size="small">
              {{ row.type === 'income' ? '收入' : '支出' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="source" label="来源" width="120" />
        <el-table-column prop="amount" label="金额" width="110" align="right">
          <template #default="{ row }">
            <span :class="row.type === 'income' ? 'text-success' : 'text-danger'">
              {{ row.type === 'income' ? '+' : '-' }}¥{{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="200" />
        <el-table-column prop="created_at" label="时间" min-width="160" />
      </el-table>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getFinanceSummary,
  getWithdrawalList,
  auditWithdrawal as auditApi,
  batchAuditWithdrawals,
  getTransactionList
} from '@/api/finance'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const txLoading = ref(false)
const withdrawals = ref([])
const transactions = ref([])
const selectedWithdrawals = ref([])
const summary = reactive({
  todayGmv: 0,
  platformIncome: 0,
  pendingWithdrawals: 0,
  monthGmv: 0
})

const statusMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝', paid: '已打款', failed: '失败' }
const statusTypeMap = { pending: 'warning', approved: 'success', rejected: 'danger', paid: 'primary', failed: 'info' }

const pendingCount = computed(() => withdrawals.value.filter(w => w.status === 'pending').length)

async function loadSummary() {
  try {
    const res = await getFinanceSummary()
    if (res.code === 0 && res.data) {
      Object.assign(summary, res.data)
    }
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function handleSelectionChange(rows) {
  selectedWithdrawals.value = rows.filter(row => row.status === 'pending')
}

async function loadWithdrawals() {
  loading.value = true
  try {
    const res = await getWithdrawalList()
    if (res.code === 0) withdrawals.value = res.data || []
  } catch (err) {
    withdrawals.value = []
  } finally {
    loading.value = false
  }
}

async function loadTransactions() {
  txLoading.value = true
  try {
    const res = await getTransactionList()
    if (res.code === 0) transactions.value = res.data || []
  } catch (err) {
    transactions.value = []
  } finally {
    txLoading.value = false
  }
}

function auditWithdraw(row, type) {
  ElMessageBox.confirm(`确定${type === 'approved' ? '通过' : '拒绝'}该提现申请？`, '提示', { type: 'warning' })
    .then(async () => {
      try {
        await auditApi(row.id, { status: type, reason: '' })
        ElMessage.success('操作成功')
        loadWithdrawals()
      } catch (err) {
        // 错误已在拦截器处理
      }
    })
    .catch(() => {})
}

async function batchApprove() {
  if (!selectedWithdrawals.value.length) {
    ElMessage.warning('请选择待审核的提现记录')
    return
  }
  try {
    await ElMessageBox.confirm(`确定批量通过 ${selectedWithdrawals.value.length} 条提现申请？`, '提示', { type: 'warning' })
    await batchAuditWithdrawals({
      ids: selectedWithdrawals.value.map(item => item.id),
      status: 'approved',
      reason: '批量审核通过'
    })
    ElMessage.success('批量审核完成')
    loadWithdrawals()
    loadSummary()
  } catch (err) {
    if (err !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

onMounted(() => {
  loadSummary()
  loadWithdrawals()
  loadTransactions()
})
</script>

<style scoped lang="scss">
.stats-row {
  margin-bottom: 20px;
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
}
.text-success { color: #67c23a; }
.text-danger { color: #f56c6c; }
</style>
