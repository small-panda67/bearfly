// server/routes/notices.js - 公告路由
const express = require('express');
const router = express.Router();
const { adminAuth, authenticate } = require('../middleware/auth');
const { pool } = require('../config/db');

// 公告列表
router.get('/', authenticate, async (req, res) => {
  try {
    const [list] = await pool.query('SELECT id, title, type, target, content, created_at FROM notices WHERE status = "published" ORDER BY created_at DESC LIMIT 20');
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 公告管理（管理员）
router.get('/admin', adminAuth, async (req, res) => {
  try {
    const [list] = await pool.query('SELECT * FROM notices ORDER BY created_at DESC');
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 发布公告
router.post('/', adminAuth, async (req, res) => {
  try {
    const { title, type, target, content, status } = req.body;
    const [result] = await pool.query(
      'INSERT INTO notices (title, type, target, content, status, admin_id, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
      [title, type, target || 'all', content, status || 'published', req.user.id]
    );
    res.json({ code: 0, message: '发布成功', data: { id: result.insertId } });
  } catch (err) { res.status(500).json({ code: 500, message: '发布失败', error: err.message }); }
});

// 更新公告
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { title, type, target, content, status } = req.body;
    await pool.query(
      'UPDATE notices SET title = ?, type = ?, target = ?, content = ?, status = ? WHERE id = ?',
      [title, type, target || 'all', content, status || 'published', req.params.id]
    );
    res.json({ code: 0, message: '更新成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '更新失败', error: err.message }); }
});

// 删除公告
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    await pool.query('DELETE FROM notices WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '删除成功' });
  } catch (err) { res.status(500).json({ code: 500, message: '删除失败', error: err.message }); }
});

module.exports = router;
