// server/controllers/authController.js - 认证控制器
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const { pool } = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'campus_errand_jwt_secret_key_2026';

// 生成 token
function generateToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, phone: user.phone || '' },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// 生成临时 token（用于手机号绑定阶段，有效期10分钟）
function generateTempToken(student) {
  return jwt.sign(
    { studentId: student.id, studentNo: student.student_no, type: 'temp_bind' },
    JWT_SECRET,
    { expiresIn: '10m' }
  );
}

// 新用户创建钱包（在事务连接上执行）
async function ensureWallet(connection, userId) {
  await connection.query(
    'INSERT IGNORE INTO wallets (user_id, balance, created_at) VALUES (?, 0, NOW())',
    [userId]
  );
}

// 微信登录
exports.wxLogin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ code: 400, message: '缺少 code 参数' });

    // 生产环境应调用微信 jscode2session 换取 openid，此处根据 code 生成确定性 openid
    const openid = 'wx_' + crypto.createHash('md5').update(String(code)).digest('hex').slice(0, 24);

    await connection.beginTransaction();
    const [users] = await connection.query('SELECT * FROM users WHERE openid = ?', [openid]);
    let user = users[0];
    if (!user) {
      const [result] = await connection.query(
        'INSERT INTO users (openid, nickname, avatar, role, status, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
        [openid, '微信用户' + openid.slice(-4), '', 'user', 'normal']
      );
      user = { id: result.insertId, openid, nickname: '微信用户' + openid.slice(-4), role: 'user' };
      await ensureWallet(connection, user.id);
    } else {
      await connection.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    }
    await connection.commit();

    const userInfo = {
      id: user.id,
      phone: user.phone || '',
      nickname: user.nickname,
      avatar: user.avatar || '',
      role: user.role,
      campus: user.campus || ''
    };
    res.json({
      code: 0,
      message: '登录成功',
      data: { token: generateToken(user), userInfo }
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '登录失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 手机号登录
exports.phoneLogin = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { phone, code } = req.body;
    if (!phone || !code) return res.status(400).json({ code: 400, message: '参数不完整' });
    // TODO: 接入短信服务验证验证码；测试环境通用验证码 123456
    if (code !== '123456') return res.status(400).json({ code: 400, message: '验证码错误' });

    await connection.beginTransaction();
    const [users] = await connection.query('SELECT * FROM users WHERE phone = ?', [phone]);
    let user = users[0];
    if (!user) {
      const [result] = await connection.query(
        'INSERT INTO users (phone, nickname, role, status, created_at) VALUES (?, ?, ?, ?, NOW())',
        [phone, '用户' + phone.slice(-4), 'user', 'normal']
      );
      user = { id: result.insertId, phone, nickname: '用户' + phone.slice(-4), role: 'user' };
      await ensureWallet(connection, user.id);
    } else {
      await connection.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [user.id]);
    }
    await connection.commit();

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token: generateToken(user),
        userInfo: {
          id: user.id, phone: user.phone, nickname: user.nickname,
          avatar: user.avatar || '', role: user.role, campus: user.campus || ''
        }
      }
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '登录失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 发送验证码
exports.sendCode = async (req, res) => {
  try {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ code: 400, message: '请输入手机号' });
    // TODO: 调用短信服务发送验证码
    res.json({ code: 0, message: '验证码已发送（测试环境验证码：123456）' });
  } catch (err) {
    res.status(500).json({ code: 500, message: '发送失败', error: err.message });
  }
};

