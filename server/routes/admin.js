// server/routes/admin.js - 管理员路由
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const adminController = require('../controllers/adminController');

// 数据看板
router.get('/dashboard', adminAuth, adminController.getDashboard);
// 看板：近N天订单趋势
router.get('/order-trend', adminAuth, adminController.getOrderTrend);
// 看板：服务类型占比
router.get('/service-type-stats', adminAuth, adminController.getServiceTypeStats);
// 当前管理员信息
router.get('/info', adminAuth, adminController.getAdminInfo);
// 系统设置
router.get('/system-settings', adminAuth, adminController.getSystemSettings);
router.put('/system-settings', adminAuth, adminController.updateSystemSettings);
// 用户管理
router.get('/users', adminAuth, adminController.getUsers);
router.put('/users/:id/status', adminAuth, adminController.updateUserStatus);
// 跑腿员管理
router.get('/riders', adminAuth, adminController.getRiders);
router.put('/riders/:id/status', adminAuth, adminController.updateRiderStatus);
router.get('/rider-applications', adminAuth, adminController.getRiderApplications);
router.put('/rider-applications/:id/audit', adminAuth, adminController.auditRiderApplication);
// 订单管理
router.get('/orders', adminAuth, adminController.getOrders);
router.get('/orders/:id', adminAuth, adminController.getOrderDetail);
// 投诉管理
router.get('/complaints', adminAuth, adminController.getComplaints);
router.put('/complaints/:id/handle', adminAuth, adminController.handleComplaint);
// 管理员账号
router.put('/password', adminAuth, adminController.updateAdminPassword);

module.exports = router;
