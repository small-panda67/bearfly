// pages/index/index.js
const app = getApp();

const serviceMeta = {
  express: { name: '快递代取', icon: '📦', bg: '#E8F2FD', desc: '校内各快递点代取代送' },
  canteen: { name: '食堂代购', icon: '🍜', bg: '#FFF4E5', desc: '各食堂窗口美食代购' },
  supermarket: { name: '商超代购', icon: '🛒', bg: '#E6F7EC', desc: '超市商品清单代购' },
  errand: { name: '代办事务', icon: '📋', bg: '#F3E8FD', desc: '代办各类校园事务' },
  other: { name: '万能跑腿', icon: '⚡', bg: '#FDECEC', desc: '个性化跑腿需求' }
};

Page({
  data: {
    campusName: '',
    campuses: [],
    role: 'user',
    banners: [
      { id: 1, title: '新用户首单立减5元', desc: '校园跑腿，省时省力', bg: 'linear-gradient(135deg, #4A90D9, #6BB1F0)' },
      { id: 2, title: '快递代取 2元起', desc: '校内极速配送', bg: 'linear-gradient(135deg, #2BA471, #4ECB8E)' },
      { id: 3, title: '招募校园跑腿员', desc: '课余时间轻松赚钱', bg: 'linear-gradient(135deg, #E89B3C, #F5B96A)' }
    ],
    services: [
      { id: 'express', name: '快递代取', icon: '📦', bg: '#E8F2FD' },
      { id: 'canteen', name: '食堂代购', icon: '🍜', bg: '#FFF4E5' },
      { id: 'market', name: '商超代购', icon: '🛒', bg: '#E6F7EC' },
      { id: 'errand', name: '代办事务', icon: '📋', bg: '#F3E8FD' },
      { id: 'custom', name: '万能跑腿', icon: '⚡', bg: '#FDECEC' }
    ],
    notices: [],
    hotRiders: [],
    hotServices: []
  },

  onLoad() {
    this.setData({
      campusName: app.globalData.campus ? app.globalData.campus.name : '',
      role: app.globalData.role
    });
    this.loadCampuses();
    this.loadNotices();
    this.loadHotServices();
  },

  onShow() {
    this.setData({ role: app.globalData.role });
  },

  // 校区列表
  async loadCampuses() {
    try {
      const campuses = await app.request({ url: '/campus', method: 'GET' });
      if (Array.isArray(campuses) && campuses.length) {
        this.setData({ campuses });
        if (!app.globalData.campus || !app.globalData.campus.name) {
          app.globalData.campus = campuses[0];
          this.setData({ campusName: campuses[0].name });
        }
      }
    } catch (err) {
      // 请求失败时 app.request 已提示
    }
  },

  // 公告
  async loadNotices() {
    try {
      const list = await app.request({ url: '/notices', method: 'GET' });
      const notices = (Array.isArray(list) ? list : []).map(n => ({
        id: n.id,
        content: n.content || n.title || ''
      })).filter(n => n.content);
      this.setData({ notices });
    } catch (err) {
      this.setData({ notices: [] });
    }
  },

  // 热门服务（定价配置）
  async loadHotServices() {
    try {
      const pricing = await app.request({ url: '/pricing', method: 'GET' });
      const list = (Array.isArray(pricing) ? pricing : []).slice(0, 3).map(p => {
        const meta = serviceMeta[p.type] || serviceMeta.other;
        return {
          id: p.type,
          name: p.name || meta.name,
          desc: p.description || meta.desc,
          icon: meta.icon,
          bg: meta.bg,
          price: p.base_price
        };
      });
      this.setData({ hotServices: list });
    } catch (err) {
      this.setData({ hotServices: [] });
    }
  },

  switchCampus() {
    const campuses = this.data.campuses;
    if (!campuses.length) {
      wx.showToast({ title: '校区列表加载中', icon: 'none' });
      return;
    }
    wx.showActionSheet({
      itemList: campuses.map(c => c.name),
      success: (res) => {
        const selected = campuses[res.tapIndex];
        app.globalData.campus = { id: selected.id, name: selected.name };
        this.setData({ campusName: selected.name });
      }
    });
  },

  goSearch() {
    wx.showToast({ title: '搜索功能开发中', icon: 'none' });
  },

  goService(e) {
    const id = e.currentTarget.dataset.id;
    const routeMap = {
      express: '/pages/order-express/order-express',
      canteen: '/pages/order-canteen/order-canteen'
    };
    if (routeMap[id]) {
      wx.navigateTo({ url: routeMap[id] });
    } else {
      wx.showToast({ title: '该服务即将上线', icon: 'none' });
    }
  },

  goRiderList() {
    wx.showToast({ title: '跑腿员列表开发中', icon: 'none' });
  },

  switchToUser() {
    app.switchRole('user');
    this.setData({ role: 'user' });
    wx.showToast({ title: '已切换到用户模式', icon: 'success' });
  }
});
