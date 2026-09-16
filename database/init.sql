-- ============================================================
-- 校园跑腿微信小程序 - 数据库初始化脚本
-- 数据库: campus_errand
-- 字符集: utf8mb4
-- 创建日期: 2026-09-15
-- ============================================================

-- 创建数据库
CREATE DATABASE IF NOT EXISTS `campus_errand` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `campus_errand`;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE IF NOT EXISTS `users` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `openid` VARCHAR(64) DEFAULT NULL COMMENT '微信openid',
  `unionid` VARCHAR(64) DEFAULT NULL COMMENT '微信unionid',
  `phone` VARCHAR(20) DEFAULT NULL COMMENT '手机号',
  `student_no` VARCHAR(30) DEFAULT NULL COMMENT '关联学号',
  `nickname` VARCHAR(50) DEFAULT NULL COMMENT '昵称',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `gender` TINYINT DEFAULT 0 COMMENT '性别 0未知 1男 2女',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '所属校区',
  `role` VARCHAR(20) DEFAULT 'user' COMMENT '角色 user/rider/admin',
  `status` VARCHAR(20) DEFAULT 'normal' COMMENT '状态 normal/frozen',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_openid` (`openid`),
  UNIQUE KEY `idx_phone` (`phone`),
  UNIQUE KEY `idx_student_no` (`student_no`),
  KEY `idx_campus` (`campus`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户表';

-- ============================================================
-- 2. 学校学生信息表
-- ============================================================
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

-- ============================================================
-- 3. 管理员表
-- ============================================================
CREATE TABLE IF NOT EXISTS `admins` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '管理员ID',
  `username` VARCHAR(50) NOT NULL COMMENT '登录账号',
  `password` VARCHAR(255) NOT NULL COMMENT '密码(bcrypt加密)',
  `name` VARCHAR(50) DEFAULT NULL COMMENT '姓名',
  `role` VARCHAR(20) DEFAULT 'operator' COMMENT '角色 super_admin/operator',
  `status` VARCHAR(20) DEFAULT 'normal' COMMENT '状态 normal/disabled',
  `last_login_at` DATETIME DEFAULT NULL COMMENT '最后登录时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='管理员表';

-- ============================================================
-- 4. 跑腿员表
-- ============================================================
CREATE TABLE IF NOT EXISTS `riders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '跑腿员ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '关联用户ID',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `id_card` VARCHAR(20) DEFAULT NULL COMMENT '身份证号',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '所属校区',
  `student_id` VARCHAR(30) DEFAULT NULL COMMENT '学号',
  `level` INT DEFAULT 1 COMMENT '等级',
  `rating` DECIMAL(3,1) DEFAULT 5.0 COMMENT '评分',
  `total_orders` INT DEFAULT 0 COMMENT '完成订单数',
  `total_income` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计收入',
  `is_online` TINYINT DEFAULT 0 COMMENT '是否在线 0否 1是',
  `auto_accept` TINYINT DEFAULT 0 COMMENT '自动接单 0否 1是',
  `deposit` DECIMAL(10,2) DEFAULT 0.00 COMMENT '保证金',
  `status` VARCHAR(20) DEFAULT 'normal' COMMENT '状态 normal/disabled',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`),
  KEY `idx_campus` (`campus`),
  KEY `idx_is_online` (`is_online`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跑腿员表';

-- ============================================================
-- 5. 跑腿员入驻申请表
-- ============================================================
CREATE TABLE IF NOT EXISTS `rider_applications` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '申请ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(50) NOT NULL COMMENT '真实姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `id_card` VARCHAR(20) DEFAULT NULL COMMENT '身份证号',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '所属校区',
  `student_id` VARCHAR(30) DEFAULT NULL COMMENT '学号',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态 pending/approved/rejected',
  `audit_reason` VARCHAR(255) DEFAULT NULL COMMENT '审核意见',
  `audited_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='跑腿员入驻申请表';

-- ============================================================
-- 6. 地址表
-- ============================================================
CREATE TABLE IF NOT EXISTS `addresses` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `name` VARCHAR(50) NOT NULL COMMENT '收货人姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '收货人电话',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '校区',
  `building` VARCHAR(100) DEFAULT NULL COMMENT '楼栋',
  `room` VARCHAR(50) DEFAULT NULL COMMENT '房间号',
  `is_default` TINYINT DEFAULT 0 COMMENT '是否默认 0否 1是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='收货地址表';

