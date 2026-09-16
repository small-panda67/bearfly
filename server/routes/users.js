// server/routes/users.js - 用户路由
const express = require('express');
const router = express.Router();
const { authenticate, adminAuth } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 获取用户信息
router.get('/profile', authenticate, userController.getProfile);
// 更新用户信息
router.put('/profile', authenticate, userController.updateProfile);
// 地址管理
router.get('/addresses', authenticate, userController.getAddresses);
router.post('/addresses', authenticate, userController.addAddress);
router.put('/addresses/:id', authenticate, userController.updateAddress);
router.delete('/addresses/:id', authenticate, userController.deleteAddress);
// 钱包
router.get('/wallet', authenticate, userController.getWallet);
// 优惠券
router.get('/coupons', authenticate, userController.getCoupons);

module.exports = router;
