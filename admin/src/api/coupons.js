import request from '@/utils/request'

// 获取优惠券列表
export function getCouponList(params) {
  return request({
    url: '/coupons',
    method: 'get',
    params
  })
}

// 创建优惠券
export function createCoupon(data) {
  return request({
    url: '/coupons',
    method: 'post',
    data
  })
}

// 编辑优惠券
export function updateCoupon(id, data) {
  return request({
    url: `/coupons/${id}`,
    method: 'put',
    data
  })
}

// 删除优惠券
export function deleteCoupon(id) {
  return request({
    url: `/coupons/${id}`,
    method: 'delete'
  })
}

// 切换优惠券状态
export function updateCouponStatus(id, data) {
  return request({
    url: `/coupons/${id}/status`,
    method: 'put',
    data
  })
}
