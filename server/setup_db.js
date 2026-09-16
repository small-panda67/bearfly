// 一次性初始化脚本：创建缺失表 + 写入初始数据 + 验证现有表
require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '123456',
    database: process.env.DB_NAME || 'campus_errand',
    charset: 'utf8mb4'
  });

  // 1. 查看现有表
  const [tables] = await conn.query("SHOW TABLES");
  console.log('现有表:', tables.map(t => Object.values(t)[0]).join(', '));

  // 2. 创建 pricing_configs
  await conn.query(`
    CREATE TABLE IF NOT EXISTS pricing_configs (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      type VARCHAR(30) NOT NULL COMMENT '服务类型 express/canteen/supermarket/errand/other',
      name VARCHAR(50) NOT NULL COMMENT '名称',
      base_price DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础价',
      per_km DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '每公里价',
      description VARCHAR(255) DEFAULT NULL,
      status VARCHAR(20) DEFAULT 'active' COMMENT 'active/inactive',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY idx_type (type)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定价配置表'
  `);

  // 3. 创建 system_settings
  await conn.query(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      setting_key VARCHAR(50) NOT NULL,
      setting_value VARCHAR(500) DEFAULT NULL,
      description VARCHAR(255) DEFAULT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_key (setting_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表'
  `);

  // 4. 初始定价数据
  const [pc] = await conn.query('SELECT COUNT(*) c FROM pricing_configs');
  if (pc[0].c === 0) {
    await conn.query(`
      INSERT INTO pricing_configs (type, name, base_price, per_km, description, status) VALUES
      ('express', '快递代取', 2.00, 1.00, '快递代取上门服务费', 'active'),
      ('canteen', '食堂代购', 3.00, 1.00, '食堂代购排队与配送', 'active'),
      ('supermarket', '商超代购', 4.00, 1.50, '超市/便利店代购', 'active'),
      ('errand', '代办事务', 5.00, 1.50, '打印、送文件等代办事务', 'active'),
      ('other', '万能跑腿', 6.00, 2.00, '其他各类跑腿需求', 'active')
    `);
    console.log('pricing_configs 初始数据已写入');
  } else {
    console.log('pricing_configs 已有数据，跳过初始插入');
  }

  // 5. 初始系统设置
  const [ss] = await conn.query('SELECT COUNT(*) c FROM system_settings');
  if (ss[0].c === 0) {
    await conn.query(`
      INSERT INTO system_settings (setting_key, setting_value, description) VALUES
      ('platform_name', '校园跑腿', '平台名称'),
      ('service_hours', '08:00-22:00', '服务时间'),
      ('min_order_amount', '2', '最低下单金额(元)'),
      ('delivery_range', '3', '配送范围(公里)'),
      ('auto_accept', '0', '是否自动接单 0否1是'),
      ('customer_service_phone', '400-000-0000', '客服电话')
    `);
    console.log('system_settings 初始数据已写入');
  } else {
    console.log('system_settings 已有数据，跳过初始插入');
  }

  // 6. 验证关键表存在
  const need = ['users','admins','riders','orders','order_tracks','wallets','wallet_records','withdrawals','coupons','user_coupons','notices','campuses','complaints','rider_applications','pricing_configs','system_settings'];
  const existing = new Set(tables.map(t => Object.values(t)[0]));
  const missing = need.filter(n => !existing.has(n));
  if (missing.length) {
    console.log('缺少表:', missing.join(', '));
  } else {
    console.log('所有关键表均存在');
  }

  await conn.end();
})().catch(e => { console.error('初始化失败:', e.message); process.exit(1); });
