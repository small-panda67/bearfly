// server/middleware/auth.js - JWT 认证中间件
const jwt = require('jsonwebtoken');
const { pool } = require('../config/db');

// 通用认证
async function authenticate(req, res, next) {
  const authorization = req.headers.authorization || '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7).trim() : '';
  if (!token) {
    return res.status(401).json({ code: 401, message: '未登录或登录已过期' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || 'campus_errand_jwt_secret_key_2026');
  } catch (err) {
    return res.status(401).json({ code: 401, message: '登录已过期，请重新登录' });
  }

  try {
    if (decoded.role === 'admin') {
      const [admins] = await pool.query(
        'SELECT id, username, name, role, status FROM admins WHERE id = ?',
        [decoded.id]
      );
      const admin = admins[0];
      if (!admin || admin.status !== 'normal') {
        return res.status(401).json({ code: 401, message: '管理员账号不存在或已被禁用' });
      }
      req.user = {
        id: admin.id,
        role: 'admin',
        adminRole: admin.role,
        name: admin.name,
        phone: admin.username
      };
    } else {
      const [users] = await pool.query(
        'SELECT id, phone, nickname, campus, role, status FROM users WHERE id = ?',
        [decoded.id]
      );
      const user = users[0];
      if (!user) {
        return res.status(401).json({ code: 401, message: '账号不存在，请重新登录' });
      }
      if (user.status !== 'normal') {
        return res.status(403).json({ code: 403, message: '账号已被冻结，请联系管理员' });
      }
      req.user = {
        id: user.id,
        role: user.role,
        phone: user.phone || '',
        nickname: user.nickname || '',
        campus: user.campus || ''
      };
    }
    next();
  } catch (err) {
    next(err);
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
