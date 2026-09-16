<template>
  <div class="users-page">
    <div class="page-card">
      <div class="search-bar">
        <el-input v-model="query.keyword" placeholder="搜索用户名/手机号/用户ID" clearable style="width: 240px" @keyup.enter="loadData" />
        <el-select v-model="query.campus" placeholder="所属校区" clearable style="width: 140px">
          <el-option label="全部校区" value="" />
          <el-option label="主校区" value="主校区" />
          <el-option label="东校区" value="东校区" />
          <el-option label="西校区" value="西校区" />
        </el-select>
        <el-select v-model="query.status" placeholder="用户状态" clearable style="width: 120px">
          <el-option label="全部状态" value="" />
          <el-option label="正常" value="normal" />
          <el-option label="冻结" value="frozen" />
        </el-select>
        <el-button type="primary" @click="loadData">搜索</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="用户ID" width="80" />
        <el-table-column prop="nickname" label="昵称" width="120" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="campus" label="所属校区" width="100" />
        <el-table-column prop="role" label="角色" width="90">
          <template #default="{ row }">
            <el-tag :type="row.role === 'rider' ? 'success' : 'primary'" size="small">
              {{ row.role === 'rider' ? '跑腿员' : '普通用户' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="order_count" label="订单数" width="90" align="center">
          <template #default="{ row }">{{ row.order_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
              {{ row.status === 'normal' ? '正常' : '冻结' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="注册时间" min-width="160" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
            <el-button :type="row.status === 'normal' ? 'danger' : 'success'" link size="small" @click="toggleStatus(row)">
              {{ row.status === 'normal' ? '冻结' : '解冻' }}
            </el-button>
          </template>
        </el-table-column>
      </el-table>

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
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getUserList, updateUserStatus } from '@/api/users'
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
    const res = await getUserList(query)
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
  ElMessage.info(`查看用户 ${row.nickname} 详情`)
}

async function toggleStatus(row) {
  const action = row.status === 'normal' ? '冻结' : '解冻'
  try {
    await ElMessageBox.confirm(`确定${action}用户 ${row.nickname}？`, '提示', { type: 'warning' })
    const newStatus = row.status === 'normal' ? 'frozen' : 'normal'
    await updateUserStatus(row.id, newStatus)
    row.status = newStatus
    ElMessage.success(`${action}成功`)
  } catch (err) {
    if (err !== 'cancel') {
      // 错误已在拦截器处理
    }
  }
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
