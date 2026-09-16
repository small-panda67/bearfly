import request from '@/utils/request'

// 获取跑腿员列表
export function getRiderList(params) {
  return request({
    url: '/admin/riders',
    method: 'get',
    params
  })
}

// 启用/禁用跑腿员
export function updateRiderStatus(id, status) {
  return request({
    url: `/admin/riders/${id}/status`,
    method: 'put',
    data: { status }
  })
}

// 获取入驻申请列表
export function getRiderApplications() {
  return request({
    url: '/admin/rider-applications',
    method: 'get'
  })
}

// 审核入驻申请
export function auditRiderApplication(id, data) {
  return request({
    url: `/admin/rider-applications/${id}/audit`,
    method: 'put',
    data
  })
}
