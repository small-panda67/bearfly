import request from '@/utils/request'

// 获取定价列表
export function getPricingList() {
  return request({
    url: '/pricing',
    method: 'get'
  })
}

// 新增定价
export function createPricing(data) {
  return request({
    url: '/pricing',
    method: 'post',
    data
  })
}

// 编辑定价
export function updatePricing(id, data) {
  return request({
    url: `/pricing/${id}`,
    method: 'put',
    data
  })
}

// 删除定价
export function deletePricing(id) {
  return request({
    url: `/pricing/${id}`,
    method: 'delete'
  })
}
