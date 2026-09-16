import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/',
    component: () => import('@/layout/AdminLayout.vue'),
    redirect: '/dashboard',
    meta: { requiresAuth: true },
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据看板', icon: 'DataAnalysis' }
      },
      {
        path: 'orders',
        name: 'Orders',
        component: () => import('@/views/Orders.vue'),
        meta: { title: '订单管理', icon: 'List' }
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/Users.vue'),
        meta: { title: '用户管理', icon: 'User' }
      },
      {
        path: 'riders',
        name: 'Riders',
        component: () => import('@/views/Riders.vue'),
        meta: { title: '跑腿员管理', icon: 'Van' }
      },
      {
        path: 'rider-audit',
        name: 'RiderAudit',
        component: () => import('@/views/RiderAudit.vue'),
        meta: { title: '入驻审核', icon: 'CircleCheck' }
      },
      {
        path: 'finance',
        name: 'Finance',
        component: () => import('@/views/Finance.vue'),
        meta: { title: '财务管理', icon: 'Money' }
      },
      {
        path: 'complaints',
        name: 'Complaints',
        component: () => import('@/views/Complaints.vue'),
        meta: { title: '投诉处理', icon: 'Warning' }
      },
      {
        path: 'pricing',
        name: 'Pricing',
        component: () => import('@/views/Pricing.vue'),
        meta: { title: '价格配置', icon: 'PriceTag' }
      },
      {
        path: 'campus',
        name: 'Campus',
        component: () => import('@/views/Campus.vue'),
        meta: { title: '校区管理', icon: 'OfficeBuilding' }
      },
      {
        path: 'coupons',
        name: 'Coupons',
        component: () => import('@/views/Coupons.vue'),
        meta: { title: '优惠券管理', icon: 'Ticket' }
      },
      {
        path: 'notices',
        name: 'Notices',
        component: () => import('@/views/Notices.vue'),
        meta: { title: '公告管理', icon: 'Bell' }
      },
      {
        path: 'system',
        name: 'System',
        component: () => import('@/views/System.vue'),
        meta: { title: '系统设置', icon: 'Setting' }
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫
router.beforeEach((to, from, next) => {
  const userStore = useUserStore()
  document.title = to.meta.title ? `${to.meta.title} - 校园跑腿管理后台` : '校园跑腿管理后台'

  if (to.meta.requiresAuth && !userStore.token) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else if (to.path === '/login' && userStore.token) {
    next({ path: '/dashboard' })
  } else {
    next()
  }
})

export default router
