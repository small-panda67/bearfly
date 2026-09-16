// server/middleware/auth.js - JWT 认证中间件
const jwt = require('jsonwebtoken');

// 通用认证
function authenticate(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }
  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || 'campus_errand_jwt_secret_key_2026');
    next();
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }
}

// 管理员认证
function adminAuth(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ code: 403, message: '无管理员权限' });
    }
    next();
  });
}

// 跑腿员认证
function riderAuth(req, res, next) {
  authenticate(req, res, () => {
    if (req.user.role !== 'rider') {
      return res.status(403).json({ code: 403, message: '无跑腿员权限' });
    }
    next();
  });
}

module.exports = { authenticate, adminAuth, riderAuth };
