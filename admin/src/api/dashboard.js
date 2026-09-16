import request from '@/utils/request'

// 获取数据看板
export function getDashboard() {
  return request({
    url: '/admin/dashboard',
    method: 'get'
  })
}

// 获取订单趋势
export function getOrderTrend(days = 7) {
  return request({
    url: '/admin/order-trend',
    method: 'get',
    params: { days }
  })
}

// 获取服务类型占比
export function getServiceTypeStats() {
  return request({
    url: '/admin/service-type-stats',
    method: 'get'
  })
}
