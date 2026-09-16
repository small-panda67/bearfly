// database/init.js - 使用 Node.js 执行数据库初始化脚本
const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

// 数据库配置（与 server/.env 一致）
const DB_CONFIG = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '123456',
  multipleStatements: true,  // 允许多语句执行
  charset: 'utf8mb4'
};

const SQL_FILE = path.join(__dirname, 'init.sql');

async function initDatabase() {
  console.log('========================================');
  console.log('校园跑腿 - 数据库初始化');
  console.log('========================================\n');

  // 1. 连接 MySQL
  console.log('[1/4] 连接 MySQL 服务器...');
  let connection;
  try {
    connection = await mysql.createConnection(DB_CONFIG);
    console.log('      ✓ MySQL 连接成功\n');
  } catch (err) {
    console.error('      ✗ MySQL 连接失败!');
    console.error('      错误信息:', err.message);
    if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.error('\n      可能原因：数据库密码不正确');
      console.error('      请修改本文件中的 DB_CONFIG.password 为你的 MySQL root 密码');
      console.error('      同时修改 server/.env 中的 DB_PASSWORD');
    }
    process.exit(1);
  }

  // 2. 读取 SQL 文件
  console.log('[2/4] 读取初始化脚本...');
  let sqlContent;
  try {
    sqlContent = fs.readFileSync(SQL_FILE, 'utf8');
    console.log(`      ✓ 已读取 ${SQL_FILE}`);
    console.log(`      文件大小: ${(sqlContent.length / 1024).toFixed(1)} KB\n`);
  } catch (err) {
    console.error('      ✗ 读取 SQL 文件失败:', err.message);
    await connection.end();
    process.exit(1);
  }

  // 3. 执行 SQL
  console.log('[3/4] 执行数据库初始化...');
  try {
    // 移除注释行，避免多语句执行时的问题
    const lines = sqlContent.split('\n');
    const cleanLines = lines.filter(line => {
      const trimmed = line.trim();
      return !trimmed.startsWith('--') && trimmed.length > 0;
    });
    const cleanSql = cleanLines.join('\n');

    await connection.query(cleanSql);
    console.log('      ✓ SQL 执行成功\n');
  } catch (err) {
    console.error('      ✗ SQL 执行失败:', err.message);
    await connection.end();
    process.exit(1);
  }

  // 4. 验证结果
  console.log('[4/4] 验证数据库...');
  try {
    // 切换到目标数据库
    await connection.query('USE campus_errand');

    // 查询所有表
    const [tables] = await connection.query('SHOW TABLES');
    console.log(`      ✓ 数据库 campus_errand 已创建`);
    console.log(`      ✓ 共 ${tables.length} 张表:`);
    tables.forEach((t, i) => {
      const tableName = Object.values(t)[0];
      console.log(`         ${String(i + 1).padStart(2, ' ')}. ${tableName}`);
    });

    // 验证初始数据
    const [admins] = await connection.query('SELECT username, role FROM admins');
    console.log(`\n      ✓ 管理员账号: ${admins.length} 个`);
    admins.forEach(a => console.log(`         - ${a.username} (${a.role})`));

    const [campuses] = await connection.query('SELECT name FROM campuses');
    console.log(`\n      ✓ 校区数据: ${campuses.length} 个`);
    campuses.forEach(c => console.log(`         - ${c.name}`));

    const [coupons] = await connection.query('SELECT name FROM coupons');
    console.log(`\n      ✓ 优惠券数据: ${coupons.length} 张`);
    coupons.forEach(c => console.log(`         - ${c.name}`));

    console.log('\n========================================');
    console.log('数据库初始化完成!');
    console.log('========================================');
    console.log('\n默认管理员账号: admin / admin123');
    console.log('小程序测试验证码: 123456');
    console.log('\n下一步: 启动后端服务');
    console.log('  cd server');
    console.log('  node app.js');
  } catch (err) {
    console.error('      ✗ 验证失败:', err.message);
  } finally {
    await connection.end();
  }
}

initDatabase();
