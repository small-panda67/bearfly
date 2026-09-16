<template>
  <div class="campus-page">
    <div class="page-card">
      <div class="search-bar">
        <el-input v-model="keyword" placeholder="搜索校区名称" clearable style="width: 240px" @keyup.enter="loadData" />
        <el-button type="primary" @click="addCampus">+ 新增校区</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="id" label="校区ID" width="80" />
        <el-table-column prop="name" label="校区名称" width="140" />
        <el-table-column prop="address" label="地址" min-width="250" />
        <el-table-column prop="building_count" label="宿舍楼数" width="100" align="center">
          <template #default="{ row }">{{ row.building_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="user_count" label="用户数" width="100" align="center">
          <template #default="{ row }">{{ row.user_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="rider_count" label="跑腿员数" width="100" align="center">
          <template #default="{ row }">{{ row.rider_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === 'active' ? 'success' : 'warning'" size="small">
              {{ row.status === 'active' ? '运营中' : '试运营' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editCampus(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="deleteCampus(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑校区' : '新增校区'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="校区名称">
          <el-input v-model="form.name" placeholder="请输入校区名称" />
        </el-form-item>
        <el-form-item label="地址">
          <el-input v-model="form.address" placeholder="请输入校区地址" />
        </el-form-item>
        <el-form-item label="状态">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="运营中" value="active" />
            <el-option label="试运营" value="testing" />
            <el-option label="已停用" value="inactive" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="saveCampus">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getCampusList, createCampus, updateCampus, deleteCampus } from '@/api/campus'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const keyword = ref('')
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const form = reactive({ id: null, name: '', address: '', status: 'active' })

async function loadData() {
  loading.value = true
  try {
    const res = await getCampusList()
    if (res.code === 0) {
      tableData.value = res.data || []
    }
  } catch (err) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function addCampus() {
  isEdit.value = false
  Object.assign(form, { id: null, name: '', address: '', status: 'active' })
  dialogVisible.value = true
}

function editCampus(row) {
  isEdit.value = true
  Object.assign(form, { id: row.id, name: row.name, address: row.address, status: row.status })
  dialogVisible.value = true
}

function deleteCampus(row) {
  ElMessageBox.confirm(`确定删除校区 ${row.name}？`, '提示', { type: 'warning' })
    .then(async () => {
      try {
        await deleteCampus(row.id)
        ElMessage.success('删除成功')
        loadData()
      } catch (err) {
        // 错误已在拦截器处理
      }
    })
    .catch(() => {})
}

async function saveCampus() {
  if (!form.name) {
    ElMessage.warning('请输入校区名称')
    return
  }
  try {
    if (isEdit.value) {
      await updateCampus(form.id, { name: form.name, address: form.address, status: form.status })
    } else {
      await createCampus({ name: form.name, address: form.address, status: form.status })
    }
    dialogVisible.value = false
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
