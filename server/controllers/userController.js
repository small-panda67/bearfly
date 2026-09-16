// server/controllers/userController.js - 用户控制器
const { pool } = require('../config/db');

// 获取用户信息
exports.getProfile = async (req, res) => {
  try {
    const [users] = await pool.query('SELECT id, phone, nickname, avatar, gender, campus, role, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!users[0]) return res.status(404).json({ code: 404, message: '用户不存在' });
    res.json({ code: 0, data: users[0] });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 更新用户信息
exports.updateProfile = async (req, res) => {
  try {
    const { nickname, avatar, gender, campus } = req.body;
    await pool.query(
      'UPDATE users SET nickname = ?, avatar = ?, gender = ?, campus = ? WHERE id = ?',
      [nickname, avatar, gender, campus, req.user.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', error: err.message });
  }
};

// 获取地址列表
exports.getAddresses = async (req, res) => {
  try {
    const [addresses] = await pool.query('SELECT * FROM addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC', [req.user.id]);
    res.json({ code: 0, data: addresses });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 新增地址
exports.addAddress = async (req, res) => {
  try {
    const { name, phone, campus, building, room, is_default } = req.body;
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    const [result] = await pool.query(
      'INSERT INTO addresses (user_id, name, phone, campus, building, room, is_default, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, NOW())',
      [req.user.id, name, phone, campus, building, room, is_default ? 1 : 0]
    );
    res.json({ code: 0, message: '添加成功', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '添加失败', error: err.message });
  }
};

// 更新地址
exports.updateAddress = async (req, res) => {
  try {
    const { name, phone, campus, building, room, is_default } = req.body;
    if (is_default) {
      await pool.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [req.user.id]);
    }
    await pool.query(
      'UPDATE addresses SET name = ?, phone = ?, campus = ?, building = ?, room = ?, is_default = ? WHERE id = ? AND user_id = ?',
      [name, phone, campus, building, room, is_default ? 1 : 0, req.params.id, req.user.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', error: err.message });
  }
};

// 删除地址
exports.deleteAddress = async (req, res) => {
  try {
    await pool.query('DELETE FROM addresses WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', error: err.message });
  }
};

// 获取钱包
exports.getWallet = async (req, res) => {
  try {
    const [wallets] = await pool.query('SELECT * FROM wallets WHERE user_id = ?', [req.user.id]);
    const [records] = await pool.query('SELECT * FROM wallet_records WHERE user_id = ? ORDER BY created_at DESC LIMIT 20', [req.user.id]);
    res.json({ code: 0, data: { wallet: wallets[0] || { balance: 0 }, records } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 获取优惠券
exports.getCoupons = async (req, res) => {
  try {
    const [coupons] = await pool.query(
      'SELECT uc.*, c.name, c.amount, c.threshold, c.type, c.expire_at FROM user_coupons uc JOIN coupons c ON uc.coupon_id = c.id WHERE uc.user_id = ? ORDER BY uc.created_at DESC',
      [req.user.id]
    );
    res.json({ code: 0, data: coupons });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};
