import request from '@/utils/request'

// 获取提现列表
export function getWithdrawalList(params) {
  return request({
    url: '/finance/withdrawals',
    method: 'get',
    params
  })
}

// 审核提现
export function auditWithdrawal(id, data) {
  return request({
    url: `/finance/withdrawals/${id}/audit`,
    method: 'put',
    data
  })
}

// 获取交易流水
export function getTransactionList(params) {
  return request({
    url: '/finance/transactions',
    method: 'get',
    params
  })
}
