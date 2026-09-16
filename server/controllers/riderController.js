// server/controllers/riderController.js - 跑腿员控制器
const { pool } = require('../config/db');

async function writeTrack(conn, orderId, status, description, operatorType, operatorId) {
  await conn.query(
    'INSERT INTO order_tracks (order_id, status, description, operator_type, operator_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [orderId, status, description, operatorType, operatorId || null]
  );
}

// 入驻申请
exports.apply = async (req, res) => {
  try {
    const { name, phone, id_card, campus, student_id } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ code: 400, message: '姓名和手机号不能为空' });
    }
    if (!/^1\d{10}$/.test(String(phone))) {
      return res.status(400).json({ code: 400, message: '手机号格式不正确' });
    }

    const [riders] = await pool.query('SELECT id, status FROM riders WHERE user_id = ?', [req.user.id]);
    if (riders[0]) {
      return res.status(400).json({ code: 400, message: '当前账号已是跑腿员，无需重复申请' });
    }
    const [pendingApplications] = await pool.query(
      'SELECT id FROM rider_applications WHERE user_id = ? AND status = "pending" LIMIT 1',
      [req.user.id]
    );
    if (pendingApplications[0]) {
      return res.status(400).json({ code: 400, message: '已有待审核申请，请勿重复提交' });
    }

    const [result] = await pool.query(
      'INSERT INTO rider_applications (user_id, name, phone, id_card, campus, student_id, status, created_at) VALUES (?, ?, ?, ?, ?, ?, "pending", NOW())',
      [req.user.id, String(name).trim(), String(phone).trim(), id_card || null, campus || null, student_id || null]
    );
    res.json({ code: 0, message: '申请已提交，等待审核', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '申请失败', error: err.message });
  }
};

