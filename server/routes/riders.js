// server/routes/riders.js - 跑腿员路由
const express = require('express');
const router = express.Router();
const { authenticate, riderAuth } = require('../middleware/auth');
const riderController = require('../controllers/riderController');

// 跑腿员入驻申请（用户登录即可申请，尚未成为跑腿员）
router.post('/apply', authenticate, riderController.apply);
// 获取跑腿员信息（未成为跑腿员时也可查询/申请状态）
router.get('/profile', authenticate, riderController.getProfile);

// 以下为跑腿员专属操作，需要 riderAuth
// 切换在线状态
router.put('/online', riderAuth, riderController.toggleOnline);
// 接单大厅
router.get('/hall', riderAuth, riderController.getOrderHall);
// 抢单
router.post('/grab/:orderId', riderAuth, riderController.grabOrder);
// 我的订单
router.get('/orders', riderAuth, riderController.getMyOrders);
// 确认取货
router.post('/orders/:id/pickup', riderAuth, riderController.confirmPickup);
// 确认送达
router.post('/orders/:id/deliver', riderAuth, riderController.confirmDeliver);
// 收入统计
router.get('/income', riderAuth, riderController.getIncome);
// 提现申请
router.post('/withdraw', riderAuth, riderController.withdraw);

module.exports = router;
