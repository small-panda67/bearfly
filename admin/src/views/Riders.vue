<template>
  <div class="riders-page">
    <div class="page-card">
      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="搜索姓名/手机号/骑手ID" clearable style="width: 240px" @keyup.enter="loadData" />
        <el-select v-model="query.campus" placeholder="所属校区" clearable style="width: 140px">
          <el-option label="全部校区" value="" />
          <el-option label="主校区" value="主校区" />
          <el-option label="东校区" value="东校区" />
          <el-option label="西校区" value="西校区" />
        </el-select>
        <el-select v-model="query.status" placeholder="在线状态" clearable style="width: 120px">
          <el-option label="全部状态" value="" />
          <el-option label="在线" value="online" />
          <el-option label="休息" value="rest" />
          <el-option label="离线" value="offline" />
        </el-select>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="骑手ID" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="level" label="等级" width="80" align="center">
          <template #default="{ row }">
            <el-tag type="warning" size="small">Lv.{{ row.level }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="rating" label="评分" width="90" align="center">
          <template #default="{ row }">⭐ {{ row.rating }}</template>
        </el-table-column>
        <el-table-column prop="total_orders" label="完成单量" width="100" align="center" />
        <el-table-column prop="total_income" label="累计收入" width="110" align="right">
          <template #default="{ row }">¥{{ row.total_income }}</template>
        </el-table-column>
        <el-table-column prop="is_online" label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.is_online ? 'success' : 'info'" size="small">
              {{ row.is_online ? '在线' : '离线' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button type="primary" link size="small" @click="viewIncome(row)">收入</el-button>
            <el-button type="danger" link size="small" @click="disableRider(row)">禁用</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination">
        <el-pagination
          v-model:current-page="query.page"
          v-model:page-size="query.pageSize"
          :page-sizes="[10, 20, 50]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getRiderList, updateRiderStatus } from '@/api/riders'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const total = ref(0)
const tableData = ref([])

const query = reactive({
  keyword: '', campus: '', status: '',
  page: 1, pageSize: 20
})

async function loadData() {
  loading.value = true
  try {
    const res = await getRiderList(query)
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
  query.campus = ''
  query.status = ''
  query.page = 1
  loadData()
}

function viewDetail(row) {
  ElMessage.info(`查看跑腿员 ${row.name} 详情`)
}

function viewIncome(row) {
  ElMessage.info(`查看 ${row.name} 的收入明细`)
}

function disableRider(row) {
  ElMessageBox.confirm(`确定禁用跑腿员 ${row.name}？禁用后将无法接单。`, '提示', { type: 'warning' })
    .then(async () => {
      try {
        await updateRiderStatus(row.id, 'disabled')
        ElMessage.success('已禁用')
        loadData()
      } catch (err) {
        // 错误已在拦截器处理
      }
    })
    .catch(() => {})
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
</style>
