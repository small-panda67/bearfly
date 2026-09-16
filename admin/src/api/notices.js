import request from '@/utils/request'

// 获取公告列表
export function getNoticeList() {
  return request({
    url: '/notices/admin',
    method: 'get'
  })
}

// 发布公告
export function createNotice(data) {
  return request({
    url: '/notices',
    method: 'post',
    data
  })
}

// 编辑公告
export function updateNotice(id, data) {
  return request({
    url: `/notices/${id}`,
    method: 'put',
    data
  })
}

// 删除公告
export function deleteNotice(id) {
  return request({
    url: `/notices/${id}`,
    method: 'delete'
  })
}
