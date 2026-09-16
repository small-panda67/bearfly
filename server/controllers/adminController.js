// server/controllers/adminController.js - 管理员控制器
const { pool } = require('../config/db');
const bcrypt = require('bcryptjs');

function getPagination(query, defaultPageSize = 20) {
  const page = Math.max(Number(query.page) || 1, 1);
  const pageSize = Math.min(Math.max(Number(query.pageSize) || defaultPageSize, 1), 100);
  return { page, pageSize, offset: (page - 1) * pageSize };
}

// 数据看板
exports.getDashboard = async (req, res) => {
  try {
    const [[todayOrders]] = await pool.query('SELECT COUNT(*) as count FROM orders WHERE DATE(created_at) = CURDATE()');
    const [[todayGmv]] = await pool.query('SELECT COALESCE(SUM(pay_amount), 0) as total FROM orders WHERE status = "completed" AND DATE(confirmed_at) = CURDATE()');
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
    const { keyword, campus, status } = req.query;
    const { page, pageSize, offset } = getPagination(req.query);
    const conditions = ['1 = 1'];
    const params = [];
    if (keyword) {
      conditions.push('(u.phone LIKE ? OR u.nickname LIKE ? OR CAST(u.id AS CHAR) LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (campus) { conditions.push('u.campus = ?'); params.push(campus); }
    if (status) { conditions.push('u.status = ?'); params.push(status); }

    const whereSql = conditions.join(' AND ');
    const sql = `SELECT u.*, COUNT(o.id) AS order_count
                 FROM users u
                 LEFT JOIN orders o ON o.user_id = u.id
                 WHERE ${whereSql}
                 GROUP BY u.id
                 ORDER BY u.created_at DESC
                 LIMIT ? OFFSET ?`;
    const [users] = await pool.query(sql, [...params, pageSize, offset]);
    const [[total]] = await pool.query(`SELECT COUNT(*) AS count FROM users u WHERE ${whereSql}`, params);
    res.json({ code: 0, data: { list: users, total: total.count, page, pageSize } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 更新用户状态
exports.updateUserStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['normal', 'frozen'].includes(status)) {
      return res.status(400).json({ code: 400, message: '用户状态非法' });
    }
    const [result] = await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, req.params.id]);
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '用户不存在' });
    }
    res.json({ code: 0, message: '操作成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  }
};

// 跑腿员列表
exports.getRiders = async (req, res) => {
  try {
    const { keyword, campus, status } = req.query;
    const { page, pageSize, offset } = getPagination(req.query);
    const conditions = ['1 = 1'];
    const params = [];
    if (keyword) {
      conditions.push('(u.phone LIKE ? OR u.nickname LIKE ? OR r.name LIKE ? OR CAST(r.id AS CHAR) LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (campus) { conditions.push('u.campus = ?'); params.push(campus); }
    if (status === 'online') conditions.push('r.is_online = 1');
    if (status === 'rest' || status === 'offline') conditions.push('r.is_online = 0');
    if (status === 'disabled') conditions.push('r.status = "disabled"');
    if (status === 'normal') conditions.push('r.status = "normal"');

    const whereSql = conditions.join(' AND ');
    const sql = `SELECT r.*, u.nickname, u.phone, u.campus
                 FROM riders r
                 JOIN users u ON r.user_id = u.id
                 WHERE ${whereSql}
                 ORDER BY r.created_at DESC
                 LIMIT ? OFFSET ?`;
    const [riders] = await pool.query(sql, [...params, pageSize, offset]);
    const [[total]] = await pool.query(
      `SELECT COUNT(*) AS count FROM riders r JOIN users u ON r.user_id = u.id WHERE ${whereSql}`,
      params
    );
    res.json({ code: 0, data: { list: riders, total: total.count, page, pageSize } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 跑腿员入驻申请列表
exports.getRiderApplications = async (req, res) => {
  try {
    const allowedStatuses = ['pending', 'approved', 'rejected'];
    const status = allowedStatuses.includes(req.query.status) ? req.query.status : 'pending';
    const [applications] = await pool.query(
      'SELECT * FROM rider_applications WHERE status = ? ORDER BY created_at DESC',
      [status]
    );
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
    if (!['approved', 'rejected'].includes(status)) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '审核状态非法' });
    }
    const [applications] = await connection.query(
      'SELECT * FROM rider_applications WHERE id = ? FOR UPDATE',
      [req.params.id]
    );
    const application = applications[0];
    if (!application) {
      await connection.rollback();
      return res.status(404).json({ code: 404, message: '入驻申请不存在' });
    }
    if (application.status !== 'pending') {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '该申请已审核，请勿重复操作' });
    }

    await connection.query(
      'UPDATE rider_applications SET status = ?, audit_reason = ?, audited_at = NOW() WHERE id = ?',
      [status, reason || '', req.params.id]
    );
    if (status === 'approved') {
      await connection.query(
        `INSERT INTO riders
         (user_id, name, phone, id_card, campus, student_id, level, rating, total_orders, is_online, status, created_at)
         VALUES (?, ?, ?, ?, ?, ?, 1, 5.0, 0, 0, "normal", NOW())
         ON DUPLICATE KEY UPDATE
           name = VALUES(name),
           phone = VALUES(phone),
           id_card = VALUES(id_card),
           campus = VALUES(campus),
           student_id = VALUES(student_id),
           status = "normal"`,
        [application.user_id, application.name, application.phone, application.id_card, application.campus, application.student_id]
      );
      await connection.query('UPDATE users SET role = "rider" WHERE id = ?', [application.user_id]);
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
    const { keyword, type, status, campus } = req.query;
    const { page, pageSize, offset } = getPagination(req.query);
    const conditions = ['1 = 1'];
    const params = [];
    if (keyword) {
      conditions.push('(o.order_no LIKE ? OR u.nickname LIKE ? OR u.phone LIKE ? OR r.nickname LIKE ? OR r.phone LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`, `%${keyword}%`);
    }
    if (type) { conditions.push('o.type = ?'); params.push(type); }
    if (status) { conditions.push('o.status = ?'); params.push(status); }
    if (campus) { conditions.push('o.campus = ?'); params.push(campus); }

    const whereSql = conditions.join(' AND ');
    const sql = `SELECT o.*, u.nickname AS user_name, r.nickname AS rider_name
                 FROM orders o
                 LEFT JOIN users u ON o.user_id = u.id
                 LEFT JOIN users r ON o.rider_id = r.id
                 WHERE ${whereSql}
                 ORDER BY o.created_at DESC
                 LIMIT ? OFFSET ?`;
    const [orders] = await pool.query(sql, [...params, pageSize, offset]);
    const [[total]] = await pool.query(
      `SELECT COUNT(*) AS count
       FROM orders o
       LEFT JOIN users u ON o.user_id = u.id
       LEFT JOIN users r ON o.rider_id = r.id
       WHERE ${whereSql}`,
      params
    );
    res.json({ code: 0, data: { list: orders, total: total.count, page, pageSize } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 投诉列表
exports.getComplaints = async (req, res) => {
  try {
    const conditions = ['1 = 1'];
    const params = [];
    if (req.query.status) { conditions.push('c.status = ?'); params.push(req.query.status); }
    if (req.query.type) { conditions.push('c.type = ?'); params.push(req.query.type); }
    const [complaints] = await pool.query(
      `SELECT c.*, o.order_no, u.nickname AS complainant_name, r.nickname AS respondent_name
       FROM complaints c
       LEFT JOIN orders o ON c.order_id = o.id
       LEFT JOIN users u ON c.complainant_id = u.id
       LEFT JOIN users r ON c.respondent_id = r.id
       WHERE ${conditions.join(' AND ')}
       ORDER BY c.created_at DESC`,
      params
    );
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
      `SELECT DATE(created_at) AS d,
              COUNT(*) AS order_count,
              COALESCE(SUM(CASE WHEN status = "completed" THEN pay_amount ELSE 0 END), 0) AS gmv
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
      const key = [
        day.getFullYear(),
        String(day.getMonth() + 1).padStart(2, '0'),
        String(day.getDate()).padStart(2, '0')
      ].join('-');
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
      `SELECT type, COUNT(*) AS cnt FROM orders WHERE status != "cancelled" GROUP BY type`
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
    const booleanKeys = ['auto_accept'];
    const numberKeys = ['min_order_amount', 'delivery_range'];
    rows.forEach(r => {
      if (booleanKeys.includes(r.setting_key)) {
        data[r.setting_key] = r.setting_value === '1' || r.setting_value === 'true';
      } else if (numberKeys.includes(r.setting_key)) {
        data[r.setting_key] = Number(r.setting_value);
      } else {
        data[r.setting_key] = r.setting_value;
      }
    });
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
      const normalizedValue = typeof value === 'boolean'
        ? (value ? '1' : '0')
        : String(value);
      await pool.query(
        `INSERT INTO system_settings (setting_key, setting_value) VALUES (?, ?)
         ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value), updated_at = NOW()`,
        [key, normalizedValue]
      );
    }
    res.json({ code: 0, message: '更新成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '更新失败', error: err.message });
  }
};

// 启用或禁用跑腿员
exports.updateRiderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    if (!['normal', 'disabled'].includes(status)) {
      return res.status(400).json({ code: 400, message: '跑腿员状态非法' });
    }
    const [result] = await pool.query(
      'UPDATE riders SET status = ?, is_online = CASE WHEN ? = "disabled" THEN 0 ELSE is_online END WHERE id = ?',
      [status, status, req.params.id]
    );
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, message: '跑腿员不存在' });
    }
    res.json({ code: 0, message: status === 'disabled' ? '已禁用' : '已启用' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  }
};

// 修改管理员密码
exports.updateAdminPassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ code: 400, message: '原密码和新密码不能为空' });
    }
    if (String(newPassword).length < 6) {
      return res.status(400).json({ code: 400, message: '新密码长度不能少于6位' });
    }
    const [admins] = await pool.query('SELECT password FROM admins WHERE id = ?', [req.user.id]);
    if (!admins[0]) {
      return res.status(404).json({ code: 404, message: '管理员不存在' });
    }
    const valid = await bcrypt.compare(oldPassword, admins[0].password);
    if (!valid) {
      return res.status(400).json({ code: 400, message: '原密码错误' });
    }
    const passwordHash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE admins SET password = ?, updated_at = NOW() WHERE id = ?', [passwordHash, req.user.id]);
    res.json({ code: 0, message: '密码修改成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '修改失败', error: err.message });
  }
};
