<template>
  <div class="notices-page">
    <div class="page-card">
      <div class="search-bar">
        <el-button type="primary" @click="addNotice">+ 发布公告</el-button>
      </div>
      <el-table :data="tableData" v-loading="loading" border stripe style="width: 100%">
        <el-table-column prop="title" label="标题" min-width="250" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="typeTagMap[row.type]" size="small">{{ typeMap[row.type] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="目标人群" width="100">
          <template #default="{ row }">{{ targetMap[row.target] }}</template>
        </el-table-column>
        <el-table-column prop="view_count" label="浏览量" width="90" align="center">
          <template #default="{ row }">{{ row.view_count ?? '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'published' ? 'success' : 'info'" size="small">
              {{ row.status === 'published' ? '已发布' : '草稿' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="发布时间" min-width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="editNotice(row)">编辑</el-button>
            <el-button type="primary" link size="small" v-if="row.status === 'draft'" @click="publish(row)">发布</el-button>
            <el-button type="danger" link size="small" v-else @click="offline(row)">下架</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑公告' : '发布公告'" width="600px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="标题">
          <el-input v-model="form.title" placeholder="请输入公告标题" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.type" style="width: 100%">
            <el-option label="普通公告" value="normal" />
            <el-option label="重要通知" value="important" />
            <el-option label="活动公告" value="activity" />
            <el-option label="系统通知" value="system" />
          </el-select>
        </el-form-item>
        <el-form-item label="目标人群">
          <el-select v-model="form.target" style="width: 100%">
            <el-option label="全部用户" value="all" />
            <el-option label="仅用户端" value="user" />
            <el-option label="仅跑腿员" value="rider" />
          </el-select>
        </el-form-item>
        <el-form-item label="内容">
          <el-input v-model="form.content" type="textarea" :rows="6" placeholder="请输入公告内容" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button @click="saveDraft">存草稿</el-button>
        <el-button type="primary" @click="publishNotice">发布</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getNoticeList, createNotice, updateNotice } from '@/api/notices'
import { ElMessage, ElMessageBox } from 'element-plus'

const loading = ref(false)
const tableData = ref([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editId = ref(null)

const form = reactive({ id: null, title: '', type: 'normal', target: 'all', content: '' })

const typeMap = { normal: '普通公告', important: '重要通知', activity: '活动公告', system: '系统通知' }
const typeTagMap = { normal: 'info', important: 'danger', activity: 'warning', system: 'primary' }
const targetMap = { all: '全部用户', user: '仅用户端', rider: '仅跑腿员' }

async function loadData() {
  loading.value = true
  try {
    const res = await getNoticeList()
    if (res.code === 0) {
      tableData.value = res.data || []
    }
  } catch (err) {
    tableData.value = []
  } finally {
    loading.value = false
  }
}

function addNotice() {
  isEdit.value = false
  editId.value = null
  Object.assign(form, { id: null, title: '', type: 'normal', target: 'all', content: '' })
  dialogVisible.value = true
}

function editNotice(row) {
  isEdit.value = true
  editId.value = row.id
  Object.assign(form, { id: row.id, title: row.title, type: row.type, target: row.target, content: row.content })
  dialogVisible.value = true
}

async function publish(row) {
  try {
    await updateNotice(row.id, { status: 'published' })
    ElMessage.success('发布成功')
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function offline(row) {
  ElMessageBox.confirm(`确定下架公告「${row.title}」？`, '提示', { type: 'warning' })
    .then(async () => {
      try {
        await updateNotice(row.id, { status: 'draft' })
        ElMessage.success('已下架')
        loadData()
      } catch (err) {
        // 错误已在拦截器处理
      }
    })
    .catch(() => {})
}

async function saveDraft() {
  if (!form.title) {
    ElMessage.warning('请输入标题')
    return
  }
  try {
    const data = {
      title: form.title, type: form.type, target: form.target,
      content: form.content, status: 'draft'
    }
    if (isEdit.value) {
      await updateNotice(editId.value, data)
    } else {
      await createNotice(data)
    }
    dialogVisible.value = false
    ElMessage.success('已存为草稿')
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

async function publishNotice() {
  if (!form.title) {
    ElMessage.warning('请输入标题')
    return
  }
  if (!form.content) {
    ElMessage.warning('请输入内容')
    return
  }
  try {
    const data = {
      title: form.title, type: form.type, target: form.target,
      content: form.content, status: 'published'
    }
    if (isEdit.value) {
      await updateNotice(editId.value, data)
    } else {
      await createNotice(data)
    }
    dialogVisible.value = false
    ElMessage.success('发布成功')
    loadData()
  } catch (err) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadData()
})
</script>
