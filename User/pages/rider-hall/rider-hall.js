// pages/rider-hall/rider-hall.js
const app = getApp();

const typeIconMap = { express: '📦', canteen: '🍜', supermarket: '🛒', errand: '📋', other: '🚀' };
const typeNameMap = { express: '快递代取', canteen: '食堂代购', supermarket: '商超代购', errand: '代办事务', other: '万能跑腿' };

function timeAgo(createdAt) {
  if (!createdAt) return '';
  const t = new Date(String(createdAt).replace(' ', 'T')).getTime();
  const diff = Math.max(0, Date.now() - t);
  const min = Math.floor(diff / 60000);
  if (min < 1) return '刚刚';
  if (min < 60) return min + '分钟前';
  return Math.floor(min / 60) + '小时前';
}

Page({
  data: {
    isOnline: false,
    todayStats: { orders: 0, income: '0.00', rating: '100%' },
    orders: []
  },

  onLoad() {
    this.loadProfile();
    this.loadHall();
  },

  onShow() {
    this.loadHall();
    this.loadIncome();
  },

  async loadProfile() {
    try {
      const profile = await app.request({ url: '/riders/profile', method: 'GET' });
      if (profile) {
        this.setData({
          isOnline: !!profile.is_online,
          'todayStats.rating': profile.rating ? profile.rating + '%' : '100%'
        });
      }
    } catch (err) {}
  },

  async loadIncome() {
    try {
      const income = await app.request({ url: '/riders/income', method: 'GET' });
      if (income) {
        this.setData({ 'todayStats.income': Number(income.todayIncome || 0).toFixed(2) });
      }
    } catch (err) {}
  },

  async loadHall() {
    try {
      const campus = app.globalData.campus ? app.globalData.campus.name : '';
      const data = await app.request({
        url: '/riders/hall',
        method: 'GET',
        data: { campus, page: 1, pageSize: 50 }
      });
      const orders = (data.list || []).map(o => ({
        id: o.id,
        icon: typeIconMap[o.type] || '📦',
        typeName: typeNameMap[o.type] || o.type,
        price: o.amount,
        pickup: o.pickup_address || '',
        delivery: o.delivery_address || '',
        distance: 0,
        timeLimit: '30分钟内',
        size: o.item_size || '常规',
        tip: Number(o.tip || 0),
        publishTime: timeAgo(o.created_at)
      }));
      this.setData({ orders });
    } catch (err) {
      this.setData({ orders: [] });
    }
  },

  async toggleOnline() {
    const next = this.data.isOnline ? 0 : 1;
    try {
      const res = await app.request({
        url: '/riders/online',
        method: 'PUT',
        data: { is_online: next }
      });
      const isOnline = (res && (res.is_online === 1 || res.is_online === '1')) || next === 1;
      this.setData({ isOnline });
      wx.showToast({
        title: next ? '已开始接单' : '已暂停接单',
        icon: 'success'
      });
    } catch (err) {}
  },

  openFilter() {
    wx.showActionSheet({
      itemList: ['全部类型', '仅快递代取', '仅食堂代购', '仅商超代购'],
      success: async (res) => {
        const typeMap = ['', 'express', 'canteen', 'supermarket'];
        const type = typeMap[res.tapIndex];
        try {
          const campus = app.globalData.campus ? app.globalData.campus.name : '';
          const data = await app.request({
            url: '/riders/hall',
            method: 'GET',
            data: { campus, type, page: 1, pageSize: 50 }
          });
          const orders = (data.list || []).map(o => ({
            id: o.id,
            icon: typeIconMap[o.type] || '📦',
            typeName: typeNameMap[o.type] || o.type,
            price: o.amount,
            pickup: o.pickup_address || '',
            delivery: o.delivery_address || '',
            distance: 0,
            timeLimit: '30分钟内',
            size: o.item_size || '常规',
            tip: Number(o.tip || 0),
            publishTime: timeAgo(o.created_at)
          }));
          this.setData({ orders });
        } catch (err) {}
      }
    });
  },

  openAutoAccept() {
    wx.showModal({
      title: '自动接单',
      content: '开启后系统将根据您的设置自动接匹配订单。是否开启？',
      success: (res) => {
        if (res.confirm) {
          wx.showToast({ title: '自动接单已开启', icon: 'success' });
        }
      }
    });
  },

  grabOrder(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '确认抢单',
      content: '确认抢该订单？抢单成功后请尽快前往取货。',
      confirmText: '确认抢单',
      success: async (res) => {
        if (!res.confirm) return;
        wx.showLoading({ title: '抢单中...' });
        try {
          await app.request({ url: '/riders/grab/' + id, method: 'POST' });
          wx.hideLoading();
          wx.showToast({ title: '抢单成功', icon: 'success' });
          this.loadHall();
        } catch (err) {
          wx.hideLoading();
        }
      }
    });
  }
});
