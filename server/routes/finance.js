// server/routes/finance.js - 财务路由
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');

// 提现列表
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [list] = await pool.query(`SELECT w.*, u.nickname as rider_name, u.phone FROM withdrawals w
      JOIN users u ON w.rider_id = u.id ORDER BY w.created_at DESC LIMIT 50`);
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

// 审核提现
router.put('/withdrawals/:id/audit', adminAuth, async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const { status, reason } = req.body;
    await pool.query('UPDATE withdrawals SET status = ?, audit_reason = ?, audited_at = NOW() WHERE id = ?', [status, reason || '', req.params.id]);
    res.json({ code: 0, message: '审核完成' });
  } catch (err) { res.status(500).json({ code: 500, message: '审核失败', error: err.message }); }
});

// 交易流水
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const { pool } = require('../config/db');
    const [list] = await pool.query('SELECT * FROM wallet_records ORDER BY created_at DESC LIMIT 100');
    res.json({ code: 0, data: list });
  } catch (err) { res.status(500).json({ code: 500, message: '获取失败', error: err.message }); }
});

module.exports = router;
