-- ============================================================
-- 核心业务修复迁移
-- 适用已有 campus_errand 数据库，可重复执行
-- ============================================================

USE `campus_errand`;

-- users.student_no
SET @student_no_exists = (
  SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND COLUMN_NAME = 'student_no'
);
SET @student_no_sql = IF(
  @student_no_exists = 0,
  'ALTER TABLE `users` ADD COLUMN `student_no` VARCHAR(30) DEFAULT NULL COMMENT ''关联学号'' AFTER `phone`',
  'SELECT 1'
);
PREPARE student_no_stmt FROM @student_no_sql;
EXECUTE student_no_stmt;
DEALLOCATE PREPARE student_no_stmt;

SET @student_no_index_exists = (
  SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'users' AND INDEX_NAME = 'idx_student_no'
);
SET @student_no_index_sql = IF(
  @student_no_index_exists = 0,
  'ALTER TABLE `users` ADD UNIQUE KEY `idx_student_no` (`student_no`)',
  'SELECT 1'
);
PREPARE student_no_index_stmt FROM @student_no_index_sql;
EXECUTE student_no_index_stmt;
DEALLOCATE PREPARE student_no_index_stmt;

-- 学校学生信息表
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
  UNIQUE KEY `idx_student_phone` (`phone`),
  KEY `idx_name` (`name`),
  KEY `idx_campus` (`campus`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='学校学生信息表';

-- 定价配置表
CREATE TABLE IF NOT EXISTS `pricing_configs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `type` VARCHAR(30) NOT NULL COMMENT '服务类型',
  `name` VARCHAR(50) NOT NULL COMMENT '名称',
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础价',
  `per_km` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '每公里加价',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '说明',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/inactive',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定价配置表';

SET @pricing_type_index = (
  SELECT MAX(NON_UNIQUE) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE()
    AND TABLE_NAME = 'pricing_configs'
    AND INDEX_NAME = 'idx_type'
);
SET @pricing_type_index_sql = CASE
  WHEN @pricing_type_index IS NULL
    THEN 'ALTER TABLE `pricing_configs` ADD UNIQUE KEY `idx_type` (`type`)'
  WHEN @pricing_type_index = 1
    THEN 'ALTER TABLE `pricing_configs` DROP INDEX `idx_type`, ADD UNIQUE KEY `idx_type` (`type`)'
  ELSE 'SELECT 1'
END;
PREPARE pricing_type_index_stmt FROM @pricing_type_index_sql;
EXECUTE pricing_type_index_stmt;
DEALLOCATE PREPARE pricing_type_index_stmt;

-- 系统设置表
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `setting_key` VARCHAR(50) NOT NULL COMMENT '设置键',
  `setting_value` VARCHAR(500) DEFAULT NULL COMMENT '设置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '说明',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- 兼容旧订单：已送达但未确认的订单进入 delivered 状态
UPDATE `orders`
SET `status` = 'delivered'
WHERE `status` = 'delivering' AND `delivered_at` IS NOT NULL;

-- 补齐实付金额，避免统计始终为 0
UPDATE `orders`
SET `pay_amount` = ROUND(`amount` + COALESCE(`tip`, 0) + COALESCE(`insurance`, 0), 2)
WHERE `pay_amount` IS NULL OR `pay_amount` = 0;

-- 学生测试数据
INSERT INTO `students` (`name`, `student_no`, `phone`, `campus`, `college`, `major`, `grade`) VALUES
('张三', '2021001001', '13800001001', '主校区', '计算机学院', '软件工程', '2021级'),
('李四', '2021001002', '13800001002', '主校区', '计算机学院', '计算机科学与技术', '2021级'),
('王五', '2021002001', '13800001003', '主校区', '经济管理学院', '工商管理', '2021级'),
('赵六', '2022001001', '13800001004', '东校区', '文学院', '汉语言文学', '2022级'),
('钱七', '2022002001', '13800001005', '西校区', '理学院', '数学与应用数学', '2022级'),
('孙八', '2023001001', '13800001006', '主校区', '计算机学院', '软件工程', '2023级'),
('周九', '2023001002', '13800001007', '主校区', '计算机学院', '人工智能', '2023级'),
('吴十', '2024001001', '13800001008', '东校区', '外国语学院', '英语', '2024级')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `campus` = VALUES(`campus`),
  `college` = VALUES(`college`),
  `major` = VALUES(`major`),
  `grade` = VALUES(`grade`),
  `status` = 'active';

-- 定价和系统设置初始数据
INSERT INTO `pricing_configs` (`type`, `name`, `base_price`, `per_km`, `description`, `status`) VALUES
('express', '快递代取', 2.00, 1.00, '快递代取上门服务费', 'active'),
('canteen', '食堂代购', 3.00, 1.00, '食堂代购排队与配送', 'active'),
('supermarket', '商超代购', 4.00, 1.50, '超市/便利店代购', 'active'),
('errand', '代办事务', 5.00, 1.50, '打印、送文件等代办事务', 'active'),
('other', '万能跑腿', 6.00, 2.00, '其他各类跑腿需求', 'active')
ON DUPLICATE KEY UPDATE
  `name` = VALUES(`name`),
  `base_price` = VALUES(`base_price`),
  `per_km` = VALUES(`per_km`),
  `description` = VALUES(`description`),
  `status` = VALUES(`status`);

INSERT INTO `system_settings` (`setting_key`, `setting_value`, `description`) VALUES
('platform_name', '校园跑腿', '平台名称'),
('service_hours', '08:00-22:00', '服务时间'),
('min_order_amount', '2', '最低下单金额(元)'),
('delivery_range', '3', '配送范围(公里)'),
('auto_accept', '0', '是否自动接单 0否1是'),
('customer_service_phone', '400-000-0000', '客服电话')
ON DUPLICATE KEY UPDATE
  `setting_value` = VALUES(`setting_value`),
  `description` = VALUES(`description`);
