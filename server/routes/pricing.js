// server/routes/pricing.js - 定价配置路由
const express = require('express');
const router = express.Router();
const { adminAuth, authenticate } = require('../middleware/auth');
const { pool } = require('../config/db');

// 定价列表
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM pricing_configs WHERE 1=1';
    const params = [];
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY id ASC';
    const [list] = await pool.query(sql, params);
    res.json({ code: 0, data: list });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
});

// 新增定价
router.post('/', adminAuth, async (req, res) => {
  try {
    const { type, name, base_price, per_km, description, status } = req.body;
    if (!type || !name) return res.status(400).json({ code: 400, message: '类型和名称必填' });
    const [result] = await pool.query(
      'INSERT INTO pricing_configs (type, name, base_price, per_km, description, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [type, name, base_price || 0, per_km || 0, description || '', status || 'active']
    );
    res.json({ code: 0, message: '添加成功', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '添加失败', error: err.message });
  }
});

// 修改定价
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { type, name, base_price, per_km, description, status } = req.body;
    await pool.query(
      'UPDATE pricing_configs SET type = ?, name = ?, base_price = ?, per_km = ?, description = ?, status = ? WHERE id = ?',
      [type, name, base_price, per_km, description || '', status || 'active', req.params.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', error: err.message });
  }
});

// 删除定价
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM pricing_configs WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '删除失败', error: err.message });
  }
});

module.exports = router;
