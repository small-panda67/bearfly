# 校园跑腿微信小程序

一款面向高校校园场景的跑腿服务微信小程序，支持快递代取、食堂代购、商超代购、代办事务、万能跑腿等服务。

## 项目结构

```
SooH/
├── User/                    # 微信小程序移动端（用户端 + 跑腿员端 + 移动端管理后台）
│   ├── app.js               # 小程序全局入口（请求封装、角色切换、登录态）
│   ├── app.json             # 全局配置（页面路由、tabBar、主题色）
│   ├── app.wxss             # 全局样式（设计规范、通用组件样式）
│   ├── project.config.json  # 微信开发者工具项目配置
│   └── pages/               # 15个页面（首页/登录/下单/订单/消息/个人中心/跑腿员端/移动端后台）
│
├── admin/                   # Web 端管理员后台（Vue 3 + Element Plus + Vite）
│   ├── package.json         # 项目依赖
│   ├── vite.config.js       # Vite 配置（端口5173，/api代理到后端）
│   ├── index.html           # 入口 HTML
│   ├── src/
│   │   ├── main.js          # 入口 JS（Element Plus + Pinia + Router）
│   │   ├── App.vue          # 根组件
│   │   ├── router/          # 路由配置（14个路由 + 登录守卫）
│   │   ├── stores/          # Pinia 状态管理
│   │   ├── utils/           # 工具函数（axios 封装）
│   │   ├── layout/          # 主布局（侧边栏 + 头部 + 内容区）
│   │   └── views/           # 14个页面组件
│   │       ├── Login.vue          # 登录页
│   │       ├── Dashboard.vue      # 数据看板（ECharts 图表）
│   │       ├── Orders.vue         # 订单管理
│   │       ├── Users.vue          # 用户管理
│   │       ├── Riders.vue         # 跑腿员管理
│   │       ├── RiderAudit.vue     # 入驻审核
│   │       ├── Finance.vue        # 财务管理
│   │       ├── Complaints.vue     # 投诉处理
│   │       ├── Pricing.vue        # 价格配置
│   │       ├── Campus.vue         # 校区管理
│   │       ├── Coupons.vue        # 优惠券管理
│   │       ├── Notices.vue        # 公告管理
│   │       └── System.vue         # 系统设置
│   └── backup-html/         # 旧版纯 HTML 后台（已备份）
│
├── server/                  # 后端服务（Node.js + Express + MySQL）
│   ├── package.json         # 项目依赖
│   ├── app.js               # 服务入口
│   ├── .env                 # 环境变量配置（已创建）
│   ├── config/db.js         # MySQL 数据库连接配置
│   ├── routes/              # 9个路由模块
│   ├── controllers/         # 5个控制器
│   └── middleware/auth.js   # JWT 认证中间件
│
└── database/                # 数据库脚本
    └── init.sql             # MySQL 数据库初始化脚本（17张表 + 初始数据）
```

## 技术栈

| 端 | 技术栈 |
|---|---|
| 微信小程序 | 微信小程序原生框架（WXML/WXSS/JS） |
| Web 管理后台 | Vue 3 + Vite 5 + Element Plus 2.4 + Pinia + Vue Router 4 + Axios + ECharts 5 |
| 后端服务 | Node.js + Express + MySQL2 + JWT + bcryptjs |
| 数据库 | MySQL 8.0（utf8mb4） |

## 三端主题色

| 端 | 主题色 | 色值 |
|---|---|---|
| 用户端 | 蓝色 | #4A90D9 |
| 跑腿员端 | 绿色 | #2BA471 |
| 管理员端 | 紫色 | #6C5CE7 |

## 快速开始

### 前置环境要求

- Node.js >= 16（已安装 v22.23.2）
- npm >= 8（已安装 10.9.8）
- MySQL 8.0（**需自行安装，见下方 MySQL 安装指引**）
- 微信开发者工具（用于运行小程序）

### 1. MySQL 安装与数据库初始化

#### Windows 下安装 MySQL 8.0

1. 下载 MySQL Installer：https://dev.mysql.com/downloads/installer/
2. 选择 "Developer Default" 安装类型，点击 Next
3. 等待依赖检查完成，点击 Execute 安装所需组件
4. 安装完成后进入配置向导：
   - Config Type: Development Computer
   - Port: 3306（默认）
   - Authentication Method: Use Strong Password Encryption
   - 设置 root 密码（建议设为 `123456`，与 `.env` 配置一致）
   - Windows Service: 勾选 "Start the MySQL Server at System Startup"
5. 完成安装后，验证 MySQL 服务是否启动

#### 初始化数据库

```bash
# 登录 MySQL（输入密码 123456）
mysql -u root -p

# 执行初始化脚本（注意路径使用正斜杠或双反斜杠）
source D:/Desktop/SooH/database/init.sql;

# 验证数据库和表
SHOW DATABASES;
USE campus_errand;
SHOW TABLES;

# 验证默认管理员
SELECT username, role FROM admins;
```

