// server/routes/coupons.js - 优惠券路由
const express = require('express');
const router = express.Router();
const { adminAuth, authenticate } = require('../middleware/auth');
const { pool } = require('../config/db');

// 优惠券列表（管理员）
router.get('/', adminAuth, async (req, res) => {
  try {
    const [list] = await pool.query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 创建优惠券
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, type, amount, threshold, total_count, start_at, expire_at, scope } = req.body;
    const [result] = await pool.query(
      'INSERT INTO coupons (name, type, amount, threshold, total_count, used_count, start_at, expire_at, scope, status, created_at) VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, "active", NOW())',
      [name, type, amount, threshold, total_count, start_at, expire_at, scope || 'all']
    );
    res.json({ code: 0, message: '创建成功', data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ code: 500, message: '创建失败', error: err.message }); }
});

// 更新优惠券
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, type, amount, threshold, total_count, start_at, expire_at, scope, status } = req.body;
    await pool.query(
      'UPDATE coupons SET name = ?, type = ?, amount = ?, threshold = ?, total_count = ?, start_at = ?, expire_at = ?, scope = ?, status = ? WHERE id = ?',
      [name, type, amount, threshold, total_count, start_at, expire_at, scope || 'all', status || 'active', req.params.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '更新失败', error: err.message }); }
});

// 上下架优惠券
router.put('/:id/status', adminAuth, async (req, res) => {
  try {
    const { status } = req.body;
    if (!['active', 'inactive', 'expired'].includes(status)) {
      return res.status(400).json({ code: 400, message: '状态非法' });
    }
    await pool.query('UPDATE coupons SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ code: 0, message: '操作成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '操作失败', error: err.message }); }
});

// 删除优惠券
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM coupons WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '删除失败', error: err.message }); }
});

// 领取优惠券
router.post('/:id/claim', authenticate, async (req, res) => {
  try {
    const [coupons] = await pool.query('SELECT * FROM coupons WHERE id = ? AND status = "active"', [req.params.id]);
    if (!coupons[0]) return res.status(400).json({ code: 400, message: '优惠券不可用' });
    if (coupons[0].used_count >= coupons[0].total_count) return res.status(400).json({ code: 400, message: '优惠券已领完' });
    await pool.query('INSERT INTO user_coupons (user_id, coupon_id, status, created_at) VALUES (?, ?, "unused", NOW())', [req.user.id, req.params.id]);
    await pool.query('UPDATE coupons SET used_count = used_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '领取成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '领取失败', error: err.message }); }
});

module.exports = router;
