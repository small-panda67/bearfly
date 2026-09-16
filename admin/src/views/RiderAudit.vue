<template>
  <div class="rider-audit-page">
    <div class="page-card">
      <div class="card-header">
        <span class="card-title">跑腿员入驻审核</span>
        <el-tag type="warning">待审核 {{ pendingCount }} 条</el-tag>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="申请ID" width="80" />
        <el-table-column prop="name" label="姓名" width="100" />
        <el-table-column prop="phone" label="手机号" width="140" />
        <el-table-column prop="campus" label="校区" width="100" />
        <el-table-column prop="student_id" label="学号" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="申请时间" min-width="160" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <template v-if="row.status === 'pending'">
              <el-button type="success" link size="small" @click="audit(row, 'approved')">通过</el-button>
              <el-button type="danger" link size="small" @click="audit(row, 'rejected')">拒绝</el-button>
            </template>
            <el-button type="primary" link size="small" v-else @click="viewDetail(row)">查看</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 审核弹窗 -->
    <el-dialog v-model="auditVisible" :title="auditType === 'approved' ? '通过审核' : '拒绝审核'" width="400px">
      <el-form :model="auditForm" label-width="80px">
        <el-form-item label="审核意见" v-if="auditType === 'rejected'">
          <el-input v-model="auditForm.reason" type="textarea" :rows="3" placeholder="请输入拒绝原因" />
        </el-form-item>
        <el-form-item label="确认" v-else>
          <span>确认通过该跑腿员的入驻申请？</span>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="auditVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmAudit">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { getRiderApplications, auditRiderApplication } from '@/api/riders'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const auditVisible = ref(false)
const auditType = ref('')
const currentRow = ref(null)

const auditForm = reactive({ reason: '' })

const statusMap = { pending: '待审核', approved: '已通过', rejected: '已拒绝' }
const statusTypeMap = { pending: 'warning', approved: 'success', rejected: 'danger' }

const pendingCount = computed(() => tableData.value.filter(r => r.status === 'pending').length)

async function loadData() {
  loading.value = true
  try {
    const res = await getRiderApplications()
    if (res.code === 0) {
      tableData.value = res.data || []
    }
  } catch (err) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function audit(row, type) {
  currentRow.value = row
  auditType.value = type
  auditForm.reason = ''
  auditVisible.value = true
}

async function confirmAudit() {
  if (auditType.value === 'rejected' && !auditForm.reason) {
    ElMessage.warning('请输入拒绝原因')
    return
  }
  try {
    await auditRiderApplication(currentRow.value.id, {
      status: auditType.value,
      reason: auditForm.reason
    })
    ElMessage.success(auditType.value === 'approved' ? '已通过审核' : '已拒绝')
    auditVisible.value = false
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function viewDetail(row) {
  ElMessage.info(`查看申请 ${row.id} 详情`)
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
}
</style>
