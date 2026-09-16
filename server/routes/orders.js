// server/routes/orders.js - 订单路由
const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

// 创建订单
router.post('/', authenticate, orderController.create);
// 我的订单列表
router.get('/my', authenticate, orderController.getMyOrders);
// 订单详情
router.get('/:id', authenticate, orderController.getDetail);
// 取消订单
router.post('/:id/cancel', authenticate, orderController.cancel);
// 确认收货
router.post('/:id/confirm', authenticate, orderController.confirm);
// 订单评价
router.post('/:id/rate', authenticate, orderController.rate);
// 用户投诉
router.post('/:id/complaint', authenticate, orderController.submitComplaint);

module.exports = router;
