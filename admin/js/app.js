// admin/js/app.js - 管理后台公共脚本
// 侧边栏菜单配置
const menuConfig = [
  {
    group: '数据概览',
    items: [
      { icon: '📊', name: '数据看板', url: 'index.html', key: 'dashboard' }
    ]
  },
  {
    group: '运营管理',
    items: [
      { icon: '📦', name: '订单管理', url: 'orders.html', key: 'orders' },
      { icon: '👥', name: '用户管理', url: 'users.html', key: 'users' },
      { icon: '🏃', name: '跑腿员管理', url: 'riders.html', key: 'riders' },
      { icon: '💰', name: '财务管理', url: 'finance.html', key: 'finance' },
      { icon: '⚠️', name: '投诉处理', url: 'complaints.html', key: 'complaints' }
    ]
  },
  {
    group: '系统配置',
    items: [
      { icon: '💵', name: '价格配置', url: 'settings.html', key: 'pricing' },
      { icon: '🏫', name: '校区管理', url: 'campus.html', key: 'campus' },
      { icon: '🎫', name: '优惠券管理', url: 'coupons.html', key: 'coupons' },
      { icon: '📢', name: '公告管理', url: 'notices.html', key: 'notices' },
      { icon: '⚙️', name: '系统设置', url: 'system.html', key: 'system' }
    ]
  }
];

// 渲染侧边栏
function renderSidebar(activeKey) {
  let html = '<div class="sidebar-logo"><span class="logo-icon">🛵</span><span>校园跑腿后台</span></div>';
  html += '<div class="sidebar-menu">';
  menuConfig.forEach(group => {
    html += `<div class="menu-group-title">${group.group}</div>`;
    group.items.forEach(item => {
      const active = item.key === activeKey ? 'active' : '';
      html += `<a href="${item.url}" class="menu-item ${active}">
        <span class="menu-icon">${item.icon}</span>
        <span>${item.name}</span>
      </a>`;
    });
  });
  html += '</div>';
  document.getElementById('sidebar').innerHTML = html;
}

// 渲染头部
function renderHeader(title) {
  const html = `
    <div class="header-title">${title}</div>
    <div class="header-right">
      <div class="header-notify" onclick="showNotify()">
        🔔<span class="badge">5</span>
      </div>
      <div class="header-user" onclick="logout()">
        <div class="header-avatar">管</div>
        <span class="header-username">管理员</span>
      </div>
    </div>`;
  document.getElementById('header').innerHTML = html;
}

// 初始化页面
function initPage(activeKey, title) {
  // 检查登录状态
  const isLoggedIn = localStorage.getItem('adminLoggedIn');
  if (!isLoggedIn && !window.location.href.includes('login.html')) {
    window.location.href = 'login.html';
    return;
  }
  renderSidebar(activeKey);
  renderHeader(title);
}

// 登录
function doLogin(username, password) {
  if (username === 'admin' && password === 'admin123') {
    localStorage.setItem('adminLoggedIn', 'true');
    localStorage.setItem('adminUsername', username);
    return true;
  }
  return false;
}

// 退出登录
function logout() {
  if (confirm('确定退出登录？')) {
    localStorage.removeItem('adminLoggedIn');
    localStorage.removeItem('adminUsername');
    window.location.href = 'login.html';
  }
}

function showNotify() {
  alert('您有 5 条待处理通知');
}

// 模拟数据
const mockData = {
  users: [
    { id: 'U001', name: '张同学', phone: '138****8888', campus: '主校区', registerTime: '2026-08-01', orders: 23, status: '正常' },
    { id: 'U002', name: '李同学', phone: '139****6666', campus: '主校区', registerTime: '2026-08-05', orders: 15, status: '正常' },
    { id: 'U003', name: '王同学', phone: '137****5555', campus: '东校区', registerTime: '2026-08-10', orders: 8, status: '正常' },
    { id: 'U004', name: '赵同学', phone: '136****4444', campus: '主校区', registerTime: '2026-08-12', orders: 31, status: '正常' },
    { id: 'U005', name: '陈同学', phone: '135****3333', campus: '西校区', registerTime: '2026-08-15', orders: 2, status: '冻结' },
    { id: 'U006', name: '刘同学', phone: '134****2222', campus: '主校区', registerTime: '2026-08-18', orders: 19, status: '正常' },
    { id: 'U007', name: '周同学', phone: '133****1111', campus: '东校区', registerTime: '2026-08-20', orders: 7, status: '正常' },
    { id: 'U008', name: '吴同学', phone: '132****0000', campus: '主校区', registerTime: '2026-08-22', orders: 12, status: '正常' }
  ],
  riders: [
    { id: 'R001', name: '小明', phone: '138****1111', campus: '主校区', level: 3, rating: 4.9, orders: 328, income: '2,856.00', status: '在线' },
    { id: 'R002', name: '小红', phone: '139****2222', campus: '主校区', level: 2, rating: 4.8, orders: 156, income: '1,234.00', status: '在线' },
    { id: 'R003', name: '小刚', phone: '137****3333', campus: '东校区', level: 1, rating: 4.7, orders: 45, income: '380.00', status: '休息' },
    { id: 'R004', name: '小美', phone: '136****4444', campus: '主校区', level: 4, rating: 5.0, orders: 512, income: '4,520.00', status: '在线' },
    { id: 'R005', name: '小强', phone: '135****5555', campus: '西校区', level: 2, rating: 4.6, orders: 89, income: '720.00', status: '离线' },
    { id: 'R006', name: '小丽', phone: '134****6666', campus: '主校区', level: 3, rating: 4.9, orders: 267, income: '2,180.00', status: '在线' }
  ],
  orders: [
    { id: 'OD20260915001', type: '快递代取', user: '张同学', rider: '小明', amount: '4.00', status: '已完成', createTime: '2026-09-15 14:30', finishTime: '2026-09-15 14:55' },
    { id: 'OD20260915002', type: '食堂代购', user: '李同学', rider: '小红', amount: '8.00', status: '配送中', createTime: '2026-09-15 12:15', finishTime: '-' },
    { id: 'OD20260915003', type: '商超代购', user: '王同学', rider: '小美', amount: '12.00', status: '待取货', createTime: '2026-09-15 11:00', finishTime: '-' },
    { id: 'OD20260915004', type: '快递代取', user: '赵同学', rider: '小明', amount: '3.00', status: '已完成', createTime: '2026-09-15 10:20', finishTime: '2026-09-15 10:45' },
    { id: 'OD20260915005', type: '代办事务', user: '陈同学', rider: '-', amount: '15.00', status: '待接单', createTime: '2026-09-15 09:30', finishTime: '-' },
    { id: 'OD20260914001', type: '快递代取', user: '刘同学', rider: '小刚', amount: '5.00', status: '已取消', createTime: '2026-09-14 16:00', finishTime: '-' },
    { id: 'OD20260914002', type: '食堂代购', user: '周同学', rider: '小丽', amount: '6.00', status: '已完成', createTime: '2026-09-14 12:30', finishTime: '2026-09-14 13:00' }
  ]
};

// 状态标签映射
function getStatusTag(status) {
  const map = {
    '正常': 'green', '冻结': 'red',
    '在线': 'green', '休息': 'orange', '离线': 'gray',
    '待接单': 'orange', '待取货': 'blue', '配送中': 'purple',
    '已完成': 'green', '已取消': 'gray', '已退款': 'red'
  };
  return `<span class="tag ${map[status] || 'gray'}">${status}</span>`;
}
