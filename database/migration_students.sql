-- ============================================================
-- 学生信息表迁移脚本
-- 用于学校系统学生信息对接：姓名+学号+手机号验证
-- ============================================================

USE `campus_errand`;

-- 1. 创建学生信息表
CREATE TABLE IF NOT EXISTS `students` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '学生姓名',
  `student_no` VARCHAR(30) NOT NULL COMMENT '学号',
  `phone` VARCHAR(20) NOT NULL COMMENT '绑定手机号',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '所属校区',
  `college` VARCHAR(100) DEFAULT NULL COMMENT '学院',
  `major` VARCHAR(100) DEFAULT NULL COMMENT '专业',
  `grade` VARCHAR(20) DEFAULT NULL COMMENT '年级',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/graduated/frozen',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_student_no` (`student_no`),
  UNIQUE KEY `idx_phone` (`phone`),
  KEY `idx_name` (`name`),
  KEY `idx_campus` (`campus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校学生信息表';

-- 2. 为 users 表增加 student_no 字段（关联学生信息）
-- 注意：MySQL 不支持 ADD COLUMN IF NOT EXISTS，由 Node.js 脚本检查后添加

-- 3. 插入测试学生数据（模拟学校系统导入）
INSERT INTO `students` (`name`, `student_no`, `phone`, `campus`, `college`, `major`, `grade`) VALUES
('张三', '2021001001', '13800001001', '主校区', '计算机学院', '软件工程', '2021级'),
('李四', '2021001002', '13800001002', '主校区', '计算机学院', '计算机科学与技术', '2021级'),
('王五', '2021002001', '13800001003', '主校区', '经济管理学院', '工商管理', '2021级'),
('赵六', '2022001001', '13800001004', '东校区', '文学院', '汉语言文学', '2022级'),
('钱七', '2022002001', '13800001005', '西校区', '理学院', '数学与应用数学', '2022级'),
('孙八', '2023001001', '13800001006', '主校区', '计算机学院', '软件工程', '2023级'),
('周九', '2023001002', '13800001007', '主校区', '计算机学院', '人工智能', '2023级'),
('吴十', '2024001001', '13800001008', '东校区', '外国语学院', '英语', '2024级');

-- 4. 验证数据
SELECT COUNT(*) AS student_count FROM students;
SELECT name, student_no, phone, campus FROM students LIMIT 5;
