<template>
  <el-container class="admin-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo">
        <span class="logo-icon">🛵</span>
        <span v-show="!isCollapse" class="logo-text">校园跑腿后台</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        :collapse="isCollapse"
        :collapse-transition="false"
        router
        background-color="#1a1f36"
        text-color="rgba(255,255,255,0.7)"
        active-text-color="#fff"
      >
        <template v-for="group in menuGroups" :key="group.title">
          <div class="menu-group-title" v-show="!isCollapse">{{ group.title }}</div>
          <el-menu-item
            v-for="item in group.items"
            :key="item.path"
            :index="item.path"
          >
            <el-icon><component :is="item.icon" /></el-icon>
            <template #title>{{ item.title }}</template>
          </el-menu-item>
        </template>
      </el-menu>
    </el-aside>

    <!-- 主区域 -->
    <el-container>
      <!-- 头部 -->
      <el-header class="header">
        <div class="header-left">
          <el-icon class="collapse-btn" @click="isCollapse = !isCollapse">
            <Fold v-if="!isCollapse" />
            <Expand v-else />
          </el-icon>
          <el-breadcrumb separator="/">
            <el-breadcrumb-item :to="{ path: '/dashboard' }">首页</el-breadcrumb-item>
            <el-breadcrumb-item>{{ currentTitle }}</el-breadcrumb-item>
          </el-breadcrumb>
        </div>
        <div class="header-right">
          <el-badge :value="5" class="notify-badge">
            <el-icon class="header-icon"><Bell /></el-icon>
          </el-badge>
          <el-dropdown @command="handleCommand">
            <div class="user-info">
              <el-avatar :size="32" class="user-avatar">管</el-avatar>
              <span class="username">{{ adminInfo?.name || '管理员' }}</span>
              <el-icon><ArrowDown /></el-icon>
            </div>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view v-slot="{ Component }">
          <transition name="fade" mode="out-in">
            <component :is="Component" />
          </transition>
        </router-view>
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessageBox, ElMessage } from 'element-plus'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const isCollapse = ref(false)
const adminInfo = computed(() => userStore.adminInfo)
const activeMenu = computed(() => route.path)
const currentTitle = computed(() => route.meta.title || '')

const menuGroups = [
  {
    title: '数据概览',
    items: [
      { path: '/dashboard', title: '数据看板', icon: 'DataAnalysis' }
    ]
  },
  {
    title: '运营管理',
    items: [
      { path: '/orders', title: '订单管理', icon: 'List' },
      { path: '/users', title: '用户管理', icon: 'User' },
      { path: '/riders', title: '跑腿员管理', icon: 'Van' },
      { path: '/rider-audit', title: '入驻审核', icon: 'CircleCheck' },
      { path: '/finance', title: '财务管理', icon: 'Money' },
      { path: '/complaints', title: '投诉处理', icon: 'Warning' }
    ]
  },
  {
    title: '系统配置',
    items: [
      { path: '/pricing', title: '价格配置', icon: 'PriceTag' },
      { path: '/campus', title: '校区管理', icon: 'OfficeBuilding' },
      { path: '/coupons', title: '优惠券管理', icon: 'Ticket' },
      { path: '/notices', title: '公告管理', icon: 'Bell' },
      { path: '/system', title: '系统设置', icon: 'Setting' }
    ]
  }
]

function handleCommand(command) {
  if (command === 'logout') {
    ElMessageBox.confirm('确定退出登录？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    }).then(() => {
      userStore.logout()
      ElMessage.success('已退出登录')
      router.push('/login')
    }).catch(() => {})
  } else if (command === 'profile') {
    ElMessage.info('个人中心开发中')
  }
}
</script>

<style scoped lang="scss">
.admin-layout {
  height: 100vh;
}

.sidebar {
  background: linear-gradient(180deg, #1a1f36 0%, #2d3561 100%);
  transition: width 0.3s;
  overflow-x: hidden;

  :deep(.el-menu) {
    border-right: none;
  }

  :deep(.el-menu-item.is-active) {
    background: linear-gradient(90deg, #409eff, #66b1ff) !important;
  }

  :deep(.el-menu-item:hover) {
    background: rgba(255,255,255,0.08) !important;
  }
}

.logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-bottom: 1px solid rgba(255,255,255,0.1);
  color: #fff;

  .logo-icon {
    font-size: 24px;
  }
  .logo-text {
    font-size: 16px;
    font-weight: 700;
    white-space: nowrap;
  }
}

.menu-group-title {
  padding: 12px 20px 8px;
  font-size: 12px;
  color: rgba(255,255,255,0.4);
  text-transform: uppercase;
  letter-spacing: 1px;
}

.header {
  background: #fff;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  box-shadow: 0 1px 4px rgba(0,0,0,0.06);
  height: 60px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.collapse-btn {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 24px;
}

.header-icon {
  font-size: 20px;
  cursor: pointer;
  color: #606266;
}

.notify-badge {
  cursor: pointer;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.user-avatar {
  background: linear-gradient(135deg, #409eff, #66b1ff);
  color: #fff;
  font-weight: 600;
}

.username {
  font-size: 14px;
  color: #303133;
}

.main-content {
  background: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