初始化脚本会自动创建：
- 数据库 `campus_errand`
- 17 张业务表
- 默认管理员账号 `admin` / `admin123`
- 3 个示例校区
- 2 张示例优惠券
- 2 条示例公告

### 2. 后端服务启动

```bash
cd D:\Desktop\SooH\server

# 依赖已安装，如需重新安装：
# npm install

# 启动服务
node app.js
# 或使用 nodemon 开发模式（需全局安装 nodemon）
# npm run dev
```

服务默认运行在 `http://localhost:3000`，API 前缀为 `/api`

**验证后端启动**：浏览器访问 `http://localhost:3000/api/health`，应返回 `{"code":0,"message":"ok"}`

### 3. Web 管理后台启动（Vue 3）

```bash
cd D:\Desktop\SooH\admin

# 依赖已安装，如需重新安装：
# npm install

# 启动开发服务器
npm run dev
```

启动后访问 `http://localhost:5173/`

- Vite 开发服务器会自动将 `/api` 请求代理到 `http://localhost:3000`
- 后端未启动时，页面会自动使用 Mock 数据展示
- 默认管理员账号：`admin` / `admin123`

**生产构建**：
```bash
npm run build
# 产物在 dist/ 目录，可部署到 Nginx 等静态服务器
```

### 4. 微信小程序

1. 打开微信开发者工具
2. 导入项目，目录选择 `D:\Desktop\SooH\User`
3. 填入你的小程序 AppID（或使用测试号）
4. 在 `project.config.json` 中修改 `appid` 字段
5. 编译运行

**小程序后端对接说明**：
- `app.js` 中已配置 `baseUrl: 'http://localhost:3000/api'`
- 登录页、订单列表页、个人中心页已对接真实后端 API
- 后端不可用时自动回退到 Mock 数据
- 微信开发者工具需在 "详情 → 本地设置" 中勾选 "不校验合法域名"

## 默认账号

| 端 | 账号 | 密码 |
|---|---|---|
| Web 管理后台 | admin | admin123 |
| 移动端管理后台 | admin | admin123 |
| 小程序测试验证码 | 任意手机号 | 123456 |

## 核心业务流程

### 用户下单流程
1. 用户选择服务类型（快递代取/食堂代购/商超代购/代办事务/万能跑腿）
2. 填写取货/送达信息、物品描述、备注
3. 系统实时预估价格（基础费 + 距离加价 + 重量加价 + 夜间加价 + 小费）
4. 选择支付方式，提交订单
5. 跑腿员在接单大厅抢单
6. 跑腿员取货 → 配送 → 送达
7. 用户确认收货，评价

### 跑腿员接单流程
1. 跑腿员入驻申请 → 管理员审核
2. 缴纳保证金，开通接单
3. 接单大厅查看可抢订单，手动抢单或开启自动接单
4. 确认取货（拍照凭证）→ 配送中 → 确认送达
5. 收入入账，申请提现

## 订单状态机

```
pending（待接单）
  → picked（已接单/待取货）
    → delivering（配送中）
      → completed（已完成）
  → cancelled（已取消）
```

## 数据库表清单

| 表名 | 说明 |
|---|---|
| users | 用户表 |
| admins | 管理员表 |
| riders | 跑腿员表 |
| rider_applications | 跑腿员入驻申请表 |
| addresses | 收货地址表 |
| orders | 订单表 |
| order_tracks | 订单轨迹表 |
| order_ratings | 订单评价表 |
| wallets | 钱包表 |
| wallet_records | 钱包流水表 |
| withdrawals | 提现申请表 |
| coupons | 优惠券表 |
| user_coupons | 用户优惠券表 |
| notices | 公告表 |
| campuses | 校区表 |
| complaints | 投诉表 |
| messages | 消息表 |

## 注意事项

1. **MySQL 未安装**：当前机器未安装 MySQL，需按上方指引安装后才能启动后端服务。Vue 管理后台和小程序在后端不可用时会自动使用 Mock 数据。
2. **小程序 AppID**：`project.config.json` 中的 `appid` 为模板默认值，需替换为自己的小程序 AppID。
3. **tabBar 图标**：`app.json` 中引用了 8 个图标文件（`images/tab-*.png`），需自行补充对应 PNG 图标，否则微信开发者工具会报图标缺失警告（不影响功能）。
4. **微信支付/地图 SDK**：当前为 Mock，正式上线需申请微信支付商户号和腾讯地图 SDK Key。
5. **管理员密码**：数据库初始化脚本中默认管理员密码为 bcrypt 加密后的 `admin123`，生产环境请务必修改。
6. **JWT 密钥**：`.env` 中的 `JWT_SECRET` 为默认值，生产环境请修改为随机字符串。

## 开发优先级排期

详见产品文档：`D:\Desktop\校园跑腿\校园跑腿小程序-产品原型框架与开发排期.docx`

- **V1.0（MVP）**：用户端核心下单流程 + 跑腿员接单配送 + 基础管理后台
- **V1.1**：消息推送、评价系统、优惠券、钱包、提现
- **V2.0**：智能调度、数据分析、多校区扩展、增值服务
