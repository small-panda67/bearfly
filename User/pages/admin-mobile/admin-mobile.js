// pages/admin-mobile/admin-mobile.js
const app = getApp();

Page({
  data: {
    isLoggedIn: false,
    adminInfo: { name: '管理员', role: '管理员' },
    overview: { orders: 0, gmv: '0.00', newUsers: 0, activeRiders: 0 },
    todos: []
  },

  onLoad() {
    this.checkLogin();
  },

  onShow() {
    if (this.data.isLoggedIn) this.loadDashboard();
  },

  checkLogin() {
    const token = app.globalData.token || wx.getStorageSync('token');
    const role = app.globalData.role || wx.getStorageSync('role');
    const userInfo = app.globalData.userInfo || wx.getStorageSync('userInfo');

    if (token && role === 'admin') {
      this.setData({
        isLoggedIn: true,
        adminInfo: userInfo || { name: '管理员', role: '管理员' }
      });
      this.loadDashboard();
    } else {
      // 未登录或非管理员，跳转到登录页
      wx.redirectTo({ url: '/pages/login/login' });
    }
  },

  async loadDashboard() {
    try {
      const data = await app.request({
        url: '/admin/dashboard',
        method: 'GET'
      });
      if (!data) return;
      const todos = [];
      if (data.todos) {
        if (data.todos.riderAudit) todos.push({ id: 1, type: 'verify', icon: '✅', name: '实名认证审核', desc: '待审核跑腿员入驻', count: data.todos.riderAudit });
        if (data.todos.complaint) todos.push({ id: 2, type: 'complaint', icon: '⚠️', name: '投诉工单', desc: '待处理用户投诉', count: data.todos.complaint });
        if (data.todos.withdraw) todos.push({ id: 3, type: 'withdraw', icon: '💰', name: '提现审核', desc: '待审核跑腿员提现', count: data.todos.withdraw });
      }
      this.setData({
        overview: {
          orders: data.todayOrders || 0,
          gmv: Number(data.todayGmv || 0).toFixed(2),
          newUsers: data.newUsers || 0,
          activeRiders: data.activeRiders || 0
        },
        todos
      });
    } catch (err) {}
  },

  logout() {
    wx.showModal({
      title: '退出登录',
      content: '确定退出管理员后台？',
      success: (res) => {
        if (!res.confirm) return;
        // 清除全局登录态
        app.globalData.token = '';
        app.globalData.userInfo = null;
        app.globalData.role = 'user';
        wx.removeStorageSync('token');
        wx.removeStorageSync('userInfo');
        wx.removeStorageSync('role');
        wx.redirectTo({ url: '/pages/login/login' });
      }
    });
  },

  handleTodo(e) {
    const type = e.currentTarget.dataset.type;
    wx.showToast({ title: '待办处理开发中', icon: 'none' });
  },

  goModule(e) {
    const module = e.currentTarget.dataset.module;
    const moduleNames = {
      orders: '订单管理', users: '用户管理', riders: '骑手管理',
      finance: '财务管理', verify: '实名审核', complaint: '投诉处理',
      pricing: '价格配置', campus: '校区管理', coupon: '优惠券', notice: '公告发布'
    };
    wx.showToast({ title: moduleNames[module] + '开发中', icon: 'none' });
  }
});
