// server/routes/finance.js - 财务路由
const express = require('express');
const router = express.Router();
const { adminAuth } = require('../middleware/auth');
const { pool } = require('../config/db');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function auditWithdrawalRecord(connection, id, status, reason = '') {
  const [withdrawals] = await connection.query(
    'SELECT * FROM withdrawals WHERE id = ? FOR UPDATE',
    [id]
  );
  const withdrawal = withdrawals[0];
  if (!withdrawal) throw createHttpError(404, '提现申请不存在');
  if (withdrawal.status !== 'pending') throw createHttpError(400, '该提现申请已审核');

  if (status === 'rejected') {
    await connection.query(
      `UPDATE wallets
       SET balance = balance + ?,
           total_expense = GREATEST(total_expense - ?, 0),
           updated_at = NOW()
       WHERE user_id = ?`,
      [withdrawal.amount, withdrawal.amount, withdrawal.rider_id]
    );
    const [wallets] = await connection.query(
      'SELECT balance FROM wallets WHERE user_id = ?',
      [withdrawal.rider_id]
    );
    await connection.query(
      `INSERT INTO wallet_records
       (user_id, type, amount, balance_after, source, ref_id, description, created_at)
       VALUES (?, 'refund', ?, ?, 'withdraw', ?, '提现驳回退款', NOW())`,
      [withdrawal.rider_id, withdrawal.amount, wallets[0] ? wallets[0].balance : withdrawal.amount, withdrawal.id]
    );
  }

  await connection.query(
    'UPDATE withdrawals SET status = ?, audit_reason = ?, audited_at = NOW() WHERE id = ?',
    [status, reason, id]
  );
}

// 财务汇总
router.get('/summary', adminAuth, async (req, res) => {
  try {
    const [[today]] = await pool.query(
      `SELECT COALESCE(SUM(pay_amount), 0) AS gmv
       FROM orders
       WHERE status = "completed" AND DATE(confirmed_at) = CURDATE()`
    );
    const [[month]] = await pool.query(
      `SELECT COALESCE(SUM(pay_amount), 0) AS gmv
       FROM orders
       WHERE status = "completed"
         AND YEAR(confirmed_at) = YEAR(CURDATE())
         AND MONTH(confirmed_at) = MONTH(CURDATE())`
    );
    const [[pending]] = await pool.query(
      'SELECT COUNT(*) AS count FROM withdrawals WHERE status = "pending"'
    );
    res.json({
      code: 0,
      data: {
        todayGmv: Number(today.gmv || 0),
        monthGmv: Number(month.gmv || 0),
        platformIncome: Number((Number(month.gmv || 0) * 0.1).toFixed(2)),
        pendingWithdrawals: Number(pending.count || 0)
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
});

// 提现列表
router.get('/withdrawals', adminAuth, async (req, res) => {
  try {
    const conditions = ['1 = 1'];
    const params = [];
    if (req.query.status) {
      conditions.push('w.status = ?');
      params.push(req.query.status);
    }
    const [list] = await pool.query(
      `SELECT w.*, u.nickname AS rider_name, u.phone
       FROM withdrawals w
       JOIN users u ON w.rider_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY w.created_at DESC
       LIMIT 100`,
      params
    );
    res.json({ code: 0, data: list });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
});

// 审核提现
router.put('/withdrawals/:id/audit', adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { status, reason } = req.body;
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 400, message: '审核状态非法' });
    }
    await connection.beginTransaction();
    await auditWithdrawalRecord(connection, req.params.id, status, reason || '');
    await connection.commit();
    res.json({ code: 0, message: '审核完成' });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({
      code: err.status || 500,
      message: err.message || '审核失败'
    });
  } finally {
    connection.release();
  }
});

// 批量审核提现
router.post('/withdrawals/batch-audit', adminAuth, async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const ids = Array.isArray(req.body.ids) ? req.body.ids : [];
    const { status, reason } = req.body;
    if (!ids.length || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 400, message: '请选择待审核记录并指定审核状态' });
    }
    await connection.beginTransaction();
    for (const id of ids) {
      await auditWithdrawalRecord(connection, id, status, reason || '');
    }
    await connection.commit();
    res.json({ code: 0, message: `已处理 ${ids.length} 条提现申请` });
  } catch (err) {
    await connection.rollback();
    res.status(err.status || 500).json({
      code: err.status || 500,
      message: err.message || '批量审核失败'
    });
  } finally {
    connection.release();
  }
});

// 交易流水
router.get('/transactions', adminAuth, async (req, res) => {
  try {
    const conditions = ['1 = 1'];
    const params = [];
    if (req.query.type) {
      conditions.push('wr.type = ?');
      params.push(req.query.type);
    }
    const [list] = await pool.query(
      `SELECT wr.*, u.nickname, u.phone
       FROM wallet_records wr
       LEFT JOIN users u ON wr.user_id = u.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY wr.created_at DESC
       LIMIT 200`,
      params
    );
    res.json({ code: 0, data: list });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
});

module.exports = router;
