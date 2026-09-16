<template>
  <div class="system-page">
    <div class="page-card">
      <div class="card-title">基础设置</div>
      <el-form :model="form" label-width="140px" style="max-width: 600px">
        <el-form-item label="平台名称">
          <el-input v-model="form.platform_name" />
        </el-form-item>
        <el-form-item label="客服电话">
          <el-input v-model="form.customer_service_phone" />
        </el-form-item>
        <el-form-item label="服务时间">
          <el-input v-model="form.service_hours" placeholder="如：08:00-23:00" />
        </el-form-item>
        <el-form-item label="最低下单金额(元)">
          <el-input-number v-model="form.min_order_amount" :min="0" :precision="2" />
        </el-form-item>
        <el-form-item label="配送范围(km)">
          <el-input-number v-model="form.delivery_range" :min="0" :precision="1" />
        </el-form-item>
        <el-form-item label="自动接单">
          <el-switch v-model="form.auto_accept" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveSettings">保存设置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="page-card">
      <div class="card-header">
        <span class="card-title">管理员账号</span>
      </div>
      <el-table :data="adminList" border stripe style="width: 100%">
        <el-table-column prop="username" label="账号" width="150" />
        <el-table-column prop="name" label="姓名" width="120" />
        <el-table-column prop="role" label="角色" width="120">
          <template #default="{ row }">
            <el-tag :type="row.role === 'super_admin' ? 'danger' : 'primary'" size="small">
              {{ row.role === 'super_admin' ? '超级管理员' : '运营管理员' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="last_login_at" label="最后登录" min-width="160">
          <template #default="{ row }">{{ row.last_login_at || '-' }}</template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="row.status === 'normal' ? 'success' : 'danger'" size="small">
              {{ row.status === 'normal' ? '正常' : '禁用' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="180">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="changePassword(row)">修改密码</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <div class="page-card">
      <div class="card-title">系统信息</div>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="系统版本">v1.0.0</el-descriptions-item>
        <el-descriptions-item label="前端框架">Vue 3 + Element Plus + Vite</el-descriptions-item>
        <el-descriptions-item label="后端框架">Node.js + Express</el-descriptions-item>
        <el-descriptions-item label="数据库">MySQL 8.0</el-descriptions-item>
        <el-descriptions-item label="小程序端">微信小程序原生框架</el-descriptions-item>
        <el-descriptions-item label="最后更新">2026-09-15</el-descriptions-item>
      </el-descriptions>
    </div>

    <!-- 修改密码弹窗 -->
    <el-dialog v-model="pwdVisible" title="修改密码" width="400px">
      <el-form :model="pwdForm" label-width="80px">
        <el-form-item label="原密码">
          <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="请输入原密码" />
        </el-form-item>
        <el-form-item label="新密码">
          <el-input v-model="pwdForm.password" type="password" show-password placeholder="请输入新密码" />
        </el-form-item>
        <el-form-item label="确认密码">
          <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="请再次输入新密码" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="pwdVisible = false">取消</el-button>
        <el-button type="primary" @click="savePassword">确认</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { getSystemSettings, updateSystemSettings, updateAdminPassword } from '@/api/system'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const form = reactive({
  platform_name: '',
  customer_service_phone: '',
  service_hours: '',
  min_order_amount: 0,
  delivery_range: 3,
  auto_accept: false
})

const adminList = ref([])

const pwdVisible = ref(false)
const pwdForm = reactive({ oldPassword: '', password: '', confirmPassword: '' })

async function loadSettings() {
  try {
    const res = await getSystemSettings()
    if (res.code === 0 && res.data) {
      Object.assign(form, res.data)
    }
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function loadAdminInfo() {
  const info = userStore.adminInfo
  if (info) {
    adminList.value = [{
      id: info.id || 1,
      username: info.username || 'admin',
      name: info.name || '管理员',
      role: info.role || 'super_admin',
      last_login_at: info.last_login_at || '',
      status: 'normal'
    }]
  }
}

async function saveSettings() {
  try {
    await updateSystemSettings({ ...form })
    ElMessage.success('设置已保存')
  } catch (err) {
    // 错误已在拦截器处理
  }
}

function changePassword(row) {
  pwdForm.oldPassword = ''
  pwdForm.password = ''
  pwdForm.confirmPassword = ''
  pwdVisible.value = true
}

async function savePassword() {
  if (!pwdForm.oldPassword) {
    ElMessage.warning('请输入原密码')
    return
  }
  if (!pwdForm.password) {
    ElMessage.warning('请输入新密码')
    return
  }
  if (pwdForm.password !== pwdForm.confirmPassword) {
    ElMessage.warning('两次密码不一致')
    return
  }
  try {
    await updateAdminPassword({
      oldPassword: pwdForm.oldPassword,
      newPassword: pwdForm.password
    })
    pwdVisible.value = false
    ElMessage.success('密码修改成功')
  } catch (err) {
    // 错误已在拦截器处理
  }
}

onMounted(() => {
  loadSettings()
  loadAdminInfo()
})
</script>

<style scoped lang="scss">
.card-title {
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 20px;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
</style>
