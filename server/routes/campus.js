// server/routes/campus.js - 校区路由
const express = require('express');
const router = express.Router();
const { adminAuth, authenticate } = require('../middleware/auth');
const { pool } = require('../config/db');

// 校区列表
router.get('/', authenticate, async (req, res) => {
  try {
    const [list] = await pool.query('SELECT id, name, address, status FROM campuses WHERE status = "active"');
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 校区管理（管理员）
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const params = [];
    let whereSql = '';
    if (req.query.keyword) {
      whereSql = 'WHERE c.name LIKE ? OR c.address LIKE ?';
      params.push(`%${req.query.keyword}%`, `%${req.query.keyword}%`);
    }
    const [list] = await pool.query(
      `SELECT c.*,
              (SELECT COUNT(*) FROM users u WHERE u.campus = c.name) AS user_count,
              (SELECT COUNT(*) FROM riders r WHERE r.campus = c.name) AS rider_count
       FROM campuses c
       ${whereSql}
       ORDER BY c.created_at DESC`,
      params
    );
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 新增校区
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, address, latitude, longitude, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO campuses (name, address, latitude, longitude, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
      [name, address || null, latitude || null, longitude || null, status || 'active']
    );
    res.json({ code: 0, message: '添加成功', data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ code: 500, message: '添加失败', error: err.message }); }
});

// 更新校区
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { name, address, latitude, longitude, status } = req.body;
    await pool.query(
      'UPDATE campuses SET name = ?, address = ?, latitude = ?, longitude = ?, status = ? WHERE id = ?',
      [name, address || null, latitude || null, longitude || null, status || 'active', req.params.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '更新失败', error: err.message }); }
});

// 删除校区
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM campuses WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '删除失败', error: err.message }); }
});

module.exports = router;
