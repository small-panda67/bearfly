import request from '@/utils/request'

// 管理员登录
export function login(username, password) {
  return request({
    url: '/auth/admin-login',
    method: 'post',
    data: { username, password }
  })
}

// 获取管理员信息
export function getAdminInfo() {
  return request({
    url: '/admin/info',
    method: 'get'
  })
}