// 获取跑腿员信息
exports.getProfile = async (req, res) => {
  try {
    const [riders] = await pool.query('SELECT * FROM riders WHERE user_id = ?', [req.user.id]);
    if (!riders[0]) return res.status(404).json({ code: 404, message: '跑腿员信息不存在' });
    res.json({ code: 0, data: riders[0] });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 切换在线状态
exports.toggleOnline = async (req, res) => {
  try {
    const [riders] = await pool.query('SELECT id, is_online, status FROM riders WHERE user_id = ?', [req.user.id]);
    if (!riders[0]) return res.status(404).json({ code: 404, message: '跑腿员信息不存在' });
    if (riders[0].status !== 'normal') {
      return res.status(403).json({ code: 403, message: '跑腿员账号已被禁用' });
    }
    // body 可传 is_online 0/1，否则翻转
    let next;
    if (req.body && (req.body.is_online === 0 || req.body.is_online === 1 || req.body.is_online === '0' || req.body.is_online === '1')) {
      next = Number(req.body.is_online);
    } else {
      next = riders[0].is_online ? 0 : 1;
    }
    await pool.query('UPDATE riders SET is_online = ? WHERE user_id = ?', [next, req.user.id]);
    res.json({ code: 0, message: next ? '已上线' : '已下线', data: { is_online: next } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  }
};

// 接单大厅
exports.getOrderHall = async (req, res) => {
  try {
    const { campus, type, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT o.*, u.nickname as user_name FROM orders o JOIN users u ON o.user_id = u.id WHERE o.status = "pending"';
    const params = [];
    if (campus) { sql += ' AND o.campus = ?'; params.push(campus); }
    if (type) { sql += ' AND o.type = ?'; params.push(type); }
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (page - 1) * pageSize);
    const [orders] = await pool.query(sql, params);
    res.json({ code: 0, data: { list: orders, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 抢单
exports.grabOrder = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [riders] = await connection.query(
      'SELECT id FROM riders WHERE user_id = ? AND status = "normal" FOR UPDATE',
      [req.user.id]
    );
    if (!riders[0]) {
      await connection.rollback();
      return res.status(403).json({ code: 403, message: '跑腿员账号不存在或已被禁用' });
    }
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.orderId]);
    if (!orders[0]) { await connection.rollback(); return res.status(404).json({ code: 404, message: '订单不存在' }); }
    if (orders[0].status !== 'pending') { await connection.rollback(); return res.status(400).json({ code: 400, message: '订单已被抢' }); }

    await connection.query('UPDATE orders SET status = "picked", rider_id = ?, picked_at = NOW() WHERE id = ?', [req.user.id, req.params.orderId]);
    await writeTrack(connection, req.params.orderId, 'picked', '跑腿员已接单', 'rider', req.user.id);
    await connection.commit();
    res.json({ code: 0, message: '抢单成功' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '抢单失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 我的订单
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT o.*, u.nickname as user_name, u.phone as user_phone FROM orders o JOIN users u ON o.user_id = u.id WHERE o.rider_id = ?';
    const params = [req.user.id];
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (page - 1) * pageSize);
    const [orders] = await pool.query(sql, params);
    res.json({ code: 0, data: { list: orders, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 确认取货
exports.confirmPickup = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND rider_id = ? AND status = "picked" FOR UPDATE', [req.params.id, req.user.id]);
    if (!orders[0]) { await connection.rollback(); return res.status(400).json({ code: 400, message: '订单状态不正确或无权限' }); }
    await connection.query('UPDATE orders SET status = "delivering", pickup_at = NOW() WHERE id = ?', [req.params.id]);
    await writeTrack(connection, req.params.id, 'delivering', '已取货，配送中', 'rider', req.user.id);
    await connection.commit();
    res.json({ code: 0, message: '取货成功' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 确认送达
exports.confirmDeliver = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    // 送达后进入 delivered，用户确认收货后才完成并结算收入
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND rider_id = ? AND status = "delivering" FOR UPDATE', [req.params.id, req.user.id]);
    if (!orders[0]) { await connection.rollback(); return res.status(400).json({ code: 400, message: '订单状态不正确或无权限' }); }

    await connection.query(
      'UPDATE orders SET status = "delivered", delivered_at = NOW() WHERE id = ?',
      [req.params.id]
    );
    await writeTrack(connection, req.params.id, 'delivered', '已送达', 'rider', req.user.id);

    await connection.commit();
    res.json({ code: 0, message: '已确认送达，等待用户确认收货' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 收入统计
exports.getIncome = async (req, res) => {
  try {
    const [[today]] = await pool.query(
      `SELECT COALESCE(SUM(amount + tip), 0) AS total
       FROM orders
       WHERE rider_id = ? AND status = "completed" AND DATE(confirmed_at) = CURDATE()`,
      [req.user.id]
    );
    const [[month]] = await pool.query(
      `SELECT COALESCE(SUM(amount + tip), 0) AS total, COUNT(*) AS count
       FROM orders
       WHERE rider_id = ?
         AND status = "completed"
         AND YEAR(confirmed_at) = YEAR(CURDATE())
         AND MONTH(confirmed_at) = MONTH(CURDATE())`,
      [req.user.id]
    );
    const [wallets] = await pool.query('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);
    res.json({ code: 0, data: { todayIncome: today.total, monthIncome: month.total, monthOrders: month.count, balance: wallets[0]?.balance || 0 } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 提现
exports.withdraw = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { amount } = req.body;
    const amt = Number(amount);
    if (!amt || amt <= 0) { await connection.rollback(); return res.status(400).json({ code: 400, message: '提现金额不合法' }); }
    const [wallets] = await connection.query('SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE', [req.user.id]);
    if (!wallets[0] || Number(wallets[0].balance) < amt) { await connection.rollback(); return res.status(400).json({ code: 400, message: '余额不足' }); }

    // 扣减钱包余额
    await connection.query(
      'UPDATE wallets SET balance = balance - ?, total_expense = total_expense + ?, updated_at = NOW() WHERE user_id = ?',
      [amt, amt, req.user.id]
    );
    const [w2] = await connection.query('SELECT balance FROM wallets WHERE user_id = ?', [req.user.id]);
    const balanceAfter = w2[0].balance;

    // 写流水
    await connection.query(
      `INSERT INTO wallet_records (user_id, type, amount, balance_after, source, ref_id, description, created_at)
       VALUES (?, 'withdraw', ?, ?, 'withdraw', NULL, '提现申请', NOW())`,
      [req.user.id, amt, balanceAfter]
    );
    // 创建提现申请
    const [result] = await connection.query(
      'INSERT INTO withdrawals (rider_id, amount, status, created_at) VALUES (?, ?, "pending", NOW())',
      [req.user.id, amt]
    );
    await connection.commit();
    res.json({ code: 0, message: '提现申请已提交', data: { id: result.insertId, balance: balanceAfter } });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '申请失败', error: err.message });
  } finally {
    connection.release();
  }
};
