<template>
  <div class="complaints-page">
    <div class="page-card">
      <div class="search-bar">
        <el-select v-model="query.status" placeholder="处理状态" clearable style="width: 140px">
          <el-option label="全部状态" value="" />
          <el-option label="待处理" value="pending" />
          <el-option label="处理中" value="processing" />
          <el-option label="已完成" value="resolved" />
        </el-select>
        <el-select v-model="query.type" placeholder="投诉类型" clearable style="width: 140px">
          <el-option label="全部类型" value="" />
          <el-option label="服务态度" value="attitude" />
          <el-option label="配送超时" value="timeout" />
          <el-option label="物品损坏" value="damage" />
          <el-option label="费用争议" value="fee" />
        </el-select>
        <el-button type="primary" @click="loadData">搜索</el-button>
      </div>

      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="工单号" width="80" />
        <el-table-column prop="type" label="投诉类型" width="110">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type]" size="small">{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="complainant_name" label="投诉人" width="100" />
        <el-table-column prop="respondent_name" label="被投诉人" width="100" />
        <el-table-column prop="order_no" label="关联订单" width="170" />
        <el-table-column prop="content" label="投诉内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTypeMap[row.status]" size="small">{{ statusMap[row.status] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="投诉时间" min-width="160" />
        <el-table-column label="操作" width="140" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="handleComplaint(row)">处理</el-button>
            <el-button type="primary" link size="small" @click="viewDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 处理弹窗 -->
    <el-dialog v-model="handleVisible" title="处理投诉" width="500px">
      <el-descriptions :column="1" border size="small" v-if="currentRow">
        <el-descriptions-item label="工单号">{{ currentRow.id }}</el-descriptions-item>
        <el-descriptions-item label="投诉内容">{{ currentRow.content }}</el-descriptions-item>
      </el-descriptions>
      <el-form :model="handleForm" label-width="80px" style="margin-top: 16px">
        <el-form-item label="处理结果">
          <el-input v-model="handleForm.result" type="textarea" :rows="3" placeholder="请输入处理结果" />
        </el-form-item>
        <el-form-item label="处罚措施">
          <el-select v-model="handleForm.punishment" placeholder="选择处罚措施" style="width: 100%">
            <el-option label="口头警告" value="warning" />
            <el-option label="罚款10元" value="fine_10" />
            <el-option label="暂停接单3天" value="suspend_3" />
            <el-option label="永久封禁" value="ban" />
            <el-option label="不处罚" value="none" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="handleVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmHandle">提交处理</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getComplaintList, handleComplaint as handleApi } from '@/api/complaints'
import { ElMessage } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const handleVisible = ref(false)
const currentRow = ref(null)

const query = reactive({ status: '', type: '' })
const handleForm = reactive({ result: '', punishment: '' })

const typeMap = { attitude: '服务态度', timeout: '配送超时', damage: '物品损坏', fee: '费用争议', other: '其他' }
const typeTagMap = { attitude: 'info', timeout: 'warning', damage: 'danger', fee: 'primary', other: 'info' }
const statusMap = { pending: '待处理', processing: '处理中', resolved: '已完成' }
const statusTypeMap = { pending: 'warning', processing: 'primary', resolved: 'success' }

async function loadData() {
  loading.value = true
  try {
    const res = await getComplaintList(query)
    if (res.code === 0) {
      tableData.value = res.data || []
    }
  } catch (err) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function handleComplaint(row) {
  currentRow.value = row
  handleForm.result = ''
  handleForm.punishment = ''
  handleVisible.value = true
}

async function confirmHandle() {
  if (!handleForm.result) {
    ElMessage.warning('请输入处理结果')
    return
  }
  try {
    await handleApi(currentRow.value.id, {
      result: handleForm.result,
      punishment: handleForm.punishment
    })
    ElMessage.success('处理完成')
    handleVisible.value = false
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function viewDetail(row) {
  ElMessage.info(`查看投诉 ${row.id} 详情`)
}

onMounted(() => {
  loadData()
})
</script>
