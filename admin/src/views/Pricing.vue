<template>
  <div class="pricing-page">
    <div class="page-card">
      <div class="card-header">
        <span class="card-title">基础配送费配置</span>
        <el-button type="primary" size="small" @click="addPrice">新增配置</el-button>
      </div>
      <el-table :data="priceList" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="type" label="服务类型" width="120">
          <template #default="{ row }">{{ typeMap[row.type] || row.type }}</template>
        </el-table-column>
        <el-table-column prop="name" label="配置名称" min-width="140" />
        <el-table-column prop="base_price" label="起步价" width="100" align="right">
          <template #default="{ row }">¥{{ row.base_price }}</template>
        </el-table-column>
        <el-table-column prop="per_km" label="每公里加价" width="120" align="right">
          <template #default="{ row }">¥{{ row.per_km }}</template>
        </el-table-column>
        <el-table-column prop="description" label="描述" min-width="180" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.status" :active-value="'active'" :inactive-value="'inactive'" @change="toggleStatus(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="100" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editPrice(row)">编辑</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-row :gutter="20">
      <el-col :span="12">
        <div class="page-card">
          <div class="card-title">小费规则</div>
          <p style="color: #606266; margin-bottom: 12px">用户可选择给跑腿员的小费金额，全部归跑腿员所有，平台不抽成。</p>
          <el-tag v-for="t in tipOptions" :key="t" style="margin-right: 8px; margin-bottom: 8px">{{ t === 'custom' ? '自定义' : `¥${t}` }}</el-tag>
        </div>
      </el-col>
      <el-col :span="12">
        <div class="page-card">
          <div class="card-title">保价规则</div>
          <el-table :data="insuranceList" border size="small" style="width: 100%">
            <el-table-column prop="name" label="保价档位" />
            <el-table-column prop="fee" label="保价费" align="right" />
            <el-table-column prop="max_payout" label="最高赔付" align="right" />
          </el-table>
        </div>
      </el-col>
    </el-row>

    <!-- 编辑弹窗 -->
    <el-dialog v-model="editVisible" :title="isEdit ? '编辑价格配置' : '新增价格配置'" width="500px">
      <el-form :model="priceForm" label-width="100px">
        <el-form-item label="服务类型">
          <el-select v-model="priceForm.type" style="width: 100%">
            <el-option v-for="(v, k) in typeMap" :key="k" :label="v" :value="k" />
          </el-select>
        </el-form-item>
        <el-form-item label="配置名称">
          <el-input v-model="priceForm.name" placeholder="请输入配置名称" />
        </el-form-item>
        <el-form-item label="起步价(元)">
          <el-input-number v-model="priceForm.base_price" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="每公里加价(元)">
          <el-input-number v-model="priceForm.per_km" :min="0" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="priceForm.description" type="textarea" :rows="2" placeholder="请输入描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editVisible = false">取消</el-button>
        <el-button type="primary" @click="savePrice">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getPricingList, createPricing, updatePricing } from '@/api/pricing'
import { ElMessage } from 'element-plus'

const typeMap = { express: '快递代取', canteen: '食堂代购', supermarket: '商超代购', errand: '代办事务', other: '万能跑腿' }

const loading = ref(false)
const priceList = ref([])
const tipOptions = [1, 2, 3, 5, 10, 'custom']
const insuranceList = [
  { name: '基础保价', fee: '¥0.50', max_payout: '¥50' },
  { name: '标准保价', fee: '¥1.00', max_payout: '¥200' },
  { name: '高级保价', fee: '¥2.00', max_payout: '¥500' }
]

const editVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)
const priceForm = reactive({
  type: 'express', name: '', base_price: 3, per_km: 0.5, description: ''
})

async function loadData() {
  loading.value = true
  try {
    const res = await getPricingList()
    if (res.code === 0) {
      priceList.value = res.data || []
    }
  } catch (err) {
    priceList.value = []
  } finally {
    loading.value = false
  }
}

async function toggleStatus(row) {
  try {
    await updatePricing(row.id, { status: row.status })
    ElMessage.success(row.status === 'active' ? '已启用' : '已禁用')
  } catch (err) {
    row.status = row.status === 'active' ? 'inactive' : 'active'
  }
}

function editPrice(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(priceForm, {
    type: row.type,
    name: row.name || '',
    base_price: row.base_price,
    per_km: row.per_km,
    description: row.description || ''
  })
  editVisible.value = true
}

function addPrice() {
  isEdit.value = false
  editId.value = null
  Object.assign(priceForm, { type: 'express', name: '', base_price: 3, per_km: 0.5, description: '' })
  editVisible.value = true
}

async function savePrice() {
  try {
    if (isEdit.value) {
      await updatePricing(editId.value, { ...priceForm })
    } else {
      await createPricing({ ...priceForm, status: 'active' })
    }
    editVisible.value = false
    ElMessage.success('保存成功')
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 16px;
}
</style>
