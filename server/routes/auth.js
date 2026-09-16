// server/routes/auth.js - 认证路由
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// 用户登录（微信 code 换取 openid）
router.post('/wx-login', authController.wxLogin);
// 手机号登录
router.post('/phone-login', authController.phoneLogin);
// 学生姓名学号登录（第一步）
router.post('/student-login', authController.studentLogin);
// 绑定手机号（第二步）
router.post('/bind-phone', authController.bindPhone);
// 发送验证码
router.post('/send-code', authController.sendCode);
// 管理员登录
router.post('/admin-login', authController.adminLogin);
// 刷新 token
router.post('/refresh', authController.refreshToken);

module.exports = router;
