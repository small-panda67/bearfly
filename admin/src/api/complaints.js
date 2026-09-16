import request from '@/utils/request'

// 获取投诉列表
export function getComplaintList(params) {
  return request({
    url: '/admin/complaints',
    method: 'get',
    params
  })
}

// 处理投诉
export function handleComplaint(id, data) {
  return request({
    url: `/admin/complaints/${id}/handle`,
    method: 'put',
    data
  })
}
