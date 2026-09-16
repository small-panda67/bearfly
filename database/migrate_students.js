// database/migrate_students.js - 执行学生信息表迁移
const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '123456',
    multipleStatements: true
  });

  try {
    // 1. 执行主迁移脚本（创建表+插入数据）
    const sql = fs.readFileSync(path.join(__dirname, 'migration_students.sql'), 'utf8');
    await conn.query(sql);
    console.log('✓ 学生信息表创建并插入数据完成');

    // 2. 检查并添加 users.student_no 字段
    const [cols] = await conn.query('SHOW COLUMNS FROM campus_errand.users LIKE "student_no"');
    if (cols.length === 0) {
      await conn.query('ALTER TABLE campus_errand.users ADD COLUMN student_no VARCHAR(30) DEFAULT NULL COMMENT "关联学号" AFTER phone');
      await conn.query('ALTER TABLE campus_errand.users ADD INDEX idx_student_no (student_no)');
      console.log('✓ users表已添加student_no字段');
    } else {
      console.log('✓ users表student_no字段已存在');
    }

    // 3. 验证
    const [rows] = await conn.query('SELECT COUNT(*) as c FROM campus_errand.students');
    console.log(`\n迁移完成！学生信息表共 ${rows[0].c} 条测试数据`);
    console.log('\n测试学生账号（姓名/学号/手机号）：');
    const [students] = await conn.query('SELECT name, student_no, phone FROM campus_errand.students LIMIT 5');
    students.forEach(s => console.log(`  ${s.name} / ${s.student_no} / ${s.phone}`));
  } catch (err) {
    console.error('迁移失败:', err.message);
  } finally {
    await conn.end();
  }
})();