// 学生姓名学号登录（第一步验证）
exports.studentLogin = async (req, res) => {
  try {
    const { name, studentNo } = req.body;
    if (!name || !studentNo) {
      return res.status(400).json({ code: 400, message: '请输入姓名和学号' });
    }

    // 1. 验证学校学生信息表
    const [students] = await pool.query(
      'SELECT * FROM students WHERE name = ? AND student_no = ? AND status = "active"',
      [name, studentNo]
    );
    const student = students[0];
    if (!student) {
      return res.status(400).json({ code: 400, message: '姓名或学号错误，或该学生信息未在学校系统中登记' });
    }

    // 2. 检查是否已绑定手机号并注册
    const [users] = await pool.query(
      'SELECT * FROM users WHERE student_no = ? AND phone IS NOT NULL AND phone != ""',
      [studentNo]
    );
    const existingUser = users[0];

    if (existingUser) {
      // 已绑定，直接登录成功
      await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = ?', [existingUser.id]);
      const userInfo = {
        id: existingUser.id,
        phone: existingUser.phone,
        nickname: existingUser.nickname || student.name,
        avatar: existingUser.avatar || '',
        role: existingUser.role,
        campus: existingUser.campus || student.campus,
        studentNo: existingUser.student_no,
        name: student.name
      };
      return res.json({
        code: 0,
        message: '登录成功',
        data: {
          needBindPhone: false,
          token: generateToken(existingUser),
          userInfo
        }
      });
    }

    // 3. 未绑定，返回临时token和学生信息，要求手机号二次验证
    const tempToken = generateTempToken(student);
    return res.json({
      code: 0,
      message: '姓名学号验证通过，请进行手机号绑定验证',
      data: {
        needBindPhone: true,
        tempToken,
        studentInfo: {
          name: student.name,
          studentNo: student.student_no,
          phone: student.phone,  // 返回学校系统登记的手机号，用于提示
          campus: student.campus,
          college: student.college,
          major: student.major
        }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '登录失败', error: err.message });
  }
};

// 绑定手机号（第二步验证）
exports.bindPhone = async (req, res) => {
  const connection = await pool.getConnection();
  try {
    const { tempToken, phone, code } = req.body;
    if (!tempToken || !phone || !code) {
      return res.status(400).json({ code: 400, message: '参数不完整' });
    }

    // 1. 验证临时token
    let decoded;
    try {
      decoded = jwt.verify(tempToken, JWT_SECRET);
    } catch (e) {
      return res.status(401).json({ code: 401, message: '验证会话已过期，请重新进行姓名学号验证' });
    }
    if (decoded.type !== 'temp_bind') {
      return res.status(400).json({ code: 400, message: '无效的验证会话' });
    }

    // 2. 验证验证码（测试环境123456）
    if (code !== '123456') {
      return res.status(400).json({ code: 400, message: '验证码错误' });
    }

    // 3. 验证手机号是否与学校系统登记的一致
    const [students] = await pool.query(
      'SELECT * FROM students WHERE student_no = ? AND status = "active"',
      [decoded.studentNo]
    );
    const student = students[0];
    if (!student) {
      return res.status(400).json({ code: 400, message: '学生信息不存在' });
    }
    if (student.phone !== phone) {
      return res.status(400).json({
        code: 400,
        message: '手机号与学校系统登记的不一致，请使用入学时登记的手机号'
      });
    }

    // 4. 事务：创建或更新用户记录，绑定手机号
    await connection.beginTransaction();

    // 检查是否已有用户记录（可能通过其他方式注册过）
    const [existingUsers] = await connection.query(
      'SELECT * FROM users WHERE student_no = ? OR phone = ?',
      [decoded.studentNo, phone]
    );
    let user;
    if (existingUsers.length > 0) {
      user = existingUsers[0];
      // 更新用户信息
      await connection.query(
        'UPDATE users SET phone = ?, student_no = ?, nickname = ?, campus = ?, last_login_at = NOW() WHERE id = ?',
        [phone, decoded.studentNo, student.name, student.campus, user.id]
      );
      user.phone = phone;
      user.student_no = decoded.studentNo;
      user.nickname = student.name;
      user.campus = student.campus;
    } else {
      // 创建新用户
      const [result] = await connection.query(
        'INSERT INTO users (phone, student_no, nickname, campus, role, status, created_at) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [phone, decoded.studentNo, student.name, student.campus, 'user', 'normal']
      );
      user = {
        id: result.insertId,
        phone,
        student_no: decoded.studentNo,
        nickname: student.name,
        campus: student.campus,
        role: 'user'
      };
      // 创建钱包
      await ensureWallet(connection, user.id);
    }

    await connection.commit();

    // 5. 返回正式token和用户信息
    const userInfo = {
      id: user.id,
      phone: user.phone,
      nickname: user.nickname,
      avatar: user.avatar || '',
      role: user.role,
      campus: user.campus,
      studentNo: user.student_no,
      name: student.name
    };

    res.json({
      code: 0,
      message: '手机号绑定成功，登录完成',
      data: {
        token: generateToken(user),
        userInfo
      }
    });
  } catch (err) {
    await connection.rollback();
    res.status(500).json({ code: 500, message: '绑定失败', error: err.message });
  } finally {
    connection.release();
  }
};

// 管理员登录
exports.adminLogin = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ code: 400, message: '参数不完整' });

    const [admins] = await pool.query('SELECT * FROM admins WHERE username = ? AND status = "normal"', [username]);
    const admin = admins[0];
    if (!admin) return res.status(400).json({ code: 400, message: '账号或密码错误' });

    const isValid = await bcrypt.compare(password, admin.password);
    if (!isValid) return res.status(400).json({ code: 400, message: '账号或密码错误' });

    await pool.query('UPDATE admins SET last_login_at = NOW() WHERE id = ?', [admin.id]);

    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token: generateToken({ id: admin.id, role: 'admin', phone: admin.username }),
        adminInfo: { id: admin.id, username: admin.username, name: admin.name, role: admin.role }
      }
    });
  } catch (err) {
    res.status(500).json({ code: 500, message: '登录失败', error: err.message });
  }
};

// 刷新 token
exports.refreshToken = async (req, res) => {
  try {
    const { token } = req.body;
    const decoded = jwt.verify(token, JWT_SECRET);
    const newToken = generateToken({ id: decoded.id, role: decoded.role, phone: decoded.phone });
    res.json({ code: 0, data: { token: newToken } });
  } catch (err) {
    res.status(401).json({ code: 401, message: 'token 无效或已过期' });
  }
};
