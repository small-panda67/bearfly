<template>
  <div class="coupons-page">
    <div class="page-card">
      <div class="search-bar">
        <el-select v-model="query.status" placeholder="状态" clearable style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="进行中" value="active" />
          <el-option label="已结束" value="inactive" />
          <el-option label="未开始" value="pending" />
        </el-select>
        <el-button type="primary" @click="addCoupon">+ 创建优惠券</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="name" label="优惠券名称" min-width="160" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type]" size="small">{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="amount" label="面额/折扣" width="110" align="center">
          <template #default="{ row }">
            {{ row.type === 'discount' ? `${row.amount}折` : `¥${row.amount}` }}
          </template>
        </el-table-column>
        <el-table-column prop="threshold" label="使用门槛" width="100" align="center">
          <template #default="{ row }">{{ row.threshold > 0 ? `满${row.threshold}元` : '无门槛' }}</template>
        </el-table-column>
        <el-table-column prop="total_count" label="发放数量" width="100" align="center" />
        <el-table-column prop="used_count" label="已领取" width="90" align="center" />
        <el-table-column prop="used_count" label="已使用" width="90" align="center" />
        <el-table-column label="有效期" min-width="220">
          <template #default="{ row }">{{ row.start_at }} ~ {{ row.expire_at }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editCoupon(row)">详情</el-button>
            <el-button type="danger" link size="small" v-if="row.status === 'active'" @click="stopCoupon(row)">停用</el-button>
            <el-button type="primary" link size="small" v-else @click="editCoupon(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑优惠券' : '创建优惠券'" width="550px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="优惠券名称">
          <el-input v-model="form.name" placeholder="请输入优惠券名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type">
            <el-radio value="fixed">满减券</el-radio>
            <el-radio value="discount">折扣券</el-radio>
            <el-radio value="category">品类券</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item :label="form.type === 'discount' ? '折扣(折)' : '面额(元)'">
          <el-input-number v-model="form.amount" :min="0" :precision="form.type === 'discount' ? 1 : 2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="使用门槛(元)">
          <el-input-number v-model="form.threshold" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="发放数量">
          <el-input-number v-model="form.total_count" :min="1" style="width: 100%" />
        </el-form-item>
        <el-form-item label="有效期">
          <el-date-picker v-model="form.dateRange" type="daterange" range-separator="至" start-placeholder="开始日期" end-placeholder="结束日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="适用范围">
          <el-select v-model="form.scope" style="width: 100%">
            <el-option label="全部服务" value="all" />
            <el-option label="仅快递代取" value="express" />
            <el-option label="仅食堂代购" value="canteen" />
            <el-option label="仅商超代购" value="supermarket" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCoupon">{{ isEdit ? '保存' : '创建' }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCouponList, createCoupon, updateCoupon, updateCouponStatus } from '@/api/coupons'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const query = reactive({ status: '' })
const form = reactive({
  name: '', type: 'fixed', amount: 5, threshold: 10,
  total_count: 100, dateRange: [], scope: 'all'
})

const typeMap = { fixed: '满减券', discount: '折扣券', category: '品类券' }
const typeTagMap = { fixed: 'primary', discount: 'warning', category: 'success' }
const statusMap = { active: '进行中', inactive: '已结束', pending: '未开始' }
const statusTypeMap = { active: 'success', inactive: 'info', pending: 'warning' }

async function loadData() {
  loading.value = true
  try {
    const res = await getCouponList(query)
    if (res.code === 0) {
      tableData.value = res.data || []
    }
  } catch (err) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function addCoupon() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { name: '', type: 'fixed', amount: 5, threshold: 10, total_count: 100, dateRange: [], scope: 'all' })
  dialogVisible.value = true
}

function editCoupon(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, {
    name: row.name, type: row.type, amount: row.amount,
    threshold: row.threshold, total_count: row.total_count,
    dateRange: row.start_at && row.expire_at ? [row.start_at, row.expire_at] : [],
    scope: row.scope || 'all'
  })
  dialogVisible.value = true
}

async function stopCoupon(row) {
  try {
    await ElMessageBox.confirm(`确定停用优惠券 ${row.name}？`, '提示', { type: 'warning' })
    await updateCouponStatus(row.id, { status: 'inactive' })
    ElMessage.success('已停用')
    loadData()
  } catch (err) {
    if (err !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
}

async function saveCoupon() {
  if (!form.name) {
    ElMessage.warning('请输入优惠券名称')
    return
  }
  const start_at = form.dateRange && form.dateRange[0] ? form.dateRange[0] : ''
  const expire_at = form.dateRange && form.dateRange[1] ? form.dateRange[1] : ''
  try {
    if (isEdit.value) {
      await updateCoupon(editId.value, {
        name: form.name, type: form.type, amount: form.amount,
        threshold: form.threshold, total_count: form.total_count,
        start_at, expire_at, scope: form.scope
      })
    } else {
      await createCoupon({
        name: form.name, type: form.type, amount: form.amount,
        threshold: form.threshold, total_count: form.total_count,
        start_at, expire_at, scope: form.scope
      })
    }
    dialogVisible.value = false
    ElMessage.success(isEdit.value ? '保存成功' : '创建成功')
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadData()
})
</script>
