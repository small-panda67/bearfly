import request from '@/utils/request'

// 获取校区列表
export function getCampusList(params) {
  return request({
    url: '/campus/admin',
    method: 'get',
    params
  })
}

// 新增校区
export function createCampus(data) {
  return request({
    url: '/campus',
    method: 'post',
    data
  })
}

// 编辑校区
export function updateCampus(id, data) {
  return request({
    url: `/campus/${id}`,
    method: 'put',
    data
  })
}

// 删除校区
export function deleteCampus(id) {
  return request({
    url: `/campus/${id}`,
    method: 'delete'
  })
}
