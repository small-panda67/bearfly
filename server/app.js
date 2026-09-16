// server/app.js - 校园跑腿后端服务入口
const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use('/uploads', express.static('uploads'));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/riders', require('./routes/riders'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api/finance', require('./routes/finance'));
app.use('/api/coupons', require('./routes/coupons'));
app.use('/api/notices', require('./routes/notices'));
app.use('/api/campus', require('./routes/campus'));
app.use('/api/pricing', require('./routes/pricing'));

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: '服务运行正常', timestamp: new Date().toISOString() });
});

// 404
app.use((req, res) => {
  res.status(404).json({ code: 404, message: '接口不存在' });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ code: 500, message: '服务器内部错误', error: err.message });
});

app.listen(PORT, () => {
  console.log(`校园跑腿后端服务已启动: http://localhost:${PORT}`);
});
