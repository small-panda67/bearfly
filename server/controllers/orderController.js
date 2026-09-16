// server/controllers/orderController.js - 订单控制器
const { pool } = require('../config/db');

// 写订单轨迹（在给定连接上执行，兼容普通 pool.query）
async function writeTrack(conn, orderId, status, description, operatorType, operatorId) {
  await conn.query(
    'INSERT INTO order_tracks (order_id, status, description, operator_type, operator_id, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
    [orderId, status, description, operatorType, operatorId || null]
  );
}

// 创建订单
exports.create = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const { type, campus, pickup_address, delivery_address, pickup_name, delivery_name, pickup_phone, delivery_phone, amount, tip, insurance, remark, item_desc, item_size } = req.body;

    // 生成订单号
    const orderNo = 'OD' + Date.now() + Math.floor(Math.random() * 1000);

    const [result] = await connection.query(
      `INSERT INTO orders (order_no, user_id, type, campus, pickup_address, delivery_address,
       pickup_name, delivery_name, pickup_phone, delivery_phone, amount, tip, insurance,
       remark, item_desc, item_size, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, "pending", NOW())`,
      [orderNo, req.user.id, type, campus, pickup_address, delivery_address, pickup_name, delivery_name, pickup_phone, delivery_phone, amount, tip || 0, insurance || 0, remark, item_desc, item_size]
    );

    await writeTrack(connection, result.insertId, 'created', '订单已创建', 'user', req.user.id);
    await connection.commit();
    res.json({ code: 0, message: '下单成功', data: { id: result.insertId, order_no: orderNo } });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '下单失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 我的订单
exports.getMyOrders = async (req, res) => {
  try {
    const { status, page = 1, pageSize = 20 } = req.query;
    let sql = 'SELECT o.*, r.nickname as rider_name, r.phone as rider_phone FROM orders o LEFT JOIN users r ON o.rider_id = r.id WHERE o.user_id = ?';
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

// 订单详情
exports.getDetail = async (req, res) => {
  try {
    const [orders] = await pool.query(
      'SELECT o.*, u.nickname as user_name, u.phone as user_phone, r.nickname as rider_name, r.phone as rider_phone FROM orders o LEFT JOIN users u ON o.user_id = u.id LEFT JOIN users r ON o.rider_id = r.id WHERE o.id = ?',
      [req.params.id]
    );
    if (!orders[0]) return res.status(404).json({ code: 404, message: '订单不存在' });
    // 订单轨迹
    const [tracks] = await pool.query('SELECT * FROM order_tracks WHERE order_id = ? ORDER BY created_at ASC', [req.params.id]);
    res.json({ code: 0, data: { ...orders[0], tracks } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '获取失败', error: err.message });
  }
};

// 取消订单
exports.cancel = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? AND user_id = ? FOR UPDATE', [req.params.id, req.user.id]);
    if (!orders[0]) { await connection.rollback(); return res.status(404).json({ code: 404, message: '订单不存在' }); }
    if (!['pending', 'picked'].includes(orders[0].status)) {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '当前状态不可取消' });
    }
    await connection.query('UPDATE orders SET status = "cancelled", cancelled_at = NOW(), cancel_reason = ? WHERE id = ?', [req.body.reason || '用户取消', req.params.id]);
    await writeTrack(connection, req.params.id, 'cancelled', '订单已取消：' + (req.body.reason || '用户取消'), 'user', req.user.id);
    await connection.commit();
    res.json({ code: 0, message: '取消成功' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '取消失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 确认收货
exports.confirm = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [orders] = await connection.query('SELECT * FROM orders WHERE id = ? FOR UPDATE', [req.params.id]);
    if (!orders[0]) { await connection.rollback(); return res.status(404).json({ code: 404, message: '订单不存在' }); }
    if (orders[0].user_id !== req.user.id) { await connection.rollback(); return res.status(403).json({ code: 403, message: '无权操作该订单' }); }
    if (orders[0].status !== 'delivering') {
      await connection.rollback();
      return res.status(400).json({ code: 400, message: '订单当前状态不可确认收货' });
    }
    await connection.query('UPDATE orders SET status = "completed", confirmed_at = NOW() WHERE id = ?', [req.params.id]);
    await writeTrack(connection, req.params.id, 'confirmed', '用户已确认收货', 'user', req.user.id);
    await connection.commit();
    res.json({ code: 0, message: '确认成功' });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '操作失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 评价
exports.rate = async (req, res) => {
  try {
    const { rating, content } = req.body;
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ code: 400, message: '评分必须在1-5之间' });
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!orders[0]) return res.status(404).json({ code: 404, message: '订单不存在' });
    if (orders[0].status !== 'completed') return res.status(400).json({ code: 400, message: '订单未完成，无法评价' });
    if (orders[0].rated) return res.status(400).json({ code: 400, message: '该订单已评价' });
    await pool.query(
      'INSERT INTO order_ratings (order_id, user_id, rating, content, created_at) VALUES (?, ?, ?, ?, NOW())',
      [req.params.id, req.user.id, rating, content || '']
    );
    await pool.query('UPDATE orders SET rated = 1 WHERE id = ?', [req.params.id]);
    res.json({ code: 0, message: '评价成功' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '评价失败', error: err.message });
  }
};

// 用户提交投诉
exports.submitComplaint = async (req, res) => {
  try {
    const { type, content, images } = req.body;
    if (!content) return res.status(400).json({ code: 400, message: '投诉内容不能为空' });
    const [orders] = await pool.query('SELECT * FROM orders WHERE id = ? AND user_id = ?', [req.params.id, req.user.id]);
    if (!orders[0]) return res.status(404).json({ code: 404, message: '订单不存在' });
    const respondentId = orders[0].rider_id || null;
    const [result] = await pool.query(
      `INSERT INTO complaints (order_id, complainant_id, respondent_id, type, content, images, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, "pending", NOW())`,
      [req.params.id, req.user.id, respondentId, type || 'service', content, images ? (Array.isArray(images) ? JSON.stringify(images) : images) : null]
    );
    res.json({ code: 0, message: '投诉已提交', data: { id: result.insertId } });
  } catch (err) {
    res.status(500).json({ code: 500, message: '提交失败', error: err.message });
  }
};
