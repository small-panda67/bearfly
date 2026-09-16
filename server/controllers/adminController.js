// server/controllers/adminController.js - 管理员控制器
const { pool } = require('../config/db');

// 数据看板
exports.getDashboard = async (req, res) => {
  try {
    const [[todayOrders]] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()');
    const [[todayGmv]] = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM orders WHERE status = "completed" AND DATE(created_at) = CURDATE()');
    const [[newUsers]] = await pool.query('SELECT COUNT(*) as count FROM users WHERE DATE(created_at) = CURDATE()');
    const [[activeRiders]] = await pool.query('SELECT COUNT(*) as count FROM riders WHERE is_online = 1');
    const [[pendingAudit]] = await pool.query('SELECT COUNT(*) as count FROM rider_applications WHERE status = "pending"');
    const [[pendingComplaint]] = await pool.query('SELECT COUNT(*) as count FROM complaints WHERE status = "pending"');
    const [[pendingWithdraw]] = await pool.query('SELECT COUNT(*) as count FROM withdrawals WHERE status = "pending"');

    res.json({
      code: 0,
      data: {
        todayOrders: todayOrders.count,
        todayGmv: todayGmv.total,
        newUsers: newUsers.count,
        activeRiders: activeRiders.count,
        todos: {
          riderAudit: pendingAudit.count,
          complaint: pendingComplaint.count,
          withdraw: pendingWithdraw.count
        }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 用户列表
exports.getUsers = async (req, res) => {
  try {
    const { keyword, campus, status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT id, phone, nickname, avatar, gender, campus, role, status, created_at FROM users WHERE 1=1';
    const params = [];
    if (keyword) { sql += ' AND (phone LIKE ? OR nickname LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (campus) { sql += ' AND campus = ?'; params.push(campus); }
    if (status) { sql += ' AND status = ?'; params.push(status); }
    sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (page - 1) * pageSize);
    const [users] = await pool.query(sql, params);
    const [[total]] = await pool.query('SELECT COUNT(*) as count FROM users');
    res.json({ code: 0, data: { list: users, total: total.count, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 更新用户状态
exports.updateUserStatus = async (req, res) => {
  try {
    await pool.query('UPDATE users SET status = ? WHERE id = ?', [req.body.status, req.params.id]);
    res.json({ code: 0, message: '操作成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  }
};

// 跑腿员列表
exports.getRiders = async (req, res) => {
  try {
    const { keyword, campus, status, page = 1, pageSize = 20 } = req.query;
    let sql = `SELECT r.*, u.nickname, u.phone, u.campus FROM riders r
               JOIN users u ON r.user_id = u.id WHERE 1=1`;
    const params = [];
    if (keyword) { sql += ' AND (u.phone LIKE ? OR u.nickname LIKE ?)'; params.push(`%${keyword}%`, `%${keyword}%`); }
    if (campus) { sql += ' AND u.campus = ?'; params.push(campus); }
    sql += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (page - 1) * pageSize);
    const [riders] = await pool.query(sql, params);
    res.json({ code: 0, data: { list: riders, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 跑腿员入驻申请列表
exports.getRiderApplications = async (req, res) => {
  try {
    const [applications] = await pool.query('SELECT * FROM rider_applications WHERE status = "pending" ORDER BY created_at DESC');
    res.json({ code: 0, data: applications });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 审核跑腿员入驻
exports.auditRiderApplication = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { status, reason } = req.body;
    await connection.query('UPDATE rider_applications SET status = ?, audit_reason = ?, audited_at = NOW() WHERE id = ?', [status, reason || '', req.params.id]);
    if (status === 'approved') {
      const [apps] = await connection.query('SELECT * FROM rider_applications WHERE id = ?', [req.params.id]);
      await connection.query(
        'INSERT INTO riders (user_id, name, phone, id_card, campus, student_id, level, rating, total_orders, is_online, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 5.0, 0, 0, NOW())',
        [apps[0].user_id, apps[0].name, apps[0].phone, apps[0].id_card, apps[0].campus, apps[0].student_id]
      );
      await connection.query('UPDATE users SET role = "rider" WHERE id = ?', [apps[0].user_id]);
    }
    await connection.commit();
    res.json({ code: 0, message: '审核完成' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '审核失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 订单列表
exports.getOrders = async (req, res) => {
  try {
    const { keyword, type, status, campus, page = 1, pageSize = 20 } = req.query;
    let sql = `SELECT o.*, u.nickname as user_name, r.nickname as rider_name FROM orders o
               LEFT JOIN users u ON o.user_id = u.id LEFT JOIN users r ON o.rider_id = r.id WHERE 1=1`;
    const params = [];
    if (keyword) { sql += ' AND o.order_no LIKE ?'; params.push(`%${keyword}%`); }
    if (type) { sql += ' AND o.type = ?'; params.push(type); }
    if (status) { sql += ' AND o.status = ?'; params.push(status); }
    if (campus) { sql += ' AND o.campus = ?'; params.push(campus); }
    sql += ' ORDER BY o.created_at DESC LIMIT ? OFFSET ?';
    params.push(Number(pageSize), (page - 1) * pageSize);
    const [orders] = await pool.query(sql, params);
    res.json({ code: 0, data: { list: orders, page: Number(page), pageSize: Number(pageSize) } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 投诉列表
exports.getComplaints = async (req, res) => {
  try {
    const [complaints] = await pool.query(`SELECT c.*, u.nickname as complainant_name, r.nickname as respondent_name
      FROM complaints c LEFT JOIN users u ON c.complainant_id = u.id LEFT JOIN users r ON c.respondent_id = r.id
      ORDER BY c.created_at DESC`);
    res.json({ code: 0, data: complaints });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 处理投诉
exports.handleComplaint = async (req, res) => {
  try {
    const { result, punishment } = req.body;
    await pool.query('UPDATE complaints SET status = "resolved", result = ?, punishment = ?, handled_at = NOW(), handler_id = ? WHERE id = ?',
      [result, punishment || '', req.user.id, req.params.id]);
    res.json({ code: 0, message: '处理完成' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '处理失败', error: err.message });
  }
};

// 近N天订单趋势
exports.getOrderTrend = async (req, res) => {
  try {
    const days = Math.min(Math.max(Number(req.query.days) || 7, 1), 90);
    const [rows] = await pool.query(
      `SELECT DATE(created_at) AS d, COUNT(*) AS order_count, COALESCE(SUM(amount), 0) AS gmv
       FROM orders
       WHERE created_at >= (CURDATE() - INTERVAL ? DAY)
       GROUP BY DATE(created_at)
       ORDER BY d ASC`,
      [days - 1]
    );
    // 补齐无数据的日期
    const map = {};
    rows.forEach(r => { map[r.d] = r; });
    const dates = [], orders = [], gmv = [];
    for (let i = days - 1; i >= 0; i--) {
      const day = new Date();
      day.setDate(day.getDate() - i);
      const key = day.toISOString().slice(0, 10);
      const label = `${day.getMonth() + 1}/${day.getDate()}`;
      dates.push(label);
      if (map[key]) {
        orders.push(map[key].order_count);
        gmv.push(Number(map[key].gmv));
      } else {
        orders.push(0);
        gmv.push(0);
      }
    }
    res.json({ code: 0, data: { dates, orders, gmv } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 各服务类型订单占比
exports.getServiceTypeStats = async (req, res) => {
  try {
    const [rows] = await pool.query(
      `SELECT type, COUNT(*) AS cnt FROM orders GROUP BY type`
    );
    const nameMap = {
      express: '快递代取', canteen: '食堂代购', supermarket: '商超代购',
      errand: '代办事务', other: '万能跑腿'
    };
    const data = rows.map(r => ({ name: nameMap[r.type] || r.type, value: Number(r.cnt) }));
    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 当前管理员信息
exports.getAdminInfo = async (req, res) => {
  try {
    const [admins] = await pool.query(
      'SELECT id, username, name, role, status, last_login_at, created_at FROM admins WHERE id = ?',
      [req.user.id]
    );
    if (!admins[0]) return res.status(404).json({ code: 404, message: '管理员不存在' });
    res.json({ code: 0, data: admins[0] });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 管理员查看订单详情（含用户、跑腿员、轨迹）
exports.getOrderDetail = async (req, res) => {
  try {
    const [orders] = await pool.query(
      `SELECT o.*, u.nickname AS user_name, u.phone AS user_phone,
              r.nickname AS rider_name, r.phone AS rider_phone
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users r ON o.rider_id = r.id
       WHERE o.id = ?`,
      [req.params.id]
    );
    if (!orders[0]) return res.status(404).json({ code: 404, message: '订单不存在' });
    const [tracks] = await pool.query(
      'SELECT * FROM order_tracks WHERE order_id = ? ORDER BY created_at ASC',
      [req.params.id]
    );
    res.json({ code: 0, data: { ...orders[0], tracks } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 获取系统设置
exports.getSystemSettings = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT setting_key, setting_value, description FROM system_settings');
    const data = {};
    rows.forEach(r => { data[r.setting_key] = r.setting_value; });
    res.json({ code: 0, data });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 更新系统设置
exports.updateSystemSettings = async (req, res) => {
  try {
    const settings = req.body || {};
    for (const [key, value] of Object.entries(settings)) {
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, String(value)]
      );
    }
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', error: err.message });
  }
};