-- ============================================================
-- 7. 订单表
-- ============================================================
CREATE TABLE IF NOT EXISTS `orders` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `order_no` VARCHAR(32) NOT NULL COMMENT '订单号',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '下单用户ID',
  `rider_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '接单跑腿员ID',
  `type` VARCHAR(30) NOT NULL COMMENT '服务类型 express/canteen/supermarket/errand/other',
  `campus` VARCHAR(50) DEFAULT NULL COMMENT '校区',
  `pickup_address` VARCHAR(255) DEFAULT NULL COMMENT '取货地址',
  `delivery_address` VARCHAR(255) DEFAULT NULL COMMENT '送达地址',
  `pickup_name` VARCHAR(50) DEFAULT NULL COMMENT '取货联系人',
  `pickup_phone` VARCHAR(20) DEFAULT NULL COMMENT '取货联系电话',
  `delivery_name` VARCHAR(50) DEFAULT NULL COMMENT '送达联系人',
  `delivery_phone` VARCHAR(20) DEFAULT NULL COMMENT '送达联系电话',
  `item_desc` VARCHAR(500) DEFAULT NULL COMMENT '物品描述',
  `item_size` VARCHAR(20) DEFAULT NULL COMMENT '物品规格 small/medium/large',
  `amount` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '订单金额',
  `tip` DECIMAL(10,2) DEFAULT 0.00 COMMENT '小费',
  `insurance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '保价费',
  `coupon_id` BIGINT DEFAULT NULL COMMENT '使用的优惠券ID',
  `discount_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '优惠金额',
  `pay_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '实付金额',
  `pay_status` VARCHAR(20) DEFAULT 'unpaid' COMMENT '支付状态 unpaid/paid/refunded',
  `pay_time` DATETIME DEFAULT NULL COMMENT '支付时间',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '订单状态 pending/picked/delivering/delivered/completed/cancelled',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `cancel_reason` VARCHAR(255) DEFAULT NULL COMMENT '取消原因',
  `picked_at` DATETIME DEFAULT NULL COMMENT '取货时间',
  `pickup_at` DATETIME DEFAULT NULL COMMENT '确认取货时间',
  `delivered_at` DATETIME DEFAULT NULL COMMENT '送达时间',
  `confirmed_at` DATETIME DEFAULT NULL COMMENT '确认收货时间',
  `cancelled_at` DATETIME DEFAULT NULL COMMENT '取消时间',
  `rated` TINYINT DEFAULT 0 COMMENT '是否已评价 0否 1是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_no` (`order_no`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_rider_id` (`rider_id`),
  KEY `idx_status` (`status`),
  KEY `idx_type` (`type`),
  KEY `idx_campus` (`campus`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单表';

-- ============================================================
-- 8. 订单轨迹表
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_tracks` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '轨迹ID',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `status` VARCHAR(30) NOT NULL COMMENT '状态',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `operator_type` VARCHAR(20) DEFAULT 'system' COMMENT '操作人类型 user/rider/admin/system',
  `operator_id` BIGINT DEFAULT NULL COMMENT '操作人ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单轨迹表';

-- ============================================================
-- 9. 订单评价表
-- ============================================================
CREATE TABLE IF NOT EXISTS `order_ratings` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '评价ID',
  `order_id` BIGINT UNSIGNED NOT NULL COMMENT '订单ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '评价用户ID',
  `rider_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '被评价跑腿员ID',
  `rating` TINYINT NOT NULL COMMENT '评分 1-5',
  `content` VARCHAR(500) DEFAULT NULL COMMENT '评价内容',
  `tags` VARCHAR(255) DEFAULT NULL COMMENT '评价标签',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_order_id` (`order_id`),
  KEY `idx_rider_id` (`rider_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单评价表';

-- ============================================================
-- 10. 钱包表
-- ============================================================
CREATE TABLE IF NOT EXISTS `wallets` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `balance` DECIMAL(10,2) DEFAULT 0.00 COMMENT '余额',
  `frozen_amount` DECIMAL(10,2) DEFAULT 0.00 COMMENT '冻结金额',
  `total_income` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计收入',
  `total_expense` DECIMAL(10,2) DEFAULT 0.00 COMMENT '累计支出',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包表';

-- ============================================================
-- 11. 钱包流水表
-- ============================================================
CREATE TABLE IF NOT EXISTS `wallet_records` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '流水ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `type` VARCHAR(20) NOT NULL COMMENT '类型 income/expense/freeze/unfreeze',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '金额',
  `balance_after` DECIMAL(10,2) DEFAULT NULL COMMENT '变动后余额',
  `source` VARCHAR(30) DEFAULT NULL COMMENT '来源 order/withdraw/recharge/refund/system',
  `ref_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '描述',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_type` (`type`),
  KEY `idx_created_at` (`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='钱包流水表';

-- ============================================================
-- 12. 提现表
-- ============================================================
CREATE TABLE IF NOT EXISTS `withdrawals` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '提现ID',
  `rider_id` BIGINT UNSIGNED NOT NULL COMMENT '跑腿员用户ID',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '提现金额',
  `fee` DECIMAL(10,2) DEFAULT 0.00 COMMENT '手续费',
  `actual_amount` DECIMAL(10,2) DEFAULT NULL COMMENT '实际到账金额',
  `pay_method` VARCHAR(20) DEFAULT 'wechat' COMMENT '提现方式 wechat/alipay/bank',
  `pay_account` VARCHAR(100) DEFAULT NULL COMMENT '收款账号',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态 pending/approved/rejected/paid/failed',
  `audit_reason` VARCHAR(255) DEFAULT NULL COMMENT '审核意见',
  `audited_at` DATETIME DEFAULT NULL COMMENT '审核时间',
  `paid_at` DATETIME DEFAULT NULL COMMENT '打款时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_rider_id` (`rider_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='提现申请表';

-- ============================================================
-- 13. 优惠券表
-- ============================================================
CREATE TABLE IF NOT EXISTS `coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '优惠券ID',
  `name` VARCHAR(100) NOT NULL COMMENT '优惠券名称',
  `type` VARCHAR(20) NOT NULL COMMENT '类型 discount/fixed/category',
  `amount` DECIMAL(10,2) NOT NULL COMMENT '面额/折扣',
  `threshold` DECIMAL(10,2) DEFAULT 0.00 COMMENT '使用门槛',
  `scope` VARCHAR(50) DEFAULT 'all' COMMENT '适用范围 all/express/canteen/supermarket',
  `total_count` INT DEFAULT 0 COMMENT '发放总量',
  `used_count` INT DEFAULT 0 COMMENT '已使用数量',
  `start_at` DATETIME DEFAULT NULL COMMENT '生效时间',
  `expire_at` DATETIME DEFAULT NULL COMMENT '过期时间',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/inactive/expired',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='优惠券表';

-- ============================================================
-- 14. 用户优惠券表
-- ============================================================
CREATE TABLE IF NOT EXISTS `user_coupons` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT 'ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '用户ID',
  `coupon_id` BIGINT UNSIGNED NOT NULL COMMENT '优惠券ID',
  `status` VARCHAR(20) DEFAULT 'unused' COMMENT '状态 unused/used/expired',
  `used_at` DATETIME DEFAULT NULL COMMENT '使用时间',
  `order_id` BIGINT DEFAULT NULL COMMENT '使用订单ID',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '领取时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_coupon_id` (`coupon_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='用户优惠券表';

-- ============================================================
-- 15. 公告表
-- ============================================================
CREATE TABLE IF NOT EXISTS `notices` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '公告ID',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `type` VARCHAR(20) DEFAULT 'normal' COMMENT '类型 normal/important/activity/system',
  `target` VARCHAR(20) DEFAULT 'all' COMMENT '目标人群 all/user/rider',
  `content` TEXT COMMENT '内容',
  `status` VARCHAR(20) DEFAULT 'published' COMMENT '状态 draft/published/offline',
  `admin_id` INT DEFAULT NULL COMMENT '发布管理员ID',
  `view_count` INT DEFAULT 0 COMMENT '浏览量',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_status` (`status`),
  KEY `idx_target` (`target`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='公告表';

-- ============================================================
-- 16. 校区表
-- ============================================================
CREATE TABLE IF NOT EXISTS `campuses` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '校区ID',
  `name` VARCHAR(100) NOT NULL COMMENT '校区名称',
  `address` VARCHAR(255) DEFAULT NULL COMMENT '地址',
  `latitude` DECIMAL(10,6) DEFAULT NULL COMMENT '纬度',
  `longitude` DECIMAL(10,6) DEFAULT NULL COMMENT '经度',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/inactive',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_name` (`name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='校区表';

-- ============================================================
-- 17. 投诉表
-- ============================================================
CREATE TABLE IF NOT EXISTS `complaints` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '投诉ID',
  `order_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '关联订单ID',
  `complainant_id` BIGINT UNSIGNED NOT NULL COMMENT '投诉人ID',
  `respondent_id` BIGINT UNSIGNED DEFAULT NULL COMMENT '被投诉人ID',
  `type` VARCHAR(30) DEFAULT NULL COMMENT '投诉类型',
  `content` VARCHAR(1000) NOT NULL COMMENT '投诉内容',
  `images` VARCHAR(500) DEFAULT NULL COMMENT '投诉图片(JSON数组)',
  `status` VARCHAR(20) DEFAULT 'pending' COMMENT '状态 pending/processing/resolved',
  `result` VARCHAR(1000) DEFAULT NULL COMMENT '处理结果',
  `punishment` VARCHAR(255) DEFAULT NULL COMMENT '处罚措施',
  `handler_id` INT DEFAULT NULL COMMENT '处理管理员ID',
  `handled_at` DATETIME DEFAULT NULL COMMENT '处理时间',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='投诉表';

-- ============================================================
-- 18. 消息表
-- ============================================================
CREATE TABLE IF NOT EXISTS `messages` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '消息ID',
  `user_id` BIGINT UNSIGNED NOT NULL COMMENT '接收用户ID',
  `type` VARCHAR(30) NOT NULL COMMENT '消息类型 order/system/activity',
  `title` VARCHAR(200) NOT NULL COMMENT '标题',
  `content` VARCHAR(1000) DEFAULT NULL COMMENT '内容',
  `ref_id` BIGINT DEFAULT NULL COMMENT '关联ID',
  `is_read` TINYINT DEFAULT 0 COMMENT '是否已读 0否 1是',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_is_read` (`is_read`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息表';

-- ============================================================
-- 19. 定价配置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `pricing_configs` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '配置ID',
  `type` VARCHAR(30) NOT NULL COMMENT '服务类型 express/canteen/supermarket/errand/other',
  `name` VARCHAR(50) NOT NULL COMMENT '名称',
  `base_price` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '基础价',
  `per_km` DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '每公里加价',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '说明',
  `status` VARCHAR(20) DEFAULT 'active' COMMENT '状态 active/inactive',
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_type` (`type`),
  KEY `idx_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='定价配置表';

-- ============================================================
-- 20. 系统设置表
-- ============================================================
CREATE TABLE IF NOT EXISTS `system_settings` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '设置ID',
  `setting_key` VARCHAR(50) NOT NULL COMMENT '设置键',
  `setting_value` VARCHAR(500) DEFAULT NULL COMMENT '设置值',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '说明',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_setting_key` (`setting_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='系统设置表';

-- ============================================================
-- 初始数据
-- ============================================================

-- 默认管理员账号 (密码: admin123, bcrypt加密)
INSERT INTO `admins` (`username`, `password`, `name`, `role`) VALUES
('admin', '$2a$10$10VpS95Q/5JgtnCqi.HpkOwAr3OwJcu1uqdfsPptc7UtNaMFnVYNy', '系统管理员', 'super_admin')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `role` = VALUES(`role`);

-- 测试学生信息
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

-- 默认校区
INSERT INTO `campuses` (`name`, `address`, `status`) VALUES
('主校区', '重庆市XX区XX路1号', 'active'),
('东校区', '重庆市XX区XX大道88号', 'active'),
('西校区', '重庆市XX区XX路99号', 'active')
ON DUPLICATE KEY UPDATE `address` = VALUES(`address`), `status` = VALUES(`status`);

-- 默认优惠券
INSERT INTO `coupons` (`name`, `type`, `amount`, `threshold`, `scope`, `total_count`, `start_at`, `expire_at`, `status`)
SELECT '新用户专享券', 'fixed', 5.00, 10.00, 'all', 1000, '2026-08-01 00:00:00', '2026-10-31 23:59:59', 'active'
WHERE NOT EXISTS (SELECT 1 FROM `coupons` WHERE `name` = '新用户专享券');

INSERT INTO `coupons` (`name`, `type`, `amount`, `threshold`, `scope`, `total_count`, `start_at`, `expire_at`, `status`)
SELECT '快递代取券', 'fixed', 2.00, 5.00, 'express', 500, '2026-09-01 00:00:00', '2026-09-30 23:59:59', 'active'
WHERE NOT EXISTS (SELECT 1 FROM `coupons` WHERE `name` = '快递代取券');

-- 默认公告
INSERT INTO `notices` (`title`, `type`, `target`, `content`, `status`, `admin_id`)
SELECT '欢迎使用校园跑腿', 'normal', 'all', '欢迎使用校园跑腿小程序！我们提供快递代取、食堂代购、商超代购等服务，让校园生活更便捷。', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `notices` WHERE `title` = '欢迎使用校园跑腿');

INSERT INTO `notices` (`title`, `type`, `target`, `content`, `status`, `admin_id`)
SELECT '新用户注册送5元优惠券', 'activity', 'user', '新用户注册即可获得5元无门槛优惠券，首单立减！', 'published', 1
WHERE NOT EXISTS (SELECT 1 FROM `notices` WHERE `title` = '新用户注册送5元优惠券');

-- 默认定价配置
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

-- 默认系统设置
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

-- ============================================================
-- 数据库初始化完成
-- ============================================================
