import request from '@/utils/request'

// 获取系统设置
export function getSystemSettings() {
  return request({
    url: '/admin/system-settings',
    method: 'get'
  })
}

// 更新系统设置
export function updateSystemSettings(data) {
  return request({
    url: '/admin/system-settings',
    method: 'put',
    data
  })
}

// 修改当前管理员密码
export function updateAdminPassword(data) {
  return request({
    url: '/admin/password',
    method: 'put',
    data
  })
}
